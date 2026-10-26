import type { ReactNode } from "react";

export function ResponsivePageSkeleton({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div aria-busy="true" aria-label="Carregando interface" role="status">
      {children}
    </div>
  );
}
