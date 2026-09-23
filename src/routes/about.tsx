import { createFileRoute, Link } from "@tanstack/react-router";
import { lookbook } from "@/data/products";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "The MOLD Story — Chennai Streetwear Label" },
      {
        name: "description",
        content:
          "MOLD is a Chennai-born streetwear label built on individuality, heavy silhouettes and limited drops. This is how it started.",
      },
      { property: "og:title", content: "The MOLD Story — Chennai Streetwear Label" },
      {
        property: "og:description",
        content: "Chennai-born streetwear built on heavy silhouettes and limited drops.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <>
      <section className="relative">
        <img
          src={hero}
          alt="MOLD founder wearing a heavy jacket against a Chennai concrete wall"
          width={1920}
          height={1080}
          className="h-[52vh] min-h-[380px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-10">
          <span className="label-mono text-paper/70">Chennai · Est. 2023</span>
          <h1 className="display mt-3 text-[clamp(3rem,12vw,9rem)] text-paper">
            The MOLD
            <br />
            story.
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
        <div className="space-y-6 text-sm leading-relaxed text-muted-ink">
          <p className="text-base text-ink">
            MOLD started in a small Puzhal workshop with one rule: nothing thin, nothing safe.
          </p>
          <p>
            Every piece begins with fabric weight. 400gsm jersey, 340gsm twill, coated ripstop —
            cloth that holds a shape and earns its creases instead of collapsing after a week.
            Patterns are cut oversized on purpose: dropped shoulders, squared hems, room to move
            through a city that never slows down.
          </p>
          <p>
            We release in drops, not seasons. Each run is small, numbered and finished by a team
            you could count on two hands. When it's gone, it's gone — the next cut will be
            different, because that's the point.
          </p>
          <p>
            MOLD is for people who don't want the standard. Chennai-born, heavy by choice, built
            for individuality.
          </p>
          <Link
            to="/shop"
            className="mt-4 inline-block bg-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink"
          >
            Shop the drop
          </Link>
        </div>
        <div className="grid gap-4">
          <img
            src={lookbook.hero}
            alt="MOLD oversized set on a Chennai street"
            width={1024}
            height={1400}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
          <img
            src={lookbook.detail}
            alt="Heavy fabric and hardware detail"
            width={1024}
            height={768}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </section>

      <section className="bg-ink py-20 text-paper">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <h2 className="display text-[clamp(2.5rem,9vw,7rem)]">
            Don't fit the mold.
            <br />
            <span className="text-accent">Create your own.</span>
          </h2>
        </div>
      </section>
    </>
  );
}
