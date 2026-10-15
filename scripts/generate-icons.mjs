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
    const mark = ((px >= 140 && px < 200) || (px >= 312 && px < 372)) && py >= 140 && py < 372 || px >= 200 && px < 312 && py >= 227 && py < 282;
    const dot = px >= 230 && px < 282 && py >= 328 && py < 372;
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    pixels.set(mark ? [255, 112, 72, 255] : dot ? [240, 238, 233, 255] : [17, 18, 20, 255], offset);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]));
}
