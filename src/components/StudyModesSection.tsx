// src/components/StudyModesSection.tsx
//
// Practice Hub: hub-of-tiles layout with modal pickers.
//
// ─── Practice Modes ──────────────────────────────────────────────────────────
//   By Domain      — DomainPickerModal opens on tile click; selection calls onDomainSelect
//   By Skill       — SkillPickerModal opens on tile click; selection calls onStartSkillPractice
//   Learning Path  — inline panel below hub (LearningPathNodeMap)
//   Term Sprint    — tile click calls onNavigate('term-sprint')
//   My Focus Terms — tile click calls onNavigate('my-focus-terms')
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  Lock,
  Layers,
  Target,
  Map,
  Zap,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import LearningPathNodeMap from './LearningPathNodeMap';
import DomainPickerModal from './DomainPickerModal';
import SkillPickerModal from './SkillPickerModal';
import { useLearningPathSupabase } from '../hooks/useLearningPathSupabase';
import type { UserProfile } from '../hooks/useProgressTracking';

// ─── Date helpers ────────────────────────────────────────────────────────────

function getLocalDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudyModesSectionProps {
  profile: UserProfile;
  userId: string | null;
  weeklyAvgSeconds?: number;
  totalQuestionsSeen?: number;
  onDomainSelect: (domainId: number) => void;
  /** Launches By Skill question practice for a specific skill */
  onStartSkillPractice: (skillId: string) => void;
  /** Opens the full Learning Path module page for a skill node */
  onNodeClick?: (skillId: string) => void;
  /** Called from locked panels to send the user to the adaptive diagnostic */
  onStartScreener?: () => void;
  onStartDiagnostic?: () => void;
  /** Legacy props kept for App.tsx compatibility */
  onSkillReviewOpen?: () => void;
  onLearningPathOpen?: () => void;
  onGenerateStudyPlan?: () => void;
  studyPlanExists?: boolean;
  /** Navigate to a named mode (term-sprint, my-focus-terms) */
  onNavigate?: (mode: string) => void;
}

type ActivePicker = 'domain' | 'skill' | 'path' | null;

// ─── HubTile ─────────────────────────────────────────────────────────────────

function HubTile({
  icon,
  title,
  description,
  onClick,
  locked = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={`editorial-surface flex flex-col gap-3 p-5 text-left transition-all duration-200
        ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]'}`}
    >
      <div className="text-amber-600">{icon}</div>
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

// ─── Learning Path Panel (inline below hub) ──────────────────────────────────

function LearningPathPanel({
  profile,
  userId,
  onNodeClick,
}: {
  profile: UserProfile;
  userId: string | null;
  onNodeClick: (skillId: string) => void;
}) {
  const { progress: lpProgress } = useLearningPathSupabase(userId);

  return (
    <LearningPathNodeMap
      profile={profile}
      lpProgress={lpProgress}
      onNodeClick={onNodeClick}
    />
  );
}

// ─── Locked banner ────────────────────────────────────────────────────────────

function LockedBanner({ onStartDiagnostic }: { onStartDiagnostic?: () => void }) {
  return (
    <div className="py-12 flex flex-col items-center gap-4 text-center editorial-surface">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
        <Lock className="w-5 h-5 text-amber-700" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-700">Practice unlocks after the adaptive diagnostic</p>
        <p className="mt-1.5 max-w-sm mx-auto text-sm leading-relaxed text-slate-500">
          Complete the adaptive diagnostic to unlock domain practice, skill drill, your learning path, term sprints, and focus terms.
        </p>
      </div>
      {onStartDiagnostic && (
        <button
          onClick={onStartDiagnostic}
          className="editorial-button-primary flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          Take the adaptive diagnostic
        </button>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function StudyModesSection({
  profile,
  userId,
  weeklyAvgSeconds: _weeklyAvgSeconds = 0,
  totalQuestionsSeen: _totalQuestionsSeen,
  onDomainSelect,
  onStartSkillPractice,
  onNodeClick,
  onStartDiagnostic,
  onNavigate,
}: StudyModesSectionProps) {
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const fullAssessmentComplete = Boolean(profile.fullAssessmentComplete);

  // ── SRS: skills due for review ────────────────────────────────────────
  const today = getLocalDateStr();
  const allEntries = Object.entries(profile.skillScores ?? {});
  const srsOverdueCount = allEntries.filter(
    ([, p]) => p.nextReviewDate && p.nextReviewDate <= today && p.attempts > 0
  ).length;

  return (
    <section className="max-w-3xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Practice Hub</h2>
        <p className="text-sm text-slate-500">
          Choose how you want to practice. All modes are sorted by weakest first.
        </p>
      </div>

      {/* ── SRS due-for-review nudge ─────────────────────────────────────── */}
      {srsOverdueCount > 0 && fullAssessmentComplete && (
        <button
          onClick={() => setActivePicker('skill')}
          className="w-full flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-left transition-colors hover:bg-violet-100"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0 text-violet-600" />
          <p className="text-sm text-violet-800">
            <span className="font-semibold">{srsOverdueCount} skill{srsOverdueCount !== 1 ? 's' : ''} due for spaced review</span>
            {' '}&mdash; tap to practice by skill now.
          </p>
        </button>
      )}

      {/* ── Hub grid or locked banner ───────────────────────────────────── */}
      {!fullAssessmentComplete ? (
        <LockedBanner onStartDiagnostic={onStartDiagnostic} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Row 1: By Domain + By Skill */}
          <HubTile
            icon={<Layers className="w-5 h-5" />}
            title="By Domain"
            description="Choose a domain and drill questions in that area."
            onClick={() => setActivePicker('domain')}
          />
          <HubTile
            icon={<Target className="w-5 h-5" />}
            title="By Skill"
            description="Pick any of 45 skills and focus your practice."
            onClick={() => setActivePicker('skill')}
          />

          {/* Row 2: Learning Path + Term Sprint + My Focus Terms (3 in a row) */}
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <HubTile
              icon={<Map className="w-5 h-5" />}
              title="Learning Path"
              description="Work through skills in priority order based on your data."
              onClick={() => setActivePicker(activePicker === 'path' ? null : 'path')}
            />
            <HubTile
              icon={<Zap className="w-5 h-5" />}
              title="Term Sprint"
              description="20 rapid-fire vocab questions. 10 seconds each."
              onClick={() => onNavigate?.('term-sprint')}
            />
            <HubTile
              icon={<BookOpen className="w-5 h-5" />}
              title="My Focus Terms"
              description="Study terms from questions you've answered incorrectly."
              onClick={() => onNavigate?.('my-focus-terms')}
            />
          </div>
        </div>
      )}

      {/* ── Inline Learning Path panel (below hub when selected) ─────────── */}
      {activePicker === 'path' && fullAssessmentComplete && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Learning Path</h3>
            <button
              type="button"
              onClick={() => setActivePicker(null)}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
          <LearningPathPanel
            profile={profile}
            userId={userId}
            onNodeClick={onNodeClick ?? (() => {})}
          />
        </div>
      )}

      {/* ── Domain Picker Modal ──────────────────────────────────────────── */}
      {activePicker === 'domain' && (
        <DomainPickerModal
          profile={profile}
          onSelectDomain={onDomainSelect}
          onClose={() => setActivePicker(null)}
        />
      )}

      {/* ── Skill Picker Modal ───────────────────────────────────────────── */}
      {activePicker === 'skill' && (
        <SkillPickerModal
          profile={profile}
          onSelectSkill={(skillId) => {
            onStartSkillPractice(skillId);
          }}
          onClose={() => setActivePicker(null)}
        />
      )}

    </section>
  );
}
