#!/usr/bin/env python3
"""
Simple script to create placeholder icons
Run with: python3 create-icons.py
"""

import os
import zlib
import struct

def create_png(size, color=(102, 126, 234)):
    """Create a minimal valid PNG with a solid color"""
    
    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    width = size
    height = size
    bit_depth = 8
    color_type = 2  # RGB
    compression = 0
    filter_type = 0
    interlace = 0
    
    ihdr_data = struct.pack('>IIBBBBB', width, height, bit_depth, 
                           color_type, compression, filter_type, interlace)
    ihdr_chunk = b'IHDR' + ihdr_data
    ihdr_crc = zlib.crc32(ihdr_chunk) & 0xffffffff
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + ihdr_chunk + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk - image data
    # PNG requires each scanline to have a filter byte (0 = none)
    scanline_length = 1 + (size * 3)  # 1 filter byte + RGB pixels
    pixel_data = bytearray(size * scanline_length)
    
    for y in range(size):
        scanline_offset = y * scanline_length
        pixel_data[scanline_offset] = 0  # Filter type: None
        
        # Fill RGB pixels for this scanline
        for x in range(size):
            pixel_offset = scanline_offset + 1 + (x * 3)
            pixel_data[pixel_offset] = color[0]     # R
            pixel_data[pixel_offset + 1] = color[1]  # G
            pixel_data[pixel_offset + 2] = color[2]  # B
    
    # Compress using zlib
    compressed = zlib.compress(bytes(pixel_data))
    
    idat_chunk = b'IDAT' + compressed
    idat_crc = zlib.crc32(idat_chunk) & 0xffffffff
    idat_chunk = struct.pack('>I', len(compressed)) + idat_chunk + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_chunk = b'\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Assemble PNG
    png = png_signature + ihdr_chunk + idat_chunk + iend_chunk
    
    return png

# Create icons directory if it doesn't exist
icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(icons_dir, exist_ok=True)

# Create the three icon sizes
sizes = [16, 48, 128]
color = (102, 126, 234)  # #667eea (purple/blue)

print('Creating icon files...')

for size in sizes:
    try:
        png_data = create_png(size, color)
        file_path = os.path.join(icons_dir, f'icon{size}.png')
        with open(file_path, 'wb') as f:
            f.write(png_data)
        print(f'✓ Created icon{size}.png')
    except Exception as e:
        print(f'✗ Error creating icon{size}.png: {e}')

print('\nDone! Icon files created in the icons/ directory.')

