"use client";

import { MonthlyLedger } from "@/features/transactions/components/monthly-ledger";
import { useWorkspaceContext } from "@/shared/components/workspace-context";

export function MonthRoute({
  month,
  error,
  saved,
}: {
  month: Date;
  error?: string;
  saved?: string;
}) {
  const { spaceId, userId } = useWorkspaceContext();

  return (
    <MonthlyLedger
      month={month}
      spaceId={spaceId}
      userId={userId}
      error={error}
      saved={saved}
    />
  );
}
