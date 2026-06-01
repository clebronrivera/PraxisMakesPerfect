/** Landing footer with brand + beta disclaimer. */
export default function LandingFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center gap-4 justify-between text-white/50 text-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center font-black text-xs">
            ◑
          </div>
          <span className="font-bold text-white/80">PASS</span>
          <span className="text-white/35">· Platform for Adaptive Study Sessions</span>
        </div>
        <p className="text-[12px]">
          Currently in beta. Not responsible for loss of data during the beta period. · © 2026
        </p>
      </div>
    </footer>
  );
}
