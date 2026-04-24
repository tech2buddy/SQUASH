import { SPECIALIZATION_GROUPS, getSpecializationLabel } from './testerSpecializations';

export default function SpecializationChecklist({
  selected,
  onToggle,
  readOnly = false,
  compact = false,
}: {
  selected: string[];
  onToggle?: (id: string, nextChecked: boolean) => void;
  readOnly?: boolean;
  compact?: boolean;
}) {
  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-2">
        {selected.length === 0 ? (
          <span className="text-sm text-slate-500">No specializations selected yet.</span>
        ) : (
          selected.map((id) => (
            <span
              key={id}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              {getSpecializationLabel(id)}
            </span>
          ))
        )}
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {SPECIALIZATION_GROUPS.map((group) => (
        <div key={group.id}>
          <div className="mb-2 text-sm font-semibold text-slate-700">{group.title}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.options.map((option) => {
              const checked = selected.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    checked
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onToggle?.(option.id, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-green-600"
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

