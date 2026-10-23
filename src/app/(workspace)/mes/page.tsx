import { redirect } from "next/navigation";
import { MonthlyLedger } from "@/features/transactions/components/monthly-ledger";
import {
  getSignedInContext,
  parseMonth,
} from "@/features/transactions/lib/data";

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; saved?: string }>;
}) {
  const [{ month: monthQuery, error, saved }, context] = await Promise.all([
    searchParams,
    getSignedInContext(),
  ]);
  if (!context) redirect("/household");
  return (
    <MonthlyLedger
      month={parseMonth(monthQuery)}
      householdId={context.householdId}
      userId={context.user.id}
      error={error}
      saved={saved}
    />
  );
}
