export function adIndexForSlot(slot, count) {
  if (count < 2) return 0;
  return ((slot - 1) % count + count) % count;
}

export function adSlotForIndex(index, count) {
  if (count < 2) return 0;
  // One visual copy at each end permits a short transition across the boundary.
  if (index < 0) return 0;
  if (index >= count) return count + 1;
  return index + 1;
}

export function canonicalAdSlot(slot, count) {
  if (count < 2) return 0;
  if (slot === 0) return count;
  if (slot === count + 1) return 1;
  return slot;
}
