export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-between p-6">
      <header className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="text-2xl font-bold tracking-tight">BinBuddy</h1>
        <span className="rounded-full bg-line/50 px-2.5 py-0.5 text-xs font-medium text-muted">
          Demo mode
        </span>
      </header>

      <section className="my-auto text-left">
        <p className="text-lg font-medium text-ink">
          Point your phone at an item and BinBuddy tells you which bin it goes in, and why.
        </p>
        <p className="mt-2 text-sm text-muted">
          AI describes the item. Deterministic municipal rules decide the bin.
        </p>
      </section>

      <footer className="border-t border-line pt-4 text-xs text-muted">
        Built during CodeRED: Orion • Houston, TX Curbside Rules
      </footer>
    </main>
  );
}
