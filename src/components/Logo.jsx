export default function Logo({ size = 'md', wordmark = true, className = '' }) {
  const dims = { xs: 24, sm: 28, md: 36, lg: 48, xl: 64 };
  const px = dims[size] ?? dims.md;
  const textCls = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size] ?? 'text-lg';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* ── Icon mark ── */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Primary gradient: purple → pink */}
          <linearGradient id="og-g1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="og-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip to rounded square */}
          <clipPath id="og-clip">
            <rect width="48" height="48" rx="13" />
          </clipPath>
        </defs>

        {/* Background */}
        <rect width="48" height="48" rx="13" fill="url(#og-g1)" />

        {/* Subtle inner highlight */}
        <rect
          x="1" y="1" width="46" height="23" rx="12"
          fill="white" fillOpacity="0.08"
        />

        {/* ── Signal / broadcast icon ── */}
        {/* Bottom center dot */}
        <circle cx="24" cy="35" r="3.2" fill="white" filter="url(#og-glow)" />

        {/* Arc 1 — smallest */}
        <path
          d="M16.5 27.5 C16.5 22.5 31.5 22.5 31.5 27.5"
          stroke="white" strokeWidth="2.6" strokeLinecap="round" fill="none"
        />

        {/* Arc 2 — medium */}
        <path
          d="M10.5 22 C10.5 13.5 37.5 13.5 37.5 22"
          stroke="white" strokeWidth="2.6" strokeLinecap="round" fill="none"
          strokeOpacity="0.75"
        />

        {/* Arc 3 — outer, faded */}
        <path
          d="M5 17 C5 5.5 43 5.5 43 17"
          stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none"
          strokeOpacity="0.35"
        />
      </svg>

      {/* ── Wordmark ── */}
      {wordmark && (
        <span
          className={`font-heading font-bold ${textCls} tracking-tight leading-none text-gray-900 dark:text-white select-none`}
        >
          Ogis
          <span
            style={{
              background: 'linear-gradient(135deg,#7C3AED 0%,#EC4899 100%)',
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
