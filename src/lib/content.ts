import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getSiteContent } from "@/lib/content.functions";
import { defaultSiteContent } from "@/lib/site-content";

export const siteContentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: async () => {
    try {
      return await getSiteContent();
    } catch (error) {
      // Public editorial content has a built-in default, so a backend outage
      // should not turn the entire page into a 500 response.
      console.error("Could not load site content:", error);
      return defaultSiteContent;
    }
  },
  staleTime: 60_000,
});

export function useSiteContent() {
  return useSuspenseQuery(siteContentQuery).data;
}
