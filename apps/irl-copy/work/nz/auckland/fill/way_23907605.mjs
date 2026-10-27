// Woolworths, Auckland: a 1980s-90s concrete-and-tinted-glass mixed-use block. A 2-block stone plinth, a ground-floor
// shopfront under a green lintel band, then 3-storey-tall bands (sill, glass, head) with white pier mullions. Massing
// follows the lidar roof, quantised to storey tiers (2, 3, 4, 5 storeys of 4 blocks from y 2), so every tier stands on
// the floor slab below it. Interior is air except one floor slab per storey and the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_23907605.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([110, 33, 82]);

// roof height -> storey tier top: 2 + 4n blocks, n storeys in 2..5
const tierOf = (roof) => 2 + 4 * Math.max(2, Math.min(5, Math.round((roof - 2) / 4)));

const at = new Map();                                    // "x,z" -> { ground, roof, T }
for (const [x, z, ground, roof] of cells) at.set(`${x},${z}`, { ground, roof, T: tierOf(roof) });
const has = (x, z) => at.has(`${x},${z}`);
const meanX = (list) => list.reduce((s, c) => s + c.x, 0) / list.length;

// perimeter cells and their outward faces
const faces = cells.map(([x, z]) => ({ x, z, n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) }));
const perimOf = (f) => f.n || f.s || f.w || f.e;

// two entrances, each the perimeter cell nearest the middle of its face: north (out -z) and south (out +z)
const pick = (face, facing) => {
  const list = faces.filter((f) => f[face]);
  const mx = meanX(list);
  const best = list.reduce((a, b) => (Math.abs(b.x - mx) < Math.abs(a.x - mx) ? b : a));
  return { x: best.x, z: best.z, facing };
};
const doors = [pick("n", "north"), pick("s", "south")];
const doorAt = (x, z) => doors.find((d) => d.x === x && d.z === z);

for (const f of faces) {
  const { x, z } = f;
  const { T, ground } = at.get(`${x},${z}`);
  const perim = perimOf(f);
  // stone plinth from the lowest ground to the ground floor slab (foundation fill up to each cell's ground, and
  // a base course on the street face)
  g.set(x, 0, z, "stone_bricks");
  g.set(x, 1, z, perim ? "smooth_stone" : "stone_bricks");
  // along-face index for bays: columns on a north/south face run in x, on an east/west face in z
  const bay = f.n || f.s ? x : z;
  const door = doorAt(x, z);
  for (let y = 2; y < T; y++) {
    const storey = Math.floor((y - 2) / 4), rel = (y - 2) % 4;
    if (rel === 0 || y === T - 1) { g.set(x, y, z, rel === 0 ? "light_gray_concrete" : "white_concrete"); continue; }   // floor slab / roof
    if (!perim) continue;                                                              // interior: air gap
    if (storey === 0) {
      if (rel === 3) { g.set(x, y, z, "green_concrete"); continue; }                    // lintel band (branding)
      if (door) {
        g.set(x, y, z, "oak_door", { facing: door.facing, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      g.set(x, y, z, bay % 4 === 0 ? "white_concrete" : "light_blue_stained_glass");   // shopfront
      continue;
    }
    if (rel === 2) g.set(x, y, z, bay % 3 === 0 ? "white_concrete" : bay % 9 === 1 ? "cyan_stained_glass" : "light_blue_stained_glass");   // glass band, a darker bay every third
    else g.set(x, y, z, "light_gray_concrete");                                          // sill and head
  }
  // parapet cornice on the roof edge; rooftop units on the flat tiers
  if (perim) g.set(x, T, z, "smooth_stone");
  else if (T <= 14 && x % 11 >= 4 && x % 11 <= 5 && z % 11 >= 4 && z % 11 <= 5) g.set(x, T, z, "iron_block");   // plant units, low and sparse
}

// warm light: a glowstone just inside some glass bays, and hanging lanterns in some interior bays
for (const f of faces) {
  const { x, z } = f;
  const { T } = at.get(`${x},${z}`);
  if (perimOf(f)) {
    const ix = f.n ? x : f.s ? x : f.w ? x + 1 : x - 1;   // inward neighbour (for an east/west face the wall is one column in)
    const iz = f.n ? z + 1 : f.s ? z - 1 : z;
    if (!has(ix, iz) || perimOf(faces.find((q) => q.x === ix && q.z === iz))) continue;
    for (let y = 2; y < T - 1; y++) {
      const rel = (y - 2) % 4;
      if (rel === 2 && (x * 31 + z * 17 + y * 7) % 11 === 0 && !(x % 3 === 0 || z % 3 === 0)) g.set(ix, y, iz, "glowstone");
    }
  } else {
    for (let y = 2; y < T - 1; y++) {
      if ((y - 2) % 4 === 3 && (x * 13 + z * 29) % 37 === 0) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

const out = g.save(`${HERE}/way_23907605.nbt`);
console.log("saved", out);
