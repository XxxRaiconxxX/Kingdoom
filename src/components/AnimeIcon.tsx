import type { SVGProps } from "react";

/** Original kitsune crest, drawn on the same 24px grid as the navigation icons. */
export function AnimeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m3 3 6 4h6l6-4-1 11-8 7-8-7Z" />
      <path d="m4 6 4 4m12-4-4 4M6 12l4 2-3 1m11-3-4 2 3 1m-7 2 2 2 2-2M12 8v3" />
    </svg>
  );
}
