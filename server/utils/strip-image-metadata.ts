// PNG/WebPのmetadataを排除
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_STRIP_CHUNKS = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);

const stripPngMetadata = (bytes: Uint8Array): Uint8Array => {
  if (bytes.length < 8) return bytes;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return bytes;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4]!,
      bytes[offset + 5]!,
      bytes[offset + 6]!,
      bytes[offset + 7]!,
    );
    const chunkEnd = offset + 8 + length + 4;
    if (chunkEnd > bytes.length) return bytes;
    if (!PNG_STRIP_CHUNKS.has(type)) {
      parts.push(bytes.subarray(offset, chunkEnd));
    }
    offset = chunkEnd;
    if (type === 'IEND') break;
  }

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let position = 0;
  for (const part of parts) {
    output.set(part, position);
    position += part.length;
  }
  return output;
};

const WEBP_STRIP_CHUNKS = new Set(['EXIF', 'XMP ']);

const stripWebpMetadata = (bytes: Uint8Array): Uint8Array => {
  if (bytes.length < 12) return bytes;
  const fourcc = (start: number) =>
    String.fromCharCode(
      bytes[start]!,
      bytes[start + 1]!,
      bytes[start + 2]!,
      bytes[start + 3]!,
    );
  if (fourcc(0) !== 'RIFF' || fourcc(8) !== 'WEBP') return bytes;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: Uint8Array[] = [];
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const type = fourcc(offset);
    const size = view.getUint32(offset + 4, true);
    const padded = size + (size % 2);
    const chunkEnd = offset + 8 + padded;
    if (chunkEnd > bytes.length) return bytes;
    if (!WEBP_STRIP_CHUNKS.has(type)) {
      const chunk = new Uint8Array(bytes.subarray(offset, chunkEnd));
      if (type === 'VP8X' && chunk.length >= 9) {
        // EXIF(0x08)/XMP(0x04)フラグを消去
        chunk[8] = chunk[8]! & ~0x0c;
      }
      chunks.push(chunk);
    }
    offset = chunkEnd;
  }

  const body = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(12 + body);
  output.set(bytes.subarray(0, 12));
  const outView = new DataView(output.buffer);
  outView.setUint32(4, 4 + body, true);
  let position = 12;
  for (const chunk of chunks) {
    output.set(chunk, position);
    position += chunk.length;
  }
  return output;
};

export const stripImageMetadata = (
  bytes: Uint8Array,
  contentType: string,
): Uint8Array => {
  try {
    if (contentType === 'image/png') return stripPngMetadata(bytes);
    if (contentType === 'image/webp') return stripWebpMetadata(bytes);
    return bytes;
  } catch {
    return bytes;
  }
};
