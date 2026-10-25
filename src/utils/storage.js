export function readJsonStorage(key, fallback, isValid = () => true) {
  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null) return fallback;

    const value = JSON.parse(storedValue);
    if (!isValid(value)) {
      throw new TypeError(`Stored value for "${key}" has an invalid shape.`);
    }

    return value;
  } catch (error) {
    console.error(`Failed to read local storage key "${key}":`, error);
    return fallback;
  }
}
