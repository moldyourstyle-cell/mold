import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AdminDateFilters, initialDateFilter } from "@/components/AdminDateFilters";
import { AdminPageShell } from "@/components/AdminOperationsNav";
import { formatINR } from "@/lib/format";
import { inDateWindow, makeDateWindow, formatDay, type DateFilterState } from "@/lib/admin-date";
import { getAdminManagementData, type AdminManagementOrder } from "@/lib/admin-operations.functions";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: CustomersPage });

type CustomerGroup = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  registrationDate: string | null;
  orders: AdminManagementOrder[];
};

function CustomersPage() {
  const load = useServerFn(getAdminManagementData);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-management-data"], queryFn: () => load({ data: undefined }) });
  const [dateFilter, setDateFilter] = useState<DateFilterState>(initialDateFilter);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerGroup | null>(null);
  const window = makeDateWindow(dateFilter);

  const customers = useMemo(() => {
    if (!data) return [];
    const profilesById = new Map(data.authCustomers.map((profile) => [profile.id, profile]));
    const profilesByEmail = new Map(data.authCustomers.filter((profile) => profile.email).map((profile) => [profile.email.toLowerCase(), profile]));
    const groups = new Map<string, CustomerGroup>();
    for (const order of data.orders) {
      const email = order.email.trim().toLowerCase();
      const profile = (order.user_id ? profilesById.get(order.user_id) : undefined) ?? profilesByEmail.get(email);
      const id = order.user_id ?? (email ? `email:${email}` : `guest:${order.phone}`);
      const group = groups.get(id) ?? {
        id,
        name: profile?.name || order.customer_name,
        email: order.email,
        phone: profile?.phone || order.phone,
        city: order.city,
        registrationDate: profile?.createdAt ?? null,
        orders: [],
      };
      group.orders.push(order);
      groups.set(id, group);
    }
    return [...groups.values()].map((customer) => ({
      ...customer,
      orders: customer.orders.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    }));
  }, [data]);

  const matching = customers.map((customer) => {
    const periodOrders = customer.orders.filter((order) => inDateWindow(order.created_at, window));
    return { customer, periodOrders };
  }).filter(({ customer, periodOrders }) => {
    const q = search.trim().toLowerCase();
    const found = !q || customer.name.toLowerCase().includes(q) || customer.email.toLowerCase().includes(q) || customer.phone.toLowerCase().includes(q);
    return found && periodOrders.length > 0;
  });

  return (
    <AdminPageShell title="Customers">
      <div className="mt-6 space-y-6">
        <AdminDateFilters value={dateFilter} onChange={setDateFilter} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label-mono text-muted-ink">{matching.length} customers · orders placed {window.label}</p>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or phone" className="w-full border border-line bg-transparent px-3 py-2 text-sm sm:w-80" />
        </div>
        {isLoading ? <p className="label-mono text-muted-ink">Loading customers…</p> : error ? <p className="text-sm text-red-600">{error.message}</p> : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-muted/50"><tr>{["Customer", "Email", "Phone", "City", "Orders", "Spent", "First order", "Last order", "Type", "Registered"].map((label) => <th key={label} className="px-3 py-3 label-mono text-muted-ink">{label}</th>)}</tr></thead>
              <tbody>
                {matching.map(({ customer, periodOrders }) => {
                  const first = [...customer.orders].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
                  const latestPeriod = periodOrders[0];
                  const successful = periodOrders.filter((order) => !["cancelled", "returned"].includes(order.status));
                  const spent = successful.reduce((sum, order) => sum + Number(order.total), 0);
                  return (
                    <tr key={customer.id} className="border-t border-line hover:bg-muted/40">
                      <td className="px-3 py-3"><button className="text-left font-medium underline-offset-4 hover:underline" onClick={() => setSelected(customer)}>{customer.name}</button></td>
                      <td className="px-3 py-3">{customer.email}</td><td className="px-3 py-3">{customer.phone}</td><td className="px-3 py-3">{customer.city}</td>
                      <td className="px-3 py-3">{periodOrders.length}</td><td className="px-3 py-3">{formatINR(spent)}</td>
                      <td className="px-3 py-3">{first ? formatDay(new Date(first.created_at)) : "—"}</td><td className="px-3 py-3">{latestPeriod ? formatDay(new Date(latestPeriod.created_at)) : "—"}</td>
                      <td className="px-3 py-3">{customer.orders.length > 1 ? "Returning" : "New"}</td><td className="px-3 py-3">{customer.registrationDate ? formatDay(new Date(customer.registrationDate)) : "Guest"}</td>
                    </tr>
                  );
                })}
                {matching.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-ink">No customers for this period.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <CustomerDetails customer={selected} onClose={() => setSelected(null)} />}
    </AdminPageShell>
  );
}

function CustomerDetails({ customer, onClose }: { customer: CustomerGroup; onClose: () => void }) {
  const paidOrders = customer.orders.filter((order) => !["cancelled", "returned"].includes(order.status));
  const total = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const chronological = [...customer.orders].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-ink/40" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={`${customer.name} customer details`} className="h-full w-full max-w-3xl overflow-y-auto bg-paper p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-line pb-5"><div><span className="label-mono text-accent">Customer profile</span><h2 className="display mt-2 text-3xl">{customer.name}</h2><p className="mt-2 text-sm text-muted-ink">{customer.email} · {customer.phone} · {customer.city}</p></div><button onClick={onClose} className="border border-line px-3 py-2 text-sm">Close</button></div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><DetailStat label="Orders" value={String(customer.orders.length)} /><DetailStat label="Total spent" value={formatINR(total)} /><DetailStat label="Average order" value={formatINR(paidOrders.length ? total / paidOrders.length : 0)} /><DetailStat label="Registered" value={customer.registrationDate ? formatDay(new Date(customer.registrationDate)) : "Guest"} /></div>
        <p className="label-mono mt-5 text-muted-ink">First order {chronological[0] ? formatDay(new Date(chronological[0].created_at)) : "—"} · Last order {chronological.at(-1) ? formatDay(new Date(chronological.at(-1)!.created_at)) : "—"}</p>
        <h3 className="display mt-8 text-2xl">Order history</h3>
        <div className="mt-3 overflow-x-auto border border-line"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/50"><tr>{["Order ID", "Date", "Products", "Amount", "Payment", "Status"].map((label) => <th key={label} className="px-3 py-3 label-mono text-muted-ink">{label}</th>)}</tr></thead><tbody>{customer.orders.map((order) => <tr key={order.id} className="border-t border-line"><td className="px-3 py-3">{order.order_number}</td><td className="px-3 py-3">{formatDay(new Date(order.created_at))}</td><td className="px-3 py-3">{order.order_items.map((item) => `${item.product_name} ×${item.qty}`).join(", ")}</td><td className="px-3 py-3">{formatINR(Number(order.total))}</td><td className="px-3 py-3 capitalize">{order.payment_status}</td><td className="px-3 py-3 capitalize">{order.status}</td></tr>)}</tbody></table></div>
      </aside>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return <div className="border border-line p-3"><span className="label-mono text-muted-ink">{label}</span><p className="mt-2 text-sm font-semibold">{value}</p></div>;
}
