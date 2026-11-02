"use client";

import { createContext, useContext, type ReactNode } from "react";

type DashboardGreeting = {
  greeting: string;
  complement: string;
};

export type WorkspaceContextValue = {
  userId: string;
  spaceId: string;
  dashboardGreeting: DashboardGreeting;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: WorkspaceContextValue;
}) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceContext must be used inside the workspace.");
  }
  return context;
}
