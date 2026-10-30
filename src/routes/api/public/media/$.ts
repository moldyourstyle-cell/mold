import { createFileRoute } from "@tanstack/react-router";

const BUCKET = "product-images";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        // Only allow simple nested paths, no traversal.
        if (!path || path.includes("..") || path.startsWith("/")) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const requestedWidth = Number(url.searchParams.get("w"));

        // Supabase Storage renders these responsive variants as WebP when the
        // requesting browser accepts it. Restrict widths to the storefront set.
        if ([400, 800, 1600].includes(requestedWidth) && /\.(?:png|jpe?g|webp)$/i.test(path)) {
          const { data: signed } = await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(path, 60, {
              transform: { width: requestedWidth, quality: 80, resize: "contain" },
            });
          if (signed?.signedUrl) {
            const upstream = await fetch(signed.signedUrl, {
              headers: { accept: request.headers.get("accept") ?? "image/webp,image/*" },
            });
            if (upstream.ok) {
              const headers = new Headers();
              for (const key of ["content-type", "content-length", "vary"]) {
                const value = upstream.headers.get(key);
                if (value) headers.set(key, value);
              }
              headers.set("cache-control", "public, max-age=31536000, immutable");
              return new Response(upstream.body, { status: upstream.status, headers });
            }
          }
        }

        // Videos need byte-range support so browsers can seek and stream.
        const range = request.headers.get("range");
        if (range) {
          const { data: signed } = await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(path, 60);
          if (signed?.signedUrl) {
            const upstream = await fetch(signed.signedUrl, { headers: { range } });
            const headers = new Headers();
            for (const key of ["content-type", "content-length", "content-range", "accept-ranges"]) {
              const value = upstream.headers.get(key);
              if (value) headers.set(key, value);
            }
            headers.set("cache-control", "public, max-age=31536000, immutable");
            return new Response(upstream.body, { status: upstream.status, headers });
          }
        }

        const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
            "accept-ranges": "bytes",
          },
        });
      },
    },
  },
});
