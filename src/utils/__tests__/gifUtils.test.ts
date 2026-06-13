import { describe, it, expect } from 'vitest';
import { getGifDuration } from '../gifUtils';

// Helper to create a basic valid GIF file
function createMockGifFile(frames: { delay: number }[]): File {
  const bytes: number[] = [];

  // Header: "GIF89a"
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
  // Logical Screen Descriptor (7 bytes)
  // Width (2), Height (2), Packed Fields (1), Bg Color Index (1), Pixel Aspect Ratio (1)
  bytes.push(0x0A, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x00);

  // Frames
  for (const frame of frames) {
    // Graphic Control Extension
    bytes.push(0x21, 0xF9, 0x04);
    bytes.push(0x00); // Packed fields
    // Delay time (2 bytes, little-endian) - in hundredths of a second
    bytes.push(frame.delay & 0xFF, (frame.delay >> 8) & 0xFF);
    bytes.push(0x00); // Transparent color index
    bytes.push(0x00); // Block terminator
  }

  // Trailer
  bytes.push(0x3B);

  const array = new Uint8Array(bytes);
  return new File([array.buffer], 'test.gif', { type: 'image/gif' });
}

describe('getGifDuration', () => {
  it('returns 3000ms for empty file', async () => {
    const file = new File([''], 'test.gif', { type: 'image/gif' });
    const duration = await getGifDuration(file);
    expect(duration).toBe(3000);
  });

  it('returns 3000ms for invalid GIF header', async () => {
    const array = new Uint8Array([0x48, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0, 0]);
    const file = new File([array.buffer], 'invalid.gif', { type: 'image/gif' });
    const duration = await getGifDuration(file);
    expect(duration).toBe(3000);
  });

  it('returns 3000ms for too short file', async () => {
    const array = new Uint8Array([0x47, 0x49, 0x46, 0x38]);
    const file = new File([array.buffer], 'short.gif', { type: 'image/gif' });
    const duration = await getGifDuration(file);
    expect(duration).toBe(3000);
  });

  it('calculates duration correctly for a single frame', async () => {
    const file = createMockGifFile([{ delay: 50 }]); // 50 hundredths = 500ms
    const duration = await getGifDuration(file);
    expect(duration).toBe(500); // 50 * 10
  });

  it('calculates duration correctly for multiple frames', async () => {
    const file = createMockGifFile([{ delay: 20 }, { delay: 30 }, { delay: 10 }]); // 200 + 300 + 100 = 600ms
    const duration = await getGifDuration(file);
    expect(duration).toBe(600);
  });

  it('handles GIF with global color table', async () => {
    const bytes: number[] = [];

    // Header: "GIF89a"
    bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
    // Logical Screen Descriptor
    // Width (2), Height (2), Packed Fields (1), Bg Color Index (1), Pixel Aspect Ratio (1)
    // Global Color Table Flag (1) = 0x80 (128)
    // Bits per pixel = 0, Sort Flag = 0, Size of Global Color Table = 0 (2^(0+1) = 2 bytes * 3 = 6 bytes)
    bytes.push(0x0A, 0x00, 0x0A, 0x00, 0x80, 0x00, 0x00);

    // Global Color Table (6 bytes for size 0)
    bytes.push(255, 255, 255, 0, 0, 0);

    // Graphic Control Extension
    bytes.push(0x21, 0xF9, 0x04);
    bytes.push(0x00); // Packed fields
    bytes.push(10, 0); // Delay = 10 -> 100ms
    bytes.push(0x00); // Transparent color index
    bytes.push(0x00); // Block terminator

    // Trailer
    bytes.push(0x3B);

    const array = new Uint8Array(bytes);
    const file = new File([array.buffer], 'test_gct.gif', { type: 'image/gif' });
    const duration = await getGifDuration(file);
    expect(duration).toBe(100);
  });

  it('handles Image Descriptor and skip sub-blocks', async () => {
    const bytes: number[] = [];

    // Header: "GIF89a"
    bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
    bytes.push(0x0A, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x00);

    // Graphic Control Extension
    bytes.push(0x21, 0xF9, 0x04);
    bytes.push(0x00);
    bytes.push(15, 0); // Delay = 15 -> 150ms
    bytes.push(0x00);
    bytes.push(0x00);

    // Image Descriptor (2C)
    bytes.push(0x2C);
    // Left (2), Top (2), Width (2), Height (2), Packed (1)
    bytes.push(0, 0, 0, 0, 10, 0, 10, 0, 0);

    // The current gifUtils.ts code expects the next byte after the packed field
    // to be read as a subBlockSize.
    // If we provide 2, it jumps 1+2 = 3 bytes forward.
    bytes.push(2); // "subBlockSize"
    bytes.push(0xFF, 0xFF); // data skipped
    bytes.push(0); // next subBlockSize = 0 (loop ends)

    // Trailer
    bytes.push(0x3B);

    const array = new Uint8Array(bytes);
    const file = new File([array.buffer], 'test_image_descriptor.gif', { type: 'image/gif' });
    const duration = await getGifDuration(file);
    expect(duration).toBe(150);
  });

  it('handles Application Extension blocks', async () => {
    const bytes: number[] = [];

    // Header: "GIF89a"
    bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
    bytes.push(0x0A, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x00);

    // Graphic Control Extension
    bytes.push(0x21, 0xF9, 0x04);
    bytes.push(0x00);
    bytes.push(10, 0); // Delay = 10 -> 100ms
    bytes.push(0x00);
    bytes.push(0x00);

    // Extension block that is not F9 (e.g. FF - Application Extension)
    bytes.push(0x21, 0xFF);
    bytes.push(11); // subBlockSize
    bytes.push(0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30); // NETSCAPE2.0
    bytes.push(3); // subBlockSize
    bytes.push(1, 0, 0); // data
    bytes.push(0); // terminator

    // Trailer
    bytes.push(0x3B);

    const array = new Uint8Array(bytes);
    const file = new File([array.buffer], 'test_ext.gif', { type: 'image/gif' });
    const duration = await getGifDuration(file);
    expect(duration).toBe(100);
  });

  it('handles readAsArrayBuffer failure gracefully', async () => {
    // We mock the readAsArrayBuffer to test error
    const file = new File([''], 'test_error.gif', { type: 'image/gif' });

    // We can't easily mock the native FileReader on a real File object without modifying the environment or window
    // So let's mock it on window/global
    const originalFileReader = global.FileReader;
    global.FileReader = class {
      onload: any;
      onerror: any;
      readAsArrayBuffer() {
        if (this.onerror) {
          setTimeout(() => this.onerror(new Event('error')), 0);
        }
      }
    } as any;

    const duration = await getGifDuration(file);
    expect(duration).toBe(3000);

    global.FileReader = originalFileReader;
  });

  it('handles invalid buffer content causing error in DataView', async () => {
    // This could happen if e.target.result is some weird type, but we already have an empty test.
    // Let's create an invalid Local Color Table that causes offset out of bounds
    const bytes: number[] = [];

    // Header: "GIF89a"
    bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
    bytes.push(0x0A, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x00);

    // Image Descriptor (2C) - without enough bytes
    bytes.push(0x2C);
    bytes.push(0, 0, 0, 0, 10, 0, 10, 0, 0);
    bytes.push(0x87); // Local Color Table flag is set, size = 7 (256 colors = 768 bytes)
    // But we omit the actual table to cause a RangeError when the code tries to read it or skip it,
    // actually the code just adds to the offset, then tries to read a byte.
    // If offset is beyond byteLength, DataView.getUint8 throws RangeError.

    const array = new Uint8Array(bytes);
    const file = new File([array.buffer], 'test_error_bounds.gif', { type: 'image/gif' });
    const duration = await getGifDuration(file);

    // It should catch the error and return 3000
    expect(duration).toBe(3000);
  });
});
