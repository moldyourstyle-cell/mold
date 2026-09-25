export function Newsletter() {
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
        <a
          href="https://chat.whatsapp.com/ERHpn9x9MMz5N6IaYbMFwB?s=sw&p=i&mlu=4&ilr=4"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center border border-paper/40 px-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:border-accent hover:bg-accent hover:text-paper"
        >
          Join us on WhatsApp <span aria-hidden="true" className="ml-2">→</span>
        </a>
      </div>
    </section>
  );
}
