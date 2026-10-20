import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020193";
const W = 11, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));

const inF = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const isPerim = (x, z) =>
  inF(x, z) && Object.values(DIRS).some(([dx, dz]) => !inF(x + dx, z + dz));
const missing = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([n]) => n);
const isCorner = (x, z) => missing(x, z).length >= 2;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey plan (absolute y): ground floor 0..4 (shopfront), storey line 5,
// upper floor 6..8 (windows), cornice 9, roof slab 10, parapet 11.
const SHOP_TOP = 4, STOREY_LINE = 5, CORNICE = 9, ROOF = 10, PARAPET = 11;
const PANE = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, base course, floors, walls
for (const [x, z, gr] of cells) {
  const gy = gr;
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  if (!perim) {
    // Interior: floor slabs only, air between (no interiors)
    put(x, gy, z, "smooth_stone");
    if (gy <= STOREY_LINE) put(x, STOREY_LINE, z, "smooth_stone");
    if (gy <= CORNICE) put(x, CORNICE, z, "smooth_stone");
    continue;
  }

  const out = missing(x, z)[0];
  const [ox, oz] = DIRS[out];
  const pillar = isCorner(x, z) || (x + z) % 3 === 0;
  const paneProps = (out === "north" || out === "south") ? PANE : PANE_NS;

  for (let y = gy; y <= CORNICE; y++) {
    if (y === gy) put(x, y, z, "polished_andesite");                 // base course
    else if (y <= SHOP_TOP) {                                          // shopfront
      if (pillar) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass");
    } else if (y === STOREY_LINE) put(x, y, z, "smooth_quartz");       // storey line
    else if (y <= 8) {                                                 // upper windows
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    } else put(x, y, z, "smooth_quartz");                              // cornice
  }

  // Parapet on the perimeter
  put(x, PARAPET, z, "smooth_quartz");
}

// Pass 2: roof slab over the whole footprint, standing on walls and interior ceiling
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  put(x, ROOF, z, "light_gray_concrete");
}

// Pass 3: warm lights behind glass
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const out = missing(x, z)[0];
  if (!out || isCorner(x, z)) continue;
  const [ox, oz] = DIRS[out];
  const ix = x - ox, iz = z - oz;
  if (!inF(ix, iz) || isPerim(ix, iz)) continue;
  const inner = gAt(ix, iz);

  // Shopfront glowstone at y=2
  if (gr < 2 && (x + z) % 4 === 0 && inner <= 2) {
    put(ix, 2, iz, "glowstone");
  }
  // Upper storey glowstone behind some windows at y=7
  if (gr <= 7 && (x + z) % 6 === 1 && inner <= 7) {
    put(ix, 7, iz, "glowstone");
  }
}

// Pass 4: entrance on the street side (prefer north, lowest z, nearest x=5)
const entranceCands = cells
  .filter(([x, z]) => isPerim(x, z) && !isCorner(x, z))
  .map(([x, z, gr]) => ({ x, z, gr, out: missing(x, z)[0] }))
  .sort((a, b) =>
    (a.out === "north" ? 0 : 1) - (b.out === "north" ? 0 : 1) ||
    a.z - b.z || Math.abs(a.x - 5) - Math.abs(b.x - 5));

if (entranceCands.length) {
  const e = entranceCands[0];
  const gy = e.gr;
  // Door, two halves, standing on the base course
  put(e.x, gy, e.z, "oak_door", { facing: e.out, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(e.x, gy + 1, e.z, "oak_door", { facing: e.out, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Awning band over the entrance, on the same street face
  if (gy <= SHOP_TOP - 1) {
    for (const [x, z, gr] of cells) {
      if (!isPerim(x, z) || isCorner(x, z)) continue;
      if (missing(x, z)[0] !== e.out) continue;
      if (Math.abs(x - e.x) + Math.abs(z - e.z) > 3) continue;
      if (gr <= SHOP_TOP - 1) put(x, SHOP_TOP, z, "red_terracotta");
    }
  }
}

// Pass 5: roof equipment on the interior roof
for (const [x, z, gr] of cells) {
  if (isPerim(x, z) || gr > ROOF) continue;
  if (x >= 4 && x <= 6 && z >= 8 && z <= 11) {
    put(x, PARAPET, z, "smooth_stone");
    if (x <= 5 && z <= 9) put(x, PARAPET + 1, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
