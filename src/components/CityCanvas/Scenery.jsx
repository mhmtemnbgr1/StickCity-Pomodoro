import React, { useMemo } from 'react';

// Deterministic PRNG so the scenery is identical on every render / reload
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OUT = '#173a22';

/* ------------------------------ TREES ------------------------------ */
function Oak() {
  return (
    <svg width="64" height="84" viewBox="0 0 64 84" overflow="visible">
      <ellipse cx="32" cy="80" rx="20" ry="4.5" fill="rgba(0,0,0,0.22)" />
      <path d="M28 46 L27 80 L37 80 L36 46 Z" fill="#8a5a2b" stroke="#4a2f14" strokeWidth="2" strokeLinejoin="round" />
      <path d="M33 50 L33 80 L37 80 L36 50 Z" fill="#6e4520" opacity="0.7" />
      <g stroke={OUT} strokeWidth="2">
        <circle cx="18" cy="38" r="15" fill="#2f8f46" />
        <circle cx="46" cy="38" r="15" fill="#2f8f46" />
        <circle cx="32" cy="22" r="19" fill="#3aa956" />
        <circle cx="32" cy="42" r="17" fill="#3aa956" />
      </g>
      <circle cx="25" cy="16" r="7" fill="#63c97a" opacity="0.7" />
      <circle cx="12" cy="33" r="4.5" fill="#63c97a" opacity="0.55" />
      <circle cx="38" cy="34" r="3.5" fill="#63c97a" opacity="0.45" />
    </svg>
  );
}

function Pine() {
  return (
    <svg width="52" height="92" viewBox="0 0 52 92" overflow="visible">
      <ellipse cx="26" cy="88" rx="15" ry="3.8" fill="rgba(0,0,0,0.22)" />
      <rect x="22" y="70" width="8" height="18" rx="1.5" fill="#7a4d24" stroke="#4a2f14" strokeWidth="2" />
      <g stroke={OUT} strokeWidth="2" strokeLinejoin="round">
        <polygon points="26,36 4,74 48,74" fill="#1f7a3c" />
        <polygon points="26,20 8,54 44,54" fill="#2a9150" />
        <polygon points="26,4 11,36 41,36" fill="#37a862" />
      </g>
      <polygon points="26,8 18,30 26,26" fill="#6ed089" opacity="0.55" />
      <polygon points="26,24 15,48 26,44" fill="#52bd77" opacity="0.4" />
    </svg>
  );
}

function Birch() {
  return (
    <svg width="48" height="88" viewBox="0 0 48 88" overflow="visible">
      <ellipse cx="24" cy="84" rx="14" ry="3.6" fill="rgba(0,0,0,0.22)" />
      <rect x="20" y="40" width="8" height="44" rx="2" fill="#f1ede2" stroke="#6b665a" strokeWidth="2" />
      <g fill="#3a3a3a">
        <rect x="21" y="52" width="4" height="2" rx="1" />
        <rect x="24" y="62" width="3" height="2" rx="1" />
        <rect x="21" y="72" width="4" height="2" rx="1" />
      </g>
      <g stroke="#3d7f2c" strokeWidth="2">
        <ellipse cx="24" cy="24" rx="17" ry="22" fill="#8fd16a" />
        <ellipse cx="14" cy="38" rx="10" ry="12" fill="#7cc358" />
        <ellipse cx="35" cy="38" rx="10" ry="12" fill="#7cc358" />
      </g>
      <ellipse cx="19" cy="16" rx="5" ry="8" fill="#c1ea9f" opacity="0.7" />
    </svg>
  );
}

function AppleTree() {
  return (
    <svg width="60" height="80" viewBox="0 0 60 80" overflow="visible">
      <ellipse cx="30" cy="76" rx="19" ry="4.2" fill="rgba(0,0,0,0.22)" />
      <path d="M26 44 L25 76 L35 76 L34 44 Z" fill="#8a5a2b" stroke="#4a2f14" strokeWidth="2" strokeLinejoin="round" />
      <g stroke={OUT} strokeWidth="2">
        <circle cx="17" cy="36" r="14" fill="#3f9e4d" />
        <circle cx="43" cy="36" r="14" fill="#3f9e4d" />
        <circle cx="30" cy="22" r="17" fill="#4cb85c" />
        <circle cx="30" cy="40" r="15" fill="#4cb85c" />
      </g>
      <g fill="#e5383b" stroke="#8a1c1f" strokeWidth="1">
        <circle cx="22" cy="26" r="3" />
        <circle cx="38" cy="30" r="3" />
        <circle cx="30" cy="42" r="3" />
        <circle cx="14" cy="40" r="3" />
        <circle cx="46" cy="42" r="3" />
      </g>
    </svg>
  );
}

const TREE_TYPES = [Oak, Pine, Birch, AppleTree, Oak, Pine];

/* ------------------------------ SMALL DECOR ------------------------------ */
function Bush() {
  return (
    <svg width="40" height="26" viewBox="0 0 40 26" overflow="visible">
      <ellipse cx="20" cy="24" rx="16" ry="3" fill="rgba(0,0,0,0.2)" />
      <g stroke={OUT} strokeWidth="2">
        <circle cx="11" cy="16" r="9" fill="#2f8f46" />
        <circle cx="29" cy="16" r="9" fill="#2f8f46" />
        <circle cx="20" cy="12" r="10" fill="#3aa956" />
      </g>
      <circle cx="16" cy="8" r="3" fill="#63c97a" opacity="0.7" />
    </svg>
  );
}

function Flowers({ hue }) {
  const colors = [['#ff6b9d', '#ffe066'], ['#ffd43b', '#fff'], ['#b197fc', '#ffe066'], ['#ff8787', '#fff']][hue % 4];
  return (
    <svg width="34" height="22" viewBox="0 0 34 22" overflow="visible">
      {[[6, 16], [16, 10], [26, 17], [11, 19], [22, 20]].map(([x, y], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={x} y2={y + 5} stroke="#2a7a3a" strokeWidth="1.5" />
          {[0, 72, 144, 216, 288].map(a => (
            <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 2.6} cy={y + Math.sin((a * Math.PI) / 180) * 2.6} r="1.9" fill={colors[0]} />
          ))}
          <circle cx={x} cy={y} r="1.5" fill={colors[1]} />
        </g>
      ))}
    </svg>
  );
}

function Rock() {
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" overflow="visible">
      <ellipse cx="15" cy="18" rx="12" ry="2.5" fill="rgba(0,0,0,0.2)" />
      <polygon points="3,18 7,7 15,3 24,7 27,18" fill="#9aa3b2" stroke="#4b5363" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="7,7 15,3 14,12" fill="#c3cad6" opacity="0.7" />
    </svg>
  );
}

function Stump() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" overflow="visible">
      <ellipse cx="11" cy="18" rx="9" ry="2.2" fill="rgba(0,0,0,0.2)" />
      <path d="M4 8 L4 16 Q11 20 18 16 L18 8 Z" fill="#8a5a2b" stroke="#4a2f14" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="11" cy="8" rx="7" ry="3.2" fill="#d9a066" stroke="#4a2f14" strokeWidth="2" />
      <ellipse cx="11" cy="8" rx="3" ry="1.2" fill="none" stroke="#a8703a" strokeWidth="1" />
    </svg>
  );
}

/* ------------------------------ PLACEMENT ------------------------------ */
function generateScenery() {
  const rnd = mulberry32(20240607);
  const items = [];

  const tooClose = (x, y, minD) =>
    items.some(it => {
      const dx = (it.x - x) * 1.7; // x % is wider than y % on screen
      const dy = it.y - y;
      return dx * dx + dy * dy < minD * minD;
    });

  // Border zones (x/y are percentages; y is the BASE of the item)
  const zones = [
    { n: 11, x: [1.5, 98.5], y: [13, 24], skipX: [44, 56] },  // top band
    { n: 11, x: [1.5, 98.5], y: [92, 99], skipX: [44, 56] },  // bottom band
    { n: 7, x: [1.5, 8], y: [26, 90], skipY: [44, 56] },      // left band
    { n: 7, x: [92, 98.5], y: [26, 90], skipY: [44, 56] },    // right band
  ];

  let id = 0;
  for (const z of zones) {
    let placed = 0;
    let guard = 0;
    while (placed < z.n && guard++ < 200) {
      const x = z.x[0] + rnd() * (z.x[1] - z.x[0]);
      const y = z.y[0] + rnd() * (z.y[1] - z.y[0]);
      if (z.skipX && x > z.skipX[0] && x < z.skipX[1]) continue;
      if (z.skipY && y > z.skipY[0] && y < z.skipY[1]) continue;
      if (tooClose(x, y, 6.5)) continue;
      items.push({
        id: id++, kind: 'tree', x, y,
        variant: Math.floor(rnd() * TREE_TYPES.length),
        scale: 0.85 + rnd() * 0.45,
        delay: -rnd() * 4,
      });
      placed++;
    }
  }

  // Small decor sprinkled through the field (kept away from the central paths)
  for (let i = 0; i < 46; i++) {
    const x = 3 + rnd() * 94;
    const y = 20 + rnd() * 76;
    if (Math.abs(x - 50) < 4 || Math.abs(y - 50) < 4) continue;
    if (tooClose(x, y, 3)) continue;
    const r = rnd();
    items.push({
      id: id++,
      kind: r < 0.42 ? 'flower' : r < 0.7 ? 'bush' : r < 0.92 ? 'rock' : 'stump',
      x, y,
      hue: Math.floor(rnd() * 4),
      scale: 0.85 + rnd() * 0.4,
      delay: -rnd() * 4,
    });
  }
  return items;
}

export default function Scenery() {
  const items = useMemo(generateScenery, []);

  return (
    <>
      {items.map(it => {
        const style = {
          left: `${it.x}%`,
          top: `${it.y}%`,
          zIndex: Math.floor(it.y),
          '--s': it.scale,
          '--d': `${it.delay}s`,
        };
        if (it.kind === 'tree') {
          const T = TREE_TYPES[it.variant];
          return <div key={it.id} className="deco deco-tree" style={style}><T /></div>;
        }
        return (
          <div key={it.id} className={`deco deco-${it.kind}`} style={style}>
            {it.kind === 'flower' && <Flowers hue={it.hue} />}
            {it.kind === 'bush' && <Bush />}
            {it.kind === 'rock' && <Rock />}
            {it.kind === 'stump' && <Stump />}
          </div>
        );
      })}
    </>
  );
}
