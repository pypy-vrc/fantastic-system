export function nop(..._args: any[]): any {}

export async function sleep(millisecond: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, millisecond);
  });
}

export function escapeHtml(str: string): string {
  return str.replace(/["&'<>]/g, (s) => `&#${s.charCodeAt(0)};`);
}

export function getDurationString(sec: number): string {
  let dd = Math.floor(sec / 86400);
  let hh = Math.floor(sec / 3600) % 24;
  let mm = String((Math.floor(sec / 60) % 60) + 100).substr(-2);
  let ss = String((Math.floor(sec) % 60) + 100).substr(-2);

  if (dd !== 0) {
    return `${dd}:${String(hh + 100).substr(-2)}:${mm}:${ss}`;
  }

  if (hh !== 0) {
    return `${String(hh + 100).substr(-2)}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

export function isEquals(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  // typeof null is 'object'
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a?.constructor !== b?.constructor
  ) {
    return false;
  }

  // array
  if (Array.isArray(a) === true) {
    let {length} = a as any[];

    if (length !== b.length) {
      return false;
    }

    for (let i = 0; i < length; ++i) {
      if (a[i] !== b[i] && isEquals(a[i], b[i]) === false) {
        return false;
      }
    }

    return true;
  }

  // plain object
  let keys = Object.keys(a);
  let {length} = keys;
  if (length !== Object.keys(b).length) {
    return false;
  }

  for (let i = 0; i < length; ++i) {
    let key = keys[i];

    if (a[key] !== b[key] && isEquals(a[key], b[key]) === false) {
      return false;
    }
  }

  return true;
}

export function formatDate(
  date: string | number | Date,
  format: string
): string {
  let dt = new Date(date);
  if (isNaN(dt.getTime()) === true) {
    return escapeHtml(String(date));
  }

  let hours = dt.getHours();
  let map: {[key: string]: string} = {
    YYYY: String(10000 + dt.getFullYear()).substr(-4),
    MM: String(101 + dt.getMonth()).substr(-2),
    DD: String(100 + dt.getDate()).substr(-2),
    HH24: String(100 + hours).substr(-2),
    HH: String(100 + (hours > 12 ? hours - 12 : hours)).substr(-2),
    MI: String(100 + dt.getMinutes()).substr(-2),
    SS: String(100 + dt.getSeconds()).substr(-2),
    AMPM: hours >= 12 ? 'PM' : 'AM'
  };

  return format.replace(/YYYY|MM|DD|HH24|HH|MI|SS|AMPM/g, (c) => map[c]);
}
