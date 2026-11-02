"use client";

import { RecordsScreen } from "@/features/transactions/components/records-screen";
import { useWorkspaceContext } from "@/shared/components/workspace-context";

export function RecordsRoute() {
  const { spaceId } = useWorkspaceContext();
  return <RecordsScreen spaceId={spaceId} />;
}
