// Northern Club, Auckland: a six-storey stripped-classical club (1920s-30s, reinforced concrete with a cream render
// over a volcanic stone base). The lidar roof is smoothed over each cell's 3x3 neighbourhood and quantised into four
// flat tiers (24 main, 20 and 16 wings, 12 low), so the mass steps down to the north-east. Storey lines hang from each
// tier's top (4-block storeys, so the floors line up across the tiers), the foundation fills up to each cell's ground,
// and every floor, cap and wall stands on the course below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const rows = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_42475927.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, ground, roof] of rows) C.set(key(x, z), { x, z, ground, roof });
const nbr = (c, dx, dz) => C.get(key(c.x + dx, c.z + dz));
const FACES = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const NEAR = [...FACES, [1, 1], [1, -1], [-1, 1], [-1, -1]];

const tierOf = (r) => (r >= 23 ? 24 : r >= 19 ? 20 : r >= 14 ? 16 : 12);

for (const c of C.values()) {
  const rs = [c.roof];
  for (const [dx, dz] of NEAR) { const n = nbr(c, dx, dz); if (n) rs.push(n.roof); }
  rs.sort((a, b) => a - b);
  c.smooth = rs[(rs.length - 1) >> 1];                       // median over the 3x3 neighbourhood: lidar noise out
  c.top = Math.max(tierOf(c.smooth), c.ground + 4);          // the tier's top (roof surface); at least one storey clear of ground
}

// the faces of cell c that show at height y: outward (no footprint cell beside it), or against a lower tier's roof
const faces = (c, y) => {
  const f = [];
  for (const [dx, dz] of FACES) {
    const n = nbr(c, dx, dz);
    if (!n) { if (y <= c.top) f.push([dx, dz]); }                       // the parapet is on the outside only
    else if (y < c.top && n.top <= y) f.push([dx, dz]);                 // the taller part's wall above the lower roof
  }
  return f;
};

const g = new Voxels([47, 38, 28]);

// the facade course at height y on a shell cell
const facade = (c, y, fs) => {
  if (y === c.ground) return "polished_andesite";                       // base course on the volcanic stone
  if (y === c.top - 1) return "smooth_quartz";                          // cornice under the parapet
  if (y % 4 === 0) return "smooth_quartz";                              // string course at each storey line
  const pier = fs.some(([dx, dz]) => (dz !== 0 ? c.x % 3 === 0 : c.z % 3 === 0));   // quartz piers every 3 blocks
  if (pier) return "quartz_pillar";
  if (y % 4 === 3 && y >= 4) return "white_concrete";                   // spandrel under each window band
  return "glass";                                                       // windows (ground storey: shopfront glazing)
};

for (const c of C.values()) {
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, "stone_bricks");   // foundation up to this cell's ground
  for (let y = c.ground; y <= c.top; y++) {
    const fs = faces(c, y);
    if (y === c.top) {
      if (fs.length) g.set(c.x, y, c.z, "stone_bricks");                  // parapet
      else if (c.top === 24 && c.x % 9 === 4 && c.z % 6 === 2 && [[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => nbr(c, dx, dz)?.top === 24 && !faces(nbr(c, dx, dz), 24).length)) {
        // a 2 x 2 plant room on the main roof (the group's cells all sit on the interior roof)
        for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(c.x + dx, y, c.z + dz, "iron_block");
      }
      continue;
    }
    if (fs.length) { g.set(c.x, y, c.z, facade(c, y, fs)); continue; }
    if (y === c.top - 1) g.set(c.x, y, c.z, "light_gray_concrete");        // roof membrane over the interior
    else if (y % 4 === 0 && y > c.ground) g.set(c.x, y, c.z, "stone");     // a floor slab per storey
  }
}

// the entrance on the north face, at the lowest ground: a door on the base course, a canopy over it
const door = C.get(key(9, 0));
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(9, door.ground + 1, 0, "dark_oak_door", doorState("lower"));
g.set(9, door.ground + 2, 0, "dark_oak_door", doorState("upper"));
for (const [x, z] of [[8, 0], [9, 0], [8, 1], [9, 1], [10, 1]])
  g.set(x, door.ground + 3, z, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });

// warm light behind some upper-storey windows (interior air cells, one per window group)
for (const c of C.values()) {
  const fs = faces(c, 0);
  if (!fs.length) continue;
  for (let y = 4; y < c.top - 1; y++) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    const outer = faces(c, y);
    if (!outer.length || (c.x % 3 === 0 && outer.every(([dx, dz]) => (dz !== 0 ? c.x % 3 === 0 : c.z % 3 === 0)))) continue;
    if ((c.x + c.z + Math.floor(y / 4)) % 4 !== 0 || y % 4 !== 1) continue;
    const [dx, dz] = outer[0];
    const t = nbr(c, -dx, -dz);
    if (!t || faces(t, y).length || y >= t.top - 1 || y <= t.ground) continue;
    g.set(t.x, y, t.z, (c.x + c.z + Math.floor(y / 4)) % 8 === 0 ? "shroomlight" : "glowstone");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_42475927.nbt";
const r = g.save(out);
console.log(JSON.stringify({ cells: rows.length, tops: [...new Set([...C.values()].map((c) => c.top))], ...r }));
