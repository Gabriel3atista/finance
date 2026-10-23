export function FeatureIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "forecast")
    return (
      <svg viewBox="0 0 24 24" className="size-6" {...common}>
        <path d="M4 19h16M6 15V9m6 6V5m6 10v-3" />
        <path d="m5 6 5-2 5 3 4-3" />
      </svg>
    );
  if (name === "history")
    return (
      <svg viewBox="0 0 24 24" className="size-6" {...common}>
        <path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2L3.5 8.5" />
        <path d="M3.5 4.5v4h4M12 7.5V12l3 2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="size-6" {...common}>
      <path d="M4.5 6.5h15M7 6.5v13h10v-13M9.5 6.5V4h5v2.5M10 10v6M14 10v6" />
    </svg>
  );
}
