// // Convert any bigint fields to Number so NextResponse.json can serialize.
// export function toSerializable<T>(data: T): any {
//   return JSON.parse(
//     JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v))
//   );
// }

// // If you prefer to keep full precision, use this instead:
// // export function toSerializable<T>(data: T): any {
// //   return JSON.parse(
// //     JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
// //   );
// // }

// Convert any bigint fields to Number so NextResponse.json can serialize.
export function toSerializable<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  ) as T;
}
