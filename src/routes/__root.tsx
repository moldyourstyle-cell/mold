import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { ArrowLeft, MessageCircle, Phone, X } from "lucide-react";
import { useStore } from "@/lib/store";


function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="display text-7xl">404</h1>
        <p className="label-mono mt-4 text-muted-ink">This page doesn't exist.</p>
        <Link
          to="/shop"
          className="mt-8 inline-block bg-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper"
        >
          Shop the drop
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="display text-4xl">This page didn't load</h1>
        <p className="label-mono mt-4 text-muted-ink">Try again or head back home.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper"
          >
            Try again
          </button>
          <a
            href="/"
            className="border border-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em]"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MOLD — Premium Streetwear, Chennai" },
      {
        name: "description",
        content:
          "MOLD is a Chennai streetwear label cutting heavy, oversized clothing in limited runs.",
      },
      { property: "og:site_name", content: "MOLD" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "MOLD",
          description:
            "Premium streetwear label producing limited runs of heavy-cut clothing in Chennai.",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Chennai",
            addressRegion: "Tamil Nadu",
            addressCountry: "IN",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
    </QueryClientProvider>
  );
}

function Shell() {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdminPage = pathname.startsWith("/admin");
  const queryClient = useQueryClient();
  const products = useCatalog();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <StoreProvider products={products}>
      {!isAdminPage && <AnnouncementBar />}
      {!isAdminPage && <Header transparentOnHome={pathname === "/"} />}
      <main className="min-h-[50vh]">
        {pathname !== "/" && pathname !== "/lookbook" && !pathname.startsWith("/admin") && (
          <div className="mx-auto flex h-0 max-w-[1500px] justify-end px-4 sm:px-6">
            <button
              type="button"
              aria-label={pathname.startsWith("/product/") ? "Return to previous page" : "Return to main page"}
              title={pathname.startsWith("/product/") ? "Return to previous page" : "Return to main page"}
              onClick={() => {
                if (pathname.startsWith("/product/")) {
                  if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
                  else router.navigate({ to: "/shop" });
                } else {
                  router.navigate({ to: "/" });
                }
              }}
              className="relative top-3 z-10 flex h-10 items-center gap-2 border border-line bg-paper px-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          </div>
        )}
        {/* Required: nested routes render here. */}
        <Outlet />
      </main>
      {!isAdminPage && <Footer />}
      {!isAdminPage && <FloatingWhatsApp />}
      {!isAdminPage && <CartDrawer />}
    </StoreProvider>
  );
}

function FloatingWhatsApp() {
  const { cartOpen } = useStore();
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || cartOpen) return null;

  return createPortal(
    expanded ? (
      <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2">
        <a
          href="https://chat.whatsapp.com/ERHpn9x9MMz5N6IaYbMFwB?s=sw&p=i&mlu=4&ilr=4"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join our WhatsApp group"
          title="Join our WhatsApp group"
          className="relative grid size-14 touch-manipulation place-items-center rounded-full bg-[#25D366] text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        >
          <MessageCircle className="size-7" aria-hidden="true" />
          <Phone className="absolute size-3 fill-white stroke-[#25D366] stroke-[3px]" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Hide WhatsApp link"
          className="grid size-8 place-items-center rounded-full bg-paper text-ink shadow-lg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Show WhatsApp link"
        aria-expanded={false}
        className="fixed bottom-5 right-0 z-[9999] grid size-12 translate-x-1/2 touch-manipulation place-items-center rounded-l-full bg-[#25D366] text-white shadow-lg"
      >
        <MessageCircle className="size-6 -translate-x-2" aria-hidden="true" />
        <Phone className="absolute size-3 -translate-x-2 fill-white stroke-[#25D366] stroke-[3px]" aria-hidden="true" />
      </button>
    ),
    document.body,
  );
}
