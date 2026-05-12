CREATE TABLE public.online_orders (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  type TEXT NOT NULL CHECK (type IN ('Delivery', 'Pickup', 'Dine-in')),
  notes TEXT,
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX online_orders_created_at_idx ON public.online_orders (created_at DESC);
CREATE INDEX online_orders_status_idx ON public.online_orders (status);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER online_orders_set_updated_at
BEFORE UPDATE ON public.online_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Customers can place online orders"
ON public.online_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'New');

CREATE POLICY "Backend can manage online orders"
ON public.online_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);