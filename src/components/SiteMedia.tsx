import { isVideoSource } from "@/lib/site-content";

/** Renders an editorial slot that can hold either an image or a looping video. */
export function SiteMedia({
  src,
  alt,
  className,
  eager = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  width?: number;
  height?: number;
}) {
  if (isVideoSource(src)) {
    return (
      <video
        src={src}
        aria-label={alt}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        preload={eager ? "auto" : "metadata"}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      {...(width ? { width } : {})}
      {...(height ? { height } : {})}
      {...(eager ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
    />
  );
}
