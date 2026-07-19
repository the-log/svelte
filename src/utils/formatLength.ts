export default function (inches: number | null | undefined) {
	if (inches == null) return;

	return `${Math.floor(inches / 12)}' ${inches % 12}"`;
}
