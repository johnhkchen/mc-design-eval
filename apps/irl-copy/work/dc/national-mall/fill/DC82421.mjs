// DC82421: 70 I Street SE, Capitol Hill: a 1960s buff-brick apartment block with limestone bands, as a 1.21.1 module.
// Five storeys of 3 blocks (floor slab, glass row, head row) under a stone cornice; the lidar's 17 is a 2-block
// elevator penthouse over the south-west core (3x3 median, so the 16s are noise and drop to the 15 roof). The north
// front has a recessed entrance porch under a slab canopy. Every body column is solid from y 0, so nothing floats
// on the slope; every floor slab sits on the wall ring or the storey below, and each storey has an air gap behind
// its glass. Two-block window reveals hold a warm glowstone in some bays.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC82421.cells.json`, "utf8"));
const OUT = `${DIR}/DC82421.nbt`;

// Palette: buff brick walls, cream limestone bands and cornice, granite plinth, glass, and a light roof membrane.
const BRICK = "bricks";
const STONE = "calcite";
const PLINTH = "polished_granite";
const SLAB = "smooth_stone";         // interior floor slabs
const ROOF = "light_gray_concrete";  // roof surface
const GLASS = "glass_pane";
const DOOR = "iron_door";
const LAMP = "glowstone";
const LANTERN = "lantern";
const UNIT = "iron_block";           // roof plant

const SLAB_ROWS = new Set([0, 3, 6, 9, 12]); // floor slab row of each storey (limestone band outside)
const GLASS_ROWS = new Set([1, 4, 7, 10, 13]);
const ROOF_ROW = 14;                          // cornice outside, roof membrane inside; the roof top is y 15
const PENT_ROWS = [15, 16];                   // penthouse wall, then its cap: top at 17 (lidar)

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const body = (x, z) => { const c = F.get(key(x, z)); return !!c && c.r > 0; };

// 3x3 median of the footprint roof heights: lidar noise drops out, the 17 core stays.
const roof = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  roof.set(key(c.x, c.z), vals[vals.length >> 1]);
}
const pen = (x, z) => body(x, z) && roof.get(key(x, z)) >= 17;

const DIRS = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }]; // N S W E
const exposed = (x, z, test = body) => DIRS.filter(({ dx, dz }) => !test(x + dx, z + dz));

const vox = new Map(); // "x,y,z" -> { block, state?, axis? }
const put = (x, y, z, block, extra = {}) => vox.set(`${x},${y},${z}`, { block, ...extra });
const at = (x, y, z) => vox.get(`${x},${y},${z}`);

// Body: each footprint cell with a roof above y 0.
for (const c of F.values()) {
  const { x, z } = c;
  if (c.r === 0) { put(x, 0, z, SLAB); continue; } // the light-well floor at grade

  const out = exposed(x, z);                      // faces onto the street, the court or the open air
  const ext = out.length > 0;
  const corner = out.some(({ dz }) => dz) && out.some(({ dx }) => dx);
  const idx = out.some(({ dz }) => dz) ? x : z;   // position along the wall it faces
  const top = pen(x, z) ? 16 : ROOF_ROW;

  for (let y = 0; y <= top; y++) {
    if (y === 0) { put(x, 0, z, ext ? PLINTH : SLAB); continue; }
    if (y <= ROOF_ROW) {
      if (SLAB_ROWS.has(y)) { put(x, y, z, ext ? STONE : SLAB); continue; }
      if (y === ROOF_ROW) { put(x, y, z, ext ? STONE : ROOF); continue; }
      if (!ext) continue;                           // air behind the glass and between the floors
      if (corner) { put(x, y, z, STONE); continue; }
      if (GLASS_ROWS.has(y)) {
        if (idx % 3 === 0) put(x, y, z, BRICK);     // pier between the bays
        else put(x, y, z, GLASS, { axis: out[0].dz ? "x" : "z" });
      } else put(x, y, z, BRICK);                   // head row under the next slab
      continue;
    }
    // Penthouse rows above the roof: a brick wall (15) and a stone cap (16).
    const penExt = DIRS.some(({ dx, dz }) => !pen(x + dx, z + dz));
    if (y === 15 && penExt) put(x, y, z, BRICK);
    if (y === 16) put(x, y, z, penExt ? STONE : ROOF);
  }
}

// Warm light behind some windows: an air cell inside the glass.
for (const [k, v] of vox) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const out = exposed(x, z);
  if (out.length !== 1) continue;
  const { dx, dz } = out[0];
  const ix = x - dx, iz = z - dz;
  if (!body(ix, iz) || at(ix, y, iz) || SLAB_ROWS.has(y)) continue;
  if ((x + y * 3 + z) % 7 === 0) put(ix, y, iz, LAMP);
}

// Entrance: a recessed porch on the north front (z = 0) with a double-height door at x 14, lobby panes either side,
// lanterns under the slab canopy (the storey-3 slab over the porch).
put(14, 1, 0, DOOR, { door: "lower" });
put(14, 2, 0, DOOR, { door: "upper" });
put(13, 1, 0, GLASS, { axis: "x" });
put(15, 1, 0, GLASS, { axis: "x" });
put(13, 2, 1, LANTERN, { hanging: true });
put(15, 2, 1, LANTERN, { hanging: true });

// Roof plant: a few 1x2 boxes on the body roof, well inside the edges and clear of the penthouse.
const plant = [];
for (const c of F.values()) {
  const { x, z } = c;
  if (c.r !== 15 || pen(x, z) || exposed(x, z).length) continue;
  const clear = [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => body(x + dx, z + dz) && !pen(x + dx, z + dz)));
  if (clear && (x * 5 + z * 11) % 37 === 0) plant.push([x, z]);
}
for (const [x, z] of plant) { put(x, 15, z, UNIT); put(x + 1, 15, z, UNIT); }

// Glass panes connect in their wall's plane only: to pane, pier or wall on each side, never into a door or lantern.
const solidish = (x, y, z) => { const v = at(x, y, z); return !!v && v.block !== DOOR && v.block !== LANTERN && v.block !== LAMP; };
const paneState = (x, y, z, axis) => {
  const ns = axis === "z" ? { north: solidish(x, y, z - 1), south: solidish(x, y, z + 1) } : { north: false, south: false };
  const ew = axis === "x" ? { east: solidish(x + 1, y, z), west: solidish(x - 1, y, z) } : { east: false, west: false };
  return { ...ns, ...ew, waterlogged: false };
};

const g = new Voxels([29, 29, 32]);
const str = (b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, String(v)]));
for (const [k, v] of vox) {
  const [x, y, z] = k.split(",").map(Number);
  if (v.block === GLASS) { g.set(x, y, z, GLASS, paneState(x, y, z, v.axis)); continue; }
  if (v.block === DOOR) {
    const s = { facing: "north", half: v.door, hinge: "left", open: false, powered: false };
    g.set(x, y, z, DOOR, str(s)); continue;
  }
  if (v.block === LANTERN) { g.set(x, y, z, LANTERN, { hanging: true, waterlogged: false }); continue; }
  g.set(x, y, z, v.block);
}

// Checks: every block above y 0 has a block under it or a solid neighbour in its own layer (nothing floats).
let floating = 0;
for (const [k, v] of vox) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0 || v.block === LAMP || v.block === LANTERN) continue;
  const under = solidish(x, y - 1, z);
  const side = solidish(x + 1, y, z) || solidish(x - 1, y, z) || solidish(x, y, z + 1) || solidish(x, y, z - 1);
  if (!under && !side) floating++;
}

const stats = g.save(OUT);
console.log(`DC82421: ${stats.blocks} blocks, ${stats.palette} palette entries, ${floating} floating`);
