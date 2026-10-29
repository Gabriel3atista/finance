import type { IconSvgProps } from "../icon-types";

export default function ArrowDownTrend(props: IconSvgProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="m4 6.5 4 4 2.5-2.5 5.5 5.5m-4 0h4v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
