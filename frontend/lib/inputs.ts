export function normalizeNumberInput(value: string) {
  const cleaned = value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
  if (cleaned === "") return null;
  return Number(cleaned);
}
