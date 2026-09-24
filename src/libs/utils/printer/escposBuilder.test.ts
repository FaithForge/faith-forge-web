import { describe, it, expect } from 'vitest';
import { EscPosBuilder } from './escposBuilder';

describe('EscPosBuilder', () => {
  it('should initialize with default ESC @ and code page commands', () => {
    const builder = new EscPosBuilder();
    const bytes = builder.getBuffer();

    // 0x1B 0x40 (ESC @) + 0x1B 0x74 0x00 (code table)
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);
    expect(bytes[2]).toBe(0x1b);
    expect(bytes[3]).toBe(0x74);
    expect(bytes[4]).toBe(0x00);
  });

  it('should append correct alignment commands', () => {
    const builder = new EscPosBuilder();
    builder.align('center');
    const bytes = builder.getBuffer();

    // Contains ESC a 1
    const centerSeq = [0x1b, 0x61, 0x01];
    const hasCenter = centerSeq.every((byte, idx) => bytes[5 + idx] === byte);
    expect(hasCenter).toBe(true);
  });

  it('should encode ASCII text properly into bytes', () => {
    const builder = new EscPosBuilder();
    builder.text('HELLO');
    const bytes = builder.getBuffer();

    // H E L L O = [72, 69, 76, 76, 79]
    const textSlice = bytes.slice(5, 10);
    expect(Array.from(textSlice)).toEqual([72, 69, 76, 76, 79]);
  });

  it('should append cut paper command', () => {
    const builder = new EscPosBuilder();
    builder.cut();
    const bytes = builder.getBuffer();

    // GS V 66 0 (0x1D, 0x56, 0x42, 0x00)
    const cutSlice = bytes.slice(bytes.length - 4);
    expect(Array.from(cutSlice)).toEqual([0x1d, 0x56, 0x42, 0x00]);
  });
});
