import { cn } from "@/lib/utils";

/**
 * Background flowers for the storefront: a five-petal bloom, a daisy, a leafy
 * sprig and loose falling petals. All inline SVG in currentColor, so a
 * text-* class tints them and they cost no request.
 *
 * They are decoration only — every one is aria-hidden, ignores the pointer,
 * and holds still when the visitor has asked for reduced motion.
 */

type Props = { className?: string; outline?: boolean };

const still = "motion-reduce:animate-none";

/** Five round petals around a centre, like the logo's own flower. */
export function Bloom({ className, outline }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={cn("pointer-events-none", className)}
      fill={outline ? "none" : "currentColor"}
      stroke={outline ? "currentColor" : "none"}
      strokeWidth={outline ? 1.4 : 0}
    >
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="27"
          rx="15"
          ry="22"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle
        cx="50"
        cy="50"
        r="9"
        className={outline ? undefined : "fill-gold"}
      />
    </svg>
  );
}

/** Twelve slim petals — a daisy. */
export function Daisy({ className, outline }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={cn("pointer-events-none", className)}
      fill={outline ? "none" : "currentColor"}
      stroke={outline ? "currentColor" : "none"}
      strokeWidth={outline ? 1.2 : 0}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse
          key={i}
          cx="50"
          cy="23"
          rx="6"
          ry="19"
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <circle
        cx="50"
        cy="50"
        r="10"
        className={outline ? undefined : "fill-gold"}
      />
    </svg>
  );
}

/** One almond leaf, drawn along +x from the origin. */
const LEAF = "M0 0C6-8 18-8 26 0C18 8 6 8 0 0Z";

/**
 * A stem with alternating leaves. Its transform origin is the foot of the
 * stem, so the sway animation bends it like a plant rather than spinning it.
 */
export function LeafSprig({ className }: { className?: string }) {
  const leaves: [number, number, number, number][] = [
    // x, y, angle, scale
    [31, 98, -28, 1],
    [30, 86, -152, 1],
    [31, 72, -30, 0.92],
    [30, 59, -150, 0.88],
    [31, 46, -34, 0.8],
    [30, 34, -146, 0.72],
    [30, 22, -40, 0.6],
  ];

  return (
    <svg
      viewBox="0 0 60 124"
      aria-hidden
      className={cn("pointer-events-none origin-bottom", className)}
      fill="currentColor"
    >
      <path
        d="M30 122C28 94 34 62 30 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {leaves.map(([x, y, angle, scale]) => (
        <path
          key={y}
          d={LEAF}
          transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}
        />
      ))}
      <path d={LEAF} transform="translate(30 12) rotate(-90) scale(0.55)" />
    </svg>
  );
}

/** A single petal, for the falling ones. */
function Petal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M10 0C18 6 19 16 10 24C1 16 2 6 10 0Z"
      />
    </svg>
  );
}

/**
 * Fixed, not random, positions: the page renders on the server, and random
 * values would differ between server and browser. Staggered delays and
 * durations keep the fall from looking like a pattern.
 */
const PETALS = [
  { left: "6%", size: 14, delay: 0, duration: 15, drift: 90, spin: 320, tone: "text-blush-deep" },
  { left: "18%", size: 10, delay: 6, duration: 12, drift: -60, spin: -260, tone: "text-gold/70" },
  { left: "32%", size: 16, delay: 3, duration: 17, drift: 70, spin: 380, tone: "text-blush-deep" },
  { left: "47%", size: 11, delay: 9, duration: 13, drift: -80, spin: -300, tone: "text-forest/35" },
  { left: "61%", size: 13, delay: 1.5, duration: 16, drift: 60, spin: 280, tone: "text-gold/60" },
  { left: "74%", size: 15, delay: 7.5, duration: 14, drift: -90, spin: -340, tone: "text-blush-deep" },
  { left: "86%", size: 10, delay: 4, duration: 12.5, drift: 50, spin: 260, tone: "text-forest/30" },
  { left: "94%", size: 12, delay: 10.5, duration: 15.5, drift: -70, spin: -300, tone: "text-gold/70" },
];

/**
 * Petals drifting down through their container. The parent must be
 * `relative overflow-hidden`; --fall should roughly match its height.
 * Hidden entirely for reduced motion, since a frozen petal is just a smudge.
 */
export function FallingPetals({
  fall = 820,
  className,
}: {
  fall?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 motion-reduce:hidden",
        className,
      )}
    >
      {PETALS.map((petal) => (
        <span
          key={petal.left}
          className={cn("absolute -top-8 animate-petal", petal.tone)}
          style={
            {
              left: petal.left,
              width: petal.size,
              height: petal.size * 1.2,
              animationDelay: `${petal.delay}s`,
              animationDuration: `${petal.duration}s`,
              "--drift": `${petal.drift}px`,
              "--spin": `${petal.spin}deg`,
              "--fall": `${fall}px`,
            } as React.CSSProperties
          }
        >
          <Petal className="size-full" />
        </span>
      ))}
    </div>
  );
}

/**
 * Large, faint flowers turning very slowly behind the whole storefront, out
 * at the edges where a wide screen is otherwise empty. Fixed, so they stay
 * put while the page scrolls over them.
 */
export function GardenBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <Bloom
        outline
        className={cn(
          "absolute -top-16 -left-20 size-72 animate-spin-slower text-gold/25",
          still,
        )}
      />
      <Daisy
        outline
        className={cn(
          "absolute top-1/3 -right-24 size-80 animate-spin-slower text-forest/10 [animation-direction:reverse]",
          still,
        )}
      />
      <Bloom
        outline
        className={cn(
          "absolute -bottom-20 left-[12%] size-64 animate-spin-slower text-blush-deep/70",
          still,
        )}
      />
      <LeafSprig
        className={cn(
          "absolute right-[8%] -bottom-6 hidden h-72 animate-sway text-forest/10 lg:block",
          still,
        )}
      />
    </div>
  );
}
