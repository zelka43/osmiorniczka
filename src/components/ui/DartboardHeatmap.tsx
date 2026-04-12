"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Match } from "@/types";

interface DartboardHeatmapProps {
  matches: Match[];
  playerId: string;
}

// Clockwise order of segments starting from top (segment 20 is at the top)
const SEGMENT_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

// Dartboard radii (in SVG units, centre at 150,150, total r=150)
const R_BULL_INNER = 9;      // bullseye (double bull)
const R_BULL_OUTER = 22;     // outer bull (single bull / 25)
const R_SINGLE_INNER = 95;   // inner edge of triple ring (= outer edge of inner single)
const R_TRIPLE_OUTER = 108;  // outer edge of triple ring
const R_DOUBLE_INNER = 143;  // inner edge of double ring
const R_DOUBLE_OUTER = 150;  // board edge

const CX = 150;
const CY = 150;

/** Convert polar coordinates (degrees from top, clockwise) to Cartesian. */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * Build an SVG path string for an annular sector (ring slice).
 * Angles in degrees, 0° = top, clockwise.
 */
function annularSectorPath(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  startAngle: number,
  endAngle: number
): string {
  const p1 = polarToCartesian(cx, cy, r1, startAngle);
  const p2 = polarToCartesian(cx, cy, r1, endAngle);
  const p3 = polarToCartesian(cx, cy, r2, endAngle);
  const p4 = polarToCartesian(cx, cy, r2, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${r1} ${r1} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${r2} ${r2} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

/** Interpolate a neon color at a given intensity [0..1]. */
function neonColor(hex: string, intensity: number): string {
  const alpha = 0.08 + intensity * 0.77; // 0.08 → 0.85
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

const COLOR_SINGLE = "#3b82f6"; // neon-blue
const COLOR_TRIPLE = "#a855f7"; // neon-purple
const COLOR_DOUBLE = "#22c55e"; // neon-green
const COLOR_BULL   = "#ef4444"; // neon-red

export default function DartboardHeatmap({ matches, playerId }: DartboardHeatmapProps) {
  const [showDoubleStats, setShowDoubleStats] = useState(false);

  // Collect dart data from detailed-mode turns only
  type HitKey = `${number}_${1 | 2 | 3}`;
  const hits: Partial<Record<HitKey, number>> = {};
  // Track checkout finishes per double (segment of last dart in isCheckout turn with multiplier 2)
  const checkoutFinishes: Partial<Record<number, number>> = {};

  let hasDetailedData = false;

  for (const match of matches) {
    if (!match.playerIds.includes(playerId)) continue;
    for (const turn of match.turns) {
      if (turn.playerId !== playerId || turn.darts.length === 0) continue;
      hasDetailedData = true;
      for (const dart of turn.darts) {
        if (dart.segment === 0) continue; // miss
        const key: HitKey = `${dart.segment}_${dart.multiplier}`;
        hits[key] = (hits[key] ?? 0) + 1;
      }
      // Track finishing double
      if (turn.isCheckout) {
        const lastDart = turn.darts[turn.darts.length - 1];
        if (lastDart && lastDart.multiplier === 2) {
          const seg = lastDart.segment; // 50 = bullseye
          checkoutFinishes[seg] = (checkoutFinishes[seg] ?? 0) + 1;
        }
      }
    }
  }

  if (!hasDetailedData) {
    return (
      <div className="flex items-center justify-center h-24 text-muted text-xs text-center opacity-60">
        Brak danych<br />(tylko tryb detailed rejestruje rzuty)
      </div>
    );
  }

  // Compute max hits per zone type for normalisation
  let maxSingle = 1;
  let maxTriple = 1;
  let maxDouble = 1;

  for (const seg of SEGMENT_ORDER) {
    maxSingle = Math.max(maxSingle, (hits[`${seg}_1`] ?? 0));
    maxTriple = Math.max(maxTriple, (hits[`${seg}_3`] ?? 0));
    maxDouble = Math.max(maxDouble, (hits[`${seg}_2`] ?? 0));
  }
  const bullHits      = hits[`50_2`] ?? 0;  // bullseye stored as segment 50, mult 2
  const outerBullHits = hits[`25_1`] ?? 0; // outer bull stored as segment 25, mult 1
  const maxBull = Math.max(1, bullHits, outerBullHits);

  const segments = SEGMENT_ORDER.map((seg, i) => {
    const startAngle = i * 18 - 9; // centre of first segment (20) at 0°, so offset by -9
    const endAngle   = startAngle + 18;

    const singleHits  = hits[`${seg}_1`] ?? 0;
    const tripleHits  = hits[`${seg}_3`] ?? 0;
    const doubleHits  = hits[`${seg}_2`] ?? 0;

    return { seg, startAngle, endAngle, singleHits, tripleHits, doubleHits };
  });

  // Build double breakdown list sorted by total hits
  const doubleBreakdown = [
    ...SEGMENT_ORDER.map((seg) => ({
      label: `D${seg}`,
      seg,
      hits: hits[`${seg}_2`] ?? 0,
      checkouts: checkoutFinishes[seg] ?? 0,
    })),
    { label: "Bull", seg: 50, hits: bullHits, checkouts: checkoutFinishes[50] ?? 0 },
  ]
    .filter((d) => d.hits > 0 || d.checkouts > 0)
    .sort((a, b) => b.hits - a.hits);

  const maxDoubleHits = Math.max(1, ...doubleBreakdown.map((d) => d.hits));

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 300 300"
        width="100%"
        style={{ maxWidth: 300 }}
        className="overflow-visible"
      >
        {/* Background circle */}
        <circle cx={CX} cy={CY} r={R_DOUBLE_OUTER} fill="rgba(0,0,0,0.6)" />

        {segments.map(({ seg, startAngle, endAngle, singleHits, tripleHits, doubleHits }) => (
          <g key={seg}>
            {/* Inner single */}
            <path
              d={annularSectorPath(CX, CY, R_BULL_OUTER, R_SINGLE_INNER, startAngle, endAngle)}
              fill={neonColor(COLOR_SINGLE, singleHits / maxSingle)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            >
              <title>{seg} (single): {singleHits}</title>
            </path>
            {/* Triple ring */}
            <path
              d={annularSectorPath(CX, CY, R_SINGLE_INNER, R_TRIPLE_OUTER, startAngle, endAngle)}
              fill={neonColor(COLOR_TRIPLE, tripleHits / maxTriple)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            >
              <title>T{seg}: {tripleHits}</title>
            </path>
            {/* Outer single */}
            <path
              d={annularSectorPath(CX, CY, R_TRIPLE_OUTER, R_DOUBLE_INNER, startAngle, endAngle)}
              fill={neonColor(COLOR_SINGLE, singleHits / maxSingle)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            >
              <title>{seg} (single): {singleHits}</title>
            </path>
            {/* Double ring */}
            <path
              d={annularSectorPath(CX, CY, R_DOUBLE_INNER, R_DOUBLE_OUTER, startAngle, endAngle)}
              fill={neonColor(COLOR_DOUBLE, doubleHits / maxDouble)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            >
              <title>D{seg}: {doubleHits}</title>
            </path>
            {/* Segment number label */}
            {(() => {
              const midAngle = (startAngle + endAngle) / 2;
              const labelR = R_DOUBLE_OUTER + 10;
              const pos = polarToCartesian(CX, CY, labelR, midAngle);
              return (
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8}
                  fill="rgba(255,255,255,0.45)"
                  fontFamily="monospace"
                >
                  {seg}
                </text>
              );
            })()}
          </g>
        ))}

        {/* Outer bull (25) */}
        <circle
          cx={CX} cy={CY} r={R_BULL_OUTER}
          fill={neonColor(COLOR_BULL, outerBullHits / maxBull)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        >
          <title>25 (outer bull): {outerBullHits}</title>
        </circle>

        {/* Bullseye (50) */}
        <circle
          cx={CX} cy={CY} r={R_BULL_INNER}
          fill={neonColor(COLOR_BULL, bullHits / maxBull)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        >
          <title>Bull (50): {bullHits}</title>
        </circle>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-muted flex-wrap justify-center">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_DOUBLE, opacity: 0.8 }} />
          Double
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_TRIPLE, opacity: 0.8 }} />
          Triple
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_SINGLE, opacity: 0.8 }} />
          Single
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_BULL, opacity: 0.8 }} />
          Bull
        </span>
      </div>

      {/* Double details toggle */}
      {doubleBreakdown.length > 0 && (
        <button
          onClick={() => setShowDoubleStats((v) => !v)}
          className="text-xs text-muted underline underline-offset-2 opacity-70 active:opacity-50"
        >
          {showDoubleStats ? "Ukryj szczegóły doubli ▲" : "Szczegóły doubli ▼"}
        </button>
      )}

      <AnimatePresence>
        {showDoubleStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden w-full"
          >
            <div className="space-y-1.5 w-full pt-1">
              <div className="grid grid-cols-[3rem_1fr_4rem_4rem] gap-x-2 text-[10px] text-muted px-1 mb-1">
                <span>Double</span>
                <span>Trafienia</span>
                <span className="text-right">Razy</span>
                <span className="text-right">Finiszów</span>
              </div>
              {doubleBreakdown.map((d) => (
                <div key={d.label} className="grid grid-cols-[3rem_1fr_4rem_4rem] gap-x-2 items-center px-1">
                  <span className="text-xs font-mono font-semibold text-neon-green">{d.label}</span>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(d.hits / maxDoubleHits) * 100}%`,
                        background: COLOR_DOUBLE,
                        opacity: 0.75,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-right text-foreground">{d.hits}</span>
                  <span className="text-[11px] font-mono text-right text-neon-purple">{d.checkouts > 0 ? d.checkouts : "—"}</span>
                </div>
              ))}
              <p className="text-[10px] text-muted text-center pt-1 opacity-60">Finiszów = trafiony jako ostatni dart meczu</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
