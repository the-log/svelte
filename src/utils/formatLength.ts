export default function(inches: number | null | undefined) {
  if (!inches) return;

  return `${Math.floor(inches / 12)}' ${inches % 12}"`;
}
