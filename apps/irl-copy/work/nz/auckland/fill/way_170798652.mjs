// Auckland way 170798652: a 1930s brick-and-render stripped-classical commercial block on the Mt Eden side of the CBD.
// Five storeys on the lidar roof (median-smoothed, quantised to 4-block storeys), a six-storey core, two-storey wings,
// a cream string course per storey, glazed bays between brick piers, a shopfront entrance under a lantern, and a
// flat roof with plant boxes. Walls are one block thick; behind each window is an air gap, with a few glowstone lamps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_170798652.cells.json`, "utf8"));
const g = new Voxels([37, 36, 31]);

const at = new Map(cells.map(([x, z, gnd, roof]) => [`${x},${z}`, { x, z, gnd, roof }]));
const inFp = (x, z) => at.has(`${x},${z}`);
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const FACING = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };

// Smooth the lidar roof with a 3x3 median over footprint cells, then whole 4-block storeys (at least 4 above the ground).
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
for (const c of at.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(c.x + dx, c.z + dz)) near.push(at.get(`${c.x + dx},${c.z + dz}`).roof);
  c.top = Math.max(4 * Math.round(median(near) / 4), 4 * Math.ceil((c.gnd + 4) / 4));
}

// Exposed faces: outside the footprint, or against a lower tier. u is the coordinate along the primary wall. (Stepped
// lidar edges would make every step a corner, so there are no quoin columns; piers come from the bay pattern alone.)
for (const c of at.values()) {
  c.out = NORMALS.filter(([dx, dz]) => { const n = at.get(`${c.x + dx},${c.z + dz}`); return !n || n.top < c.top; });
  c.facade = c.out.length > 0;
  c.nrm = c.out.find(([dx, dz]) => !inFp(c.x + dx, c.z + dz)) ?? c.out[0];
  c.u = c.nrm && c.nrm[0] !== 0 ? c.z : c.x;
}

// The entrance: a plain (non-corner) street-level wall cell near the middle of the north front, with a lantern over it.
const sameWall = (a, b) => a.nrm && b.nrm && a.nrm[0] === b.nrm[0] && a.nrm[1] === b.nrm[1];
const entry = [...at.values()]
  .filter((c) => c.facade && c.out.length === 1 && c.top >= 8 && c.gnd <= 3 && !inFp(c.x + c.nrm[0], c.z + c.nrm[1]))
  .sort((a, b) => a.gnd - b.gnd || Math.abs(a.x - 18) + Math.abs(a.z - 0) - (Math.abs(b.x - 18) + Math.abs(b.z - 0)));
const door = entry[0];
if (door) door.door = true;

// Facade rows (storey s = y/4, row r = y%4): r0 cream string course, r1-2 glazed bays between brick piers, r3 brick.
for (const c of at.values()) {
  const { x, z, gnd: G, top: R } = c;
  for (let y = 0; y < R; y++) {
    if (y < G) { g.set(x, y, z, "stone_bricks"); continue; }                               // foundation under the slope
    if (!c.facade) {                                                                      // interior: air, floor slabs, roof deck
      if (y === 0 || (y > G && y % 4 === 0 && y < R - 1)) g.set(x, y, z, "smooth_stone");
      else if (y === R - 1) g.set(x, y, z, "gray_concrete");
      continue;
    }
    if (door && c === door && y >= G && y <= G + 2) {                                    // entrance: door, then lantern
      if (y === G) g.set(x, y, z, "oak_door", { facing: FACING[`${c.nrm[0]},${c.nrm[1]}`], half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === G + 1) g.set(x, y, z, "oak_door", { facing: FACING[`${c.nrm[0]},${c.nrm[1]}`], half: "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (y === R - 1) { g.set(x, y, z, "smooth_stone"); continue; }                        // cornice cap
    if (y === G) { g.set(x, y, z, "polished_andesite"); continue; }                       // base course
    if (door && y >= G && y <= G + 2 && sameWall(c, door) && Math.abs(c.u - door.u) === 1) {
      g.set(x, y, z, "polished_andesite"); continue;                                       // door surround
    }
    const r = y % 4;
    if (r === 0){ g.set(x, y, z, "white_concrete"); continue; }                           // string course
    if (r === 3) { g.set(x, y, z, "bricks"); continue; }
    const bay = c.u % 4;
    if (bay === 0 || bay === 3) { g.set(x, y, z, "bricks"); continue; }                    // brick piers
    const [nx, nz] = c.nrm;
    const pane = nx !== 0 ? { north: "true", south: "true", east: "false", west: "false" }
                          : { east: "true", west: "true", north: "false", south: "false" };
    g.set(x, y, z, "light_blue_stained_glass_pane", pane);
    // a warm lamp in some windows, one block behind the glass in the air gap
    const bx = x - nx, bz = z - nz, behind = at.get(`${bx},${bz}`);
    if (behind && !behind.facade && y >= behind.gnd && y < behind.top && (x * 7 + y * 5 + z * 3) % 5 === 0) g.set(bx, y, bz, "glowstone");
  }
  // coping on top of the cornice, and the roof stands on the walls below it
  if (c.facade && R < 36) g.set(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: 2x2 units on the interior roof, two storeys tall on the core.
for (const c of at.values()) {
  if (c.facade || c.x % 7 !== 3 || c.z % 7 !== 3) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at.get(`${c.x + dx},${c.z + dz}`));
  if (block.some((b) => !b || b.facade || b.top !== c.top)) continue;
  for (const b of block) {
    g.set(b.x, b.top, b.z, "light_gray_concrete");
    if (b.top >= 24) g.set(b.x, b.top + 1, b.z, "iron_block");
  }
}

const info = g.save(`${dir}/way_170798652.nbt`);
console.log(`way_170798652.nbt: ${info.blocks} blocks, ${info.palette} palette entries; entrance at`, door ? [door.x, door.gnd, door.z] : "none");
