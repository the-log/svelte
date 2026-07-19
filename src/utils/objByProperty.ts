interface Sorter {
	path: string;
	dir: 'asc' | 'desc';
}

export default function objByProperty(this: Sorter, a: unknown, b: unknown): 1 | 0 | -1 {
	const propPath: string[] = this.path.split('.');
	let dir;
	if (['asc', 'desc'].includes(this.dir.toLowerCase())) {
		dir = this.dir.toLowerCase();
	} else {
		dir = 'asc';
	}

	let obj1: unknown = a;
	let obj2: unknown = b;

	while (propPath.length > 0) {
		const prop = propPath.shift()!;
		// A null/undefined object anywhere along the path keeps its value,
		// matching the old try/catch-swallowed property access.
		obj1 = obj1 == null ? obj1 : (obj1 as Record<string, unknown>)[prop];
		obj2 = obj2 == null ? obj2 : (obj2 as Record<string, unknown>)[prop];
	}

	const v1 = obj1 as number;
	const v2 = obj2 as number;

	if (dir === 'asc') {
		if (v1 > v2) return 1;
		if (v1 < v2) return -1;
	} else {
		if (v1 > v2) return -1;
		if (v1 < v2) return 1;
	}

	return 0;
}
