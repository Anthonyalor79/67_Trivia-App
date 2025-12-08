// Convert any bigint fields to Number so NextResponse.json can serialize.
export function toSerializable<T>(data: T): unknown {
  return JSON.parse(
    JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v))
  );
}

// If you prefer to keep full precision, use this instead:
// export function toSerializable<T>(data: T): any {
//   return JSON.parse(
//     JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
//   );
// }
