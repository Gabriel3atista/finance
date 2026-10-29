import type { IconSvgProps } from "../icon-types";

export default function Trash(props: IconSvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.5 7h15M9 7V4.5h6V7m2.5 0-.8 12.5H7.3L6.5 7M10 10.5v5.5m4-5.5v5.5" />
    </svg>
  );
}
