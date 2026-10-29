"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/features/auth/lib/supabase/client";
import { queryKeys } from "@/shared/lib/query-keys";
import { fetchMonthEntries } from "@/features/transactions/lib/queries";
import { useEnsurePeriodEntries } from "@/features/transactions/hooks/use-ensure-period-entries";
import type { FinancialEntry } from "@/features/transactions/lib/data";

export function useMonthData({
  householdId,
  userId,
  month,
}: {
  householdId: string;
  userId: string;
  month: string;
}) {
  const queryClient = useQueryClient();
  const entriesKey = queryKeys.monthEntries(householdId, month);
  const ensureEntries = useEnsurePeriodEntries(householdId, userId, [month]);
  const entries = useQuery({
    queryKey: entriesKey,
    queryFn: () =>
      fetchMonthEntries(householdId, new Date(`${month}-01T00:00:00`)),
    enabled: Boolean(householdId && month && ensureEntries.isReady),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
  const setStatus = useMutation({
    mutationFn: async ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: "planned" | "settled";
    }) => {
      const { error } = await createClient()
        .from("financial_entries")
        .update({
          status: nextStatus,
          settled_at:
            nextStatus === "settled" ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .eq("household_id", householdId)
        .in("status", ["planned", "settled"]);
      if (error) throw error;
      return { id, nextStatus };
    },
    onMutate: async ({ id, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: entriesKey });
      const previous = queryClient.getQueryData<FinancialEntry[]>(entriesKey);
      queryClient.setQueryData<FinancialEntry[]>(entriesKey, (current) =>
        current?.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: nextStatus,
                settled_at:
                  nextStatus === "settled" ? new Date().toISOString() : null,
              }
            : entry,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(entriesKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: entriesKey });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard(householdId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.forecast(householdId),
      });
    },
  });

  return { entries, setStatus, ensureEntries };
}
