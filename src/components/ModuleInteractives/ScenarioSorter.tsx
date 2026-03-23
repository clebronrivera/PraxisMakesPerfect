import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import type { InteractiveScenario } from '../../data/learningModules';

interface ScenarioSorterProps {
  scenarios: InteractiveScenario[];
  categories: string[];
  prompt?: string;
  onComplete?: (categorization: Record<string, string[]>) => void;
}

/**
 * ScenarioSorter: Drag & drop scenarios into category columns
 * Used for: FERPA access control, bullying identification, breach/no-breach decisions
 */
export default function ScenarioSorter({
  scenarios,
  categories,
  prompt,
  onComplete,
}: ScenarioSorterProps) {
  const [categorization, setCategorization] = useState<Record<string, string[]>>(
    Object.fromEntries(categories.map(c => [c, []]))
  );
  const [draggedScenario, setDraggedScenario] = useState<string | null>(null);

  const unassignedScenarios = scenarios.filter(
    s => !Object.values(categorization).flat().includes(s.id)
  );

  const handleDragStart = (e: React.DragEvent, scenarioId: string) => {
    setDraggedScenario(scenarioId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCategory = (category: string) => {
    if (!draggedScenario) return;

    // Remove from previous category if exists
    const newCategorization = { ...categorization };
    Object.keys(newCategorization).forEach(cat => {
      newCategorization[cat] = newCategorization[cat].filter(id => id !== draggedScenario);
    });

    // Add to new category
    newCategorization[category] = [...newCategorization[category], draggedScenario];
    setCategorization(newCategorization);
    setDraggedScenario(null);
  };

  const getCategoryColor = (category: string) => {
    if (category.includes('GREEN') || category.includes('YES') || category.includes('ENDORSED')) {
      return 'bg-emerald-500/10 border-emerald-500/20';
    }
    if (category.includes('RED') || category.includes('NO') || category.includes('NOT')) {
      return 'bg-red-500/10 border-red-500/20';
    }
    return 'bg-blue-500/10 border-blue-500/20';
  };

  const getCategoryBadgeColor = (category: string) => {
    if (category.includes('GREEN') || category.includes('YES') || category.includes('ENDORSED')) {
      return 'bg-emerald-500/20 text-emerald-300';
    }
    if (category.includes('RED') || category.includes('NO') || category.includes('NOT')) {
      return 'bg-red-500/20 text-red-300';
    }
    return 'bg-blue-500/20 text-blue-300';
  };

  return (
    <div className="space-y-4">
      {prompt && (
        <p className="text-sm text-slate-300 italic">
          {prompt}
        </p>
      )}

      {/* Unassigned scenarios */}
      <div className="rounded-xl border border-slate-600/30 bg-slate-900/20 p-4">
        <p className="text-[10px] font-bold uppercase text-slate-500 mb-3">
          Scenarios to sort
        </p>
        <div className="space-y-2 min-h-[80px]">
          {unassignedScenarios.length === 0 ? (
            <p className="text-xs text-slate-500 italic">All scenarios categorized ✓</p>
          ) : (
            unassignedScenarios.map(scenario => (
              <div
                key={scenario.id}
                draggable
                onDragStart={e => handleDragStart(e, scenario.id)}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-600/40 hover:border-cyan-500/30 cursor-move transition-colors"
              >
                <GripVertical className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
                <span className="text-sm text-slate-300">{scenario.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(category => (
          <div
            key={category}
            onDragOver={handleDragOver}
            onDrop={() => handleDropOnCategory(category)}
            className={`rounded-xl border-2 border-dashed p-4 transition-colors ${getCategoryColor(category)}`}
          >
            <div className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase mb-3 ${getCategoryBadgeColor(category)}`}>
              {category.replace(/_/g, ' ')}
            </div>

            <div className="space-y-2 min-h-[120px]">
              {categorization[category].length === 0 ? (
                <p className="text-xs text-slate-500 italic">Drag scenarios here</p>
              ) : (
                categorization[category].map(scenarioId => {
                  const scenario = scenarios.find(s => s.id === scenarioId);
                  return scenario ? (
                    <div
                      key={scenarioId}
                      className="p-3 rounded-lg bg-slate-800/60 border border-slate-600/40 text-sm text-slate-300"
                    >
                      {scenario.text}
                    </div>
                  ) : null;
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {onComplete && unassignedScenarios.length === 0 && (
        <button
          onClick={() => onComplete(categorization)}
          className="w-full py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-cyan-300 text-sm font-semibold transition-colors"
        >
          Complete activity
        </button>
      )}
    </div>
  );
}
