import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

// Dependency-free rasterization of our geometric app mark; safe area for maskable icons.
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const tag = Buffer.from(type), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([length, tag, data, crc]);
}
for (const size of [192, 512]) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = x / size * 512, py = y / size * 512;
    const rect = (left, top, width, height) => px >= left && px < left + width && py >= top && py < top + height;
    const frame = rect(110, 110, 292, 4) || rect(110, 398, 292, 4) || rect(110, 110, 4, 292) || rect(398, 110, 4, 292);
    const blood = rect(112, 112, 88, 8) || rect(312, 392, 88, 8) || rect(145, 177, 38, 158) || rect(329, 177, 38, 158) || rect(246, 156, 20, 34) || rect(246, 322, 20, 34);
    const iron = rect(183, 195, 29, 122) || rect(300, 195, 29, 122) || rect(212, 246, 88, 20);
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    pixels.set(blood ? [200, 16, 46, 255] : iron ? [241, 237, 228, 255] : frame ? [53, 53, 53, 255] : [10, 10, 10, 255], offset);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]));
}
