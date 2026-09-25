import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AdminPageShell } from "@/components/AdminOperationsNav";
import { getAdminManagementData, getStoreSettings } from "@/lib/admin-operations.functions";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/inventory")({ component: InventoryPage });

function InventoryPage() {
  const load = useServerFn(getAdminManagementData);
  const loadSettings = useServerFn(getStoreSettings);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-management-data"], queryFn: () => load({ data: undefined }) });
  const { data: settings } = useQuery({ queryKey: ["admin-store-settings"], queryFn: () => loadSettings({ data: undefined }) });
  const [category, setCategory] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [size, setSize] = useState("all");
  const threshold = settings?.low_stock_threshold ?? 5;

  const rows = useMemo(() => {
    if (!data) return [];
    const sold = new Map<string, number>();
    for (const order of data.orders) {
      if (["cancelled", "returned"].includes(order.status)) continue;
      for (const item of order.order_items) if (item.product_id) sold.set(item.product_id, (sold.get(item.product_id) ?? 0) + item.qty);
    }
    const held = new Map<string, number>();
    for (const reservation of data.reservations) held.set(reservation.product_id, (held.get(reservation.product_id) ?? 0) + reservation.qty);
    return data.products.map((product) => {
      const available = Math.max(0, product.stock - (held.get(product.id) ?? 0));
      return { product, available, sold: sold.get(product.id) ?? 0, status: available === 0 ? "Out of Stock" : available <= threshold ? "Low Stock" : "In Stock" };
    });
  }, [data, threshold]);

  const lowStock = rows.filter((row) => row.status !== "In Stock");
  const filtered = rows.filter(({ product, status }) =>
    (category === "all" || product.category === category) &&
    (stockStatus === "all" || status === stockStatus) &&
    (size === "all" || product.sizes.some((productSize) => productSize.toUpperCase() === size)) &&
    (!productSearch || `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.toLowerCase()))
  );
  const standardSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  return (
    <AdminPageShell title="Inventory">
      <div className="mt-6 space-y-6">
        <section className="border border-accent/40 bg-accent/5 p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><span className="label-mono text-accent">Restock watch</span><h2 className="display mt-1 text-2xl">{lowStock.length} products need attention</h2></div><p className="label-mono text-muted-ink">Low stock threshold: {threshold} units</p></div>
          {lowStock.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{lowStock.slice(0, 8).map(({ product, available, status }) => <span key={product.id} className="border border-line bg-paper px-3 py-2 text-xs">{product.name} · {available} left · {status}</span>)}</div>}
        </section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="label-mono text-muted-ink">Search product<input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Name or SKU" className="mt-1 block w-full border border-line bg-transparent px-3 py-2.5 text-sm text-ink" /></label>
          <Filter label="Category" value={category} onChange={setCategory} options={["all", ...new Set(data?.products.map((p) => p.category) ?? [])]} />
          <Filter label="Stock status" value={stockStatus} onChange={setStockStatus} options={["all", "In Stock", "Low Stock", "Out of Stock"]} />
          <Filter label="Size" value={size} onChange={setSize} options={["all", ...standardSizes]} />
        </div>
        {isLoading ? <p className="label-mono text-muted-ink">Loading inventory…</p> : error ? <p className="text-sm text-red-600">{error.message}</p> : (
          <div className="overflow-x-auto border border-line"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-muted/50"><tr>{["Product", "SKU", "Category", "Size", "Available stock", "Sold quantity", "Stock status", "Updated"].map((heading) => <th key={heading} className="px-3 py-3 label-mono text-muted-ink">{heading}</th>)}</tr></thead><tbody>
            {filtered.map(({ product, available, sold, status }) => <tr key={product.id} className="border-t border-line"><td className="px-3 py-3"><div className="flex items-center gap-3">{product.images[0] && <img src={product.images[0]} alt="" className="h-12 w-10 object-cover" />}<div><p className="font-medium">{product.name}</p><p className="label-mono text-muted-ink">{formatINR(product.price)}</p></div></div></td><td className="px-3 py-3">{product.sku || "—"}</td><td className="px-3 py-3 capitalize">{product.category}</td><td className="px-3 py-3">{product.sizes.join(", ") || "—"}</td><td className="px-3 py-3 font-semibold">{available}</td><td className="px-3 py-3">{sold}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wider ${status === "In Stock" ? "bg-green-100 text-green-800" : status === "Low Stock" ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-800"}`}>{status}</span></td><td className="px-3 py-3">{new Date(product.updated_at).toLocaleDateString("en-IN")}</td></tr>)}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-ink">No products match these filters.</td></tr>}
          </tbody></table></div>
        )}
        <p className="text-xs text-muted-ink">Stock is tracked per product in the current catalog. Sizes are listed as variants; per-size stock is not stored separately.</p>
      </div>
    </AdminPageShell>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="label-mono text-muted-ink">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full border border-line bg-paper px-3 py-2.5 text-sm capitalize text-ink">{options.map((option) => <option key={option} value={option}>{option === "all" ? "All" : option}</option>)}</select></label>;
}
