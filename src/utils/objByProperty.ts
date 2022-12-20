interface sorter {
  path: string;
  dir: 'asc' | 'desc';
}

export default function objByProperty(a:any, b:any): 1 | 0 | -1 {
  const sorter = (this as unknown as sorter);
  const propPath: string[] = sorter.path.split('.');
  let dir;
  if (['asc', 'desc'].includes(sorter.dir.toLowerCase())) {
    dir = sorter.dir.toLowerCase();
  } else {
    dir = 'asc';
  }

  let obj1 = a;
  let obj2 = b;

  while (propPath.length > 0) {
    const prop = propPath.shift()!;
    try {
      obj1 = obj1[prop];
      obj2 = obj2[prop];
    } catch (error) {}
  }

  if (dir === 'asc') {
    if (obj1 > obj2) return 1;
    if (obj1 < obj2) return -1;
  } else {
    if (obj1 > obj2) return -1;
    if (obj1 < obj2) return 1;
  }

  return 0;
}
