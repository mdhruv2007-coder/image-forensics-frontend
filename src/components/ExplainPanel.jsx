/**
 * ExplainPanel
 * ---------------------------------------------------------------
 * Renders the plain-English `explanation` array as a readable,
 * ordered list. Order is preserved exactly as given — this is the
 * narrative the scan produced, not a sortable list.
 *
 * Props
 *   explanation - array of sentence strings
 */
export default function ExplainPanel({ explanation = [] }) {
  if (!explanation || explanation.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5">
        <p className="text-sm text-slate-500">No additional explanation available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-6">
      <h3 className="text-base font-semibold text-slate-900">What the scan found</h3>
      <ul className="mt-4 space-y-3">
        {explanation.map((sentence, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-slate-400" />
            <span>{sentence}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
