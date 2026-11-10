/** Brand glyphs (lucide dropped brand icons). */
export const GithubIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5A11.5 11.5 0 0 0 .5 12.1c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6a11.6 11.6 0 0 0 7.9-10.9A11.5 11.5 0 0 0 12 .5Z" /></svg>
);
export const ChromeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="12" r="3.6" /><path d="M12 8.4h9M7.9 14.4 3.4 6.6M10.1 20.9l4.5-7.8" strokeLinecap="round" /></svg>
);
export const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="lg" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#8b6cff" /><stop offset=".55" stopColor="#4f7cff" /><stop offset="1" stopColor="#22d3ee" /></linearGradient></defs>
    <rect width="64" height="64" rx="16" fill="url(#lg)" />
    <path d="M35.5 9 17 35.5h12.2L27 55l20-28H34.4L35.5 9Z" fill="#fff" />
  </svg>
);
