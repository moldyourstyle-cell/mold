import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { categories } from "@/data/products";
import { useStore } from "@/lib/store";

const navLinks = [
  { label: "New Drop", to: "/shop" as const, search: { sort: "newest" as const } },
  ...categories.map((c) => ({
    label: c.name,
    to: "/shop" as const,
    search: { category: c.slug },
  })),
  { label: "Clearance Sale", to: "/shop" as const, search: { sale: true } },
];

export function Header({ transparentOnHome = false }: { transparentOnHome?: boolean }) {
  const { count, setCartOpen, wishlist } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!transparentOnHome) return;
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [transparentOnHome]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchOpen(false);
    setMenuOpen(false);
    navigate({ to: "/shop", search: { q: query || undefined } });
  }

  return (
    <>
    <header className={`sticky top-0 z-[60] ${transparentOnHome && !scrolled ? "-mb-14 border-transparent bg-transparent text-paper" : "border-b border-line bg-paper/95 text-ink backdrop-blur-sm"}`}>
      <div className="mx-auto grid h-14 max-w-[1500px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="-ml-1 p-2 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="display text-[26px] leading-none">
            MOLD
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-6 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              search={l.search}
              className="group relative inline-flex items-center text-[11px] font-medium uppercase tracking-[0.14em]"
            >
              {l.label}
              {l.label === "Clearance Sale" && <span aria-hidden="true" className="ml-2 h-2 w-2 animate-pulse rounded-full bg-red-600" />}
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <Link to="/lookbook" className="group relative text-[11px] font-medium uppercase tracking-[0.14em]">
            Lookbook
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
          </Link>
        </nav>

        <div className="flex items-center justify-end gap-3 sm:gap-4">
          {searchOpen ? (
            <form onSubmit={submitSearch} className="flex w-36 items-center border-b border-current sm:w-48">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="label-mono min-w-0 flex-1 bg-transparent py-2 text-[10px] outline-none placeholder:text-muted-ink"
              />
              <button type="submit" aria-label="Submit search" className="p-2 hover:text-accent">
                <Search className="h-[18px] w-[18px]" />
              </button>
              <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)} className="p-1 hover:text-accent">
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="p-2 transition-colors hover:text-accent"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          )}
          <Link
            to="/account"
            aria-label="Account"
            className="p-2 transition-colors hover:text-accent"
          >
            <User className="h-[18px] w-[18px]" />
          </Link>
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative p-2 transition-colors hover:text-accent"
          >
            <Heart className="h-[18px] w-[18px]" />
            {wishlist.length > 0 && (
              <span className="absolute right-0 top-0 h-1.5 w-1.5 bg-accent" />
            )}
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            aria-label={`Cart, ${count} items`}
            className="relative p-2 transition-colors hover:text-accent"
          >
            <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="label-mono absolute -right-2 -top-2 min-w-4 bg-accent px-1 text-center text-[10px] leading-4 text-ink">
              {count}
            </span>
          </button>
        </div>
      </div>

    </header>

    {/* Mobile / tablet side menu — half-screen drawer (outside <header>: backdrop-filter would clip fixed positioning) */}
    <div
      className={`fixed inset-0 z-[70] lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!menuOpen}
    >
        {/* Backdrop: tap outside to close, homepage stays visible */}
        <div
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        {/* Drawer */}
        <div
          className={`absolute left-0 top-0 flex h-full w-[min(70vw,320px)] flex-col bg-ink text-paper shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-paper/10 px-4">
            <span className="display text-lg tracking-wide">MOLD</span>
            <button
              aria-label="Close menu"
              className="p-2"
              onClick={() => setMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-2">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                search={l.search}
                onClick={() => setMenuOpen(false)}
                className="font-nunito flex min-h-[23px] items-center border-b border-paper/10 py-1.5 text-[23px] font-semibold uppercase leading-[23px]"
              >
                {l.label}
                {l.label === "Clearance Sale" && <span aria-hidden="true" className="ml-2 h-2 w-2 animate-pulse rounded-full bg-red-500" />}
              </Link>
            ))}
            <Link
              to="/lookbook"
              onClick={() => setMenuOpen(false)}
              className="font-nunito block min-h-[23px] border-b border-paper/10 py-1.5 text-[23px] font-semibold uppercase leading-[23px]"
            >
              Lookbook
            </Link>
            <Link
              to="/track"
              onClick={() => setMenuOpen(false)}
              className="font-nunito block min-h-[23px] border-b border-paper/10 py-1.5 text-[23px] font-semibold uppercase leading-[23px]"
            >
              Track order
            </Link>
            <Link
              to="/about"
              onClick={() => setMenuOpen(false)}
              className="font-nunito block min-h-[23px] border-b border-paper/10 py-1.5 text-[23px] font-semibold uppercase leading-[23px]"
            >
              Our Story
            </Link>

            <Link
              to="/account"
              onClick={() => setMenuOpen(false)}
              className="font-nunito block pt-5 text-sm text-paper/60"
            >
              Account
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMenuOpen(false)}
              className="font-nunito block py-2 text-sm text-paper/60"
            >
              Wishlist · {wishlist.length}
            </Link>
          </nav>
        </div>
    </div>
    </>
  );
}
