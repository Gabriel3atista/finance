import { FeatureIcon } from "@/shared/components/feature-icon";
import { Eyebrow } from "@/shared/components/eyebrow";

export function EmptyFeaturePage({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-8">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-[15px]">
          {description}
        </p>
      </div>
      <div className="rounded-[18px] border border-line bg-secondary-900 shadow-card flex min-h-[310px] flex-col items-center justify-center px-6 py-12 text-center sm:min-h-[370px]">
        <div className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
          <FeatureIcon name={icon} />
        </div>
        <h2 className="mt-5 text-base font-semibold text-ink">
          Este espaço está pronto para seus dados
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
          Os recursos desta tela serão conectados nas próximas etapas. Nenhum
          dado financeiro de demonstração está sendo exibido.
        </p>
      </div>
    </section>
  );
}
