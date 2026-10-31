import { redirect } from "next/navigation";
import { Dashboard } from "@/features/dashboard/components/dashboard";
import { getSignedInContext } from "@/features/transactions/lib/server-context";

export default async function DashboardPage() {
  const context = await getSignedInContext();
  if (!context) redirect("/space");

  return (
    <Dashboard spaceId={context.spaceId} userId={context.user.id} />
  );
}
