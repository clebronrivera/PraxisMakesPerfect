import { X } from 'lucide-react';
import OnboardingFlow from './OnboardingFlow';
import type { UserProfileData } from './OnboardingFlow';

/**
 * Slide-over panel: review and edit saved onboarding answers (nickname, program, exam, goals).
 */
export default function ProfileEditorPanel({
  initialData,
  onClose,
  onSaveComplete,
  displayName
}: {
  initialData: UserProfileData;
  onClose: () => void;
  onSaveComplete: (data: UserProfileData) => Promise<void>;
  displayName?: string | null;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-white/10 bg-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p id="profile-editor-title" className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-500">
              Account
            </p>
            <p className="text-sm font-semibold text-white">Profile &amp; onboarding</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close profile editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <OnboardingFlow
            displayName={displayName}
            mode="edit"
            variant="embedded"
            initialData={initialData}
            onCancel={onClose}
            onComplete={async (data) => {
              await onSaveComplete(data);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
