import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createProduct, getAdminProduct, updateProduct } from "@/lib/admin.functions";
import { uploadProductImage } from "@/lib/upload";
import type { Product } from "@/data/products";

export const Route = createFileRoute("/_authenticated/admin/product/$id")({
  head: () => ({
    meta: [
      { title: "Edit product — MOLD Admin" },
      { name: "description", content: "Edit product in MOLD admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductFormPage,
});

type FormState = {
  slug: string;
  name: string;
  category: "jackets" | "t-shirts" | "shirts" | "pants";
  price: number;
  compareAtPrice: number | undefined;
  images: string[];
  sizes: string[];
  description: string;
  fabric: string;
  fit: string;
  stock: number;
  sku: string;
  tags: string[];
  isNew: boolean;
  isClearanceSale: boolean;
  isPublished: boolean;
};


const empty: FormState = {
  slug: "",
  name: "",
  category: "t-shirts",
  price: 0,
  compareAtPrice: undefined as number | undefined,
  images: [],
  sizes: [],
  description: "",
  fabric: "",
  fit: "",
  stock: 0,
  sku: "",
  tags: [],
  isNew: false,
  isClearanceSale: false,
  isPublished: true,
};


function ProductFormPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const fetchProduct = useServerFn(getAdminProduct);
  const { data: existing } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => fetchProduct({ data: id }),
    enabled: !isNew,
  });

  const [form, setForm] = useState<FormState>(empty);
  const [imageInput, setImageInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadProductImage(file));
      }
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...urls.filter((u) => !prev.images.includes(u))],
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (existing) {
      setForm({
        slug: existing.slug,
        name: existing.name,
        category: existing.category,
        price: existing.price,
        compareAtPrice: existing.compareAtPrice,
        images: existing.images,
        sizes: existing.sizes,
        description: existing.description,
        fabric: existing.fabric,
        fit: existing.fit,
        stock: existing.stock,
        sku: existing.sku,
        tags: existing.tags,
        isNew: existing.isNew ?? false,
        isClearanceSale: existing.isClearanceSale ?? false,
        isPublished: existing.isPublished,
      });
    }
  }, [existing]);

  const doCreate = useServerFn(createProduct);
  const doUpdate = useServerFn(updateProduct);
  const save = useMutation({
    mutationFn: async (values: FormState) => {
      if (isNew) {
        return doCreate({ data: values });
      }
      return doUpdate({ data: { id, values } });
    },

    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setMessage(isNew ? "Product created." : "Product updated.");
      if (isNew) navigate({ to: "/admin/products" });
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : "Failed to save."),
  });

  function addItem(list: string[], value: string, setter: (next: string[]) => void) {
    const v = value.trim();
    if (!v || list.includes(v)) return;
    setter([...list, v]);
  }

  function removeItem(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.filter((x) => x !== value));
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    save.mutate(form);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex justify-end">
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="label-mono border border-line px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-muted-ink transition-colors hover:border-ink hover:bg-muted hover:text-ink"
        >
          ← Back to Admin
        </button>
      </div>
      <h1 className="display mt-6 text-3xl">{isNew ? "Add product" : "Edit product"}</h1>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="label-mono text-muted-ink">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((current) => ({
                  ...current,
                  name,
                  ...(isNew ? { slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") } : {}),
                }));
              }}
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="label-mono text-muted-ink">Slug</span>
            <input
              required
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <label className="block">
            <span className="label-mono text-muted-ink">Category</span>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as FormState["category"])}
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            >
              <option value="jackets">Jackets</option>
              <option value="t-shirts">T-shirts</option>
              <option value="shirts">Shirts</option>
              <option value="pants">Pants</option>
            </select>
          </label>
          <label className="block">
            <span className="label-mono text-muted-ink">Price (₹)</span>
            <input
              required
              type="number"
              min={0}
              value={form.price || ""}
              onChange={(e) => update("price", Number(e.target.value))}
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="label-mono text-muted-ink">Compare-at price (original price)</span>
            <input
              type="number"
              min={0}
              value={form.compareAtPrice ?? ""}
              onChange={(e) =>
                update("compareAtPrice", e.target.value ? Number(e.target.value) : undefined)
              }
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
        </div>

        <label className="block">
          <span className="label-mono text-muted-ink">Description</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
          />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="label-mono text-muted-ink">Fabric</span>
            <input
              value={form.fabric}
              onChange={(e) => update("fabric", e.target.value)}
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="label-mono text-muted-ink">Fit</span>
            <input
              value={form.fit}
              onChange={(e) => update("fit", e.target.value)}
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="label-mono text-muted-ink">Stock</span>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => update("stock", Number(e.target.value))}
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="label-mono text-muted-ink">SKU</span>
            <input
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
          </label>
        </div>

        <div className="space-y-3">
          <span className="label-mono text-muted-ink">Product images</span>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            className={`border border-dashed p-6 text-center transition-colors ${
              dragging ? "border-accent bg-muted" : "border-line"
            }`}
          >
            <p className="text-sm text-muted-ink">
              Drag photos here, or choose them from your computer.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="hidden"
              onChange={(e) => {
                void handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="mt-4 border border-line px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-muted disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Choose files"}
            </button>
            <p className="label-mono mt-3 text-muted-ink">JPG, PNG, WebP or AVIF · up to 10 MB</p>
          </div>

          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

          {form.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {form.images.map((img, index) => (
                <div key={img} className="group relative aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={img}
                    alt={`${form.name || "Product"} image ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {index === 0 && (
                    <span className="label-mono absolute left-1 top-1 bg-ink px-1.5 py-0.5 text-paper">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => removeItem(form.images, img, (next) => update("images", next))}
                    className="absolute right-1 top-1 bg-ink px-2 py-0.5 text-xs text-paper"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <details className="text-sm">
            <summary className="label-mono cursor-pointer text-muted-ink">
              Or paste an image link
            </summary>
            <div className="mt-3 flex gap-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
              />
              <button
                type="button"
                onClick={() => {
                  addItem(form.images, imageInput, (next) => update("images", next));
                  setImageInput("");
                }}
                className="border border-line px-4 py-3 text-sm hover:bg-muted"
              >
                Add
              </button>
            </div>
          </details>
        </div>

        <div className="space-y-2">
          <span className="label-mono text-muted-ink">Sizes</span>
          <div className="flex flex-wrap gap-2">
            {["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((size) => {
              const selected = form.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    const next = selected
                      ? form.sizes.filter((current) => current !== size)
                      : [...form.sizes, size];
                    update("sizes", next);
                  }}
                  className={`min-w-12 border px-4 py-3 text-sm transition-colors ${
                    selected ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="label-mono text-muted-ink">Tags</span>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="new, limited..."
              className="flex-1 border border-line bg-transparent px-3 py-3 text-sm outline-none focus:border-ink"
            />
            <button
              type="button"
              onClick={() => {
                addItem(form.tags, tagInput, (next) => update("tags", next));
                setTagInput("");
              }}
              className="border border-line px-4 py-3 text-sm hover:bg-muted"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-2 rounded bg-muted px-2 py-1 text-xs"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeItem(form.tags, t, (next) => update("tags", next))}
                  className="text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isNew}
              onChange={(e) => update("isNew", e.target.checked)}
            />
            <span className="label-mono text-muted-ink">New Drop</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isClearanceSale}
              onChange={(e) => update("isClearanceSale", e.target.checked)}
            />
            <span className="label-mono text-muted-ink">Clearance Sale</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => update("isPublished", e.target.checked)}
            />
            <span className="label-mono text-muted-ink">Published</span>
          </label>
        </div>

        {message && <p className="text-sm text-accent">{message}</p>}

        <div className="flex gap-3 pt-4">
          <button
            disabled={save.isPending}
            type="submit"
            className="bg-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/admin" })}
            className="border border-line px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
