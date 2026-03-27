// src/components/ArtifactCard.tsx
// Renders an artifact (vocabulary list, weak-areas summary, etc.)
// with a Download button that saves as a .md file.

import { Download, FileText } from 'lucide-react';

interface ArtifactCardProps {
  type: string;
  payload: Record<string, unknown>;
}

function artifactToMarkdown(type: string, payload: Record<string, unknown>): string {
  const lines: string[] = [`# ${formatType(type)}`, ''];

  if (type === 'vocabulary-list') {
    const terms = payload.terms as Array<{ term: string; definition: string }> | undefined;
    if (terms) {
      for (const t of terms) {
        lines.push(`**${t.term}**: ${t.definition}`, '');
      }
    }
  } else if (type === 'weak-areas-summary') {
    const skills = payload.skills as Array<{ skillId: string; skillName: string; accuracy: number; note?: string }> | undefined;
    if (skills) {
      for (const s of skills) {
        lines.push(`## ${s.skillName} (${s.skillId})`);
        lines.push(`Accuracy: ${Math.round(s.accuracy * 100)}%`);
        if (s.note) lines.push(s.note);
        lines.push('');
      }
    }
  } else {
    // Generic fallback: JSON pretty-print
    lines.push('```json');
    lines.push(JSON.stringify(payload, null, 2));
    lines.push('```');
  }

  return lines.join('\n');
}

function formatType(type: string): string {
  return type
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function ArtifactCard({ type, payload }: ArtifactCardProps) {
  const handleDownload = () => {
    const markdown = artifactToMarkdown(type, payload);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const label = formatType(type);

  return (
    <div className="editorial-surface mt-2 p-4 rounded-lg border border-amber-200 bg-amber-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-900">{label}</span>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
        >
          <Download className="w-3 h-3" />
          Download .md
        </button>
      </div>

      {type === 'vocabulary-list' && (
        <div className="space-y-2">
          {(payload.terms as Array<{ term: string; definition: string }> || []).slice(0, 5).map((t, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold text-amber-900">{t.term}: </span>
              <span className="text-amber-800">{t.definition}</span>
            </div>
          ))}
          {(payload.terms as unknown[])?.length > 5 && (
            <p className="text-xs text-amber-700">+ {(payload.terms as unknown[]).length - 5} more in download</p>
          )}
        </div>
      )}

      {type === 'weak-areas-summary' && (
        <div className="space-y-1.5">
          {(payload.skills as Array<{ skillId: string; skillName: string; accuracy: number }> || []).slice(0, 4).map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-amber-900">{s.skillName}</span>
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                {Math.round(s.accuracy * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {type !== 'vocabulary-list' && type !== 'weak-areas-summary' && (
        <p className="text-xs text-amber-700">Download the file to view full content.</p>
      )}
    </div>
  );
}
