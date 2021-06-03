let map = new Map<string, Set<Function>>();

export function publish(name: string, ...args: any[]): void {
  let set = map.get(name);
  if (set === void 0) {
    return;
  }

  switch (args.length) {
    case 0:
      for (let f of set) {
        f();
      }
      break;

    case 1: {
      let [a] = args;
      for (let f of set) {
        f(a);
      }
      break;
    }

    case 2: {
      let [a, b] = args;
      for (let f of set) {
        f(a, b);
      }
      break;
    }

    case 3: {
      let [a, b, c] = args;
      for (let f of set) {
        f(a, b, c);
      }
      break;
    }

    case 4: {
      let [a, b, c, d] = args;
      for (let f of set) {
        f(a, b, c, d);
      }
      break;
    }

    case 5: {
      let [a, b, c, d, e] = args;
      for (let f of set) {
        f(a, b, c, d, e);
      }
      break;
    }

    default:
      for (let f of set) {
        f(...args);
      }
      break;
  }
}

export function subscribe(name: string, fn: Function): void {
  let set = map.get(name);
  if (set === void 0) {
    set = new Set();
    map.set(name, set);
  }

  set.add(fn);
}

export function unsubscribe(name: string, fn: Function): void {
  let set = map.get(name);
  if (set === void 0) {
    return;
  }

  set.delete(fn);

  if (set.size === 0) {
    map.delete(name);
  }
}
