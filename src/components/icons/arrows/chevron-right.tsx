import type { IconSvgProps } from "../icon-types";

export default function ChevronRight(props: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
