"use client";

import { useQuery } from "@tanstack/react-query";
import { ensureMonthEntries } from "@/features/transactions/lib/queries";
import { queryKeys } from "@/shared/lib/query-keys";

export function useEnsurePeriodEntries(
  spaceId: string,
  userId: string,
  months: string[],
) {
  const ensureKey = `${spaceId}:${userId}:${[...months].sort().join(",")}`;
  const query = useQuery({
    queryKey: queryKeys.ensurePeriodEntries(spaceId, userId, months),
    queryFn: async () => {
      await Promise.all(
        months.map((month) =>
          ensureMonthEntries(
            spaceId,
            userId,
            new Date(`${month}-01T00:00:00`),
          ),
        ),
      );
      return ensureKey;
    },
    enabled: Boolean(spaceId && userId && months.length),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  return {
    ...query,
    isReady: query.data === ensureKey && !query.isFetching,
  };
}
