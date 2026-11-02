"use client";

import { Dashboard } from "@/features/dashboard/components/dashboard";
import { useWorkspaceContext } from "@/shared/components/workspace-context";

export function DashboardRoute() {
  const { dashboardGreeting, spaceId, userId } = useWorkspaceContext();

  return (
    <Dashboard greeting={dashboardGreeting} spaceId={spaceId} userId={userId} />
  );
}
