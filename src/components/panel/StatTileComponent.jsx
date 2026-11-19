import { BarChart3 } from 'lucide-react';
export default function StatTile({ label, value, hint, icon: Icon = BarChart3, tint }) {
  return (
    <div className="card rounded-2xl p-4 flex items-start justify-between gap-3 min-w-0">
      <div className="min-w-0">
        <div className="text-[11px] font-bold muted">{label}</div>
        <div
          className="mt-2 font-black leading-tight break-words"
          style={{
            color: tint || 'var(--text)',
            fontSize: String(value).length > 12 ? '0.85rem' : '1.05rem',
          }}
        >
          {value}
        </div>
        {hint && <div className="mt-1 text-[10px] muted">{hint}</div>}
      </div>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ background: 'var(--card2)', color: tint || 'var(--primary-color)' }}
      >
        <Icon size={17} />
      </span>
    </div>
  );
}
