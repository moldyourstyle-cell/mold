import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  checkAdmin,
  bootstrapFirstAdmin,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — MOLD" },
      { name: "description", content: "MOLD admin product management" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const doCheck = useServerFn(checkAdmin);
  const doBootstrap = useServerFn(bootstrapFirstAdmin);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Make sure a valid (non-expired) token exists before calling the server.
        let { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          const refreshed = await supabase.auth.refreshSession();
          sessionData = refreshed.data as typeof sessionData;
        }
        if (!sessionData.session) {
          if (!cancelled) {
            setFailure("Your sign-in has expired. Please sign in again.");
            setChecking(false);
          }
          navigate({ to: "/auth" });
          return;
        }
        if (!cancelled) setSignedInEmail(sessionData.session.user.email ?? null);

        const runCheck = async () => {
          try {
            return await doCheck();
          } catch {
            // Token may have just expired mid-flight — refresh once and retry.
            await supabase.auth.refreshSession();
            return await doCheck();
          }
        };

        const res = await runCheck();
        if (res.isAdmin) {
          if (!cancelled) setIsAdmin(true);
        } else {
          const boot = await doBootstrap({ data: undefined });
          if (!cancelled) {
            setIsAdmin(boot.ok);
            if (!boot.ok) setFailure(null);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setIsAdmin(false);
          setFailure(error instanceof Error ? error.message : "Could not verify admin access.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doCheck, doBootstrap, navigate]);


  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="label-mono text-muted-ink">Verifying access…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="display text-3xl">No admin access</h1>
        <p className="mt-4 text-sm text-muted-ink">
          {failure
            ? failure
            : "This account is not an admin for MOLD. Sign in with the owner account, or ask the owner to grant this account access."}
        </p>
        {signedInEmail ? (
          <p className="label-mono mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-ink">
            Signed in as {signedInEmail}
          </p>
        ) : null}

        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/"
            className="label-mono border border-line px-4 py-3 text-[11px] uppercase tracking-[0.14em] hover:bg-muted"
          >
            Back to store
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="label-mono bg-ink px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-paper hover:bg-accent hover:text-ink"
          >
            Sign in as another account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between border-b border-line pb-6">
        <h1 className="display text-3xl">Admin</h1>
        <div className="flex gap-3">
          <Link
            to="/"
            className="label-mono border border-line px-4 py-3 text-[11px] uppercase tracking-[0.14em] hover:bg-muted"
          >
            View store
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="label-mono border border-line px-4 py-3 text-[11px] uppercase tracking-[0.14em] hover:bg-muted"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/orders"
          className="border border-line p-6 transition-colors hover:border-ink hover:bg-muted"
        >
          <span className="label-mono text-accent">Sales</span>
          <h2 className="display mt-3 text-3xl">Orders</h2>
          <p className="mt-3 max-w-[38ch] text-sm text-muted-ink">
            See every placed order, update its status and view delivery details.
          </p>
          <span className="label-mono mt-6 inline-block">Open orders →</span>
        </Link>
        <Link
          to="/admin/content"
          className="border border-line p-6 transition-colors hover:border-ink hover:bg-muted"
        >
          <span className="label-mono text-accent">Storefront</span>
          <h2 className="display mt-3 text-3xl">Site content</h2>
          <p className="mt-3 max-w-[38ch] text-sm text-muted-ink">Edit the hero banner, editorial lookbook and Instagram feed.</p>
          <span className="label-mono mt-6 inline-block">Open editor →</span>
        </Link>
        <Link to="/admin/products" className="border border-line p-6 transition-colors hover:border-ink hover:bg-muted">
          <span className="label-mono text-accent">Catalog</span>
          <h2 className="display mt-3 text-3xl">Products</h2>
          <p className="mt-3 max-w-[38ch] text-sm text-muted-ink">Manage product details, images, stock and storefront visibility.</p>
          <span className="label-mono mt-6 inline-block">Manage products →</span>
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Customers", "Customer profiles and complete order history.", "/admin/customers"],
          ["Analytics", "Revenue, order, product and customer trends.", "/admin/analytics"],
          ["Inventory", "Available stock, sales and restock alerts.", "/admin/inventory"],
          ["Coupons & offers", "Create and manage discount codes.", "/admin/coupons"],
          ["Settings", "Store details, order fees and admin preferences.", "/admin/settings"],
        ].map(([title, description, href]) => (
          <a key={href} href={href} className="border border-line p-5 transition-colors hover:border-ink hover:bg-muted">
            <h2 className="display text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-muted-ink">{description}</p>
            <span className="label-mono mt-5 inline-block">Open section →</span>
          </a>
        ))}
      </div>

    </div>
  );
}
