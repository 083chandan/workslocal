import { JSX } from 'react';

import type { Filters as FilterType } from '../types';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const STATUS_RANGES = [
  { label: '2xx', min: 200, max: 299 },
  { label: '4xx', min: 400, max: 499 },
  { label: '5xx', min: 500, max: 599 },
];

interface FiltersProps {
  filters: FilterType;
  onChange: (filters: FilterType) => void;
}

export function Filters({ filters, onChange }: FiltersProps): JSX.Element {
  const toggleMethod = (method: string): void => {
    const next = new Set(filters.methods);
    if (next.has(method)) {
      next.delete(method);
    } else {
      next.add(method);
    }
    onChange({ ...filters, methods: next });
  };

  const toggleStatus = (min: number, max: number): void => {
    if (filters.statusMin === min && filters.statusMax === max) {
      onChange({ ...filters, statusMin: null, statusMax: null });
    } else {
      onChange({ ...filters, statusMin: min, statusMax: max });
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-(--border) px-4 py-2 text-sm">
      {/* Method toggles */}
      <div className="flex gap-1">
        {METHODS.map((m) => (
          <button
            key={m}
            onClick={() => toggleMethod(m)}
            className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
              filters.methods.has(m)
                ? 'bg-blue-500 text-white'
                : 'bg-(--muted) text-(--muted-foreground) hover:bg-(--accent)'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex gap-1">
        {STATUS_RANGES.map((s) => (
          <button
            key={s.label}
            onClick={() => toggleStatus(s.min, s.max)}
            className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
              filters.statusMin === s.min
                ? 'bg-blue-500 text-white'
                : 'bg-(--muted) text-(--muted-foreground) hover:bg-(--accent)'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Path search */}
      <input
        type="text"
        placeholder="Filter by path..."
        value={filters.pathSearch}
        onChange={(e) => onChange({ ...filters, pathSearch: e.target.value })}
        className="w-48 rounded border border-(--border) bg-(--muted) px-2 py-1 text-xs text-(--foreground) placeholder-(--muted-foreground) focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}
