export default function (cents: number | null | undefined) {
	if (cents == null) return;

	return Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
