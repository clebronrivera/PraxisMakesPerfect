/** Founder's note — "Why I built PASS." Photo is a deferred placeholder. */
export default function FoundersNoteSection() {
  return (
    <section className="max-w-4xl mx-auto px-6 md:px-10 py-20">
      <div className="pl-glass rounded-3xl p-8 md:p-10 relative overflow-hidden">
        <div
          className="absolute -top-24 -right-20 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,121,249,.22), transparent 70%)' }}
        />
        <p className="text-[12px] font-black uppercase tracking-[.2em] text-fuchsia-300 mb-6 relative">
          Why I built PASS
        </p>
        <div className="flex items-center gap-4 mb-6 relative">
          {/* Photo placeholder — deferred per founder. */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400/30 to-fuchsia-500/25 border border-white/20 grid place-items-center text-white/45 text-[10px] font-semibold shrink-0">
            photo
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">Carlos Lebron Rivera</p>
            <p className="text-[12.5px] text-white/55 mt-0.5 leading-snug">
              Educational Consultant · Reading Specialist · Special Education Specialist &amp; Advocate · Educational Assessor
            </p>
          </div>
        </div>
        <div className="space-y-4 text-[16px] leading-relaxed text-white/80 relative">
          <p>
            For years I've worked the hardest end of education —{' '}
            <span className="text-white font-semibold">complex case management</span>, special-education advocacy, and the
            school–parent conflicts no one else wants to touch. Giving educators a way to study{' '}
            <span className="text-white font-semibold">efficiently</span> and reclaim their time became my passion.
          </p>
          <p>
            PASS came from the coaching room. Too often, teachers were pushed to{' '}
            <span className="text-white font-semibold">perform</span> for whatever the district was chasing that month — a
            theatrical show instead of real learning. But when a teacher came to a coaching cycle genuinely{' '}
            <span className="text-white font-semibold">curious</span> — owning a perceived gap, naming the challenge
            themselves — everything changed. Their own idea of what to improve told us exactly which{' '}
            <span className="text-white font-semibold">data to look at</span> and which{' '}
            <span className="text-white font-semibold">specific skills and behaviors to target.</span>
          </p>
          <p>
            That's the engine behind PASS. It leverages <span className="text-white font-semibold">AI and the science of learning</span>,
            but it works the way a strong interventionist does — <span className="text-white font-semibold">triage</span> the real
            problem, <span className="text-white font-semibold">triangulate</span> across every signal, respond to the data.
            Deliberate about every move and every selection, pulling the maximum signal from{' '}
            <span className="text-white font-semibold">every response</span> — so that everything you do here{' '}
            <span className="text-white font-semibold">adapts to the way you learn,</span> not the average test-taker. From
            that, the <span className="text-white font-semibold">Platform for Adaptive Study Sessions</span> was born.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-7 relative">
          <div className="h-px w-8 bg-white/30" />
          <p className="text-[14px] text-white/70">
            <span className="font-bold text-white">Carlos Lebron Rivera</span> · Founder, PASS
          </p>
        </div>
      </div>
    </section>
  );
}
