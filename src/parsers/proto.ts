export interface ProtoField {
  number: number;
  value?: bigint;
  bytes?: Uint8Array;
}

const WIRE_VARINT = 0;
const WIRE_FIXED64 = 1;
const WIRE_BYTES = 2;
const WIRE_FIXED32 = 5;
const MAX_SHIFT = 63n;
const textDecoder = new TextDecoder('utf-8', { fatal: true });

function readVarint(data: Uint8Array, start: number): { value: bigint; next: number } | null {
  let value = 0n;
  let shift = 0n;
  for (let offset = start; offset < data.length; offset += 1) {
    const byte = BigInt(data[offset] ?? 0);
    value |= (byte & 0x7fn) << shift;
    if ((byte & 0x80n) === 0n) return { value, next: offset + 1 };
    shift += 7n;
    if (shift > MAX_SHIFT) return null;
  }
  return null;
}

function skipFixed(fields: ProtoField[], number: number, data: Uint8Array, offset: number, size: number): number {
  if (offset + size > data.length) return -1;
  fields.push({ number, bytes: data.subarray(offset, offset + size) });
  return offset + size;
}

function readField(fields: ProtoField[], data: Uint8Array, offset: number): number {
  const key = readVarint(data, offset);
  if (!key) return -1;
  const number = Number(key.value >> 3n);
  const wire = Number(key.value & 7n);
  if (number <= 0 || !Number.isSafeInteger(number)) return -1;
  if (wire === WIRE_VARINT) {
    const value = readVarint(data, key.next);
    if (!value) return -1;
    fields.push({ number, value: value.value });
    return value.next;
  }
  if (wire === WIRE_BYTES) {
    const length = readVarint(data, key.next);
    const size = length ? Number(length.value) : -1;
    if (!length || size < 0 || length.next + size > data.length) return -1;
    fields.push({ number, bytes: data.subarray(length.next, length.next + size) });
    return length.next + size;
  }
  if (wire === WIRE_FIXED64) return skipFixed(fields, number, data, key.next, 8);
  if (wire === WIRE_FIXED32) return skipFixed(fields, number, data, key.next, 4);
  return -1;
}

export function decodeProto(data: Uint8Array | undefined): ProtoField[] {
  const fields: ProtoField[] = [];
  if (!data) return fields;
  let offset = 0;
  while (offset >= 0 && offset < data.length) offset = readField(fields, data, offset);
  return fields;
}

export function protoField(fields: readonly ProtoField[], number: number): ProtoField | undefined {
  return fields.find((field) => field.number === number);
}

export function protoMessage(fields: readonly ProtoField[], number: number): ProtoField[] {
  return decodeProto(protoField(fields, number)?.bytes);
}

export function protoCount(fields: readonly ProtoField[], number: number): number {
  const value = protoField(fields, number)?.value;
  if (value === undefined || value <= 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) return 0;
  return Number(value);
}

function hasControl(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

export function protoText(field: ProtoField | undefined): string | null {
  if (!field?.bytes || field.bytes.length === 0) return null;
  try {
    const value = textDecoder.decode(field.bytes);
    return hasControl(value) ? null : value;
  } catch {
    return null;
  }
}

export function protoPackedVarints(field: ProtoField | undefined): number[] {
  const values: number[] = [];
  const data = field?.bytes;
  if (!data) return field?.value === undefined ? values : [Number(field.value)];
  let offset = 0;
  while (offset < data.length) {
    const next = readVarint(data, offset);
    if (!next) break;
    values.push(Number(next.value));
    offset = next.next;
  }
  return values;
}
