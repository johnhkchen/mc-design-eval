// 132 West 47th Street, the Portland Square Hotel: a 1939 commercial and office block in the Moderne style of its years.
// Footprint 10 x 25 with a notch either side at z 6-17 (x = across the block, z = along it; low z = north = the 47th
// Street front, with the hotel door and shopfront). A body to 31 blocks (ten storeys of 3 blocks over a dark base and
// a cornice), and a core set back two blocks on every side, up to 35 (the lidar ridge), with a mechanical room on top.
// Cream limestone walls, quartz-pillar piers on a 3-block grid, grey storey bands, dark glass in the bays, clear shop
// glass and iron doors in the street front, and warm light behind a few panes. Solid mass (no rooms): an air pocket one
// block deep behind each pane, and each storey band is the floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022669.cells.json`, "utf8"));
const X = 10, Z = 25, H = 38;

// Footprint: [x, z, ground, roof]. The lidar roofs run 31-35; flattened to two tiers.
const footprint = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, { ground }]));
if (footprint.size !== cells.length) throw new Error("duplicate footprint cells");
const has = (x, z) => footprint.has(`${x},${z}`);
const ground = (x, z) => footprint.get(`${x},${z}`).ground;

const BODY = 31, CORE = 35;
const core = (x, z) => has(x, z) && x >= 2 && x <= 7 && z >= 2 && z <= 22;
const top = (x, z) => (core(x, z) ? CORE : BODY);

// Storey bands, 3 blocks apart from the ground floor (y 5, 8 ... 29), and the band over the core's first storey (31).
const BANDS = new Set([5, 8, 11, 14, 17, 20, 23, 26, 29, 31]);
const CORNICE = 30, CAP = 34;     // top course of the body (outside the core) and of the core

// Faces: outside = the neighbour column is not in the footprint, so the wall is open from the ground up.
const DIRS = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "east", dx: 1, dz: 0, along: "z" },
];
const pane = (along) => along === "x"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
const pillar = { axis: "y" };

const g = new Voxels([X, H, Z]);

// 1. Solid mass: stone foundations below each cell's ground, cream limestone above, to the cell's tier.
for (const [key, { ground: gr }] of footprint) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < top(x, z); y++) g.set(x, y, z, y < gr ? "stone_bricks" : "smooth_quartz");
}

// 2. Roof tops: a dark cornice course on the body, a dark cap on the core.
for (const [key] of footprint) {
  const [x, z] = key.split(",").map(Number);
  if (core(x, z)) g.set(x, CAP, z, "polished_blackstone");
  else g.set(x, CORNICE, z, "polished_blackstone");
}

// 3. Facades: every face that looks onto air (outside, or onto a lower tier) gets the bay rhythm.
//    Piers on a 3-block grid (x or z = 0, 3, 6 ...), two-block bays between them.
const LIT = (t, y, c) => (t * 5 + y * 3 + (c ? 4 : 0)) % 9 === 0;
const DOOR_BAY = { north: [4, 5], south: [7, 8] };    // the entrance bay on each street face
for (const [key, { ground: gr }] of footprint) {
  const [x, z] = key.split(",").map(Number);
  const c = core(x, z), topHere = top(x, z);
  for (const d of DIRS) {
    const nx = x + d.dx, nz = z + d.dz;
    const outside = !has(nx, nz);
    const lo = outside ? 0 : top(nx, nz);
    if (!outside && lo >= topHere) continue;                // a neighbour at the same height: no face
    const t = d.along === "x" ? x : z;                       // position along the face
    const ix = x - d.dx, iz = z - d.dz;                      // one block inside the face, for the air pocket
    const doorBay = DOOR_BAY[d.name]?.includes(t) ?? false;
    for (let y = lo; y < topHere; y++) {
      if (outside && y < gr) continue;                       // foundation: already stone
      if (outside && y === gr) { g.set(x, y, z, "polished_blackstone"); continue; }   // base course at grade
      if (!c && y === CORNICE) { g.set(x, y, z, "polished_blackstone"); continue; }
      if (doorBay && y === 5) { g.set(x, y, z, "polished_blackstone"); continue; }     // header over the door
      if (BANDS.has(y)) { g.set(x, y, z, "polished_andesite"); continue; }
      if (t % 3 === 0) { g.set(x, y, z, "quartz_pillar", pillar); continue; }
      // Bay: the ground floor of the street front is shop glass and doors; everything else is office glass.
      const shopfront = d.name === "north" && y <= 4;
      if (doorBay && (y === 3 || y === 4)) {
        g.set(x, y, z, "iron_door", door(d.name === "north" ? "south" : "north", y === 3 ? "lower" : "upper"));
        g.set(ix, y, iz, "air");
        continue;
      }
      const lit = LIT(t, y, c) && !doorBay;
      g.set(x, y, z, shopfront ? "glass_pane" : lit ? "glass_pane" : "gray_stained_glass_pane", pane(d.along));
      g.set(ix, y, iz, lit ? "glowstone" : "air");
    }
  }
}

// 4. Roof: a mechanical room on the core, louvred on its south face, capped in dark stone.
for (let x = 3; x <= 5; x++) for (let z = 9; z <= 11; z++) for (let y = CAP + 1; y <= CAP + 2; y++) g.set(x, y, z, "smooth_quartz");
for (let x = 3; x <= 5; x++) for (let z = 9; z <= 11; z++) g.set(x, CAP + 3, z, "polished_blackstone");
for (const y of [CAP + 1, CAP + 2]) g.set(4, y, 11, "iron_bars", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });

const stats = g.save(`${DIR}/NYC1022669.nbt`);
console.log(`NYC1022669.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries`);
