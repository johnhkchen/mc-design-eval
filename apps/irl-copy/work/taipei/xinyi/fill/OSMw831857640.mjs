import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-era office/shophouse block, 1980s-90s: white tiled concrete,
// light-grey horizontal bands, dark ground-floor shopfront, two storeys plus a
// parapet and a rooftop plant box. Roof sits 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857640";
const W = 21, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const base = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const TOP = base + 11;                              // roof cap level (11 above lowest ground)
const BAND1 = base + 5;                             // storey-1 floor / band line
const BAND2 = base + 10;                            // storey-2 ceiling / cornice band

const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const pane = (x, y, z, axis, tint) => {
  const name = tint === "ground" ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane";
  const props = axis === "ew"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  put(x, y, z, name, props);
};

// exposed faces of a footprint cell: [dx, dz, orientation]
const exposed = (x, z) =>
  [[0, -1, "ns"], [0, 1, "ns"], [1, 0, "ew"], [-1, 0, "ew"]].filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => exposed(x, z).length > 0;

const WINDOW_BANDS = [
  { lo: base + 1, hi: base + 4, tint: "ground" },
  { lo: base + 6, hi: base + 9, tint: "upper" },
];

// ---- foundation, walls, interiors, roof cap ----
for (const [x, z, gr] of cells) {
  // foundation solid from y 0 up to the ground surface
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const ex = exposed(x, z);

  if (perim) {
    for (let y = gr + 1; y <= TOP; y++) {
      if (y === BAND1 || y === BAND2 || y === TOP) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }
      const band = WINDOW_BANDS.find((b) => y >= b.lo && y <= b.hi);
      let done = false;
      if (band && ex.length === 1) {
        const [, , orient] = ex[0];
        const coord = orient === "ns" ? x : z;
        if (coord % 3 === 1) {
          pane(x, y, z, orient, band.tint);
          done = true;
        }
      }
      if (!done) put(x, y, z, "white_concrete");
    }
  } else {
    // interior: air gaps, floor slabs at each storey line only
    for (let y = gr + 1; y <= BAND2; y++) {
      if (y === BAND1 || y === BAND2) put(x, y, z, "light_gray_concrete");
    }
  }

  // roof cap over every footprint cell (sits on the ceiling slab or wall)
  if (gr < TOP) put(x, TOP, z, "light_gray_concrete");
}

// ---- entrance on the southern face, centred ----
let zMax = -Infinity;
for (const [x, z] of cells) zMax = Math.max(zMax, z);
const southXs = cells.filter(([, z]) => z === zMax).map(([x]) => x).sort((a, b) => a - b);
const dx = southXs[Math.floor(southXs.length / 2)];
const gd = gAt(dx, zMax);
if (gd !== undefined) {
  // door set into the ground band
  put(dx, gd + 1, zMax, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gd + 2, zMax, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // stone surround and lintel
  put(dx, gd + 3, zMax, "stone_bricks");
  for (const sx of [dx - 1, dx + 1]) {
    if (has(sx, zMax)) {
      put(sx, gd + 1, zMax, "stone_bricks");
      put(sx, gd + 2, zMax, "stone_bricks");
      put(sx, gd + 3, zMax, "stone_bricks");
    }
  }
}

// ---- warm lights behind glass (only where an interior cell exists behind the pane) ----
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const [odx, odz, orient] = ex[0];
  const ix = x - odx, iz = z - odz;               // inward neighbour
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const coord = orient === "ns" ? x : z;
  if (coord % 3 !== 1) continue;
  if (x % 2 === 0 && z % 2 === 0) continue;       // thin out the lights
  for (const band of WINDOW_BANDS) {
    if (band.tint === "ground" && band.lo > gr && (x + z) % 4 === 0) {
      put(ix, band.lo + 1, iz, "glowstone");
    }
    if (band.tint === "upper" && band.lo > gr && (x + z) % 4 === 2) {
      put(ix, band.lo + 1, iz, "shroomlight");
    }
  }
}

// ---- rooftop plant box (3x3, centred if footprint allows) ----
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
let boxOk = true;
for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) if (!has(x, z)) boxOk = false;
if (boxOk) {
  for (let x = cx - 1; x <= cx + 1; x++) {
    for (let z = cz - 1; z <= cz + 1; z++) put(x, TOP + 1, z, "light_gray_concrete");
  }
  put(cx, TOP + 2, cz, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
