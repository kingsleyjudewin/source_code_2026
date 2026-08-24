'use client';

import type { EventUniverse } from '@/data/events';

/**
 * Per-universe DOM backdrop.
 *
 * These layers sit between the global WebGL canvas and the section content.
 * Keeping them in the DOM (SVG + CSS) rather than in WebGL means each universe
 * costs almost nothing on the GPU, which is what leaves the budget free for the
 * particle systems and bloom.
 */
export default function UniverseBackdrop({ universe }: { universe: EventUniverse }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {universe === 'stark-lab' && <StarkLab />}
      {universe === 'newsroom' && <Newsroom />}
      {universe === 'knowledge' && <Knowledge />}
      {universe === 'infinity' && <Infinity />}
      {universe === 'cyber' && <Cyber />}
    </div>
  );
}

/* -- BRAND NEW CIRCUIT: PCB traces, pads, travelling current ---------------- */
function StarkLab() {
  return (
    <>
      <div className="absolute inset-0 grid-floor opacity-40" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.55]" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="trace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--section-accent)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--section-accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--section-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="var(--section-accent)" strokeOpacity="0.22" fill="none" strokeWidth="1.5">
          <path d="M0 140h250l60 60h220l50-50h300l70 70h230" />
          <path d="M0 320h180l70-70h260l60 60h180l80 80h370" />
          <path d="M0 520h300l80 80h190l60-60h240l70 70h260" />
          <path d="M0 680h140l90-90h300l50 50h180l60-60h380" />
          <path d="M180 0v120M480 0v90M760 0v140M1020 0v70" />
          <path d="M240 800v-120M600 800v-90M900 800v-160" />
        </g>
        {/* Solder pads */}
        <g fill="var(--section-accent)" fillOpacity="0.5">
          {[[250, 140], [530, 200], [880, 190], [180, 320], [560, 310], [820, 380], [300, 520], [570, 600], [860, 540], [230, 590], [780, 470]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" className="pad" style={{ animationDelay: `${i * 0.35}s` }} />
          ))}
        </g>
        {/* Travelling current pulses */}
        <g strokeWidth="2.5" fill="none" stroke="url(#trace)">
          <path d="M0 140h250l60 60h220l50-50h300l70 70h230" className="current" />
          <path d="M0 520h300l80 80h190l60-60h240l70 70h260" className="current" style={{ animationDelay: '1.4s' }} />
        </g>

        {/* Oscilloscope traces — one sine, one square, both sweeping. */}
        <g fill="none" strokeWidth="2" opacity="0.6">
          <path
            className="scope-wave"
            stroke="var(--section-accent)"
            d="M60 250q30-55 60 0t60 0 60 0 60 0 60 0 60 0"
          />
          <path
            className="scope-wave scope-wave--square"
            stroke="var(--color-quantum)"
            d="M780 640h40v-46h40v46h40v-46h40v46h40v-46h40v46h40"
          />
        </g>

        {/* Logic gates */}
        <g className="gate-group" fill="none" stroke="var(--section-accent)" strokeWidth="2">
          {/* AND */}
          <g className="gate" transform="translate(430 660)">
            <path d="M0 0h20a26 26 0 0 1 0 52H0Z" />
            <path d="M-16 12h16M-16 40h16M46 26h16" strokeWidth="1.6" />
          </g>
          {/* OR */}
          <g className="gate" style={{ animationDelay: '1.1s' }} transform="translate(980 120)">
            <path d="M0 0q26 26 0 52 34 0 48-26Q34 0 0 0Z" />
            <path d="M-16 12h14M-16 40h14M50 26h16" strokeWidth="1.6" />
          </g>
          {/* NOT */}
          <g className="gate" style={{ animationDelay: '2.2s' }} transform="translate(150 470)">
            <path d="M0 0v44l38-22Z" />
            <circle cx="43" cy="22" r="5" />
            <path d="M-16 22h16M52 22h16" strokeWidth="1.6" />
          </g>
        </g>

        {/* Holographic schematic plates drifting behind everything. */}
        <g className="pcb-group" fill="none" stroke="var(--section-accent)" strokeWidth="1.2" opacity="0.35">
          <g className="pcb" transform="translate(700 300)">
            <rect width="130" height="88" rx="6" />
            <path d="M14 22h44M14 44h64M14 66h34M92 22v54" />
            <rect x="86" y="30" width="30" height="24" rx="3" />
          </g>
          <g className="pcb" style={{ animationDelay: '2.6s' }} transform="translate(300 60)">
            <rect width="104" height="70" rx="6" />
            <path d="M12 18h36M12 36h52M12 54h28M74 18v40" />
            <rect x="70" y="24" width="24" height="18" rx="3" />
          </g>
        </g>
      </svg>
    </>
  );
}

/* -- DAILY BUGLE: newsprint, halftone, shutter flashes ---------------------- */
function Newsroom() {
  return (
    <>
      <div className="absolute inset-0 newsprint opacity-[0.14]" />
      <div className="absolute inset-0 halftone opacity-[0.12]" />
      <div className="absolute inset-0 shutter-flash" />
      {/* Drifting polaroids */}
      {[
        { top: '12%', left: '6%', rot: -9, delay: 0 },
        { top: '62%', left: '3%', rot: 7, delay: 1.6 },
        { top: '24%', right: '5%', rot: 11, delay: 0.8 },
        { top: '72%', right: '9%', rot: -6, delay: 2.4 },
      ].map((p, i) => (
        <span
          key={i}
          className="polaroid"
          style={{
            top: p.top,
            left: p.left,
            right: p.right,
            ['--rot' as string]: `${p.rot}deg`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}

/* -- BRAINVERSE: synapse web ------------------------------------------------ */
function Knowledge() {
  const nodes = [
    [140, 180], [320, 120], [520, 230], [700, 140], [880, 250], [1060, 170],
    [200, 420], [400, 500], [610, 420], [820, 520], [1010, 430],
    [300, 680], [560, 700], [780, 660], [980, 720],
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 6], [2, 7], [3, 8], [5, 10],
    [6, 7], [7, 8], [8, 9], [9, 10], [6, 11], [7, 12], [8, 13], [10, 14], [11, 12], [12, 13], [13, 14],
  ];
  return (
    <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
      <g stroke="var(--section-accent)" strokeOpacity="0.28" strokeWidth="1.2">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a][0]} y1={nodes[a][1]}
            x2={nodes[b][0]} y2={nodes[b][1]}
            className="synapse"
            style={{ animationDelay: `${(i % 7) * 0.45}s` }}
          />
        ))}
      </g>
      <g fill="var(--section-accent)">
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" className="neuron" style={{ animationDelay: `${(i % 5) * 0.6}s` }} />
        ))}
      </g>
    </svg>
  );
}

/* -- THE GAUNTLET: cosmic rifts (stones live in WebGL) ---------------------- */
function Infinity() {
  return (
    <>
      <div className="absolute inset-0 cosmic-rift" />
      <div className="absolute inset-0 grid-floor opacity-20" />
    </>
  );
}

/* -- STARK FORGE: binary rain + hex grid ------------------------------------ */

/**
 * Deterministic bit pattern per column.
 *
 * Math.random() here would produce different markup on the server and the
 * client and blow up hydration. A tiny LCG keyed on the column index gives the
 * same visual scatter with identical output on both.
 */
function bits(column: number, length: number) {
  let seed = (column * 1103515245 + 12345) >>> 0;
  let out = '';
  for (let i = 0; i < length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    out += (seed >>> 16) & 1 ? '1 ' : '0 ';
  }
  return out.trim();
}

function Cyber() {
  const columns = 26;
  return (
    <>
      <div className="absolute inset-0 hexgrid opacity-[0.18]" />
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: columns }).map((_, i) => (
          <span
            key={i}
            className="binary-column"
            style={{
              left: `${(i / columns) * 100}%`,
              animationDelay: `${(i * 0.37) % 5}s`,
              animationDuration: `${6 + ((i * 1.7) % 5)}s`,
            }}
          >
            {bits(i, 26)}
          </span>
        ))}
      </div>
    </>
  );
}
