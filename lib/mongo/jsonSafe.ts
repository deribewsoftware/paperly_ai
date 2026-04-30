/**
 * Ensure route responses are JSON-serializable (ObjectId, Date, nested docs).
 */
export function toJsonSafe<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}
