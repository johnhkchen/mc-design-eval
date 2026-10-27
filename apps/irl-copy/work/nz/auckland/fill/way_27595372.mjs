// Kate Edger Information Commons (OSM way 27595372): a late-1970s campus block of cast concrete and tinted glazing on a
// basalt (bluestone) plinth. Storeys are 4 blocks (3.3 m): a concrete floor line, then three rows of glazing between
// piers on a 4-block bay. Roof heights from the lidar are median-smoothed, then snapped to storey tiers so each tier is flat.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_27595372.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..85, z 0..95
const W = 86, D = 96, H = 40;
const key = (x, z) => x + "," + z;
const raw = new Map(); for (const [x, z, g, r] of cells) raw.set(key(x, z), { x, z, g, r });

// Lidar smoothing: median of ground and roof over the footprint cells within 2 blocks, then roof to 4-block storey tiers.
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const cellsMap = new Map();
for (const c of raw.values()) {
  const gs = [], rs = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = raw.get(key(c.x + dx, c.z + dz)); if (n) { gs.push(n.g); rs.push(n.r); } }
  const g = median(gs), r = median(rs);
  const court = r <= 2;                                                  // the open lower court in the middle (roof 0-2)
  const t = court ? 0 : Math.min(28, Math.max(g + 4, Math.round(r / 4) * 4));   // flat storey tiers: 4, 8, ... 28 (the tower)
  cellsMap.set(key(c.x, c.z), { x: c.x, z: c.z, g, court, t, top: court ? g + 1 : t });
}

const DIRS = [                                  // the exposed face: dx/dz points outward, axis is what runs along the face
  { dx: 0, dz: -1, name: "north", axis: "x" }, { dx: 0, dz: 1, name: "south", axis: "x" },
  { dx: -1, dz: 0, name: "west", axis: "z" }, { dx: 1, dz: 0, name: "east", axis: "z" },
];
const solid = (x, y, z) => { const c = cellsMap.get(key(x, z)); return !!c && y < c.top; };
const exposed = (c, y) => DIRS.filter((d) => !solid(c.x + d.dx, y, c.z + d.dz));

// The street front: the face with the most ground-level wall, near the lowest ground. The entrance goes on its middle.
const minG = Math.min(...[...cellsMap.values()].map((c) => c.g));
const faceCount = new Map(DIRS.map((d) => [d.name, []]));
for (const c of cellsMap.values()) if (!c.court && c.g <= minG + 1) for (const d of exposed(c, c.g)) faceCount.get(d.name).push(c);
const street = DIRS.find((d) => faceCount.get(d.name).length === Math.max(...[...faceCount.values()].map((a) => a.length)));
const onFace = faceCount.get(street.name).sort((a, b) => (street.axis === "x" ? a.x - b.x : a.z - b.z));
const mid = onFace[onFace.length >> 1], u0 = street.axis === "x" ? mid.x : mid.z;
const portal = onFace.filter((c) => Math.abs((street.axis === "x" ? c.x : c.z) - u0) <= 1);   // 3 blocks wide
const portalKeys = new Set(portal.map((c) => key(c.x, c.z)));
const inward = (c) => ({ x: c.x - street.dx, z: c.z - street.dz });

const cladOf = (c, y, d) => {
  const u = d.axis === "x" ? c.x : c.z;
  if (y === c.g) return "polished_andesite";                              // basalt plinth course
  if (y === c.t - 1) return "smooth_stone";                               // cornice
  if (y % 4 === 0) return "white_concrete";                               // storey floor line
  if (u % 4 === 0) return Math.floor(y / 4) === 0 ? "stone_bricks" : "light_gray_concrete";   // piers, stone at street level
  return "light_blue_stained_glass";
};

const g = new Voxels([W, H, D]);
const glazed = [];                                                        // [cell, y, dir] for lights behind the glass
for (const c of cellsMap.values()) {
  for (let y = 0; y < c.top; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, "stone_bricks"); continue; }          // foundation down to the lowest ground
    if (c.court) { g.set(c.x, y, c.z, "smooth_stone"); continue; }          // the court is paved at its ground
    const ex = exposed(c, y);
    if (!ex.length) {                                                     // inside: an air gap, a floor slab per storey, a roof
      if (y === c.g || y % 4 === 0) g.set(c.x, y, c.z, "smooth_stone");
      if (y === c.t - 1) g.set(c.x, y, c.z, "light_gray_concrete");
      continue;
    }
    const d = ex[0], block = cladOf(c, y, d);
    g.set(c.x, y, c.z, block);
    if (block === "light_blue_stained_glass") glazed.push([c, y, d]);
    if (y === c.t - 1) g.set(c.x, c.t, c.z, "white_concrete");           // parapet on the roof edge
  }
}

// Warm rooms: a lamp on the floor just inside some windows (row 1 of each storey sits on that storey's slab).
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
for (const [c, y, d] of glazed) {
  if (!(y % 4 === 1 || y === c.g + 1) || hash(c.x, y, c.z) % 6 !== 0) continue;
  const q = { x: c.x - d.dx, z: c.z - d.dz }, qc = cellsMap.get(key(q.x, q.z));
  if (!qc || portalKeys.has(key(q.x, q.z)) || solid(q.x, y, q.z) === false) continue;
  if (exposed({ x: q.x, z: q.z }, y).length) continue;                    // only inside a room, not a shell cell
  g.set(q.x, y, q.z, hash(c.x, y, c.z) % 3 ? "glowstone" : "lantern", hash(c.x, y, c.z) % 3 ? undefined : { hanging: "false", waterlogged: "false" });
}

// The entrance: a recess 3 wide and 3 high, a door at its centre with glazed sides, and a stone canopy over the recess.
const facing = street.name;
for (const p of portal) {
  for (let y = p.g; y <= p.g + 2; y++) g.set(p.x, y, p.z, "air");
  g.set(p.x, p.g + 3, p.z, "stone_bricks");
  const q = inward(p);
  if (!cellsMap.has(key(q.x, q.z))) continue;
  const centre = (street.axis === "x" ? p.x : p.z) === u0;
  for (let y = p.g; y <= p.g + 2; y++) {
    if (!centre) g.set(q.x, y, q.z, "light_blue_stained_glass");
    else if (y <= p.g + 1) {
      const st = { facing, hinge: "left", open: "false", powered: "false", half: y === p.g ? "lower" : "upper" };
      g.set(q.x, y, q.z, "dark_oak_door", st);
    } else g.set(q.x, y, q.z, "air");
  }
}

// Plant on the tower roof: 4 x 4 solid boxes two high, placed on a grid where the whole box stands on the tier.
const tower = (x, z) => { const c = cellsMap.get(key(x, z)); return !!c && c.t === 28 && !c.court; };
let plant = 0;
for (let z = 2; z < D - 2; z += 9) for (let x = 2; x < W - 2; x += 9) {
  let ok = true;
  for (let dz = -1; dz <= 4 && ok; dz++) for (let dx = -1; dx <= 4 && ok; dx++) if (!tower(x + dx, z + dz)) ok = false;
  if (!ok) continue;
  for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) for (let y = 28; y < 30; y++) g.set(x + dx, y, z + dz, "light_gray_concrete");
  plant++;
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_27595372.nbt");
console.log({ street: street.name, entranceU: u0, portal: portal.length, glazed: glazed.length, plant, ...stats });
