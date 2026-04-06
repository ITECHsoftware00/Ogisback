export default function Logo({ size = 'md', wordmark = true, className = '' }) {
  const dims = { xs: 24, sm: 30, md: 38, lg: 50, xl: 66 };
  const px = dims[size] ?? dims.md;
  const textCls = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size] ?? 'text-xl';

  /* Unique IDs per instance to avoid SVG defs collision */
  const uid = size;

  return (
    <div className={`flex items-center gap-3 ${className}`}>

      {/* ── Icon mark ─────────────────────────────────── */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* 3-stop premium gradient: deep violet → vivid purple → rose */}
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#4C1D95" />
            <stop offset="48%"  stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>

          {/* Top-left radial shine for glass depth */}
          <radialGradient id={`shine-${uid}`} cx="28%" cy="22%" r="52%">
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0"    />
          </radialGradient>

          {/* Dot glow */}
          <filter id={`glow-${uid}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arc inner-arc glow for crispness */}
          <filter id={`arcglow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background pill */}
        <rect width="56" height="56" rx="15" fill={`url(#bg-${uid})`} />

        {/* Glass shine overlay */}
        <rect width="56" height="56" rx="15" fill={`url(#shine-${uid})`} />

        {/* Inner hairline border for polish */}
        <rect
          x="1" y="1" width="54" height="54" rx="14.5"
          stroke="white" strokeOpacity="0.14" strokeWidth="1.5"
          fill="none"
        />

        {/*
          ── Broadcast icon ─────────────────────────────
          All arcs are true circular arcs (SVG A command)
          centered at the anchor dot (28, 37).

          Arc math:  M (28-r) 37  A r r 0 0 0 (28+r) 37
          sweep=0 → counterclockwise → goes UP through (28, 37-r)

          r=7  → arc top at y=30,  span x 21→35
          r=13 → arc top at y=24,  span x 15→41
          r=19 → arc top at y=18,  span x  9→47
        */}

        {/* Anchor dot */}
        <circle
          cx="28" cy="37" r="3.5"
          fill="white"
          filter={`url(#glow-${uid})`}
        />

        {/* Arc 1 — innermost (full opacity) */}
        <path
          d="M 21 37 A 7 7 0 0 0 35 37"
          stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"
          filter={`url(#arcglow-${uid})`}
        />

        {/* Arc 2 — middle */}
        <path
          d="M 15 37 A 13 13 0 0 0 41 37"
          stroke="white" strokeWidth="2.7" strokeLinecap="round" fill="none"
          strokeOpacity="0.74"
        />

        {/* Arc 3 — outer (faintest) */}
        <path
          d="M 9 37 A 19 19 0 0 0 47 37"
          stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none"
          strokeOpacity="0.38"
        />
      </svg>

      {/* ── Wordmark ───────────────────────────────────── */}
      {wordmark && (
        <span
          className={`font-heading font-extrabold ${textCls} leading-none select-none tracking-[-0.02em]`}
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
