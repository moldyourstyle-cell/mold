CREATE TABLE public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL DEFAULT '',
  qty integer NOT NULL CHECK (qty > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','consumed','released')),
  expires_at timestamptz NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_reservations_token_idx ON public.stock_reservations (token);
CREATE INDEX stock_reservations_active_idx ON public.stock_reservations (product_id) WHERE status = 'active';

GRANT ALL ON public.stock_reservations TO service_role;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read stock reservations" ON public.stock_reservations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_restored boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.expire_stock_reservations()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.stock_reservations SET status = 'released'
  WHERE status = 'active' AND expires_at < now();
$$;

CREATE OR REPLACE FUNCTION public.reserve_stock(_token uuid, _items jsonb, _ttl_seconds integer DEFAULT 900)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  item jsonb;
  _pid uuid;
  _qty integer;
  _size text;
  _stock integer;
  _reserved integer;
  _name text;
  _expires timestamptz := now() + make_interval(secs => greatest(_ttl_seconds, 60));
BEGIN
  PERFORM public.expire_stock_reservations();
  UPDATE public.stock_reservations SET status = 'released'
   WHERE token = _token AND status = 'active';

  FOR item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _pid := (item->>'product_id')::uuid;
    _qty := (item->>'qty')::int;
    _size := coalesce(item->>'size', '');

    SELECT stock, name INTO _stock, _name FROM public.products WHERE id = _pid FOR UPDATE;
    IF _stock IS NULL THEN
      RAISE EXCEPTION 'Product is no longer available';
    END IF;

    SELECT coalesce(sum(qty), 0) INTO _reserved FROM public.stock_reservations
     WHERE product_id = _pid AND status = 'active' AND expires_at > now();

    IF _qty > (_stock - _reserved) THEN
      RAISE EXCEPTION 'Only % left of %', greatest(_stock - _reserved, 0), _name;
    END IF;

    INSERT INTO public.stock_reservations (token, product_id, size, qty, expires_at)
    VALUES (_token, _pid, _size, _qty, _expires);
  END LOOP;

  RETURN _expires;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_reservation(_token uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.stock_reservations SET status = 'released'
  WHERE token = _token AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.consume_reservation(_token uuid, _order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM public.stock_reservations
            WHERE token = _token AND status = 'active' FOR UPDATE LOOP
    UPDATE public.products SET stock = greatest(stock - r.qty, 0) WHERE id = r.product_id;
    UPDATE public.stock_reservations SET status = 'consumed', order_id = _order_id WHERE id = r.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_order_stock(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _done boolean;
BEGIN
  SELECT stock_restored INTO _done FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF _done IS NULL OR _done THEN RETURN; END IF;

  UPDATE public.products p SET stock = p.stock + i.qty
    FROM public.order_items i
   WHERE i.order_id = _order_id AND i.product_id = p.id;

  UPDATE public.orders SET stock_restored = true WHERE id = _order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.available_stock()
RETURNS TABLE (product_id uuid, reserved integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT product_id, sum(qty)::int
  FROM public.stock_reservations
  WHERE status = 'active' AND expires_at > now()
  GROUP BY product_id;
$$;

GRANT EXECUTE ON FUNCTION public.available_stock() TO anon, authenticated, service_role;