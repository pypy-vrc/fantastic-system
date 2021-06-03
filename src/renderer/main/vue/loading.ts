let pendingCount = 0;

export function increment(): void {
  if (++pendingCount === 1) {
    // FIXME
  }
}

export function decrement(): void {
  if (--pendingCount === 0) {
    // FIXME
  }
}
