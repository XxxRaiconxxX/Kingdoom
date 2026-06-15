export async function getGifDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) return resolve(3000);
        const view = new DataView(buffer);
        let duration = 0;
        let offset = 0;
        
        // Check if it's a GIF (starts with 'GIF8')
        if (view.byteLength < 13 || view.getUint32(0) !== 0x47494638) {
          return resolve(3000);
        }
        
        offset = 13;
        
        const globalPacked = view.getUint8(10);
        if (globalPacked & 0x80) {
          offset += 3 * Math.pow(2, (globalPacked & 0x07) + 1);
        }
        
        while (offset < view.byteLength) {
          const blockType = view.getUint8(offset);
          if (blockType === 0x21) {
            const extType = view.getUint8(offset + 1);
            if (extType === 0xF9) { // Graphic Control Extension
              const delay = view.getUint16(offset + 4, true);
              duration += delay * 10;
              offset += 8; // 21 F9 04 [4 bytes] 00
            } else {
              offset += 2;
              let subBlockSize = view.getUint8(offset);
              while (subBlockSize > 0) {
                offset += 1 + subBlockSize;
                subBlockSize = view.getUint8(offset);
              }
              offset++;
            }
          } else if (blockType === 0x2C) { // Image Descriptor
            offset += 9;
            const localPacked = view.getUint8(offset);
            if (localPacked & 0x80) {
              offset += 3 * Math.pow(2, (localPacked & 0x07) + 1);
            }
            offset++;
            let subBlockSize = view.getUint8(offset);
            while (subBlockSize > 0) {
              offset += 1 + subBlockSize;
              subBlockSize = view.getUint8(offset);
            }
            offset++;
          } else if (blockType === 0x3B) { // Trailer
            break;
          } else {
            break;
          }
        }
        resolve(duration > 0 ? duration : 3000);
      } catch (err) {
        console.error("Error parsing GIF duration", err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as any).message) : String(err)));
        resolve(3000);
      }
    };
    reader.onerror = () => resolve(3000);
    reader.readAsArrayBuffer(file);
  });
}
