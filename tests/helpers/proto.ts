function varint(value: number): number[] {
  const bytes: number[] = [];
  let rest = BigInt(value);
  do {
    let byte = Number(rest & 0x7fn);
    rest >>= 7n;
    if (rest > 0n) byte |= 0x80;
    bytes.push(byte);
  } while (rest > 0n);
  return bytes;
}

export function protoInt(number: number, value: number): Uint8Array {
  return Uint8Array.from([...varint(number << 3), ...varint(value)]);
}

export function protoBytes(number: number, value: Uint8Array | string): Uint8Array {
  const data = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return Uint8Array.from([...varint((number << 3) | 2), ...varint(data.length), ...data]);
}

export function protoMessage(...fields: Uint8Array[]): Uint8Array {
  return Uint8Array.from(fields.flatMap((field) => [...field]));
}
