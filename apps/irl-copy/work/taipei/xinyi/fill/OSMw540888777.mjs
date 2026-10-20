import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-district commercial block, c. 1980s-90s: stone-plinth podium,
// cream quartz walls, light-grey floor bands, glazed street shopfront,
// pane-and-pier window grids, rooftop water tank and antenna.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888777";
const W = 13, H = 23, D = 16;
const ROOF_Y = 11;   // roof deck (roof about 11 blocks above lowest ground)
const TOP_Y = 10;    // top of walls; parapet sits at ROOF_Y

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(TOP_Y, Math.round(Number(gr)))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const key = (x, z) => `${x},${z}`;

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const exts = (x, z) => DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));

// Street face = the exterior face with the most exposed cells.
const faceCount = {};
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const d of exts(x, z)) faceCount[d.n] = (faceCount[d.n] || 0) + 1;
}
const street = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0] ?? "south";
const streetDir = DIRS.find((d) => d.n === street);

// Entrance: middle cell of the street face.
const streetCells = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (exts(x, z).some((d) => d.n === street)) streetCells.push([x, z]);
}
const alongOf = (x, z) => (streetDir.dx !== 0 ? z : x);
streetCells.sort((a, b) => alongOf(a[0], a[1]) - alongOf(b[0], b[1]));
const doorCell = streetCells.length ? streetCells[Math.floor(streetCells.length / 2)] : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation, plinth, walls, floor bands, cornice, roof deck, parapet.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ex = exts(x, z);
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  for (let y = gr; y <= TOP_Y; y++) {
    let id = "smooth_quartz";
    if (y === gr) id = "stone_bricks";                                  // base course
    else if (ex.length && y === TOP_Y) id = "light_gray_concrete";      // cornice band
    else if (ex.length && y === 5 && y > gr) id = "light_gray_concrete"; // storey line
    set(x, y, z, id);
  }
  set(x, ROOF_Y, z, "light_gray_concrete");                             // roof deck
  if (ex.length) set(x, ROOF_Y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet
}

// 2. Facades: shopfront on street face, pane-and-pier windows elsewhere.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (k === doorKey) continue;
  const ex = exts(x, z);
  for (const d of ex) {
    const along = d.dx !== 0 ? z : x;
    const pier = ex.length > 1 || along % 3 === 0;
    if (pier) continue;
    const isSt = d.n === street;
    const pane = d.dx !== 0
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    const ix = x - d.dx, iz = z - d.dz;
    const insideOk = inFp(ix, iz);

    // Ground storey glazing.
    for (const y of [gr + 1, gr + 2, gr + 3]) {
      if (y > 9) continue;
      if (isSt) set(x, y, z, "glass");
      else set(x, y, z, "light_blue_stained_glass_pane", pane);
      if (insideOk) set(ix, y, iz, "air");
    }

    // Upper storey windows with warm light behind some panes.
    for (const y of [gr + 6, gr + 7, gr + 8]) {
      if (y > 9 || y < 6) continue;
      set(x, y, z, "light_blue_stained_glass_pane", pane);
      if (insideOk) {
        if (y === gr + 7 && along % 2 === 0) set(ix, y, iz, "glowstone");
        else set(ix, y, iz, "air");
      }
    }
  }
}

// 3. Entrance: double door on street face, lintel, canopy with lantern.
if (doorCell) {
  const [x, z] = doorCell;
  const gr = ground.get(doorKey);
  const ix = x - streetDir.dx, iz = z - streetDir.dz;
  const lowerProps = { facing: street, half: "lower", hinge: "left", open: "false", powered: "false" };
  const upperProps = { facing: street, half: "upper", hinge: "left", open: "false", powered: "false" };
  set(x, gr + 1, z, "oak_door", lowerProps);
  set(x, gr + 2, z, "oak_door", upperProps);
  set(x, gr + 3, z, "smooth_quartz");
  if (inFp(ix, iz)) {
    set(ix, gr + 1, iz, "air");
    set(ix, gr + 2, iz, "air");
  }
  const ox = x + streetDir.dx, oz = z + streetDir.dz;
  if (!inFp(ox, oz)) {
    set(ox, gr + 3, oz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    set(ox, gr + 2, oz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. Roof: water tank (3x3 ring with cap), lightning-rod, two AC units.
let cx = 0, cz = 0;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  cx += x; cz += z;
}
cx /= ground.size; cz /= ground.size;

let tank = null;
let bestD = Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  let ok = true;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (!inFp(x + dx, z + dz)) ok = false;
  if (!ok) continue;
  const dist = Math.hypot(x - cx, z - cz);
  if (dist < bestD) { bestD = dist; tank = [x, z]; }
}

const tankCells = new Set();
if (tank) {
  const [tx, tz] = tank;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = tx + dx, z = tz + dz;
      tankCells.add(key(x, z));
      const ring = !(dx === 0 && dz === 0);
      for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) {
        set(x, y, z, ring ? "smooth_stone" : "iron_bars");
      }
      set(x, ROOF_Y + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Lightning rod at the footprint corner nearest the origin.
let rodCell = null;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (tankCells.has(k)) continue;
  if (!rodCell || x + z < rodCell[0] + rodCell[1]) rodCell = [x, z];
}
if (rodCell) {
  for (let y = ROOF_Y + 1; y <= ROOF_Y + 4; y++) {
    set(rodCell[0], y, rodCell[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Two AC units on interior roof cells away from the tank.
let acPlaced = 0;
for (const k of ground.keys()) {
  if (acPlaced >= 2) break;
  const [x, z] = k.split(",").map(Number);
  if (tankCells.has(k) || exts(x, z).length) continue;
  if (rodCell && x === rodCell[0] && z === rodCell[1]) continue;
  if (x % 5 !== 2) continue;
  set(x, ROOF_Y + 1, z, "iron_block");
  acPlaced++;
}

g.save(`${DIR}/${ID}.nbt`);
