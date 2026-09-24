ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_clearance_sale boolean NOT NULL DEFAULT false;
