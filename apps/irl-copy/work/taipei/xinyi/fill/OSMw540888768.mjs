import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888768.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888768.nbt";

// Footprint 11 x 14, roof about 11 blocks above the lowest ground.
// Two storeys of 5 blocks: slabs at y 0 and 5, roof deck at y 10, parapet at y 11.
const W = 11, H = 23, D = 14;
const ROOF = 11;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) {
  ground.set(`${x},${z}`, Math.min(H - 2, Math.max(0, Math.round(g))));
}

const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const outward = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isBoundary = (x, z) => outward(x, z).length > 0;
const isCorner = (x, z) => outward(x, z).length >= 2;

// Entrance: middle non-corner cell on the north face (fallback: any non-corner exterior cell).
let entrance = null;
const keys = [...ground.keys()].map((k) => k.split(",").map(Number));
const northCands = keys
  .filter(([x, z]) => !isCorner(x, z) && outward(x, z).some((d) => d.n === "north"))
  .sort((a, b) => a[0] - b[0]);
if (northCands.length) {
  const [x, z] = northCands[Math.floor(northCands.length / 2)];
  entrance = { x, z, face: "north" };
} else {
  const any = keys.filter(([x, z]) => isBoundary(x, z) && !isCorner(x, z));
  if (any.length) {
    const [x, z] = any[Math.floor(any.length / 2)];
    entrance = { x, z, face: outward(x, z)[0].n };
  }
}

const alongIndex = (x, z, face) => (face === "north" || face === "south" ? x : z);
const isWindowCell = (x, z, face) => !isCorner(x, z) && alongIndex(x, z, face) % 2 === 1;

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([W, H, D]);

// Main pass: foundations, slabs, roof, walls, windows, entrance.
for (const [k, gnd] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone_bricks");

  const out = outward(x, z);
  const bnd = out.length > 0;
  const corner = out.length >= 2;
  const face = bnd ? out[0].n : null;
  const isEnt = entrance && entrance.x === x && entrance.z === z;

  for (let y = gnd; y <= ROOF; y++) {
    // Floor slabs (ground floor and second floor).
    if (y === 0 || y === 5) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    // Roof deck; boundary cells get a light concrete cornice ring.
    if (y === 10) {
      g.set(x, y, z, bnd ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    // Parapet on the perimeter; sparse roof equipment inside.
    if (y === 11) {
      if (bnd) g.set(x, y, z, "light_gray_concrete");
      else if (x % 4 === 1 && z % 4 === 1) g.set(x, y, z, "iron_block");
      continue;
    }
    // Interior storey air.
    if (!bnd) continue;

    // Perimeter walls.
    if (y === 1) {
      if (isEnt) g.set(x, y, z, "oak_door", { facing: entrance.face, half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y === 2 && isEnt) {
      g.set(x, y, z, "oak_door", { facing: entrance.face, half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 3 && isEnt) {
      g.set(x, y, z, "light_gray_concrete"); // transom above door
      continue;
    }
    if (y === 4 || y === 6 || y === 9) {
      g.set(x, y, z, "light_gray_concrete"); // lintels, sills, storey lines
      continue;
    }
    // Window rows: y 2-3 (shopfront) and y 7-8 (upper storey).
    if (isWindowCell(x, z, face)) g.set(x, y, z, "glass_pane", paneProps(face));
    else g.set(x, y, z, "white_concrete");
  }
}

// Warm lights just inside some window cells.
for (const [k, gnd] of ground) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  if (!out.length || out.length >= 2) continue;
  const face = out[0].n;
  if (!isWindowCell(x, z, face)) continue;
  const d = out[0];
  const ix = x - d.dx, iz = z - d.dz;
  if (!has(ix, iz) || isBoundary(ix, iz)) continue;
  const ig = ground.get(`${ix},${iz}`);
  const a = alongIndex(x, z, face);
  if (a % 4 === 1 && ig <= 1) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  if (a % 4 === 3 && ig <= 6) g.set(ix, 6, iz, "shroomlight");
}

g.save(OUT);
