-- Ensure store settings exist for admin configuration and checkout calculations.
CREATE TABLE IF NOT EXISTS public.store_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  store_name text NOT NULL DEFAULT 'MOLD',
  store_email text NOT NULL DEFAULT 'moldyourstyle@gmail.com',
  store_phone text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'INR',
  shipping_fee integer NOT NULL DEFAULT 99 CHECK (shipping_fee >= 0),
  free_shipping_threshold integer NOT NULL DEFAULT 1999 CHECK (free_shipping_threshold >= 0),
  cod_fee integer NOT NULL DEFAULT 49 CHECK (cod_fee >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  notification_preferences jsonb NOT NULL DEFAULT '{"newOrders":true,"lowStock":true}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

DROP POLICY IF EXISTS "Admins manage store settings" ON public.store_settings;
CREATE POLICY "Admins manage store settings" ON public.store_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

NOTIFY pgrst, 'reload schema';
