import type { IconSvgProps } from "../icon-types";

export default function HistoryOutline(props: IconSvgProps) {
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
      <path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2L3.5 8.5" />
      <path d="M3.5 4.5v4h4M12 7.5V12l3 2" />
    </svg>
  );
}
