import type { IconSvgProps } from "../icon-types";

export default function Dashboard(props: IconSvgProps) {
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
      <rect x="3.5" y="4" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="4" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="8.5" rx="1.5" />
      <rect x="3.5" y="14" width="7" height="6" rx="1.5" />
    </svg>
  );
}
