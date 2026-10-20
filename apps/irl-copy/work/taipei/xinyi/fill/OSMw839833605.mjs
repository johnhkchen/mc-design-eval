import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833605";
const W = 20, H = 23, D = 21;

// Record: low-rise 1980s Xinyi-era commercial block, two storeys of ~5 blocks,
// cream-tile clad concrete frame, dark aluminium-look mullions, glass shopfront,
// flat roof with parapet and a small plant penthouse.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, y] of cells) ground.set(`${x},${z}`, y);
const inside = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const g0 = Math.min(...ground.values());

const TOP = g0 + 10;   // roof slab index
const PARA = g0 + 11;  // parapet cap index
const DOOR_FACE = "south";

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outwards = (x, z) =>
  Object.keys(DIRS).filter(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!inside(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: middle edge cell on the south face (exactly one outward side)
const southEdge = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => { const o = outwards(x, z); return o.length === 1 && o[0] === DOOR_FACE; })
  .sort((a, b) => a[0] - b[0]);
const doorCell = southEdge.length ? southEdge[Math.floor(southEdge.length / 2)] : null;

const lights = [];
const interiorCells = [];

for (const [x, z, gc] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const outs = outwards(x, z);

  if (outs.length === 0) {
    // Interior: floor slabs per storey and roof slab, air elsewhere
    interiorCells.push([x, z]);
    const levels = new Set([gc, g0, g0 + 5, TOP].filter(L => L >= gc && L <= TOP));
    for (const L of levels) put(x, L, z, "smooth_stone");
    continue;
  }

  // Corners: quartz pillar column
  if (outs.length >= 2) {
    for (let y = gc; y < PARA; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
    put(x, PARA, z, "smooth_quartz_slab", { type: "top" });
    continue;
  }

  // Single-face edge cell: facade with window grid
  const dir = outs[0];
  const [dx, dz] = DIRS[dir];
  const ns = dir === "north" || dir === "south";
  const s = ns ? x : z;
  const pane = ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isDoor = dir === DOOR_FACE && doorCell && x === doorCell[0] && z === doorCell[1];

  for (let y = gc; y < PARA; y++) {
    let b = "smooth_quartz";
    let p = null;
    if (y === Math.max(g0, gc)) {
      b = "polished_granite";                    // base course
    } else if (y === g0 + 4 || y === g0 + 9) {
      b = "polished_andesite";                   // spandrel / storey line
    } else {
      const inBand = (y >= g0 + 1 && y <= g0 + 3) || (y >= g0 + 6 && y <= g0 + 8);
      if (inBand) {
        if (s % 4 === 0) {
          b = "light_gray_concrete";             // mullion
        } else {
          b = "light_blue_stained_glass_pane";   // glazing
          p = pane;
        }
      }
    }
    put(x, y, z, b, p);
  }

  put(x, PARA, z, "smooth_quartz_slab", { type: "top" });

  if (isDoor) {
    put(x, gc + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gc + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gc + 3, z, "polished_andesite");     // lintel
  }

  // Warm lights standing just inside some windows
  if (!isDoor) {
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && outwards(ix, iz).length === 0) {
      if (s % 8 === 1) lights.push([ix, g0 + 1, iz, "lantern", { hanging: "false", waterlogged: "false" }]);
      if (s % 8 === 5) lights.push([ix, g0 + 7, iz, "shroomlight"]);
    }
  }
}

// Lights last so they sit in the air gap behind the glass
for (const [x, y, z, b, p] of lights) put(x, y, z, b, p);

// Roof plant penthouse centred on the interior, fully on interior cells
if (interiorCells.length) {
  const cxI = Math.round(interiorCells.reduce((a, c) => a + c[0], 0) / interiorCells.length);
  const czI = Math.round(interiorCells.reduce((a, c) => a + c[1], 0) / interiorCells.length);
  const ok = (x, z) => inside(x, z) && outwards(x, z).length === 0;
  let boxOk = true;
  for (let x = cxI - 2; x <= cxI + 2; x++)
    for (let z = czI - 2; z <= czI + 2; z++)
      if (!ok(x, z)) boxOk = false;
  if (boxOk) {
    for (let x = cxI - 2; x <= cxI + 2; x++)
      for (let z = czI - 2; z <= czI + 2; z++) {
        put(x, PARA, z, "light_gray_concrete");
        put(x, PARA + 1, z, "light_gray_concrete");
        put(x, PARA + 2, z, "smooth_quartz_slab", { type: "bottom" });
      }
    // mechanical louvre cue and rooftop antenna
    put(cxI, PARA + 3, czI, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
