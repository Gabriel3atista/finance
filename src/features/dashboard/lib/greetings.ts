const greetingsByPeriod = {
  morning: [
    { greeting: "Bom dia, {name}!", complement: "Que bom ter você por aqui." },
    { greeting: "Bom dia, {name}!", complement: "Cada passo conta." },
    {
      greeting: "Bom dia, {name}!",
      complement: "Vamos cuidar dos seus planos?",
    },
    {
      greeting: "Bom dia, {name}!",
      complement: "Mais clareza para fazer boas escolhas.",
    },
  ],
  afternoon: [
    {
      greeting: "Boa tarde, {name}!",
      complement: "Que bom ter você de volta!",
    },
    {
      greeting: "Boa tarde, {name}!",
      complement: "Cada escolha consciente faz diferença.",
    },
    {
      greeting: "Boa tarde, {name}!",
      complement: "Seus planos seguem avançando.",
    },
    {
      greeting: "Boa tarde, {name}!",
      complement: "Cuide do futuro com calma.",
    },
  ],
  evening: [
    {
      greeting: "Boa noite, {name}!",
      complement: "Que bom ter você por aqui.",
    },
    {
      greeting: "Boa noite, {name}!",
      complement: "Veja seu progresso de hoje.",
    },
    {
      greeting: "Boa noite, {name}!",
      complement: "Seu cuidado de hoje conta.",
    },
    {
      greeting: "Boa noite, {name}!",
      complement: "Mais clareza para amanhã.",
    },
  ],
} as const;

export function getDashboardGreeting(name: string, date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Sao_Paulo",
    }).format(date),
  );
  const period =
    hour >= 5 && hour < 12
      ? "morning"
      : hour >= 12 && hour < 18
        ? "afternoon"
        : "evening";
  const options = greetingsByPeriod[period];
  const message = options[Math.floor(Math.random() * options.length)];
  const firstName = name.trim().split(/\s+/)[0] || "Usuário";

  return {
    greeting: message.greeting.replace("{name}", firstName),
    complement: message.complement,
  };
}
