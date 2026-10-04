"use client";
export default function WorkspaceViews<T extends string>({
  label,
  views,
  value,
  onChange,
}: {
  label: string;
  views: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <nav className="workspace-views" aria-label={label}>
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          aria-pressed={value === view.id}
          onClick={() => onChange(view.id)}
        >
          {view.label}
        </button>
      ))}
    </nav>
  );
}
