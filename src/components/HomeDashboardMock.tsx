// src/components/HomeDashboardMock.tsx
// Prototype dashboard component — NOT currently mounted in App.tsx.
// The production home dashboard is rendered inline in App.tsx (mode === 'home').
// This file is retained as a reference while the inline dashboard is being
// refactored; it can be deleted once the inline view is extracted into its
// own component.

import { useMemo, useState } from 'react';
import { getDomainBySkillId, getSkillById } from '../brain/skill-map';
import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  LayoutDashboard,
  Layers,
  Map,
  Play,
  Search,
  Settings,
  Sparkles,
  Target,
  User,
  Zap,
} from 'lucide-react';
import { PROFICIENCY_META } from '../utils/skillProficiency';

type MockTab = 'Dashboard' | 'Practice' | 'Progress' | 'Study Plan';
type PracticeMode = 'Learning Path' | 'By Domain' | 'By Skill';

interface MetricCard {
  label: string;
  value: string;
  supporting: string;
  icon: typeof Activity;
  accent: string;
}

interface FocusSkill {
  id: string;
  name: string;
  proficiency: string;
}

interface DomainCard {
  name: string;
  activeSkills: number;
  progressNote: string;
}

const focusSkills: FocusSkill[] = [
  { id: 'ACA-02', name: 'Assessment Interpretation', proficiency: PROFICIENCY_META.emerging.label },
  { id: 'ACA-07', name: 'Intervention Implementation', proficiency: PROFICIENCY_META.emerging.label },
  { id: 'ETH-03', name: 'Legal and Ethical Standards', proficiency: PROFICIENCY_META.emerging.label },
  { id: 'FAM-03', name: 'Family-School Collaboration', proficiency: PROFICIENCY_META.emerging.label },
  { id: 'LEG-03', name: 'Educational Law Foundations', proficiency: PROFICIENCY_META.approaching.label },
];

const domainCards: DomainCard[] = [
  { name: 'Professional Practices', activeSkills: 13, progressNote: 'Lowest-performing domain right now' },
  { name: 'Student-Level Services', activeSkills: 12, progressNote: 'Mixed performance across core skills' },
  { name: 'Systems-Level Services', activeSkills: 8, progressNote: 'Good candidate for targeted review' },
  { name: 'Foundations of School Psychology', activeSkills: 12, progressNote: 'Several foundational opportunities remain' },
];

function NeuralCoreBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#fbfaf7]">
      <div className="absolute top-1/2 left-1/2 h-full max-h-[56rem] w-full max-w-[56rem] -translate-x-1/2 -translate-y-1/2 opacity-50">
        <svg viewBox="0 0 800 800" className="h-full w-full">
          <defs>
            <radialGradient id="mockGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="400" cy="400" r="180" fill="url(#mockGlow)" className="animate-pulse" />

          {Array.from({ length: 20 }).map((_, index) => (
            <path
              key={index}
              d={`M 400 400 Q ${400 + Math.cos(index) * 300} ${400 + Math.sin(index) * 300} ${400 + Math.cos(index) * 620} ${400 + Math.sin(index) * 620}`}
              stroke="#e2e8f0"
              strokeWidth="1.5"
              fill="none"
              className="opacity-60"
            />
          ))}

          {Array.from({ length: 24 }).map((_, index) => (
            <circle key={index} r="2.5" fill="#f59e0b">
              <animateMotion
                dur={`${5 + (index % 5)}s`}
                repeatCount="indefinite"
                path={`M 400 400 Q ${220 + index * 12} ${160 + (index % 6) * 80} ${60 + index * 24} ${110 + (index % 7) * 90}`}
              />
              <animate attributeName="opacity" values="0;0.8;0" dur={`${2.8 + (index % 3)}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    </div>
  );
}

function DashboardView({
  onTabChange,
  onPracticeModeChange,
}: {
  onTabChange: (tab: MockTab) => void;
  onPracticeModeChange: (mode: PracticeMode) => void;
}) {
  const metricCards: MetricCard[] = useMemo(
    () => [
      {
        label: 'Number of questions answered',
        value: '373',
        supporting: 'Across calibration and practice sessions so far',
        icon: Activity,
        accent: 'bg-slate-100 text-slate-800',
      },
      {
        label: 'Readiness phase',
        value: 'Developing',
        supporting: `Working toward ${PROFICIENCY_META.proficient.label}`,
        icon: Target,
        accent: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Skills to reach goal',
        value: '30',
        supporting: `Goal: 32 skills ${PROFICIENCY_META.proficient.label}`,
        icon: CheckCircle2,
        accent: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Weekly usage',
        value: '28m',
        supporting: 'Steady progress across the last seven days',
        icon: Clock3,
        accent: 'bg-blue-50 text-blue-700',
      },
    ],
    []
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="relative group">
        <div className="absolute inset-0 rounded-[3rem] bg-amber-100/50 blur-3xl opacity-60 transition-opacity group-hover:opacity-80" />
        <div className="relative overflow-hidden rounded-[3rem] border border-slate-200 bg-white p-12 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600">
                <Sparkles className="h-3 w-3" />
                System recommendation
              </div>

              <div>
                <h2 className="text-5xl font-bold leading-tight tracking-tight text-[#1a1a1a]">
                  Greetings,
                  <br />
                  <span className="font-black italic text-amber-600">Carlos.</span>
                </h2>
                <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-slate-500">
                  To further calibrate your strengths and opportunities, go ahead and cycle through all 45 questions again before generating your study guide. Once your calibration rounds are complete, the study guide becomes available, but it remains optional.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Additional round of calibration', complete: false },
                  { label: 'Second additional round of calibration', complete: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-5 py-4"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-slate-300 bg-white">
                      {item.complete ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {item.complete ? 'Complete' : 'Next step'}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#1a1a1a]">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="group relative flex flex-col items-center gap-2 rounded-[2.5rem] bg-[#1a1a1a] px-12 py-8 text-xs font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-[1.03] active:scale-95"
            >
              <span className="flex items-center gap-2 text-xl italic text-amber-500">I&apos;m Feeling Spicy!</span>
              <span className="text-[10px] font-bold lowercase tracking-normal text-white/80">
                Jump into another 45-question calibration cycle
              </span>
              <div className="absolute -right-3 -top-3 rounded-full border-4 border-white bg-amber-500 p-3 shadow-lg animate-bounce">
                <Flame className="h-5 w-5 fill-white text-white" />
              </div>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="group flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-amber-200"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-2xl border border-white p-3 shadow-sm ${card.accent}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600 transition-colors group-hover:text-amber-500" />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="text-3xl font-black italic tracking-tighter text-[#1a1a1a]">{card.value}</p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">{card.supporting}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="px-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">High-Impact Skills</h3>
              <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />
            </div>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
              High-impact skills are the lowest-performing skills in your skill bank. These skills change dynamically as you improve. If you want to see a full readout of every skill, go to Progress and expand the domains.
            </p>
          </div>

          <div className="overflow-hidden rounded-[3rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            {focusSkills.map((skill) => (
              <div
                key={skill.id}
                className="group flex items-center justify-between border-b border-slate-100 p-6 transition-all last:border-0 hover:bg-[#fbfaf7]"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 transition-colors group-hover:border-amber-300">
                    <span className="text-xs font-black italic tracking-tighter text-slate-400 transition-colors group-hover:text-amber-600">
                      {skill.id.split('-')[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1a1a1a] transition-colors group-hover:text-amber-700">
                      {getSkillById(skill.id)?.name ?? skill.name}
                    </h4>
                    <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                      {getDomainBySkillId(skill.id)?.name ?? skill.id} • {skill.proficiency}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onTabChange('Practice');
                    onPracticeModeChange('Learning Path');
                  }}
                  className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-700 transition-all hover:border-amber-400 hover:bg-amber-500 hover:text-white"
                >
                  Practice
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="h-full space-y-8">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[3.5rem] bg-[#0f172a] p-10 shadow-2xl">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-50 blur-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Daily goal</h4>
                <span className="text-xs font-black italic text-amber-500">0 / 10</span>
              </div>
              <div className="h-2.5 w-full rounded-full border border-white/5 bg-white/10 p-0.5 shadow-inner">
                <div className="h-full w-0 rounded-full bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
              </div>
              <p className="text-xs font-medium leading-relaxed text-slate-400">
                Progress toward your daily goal is based on questions answered. Recommended goal: 10 questions per day so there is still time to read and review the lesson content.
              </p>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recommended cadence</p>
                <p className="mt-2 text-sm font-bold text-white">10 questions per day</p>
                <p className="mt-1 text-xs font-medium text-slate-400">50 questions per week</p>
              </div>
            </div>

            <div className="relative z-10 mt-10 flex flex-1 flex-col justify-end gap-4 border-t border-white/5 pt-10">
              <button
                type="button"
                onClick={() => {
                  onTabChange('Practice');
                  onPracticeModeChange('Learning Path');
                }}
                className="group flex w-full flex-col items-center gap-2 rounded-[2rem] border border-white bg-white p-6 shadow-xl shadow-black/20 transition-all active:scale-95 hover:bg-amber-50"
              >
                <Map className="mb-1 h-6 w-6 text-amber-600" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0f172a]">Go directly to learning path</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-700/60">Resume next skill node</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTabChange('Practice');
                  onPracticeModeChange('By Domain');
                }}
                className="flex w-full items-center justify-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 transition-all hover:bg-white/10 hover:text-white"
              >
                <Layers className="h-4 w-4" />
                Go directly to domain practice
              </button>

              <button
                type="button"
                onClick={() => {
                  onTabChange('Practice');
                  onPracticeModeChange('By Skill');
                }}
                className="flex w-full items-center justify-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 transition-all hover:bg-white/10 hover:text-white"
              >
                <Zap className="h-4 w-4" />
                Go directly to skill practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PracticeView({
  mode,
  setMode,
}: {
  mode: PracticeMode;
  setMode: (mode: PracticeMode) => void;
}) {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-700">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight text-[#1a1a1a] italic uppercase">Practice Hub</h2>
        <p className="text-sm font-medium text-slate-500">Local mock navigation only. This view remains disconnected from live app behavior.</p>
      </div>

      <div className="flex w-fit gap-2 rounded-[2rem] border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/50">
        {(['By Domain', 'By Skill', 'Learning Path'] as PracticeMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-2xl px-10 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === item ? 'bg-amber-500 text-[#0f172a] shadow-xl' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {mode === 'By Domain' && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {domainCards.map((domain) => (
            <div key={domain.name} className="group relative overflow-hidden rounded-[3rem] border border-slate-200 bg-white p-10 shadow-sm transition-all hover:border-amber-200">
              <div className="relative z-10 mb-10 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold italic tracking-tight text-[#1a1a1a] transition-colors group-hover:text-amber-700">{domain.name}</h3>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{domain.activeSkills} active skills</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-amber-100 bg-amber-50 shadow-sm transition-transform group-hover:scale-110">
                  <Play className="h-6 w-6 fill-amber-600/10 text-amber-600" />
                </div>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-500">{domain.progressNote}</p>
            </div>
          ))}
        </div>
      )}

      {mode === 'By Skill' && (
        <div className="rounded-[3rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-bold italic tracking-tight text-[#1a1a1a]">Skill practice preview</h3>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
            This mock state represents the entry point where users would jump directly into skill-level practice after reviewing high-impact skills.
          </p>
        </div>
      )}

      {mode === 'Learning Path' && (
        <div className="relative flex flex-col items-center py-20">
          <div className="absolute top-0 bottom-0 w-px border-dashed bg-slate-200" />
          {['Review weakest skill', 'Complete a short lesson', 'Return to mixed practice'].map((label, index) => (
            <div
              key={label}
              className={`relative z-10 mb-16 flex w-full max-w-xl cursor-pointer items-center gap-10 rounded-[3rem] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50 transition-all hover:border-amber-300 ${
                index % 2 === 0 ? 'ml-auto mr-12' : 'mr-auto ml-12'
              }`}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-slate-200 bg-slate-50 text-3xl font-black italic text-amber-600 shadow-inner">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold uppercase italic leading-none text-[#1a1a1a]">{label}</h4>
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Mock learning path step</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-600 transition-all hover:border-amber-400 hover:bg-amber-500 hover:text-white">
                <ChevronRight className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressView() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="space-y-2 text-center">
        <h2 className="text-4xl font-bold tracking-tight italic uppercase text-[#1a1a1a]">Progress</h2>
        <p className="text-sm font-medium text-slate-500">Placeholder mock view for shell review only.</p>
      </div>
      <div className="rounded-[3rem] border border-slate-200 bg-white p-12 shadow-xl shadow-slate-200/50">
        <p className="text-sm font-medium leading-relaxed text-slate-500">
          This mock tab exists so the sidebar and CTA destinations feel interactive while remaining fully disconnected from production progress data.
        </p>
      </div>
    </div>
  );
}

function StudyPlanView() {
  return (
    <div className="space-y-12 animate-in zoom-in-95 duration-700">
      <div className="space-y-2">
        <h2 className="text-5xl font-bold tracking-tight italic uppercase text-[#1a1a1a]">Study Guide</h2>
        <p className="text-sm font-medium text-slate-500">Placeholder mock view for the study-guide destination.</p>
      </div>
      <div className="rounded-[3rem] border border-slate-200 bg-white p-12 shadow-xl shadow-slate-200/50">
        <p className="text-sm font-medium leading-relaxed text-slate-500">
          In the live product, this area would summarize readiness, focus areas, and the next recommended move after calibration is complete.
        </p>
      </div>
    </div>
  );
}

export default function HomeDashboardMock() {
  const [activeTab, setActiveTab] = useState<MockTab>('Dashboard');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('Learning Path');

  const renderContent = () => {
    switch (activeTab) {
      case 'Practice':
        return <PracticeView mode={practiceMode} setMode={setPracticeMode} />;
      case 'Progress':
        return <ProgressView />;
      case 'Study Plan':
        return <StudyPlanView />;
      case 'Dashboard':
      default:
        return <DashboardView onTabChange={setActiveTab} onPracticeModeChange={setPracticeMode} />;
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f7f6f2] font-sans text-[#1a1a1a] selection:bg-amber-100">
      <NeuralCoreBackground />

      <aside className="z-50 flex w-64 flex-shrink-0 flex-col bg-[#0f172a] shadow-2xl">
        <div className="p-8">
          <div className="group mb-10 flex cursor-pointer items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 opacity-20 blur-lg transition-opacity group-hover:opacity-60" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold italic tracking-tight text-white">
              Praxis<span className="italic text-amber-500">.</span>Ai
            </span>
          </div>

          <nav className="space-y-1">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Practice', icon: Play },
              { name: 'Progress', icon: BarChart3 },
              { name: 'Study Plan', icon: BookOpen },
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActiveTab(item.name as MockTab)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                  activeTab === item.name
                    ? 'bg-amber-500 text-[#0f172a] shadow-lg shadow-amber-900/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/5 bg-black/20 p-6">
          <div className="group mb-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 transition-all hover:bg-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-100">
              <User className="h-4 w-4 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold uppercase tracking-tight text-white">Carlos R.</p>
              <p className="truncate text-[10px] font-black uppercase tracking-widest text-amber-500">Core Synced</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-[#f7f6f2]/80 px-10 py-5 backdrop-blur-md">
          <h1 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">{activeTab}</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700 shadow-sm">
              <Flame className="h-3.5 w-3.5 fill-amber-600/20" />
              30 Day Pulse
            </div>
            <button type="button" className="rounded-full p-2.5 text-slate-400 transition-colors hover:bg-slate-200">
              <Search className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-2.5 text-slate-400 transition-colors hover:bg-slate-200">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-12 p-10 pb-24">{renderContent()}</div>
      </main>
    </div>
  );
}
