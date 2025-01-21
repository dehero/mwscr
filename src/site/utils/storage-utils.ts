export function setStorageItemWithEvent(storage: Storage, key: string, value: string | null) {
  const oldValue = storage.getItem(key);

  if (value === null) {
    storage.removeItem(key);
  } else {
    storage.setItem(key, value);
  }

  window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue: value }));
}
