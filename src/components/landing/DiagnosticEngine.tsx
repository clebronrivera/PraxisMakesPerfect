import { useEffect, useRef } from 'react';

/**
 * PASS Live Diagnostic Engine — the landing hero's centerpiece.
 *
 * A faithful React port of the v5 "scrub + explore" mockup
 * (public/mockup-hero-neural-v5.html):
 *   · SCRUB (desktop) — when wrapped in a `[data-scrub-track]` tall/pinned section,
 *     scroll position drives the diagnosis timeline (dormant ghost map → lights up).
 *   · AUTO (mobile / reduced-motion / no track) — wall-clock auto-play on mount.
 *   · EXPLORE — once complete, nodes are clickable → a drill-down sheet shows each
 *     micro-skill's why / accuracy / connected skills.
 *
 * The canvas render loop + listeners are imperative (kept in a single effect with
 * full cleanup); only the engine's own DOM lives in this component's JSX. All ids
 * are `de-`-prefixed and looked up scoped to the component root, so nothing leaks.
 *
 * Numbers shown are a sample learner's results — honest demo data, no platform
 * claims (see the landing-positioning + no-psychometric-claims memories).
 */
interface DiagnosticEngineProps {
  /** Wired to the drill-down "Your plan starts here →" CTA (opens auth). */
  onStart?: () => void;
}

export default function DiagnosticEngine({ onStart }: DiagnosticEngineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // keep the latest onStart without re-running the (mount-once) engine effect
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const $ = (sel: string) => root.querySelector(sel) as HTMLElement | null;
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- data: 4 real app domains + 21 micro-skills ---------- */
    const DOMAINS = [
      { name: 'Data-Based Decisions', short: 'Data Decisions' },
      { name: 'Interventions & Instruction', short: 'Interventions' },
      { name: 'Consultation & Collaboration', short: 'Consultation' },
      { name: 'Legal, Ethical & Professional', short: 'Legal & Ethics' },
    ];
    const DOM_SCORES = [72, 58, 49, 84];
    type Status = 'm' | 'p' | 'c';
    const SKILLS: { name: string; s: Status; d: number }[] = [
      { name: 'Norm-Referenced Assessment', s: 'm', d: 0 },
      { name: 'Reliability & Validity', s: 'p', d: 0 },
      { name: 'Psychometric Statistics', s: 'c', d: 0 },
      { name: 'CBM & Progress Monitoring', s: 'm', d: 0 },
      { name: 'Problem-Solving Model', s: 'm', d: 0 },
      { name: 'Report Writing', s: 'p', d: 0 },
      { name: 'MTSS / RTI Tiers', s: 'm', d: 1 },
      { name: 'Academic Interventions', s: 'p', d: 1 },
      { name: 'Behavior Intervention', s: 'p', d: 1 },
      { name: 'FBA → BIP Design', s: 'c', d: 1 },
      { name: 'SEL Programming', s: 'p', d: 1 },
      { name: 'Developmental Milestones', s: 'p', d: 1 },
      { name: 'Consultation Models', s: 'c', d: 2 },
      { name: 'Family–School Collaboration', s: 'p', d: 2 },
      { name: 'Counseling Approaches', s: 'p', d: 2 },
      { name: 'Crisis Prevention & Response', s: 'p', d: 2 },
      { name: 'IDEA & Eligibility', s: 'm', d: 3 },
      { name: 'Section 504 Plans', s: 'p', d: 3 },
      { name: 'FERPA & Student Records', s: 'm', d: 3 },
      { name: 'NASP Ethical Principles', s: 'm', d: 3 },
      { name: 'ELL Considerations', s: 'p', d: 3 },
    ];
    const CROSS = [[2, 4], [3, 6], [9, 8], [12, 9], [16, 5], [13, 15], [7, 11], [19, 12]];
    const PATH = [2, 9, 12];
    const CRIT_META: Record<number, { acc: number; pr: number; wk: number }> = {
      2: { acc: 41, pr: 1, wk: 1 }, 9: { acc: 38, pr: 2, wk: 1 }, 12: { acc: 44, pr: 3, wk: 2 },
    };
    const SKILL_INFO: Record<number, { why: string; unblocks: number[] }> = {
      2: { why: 'Misreads standard error and confidence-interval bands when interpreting scores — so every downstream judgment inherits the error.', unblocks: [1, 0, 4] },
      9: { why: 'Selects interventions that don’t match the hypothesized function of the behavior, so the BIP treats the symptom, not the cause.', unblocks: [8, 7, 10] },
      12: { why: 'Blurs the stages of the problem-solving consultation cycle, so recommendations skip straight to solutions without defining the problem.', unblocks: [13, 15, 9] },
      1: { why: 'Shaky on when a measure is consistent versus when it actually measures what it claims.', unblocks: [2, 0] },
      8: { why: 'Strong on theory, but inconsistent translating function into a concrete plan.', unblocks: [9, 10] },
    };
    const siblingsOf = (i: number) =>
      SKILLS.map((_, j) => j).filter((j) => j !== i && SKILLS[j].d === SKILLS[i].d).slice(0, 3);

    const COLOR: Record<string, { core: string; glow: string }> = {
      m: { core: '#34d399', glow: 'rgba(52, 211, 153, ' },
      p: { core: '#fbbf24', glow: 'rgba(251, 191, 36, ' },
      c: { core: '#fb7185', glow: 'rgba(251, 113, 133, ' },
      dom: { core: '#818cf8', glow: 'rgba(129, 140, 248, ' },
    };
    const TIER = (s: number) => (s >= 80 ? '#34d399' : s >= 60 ? '#fbbf24' : '#fb7185');
    const STATUS_LABEL: Record<string, string> = { m: 'Mastered', p: 'Developing', c: 'Critical gap' };
    const STATUS_CLASS: Record<string, string> = { m: 'text-emerald-300', p: 'text-amber-300', c: 'text-rose-300' };
    const skillAcc = (i: number) => {
      const sk = SKILLS[i];
      if (sk.s === 'c') return CRIT_META[i].acc;
      return sk.s === 'm' ? 81 + (i * 7) % 13 : 61 + (i * 5) % 14;
    };

    /* ---------- stage timeline ---------- */
    const T_INGEST = 400, T_DOMAINS = 1900, T_SKILLS = 3300, SKILL_STAGGER = 110, T_PATH = 6200, T_DONE = 7300;
    const CAPTIONS: [number, string][] = [
      [0, 'Step 1 of 4 — Breaking down your responses…'],
      [T_DOMAINS, 'Step 2 of 4 — Isolating your four skill domains…'],
      [T_SKILLS, 'Step 3 of 4 — Extracting & scoring micro-skills…'],
      [T_PATH, 'Step 4 of 4 — Isolating gaps · building your growth path…'],
      [T_DONE, 'Diagnosis complete — 14 targets · 3 critical gaps · path built'],
    ];
    const TICKS: string[][] = [
      ['reading response patterns…'],
      ['clustering signal by domain… 4 domains isolated'],
      ['scoring Psychometric Statistics — 41% ⚠', 'scoring FBA → BIP Design — 38% ⚠',
        'scoring Consultation Models — 44% ⚠', 'scoring MTSS / RTI Tiers — 88% ✓', '21 micro-skills scored'],
      ['ranking gaps by impact → growth path built ✓'],
      ['diagnosis complete · monitoring enabled'],
    ];

    /* ---------- canvas ---------- */
    const wrap = $('#de-map')!;
    const canvas = $('#de-skill-map') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    let W = 0, H = 0, DPR = 1, VERT = false;

    let CORE = { x: 0, y: 0 };
    let domPos: { x: number; y: number }[] = [];
    let skillPos: { x: number; y: number }[] = [];

    function layout() {
      domPos = []; skillPos = [];
      if (!VERT) {
        CORE = { x: W * 0.085, y: H * 0.5 };
        const bandH = H / 4;
        for (let i = 0; i < 4; i++) domPos.push({ x: W * 0.32, y: bandH * (i + 0.5) });
        SKILLS.forEach((sk, i) => {
          const within = SKILLS.filter((s) => s.d === sk.d).indexOf(sk);
          const count = SKILLS.filter((s) => s.d === sk.d).length;
          const cols = 3, col = within % cols, row = (within / cols) | 0, rows = Math.ceil(count / cols);
          const jit = Math.sin(i * 12.9898) * 0.018;
          skillPos[i] = {
            x: W * (0.52 + col * 0.185 + jit),
            y: domPos[sk.d].y + (row - (rows - 1) / 2) * bandH * 0.46 + Math.cos(i * 7.7) * 4,
          };
        });
      } else {
        CORE = { x: W * 0.5, y: H * 0.09 };
        const bandW = W / 4;
        for (let i = 0; i < 4; i++) domPos.push({ x: bandW * (i + 0.5), y: H * 0.32 });
        SKILLS.forEach((sk, i) => {
          const within = SKILLS.filter((s) => s.d === sk.d).indexOf(sk);
          const cols = 2, col = within % cols, row = (within / cols) | 0;
          const jit = Math.sin(i * 12.9898) * 0.012;
          skillPos[i] = {
            x: domPos[sk.d].x + (col - 0.5) * bandW * 0.46 + jit * W,
            y: H * (0.50 + row * 0.155) + Math.cos(i * 7.7) * 3,
          };
        });
      }
    }
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth; H = wrap.clientHeight; VERT = W < H * 1.12;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      layout();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    /* ---------- timeline control (scroll-scrubbed) ---------- */
    let frozenT: number | null = null;
    let scrubT = 0;
    let autoStart: number | null = null;
    const track = root.closest('[data-scrub-track]') as HTMLElement | null;
    const SCRUB = () => window.innerWidth >= 1024 && !REDUCED && !!track;
    function tNow(now: number) {
      if (frozenT !== null) return frozenT;
      if (REDUCED) return T_DONE + 1;
      if (autoStart !== null) {
        const at = now - autoStart;
        if (at >= T_DONE) { autoStart = null; }
        else return Math.max(at, SCRUB() ? scrubT : 0);
      }
      return SCRUB() ? scrubT : (T_DONE + 1);
    }
    if (!SCRUB() && !REDUCED) autoStart = performance.now();

    const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
    const prog = (t: number, start: number, dur: number) => ease((t - start) / dur);
    const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
    const coreAct = (t: number) => prog(t, T_INGEST, 600);
    const domAct = (t: number, i: number) => prog(t, T_DOMAINS + i * 180, 700);
    const arcAct = (t: number, i: number) => prog(t, T_SKILLS + i * 220 + 500, 800);
    const skillAct = (t: number, i: number) => {
      const sk = SKILLS[i];
      const within = SKILLS.filter((s) => s.d === sk.d).indexOf(sk);
      return prog(t, T_SKILLS + sk.d * 220 + within * SKILL_STAGGER, 550);
    };
    const pathAct = (t: number) => prog(t, T_PATH, 950);

    /* ---------- pointer ---------- */
    const mouse = { x: -9999, y: -9999, inside: false };
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.inside = true;
    };
    const onLeave = () => { mouse.inside = false; mouse.x = -9999; mouse.y = -9999; };
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);

    /* ---------- ingest particles ---------- */
    const feed: { x: number; y: number; t: number; sp: number }[] = [];
    function spawnFeed(heavy: boolean) {
      const n = heavy ? 3 : 1;
      for (let k = 0; k < n; k++) {
        feed.push(VERT
          ? { x: W * (0.18 + Math.random() * 0.64), y: -6, t: 0, sp: 0.010 + Math.random() * 0.012 }
          : { x: -6, y: H * (0.15 + Math.random() * 0.7), t: 0, sp: 0.010 + Math.random() * 0.012 });
      }
    }

    /* ---------- elements ---------- */
    const captionEl = $('#de-caption')!;
    const segs = Array.from(root.querySelectorAll('.de-seg')) as HTMLElement[];
    const tickerEl = $('#de-ticker')!;
    const tt = $('#de-tooltip')!;
    const ttName = $('#de-tt-name')!;
    const ttStatus = $('#de-tt-status')!;
    const ttExtra = $('#de-tt-extra')!;
    const runCue = $('#de-run-cue')!;
    const exploreHint = $('#de-explore-hint')!;
    const drill = $('#de-drill')!;
    const drillDot = $('#de-drill-dot')!;
    const drillName = $('#de-drill-name')!;
    const drillStatus = $('#de-drill-status')!;
    const drillTag = $('#de-drill-tag')!;
    const drillWhy = $('#de-drill-why')!;
    const drillConnected = $('#de-drill-connected')!;
    const drillConnLabel = $('#de-drill-conn-label')!;
    const drillCta = $('#de-drill-cta') as HTMLButtonElement;

    /* ---------- caption + segments + ticker ---------- */
    let lastCaption = -1, cardsShown = false, idleCycle: number | null = null, idleStep = 0;
    let interactive = false, selected = -1, selDomain = false;
    let tick = { msgs: TICKS[0], msg: 0, chars: 0, acc: 0, hold: 0 };
    const tickReset = (idx: number) => { tick = { msgs: TICKS[Math.min(idx, TICKS.length - 1)], msg: 0, chars: 0, acc: 0, hold: 0 }; };
    function setSegs(idx: number) {
      segs.forEach((s, k) => { s.classList.toggle('on', idx > k || idx >= 4); s.classList.toggle('act', idx === k && idx < 4); });
    }
    function syncStage(t: number) {
      let idx = 0;
      for (let i = 0; i < CAPTIONS.length; i++) if (t >= CAPTIONS[i][0]) idx = i;
      if (idx !== lastCaption) {
        lastCaption = idx;
        captionEl.style.opacity = '0';
        window.setTimeout(() => { captionEl.textContent = CAPTIONS[idx][1]; captionEl.style.opacity = '1'; }, 180);
        setSegs(idx);
        tickReset(idx);
      }
      if (t >= T_DONE && !idleCycle && !REDUCED) {
        idleStep = 3;
        idleCycle = window.setInterval(() => { idleStep = (idleStep + 1) % 4; }, 2200);
      }
    }
    function updateTicker(dt: number) {
      if (REDUCED) { tickerEl.textContent = '› ' + TICKS[4][0]; return; }
      const m = tick.msgs[Math.min(tick.msg, tick.msgs.length - 1)];
      if (tick.chars < m.length) {
        tick.acc += dt;
        while (tick.acc > 20 && tick.chars < m.length) { tick.acc -= 20; tick.chars++; }
        tickerEl.textContent = '› ' + m.slice(0, tick.chars) + '▌';
      } else if (tick.msg < tick.msgs.length - 1) {
        tick.hold += dt; tickerEl.textContent = '› ' + m;
        if (tick.hold > 750) { tick.msg++; tick.chars = 0; tick.hold = 0; }
      } else { tickerEl.textContent = '› ' + m; }
    }

    /* ---------- drawing helpers ---------- */
    function glowNode(x: number, y: number, r: number, color: { core: string; glow: string }, glowA: number, haloMul: number) {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * haloMul);
      halo.addColorStop(0, color.glow + glowA + ')');
      halo.addColorStop(1, color.glow + '0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, r * haloMul, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color.core;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    function partialLine(a: { x: number; y: number }, b: { x: number; y: number }, k: number, stroke: string | CanvasGradient, width: number) {
      ctx.strokeStyle = stroke as string; ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k); ctx.stroke();
    }
    function drawDormant(t: number, bob: (i: number) => number, now: number) {
      const cghost = 1 - clamp01(coreAct(t) * 1.3);
      if (cghost > 0.02) {
        const pulse = REDUCED ? 1 : 0.7 + 0.3 * Math.sin(now * 0.003);
        glowNode(CORE.x, CORE.y, (VERT ? 8 : 10), COLOR.dom, 0.22 * cghost * pulse, 3);
      }
      for (let i = 0; i < 4; i++) {
        const g = 1 - clamp01(domAct(t, i) * 1.2);
        if (g <= 0.02) continue;
        const p = { x: domPos[i].x, y: domPos[i].y + bob(i) };
        ctx.strokeStyle = 'rgba(148,163,184,' + (0.08 * g) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(CORE.x, CORE.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,' + (0.22 * g) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, VERT ? 5 : 6, 0, Math.PI * 2); ctx.fill();
      }
      SKILLS.forEach((sk, i) => {
        const g = 1 - clamp01(skillAct(t, i) * 1.2);
        if (g <= 0.02) return;
        const p = { x: skillPos[i].x, y: skillPos[i].y + bob(i + 4) };
        const dp = { x: domPos[sk.d].x, y: domPos[sk.d].y + bob(sk.d) };
        ctx.strokeStyle = 'rgba(148,163,184,' + (0.05 * g) + ')'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(dp.x, dp.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,' + (0.18 * g) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, VERT ? 3 : 3.6, 0, Math.PI * 2); ctx.fill();
      });
    }

    /* ---------- explore drill-down ---------- */
    const connectionsOf = (i: number) => {
      const info = SKILL_INFO[i];
      const list = info && info.unblocks ? info.unblocks : siblingsOf(i);
      return list.filter((j) => j >= 0 && j < SKILLS.length && j !== i);
    };
    function renderChips(idxs: number[]) {
      drillConnected.innerHTML = '';
      idxs.forEach((j, n) => {
        const sk = SKILLS[j];
        const el = document.createElement('button');
        el.className = 'de-chip inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium';
        el.style.animationDelay = n * 45 + 'ms';
        el.style.borderColor = COLOR[sk.s].glow + '0.32)';
        el.style.color = COLOR[sk.s].core;
        el.innerHTML = '<span style="display:inline-block;width:6px;height:6px;border-radius:9999px;background:' + COLOR[sk.s].core + '"></span>' + sk.name;
        el.addEventListener('click', (ev) => { ev.stopPropagation(); openDrill(j, false); });
        drillConnected.appendChild(el);
      });
    }
    function openDrill(i: number, isDomain: boolean) {
      selected = i; selDomain = isDomain;
      exploreHint.classList.remove('show');
      if (isDomain) {
        const col = TIER(DOM_SCORES[i]);
        drillDot.style.background = col;
        drillName.textContent = DOMAINS[i].name;
        drillStatus.textContent = 'Skill domain · ' + DOM_SCORES[i] + '%';
        drillStatus.style.color = col;
        drillTag.classList.add('hidden');
        const inDom = SKILLS.map((_, j) => j).filter((j) => SKILLS[j].d === i);
        const weak = inDom.filter((j) => SKILLS[j].s !== 'm').length;
        drillWhy.textContent = DOMAINS[i].name + ' spans ' + inDom.length + ' micro-skills — ' + weak + ' still need work. The engine targets those first, in priority order.';
        drillConnLabel.textContent = 'Micro-skills in this domain';
        renderChips(inDom);
        drillCta.classList.add('hidden');
      } else {
        const sk = SKILLS[i];
        drillDot.style.background = COLOR[sk.s].core;
        drillName.textContent = sk.name;
        drillStatus.textContent = STATUS_LABEL[sk.s] + ' · ' + skillAcc(i) + '%';
        drillStatus.style.color = COLOR[sk.s].core;
        if (sk.s === 'c' && CRIT_META[i]) {
          drillTag.textContent = 'Priority ' + CRIT_META[i].pr + ' — targeted week ' + CRIT_META[i].wk;
          drillTag.classList.remove('hidden');
        } else { drillTag.classList.add('hidden'); }
        drillWhy.textContent = (SKILL_INFO[i] && SKILL_INFO[i].why)
          || ('Scored ' + skillAcc(i) + '% — ' + (sk.s === 'm' ? 'solid; kept on a spaced-review cadence.' : 'developing; it stays in your rotation until it sticks.'));
        drillConnLabel.textContent = 'Connected micro-skills';
        renderChips(connectionsOf(i));
        drillCta.classList.toggle('hidden', sk.s !== 'c');
      }
      drill.classList.add('open');
    }
    function closeDrill() {
      selected = -1;
      drill.classList.remove('open');
      if (interactive) exploreHint.classList.add('show');
    }
    const onCanvasClick = (e: MouseEvent) => {
      if (!interactive) return;
      const r = wrap.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let best = -1, bestDom = false, bestDist = 1e9;
      SKILLS.forEach((_, i) => {
        const d = Math.hypot(mx - skillPos[i].x, my - skillPos[i].y);
        if (d < 18 && d < bestDist) { best = i; bestDom = false; bestDist = d; }
      });
      if (best < 0) {
        for (let i = 0; i < 4; i++) {
          const d = Math.hypot(mx - domPos[i].x, my - domPos[i].y);
          if (d < 26 && d < bestDist) { best = i; bestDom = true; bestDist = d; }
        }
      }
      if (best >= 0) openDrill(best, bestDom); else closeDrill();
    };
    const onDrillClick = (e: MouseEvent) => e.stopPropagation();
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrill(); };
    const onClose = () => closeDrill();
    const onCtaClick = () => onStartRef.current?.();
    wrap.addEventListener('click', onCanvasClick);
    drill.addEventListener('click', onDrillClick);
    $('#de-drill-close')!.addEventListener('click', onClose);
    drillCta.addEventListener('click', onCtaClick);
    window.addEventListener('keydown', onEsc);

    /* ---------- stat cards ---------- */
    function revealCards() {
      (['baseline', 'targeted', 'gaps', 'path'] as const).forEach((key, i) => {
        window.setTimeout(() => {
          root!.querySelectorAll('[data-stat="' + key + '"]').forEach((el) => el.classList.add('on'));
          if (key !== 'path') runCounters(key);
        }, REDUCED ? 0 : 120 + i * 200);
      });
    }
    function runCounters(key: string) {
      root!.querySelectorAll('[data-stat="' + key + '"] [data-counter]').forEach((el) => {
        const target = +(el as HTMLElement).dataset.target!, t0 = performance.now(), DUR = REDUCED ? 1 : 1000;
        (function step(now: number) {
          const k = Math.min((now - t0) / DUR, 1);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }

    /* ---------- scrub (scroll-driven) ---------- */
    const onScroll = () => {
      if (REDUCED || !SCRUB() || !track) { runCue.style.opacity = '0'; return; }
      const r = track.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? clamp01(-r.top / span) : 0;
      scrubT = Math.max(scrubT, clamp01(p / 0.85) * T_DONE);
      runCue.style.opacity = interactive ? '0' : String(1 - clamp01(p / 0.10));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- render loop ---------- */
    let raf = 0;
    let lastFrame = performance.now();
    function frame(now: number) {
      const dt = Math.min(now - lastFrame, 50); lastFrame = now;
      const t = tNow(now);
      ctx.clearRect(0, 0, W, H);
      syncStage(t);
      updateTicker(dt);
      const bob = (i: number) => (REDUCED ? 0 : Math.sin(now * 0.0012 + i * 1.7) * 2.5);
      const cAct = coreAct(t);
      drawDormant(t, bob, now);

      if (!REDUCED && t > T_INGEST) {
        const heavy = t < T_DOMAINS + 800;
        if (Math.random() < (heavy ? 0.55 : 0.10)) spawnFeed(heavy);
        for (let i = feed.length - 1; i >= 0; i--) {
          const p = feed[i];
          p.t += p.sp * (dt / 16.7);
          if (p.t >= 1) { feed.splice(i, 1); continue; }
          const k = ease(p.t);
          const x = p.x + (CORE.x - p.x) * k, y = p.y + (CORE.y - p.y) * k;
          ctx.fillStyle = 'rgba(165, 180, 252, ' + (0.55 * (1 - p.t * 0.45)) + ')';
          ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill();
        }
      }

      if (cAct > 0.01) {
        const breath = REDUCED ? 0 : Math.sin(now * 0.002) * 0.08;
        const r = (VERT ? 11 : 13) * cAct * (1 + breath);
        glowNode(CORE.x, CORE.y, r, COLOR.dom, 0.35 * cAct, 3.4);
        ctx.strokeStyle = 'rgba(165, 180, 252, ' + (0.5 * cAct) + ')'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(CORE.x, CORE.y, r + 5, 0, Math.PI * 2); ctx.stroke();
        const ringFade = 1 - prog(t, T_DONE, 900);
        if (!REDUCED && ringFade > 0.02) {
          ctx.setLineDash([4, 6]); ctx.lineDashOffset = -(now * 0.018 % 10);
          ctx.strokeStyle = 'rgba(129, 140, 248, ' + (0.4 * cAct * ringFade) + ')';
          ctx.beginPath(); ctx.arc(CORE.x, CORE.y, r + 11, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.font = '600 ' + (VERT ? 10 : 11) + 'px Inter'; ctx.fillStyle = 'rgba(148, 163, 184, ' + cAct + ')';
        ctx.textAlign = 'center';
        ctx.fillText('Your responses', CORE.x, CORE.y + r + (VERT ? 20 : 24));
      }

      for (let i = 0; i < 4; i++) {
        const a = domAct(t, i);
        if (a <= 0.01) continue;
        const p = { x: domPos[i].x, y: domPos[i].y + bob(i) };
        partialLine(CORE, p, a, 'rgba(129, 140, 248, ' + (0.30 * a) + ')', 1.4);
        const d = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        const boost = mouse.inside ? Math.max(0, 1 - d / 110) : 0;
        const r = (VERT ? 7.5 : 9) * a * (1 + boost * 0.3);
        glowNode(p.x, p.y, r, COLOR.dom, 0.4 * a + boost * 0.2, 3);
        ctx.strokeStyle = 'rgba(165, 180, 252, ' + (0.55 * a + boost * 0.3) + ')'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 3.5, 0, Math.PI * 2); ctx.stroke();
        const ak = arcAct(t, i);
        if (ak > 0.02) {
          ctx.strokeStyle = TIER(DOM_SCORES[i]); ctx.globalAlpha = 0.85; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (DOM_SCORES[i] / 100) * ak);
          ctx.stroke(); ctx.globalAlpha = 1; ctx.lineCap = 'butt';
        }
        ctx.textAlign = 'center';
        const label = VERT || W < 560 ? DOMAINS[i].short : DOMAINS[i].name;
        if (VERT) {
          ctx.font = '600 9.5px Inter'; ctx.fillStyle = 'rgba(199, 210, 254, ' + (0.9 * a) + ')';
          ctx.fillText(label, p.x, p.y - r - 20);
          if (ak > 0.9) { ctx.font = '700 9.5px Inter'; ctx.fillStyle = TIER(DOM_SCORES[i]); ctx.fillText(DOM_SCORES[i] + '%', p.x, p.y - r - 9); }
        } else {
          ctx.font = '600 11px Inter'; ctx.fillStyle = 'rgba(199, 210, 254, ' + (0.9 * a) + ')';
          ctx.fillText(label, p.x, p.y - r - 13);
          if (ak > 0.9) { ctx.font = '700 10.5px Inter'; ctx.fillStyle = TIER(DOM_SCORES[i]); ctx.fillText(DOM_SCORES[i] + '%', p.x, p.y + r + 18); }
        }
      }

      let hovered = -1, hoverDist = 1e9, hoverIsDomain = false;
      SKILLS.forEach((sk, i) => {
        const a = skillAct(t, i);
        if (a <= 0.01) return;
        const p = { x: skillPos[i].x, y: skillPos[i].y + bob(i + 4) };
        const dp = { x: domPos[sk.d].x, y: domPos[sk.d].y + bob(sk.d) };
        const c = COLOR[sk.s];
        partialLine(dp, p, a, c.glow + (0.22 * a) + ')', 1);
        const d = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        const boost = mouse.inside ? Math.max(0, 1 - d / 100) : 0;
        if (d < 24 && d < hoverDist) { hovered = i; hoverDist = d; hoverIsDomain = false; }
        const alarm = sk.s === 'c' && !REDUCED ? 0.5 + 0.5 * Math.sin(now * 0.004 + i) : 0;
        const r = (VERT ? 4.5 : 5.5) * (0.5 + 0.5 * a) * (1 + boost * 0.45) * (sk.s === 'c' ? 1.18 : 1);
        glowNode(p.x, p.y, r, c, 0.32 * a + boost * 0.25 + alarm * 0.14, 3.6 + alarm * 1.6);
        ctx.strokeStyle = c.glow + (0.45 * a + boost * 0.4) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 2.6 + boost * 2.5, 0, Math.PI * 2); ctx.stroke();
      });

      for (const [a, b] of CROSS) {
        const k = Math.min(skillAct(t, a), skillAct(t, b));
        if (k <= 0.05) continue;
        ctx.strokeStyle = 'rgba(148, 163, 184, ' + (0.10 * k) + ')'; ctx.lineWidth = 0.8; ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(skillPos[a].x, skillPos[a].y + bob(a + 4));
        ctx.lineTo(skillPos[b].x, skillPos[b].y + bob(b + 4));
        ctx.stroke(); ctx.setLineDash([]);
      }

      const pa = pathAct(t);
      if (pa > 0.01) {
        const dim = 1 - 0.55 * prog(t, T_PATH + 1400, 900);
        const pts = PATH.map((i) => ({ x: skillPos[i].x, y: skillPos[i].y + bob(i + 4) }));
        const segsN = pts.length - 1;
        ctx.shadowColor = 'rgba(129, 140, 248, ' + (0.8 * dim) + ')'; ctx.shadowBlur = 10;
        for (let s = 0; s < segsN; s++) {
          const segK = Math.min(Math.max(pa * segsN - s, 0), 1);
          if (segK <= 0) break;
          const grad = ctx.createLinearGradient(pts[s].x, pts[s].y, pts[s + 1].x, pts[s + 1].y);
          grad.addColorStop(0, 'rgba(129, 140, 248, ' + (0.75 * dim) + ')');
          grad.addColorStop(1, 'rgba(52, 211, 153, ' + (0.75 * dim) + ')');
          partialLine(pts[s], pts[s + 1], segK, grad, 1.8);
        }
        if (pa >= 1 && !REDUCED) {
          const k = (now * 0.00022) % 1;
          const fs = Math.min((k * segsN) | 0, segsN - 1), fk = k * segsN - fs;
          const x = pts[fs].x + (pts[fs + 1].x - pts[fs].x) * fk;
          const y = pts[fs].y + (pts[fs + 1].y - pts[fs].y) * fk;
          ctx.fillStyle = 'rgba(199, 210, 254, ' + (0.95 * dim) + ')';
          ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
        PATH.forEach((idx, n) => {
          const bk = prog(t, T_PATH + 300 + n * 260, 420);
          if (bk <= 0.02) return;
          const p = { x: skillPos[idx].x, y: skillPos[idx].y + bob(idx + 4) };
          const bx = p.x + 11, by = p.y - 11, br = 7.5 * bk;
          ctx.fillStyle = 'rgba(99, 102, 241, 0.95)';
          ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.stroke();
          if (bk > 0.6) {
            ctx.font = '700 9px Inter'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(n + 1), bx, by + 0.5); ctx.textBaseline = 'alphabetic';
          }
        });
      }

      /* selection highlight (explore) */
      if (selected >= 0 && interactive) {
        const sp = selDomain
          ? { x: domPos[selected].x, y: domPos[selected].y + bob(selected) }
          : { x: skillPos[selected].x, y: skillPos[selected].y + bob(selected + 4) };
        if (!selDomain) {
          for (const j of connectionsOf(selected)) {
            const cp = { x: skillPos[j].x, y: skillPos[j].y + bob(j + 4) };
            ctx.strokeStyle = 'rgba(165,180,252,' + (0.55 + 0.25 * Math.sin(now * 0.005)) + ')'; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(cp.x, cp.y); ctx.stroke();
            ctx.fillStyle = 'rgba(165,180,252,0.9)';
            ctx.beginPath(); ctx.arc(cp.x, cp.y, 2.2, 0, Math.PI * 2); ctx.fill();
          }
        }
        const pr = (selDomain ? (VERT ? 11 : 13) : (VERT ? 7 : 8)) + 4 + 2 * Math.sin(now * 0.006);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, pr, 0, Math.PI * 2); ctx.stroke();
      }

      if (hovered < 0) {
        for (let i = 0; i < 4; i++) {
          if (domAct(t, i) < 0.5) continue;
          const d = Math.hypot(mouse.x - domPos[i].x, mouse.y - (domPos[i].y + bob(i)));
          if (d < 26 && d < hoverDist) { hovered = i; hoverDist = d; hoverIsDomain = true; }
        }
      }

      if (hovered >= 0) {
        let name: string, status: string, cls: string, extra: string | null = null, px: number, py: number;
        if (hoverIsDomain) {
          name = DOMAINS[hovered].name; status = 'Skill domain · ' + DOM_SCORES[hovered] + '%'; cls = 'text-indigo-300';
          px = domPos[hovered].x; py = domPos[hovered].y;
        } else {
          const sk = SKILLS[hovered];
          name = sk.name; status = STATUS_LABEL[sk.s] + ' · ' + skillAcc(hovered) + '%'; cls = STATUS_CLASS[sk.s];
          if (sk.s === 'c') { const m = CRIT_META[hovered]; extra = 'Priority ' + m.pr + ' — targeted week ' + m.wk; }
          px = skillPos[hovered].x; py = skillPos[hovered].y;
        }
        ttName.textContent = name;
        ttStatus.textContent = status;
        ttStatus.className = 'text-[11px] mt-0.5 font-medium ' + cls;
        ttExtra.classList.toggle('hidden', !extra);
        if (extra) ttExtra.textContent = extra;
        tt.style.left = Math.min(Math.max(px + 14, 8), W - 185) + 'px';
        tt.style.top = Math.max(py - (extra ? 62 : 48), 8) + 'px';
        tt.style.opacity = '1';
      } else {
        tt.style.opacity = '0';
      }

      if (!cardsShown && t >= T_DONE) { cardsShown = true; revealCards(); }
      const complete = t >= T_DONE;
      if (complete !== interactive) {
        interactive = complete;
        wrap.classList.toggle('interactive', interactive);
        exploreHint.classList.toggle('show', interactive && selected < 0);
        if (!interactive) closeDrill();
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    /* ---------- replay ---------- */
    const replayBtn = $('#de-replay')!;
    const onReplay = () => {
      autoStart = performance.now(); frozenT = null; scrubT = 0;
      cardsShown = false; lastCaption = -1; feed.length = 0;
      interactive = false; closeDrill();
      if (idleCycle) { clearInterval(idleCycle); idleCycle = null; }
      root.querySelectorAll('.de-stat').forEach((el) => el.classList.remove('on'));
      root.querySelectorAll('[data-counter]').forEach((el) => (el.textContent = '0'));
    };
    replayBtn.addEventListener('click', onReplay);

    /* ---------- cleanup ---------- */
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (idleCycle) clearInterval(idleCycle);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('click', onCanvasClick);
      drill.removeEventListener('click', onDrillClick);
      drillCta.removeEventListener('click', onCtaClick);
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('scroll', onScroll);
      replayBtn.removeEventListener('click', onReplay);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {/* glow halo */}
      <div
        className="absolute -inset-8 rounded-[2.5rem] opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.22), transparent 70%)' }}
        aria-hidden
      />
      <div
        className="relative rounded-3xl overflow-hidden border border-white/10"
        style={{ background: 'linear-gradient(165deg, rgba(17,24,48,0.85), rgba(10,14,30,0.9))', backdropFilter: 'blur(14px)' }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="de-live w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-extrabold text-white text-[13.5px] sm:text-sm truncate">PASS Diagnostic Engine</div>
              <div id="de-caption" className="text-[11.5px] text-indigo-300/90 truncate font-medium" style={{ transition: 'opacity 0.35s ease' }}>Initializing…</div>
              <div className="flex items-center gap-1.5 mt-1.5" aria-hidden>
                <span className="de-seg" /><span className="de-seg" /><span className="de-seg" /><span className="de-seg" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex text-[10.5px] font-semibold tracking-wide uppercase text-indigo-300/80 bg-indigo-500/10 border border-indigo-400/20 rounded-md px-2 py-1">Praxis 5403</span>
            <button id="de-replay" type="button" title="Replay breakdown" className="w-7 h-7 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/25 transition-all flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            </button>
          </div>
        </div>

        {/* canvas */}
        <div id="de-map" className="relative h-[420px] sm:h-[440px] lg:h-[470px] overflow-hidden">
          <canvas id="de-skill-map" className="absolute inset-0 w-full h-full" />
          <div id="de-tooltip" className="absolute z-10 rounded-lg px-3 py-2 text-[12px] opacity-0 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(14px)', transition: 'opacity 0.15s ease', pointerEvents: 'none' }}>
            <div id="de-tt-name" className="font-semibold text-white whitespace-nowrap" />
            <div id="de-tt-status" className="text-[11px] mt-0.5" />
            <div id="de-tt-extra" className="text-[10.5px] mt-0.5 text-indigo-300 hidden" />
          </div>

          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto z-[5]">
            <div className="rounded-lg px-3 py-1.5 inline-flex max-w-full border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(14px)' }}>
              <span id="de-ticker" className="text-[10.5px] sm:text-[11px] text-slate-400 truncate" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>› engine ready</span>
            </div>
          </div>

          {/* scroll-to-run cue */}
          <div id="de-run-cue" className="absolute inset-0 z-[6] flex flex-col items-center justify-end pb-16 pointer-events-none">
            <div className="rounded-full px-4 py-2 flex items-center gap-2 text-[12px] font-medium text-indigo-100 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(14px)' }}>
              <span>Scroll to run your diagnosis</span>
              <svg className="chev w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>

          {/* tap-to-explore hint */}
          <div id="de-explore-hint" className="absolute top-3 left-1/2 -translate-x-1/2 z-[6] pointer-events-none">
            <div className="rounded-full px-3.5 py-1.5 flex items-center gap-2 text-[11.5px] font-medium text-emerald-100 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(14px)' }}>
              <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              Tap a node to explore
            </div>
          </div>

          {/* drill-down sheet */}
          <div id="de-drill" className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span id="de-drill-dot" className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                  <span id="de-drill-name" className="font-extrabold text-white text-[15px] truncate">Skill</span>
                  <span id="de-drill-status" className="text-[11px] font-semibold text-rose-300">Critical gap · 41%</span>
                </div>
                <div id="de-drill-tag" className="text-[11px] text-indigo-300 mt-1 hidden" />
              </div>
              <button id="de-drill-close" type="button" className="shrink-0 w-7 h-7 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/25 transition-all flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p id="de-drill-why" className="text-[12.5px] text-slate-400 leading-relaxed mt-2.5" />
            <div className="mt-3">
              <div id="de-drill-conn-label" className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Connected micro-skills</div>
              <div id="de-drill-connected" className="flex flex-wrap gap-1.5" />
            </div>
            <button id="de-drill-cta" type="button" className="text-[12px] font-medium text-indigo-200 mt-3 hidden hover:text-white transition-colors">Your plan starts here →</button>
          </div>
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border-t border-white/[0.07]">
          <div className="de-stat bg-[#0c1226]/90 px-4 py-3" data-stat="baseline">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Adaptive Baseline</div>
            <div className="font-extrabold text-white text-xl mt-0.5"><span data-counter data-target="68">0</span>%</div>
            <div className="text-[10px] text-slate-600 mt-0.5">measured, not guessed</div>
          </div>
          <div className="de-stat bg-[#0c1226]/90 px-4 py-3" data-stat="targeted">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Micro-skills Targeted</div>
            <div className="font-extrabold text-amber-300 text-xl mt-0.5"><span data-counter data-target="14">0</span></div>
            <div className="text-[10px] text-slate-600 mt-0.5">ranked by impact</div>
          </div>
          <div className="de-stat bg-[#0c1226]/90 px-4 py-3" data-stat="gaps">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Critical Gaps Found</div>
            <div className="font-extrabold text-rose-300 text-xl mt-0.5"><span data-counter data-target="3">0</span></div>
            <div className="text-[10px] text-slate-600 mt-0.5">priorities 1–3, week one</div>
          </div>
          <div className="de-stat bg-[#0c1226]/90 px-4 py-3 flex items-center gap-2.5" data-stat="path">
            <span className="w-7 h-7 rounded-full bg-emerald-400/15 border border-emerald-300/30 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
            </span>
            <div className="font-semibold text-emerald-200 text-[12.5px] leading-tight">Growth Path Generated</div>
          </div>
        </div>

        {/* legend */}
        <div className="flex items-center justify-center gap-4 sm:gap-5 px-4 py-3 border-t border-white/[0.07] text-[11px] sm:text-[11.5px] text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400" /> Skill domain</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Mastered</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Developing</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> Critical gap</span>
        </div>
      </div>
    </div>
  );
}
