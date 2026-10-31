export const queryKeys = {
  profile: (userId: string) => ["profile", userId] as const,
  space: (userId: string) => ["space", userId] as const,
  invitations: (email: string) => ["invitations", email.toLowerCase()] as const,
  monthEntries: (spaceId: string, month: string) =>
    ["month-entries", spaceId, month] as const,
  spaceMonthEntries: (spaceId: string) =>
    ["month-entries", spaceId] as const,
  ensurePeriodEntries: (
    spaceId: string,
    userId: string,
    months: string[],
  ) =>
    [
      "ensure-period-entries",
      spaceId,
      userId,
      ...[...months].sort(),
    ] as const,
  ensurePeriodEntriesForSpace: (spaceId: string) =>
    ["ensure-period-entries", spaceId] as const,
  recurringItems: (spaceId: string) =>
    ["recurring-items", spaceId] as const,
  installmentPlans: (spaceId: string) =>
    ["installment-plans", spaceId] as const,
  dashboard: (spaceId: string) => ["dashboard", spaceId] as const,
  history: (spaceId: string) => ["history", spaceId] as const,
};
