export function getErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message || "Error");
  }
  return "Error";
}

