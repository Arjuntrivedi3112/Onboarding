import { motion, useReducedMotion } from "framer-motion";

/**
 * A small looping picture of a bid travelling the supply chain: advertiser →
 * DSP → exchange → SSP → publisher, with an impression flowing back. Used as
 * the decorative panel on the sign-in pages and the Lab gallery header.
 * Purely decorative — hidden from assistive technology.
 */

const NODES = [
  { id: "advertiser", label: "Advertiser", tone: "var(--chain-advertiser)" },
  { id: "dsp", label: "DSP", tone: "var(--chain-dsp)" },
  { id: "exchange", label: "Exchange", tone: "var(--chain-exchange)" },
  { id: "ssp", label: "SSP", tone: "var(--chain-ssp)" },
  { id: "publisher", label: "Publisher", tone: "var(--chain-publisher)" },
];

const WIDTH = 520;
const HEIGHT = 140;
const STEP = WIDTH / (NODES.length + 1);
const Y = 70;

export function SupplyChainPulse({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="scp-line" x1="0" x2="1" y1="0" y2="0">
          {NODES.map((n, i) => (
            <stop key={n.id} offset={`${(i / (NODES.length - 1)) * 100}%`} stopColor={`hsl(${n.tone})`} />
          ))}
        </linearGradient>
      </defs>

      <line
        x1={STEP}
        x2={STEP * NODES.length}
        y1={Y}
        y2={Y}
        stroke="url(#scp-line)"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.55}
      />

      {/* Bid request travelling supply-ward, impression returning. */}
      {!reduce && (
        <>
          <motion.circle
            r={6}
            cy={Y}
            fill="hsl(var(--primary))"
            initial={{ cx: STEP }}
            animate={{ cx: [STEP, STEP * NODES.length] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            r={4}
            cy={Y + 14}
            fill="hsl(var(--floor))"
            initial={{ cx: STEP * NODES.length }}
            animate={{ cx: [STEP * NODES.length, STEP] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
        </>
      )}

      {NODES.map((n, i) => {
        const cx = STEP * (i + 1);
        return (
          <g key={n.id}>
            {!reduce && (
              <motion.circle
                cx={cx}
                cy={Y}
                r={16}
                fill={`hsl(${n.tone})`}
                initial={{ opacity: 0.15, scale: 1 }}
                animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.35, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
                style={{ transformOrigin: `${cx}px ${Y}px` }}
              />
            )}
            <circle cx={cx} cy={Y} r={11} fill="hsl(var(--card))" stroke={`hsl(${n.tone})`} strokeWidth={3} />
            <text
              x={cx}
              y={Y + 40}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 12 }}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
