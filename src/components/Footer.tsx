import { Link } from "@tanstack/react-router";
import { categories } from "@/data/products";
import { site } from "@/config/site";

const help = [
  ["Contact", "contact"],
  ["Shipping", "shipping"],
  ["Returns", "returns"],
  ["Size Guide", "size-guide"],
  ["Track Order", "track-order"],
  ["FAQ", "faq"],
] as const;






const legal = [
  ["Privacy Policy", "privacy"],
  ["Terms & Conditions", "terms"],
  ["Refund Policy", "refunds"],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-paper/10 bg-ink text-paper">
      <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <span className="display text-3xl">MOLD</span>
          <p className="label-mono mt-4 leading-relaxed text-paper/50">
            {site.tagline}
            <br />
            {site.city}
          </p>
        </div>
        <div>
          <span className="label-mono text-accent">Shop</span>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/70">
            <li>
              <Link to="/shop" search={{ sort: "newest" }} className="hover:text-paper">
                New Drop
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to="/shop" search={{ category: c.slug }} className="hover:text-paper">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/lookbook" className="hover:text-paper">
                Lookbook
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ sale: true }} className="hover:text-paper">
                Clearance Sale
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <span className="label-mono text-accent">Help</span>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/70">
            {help.map(([label, slug]) => (
              <li key={slug}>
                {slug === "track-order" ? (
                  <Link to="/track" className="hover:text-paper">
                    {label}
                  </Link>
                ) : (
                  <Link to="/help/$topic" params={{ topic: slug }} className="hover:text-paper">
                    {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

        </div>
        <div>
          <span className="label-mono text-accent">Social</span>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/70">
            <li>
              <a href={site.instagram} target="_blank" rel="noreferrer" className="hover:text-paper">
                Instagram
              </a>
            </li>
            <li>
              <a href={site.whatsapp} target="_blank" rel="noreferrer" className="hover:text-paper">
                WhatsApp
              </a>
            </li>
          </ul>
          <span className="label-mono mt-8 block text-accent">Legal</span>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/70">
            {legal.map(([label, slug]) => (
              <li key={slug}>
                <Link to="/help/$topic" params={{ topic: slug }} className="hover:text-paper">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-[1500px] flex-col items-start justify-between gap-3 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
          <span className="label-mono text-paper/40">© 2026 MOLD — Chennai, India</span>
        </div>
      </div>
    </footer>
  );
}
