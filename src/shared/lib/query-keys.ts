export const queryKeys = {
  profile: (userId: string) => ["profile", userId] as const,
  household: (userId: string) => ["household", userId] as const,
  invitations: (email: string) => ["invitations", email.toLowerCase()] as const,
  monthEntries: (householdId: string, month: string) =>
    ["month-entries", householdId, month] as const,
  householdMonthEntries: (householdId: string) =>
    ["month-entries", householdId] as const,
  ensurePeriodEntries: (
    householdId: string,
    userId: string,
    months: string[],
  ) =>
    [
      "ensure-period-entries",
      householdId,
      userId,
      ...[...months].sort(),
    ] as const,
  ensurePeriodEntriesForHousehold: (householdId: string) =>
    ["ensure-period-entries", householdId] as const,
  recurringItems: (householdId: string) =>
    ["recurring-items", householdId] as const,
  installmentPlans: (householdId: string) =>
    ["installment-plans", householdId] as const,
  dashboard: (householdId: string) => ["dashboard", householdId] as const,
  history: (householdId: string) => ["history", householdId] as const,
};
