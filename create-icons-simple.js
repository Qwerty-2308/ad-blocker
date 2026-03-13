// Simple script to create placeholder icons using Node.js
// Run with: node create-icons-simple.js

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a minimal valid PNG with a solid color
// This uses a simplified PNG structure
function createMinimalColoredPNG(size, color) {
  // We'll create a very basic PNG structure
  // For a production app, you'd want to use a proper PNG library
  // But for now, we'll create a simple 1x1 pixel PNG and scale it conceptually
  
  // The easiest approach: create a base64-encoded minimal PNG and decode it
  // But that's complex. Let me use a simpler method:
  
  // Create a minimal PNG file structure manually
  const chunks = [];
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 2;   // color type (RGB)
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace
  
  // Calculate CRC for IHDR (simplified - in production use proper CRC)
  const ihdrChunkType = Buffer.from('IHDR');
  const ihdrChunk = Buffer.concat([ihdrChunkType, ihdrData]);
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13, 0);
  
  // IDAT chunk - image data
  // PNG requires each scanline to have a filter byte (0 = none)
  // Each scanline: [filter byte] + [RGB pixels]
  const scanlineLength = 1 + (size * 3); // 1 filter byte + RGB pixels
  const pixelData = Buffer.alloc(size * scanlineLength);
  
  for (let y = 0; y < size; y++) {
    const scanlineOffset = y * scanlineLength;
    pixelData[scanlineOffset] = 0; // Filter type: None
    
    // Fill RGB pixels for this scanline
    for (let x = 0; x < size; x++) {
      const pixelOffset = scanlineOffset + 1 + (x * 3);
      pixelData[pixelOffset] = color[0];     // R
      pixelData[pixelOffset + 1] = color[1]; // G
      pixelData[pixelOffset + 2] = color[2]; // B
    }
  }
  
  // Compress using zlib (Node.js built-in)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(pixelData);
  
  const idatChunkType = Buffer.from('IDAT');
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressed.length, 0);
  
  // IEND chunk
  const iendChunk = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
  
  // Calculate CRC (simplified - using a basic CRC32)
  function crc32(buffer) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buffer.length; i++) {
      crc = table[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  // Build PNG file
  const ihdrCRC = crc32(Buffer.concat([ihdrChunkType, ihdrData]));
  const ihdrCRCbuf = Buffer.alloc(4);
  ihdrCRCbuf.writeUInt32BE(ihdrCRC, 0);
  
  const idatCRC = crc32(Buffer.concat([idatChunkType, compressed]));
  const idatCRCbuf = Buffer.alloc(4);
  idatCRCbuf.writeUInt32BE(idatCRC, 0);
  
  // Assemble PNG
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const png = Buffer.concat([
    pngSignature,
    ihdrLength,
    ihdrChunkType,
    ihdrData,
    ihdrCRCbuf,
    idatLength,
    idatChunkType,
    compressed,
    idatCRCbuf,
    iendChunk
  ]);
  
  return png;
}

// Create the three icon sizes
const sizes = [16, 48, 128];
const color = [102, 126, 234]; // #667eea (purple/blue)

console.log('Creating icon files...');

sizes.forEach(size => {
  try {
    const pngData = createMinimalColoredPNG(size, color);
    const filePath = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(filePath, pngData);
    console.log(`✓ Created icon${size}.png`);
  } catch (error) {
    console.error(`✗ Error creating icon${size}.png:`, error.message);
  }
});

console.log('\nDone! Icon files created in the icons/ directory.');

