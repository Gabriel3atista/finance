import { redirect } from "next/navigation";
import { RecordsScreen } from "@/features/transactions/components/records-screen";
import { getSignedInContext } from "@/features/transactions/lib/server-context";

export default async function RecordsPage() {
  const context = await getSignedInContext();
  if (!context) redirect("/space");
  return (
    <RecordsScreen spaceId={context.spaceId} />
  );
}
