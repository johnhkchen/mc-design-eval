// A three-tier brick commercial block (Edwardian-to-interwar Auckland): basalt plinth, shopfront at street level,
// two storeys of brick with stone piers and sash-style glazing, a flat roof behind a parapet, and a stepped tower
// core. Built only on the footprint: foundation up to each cell's ground, then the envelope, floor slabs and a roof
// deck. Interiors are air behind the glass; a few lamps sit in the rooms behind panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_291095564.cells.json`, "utf8"));

const W = 26, D = 39, H = 16;
const g = new Voxels([W, H, D]);

// Footprint: ground (foundation top) and roof tier per cell. The lidar roofs 10..13 read as three flat tiers:
// 10 = low wings, 11 = the body, 12-13 = the tower core (12 sits on the core's edge, so it rises with it).
const G = new Map(), T = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, ground, roof] of cells) {
  G.set(key(x, z), ground);
  T.set(key(x, z), roof >= 12 ? 13 : roof === 11 ? 11 : 10);
}
const list = cells.map(([x, z]) => [x, z]);
const inF = (x, z) => T.has(key(x, z));
const gOf = (x, z) => G.get(key(x, z));
const tOf = (x, z) => T.get(key(x, z));

// Outward directions, z faces first (the long walls); the cell's wall is open to a neighbour that is outside the
// footprint or whose roof void (the air above its deck, inside its parapet) or above.
const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const open = (x, z, y, [dx, dz]) => !inF(x + dx, z + dz) || y >= tOf(x + dx, z + dz) - 1;
const exposed = (x, z, y) => DIRS.some((d) => open(x, z, y, d));
const faceDir = (x, z, y) => DIRS.find((d) => open(x, z, y, d));
const along = (x, z, d) => (d[1] ? x : z);            // position along the wall a cell's face sits on
const facing = { "0,1": "north", "0,-1": "south", "1,0": "east", "-1,0": "west" };

// Entrance: the widest outward face at street level (the most bays, glazed rather than pier), door on its middle bay.
const streetCells = (d) => list.filter(([x, z]) => !inF(x + d[0], z + d[1]) && faceDir(x, z, gOf(x, z) + 1) === d && along(x, z, d) % 3 !== 0);
let entrance = null;
for (const d of DIRS) {
  const c = streetCells(d);
  if (c.length > (entrance?.n ?? 0)) {
    const sorted = c.slice().sort((a, b) => along(a[0], a[1], d) - along(b[0], b[1], d));
    const [x, z] = sorted[Math.floor(sorted.length / 2)];
    entrance = { d, x, z, n: c.length };
  }
}
const isEntrance = (x, z) => entrance && x === entrance.x && z === entrance.z;

// Warm light behind about a third of the panes (the room behind the glass is air; the lamp sits on its floor).
const lit = (x, z, d, k) => (along(x, z, d) + 2 * k + (d[1] ? 0 : 1)) % 3 === 1;
const paneState = (d) => (d[1]
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [x, z] of list) {
  const gy = gOf(x, z), t = tOf(x, z);
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");                      // foundation: nothing floats on the slope
  for (let y = gy; y < t; y++) {
    const rel = y - gy, k = Math.floor(rel / 4), r = rel % 4;
    if (exposed(x, z, y)) {
      const d = faceDir(x, z, y);
      if (y === t - 1) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }   // parapet cap
      if (r === 0) { g.set(x, y, z, "stone_bricks"); continue; }                                                 // plinth / string course
      if (r === 3) { g.set(x, y, z, k === 0 ? "dark_oak_planks" : "bricks"); continue; }                         // shopfront fascia / lintel band
      if (isEntrance(x, z) && k === 0 && (r === 1 || r === 2)) {                                                  // the door
        g.set(x, y, z, "dark_oak_door", { facing: facing[d.join()], half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (along(x, z, d) % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                                  // pale dressed-stone piers frame the bays
      g.set(x, y, z, "glass_pane", paneState(d));
      if (r === 1 && lit(x, z, d, k)) {                                                                          // lamp inside, behind the glass
        const ix = x - d[0], iz = z - d[1];
        if (inF(ix, iz) && !exposed(ix, iz, y) && y !== tOf(ix, iz) - 2 && y < tOf(ix, iz) - 1)
          g.set(ix, y, iz, k === 0 ? "glowstone" : "shroomlight");
      }
    } else if (rel % 4 === 0 || y === t - 2) {
      g.set(x, y, z, "smooth_stone");                                                                            // floor slab per storey; roof deck
    }
  }
}

// Rooftop plant: a small plant block on the body's deck (2 high), and a lift overrun on the tower core.
{
  let placed = false;
  for (let z0 = 0; z0 < D && !placed; z0++) for (let x0 = 0; x0 < W && !placed; x0++) {
    const ok = [0, 1, 2].every((dx) => [0, 1].every((dz) => {
      const x = x0 + dx, z = z0 + dz;
      return inF(x, z) && tOf(x, z) === 11 && !exposed(x, z, 10);
    }));
    if (!ok) continue;
    for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) {
      g.set(x0 + dx, 10, z0 + dz, "stone_bricks");
      g.set(x0 + dx, 11, z0 + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    placed = true;
  }
  let core = false;
  for (let z0 = 0; z0 < D && !core; z0++) for (let x0 = 0; x0 < W && !core; x0++) {
    const ok = [0, 1].every((dx) => [0, 1].every((dz) => {
      const x = x0 + dx, z = z0 + dz;
      return inF(x, z) && tOf(x, z) === 13 && !exposed(x, z, 12);
    }));
    if (!ok) continue;
    for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
      g.set(x0 + dx, 12, z0 + dz, "smooth_stone");
      g.set(x0 + dx, 13, z0 + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    core = true;
  }
}

const out = `${HERE}/way_291095564.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ out, entrance: entrance && { x: entrance.x, z: entrance.z, face: entrance.d }, ...stats }));
