const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCredits(minor: number) {
  return formatter.format(minor / 100);
}

export function creditsToMinor(credits: number) {
  return Math.round(credits * 100);
}

export function minorToCredits(minor: number) {
  return minor / 100;
}
