export function nop() {
  //
}

export async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function escapeHtml(text: string) {
  return text.replace(/["&'<>]/g, (s) => `&#${s.charCodeAt(0)};`);
}

export function getDurationString(sec: number) {
  const hh = String((Math.floor(sec / 3600) % 24) + 100).slice(-2);
  const mm = String((Math.floor(sec / 60) % 60) + 100).slice(-2);
  const ss = String((Math.floor(sec) % 60) + 100).slice(-2);

  if (sec >= 86400) {
    const dd = Math.floor(sec / 86400);
    return `${dd}:${hh}:${mm}:${ss}`;
  }

  if (sec >= 3600) {
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

export function isEquals(a: unknown, b: unknown) {
  if (a === b) {
    return true;
  }

  // typeof null is 'object'
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a?.constructor !== b?.constructor
  ) {
    return false;
  }

  // array
  if (Array.isArray(a)) {
    return isEqualsArray(a as [], b as []);
  }

  // plain object
  if (a !== null && b !== null) {
    return isEqualsObject(
      a as Record<string, unknown>,
      b as Record<string, unknown>
    );
  }

  return true;
}

function isEqualsArray(a: unknown[], b: unknown[]) {
  const { length } = a;
  if (length !== b.length) {
    return false;
  }

  for (let i = length - 1; i >= 0; --i) {
    if (a[i] !== b[i] && !isEquals(a[i], b[i])) {
      return false;
    }
  }

  return true;
}

function isEqualsObject(
  a: Record<string, unknown>,
  b: Record<string, unknown>
) {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }

  for (const key of keys) {
    if (a[key] !== b[key] && !isEquals(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

export function formatDate(value: string | number | Date, format: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return escapeHtml(String(value));
  }

  const hours = date.getHours();
  const map: Record<string, string> = {
    YYYY: String(10000 + date.getFullYear()).slice(-4),
    MM: String(101 + date.getMonth()).slice(-2),
    DD: String(100 + date.getDate()).slice(-2),
    HH24: String(100 + hours).slice(-2),
    HH: String(100 + (hours > 12 ? hours - 12 : hours)).slice(-2),
    MI: String(100 + date.getMinutes()).slice(-2),
    SS: String(100 + date.getSeconds()).slice(-2),
    AMPM: hours >= 12 ? "PM" : "AM",
  };

  return format.replace(/YYYY|MM|DD|HH24|HH|MI|SS|AMPM/g, (c) => map[c]);
}

// 함수가 호출되면 callback을 ms만큼 기다린 후에 호출한다.
// 기다리는 동안 호출이 있을 경우 마지막으로 호출된 시점부터 다시 기다린다.
// 콜백에는 마지막으로 호출된 인자가 넘어간다.
export function debounce<T extends unknown[]>(
  callback: (...args: T) => unknown,
  ms: number
) {
  let timer: NodeJS.Timeout | number | null = null;
  return function (this: unknown, ...args: T) {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      callback.apply(this, args);
    }, ms);
  };
}

// 함수가 호출되면 callback을 ms만큼 기다린 후에 호출한다.
// 기다리는 동안 호출이 있을 경우 전부 무시한다.
// 콜백에는 처음으로 호출된 인자가 넘어간다.
export function throttle<T extends unknown[]>(
  callback: (...args: T) => unknown,
  ms: number
) {
  let timer: NodeJS.Timeout | number | null = null;
  return function (this: unknown, ...args: T) {
    if (timer !== null) {
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      callback.apply(this, args);
    }, ms);
  };
}
