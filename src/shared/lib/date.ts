export function formatMonth(date: Date) {
  const month = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);

  return month.charAt(0).toLocaleUpperCase("pt-BR") + month.slice(1);
}
