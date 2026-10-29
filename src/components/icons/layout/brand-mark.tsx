import type { IconSvgProps } from "../icon-types";

export default function BrandMark(props: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5 17.5 10 12l3.2 3.1L19 8m-4.5 0H19v4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
