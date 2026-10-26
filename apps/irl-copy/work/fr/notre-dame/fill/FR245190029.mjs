// FR245190029: the nave and aisles of Notre-Dame de Paris (1163-1345), on the lidar footprint. The high nave (35 blocks,
// 7 storeys of 5) stands over lower aisle and chapel wings (10-30). Storeys are 5 blocks: a stone string course on
// y = 5k (floor slab, sill, lintel), glazed window rows at 5k+1..5k+3, a band at 5k+4. Walls are a one-block shell on
// the footprint's edge and on each setback; the roof cap is dark deepslate, on a stone parapet at the wall ring.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245190029.cells.json`, "utf8"));

const W = 35, H = 51, D = 22;
const WALL = "smooth_sandstone", BAND = "stone_bricks", PLINTH = "polished_andesite", ROOF = "deepslate_tiles";
const GLASS = "light_blue_stained_glass_pane";
const NEI = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const raw = new Map();                                // "x,z" -> lidar roof height above y 0
for (const [x, z, , r] of cells) raw.set(`${x},${z}`, r);
const has = (x, z) => raw.has(`${x},${z}`);

// Lidar noise: the median of each cell and its present neighbours, then the nearest 5-block tier (never under 10).
const cell = new Map();
for (const [key, r] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [r];
  for (const [dx, dz] of Object.values(NEI)) if (has(x + dx, z + dz)) vals.push(raw.get(`${x + dx},${z + dz}`));
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  cell.set(key, { x, z, T: Math.max(10, Math.round(med / 5) * 5), missing: [], steps: [] });
}
const at = (x, z) => cell.get(`${x},${z}`);

// Exposed faces: a missing neighbour is the outside (a street face); a lower neighbour is a setback (the taller wall rises above it).
for (const c of cell.values()) {
  for (const [d, [dx, dz]] of Object.entries(NEI)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) c.missing.push(d);
    else if (n.T < c.T) c.steps.push({ d, Tn: n.T });
  }
}

const V = new Voxels([W, H, D]);
const pane = (face) => (face === "north" || face === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// The entrance: three doors in the nave's north wall, between the pilasters at x = 8 and x = 12, under a lantern.
const DOOR_X = [9, 10, 11];
const doorAt = (x, z, y) => z === 0 && DOOR_X.includes(x) && (y === 1 || y === 2);

let lamps = 0;
for (const c of cell.values()) {
  const { x, z, T, missing, steps } = c;
  V.set(x, 0, z, PLINTH);
  for (let y = 1; y < T; y++) {
    if (y === T - 1) { V.set(x, y, z, missing.length ? BAND : ROOF); continue; }     // parapet on the ring, roof inside
    if (y % 5 === 0) { V.set(x, y, z, BAND); continue; }                              // floor slab / string course per storey
    const row = y % 5;                                                              // 1..3 glazing, 4 lintel band
    if (missing.length === 0) {
      // a setback face: solid wall above the lower neighbour's top, air where the wing sits inside the footprint
      for (const s of steps) if (y >= s.Tn) V.set(x, y, z, row === 4 ? BAND : WALL);
      continue;
    }
    if (missing.length > 1 || row === 4) { V.set(x, y, z, BAND); continue; }           // corner pillar; lintel band
    const face = missing[0];
    const bay = face === "north" || face === "south" ? x : z;
    if (face === "north" && z === 0 && x >= 8 && x <= 12) {                           // the entrance bay
      if (doorAt(x, z, y)) {
        const st = { facing: "north", hinge: "left", open: "false", powered: "false" };
        V.set(x, y, z, "dark_oak_door", { ...st, half: y === 1 ? "lower" : "upper" });
      } else if (y === 3) {
        if (x === 10) V.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else V.set(x, y, z, BAND);
      } else V.set(x, y, z, BAND);
      continue;
    }
    if (bay % 4 === 0) { V.set(x, y, z, BAND); continue; }                           // pilaster every 4 bays
    V.set(x, y, z, GLASS, pane(face));
    // warm light behind some glass, on the floor of the room inside (interior air, not a wall)
    const [dx, dz] = NEI[face];
    const inner = at(x - dx, z - dz);
    if (row === 1 && (bay + y) % 4 === 1 && inner && inner.T > y && inner.missing.length === 0 && inner.steps.length === 0) {
      V.set(x - dx, y, z - dz, "glowstone"); lamps++;
    }
  }
}

const out = `${DIR}/FR245190029.nbt`;
const info = V.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries, ${lamps} lamps`);
