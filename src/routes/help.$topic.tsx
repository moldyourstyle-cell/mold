import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { helpTopics, type HelpTopic } from "@/config/site";

export const Route = createFileRoute("/help/$topic")({
  loader: ({ params }) => {
    const topic = helpTopics[params.topic as HelpTopic];
    if (!topic) throw notFound();
    return { topic };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Unavailable — MOLD" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.topic.title} — MOLD`;
    const description = loaderData.topic.body[0].slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `/help/${params.topic}` },
      ],
      links: [{ rel: "canonical", href: `/help/${params.topic}` }],
    };
  },
  component: HelpPage,
});

function HelpPage() {
  const { topic } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-[760px] px-4 py-16 sm:px-6">
      <Link to="/" className="label-mono text-muted-ink hover:text-accent">
        ← Home
      </Link>
      <h1 className="display mt-4 text-[clamp(2.5rem,8vw,4.5rem)]">{topic.title}</h1>
      <div className="mt-8 space-y-5 border-t border-line pt-8 text-sm leading-relaxed text-muted-ink">
        {topic.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <Link
        to="/shop"
        className="mt-10 inline-block bg-ink px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink"
      >
        Shop the drop
      </Link>
    </div>
  );
}
