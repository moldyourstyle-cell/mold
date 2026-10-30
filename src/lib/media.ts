const RESPONSIVE_WIDTHS = [400, 800, 1600] as const;

export function responsiveMediaSrc(src: string, width = 400) {
  if (!src.startsWith("/api/public/media/")) return src;
  const url = new URL(src, "https://mold-streetwear.vercel.app");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", "80");
  return `${url.pathname}${url.search}`;
}

export function mediaSrcSet(src: string) {
  if (!src.startsWith("/api/public/media/")) {
    const asset = src.match(/^(.*)-(?:400|800|1600)\.webp([?#].*)?$/);
    if (!asset || !/^\/(?:products|editorial)\//.test(src)) return undefined;
    return RESPONSIVE_WIDTHS.map((width) => `${asset[1]}-${width}.webp${asset[2] ?? ""} ${width}w`).join(", ");
  }
  return RESPONSIVE_WIDTHS.map((width) => {
    return `${responsiveMediaSrc(src, width)} ${width}w`;
  }).join(", ");
}
