let pendingCount = 0;

export function incrementLoading() {
  if (++pendingCount === 1) {
    // FIXME
  }
}

export function decrementLoading() {
  if (--pendingCount === 0) {
    // FIXME
  }
}
