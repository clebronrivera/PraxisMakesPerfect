import React, { useState } from 'react';
import { GripVertical, CheckCircle, XCircle } from 'lucide-react';
import type { InteractiveScenario } from '../../data/learningModules';

interface ScenarioSorterProps {
  scenarios: InteractiveScenario[];
  categories: string[];
  prompt?: string;
  onComplete?: (categorization: Record<string, string[]>) => void;
  variant?: 'atelier' | 'editorial';
}

/**
 * Returns true if the scenario was placed in its correct category column.
 * scenario.category is a short prefix (e.g. "CBM", "ALLOWED") that matches
 * the beginning of the full column name (e.g. "CBM (standardized curriculum-based)").
 */
function isCorrectPlacement(categoryName: string, scenario: InteractiveScenario): boolean {
  if (!scenario.category) return true; // no expected answer — always credit
  return categoryName.toUpperCase().startsWith(scenario.category.toUpperCase());
}

/**
 * ScenarioSorter: Drag & drop scenarios into category columns.
 * After submitting, each item shows a green ✓ or red ✗ with the correct category
 * revealed for any wrong placements.
 */
export default function ScenarioSorter({
  scenarios,
  categories,
  prompt,
  onComplete,
  variant = 'editorial',
}: ScenarioSorterProps) {
  const isA = variant === 'atelier';
  const [categorization, setCategorization] = useState<Record<string, string[]>>(
    Object.fromEntries(categories.map(c => [c, []]))
  );
  const [draggedScenario, setDraggedScenario] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const unassignedScenarios = scenarios.filter(
    s => !Object.values(categorization).flat().includes(s.id)
  );
  const allPlaced = unassignedScenarios.length === 0;

  const handleDragStart = (e: React.DragEvent, scenarioId: string) => {
    if (submitted) return;
    setDraggedScenario(scenarioId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (submitted) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCategory = (category: string) => {
    if (submitted || !draggedScenario) return;
    const newCategorization = { ...categorization };
    Object.keys(newCategorization).forEach(cat => {
      newCategorization[cat] = newCategorization[cat].filter(id => id !== draggedScenario);
    });
    newCategorization[category] = [...newCategorization[category], draggedScenario];
    setCategorization(newCategorization);
    setDraggedScenario(null);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete?.(categorization);
  };

  const getCategoryColor = (category: string) => {
    if (category.includes('GREEN') || category.includes('YES') || category.includes('ENDORSED')) {
      return isA ? 'bg-[color:var(--d2-mint)]/10 border-[color:var(--d2-mint)]/30' : 'bg-emerald-50 border-emerald-200';
    }
    if (category.includes('RED') || category.includes('NO') || category.includes('NOT')) {
      return isA ? 'bg-[color:var(--accent-rose)]/10 border-[color:var(--accent-rose)]/30' : 'bg-rose-50 border-rose-200';
    }
    return isA ? 'bg-[color:var(--d3-ice)]/10 border-[color:var(--d3-ice)]/30' : 'bg-blue-50 border-blue-200';
  };

  const getCategoryBadgeColor = (category: string) => {
    if (category.includes('GREEN') || category.includes('YES') || category.includes('ENDORSED')) {
      return isA ? 'bg-[color:var(--d2-mint)]/20 text-[color:var(--d2-mint)]' : 'bg-emerald-100 text-emerald-700';
    }
    if (category.includes('RED') || category.includes('NO') || category.includes('NOT')) {
      return isA ? 'bg-[color:var(--accent-rose)]/20 text-[color:var(--accent-rose)]' : 'bg-rose-100 text-rose-700';
    }
    return isA ? 'bg-[color:var(--d3-ice)]/20 text-[color:var(--d3-ice)]' : 'bg-blue-100 text-blue-700';
  };

  const promptCls = isA ? 'text-sm text-slate-400 italic' : 'text-sm text-slate-600 italic';
  const unassignedShell = isA
    ? 'rounded-xl border border-white/10 bg-white/5 p-4'
    : 'rounded-xl border border-slate-200 bg-slate-50 p-4';
  const unassignedLabel = isA
    ? 'text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-3'
    : 'text-[10px] font-bold uppercase text-slate-600 mb-3';
  const allPlacedText = isA ? 'text-xs text-slate-500 italic' : 'text-xs text-slate-500 italic';
  const scenarioItemCls = isA
    ? 'flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[color:var(--d1-peach)]/40 hover:bg-white/10 cursor-move transition-colors'
    : 'flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 cursor-move transition-colors shadow-sm';
  const scenarioHandle = isA ? 'w-4 h-4 mt-0.5 text-slate-500 shrink-0' : 'w-4 h-4 mt-0.5 text-slate-400 shrink-0';
  const scenarioText = isA ? 'text-sm text-slate-200' : 'text-sm text-slate-700';
  const emptyPlaceholder = isA ? 'text-xs text-slate-500 italic' : 'text-xs text-slate-400 italic';
  const placedNeutralCls = isA ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700';
  const placedCorrectCls = isA
    ? 'bg-[color:var(--d2-mint)]/10 border-[color:var(--d2-mint)]/40 text-white'
    : 'bg-emerald-50 border-emerald-300 text-emerald-800';
  const placedWrongCls = isA
    ? 'bg-[color:var(--accent-rose)]/10 border-[color:var(--accent-rose)]/40 text-white'
    : 'bg-rose-50 border-rose-300 text-rose-800';
  const checkIcon = isA ? 'w-4 h-4 text-[color:var(--d2-mint)] shrink-0 mt-0.5' : 'w-4 h-4 text-emerald-600 shrink-0 mt-0.5';
  const xIcon = isA ? 'w-4 h-4 text-[color:var(--accent-rose)] shrink-0 mt-0.5' : 'w-4 h-4 text-rose-500 shrink-0 mt-0.5';
  const correctHintText = isA ? 'text-xs mt-1.5 ml-6 text-[color:var(--accent-rose)]' : 'text-xs text-rose-600 mt-1.5 ml-6';
  const submitBtnCls = isA
    ? 'btn-soft-glow w-full text-sm font-semibold'
    : 'w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold transition-colors border border-transparent';

  return (
    <div className="space-y-4">
      {prompt && (
        <p className={promptCls}>
          {prompt}
        </p>
      )}

      {/* Unassigned scenarios — hidden after submit */}
      {!submitted && (
        <div className={unassignedShell}>
          <p className={unassignedLabel}>
            Scenarios to sort
          </p>
          <div className="space-y-2 min-h-[80px]">
            {allPlaced ? (
              <p className={allPlacedText}>All scenarios categorized ✓</p>
            ) : (
              unassignedScenarios.map(scenario => (
                <div
                  key={scenario.id}
                  draggable
                  onDragStart={e => handleDragStart(e, scenario.id)}
                  className={scenarioItemCls}
                >
                  <GripVertical className={scenarioHandle} />
                  <span className={scenarioText}>{scenario.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Category columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(category => (
          <div
            key={category}
            onDragOver={handleDragOver}
            onDrop={() => handleDropOnCategory(category)}
            className={`rounded-xl border-2 p-4 transition-colors ${submitted ? 'border-solid' : 'border-dashed'} ${getCategoryColor(category)}`}
          >
            <div className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase mb-3 ${getCategoryBadgeColor(category)}`}>
              {category.replace(/_/g, ' ')}
            </div>

            <div className="space-y-2 min-h-[120px]">
              {categorization[category].length === 0 ? (
                <p className={emptyPlaceholder}>
                  {submitted ? 'Nothing placed here' : 'Drag scenarios here'}
                </p>
              ) : (
                categorization[category].map(scenarioId => {
                  const scenario = scenarios.find(s => s.id === scenarioId);
                  if (!scenario) return null;
                  const correct = submitted ? isCorrectPlacement(category, scenario) : null;
                  const correctCategoryName = submitted && !correct && scenario.category
                    ? (categories.find(c => c.toUpperCase().startsWith(scenario.category!.toUpperCase())) ?? scenario.category)
                    : null;

                  return (
                    <div
                      key={scenarioId}
                      className={`p-3 rounded-xl border text-sm transition-colors ${
                        correct === null ? placedNeutralCls : correct ? placedCorrectCls : placedWrongCls
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {submitted && (
                          correct
                            ? <CheckCircle className={checkIcon} />
                            : <XCircle className={xIcon} />
                        )}
                        {!submitted && <GripVertical className={scenarioHandle} />}
                        <span>{scenario.text}</span>
                      </div>
                      {correctCategoryName && (
                        <p className={correctHintText}>
                          Correct: <span className="font-semibold">{correctCategoryName}</span>
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {onComplete && allPlaced && !submitted && (
        <button
          onClick={handleSubmit}
          className={submitBtnCls}
        >
          Submit
        </button>
      )}
    </div>
  );
}
