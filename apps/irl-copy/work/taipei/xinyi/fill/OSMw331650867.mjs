import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 光復大樓: mid-century Taipei reinforced-concrete mixed-use block.
// Lidar roof about 11 blocks above lowest ground: two storeys of about 5 blocks
// plus a top band, flat roof, white concrete walls with light-grey pillars and
// band courses, glass bays with stone sills and lintels, a shopfront plinth,
// a recessed-looking entrance with a hanging lantern, and a rooftop water tank
// with a lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw331650867";
const W = 35, H = 23, D = 65;
const ROOF = 11;          // roof top, blocks above lowest ground (lidar)
const CAP_ROOM = 2;       // parapet + cap above roof

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.max(0, Math.round(gr ?? 0)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const roofYOf = (gr) => Math.min(H - CAP_ROOM - 2, Math.max(ROOF, gr + 3));

const g = new Voxels([W, H, D]);

// Footprint centroid
let sx = 0, sz = 0, n = 0;
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  sx += x; sz += z; n++;
}
const cx = Math.round(sx / n), cz = Math.round(sz / n);

// Entrance: exterior, north-facing, not a corner, nearest the middle of the north front
let entrance = null;
{
  let best = Infinity;
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    const faces = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
    if (faces.length !== 1 || faces[0].n !== "north") continue;
    const score = Math.abs(x - cx);
    if (score < best) { best = score; entrance = { x, z }; }
  }
  if (!entrance) {
    for (const key of ground.keys()) {
      const [x, z] = key.split(",").map(Number);
      if (!has(x, z - 1)) { entrance = { x, z }; break; }
    }
  }
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const roofY = roofYOf(gr);
  const faces = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  const ext = faces.length > 0;
  const corner = faces.length >= 2;
  const face = faces[0];
  const bay = face ? (face.dz !== 0 ? x : z) : 0;
  const pillar = corner || (ext && bay % 3 === 0);
  const isEntrance = entrance && entrance.x === x && entrance.z === z && face && face.n === "north";

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  // Body: storeys of 5 with floor bands at rel 0, 5, 10
  for (let y = gr + 1; y < roofY; y++) {
    const rel = y - gr;

    // Floor slab / storey line (also interior slabs)
    if (rel % 5 === 0) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!ext) continue; // interior stays air behind the shell

    // Entrance: door on the ground storey, hanging lantern above it
    if (isEntrance && rel <= 3) {
      if (rel === 1) { g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 2) { g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 3) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    }

    // Base course / shopfront plinth
    if (rel === 1) { g.set(x, y, z, "stone_bricks"); continue; }

    // Spandrel / header
    if (rel % 5 === 4) { g.set(x, y, z, "white_concrete"); continue; }

    // Pillars: light concrete in the window zone
    if (pillar) {
      g.set(x, y, z, rel > 5 ? "stone_bricks" : "light_gray_concrete");
      continue;
    }

    // Upper storey windows: stone sill, glass, lintel
    if (rel > 5) {
      if (rel === 6) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); }
      else if (rel === 8) { g.set(x, y, z, "light_gray_concrete"); }
      else { g.set(x, y, z, "light_blue_stained_glass"); }
    } else {
      // Ground storey shopfront glass
      g.set(x, y, z, "light_blue_stained_glass");
    }

    // Warm glow behind some glazed cells
    if (face && (((x * 31 + y * 17 + z * 13) % 4) === 0)) {
      const ix = x - face.dx, iz = z - face.dz;
      if (has(ix, iz) && y > gAt(ix, iz) && y < roofYOf(gAt(ix, iz))) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Roof slab
  g.set(x, roofY, z, "light_gray_concrete");

  // Parapet and cap on the exterior
  if (ext) {
    g.set(x, roofY + 1, z, "white_concrete");
    g.set(x, roofY + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Rooftop water tank (3x3 iron block drum) and lightning rod on interior roof cells
{
  let tankRoof = null;
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++) {
    for (let dz = -1; dz <= 1 && ok; dz++) {
      const x = cx + dx, z = cz + dz;
      if (!has(x, z)) { ok = false; break; }
      const faces = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
      if (faces.length) ok = false;
      tankRoof = roofYOf(gAt(x, z));
    }
  }
  if (ok && tankRoof !== null) {
    const top = tankRoof;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const x = cx + dx, z = cz + dz;
        for (let y = top + 1; y <= top + 3; y++) g.set(x, y, z, "iron_block");
        g.set(x, top + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
    for (let y = top + 5; y <= Math.min(H - 1, top + 7); y++) {
      g.set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
