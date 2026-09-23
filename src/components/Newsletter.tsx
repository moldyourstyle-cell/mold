import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto flex max-w-[1500px] flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 sm:py-20 md:flex-row md:items-end">
        <div>
          <span className="label-mono text-accent">Stay in the drop</span>
          <h2 className="display mt-3 text-[clamp(2.5rem,7vw,5rem)]">
            Don't miss
            <br />
            the next drop.
          </h2>
          <p className="mt-5 max-w-[38ch] text-sm text-paper/60">
            Get first access to new drops, limited releases and MOLD updates.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
          className="flex w-full flex-1 border-b border-paper/40 transition-colors focus-within:border-accent md:w-auto md:flex-none"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ENTER YOUR EMAIL"
            className="label-mono w-full min-w-0 bg-transparent py-4 text-paper outline-none placeholder:text-paper/40"
          />
          <button
            type="submit"
            className="shrink-0 px-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:text-paper"
          >
            {done ? "Joined" : "Join →"}
          </button>
        </form>
      </div>
    </section>
  );
}
