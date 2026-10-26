import { redirect } from "next/navigation";
import { ForecastDashboard } from "@/features/forecast/components/forecast-dashboard";
import { getSignedInContext } from "@/features/transactions/lib/server-context";

export default async function ForecastPage() {
  const context = await getSignedInContext();
  if (!context) redirect("/household");
  return (
    <ForecastDashboard
      householdId={context.householdId}
      userId={context.user.id}
    />
  );
}
