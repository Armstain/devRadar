// The radar glyph sized and stroked like a lucide icon, for the "Radar" nav item.
export function LogoMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 12 L18.5 6" />
      <circle cx="15.5" cy="14.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
