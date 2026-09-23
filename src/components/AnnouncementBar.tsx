import { site } from "@/config/site";

export function AnnouncementBar() {
  const items = [...site.announcements, ...site.announcements];
  return (
    <div className="overflow-hidden bg-ink text-paper">
      <div
        className="flex w-max whitespace-nowrap py-2.5"
        style={{ animation: "marquee 34s linear infinite" }}
      >
        {items.map((text, i) => (
          <span key={i} className="flex items-center">
            <span className="label-mono mx-8 text-paper/85">{text}</span>
            <span className="text-accent">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
