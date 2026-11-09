/**
 * VideoKit Lightweight GIF89a Encoder
 * Pure Browser-Native, zero external dependencies.
 * Encodes canvas frames into standard animated GIF89a binary.
 */

// NeuQuant color quantization or simple median-cut palette generator
function createColorPalette(rgbaData, maxColors = 256) {
  // Sample pixels to build color frequency map
  const colorMap = new Map();
  const step = Math.max(1, Math.floor(rgbaData.length / 4 / 2000)); // Sample up to 2000 pixels

  for (let i = 0; i < rgbaData.length; i += 4 * step) {
    const a = rgbaData[i + 3];
    if (a < 128) continue; // skip transparent
    // Quantize 8-bit to 5-bit for palette clustering
    const r = rgbaData[i] & 0xf8;
    const g = rgbaData[i + 1] & 0xf8;
    const b = rgbaData[i + 2] & 0xf8;
    const key = (r << 16) | (g << 8) | b;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  // Sort by frequency
  const sorted = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);
  const palette = [];

  for (let i = 0; i < Math.min(maxColors, sorted.length); i++) {
    const key = sorted[i][0];
    palette.push([
      (key >> 16) & 0xff,
      (key >> 8) & 0xff,
      key & 0xff
    ]);
  }

  // Ensure palette has at least 2 colors, pad to power of 2 (up to 256)
  if (palette.length === 0) {
    palette.push([0, 0, 0], [255, 255, 255]);
  }

  let targetSize = 2;
  while (targetSize < palette.length && targetSize < 256) {
    targetSize *= 2;
  }
  while (palette.length < targetSize) {
    palette.push([0, 0, 0]);
  }

  return palette;
}

// Find nearest color index in palette
function getClosestColorIndex(r, g, b, palette) {
  let bestDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < palette.length; i++) {
    const pr = palette[i][0];
    const pg = palette[i][1];
    const pb = palette[i][2];
    const dist = (r - pr) * (r - pr) + (g - pg) * (g - pg) + (b - pb) * (b - pb);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
      if (dist === 0) break;
    }
  }
  return bestIdx;
}

// Standard LZW encoder for GIF image data
function lzwEncode(minCodeSize, indexedPixels) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const maxCode = 4096;

  // LZW dictionary using hash table
  const table = new Map();
  function resetTable() {
    table.clear();
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  }

  const outBits = [];
  let curBitLen = 0;
  let curAcc = 0;

  function writeBits(val, len) {
    curAcc |= (val << curBitLen);
    curBitLen += len;
    while (curBitLen >= 8) {
      outBits.push(curAcc & 0xff);
      curAcc >>= 8;
      curBitLen -= 8;
    }
  }

  function flushBits() {
    if (curBitLen > 0) {
      outBits.push(curAcc & 0xff);
      curBitLen = 0;
      curAcc = 0;
    }
  }

  writeBits(clearCode, codeSize);
  resetTable();

  let curPrefix = indexedPixels[0];

  for (let i = 1; i < indexedPixels.length; i++) {
    const k = indexedPixels[i];
    const key = (curPrefix << 16) | k;

    if (table.has(key)) {
      curPrefix = table.get(key);
    } else {
      writeBits(curPrefix, codeSize);

      if (nextCode < maxCode) {
        table.set(key, nextCode++);
        if (nextCode >= (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeBits(clearCode, codeSize);
        resetTable();
      }
      curPrefix = k;
    }
  }

  writeBits(curPrefix, codeSize);
  writeBits(eoiCode, codeSize);
  flushBits();

  // Package into GIF blocks (max 255 bytes per sub-block)
  const blocks = [];
  blocks.push(minCodeSize);

  let offset = 0;
  while (offset < outBits.length) {
    const chunkSize = Math.min(255, outBits.length - offset);
    blocks.push(chunkSize);
    for (let c = 0; c < chunkSize; c++) {
      blocks.push(outBits[offset + c]);
    }
    offset += chunkSize;
  }
  blocks.push(0); // block terminator

  return blocks;
}

export class GifWriter {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.output = [];
    this.frames = [];
  }

  addFrame(ctx, width, height, delayMs = 100) {
    const imgData = ctx.getImageData(0, 0, width, height);
    this.frames.push({
      rgba: imgData.data,
      width,
      height,
      delay: Math.max(2, Math.round(delayMs / 10)) // GIF delay in hundredths of a second
    });
  }

  buildBlob() {
    const bytes = [];
    const pushStr = (s) => {
      for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
    };
    const push16 = (v) => {
      bytes.push(v & 0xff, (v >> 8) & 0xff);
    };

    // 1. Header
    pushStr('GIF89a');

    // 2. Logical Screen Descriptor
    push16(this.width);
    push16(this.height);

    // Compute global palette from first frame or combined frames
    const firstFrame = this.frames[0];
    const palette = createColorPalette(firstFrame.rgba, 256);
    const colorDepth = Math.round(Math.log2(palette.length)) - 1;

    // Packed field: GCT flag (1), color resolution (7), sort (0), GCT size (colorDepth)
    const packed = 0x80 | (7 << 4) | (colorDepth & 0x07);
    bytes.push(packed);
    bytes.push(0); // Background Color Index
    bytes.push(0); // Pixel Aspect Ratio

    // 3. Global Color Table
    for (let i = 0; i < palette.length; i++) {
      bytes.push(palette[i][0], palette[i][1], palette[i][2]);
    }

    // 4. Netscape 2.0 Loop Extension (for infinite animation loop)
    bytes.push(0x21, 0xff, 0x0b);
    pushStr('NETSCAPE2.0');
    bytes.push(0x03, 0x01);
    push16(0); // 0 = loop forever
    bytes.push(0x00);

    // 5. Frames
    for (let f = 0; f < this.frames.length; f++) {
      const frame = this.frames[f];

      // Graphic Control Extension
      bytes.push(0x21, 0xf9, 0x04);
      bytes.push(0x04); // disposal: do not dispose (0x04 = restore to background, or 0x00)
      push16(frame.delay);
      bytes.push(0); // Transparent color index
      bytes.push(0); // block terminator

      // Image Descriptor
      bytes.push(0x2c); // separator
      push16(0); // Left
      push16(0); // Top
      push16(frame.width);
      push16(frame.height);
      bytes.push(0); // No local color table

      // Map pixels to palette indices
      const indexed = new Uint8Array(frame.width * frame.height);
      const rgba = frame.rgba;
      let pIdx = 0;
      for (let p = 0; p < rgba.length; p += 4) {
        indexed[pIdx++] = getClosestColorIndex(rgba[p], rgba[p + 1], rgba[p + 2], palette);
      }

      // LZW compression
      const minCodeSize = Math.max(2, colorDepth + 1);
      const lzwData = lzwEncode(minCodeSize, indexed);
      for (let b = 0; b < lzwData.length; b++) {
        bytes.push(lzwData[b]);
      }
    }

    // 6. Trailer
    bytes.push(0x3b);

    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
  }
}

