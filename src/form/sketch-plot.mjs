// SKETCH PLOT (T-123-01) — the conditioned form sketch drawn as a deterministic raster sheet.
//
// The AC asks for "a render or plot a human can check against the GLB at a glance". GL renders
// are nondeterministic evidence (E-24/E-28: GL bytes never decide), so the sheet is a pure CPU
// raster: three orthographic panels — PLAN (footprint polygon + mirror plane over the plan mask),
// FRONT and SIDE elevations (conditioned occupancy + eave/ridge lines) — each with the RAW mesh's
// orthographic outline overlaid in the same projection, so sketch-vs-GLB divergence is visible
// directly. (glb-silhouette.mjs is deliberately NOT reused here: it renders through the build's
// perspective camera, which cannot align with orthographic panels.)
//
// PURE — RGBA buffers in, one RGBA sheet out; PNG encoding stays in the runner. No I/O, no GL,
// no Date/random; same input → same bytes (asserted in tests, re-proved by the runner's sheet
// sha being stable across --repro reruns — the PNG is evidence, not a pin, but determinism is
// free here so we keep it).

export const SHEET_PANEL = 240; // px per square panel
export const SHEET_MARGIN = 12;
export const SHEET_COLORS = Object.freeze({
  background: [255, 255, 255, 255],
  panelFrame: [180, 180, 180, 255],
  cell: [205, 205, 205, 255], //      conditioned occupancy
  meshOutline: [40, 40, 40, 255], //  raw GLB, same projection
  footprint: [220, 40, 40, 255],
  mirror: [50, 90, 220, 255],
  eave: [30, 160, 60, 255],
  ridge: [150, 60, 180, 255],
});

// panel definitions: which mesh/cell axes land on the panel's horizontal/vertical, and whether
// the vertical is flipped (elevations are y-up; the plan reads like a map, z down)
const PANELS = Object.freeze([
  { name: "plan", h: 0, v: 2, flipV: false },
  { name: "front", h: 0, v: 1, flipV: true },
  { name: "side", h: 2, v: 1, flipV: true },
]);

/**
 * Orthographic mesh occupancy mask for one panel: every triangle projected by dropping the
 * panel's depth axis, rasterized at px resolution in CELL space (the same frame the occupancy
 * panels use, so overlays align by construction).
 * @returns {Uint8Array} size×size, 1 = covered
 */
export function orthoMask(positions, triangleCount, toPx, size, panel) {
  const mask = new Uint8Array(size * size);
  for (let t = 0; t < triangleCount; t++) {
    const o = t * 9;
    const pts = [0, 1, 2].map((v) => toPx(
      positions[o + v * 3 + panel.h],
      positions[o + v * 3 + panel.v],
    ));
    const minX = Math.max(0, Math.floor(Math.min(pts[0][0], pts[1][0], pts[2][0])));
    const maxX = Math.min(size - 1, Math.ceil(Math.max(pts[0][0], pts[1][0], pts[2][0])));
    const minY = Math.max(0, Math.floor(Math.min(pts[0][1], pts[1][1], pts[2][1])));
    const maxY = Math.min(size - 1, Math.ceil(Math.max(pts[0][1], pts[1][1], pts[2][1])));
    if (minX > maxX || minY > maxY) continue;
    const [ax, ay] = pts[0], [bx, by] = pts[1], [cx, cy] = pts[2];
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (area === 0) continue;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
        const w1 = (cx - bx) * (py - by) - (cy - by) * (px - bx);
        const w2 = (ax - cx) * (py - cy) - (ay - cy) * (px - cx);
        const inside = area > 0 ? (w0 >= 0 && w1 >= 0 && w2 >= 0) : (w0 <= 0 && w1 <= 0 && w2 <= 0);
        if (inside) mask[y * size + x] = 1;
      }
    }
  }
  return mask;
}

const outlineOf = (mask, size) => {
  const out = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!mask[y * size + x]) continue;
      const edge = x === 0 || y === 0 || x === size - 1 || y === size - 1 ||
        !mask[y * size + x - 1] || !mask[y * size + x + 1] ||
        !mask[(y - 1) * size + x] || !mask[(y + 1) * size + x];
      if (edge) out[y * size + x] = 1;
    }
  }
  return out;
};

/**
 * Compose the three-panel sheet.
 * @param {object} args
 * @param {object} args.sketch the form-sketch/v1 record
 * @param {Int32Array} args.occupied conditioned cells (conditionGlb output)
 * @param {{positions:Float64Array, triangleCount:number}|null} args.mesh raw mesh for the
 *        outline overlay (omit → panels render without it)
 * @returns {{ width:number, height:number, data:Uint8Array }} RGBA
 */
export function renderSketchSheet({ sketch, occupied, mesh = null }) {
  const P = SHEET_PANEL, M = SHEET_MARGIN;
  const width = 3 * P + 4 * M;
  const height = P + 2 * M;
  const data = new Uint8Array(width * height * 4);
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const o = (y * width + x) * 4;
    data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = c[3];
  };
  for (let i = 0; i < width * height; i++) data.set(SHEET_COLORS.background, i * 4);

  const { dims, voxelSize } = sketch.substrate;
  const min = sketch.source.bounds.min;
  const maxDim = Math.max(...dims);
  const s = Math.max(1, Math.floor((P - 8) / maxDim)); // px per cell
  const pad = (range) => Math.floor((P - range * s) / 2);

  PANELS.forEach((panel, pi) => {
    const x0 = M + pi * (P + M);
    const y0 = M;
    for (let i = 0; i < P; i++) { // frame
      put(x0 + i, y0, SHEET_COLORS.panelFrame);
      put(x0 + i, y0 + P - 1, SHEET_COLORS.panelFrame);
      put(x0, y0 + i, SHEET_COLORS.panelFrame);
      put(x0 + P - 1, y0 + i, SHEET_COLORS.panelFrame);
    }
    const padH = pad(dims[panel.h]);
    const padV = pad(dims[panel.v]);
    // cell-corner coordinate → panel-local px (vertical optionally flipped)
    const hPx = (c) => padH + c * s;
    const vPx = (c) => (panel.flipV ? P - padV - c * s : padV + c * s);

    // conditioned occupancy, projected along the panel's depth axis
    const seen = new Set();
    for (let i = 0; i < occupied.length; i += 3) {
      const ch = occupied[i + panel.h];
      const cv = occupied[i + panel.v];
      const key = ch * 4096 + cv;
      if (seen.has(key)) continue;
      seen.add(key);
      const left = hPx(ch);
      const top = panel.flipV ? vPx(cv + 1) : vPx(cv);
      for (let dy = 0; dy < s; dy++) {
        for (let dx = 0; dx < s; dx++) put(x0 + left + dx, y0 + top + dy, SHEET_COLORS.cell);
      }
    }

    // raw mesh outline in the same projection (mesh coords → cell space → px)
    if (mesh) {
      const toPx = (mh, mv) => [
        hPx((mh - min[panel.h]) / voxelSize),
        vPx((mv - min[panel.v]) / voxelSize),
      ];
      const mask = orthoMask(mesh.positions, mesh.triangleCount, toPx, P, panel);
      const outline = outlineOf(mask, P);
      for (let y = 0; y < P; y++) {
        for (let x = 0; x < P; x++) {
          if (outline[y * P + x]) put(x0 + x, y0 + y, SHEET_COLORS.meshOutline);
        }
      }
    }

    // overlays
    const vline = (cellH, color, vA = 0, vB = dims[panel.v]) => {
      const x = Math.round(hPx(cellH));
      const [a, b] = [Math.round(vPx(vA)), Math.round(vPx(vB))].sort((p, q) => p - q);
      for (let y = a; y <= b; y++) for (let w = 0; w < 2; w++) put(x0 + x + w, y0 + y, color);
    };
    const hline = (cellV, color, hA = 0, hB = dims[panel.h]) => {
      const y = Math.round(vPx(cellV));
      const [a, b] = [Math.round(hPx(hA)), Math.round(hPx(hB))].sort((p, q) => p - q);
      for (let x = a; x <= b; x++) for (let w = 0; w < 2; w++) put(x0 + x, y0 + y + w, color);
    };

    if (panel.name === "plan") {
      const poly = sketch.footprint.polygon;
      for (let i = 0; i < poly.length; i++) {
        const [h1, v1] = poly[i];
        const [h2, v2] = poly[(i + 1) % poly.length];
        if (h1 === h2) vline(h1, SHEET_COLORS.footprint, v1, v2);
        else hline(v1, SHEET_COLORS.footprint, h1, h2);
      }
    } else {
      hline(sketch.proportions.eaveLayer + 1, SHEET_COLORS.eave);
      hline(sketch.proportions.ridgeLayer + 1, SHEET_COLORS.ridge);
    }
    if (sketch.symmetry.applied) {
      const axis = sketch.symmetry.axis === "x" ? 0 : 2;
      if (panel.h === axis) vline(sketch.symmetry.offsetCells + 0.5, SHEET_COLORS.mirror);
    }
  });

  return { width, height, data };
}