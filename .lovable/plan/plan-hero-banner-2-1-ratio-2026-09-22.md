# Plan: Hero banner → 2:1 ratio

## Goal
Change the homepage hero banner from a near-full-height layout to a fixed **2:1 (width:height) ratio**, so it's a wide banner instead of a full-screen section.

## Changes

**`src/components/HeroCarousel.tsx`**
- Replace the current height approach (`min-h-[calc(100svh-5.5rem)]` on the `<section>` and the inner content wrapper) with a **2:1 aspect-ratio container** using Tailwind's `aspect-[2/1]`.
- Keep `overflow-hidden`, `bg-ink`, `text-paper` on the section.
- Slide media (`<SiteMedia>`) stays `h-full w-full object-cover`, so images/video fill the 2:1 box and crop as needed.
- The content block (eyebrow, title, CTA buttons, dots) keeps its current layout but sits inside the shorter 2:1 box. Reduce vertical padding so the text still fits comfortably at the shorter height.
- Width is handled by the existing `max-w-[1500px]` wrapper; the 2:1 ratio is responsive, so on mobile the banner shrinks proportionally.
- `width={1920} height={1080}` props on `SiteMedia` are 16:9 hints only and don't affect layout — leave as-is.

**No other files change.** Default hero content, the admin content editor, and the homepage route are untouched.

## Result
The hero becomes a wide 2:1 banner (e.g. 1500×750 on desktop, full-width × half-height on mobile) instead of a full-screen section, matching a more editorial/conversion-focused layout.
