import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";

const sectionKey = z.enum(["hero", "lookbook", "instagram", "showcase"]);
const contentInput = z.object({
  sectionKey,
  content: z.record(z.unknown()),
  isPublished: z.boolean(),
});

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

async function requireAdmin(context: {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

function mergeRows(rows: Array<{ section_key: string; content: Json }>): SiteContent {
  const next = structuredClone(defaultSiteContent);
  for (const row of rows) {
    if (row.section_key === "hero") next.hero = row.content as SiteContent["hero"];
    if (row.section_key === "lookbook") next.lookbook = row.content as SiteContent["lookbook"];
    if (row.section_key === "instagram") next.instagram = row.content as SiteContent["instagram"];
    if (row.section_key === "showcase") next.showcase = row.content as SiteContent["showcase"];
  }
  next.showcase = { ...defaultSiteContent.showcase, ...next.showcase };
  return next;
}

export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("site_content")
    .select("section_key, content")
    .eq("is_published", true);
  if (error) throw new Error(error.message);
  return mergeRows(data ?? []);
});

export const getAdminSiteContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("site_content")
      .select("section_key, content, is_published")
      .order("section_key");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      sectionKey: sectionKey.parse(row.section_key),
      content: row.content,
      isPublished: row.is_published,
    }));
  });

export const updateSiteContent = createServerFn({ method: "POST" })
  .inputValidator(contentInput)
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("site_content")
      .upsert(
        {
          section_key: data.sectionKey,
          content: data.content as Json,
          is_published: data.isPublished,
        },
        { onConflict: "section_key" },
      );
    if (error) throw new Error(error.message);

    return { ok: true };
  });
