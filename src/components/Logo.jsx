export default function Logo({ size = 'md', wordmark = true, className = '' }) {
  const dims = { xs: 24, sm: 30, md: 38, lg: 50, xl: 66 };
  const px   = dims[size] ?? dims.md;
  const textCls = {
    xs: 'text-sm', sm: 'text-base', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl',
  }[size] ?? 'text-xl';

  const uid = size; // unique per size so SVG defs don't collide

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>

      {/* ── Icon mark ── */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Main background gradient: deep indigo → violet → rose */}
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#2E1065" />
            <stop offset="52%"  stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>

          {/* Top-left glass shine */}
          <radialGradient id={`shine-${uid}`} cx="28%" cy="18%" r="55%">
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0"    />
          </radialGradient>

          {/* Soft glow behind sparkle */}
          <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle dot glow */}
          <filter id={`dotglow-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background rounded square */}
        <rect width="56" height="56" rx="14" fill={`url(#bg-${uid})`} />

        {/* Glass shine overlay */}
        <rect width="56" height="56" rx="14" fill={`url(#shine-${uid})`} />

        {/* Hairline inner border */}
        <rect
          x="1" y="1" width="54" height="54" rx="13.5"
          stroke="white" strokeOpacity="0.14" strokeWidth="1.5"
          fill="none"
        />

        {/*
          ── 4-pointed sparkle (✦) ──────────────────────────
          Outer radius = 17  → points at N(28,11) E(45,28) S(28,45) W(11,28)
          Inner radius = 7   → concave points at (33,23) (33,33) (23,33) (23,23)
        */}

        {/* Bloom/glow layer (blurred duplicate) */}
        <path
          d="M28 11 L33 23 L45 28 L33 33 L28 45 L23 33 L11 28 L23 23 Z"
          fill="white"
          fillOpacity="0.35"
          filter={`url(#glow-${uid})`}
        />

        {/* Crisp sparkle */}
        <path
          d="M28 11 L33 23 L45 28 L33 33 L28 45 L23 33 L11 28 L23 23 Z"
          fill="white"
        />

        {/* Accent dot — top-right (signal / live indicator) */}
        <circle
          cx="43.5" cy="12.5" r="2.8"
          fill="white" fillOpacity="0.6"
          filter={`url(#dotglow-${uid})`}
        />

        {/* Accent dot — bottom-left (subtle balance) */}
        <circle cx="12.5" cy="43.5" r="1.8" fill="white" fillOpacity="0.28" />
      </svg>

      {/* ── Wordmark ── */}
      {wordmark && (
        <span
          className={`font-heading font-extrabold ${textCls} leading-none select-none tracking-[-0.025em]`}
        >
          <span className="text-gray-900 dark:text-white">Ogis</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Back
          </span>
        </span>
      )}
    </div>
  );
}
