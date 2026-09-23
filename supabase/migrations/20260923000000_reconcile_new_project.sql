-- Reconciles a project whose base tables already exist but whose app functions,
-- content seed, and Storage rules have not yet been deployed.

-- The reservation and order functions below depend on the catalog table. Keep
-- this base definition here as well as the dedicated Products section migration
-- so a fresh project can apply the reconciliation migration in order.
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  price integer NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price integer,
  images text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  fabric text NOT NULL DEFAULT '',
  fit text NOT NULL DEFAULT '',
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  is_new boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

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
    IF _stock IS NULL THEN RAISE EXCEPTION 'Product is no longer available'; END IF;

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

REVOKE ALL ON FUNCTION public.reserve_stock(uuid, jsonb, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_reservation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_reservation(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.restore_order_stock(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_stock_reservations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_stock(uuid, jsonb, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_reservation(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_reservation(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_order_stock(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_stock_reservations() TO service_role;

INSERT INTO public.site_content (section_key, content, is_published) VALUES
('hero', '{"intervalSeconds":6,"slides":[{"eyebrow":"Campaign 01 / Chennai","title":"BUILT FOR THE STREETS.","accent":"NOT THE CROWD.","description":"Heavy silhouettes, stripped back and released in limited numbers.","image":"/editorial/mold-look-3.jpg","imageAlt":"MOLD campaign image","primaryLabel":"Shop Drop 07","primaryHref":"/shop?sort=newest","secondaryLabel":"View editorial","secondaryHref":"/lookbook"}]}'::jsonb, true),
('lookbook', '{"eyebrow":"Editorial 001","title":"CONCRETE / HEAT / MOTION","season":"Chennai — 2026","intro":"A study in weight, movement and the city after rain.","storyTitle":"THE CITY SETS THE SILHOUETTE","storyBody":"Built in Chennai and cut to move through it.","ctaLabel":"Explore the full story","images":[{"url":"/editorial/mold-look-3.jpg","alt":"MOLD utility set in motion","caption":"Look 01 — Utility in motion","orientation":"landscape"},{"url":"/editorial/mold-look-2.jpg","alt":"Close detail of washed fabric","caption":"Detail 01 — Built to age","orientation":"landscape"}]}'::jsonb, true),
('instagram', '{"eyebrow":"Live archive","title":"WORN OUTSIDE","handle":"@MOLDYOURSTYLE","profileUrl":"https://instagram.com/moldyourstyle","posts":[{"image":"/editorial/mold-look-2.jpg","alt":"MOLD garment hardware detail","caption":"Details that wear in","url":"https://instagram.com/moldyourstyle"},{"image":"/editorial/mold-look-3.jpg","alt":"MOLD utility set walking through the city","caption":"Utility in motion","url":"https://instagram.com/moldyourstyle"}]}'::jsonb, true)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins can upload product media" ON storage.objects;
CREATE POLICY "Admins can upload product media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update product media" ON storage.objects;
CREATE POLICY "Admins can update product media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete product media" ON storage.objects;
CREATE POLICY "Admins can delete product media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
