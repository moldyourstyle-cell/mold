import type { ReactNode } from "react";

const sections = [
  ["Dashboard", "/admin"],
  ["Products", "/admin/products"],
  ["Orders", "/admin/orders"],
  ["Customers", "/admin/customers"],
  ["Analytics", "/admin/analytics"],
  ["Inventory", "/admin/inventory"],
  ["Site content", "/admin/content"],
  ["Coupons", "/admin/coupons"],
  ["Settings", "/admin/settings"],
] as const;

export function AdminOperationsNav() {
  return (
    <nav aria-label="Admin sections" className="mt-6 flex gap-2 overflow-x-auto border-b border-line pb-3">
      {sections.map(([label, href]) => (
        <a
          key={label}
          href={href}
          className="label-mono shrink-0 border border-line px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-muted-ink transition-colors hover:border-ink hover:text-ink"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

export function AdminPageShell({
  eyebrow = "Admin",
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <span className="label-mono text-accent">{eyebrow}</span>
          <h1 className="display mt-2 text-3xl">{title}</h1>
        </div>
        <a
          href="/admin"
          className="label-mono shrink-0 border border-line px-4 py-3 text-[10px] uppercase tracking-[0.12em] transition-colors hover:border-ink hover:bg-muted"
        >
          ← Back to Admin
        </a>
      </div>
      <AdminOperationsNav />
      {children}
    </div>
  );
}
