import type { IconSvgProps } from "../icon-types";

export default function EyeOutline(props: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 12c.7-2.9 4-7 9-7s8.3 4.1 9 7c-.7 2.9-4 7-9 7s-8.3-4.1-9-7z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
