import { ChevronRight, Layers } from 'lucide-react';
import { getDomainColor } from '../utils/domainColors';
import { PROGRESS_DOMAINS, getProgressSkillsForDomain } from '../utils/progressTaxonomy';

interface DomainTilesProps {
  onDomainSelect?: (domainId: number) => void;
}

export default function DomainTiles({ onDomainSelect }: DomainTilesProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Domain Review</h2>
        <p className="text-slate-400 text-sm">
          Pick one Praxis domain to start a focused mixed-review session from the active question pool.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROGRESS_DOMAINS.map((domain) => {
          const color = getDomainColor(domain.id);
          const skillCount = getProgressSkillsForDomain(domain.id).length;

          return (
            <button
              key={domain.id}
              onClick={() => onDomainSelect?.(domain.id)}
              className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5 text-left transition-all hover:border-slate-600 hover:bg-slate-800/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {domain.id}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{domain.name}</p>
                      <p className="text-xs text-slate-500">{skillCount} active skills</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">{domain.subtitle}</p>
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <Layers className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
