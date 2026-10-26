import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1200 S St NW: a two-storey Federal-revival institutional block (red brick on a stone plinth, calcite trim,
// flat roof with a stone parapet and roof plant). Storeys are read from the lidar roof heights, 1 block per storey
// row here, as the record's scale gives.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70627.cells.json`, "utf8"));

const W = 72, H = 19, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const has = (x, z) => raw.has(key(x, z));

// Smoothed massing: the lidar roof is noisy cell to cell, so each cell takes the median roof of its 3x3 footprint
// neighbourhood (flat tiers, no pinholes), never below its own ground. Ground stays as recorded.
const cellsOut = new Map();
for (const [x, z, gr] of cells) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const c = raw.get(key(x + dx, z + dz));
      if (c) vals.push(c.roof);
    }
  vals.sort((a, b) => a - b);
  const r = Math.max(gr, vals[Math.floor(vals.length / 2)]);
  cellsOut.set(key(x, z), { x, z, g: gr, r });
}
const at = (x, z) => cellsOut.get(key(x, z));

// A face is exposed at height y when the neighbour on that side is outside the footprint or does not reach y.
function exposure(c, y) {
  const open = (n) => !n || y >= n.r;
  return {
    ex: open(at(c.x - 1, c.z)) || open(at(c.x + 1, c.z)),   // east or west face
    ez: open(at(c.x, c.z - 1)) || open(at(c.x, c.z + 1)),   // north or south face
  };
}

// Entrance: the north (street-side) face cell nearest the middle of the front, two blocks high.
const DOOR_X = 13;
const doorZ = Math.min(...cells.filter(([x]) => x === DOOR_X).map(([, z]) => z));
const isDoor = (x, z, y) => x === DOOR_X && z === doorZ && (y === at(x, z).g || y === at(x, z).g + 1);

// Warm light: a glowing block in the air gap behind some windows (never on a floor or deck row).
function lampCell(c) {
  const cand = [];
  if (!at(c.x, c.z - 1)) cand.push([c.x, c.z + 1]); else if (!at(c.x, c.z + 1)) cand.push([c.x, c.z - 1]);
  if (!at(c.x - 1, c.z)) cand.push([c.x + 1, c.z]); else if (!at(c.x + 1, c.z)) cand.push([c.x - 1, c.z]);
  return cand.map(([x, z]) => at(x, z)).find(Boolean) ?? null;
}

for (const c of cellsOut.values()) {
  const { x, z, g: gr, r } = c;
  const Hh = r - gr;

  // foundation: solid from y 0 to the ground; a terrace (no building above) gets a smooth top
  for (let y = 0; y < gr; y++) {
    const top = y === gr - 1 && r === gr;
    g.set(x, y, z, top ? "smooth_stone" : "stone_bricks");
  }
  if (r <= gr) continue;   // terrace or plaza, nothing above

  for (let y = gr; y < r; y++) {
    const k = y - gr;
    const { ex, ez } = exposure(c, y);
    const exposed = ex || ez;

    if (isDoor(x, z, y)) {
      const half = y === gr ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (k === Hh - 1) {                       // parapet / roof deck
      g.set(x, y, z, exposed ? "calcite" : "smooth_stone");
      continue;
    }
    if (k === 0) {                             // base course and ground floor slab
      if (exposed) g.set(x, y, z, Hh >= 3 ? "stone_bricks" : "bricks");
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (Hh >= 5 && k === Math.floor(Hh / 2)) {   // storey line: string course outside, floor slab inside
      g.set(x, y, z, exposed ? "calcite" : "smooth_stone");
      continue;
    }
    if (!exposed) continue;                    // interior: an air gap

    // window band: the facade is read along its own face (x along north/south, z along east/west)
    const p = ez ? x : z;
    const m = ((p % 4) + 4) % 4;
    if (x === DOOR_X - 1 || x === DOOR_X + 1) {   // jambs flanking the door
      g.set(x, y, z, "calcite");
    } else if (m === 0) {                      // pilaster: brick, so the facade reads red
      g.set(x, y, z, "bricks");
    } else if (m === 3) {                      // brick spandrel
      g.set(x, y, z, "bricks");
    } else {                                   // glass pane on the wall, connected along the face
      const along = ez ? { east: "true", west: "true", north: "false", south: "false" }
                       : { north: "true", south: "true", east: "false", west: "false" };
      g.set(x, y, z, "glass_pane", along);
      const lc = lampCell(c);
      if (lc && y >= lc.g && y < lc.r && ((x * 3 + z * 5 + y * 7) % 11 === 0) && !exposure(lc, y).ex && !exposure(lc, y).ez) {
        g.set(lc.x, y, lc.z, (x + z) % 2 ? "glowstone" : "shroomlight");
      }
    }
  }

  // roof plant: boxes on the deck, one block above it
  if (!exposure(c, r - 1).ex && !exposure(c, r - 1).ez && Hh >= 2 && (x * 5 + z * 3) % 13 === 0) {
    g.set(x, r, z, "stone_bricks");
  }
}

const info = g.save(`${DIR}/DC70627.nbt`);
console.log(JSON.stringify(info));
