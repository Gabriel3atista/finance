import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";

export async function invalidateFinanceQueries(
  queryClient: QueryClient,
  householdId: string,
  { revalidateOccurrences = false }: { revalidateOccurrences?: boolean } = {},
) {
  if (revalidateOccurrences) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.ensurePeriodEntriesForHousehold(householdId),
    });
  }

  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.householdMonthEntries(householdId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard(householdId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.history(householdId),
    }),
  ]);
}
