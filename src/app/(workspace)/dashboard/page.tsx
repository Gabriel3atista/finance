import { redirect } from "next/navigation";
import { Dashboard } from "@/features/dashboard/components/dashboard";
import { getDashboardGreeting } from "@/features/dashboard/lib/greetings";
import { getSignedInContext } from "@/features/transactions/lib/server-context";

export default async function DashboardPage() {
  const context = await getSignedInContext();
  if (!context) redirect("/space");
  const metadata = context.user.user_metadata ?? {};
  const userName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    context.user.email?.split("@")[0] ||
    "Usuário";
  const greeting = getDashboardGreeting(userName);

  return (
    <Dashboard
      greeting={greeting}
      spaceId={context.spaceId}
      userId={context.user.id}
    />
  );
}
