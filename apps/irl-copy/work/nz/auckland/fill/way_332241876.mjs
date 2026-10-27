// way 332241876: a 1920s-30s Auckland brick commercial block on a corner, one storey of shops along the
// street (the lidar body roof sits at about 5 above y 0) with a two-storey middle block set back on the
// east and a three-storey corner tower on the south-east, to about 12. Red brick walls with white string
// courses and spandrel bands, a stone plinth on a stone foundation, shopfronts of glass between brick
// piers under dark-oak hoods, a parapet with pilaster caps, and a little plant on the tower roof. Tiers
// come from the lidar roof (body 4-6, middle 7-8, tower 9-11), smoothed into flat roofs at 5, 9 and 12.
// Walls are one block thick with air behind the glass; each storey has a slab floor standing on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241876.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241876.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const roofAt = new Map(), groundAt = new Map();
for (const [x, z, g, r] of cells) { roofAt.set(K(x, z), r); groundAt.set(K(x, z), g); }
const inF = (x, z) => roofAt.has(K(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "south", S: "north", W: "east", E: "west" };   // a door faces out of the building, so the player sees it from outside
const outsOf = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const nbrs = (x, z) => Object.keys(DIRS).map((d) => [x + DIRS[d][0], z + DIRS[d][1], d]).filter(([a, b]) => inF(a, b));

// Tiers from the lidar roof, median-smoothed over each cell and its neighbours in the footprint, so the
// single high edge cells (lidar noise at the walls) drop out. Tower: smoothed 9+. Middle: 7-8. Body: the rest.
// Flat roofs: body 5, middle 9, tower 12.
const TOP = { body: 5, mid: 9, tower: 12 };
const smoothed = new Map();
for (const [key] of roofAt) {
  const [x, z] = key.split(",").map(Number);
  const v = [roofAt.get(key), ...nbrs(x, z).map(([a, b]) => roofAt.get(K(a, b)))].sort((p, q) => p - q);
  smoothed.set(key, v[Math.floor(v.length / 2)]);
}
const tierOf = new Map();
// a tower needs two footprint neighbours, so a lone corner or edge cell stays a middle-tier pier
for (const [key, s] of smoothed) {
  const [x, z] = key.split(",").map(Number);
  tierOf.set(key, s >= 9 && nbrs(x, z).length >= 2 ? "tower" : s >= 7 ? "mid" : "body");
}
const topOf = (x, z) => TOP[tierOf.get(K(x, z))];

// Faces a cell shows: the outside of the footprint, and any side that drops to a lower tier.
const facesOf = (x, z) => {
  const t = topOf(x, z);
  return Object.keys(DIRS).filter((d) => {
    const a = x + DIRS[d][0], b = z + DIRS[d][1];
    return !inF(a, b) || topOf(a, b) < t;
  });
};

// Entrances: on the street-facing body walls, the longest straight run on each of the two busiest faces;
// the door sits in the middle of the run, with bays either side under the same hood.
function pickEntrances() {
  const faces = { N: [], S: [], W: [], E: [] };
  for (const key of roofAt.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (tierOf.get(key) !== "body") continue;
    const outs = outsOf(x, z);
    if (outs.length === 1) faces[outs[0]].push({ x, z });
  }
  return Object.entries(faces).sort((a, b) => b[1].length - a[1].length).slice(0, 2).map(([d, cs]) => {
    const vertical = d === "N" || d === "S";
    cs.sort((a, b) => (vertical ? a.x - b.x : a.z - b.z));
    const mid = Math.floor(cs.length / 2);
    return { d, door: cs[mid], bays: [cs[mid - 1], cs[mid + 1]].filter(Boolean) };
  });
}
const entranceAt = new Map();
const entrances = pickEntrances();
for (const e of entrances) {
  entranceAt.set(K(e.door.x, e.door.z), { role: "door", d: e.d });
  for (const b of e.bays) entranceAt.set(K(b.x, b.z), { role: "bay", d: e.d });
}

// Pane connections follow the wall: a pane joins the panes and piers beside it on its own face.
function paneState(d, x, z) {
  const c = (dx, dz) => (inF(x + dx, z + dz) ? "true" : "false");
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (d === "N" || d === "S") { st.east = c(1, 0); st.west = c(-1, 0); }
  else { st.north = c(0, -1); st.south = c(0, 1); }
  return st;
}

const g = new Voxels([22, 24, 23]);
const lightSpots = [];   // ground-floor and upper windows that may get a lantern just inside them

for (const [key, r] of roofAt) {
  const [x, z] = key.split(",").map(Number);
  const ground = groundAt.get(key), T = topOf(x, z), b = ground + 1;   // walls start one above the cell's ground
  const faces = facesOf(x, z);
  const exposed = faces.length > 0;
  const outs = outsOf(x, z);

  // foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope
  for (let y = 0; y <= ground; y++) g.set(x, y, z, "stone");

  for (let y = b; y <= T; y++) {
    const rel = (y - b) % 4;                  // 0 course/floor, 1-2 window rows, 3 spandrel
    const ent = y <= b + 2 ? entranceAt.get(key) : undefined;
    const d = faces[0];
    if (!exposed) {
      // interior: slab floors and the roof, air between them (no rooms furnished)
      if (y === T || rel === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const along = d === "N" || d === "S" ? x : z;
    const pier = along % 3 !== 1 || faces.length > 1;     // corners and the piers between windows
    const ground1 = y === b;                  // ground floor: plinth course
    if (y === T) { g.set(x, y, z, outs.length ? "smooth_quartz" : "stone_bricks"); continue; }   // cornice, or roof slab
    if (ent && ent.role === "door" && y <= b + 1) {
      g.set(x, y, z, "dark_oak_door", { facing: FACING[ent.d], half: y === b ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ent && y === b + 2) { g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" }); continue; }   // hood over the entrance
    if (ground1) { g.set(x, y, z, "stone_bricks"); continue; }                  // plinth course
    if (rel === 0) { g.set(x, y, z, "smooth_quartz"); continue; }                // string course at each floor
    if (rel === 3) { g.set(x, y, z, "white_concrete"); continue; }               // spandrel band
    // windows: glass panes between brick piers; the shopfront is full glass between stone piers
    const shop = y < b + 4;
    if (pier) g.set(x, y, z, "bricks");
    else if (shop) { g.set(x, y, z, "glass"); lightSpots.push({ x, y, z, d, along, rel }); }
    else { g.set(x, y, z, "glass_pane", paneState(d, x, z)); lightSpots.push({ x, y, z, d, along, rel }); }
  }

  // a low brick parapet on the outside edge of every tier
  if (outs.length) g.set(x, T + 1, z, "bricks");
}

// Warm light: a lantern on the floor just inside every sixth window's first row, so the glow shows in the pane.
// The cell inside is interior air on a floor slab, so the lantern stands on it.
for (const c of lightSpots) {
  if (c.rel !== 1 || c.along % 6 !== 1) continue;
  const [dx, dz] = DIRS[c.d];
  const ix = c.x - dx, iz = c.z - dz;
  if (!inF(ix, iz) || facesOf(ix, iz).length) continue;
  g.set(ix, c.y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

const stats = g.save(OUT);
const tiers = { body: 0, mid: 0, tower: 0 };
for (const t of tierOf.values()) tiers[t]++;
console.log(JSON.stringify({ cells: cells.length, tiers, entrances: entrances.map((e) => `${e.d}@${e.door.x},${e.door.z}`), ...stats }));
