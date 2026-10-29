import type { IconSvgProps } from "../icon-types";

export default function Records(props: IconSvgProps) {
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
      <path d="M4.5 6.5h15M7 6.5v13h10v-13M9.5 6.5V4h5v2.5M10 10v6M14 10v6" />
    </svg>
  );
}
