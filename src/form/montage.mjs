// Pure RGBA row compositor — the GL-free half of the E-17 march-of-progress visual (T-057-01, story
// S-057, epic E-17).
//
// `montageRow` pastes N equal-or-varying-height RGBA8 panels left→right into one wide canvas with
// `gap`px gutters. It operates on raw `{ width, height, data }` buffers (data = RGBA8, length 4*w*h) —
// NO pngjs, NO files, NO GL — so the pixel math is trivially unit-testable under src/**/*.test.mjs.
// The benchmark runner (sweep-scorecard.mjs) owns the PNG decode/encode I/O edge and calls in here.

const WHITE = Object.freeze([255, 255, 255, 255]);

/**
 * Paste RGBA8 panels left→right with `gap`px gutters of `bg`. Panels shorter than the tallest are
 * top-aligned (row 0); all padding (gutters + below short panels) is filled with `bg`. PURE.
 *
 * @param {{width:number, height:number, data:Uint8Array|Buffer}[]} images  equal-stride RGBA8 panels
 * @param {{gap?:number, bg?:number[]}} [opts]  gap px between panels (default 0); bg RGBA (default white)
 * @returns {{width:number, height:number, data:Buffer}}  width = Σw + gap*(n-1), height = max h
 */
export function montageRow(images, { gap = 0, bg = WHITE } = {}) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("montageRow: images must be a non-empty array");
  }
  const g = Math.max(0, Math.floor(gap));
  for (const [i, im] of images.entries()) {
    if (!im || !Number.isInteger(im.width) || !Number.isInteger(im.height) || !im.data) {
      throw new Error(`montageRow: image[${i}] must be { width, height, data }`);
    }
    if (im.data.length !== 4 * im.width * im.height) {
      throw new Error(
        `montageRow: image[${i}] data length ${im.data.length} != 4*${im.width}*${im.height}`,
      );
    }
  }

  const outW = images.reduce((s, im) => s + im.width, 0) + g * (images.length - 1);
  const outH = images.reduce((m, im) => Math.max(m, im.height), 0);
  const out = Buffer.alloc(4 * outW * outH);

  // Fill the whole canvas with bg first (covers gutters + below-short-panel padding).
  const [br, bgc, bb, ba] = [bg[0] & 255, bg[1] & 255, bg[2] & 255, (bg[3] ?? 255) & 255];
  for (let p = 0; p < out.length; p += 4) {
    out[p] = br;
    out[p + 1] = bgc;
    out[p + 2] = bb;
    out[p + 3] = ba;
  }

  // Blit each panel at its running x-offset, top-aligned.
  let x0 = 0;
  for (const im of images) {
    for (let y = 0; y < im.height; y++) {
      const srcRow = y * im.width * 4;
      const dstRow = (y * outW + x0) * 4;
      im.data.copy
        ? im.data.copy(out, dstRow, srcRow, srcRow + im.width * 4)
        : Buffer.from(im.data.buffer, im.data.byteOffset + srcRow, im.width * 4).copy(out, dstRow);
    }
    x0 += im.width + g;
  }

  return { width: outW, height: outH, data: out };
}

export const _internal = { WHITE };
