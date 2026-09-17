import React from 'react';
import type { DocketEntry } from '@verdict/shared';
import { ShieldCheck, ShieldAlert, History } from 'lucide-react';

interface DocketEntryCardProps {
  entry: DocketEntry;
}

export function DocketEntryCard({ entry }: DocketEntryCardProps) {
  const isApproved = entry.humanDecision === 'APPROVED';

  // Format relative date nicely
  const getRelativeDate = (dateStr: string) => {
    try {
      const now = new Date('2026-09-15T12:00:00.000Z');
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-start justify-between gap-3 text-left">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isApproved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {isApproved ? (
              <ShieldCheck className="w-3 h-3 shrink-0" />
            ) : (
              <ShieldAlert className="w-3 h-3 shrink-0" />
            )}
            <span>{isApproved ? 'Approved' : 'Denied'}</span>
          </span>
          <span className="text-[11px] text-slate-500">{getRelativeDate(entry.createdAt)}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed truncate-2-lines">
          {entry.summary}
        </p>
      </div>
    </div>
  );
}

interface DocketPanelProps {
  entries: DocketEntry[];
  className?: string;
}

export function DocketPanel({ entries, className = '' }: DocketPanelProps) {
  const displayedEntries = entries.slice(0, 5);

  return (
    <div className={`glass-panel-subtle p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400/80" />
          <h3 className="text-xs font-semibold text-slate-200 tracking-wide">
            Similar past cases from the Docket
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">{displayedEntries.length} precedents</span>
      </div>

      <div className="space-y-2">
        {displayedEntries.map((entry) => (
          <DocketEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
