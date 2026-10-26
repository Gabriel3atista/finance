"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { ensureMonthEntries } from "@/features/transactions/lib/queries";

export function useEnsurePeriodEntries(
  householdId: string,
  userId: string,
  months: string[],
) {
  const monthsKey = months.join(",");
  const ensureKey = `${householdId}:${userId}:${monthsKey}`;
  const requestedKey = useRef("");
  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        months.map((month) =>
          ensureMonthEntries(
            householdId,
            userId,
            new Date(`${month}-01T00:00:00`),
          ),
        ),
      );
      return ensureKey;
    },
  });

  useEffect(() => {
    if (
      !householdId ||
      !userId ||
      !months.length ||
      requestedKey.current === ensureKey
    )
      return;
    requestedKey.current = ensureKey;
    mutation.reset();
    mutation.mutate();
  }, [ensureKey, householdId, months.length, mutation, userId]);

  return {
    ...mutation,
    isReady: mutation.data === ensureKey,
  };
}
