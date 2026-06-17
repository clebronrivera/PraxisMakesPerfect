import type { LandingAuthProps } from '../landingData';

/** Sticky top navigation for the landing page. */
export default function LandingNav({ onOpenAuth }: LandingAuthProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0a1c]/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center gap-6">
        <div className="flex items-center gap-2.5 mr-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center font-black text-sm">
            ◑
          </div>
          <span className="font-extrabold tracking-wide">PASS</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/65 font-medium">
          <a href="#how" className="hover:text-white transition">How it works</a>
          <a href="#features" className="hover:text-white transition">Micro-skills</a>
          <a href="#method" className="hover:text-white transition">Our method</a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="text-sm font-semibold text-white/80 hover:text-white transition"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => onOpenAuth('signup')}
            className="rounded-xl px-4 py-2 text-sm font-bold text-indigo-700 bg-white hover:bg-indigo-50 transition"
          >
            Take your baseline →
          </button>
        </div>
      </div>
    </header>
  );
}
