import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";

export async function invalidateFinanceQueries(
  queryClient: QueryClient,
  spaceId: string,
  { revalidateOccurrences = false }: { revalidateOccurrences?: boolean } = {},
) {
  if (revalidateOccurrences) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.ensurePeriodEntriesForSpace(spaceId),
    });
  }

  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.spaceMonthEntries(spaceId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard(spaceId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.history(spaceId),
    }),
  ]);
}
