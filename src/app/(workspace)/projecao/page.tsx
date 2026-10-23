import { redirect } from "next/navigation";
import { ForecastDashboard } from "@/features/forecast/components/forecast-dashboard";
import { getForecastData } from "@/features/forecast/lib/data";
import { getSignedInContext } from "@/features/transactions/lib/data";

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ error, saved }, context] = await Promise.all([
    searchParams,
    getSignedInContext(),
  ]);
  if (!context) redirect("/household");

  try {
    const data = await getForecastData(context.householdId);
    return <ForecastDashboard {...data} error={error} saved={saved} />;
  } catch {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-danger-800 bg-danger-900 p-6 text-danger-100">
        <h1 className="text-lg font-semibold">
          Não foi possível carregar a projeção
        </h1>
        <p className="mt-2 text-sm leading-6">
          Confira a conexão do Supabase e se as migrations das fases 5 e 6 foram
          aplicadas. Tente atualizar a página em instantes.
        </p>
      </section>
    );
  }
}
