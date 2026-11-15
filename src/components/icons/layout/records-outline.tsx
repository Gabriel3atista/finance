import type { IconSvgProps } from "../icon-types";

export default function RecordsOutline(props: IconSvgProps) {
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
      <path d="M5 3.5h14v17H5zM8 8h2M12 8h4M8 12h2M12 12h4M8 16h2M12 16h4" />
    </svg>
  );
}
