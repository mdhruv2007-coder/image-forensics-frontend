export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">
            Image Tamper Detection
          </h1>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-2">
        <section className="flex min-h-64 flex-col rounded-lg border border-dashed border-slate-300 bg-white p-6">
          <p className="text-sm text-slate-500">Uploader goes here</p>
        </section>

        <section className="flex min-h-64 flex-col rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Results go here</p>
        </section>
      </main>
    </div>
  );
}
