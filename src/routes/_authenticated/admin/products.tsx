import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AdminPageShell } from "@/components/AdminOperationsNav";
import { deleteProduct, listAdminProducts } from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: ProductsPage });

function ProductsPage() {
  const queryClient = useQueryClient();
  const fetchProducts = useServerFn(listAdminProducts);
  const removeProduct = useServerFn(deleteProduct);
  const [search, setSearch] = useState("");
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts({ data: undefined }),
  });
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => !query || `${product.name} ${product.slug} ${product.sku} ${product.category}`.toLowerCase().includes(query));
  }, [products, search]);
  const remove = useMutation({
    mutationFn: (id: string) => removeProduct({ data: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-management-data"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });

  return (
    <AdminPageShell title="Products">
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <label className="label-mono w-full max-w-sm text-muted-ink">Search catalog
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, slug, SKU or category" className="mt-1 block w-full border border-line bg-transparent px-3 py-2.5 text-sm text-ink" />
        </label>
        <Link to="/admin/product/$id" params={{ id: "new" }} search={{}} className="bg-ink px-5 py-3 label-mono text-paper transition-colors hover:bg-accent hover:text-ink">+ Add product</Link>
      </div>
      {isLoading ? <p className="mt-8 label-mono text-muted-ink">Loading products…</p> : error ? <p className="mt-8 text-sm text-red-600">{error.message}</p> : (
        <div className="mt-6 overflow-x-auto border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50"><tr>{["Product", "Category", "Price", "Stock", "Status", "Actions"].map((label) => <th key={label} className="px-3 py-3 label-mono text-muted-ink">{label}</th>)}</tr></thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id} className="border-t border-line">
                  <td className="px-3 py-3"><div className="flex items-center gap-3">{product.images[0] ? <img src={product.images[0]} alt={`${product.name} cover`} width={48} height={60} loading="lazy" className="h-14 w-11 shrink-0 rounded-sm border border-line object-cover" /> : <div aria-label="No cover image" className="h-14 w-11 shrink-0 rounded-sm border border-dashed border-line bg-muted" />}<div><p className="font-medium">{product.name}</p><p className="label-mono text-muted-ink">{product.sku || product.slug}</p></div></div></td>
                  <td className="px-3 py-3 capitalize">{product.category}</td><td className="px-3 py-3">{formatINR(product.price)}</td><td className="px-3 py-3">{product.stock}</td>
                  <td className="px-3 py-3">{product.isPublished ? <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] uppercase tracking-wider text-green-800">Live</span> : <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-wider text-muted-ink">Draft</span>}</td>
                  <td className="px-3 py-3"><div className="flex gap-3"><Link to="/admin/product/$id" params={{ id: product.id }} className="label-mono text-accent hover:underline">Edit</Link><button onClick={() => remove.mutate(product.id)} disabled={remove.isPending} className="label-mono text-red-600 hover:underline disabled:opacity-50">Delete</button></div></td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-ink">{products.length ? "No products match your search." : "No products yet. Add your first one above."}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageShell>
  );
}
