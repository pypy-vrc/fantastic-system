// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FN = (...args: any[]) => void | Promise<void>;

const map = new Map<string, Set<FN>>();

export function publish(name: string, ...args: unknown[]) {
  const set = map.get(name);
  if (set === void 0) {
    return;
  }

  switch (args.length) {
    case 0:
      for (const f of set) {
        f();
      }
      break;

    case 1: {
      const [a] = args;
      for (const f of set) {
        f(a);
      }
      break;
    }

    case 2: {
      const [a, b] = args;
      for (const f of set) {
        f(a, b);
      }
      break;
    }

    case 3: {
      const [a, b, c] = args;
      for (const f of set) {
        f(a, b, c);
      }
      break;
    }

    case 4: {
      const [a, b, c, d] = args;
      for (const f of set) {
        f(a, b, c, d);
      }
      break;
    }

    case 5: {
      const [a, b, c, d, e] = args;
      for (const f of set) {
        f(a, b, c, d, e);
      }
      break;
    }

    default:
      for (const f of set) {
        f(...args);
      }
      break;
  }
}

export function subscribe(name: string, fn: FN) {
  let set = map.get(name);
  if (set === void 0) {
    set = new Set();
    map.set(name, set);
  }

  set.add(fn);
}

export function unsubscribe(name: string, fn: FN) {
  const set = map.get(name);
  if (set === void 0) {
    return;
  }

  set.delete(fn);

  if (set.size === 0) {
    map.delete(name);
  }
}
