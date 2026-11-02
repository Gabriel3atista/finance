import { MonthRoute } from "@/features/transactions/components/month-route";
import { parseMonth } from "@/shared/lib/date";

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; saved?: string }>;
}) {
  const { month: monthQuery, error, saved } = await searchParams;
  return (
    <MonthRoute month={parseMonth(monthQuery)} error={error} saved={saved} />
  );
}
