import type { IconSvgProps } from "../icon-types";

export default function ForecastOutline(props: IconSvgProps) {
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
      <path d="M4 18.5h16M6.5 15V9.5M12 15V5.5M17.5 15v-3" />
      <path d="m5 7 5-3 5 2 4-3" />
    </svg>
  );
}
