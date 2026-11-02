export function formDataFromValues(values: Record<string, unknown>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    formData.set(key, value instanceof File ? value : String(value));
  }

  return formData;
}
