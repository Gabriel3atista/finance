import type { IconSvgProps } from "../icon-types";

export default function EyeOff(props: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3 3l18 18m-10.4-10.4a2 2 0 0 0 2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.3 4.1 9 7-.3 1.2-1.1 2.5-2.3 3.7M6.2 6.2C4.4 7.5 3.3 9.4 3 12c.7 2.9 4 7 9 7 1.1 0 2.1-.2 3-.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
