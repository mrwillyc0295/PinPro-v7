export const safeStringify = (obj: any): string => {
  const cache = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return undefined; // Do not stringify circular references
      }
      cache.add(value);
    }
    return value;
  });
};
