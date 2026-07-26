const signatures = {
  pdf: (b: Uint8Array) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d,
  png: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  jpg: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b: Uint8Array) => String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP',
  mp4: (b: Uint8Array) => String.fromCharCode(...b.slice(4, 8)) === 'ftyp',
  webm: (b: Uint8Array) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
};

export type SafeFileKind = keyof typeof signatures;

export async function hasExpectedFileSignature(file: File, kind: SafeFileKind): Promise<boolean> {
  if (file.size < 12) return false;
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return signatures[kind](bytes);
}