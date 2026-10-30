import { isVideoSource } from "@/lib/site-content";
import { mediaSrcSet, responsiveMediaSrc } from "@/lib/media";
import { useEffect, useRef, useState } from "react";

/** Renders an editorial slot that can hold either an image or a looping video. */
export function SiteMedia({
  src,
  alt,
  className,
  eager = false,
  poster,
  width,
  height,
  sizes = "100vw",
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  poster?: string;
  width?: number;
  height?: number;
  sizes?: string;
}) {
  if (!src?.trim()) return null;

  if (isVideoSource(src)) {
    return <LazyVideo
      src={responsiveMediaSrc(src)}
      {...(poster ? { poster } : {})}
      alt={alt}
      className={className}
      eager={eager}
    />;
  }

  return (
    <img
      src={src}
      srcSet={mediaSrcSet(src)}
      sizes={sizes}
      alt={alt || "MOLD editorial image"}
      className={className}
      width={width ?? 1200}
      height={height ?? 1500}
      decoding="async"
      {...(eager ? { fetchPriority: "high" as const, loading: "eager" as const } : { loading: "lazy" as const })}
    />
  );
}

function LazyVideo({ src, poster, alt, className, eager }: {
  src: string;
  poster?: string;
  alt: string;
  className?: string;
  eager: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(eager);

  useEffect(() => {
    if (load || !videoRef.current) return;
    const video = videoRef.current;
    if (!("IntersectionObserver" in window)) {
      setLoad(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(video);
    return () => observer.disconnect();
  }, [load]);

  return (
      <video
        ref={videoRef}
        {...(load ? { src } : {})}
        {...(poster ? { poster } : {})}
        aria-label={alt}
        className={className}
        autoPlay={load}
        muted
        loop
        playsInline
        preload="none"
      />
  );
}
