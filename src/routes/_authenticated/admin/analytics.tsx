import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminDateFilters, initialDateFilter } from "@/components/AdminDateFilters";
import { AdminPageShell } from "@/components/AdminOperationsNav";
import { getAdminManagementData } from "@/lib/admin-operations.functions";
import { inDateWindow, makeDateWindow, type DateFilterState } from "@/lib/admin-date";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/analytics")({ component: AnalyticsPage });
const COLORS = ["#c95432", "#171717", "#a7a29c", "#6b82a8", "#d5a44f", "#71816a"];

function AnalyticsPage() {
  const load = useServerFn(getAdminManagementData);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-management-data"], queryFn: () => load({ data: undefined }) });
  const [dateFilter, setDateFilter] = useState<DateFilterState>(initialDateFilter);
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const window = makeDateWindow(dateFilter);

  const analytics = useMemo(() => {
    if (!data) return null;
    const productById = new Map(data.products.map((product) => [product.id, product]));
    const allByCustomer = new Map<string, string[]>();
    for (const order of [...data.orders].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
      const customer = order.user_id ?? order.email.toLowerCase();
      const list = allByCustomer.get(customer) ?? [];
      list.push(order.created_at);
      allByCustomer.set(customer, list);
    }
    const orders = data.orders.filter((order) => {
      if (!inDateWindow(order.created_at, window)) return false;
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      const lines = order.order_items.filter((item) => {
        const product = item.product_id ? productById.get(item.product_id) : undefined;
        return (productFilter === "all" || item.product_id === productFilter) && (categoryFilter === "all" || product?.category === categoryFilter);
      });
      return (productFilter === "all" && categoryFilter === "all") || lines.length > 0;
    });
    const active = orders.filter((order) => !["cancelled", "returned"].includes(order.status));
    const matchedLines = active.flatMap((order) => order.order_items.filter((item) => {
      const product = item.product_id ? productById.get(item.product_id) : undefined;
      return (productFilter === "all" || item.product_id === productFilter) && (categoryFilter === "all" || product?.category === categoryFilter);
    }).map((item) => ({ ...item, created_at: order.created_at, customer: order.user_id ?? order.email.toLowerCase() })));
    const revenue = productFilter !== "all" || categoryFilter !== "all"
      ? matchedLines.reduce((sum, item) => sum + Number(item.unit_price) * item.qty, 0)
      : active.reduce((sum, order) => sum + Number(order.total), 0);
    const customerOrders = new Map<string, typeof orders>();
    for (const order of orders) {
      const key = order.user_id ?? order.email.toLowerCase();
      customerOrders.set(key, [...(customerOrders.get(key) ?? []), order]);
    }
    let newCustomers = 0;
    let returningCustomers = 0;
    for (const key of customerOrders.keys()) {
      const firstEver = allByCustomer.get(key)?.[0];
      if (firstEver && inDateWindow(firstEver, window)) newCustomers++;
      else returningCustomers++;
    }
    const span = window.end.getTime() - window.start.getTime();
    const monthly = span > 100 * 86400000;
    const buckets = new Map<string, { date: string; revenue: number; orders: number; customers: Set<string> }>();
    const bucketFor = (iso: string) => {
      const date = new Date(iso);
      if (monthly) date.setDate(1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${monthly ? "01" : String(date.getDate()).padStart(2, "0")}`;
      const entry = buckets.get(key) ?? { date: monthly ? date.toLocaleDateString("en", { month: "short", year: "2-digit" }) : date.toLocaleDateString("en", { day: "numeric", month: "short" }), revenue: 0, orders: 0, customers: new Set<string>() };
      buckets.set(key, entry);
      return entry;
    };
    for (const order of orders) {
      const entry = bucketFor(order.created_at);
      const selectedLines = order.order_items.filter((item) => {
        const product = item.product_id ? productById.get(item.product_id) : undefined;
        return (productFilter === "all" || item.product_id === productFilter) && (categoryFilter === "all" || product?.category === categoryFilter);
      });
      if (!["cancelled", "returned"].includes(order.status)) {
        entry.revenue += productFilter !== "all" || categoryFilter !== "all"
          ? selectedLines.reduce((sum, item) => sum + Number(item.unit_price) * item.qty, 0)
          : Number(order.total);
      }
      entry.orders++;
      entry.customers.add(order.user_id ?? order.email.toLowerCase());
    }
    const seenCustomers = new Set<string>();
    const timeline = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, entry]) => {
      for (const customer of entry.customers) seenCustomers.add(customer);
      return { date: entry.date, revenue: entry.revenue, orders: entry.orders, customers: seenCustomers.size };
    });
    const statuses = [...new Set(orders.map((order) => order.status))].map((status) => ({ name: status, value: orders.filter((order) => order.status === status).length }));
    const productSales = new Map<string, { name: string; quantity: number }>();
    for (const item of matchedLines) {
      const name = item.product_name || "Product";
      const current = productSales.get(name) ?? { name, quantity: 0 };
      current.quantity += item.qty;
      productSales.set(name, current);
    }
    const topProducts = [...productSales.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8);
    const categoryTotals = new Map<string, number>();
    for (const item of matchedLines) {
      const category = item.product_id ? productById.get(item.product_id)?.category ?? "Other" : "Other";
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + Number(item.unit_price) * item.qty);
    }
    const categories = [...categoryTotals].map(([name, value]) => ({ name, value }));
    return { orders, active, revenue, newCustomers, returningCustomers, customerCount: customerOrders.size, average: active.length ? revenue / active.length : 0, timeline, statuses, topProducts, categories };
  }, [data, window.start.getTime(), window.end.getTime(), statusFilter, productFilter, categoryFilter]);

  return (
    <AdminPageShell title="Analytics">
      <div className="mt-6 space-y-6">
        <AdminDateFilters value={dateFilter} onChange={setDateFilter} />
        <div className="grid gap-3 sm:grid-cols-3">
          <FilterSelect label="Order status" value={statusFilter} onChange={setStatusFilter} options={["all", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"]} />
          <FilterSelect label="Product" value={productFilter} onChange={setProductFilter} options={["all", ...(data?.products.map((p) => p.id) ?? [])]} labels={new Map(data?.products.map((p) => [p.id, p.name]) ?? [])} />
          <FilterSelect label="Product category" value={categoryFilter} onChange={setCategoryFilter} options={["all", ...new Set(data?.products.map((p) => p.category) ?? [])]} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2"><p className="label-mono text-accent">{window.label} Analytics</p>{(statusFilter !== "all" || productFilter !== "all" || categoryFilter !== "all") && <button onClick={() => { setStatusFilter("all"); setProductFilter("all"); setCategoryFilter("all"); }} className="label-mono text-muted-ink underline">Clear other filters</button>}</div>
        {isLoading ? <p className="label-mono text-muted-ink">Loading analytics…</p> : error ? <p className="text-sm text-red-600">{error.message}</p> : analytics && <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Metric label="Total orders" value={String(analytics.orders.length)} /><Metric label="Total revenue" value={formatINR(analytics.revenue)} /><Metric label="Total customers" value={String(analytics.customerCount)} /><Metric label="New customers" value={String(analytics.newCustomers)} /><Metric label="Returning customers" value={String(analytics.returningCustomers)} /><Metric label="Average order value" value={formatINR(analytics.average)} /></div>
          <div className="grid gap-4 lg:grid-cols-2"><ChartCard title="Revenue over time"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.timeline}><CartesianGrid strokeDasharray="3 3" stroke="#dedbd6" /><XAxis dataKey="date" /><YAxis width={60} /><Tooltip formatter={(value) => formatINR(Number(value))} /><Line type="monotone" dataKey="revenue" stroke="#c95432" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></ChartCard>
            <ChartCard title="Orders over time"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.timeline}><CartesianGrid strokeDasharray="3 3" stroke="#dedbd6" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="orders" fill="#171717" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
            <ChartCard title="Order status"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.statuses} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={3}>{analytics.statuses.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard>
            <ChartCard title="Top-selling products"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.topProducts} layout="vertical" margin={{ left: 12, right: 16 }}><CartesianGrid strokeDasharray="3 3" stroke="#dedbd6" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="quantity" fill="#c95432" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></ChartCard>
            <ChartCard title="Customer growth"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.timeline}><CartesianGrid strokeDasharray="3 3" stroke="#dedbd6" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="customers" stroke="#6b82a8" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></ChartCard>
            <ChartCard title="Revenue by product category"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.categories}><CartesianGrid strokeDasharray="3 3" stroke="#dedbd6" /><XAxis dataKey="name" /><YAxis width={60} /><Tooltip formatter={(value) => formatINR(Number(value))} /><Bar dataKey="value" fill="#71816a" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
          </div>
        </>}
      </div>
    </AdminPageShell>
  );
}

function FilterSelect({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Map<string, string> }) {
  return <label className="label-mono text-muted-ink">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full border border-line bg-paper px-3 py-2.5 text-sm capitalize text-ink">{options.map((option) => <option key={option} value={option}>{labels?.get(option) ?? (option === "all" ? "All" : option.replaceAll("-", " "))}</option>)}</select></label>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="border border-line p-4"><span className="label-mono text-muted-ink">{label}</span><p className="display mt-2 text-2xl">{value}</p></div>; }
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border border-line p-4"><h2 className="label-mono mb-3 text-muted-ink">{title}</h2><div className="h-64 w-full">{children}</div></section>; }
