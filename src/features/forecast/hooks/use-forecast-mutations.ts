"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  clearCategoryForecastOverride,
  clearForecastOverride,
  clearOpeningBalance,
  saveCategoryForecastOverride,
  saveForecastOverride,
  saveOpeningBalance,
} from "@/features/forecast/actions";
import { queryKeys } from "@/shared/lib/query-keys";

type FormAction = (
  form: FormData,
) => Promise<{ error?: string; success?: string }>;
type EmptyAction = () => Promise<{ error?: string; success?: string }>;

export function useForecastMutations(householdId: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.forecast(householdId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard(householdId),
      }),
      queryClient.invalidateQueries({
        queryKey: ["month-entries", householdId],
      }),
    ]);
  };
  return {
    saveOpeningBalance: useFormMutation(saveOpeningBalance, invalidate),
    clearOpeningBalance: useEmptyMutation(clearOpeningBalance, invalidate),
    saveForecastOverride: useFormMutation(saveForecastOverride, invalidate),
    clearForecastOverride: useFormMutation(clearForecastOverride, invalidate),
    saveCategoryForecastOverride: useFormMutation(
      saveCategoryForecastOverride,
      invalidate,
    ),
    clearCategoryForecastOverride: useFormMutation(
      clearCategoryForecastOverride,
      invalidate,
    ),
  };
}

function useFormMutation(action: FormAction, onSuccess: () => Promise<void>) {
  return useMutation({
    mutationFn: async (form: FormData) => {
      const result = await action(form);
      if (result.error) throw new Error(result.error);
    },
    onSuccess,
  });
}

function useEmptyMutation(action: EmptyAction, onSuccess: () => Promise<void>) {
  return useMutation({
    mutationFn: async () => {
      const result = await action();
      if (result.error) throw new Error(result.error);
    },
    onSuccess,
  });
}
