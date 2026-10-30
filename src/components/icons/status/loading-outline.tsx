import type { IconSvgProps } from "../icon-types";

export default function LoadingOutline(props: IconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.363l-2.122 2.121m-8.484 8.484l-2.121 2.121m12.727.001l-2.122-2.122M7.758 7.758L5.637 5.637"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
