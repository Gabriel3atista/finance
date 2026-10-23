import { redirect } from "next/navigation";
import { Dashboard } from "@/features/dashboard/components/dashboard";
import { getDashboardData } from "@/features/dashboard/lib/data";
import { getSignedInContext } from "@/features/transactions/lib/data";

export default async function DashboardPage() {
  const context = await getSignedInContext();
  if (!context) redirect("/household");

  const data = await getDashboardData(context.householdId);
  return <Dashboard {...data} />;
}
