import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1092386563.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1092386563.nbt";

// 體育館: a 1980s public sports hall. Two storeys of white-tiled concrete over a
// stone plinth, a continuous band of tinted glass per storey, a raised clerestory
// strip down the roof for daylight, and a recessed glass entrance with doors.
const W = 28, H = 23, D = 14;
const vox = new Voxels([W, H, D]);

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const G = new Map();
for (const c of cells) G.set(`${c[0]},${c[1]}`, Math.round(c[2]));

const has = (x, z) => G.has(`${x},${z}`);
const gr = (x, z) => G.get(`${x},${z}`);
const put = (x, y, z, id, st) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (st) vox.set(x, y, z, id, st);
  else vox.set(x, y, z, id);
};

// Exposed outward faces of a footprint cell (neighbour missing).
const expo = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const e = expo(x, z);
  return e.n || e.s || e.w || e.e;
};

const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";

// ---- Pass 1: foundation, walls, floors, roof deck ----
for (const [x0, z0] of cells) {
  const x = Math.round(x0), z = Math.round(z0);
  const gg = gr(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    put(x, gg, z, "stone_bricks");                       // plinth / base course
    for (let y = gg + 1; y <= 10; y++) put(x, y, z, "white_concrete");
    if (gg <= 4) put(x, 5, z, "smooth_quartz");          // storey line
    put(x, 10, z, "smooth_quartz");                      // cornice
    put(x, 11, z, "smooth_stone");                       // roof deck
    put(x, 12, z, "white_concrete");                     // parapet
  } else {
    if (gg <= 4) put(x, 5, z, "smooth_quartz");          // storey floor slab
    put(x, 11, z, "smooth_stone");                       // roof deck
  }
}

// ---- Pass 2: window bands, piers and lamps on the perimeter ----
for (const [x0, z0] of cells) {
  const x = Math.round(x0), z = Math.round(z0);
  if (!isPerim(x, z)) continue;
  const e = expo(x, z);
  const ns = e.n || e.s, ew = e.w || e.e;
  if (ns && ew) continue; // corner: keep solid white pier

  const gg = gr(x, z);
  const onEntranceRow = z === 0 && x >= 11 && x <= 16;

  if (ns) {
    const s = x;
    const isWin = s % 4 === 1 || s % 4 === 2;
    if (isWin && !onEntranceRow) {
      const inZ = e.n ? z + 1 : z - 1;
      for (let y = Math.max(gg + 1, 1); y <= 4; y++) put(x, y, z, GLASS, PANE_EW);
      for (let y = 6; y <= 9; y++) put(x, y, z, GLASS, PANE_EW);
      if (s % 8 === 1 && has(x, inZ) && !onEntranceRow) put(x, 7, inZ, "glowstone");
    }
  } else if (ew) {
    const s = z;
    const isWin = s % 4 === 1 || s % 4 === 2;
    if (isWin) {
      const inX = e.w ? x + 1 : x - 1;
      for (let y = Math.max(gg + 1, 1); y <= 4; y++) put(x, y, z, GLASS, PANE_NS);
      for (let y = 6; y <= 9; y++) put(x, y, z, GLASS, PANE_NS);
      if (s % 8 === 1 && has(inX, z)) put(inX, 7, z, "glowstone");
    }
  }
}

// ---- Pass 3: recessed glass entrance on the z=0 front ----
for (let x = 11; x <= 16; x++) {
  if (!has(x, 0)) continue;
  const gg = gr(x, 0);
  if (x === 11 || x === 16) {
    for (let y = gg; y <= 4; y++) put(x, y, 0, "stone_bricks"); // portal piers
  } else if (x === 12 || x === 15) {
    for (let y = gg; y <= 4; y++) put(x, y, 0, GLASS, PANE_EW); // lobby glass
  } else {
    // Double doors at x 13 and 14.
    const hinge = x === 13 ? "left" : "right";
    put(x, gg, 0, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    put(x, gg + 1, 0, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
    for (let y = gg + 2; y <= 4; y++) put(x, y, 0, GLASS, PANE_EW); // transom glass
  }
}

// ---- Pass 4: clerestory strip along the roof (x 5..22, z 3..10) ----
const CX0 = 5, CX1 = 22, CZ0 = 3, CZ1 = 10;
for (let z = CZ0; z <= CZ1; z++) {
  for (let x = CX0; x <= CX1; x++) {
    if (!has(x, z)) continue;
    const onX = x === CX0 || x === CX1;
    const onZ = z === CZ0 || z === CZ1;
    if (onX || onZ) {
      put(x, 12, z, "white_concrete");
      put(x, 14, z, "white_concrete");
      if (onX && onZ) {
        put(x, 13, z, "white_concrete");
      } else {
        const s = onZ ? x : z;
        if (s % 3 !== 0) {
          put(x, 13, z, GLASS, onZ ? PANE_EW : PANE_NS);
        } else {
          put(x, 13, z, "white_concrete");
        }
      }
    }
    put(x, 15, z, "smooth_quartz"); // clerestory cap
  }
}
// Warm lamps standing on the deck inside the clerestory.
for (const lx of [9, 14, 19]) put(lx, 12, 6, "sea_lantern");

// ---- Pass 5: roof equipment on the deck ----
for (let z = 10; z <= 11; z++) for (let x = 2; x <= 3; x++) {
  put(x, 12, z, "light_gray_concrete");
  put(x, 13, z, "light_gray_concrete");
}

vox.save(OUT);
