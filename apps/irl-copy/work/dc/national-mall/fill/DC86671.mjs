import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86671";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 7, H = 18, D = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(key(x, z), { g: gr, r: rf });
const has = (x, z) => cellMap.has(key(x, z));

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const lenX = maxX - minX + 1, lenZ = maxZ - minZ + 1;
const cx = Math.floor((minX + maxX) / 2);

const FACES = [
  { n: "N", dx: 0, dz: -1, axis: "x" },
  { n: "S", dx: 0, dz: 1, axis: "x" },
  { n: "W", dx: -1, dz: 0, axis: "z" },
  { n: "E", dx: 1, dz: 0, axis: "z" },
];

// Brick office block, c. 1950s-60s: brick walls, stone pilasters and spandrels,
// glass bays, parapet roof with a rooftop mechanical unit.
function wallMaterial(a, corner, k, local, lit) {
  if (corner) return "stone_bricks";
  const bay = a % 2 === 1;
  if (k === 0) {
    if (local === 0) return bay ? "glass" : "stone_bricks"; // street base course / shopfront
    return bay ? "glass" : "smooth_stone";                  // shopfront glass + fascia
  }
  if (local === 0) return "smooth_stone";                   // storey-line spandrel
  if (bay) return lit ? "glowstone" : "glass";
  return "bricks";
}

for (const [x, z, gr, rf] of cells) {
  const ground = gr;
  const storeys = Math.max(1, Math.min(3, Math.floor((rf - ground) / 2)));
  const roofY = ground + 2 * storeys;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const exposed = FACES.filter(f => !has(x + f.dx, z + f.dz));

  if (exposed.length === 0) {
    // Interior: floor slab per storey and roof deck; air between
    for (let k = 0; k < storeys; k++) g.set(x, ground + 2 * k, z, "smooth_stone");
    g.set(x, roofY, z, "smooth_stone");
    // Rooftop mechanical unit on one interior cell
    if (x === 2 && z === 1 && roofY + 2 < H) {
      g.set(x, roofY + 1, z, "light_gray_concrete");
      g.set(x, roofY + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Edge cell
  const isCornerFace = f => {
    const len = f.axis === "x" ? lenX : lenZ;
    const a = f.axis === "x" ? x - minX : z - minZ;
    return a === 0 || a === len - 1;
  };
  const cornerCell = exposed.some(isCornerFace);
  const primary = FACES.find(f => exposed.includes(f));
  const pa = primary.axis === "x" ? x - minX : z - minZ;

  const isDoorCell = exposed.some(f => f.n === "N") && x === cx && z === minZ;

  for (let y = ground; y < roofY; y++) {
    const k = Math.floor((y - ground) / 2);
    const local = (y - ground) % 2;

    if (isDoorCell && k === 0) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: local === 0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    const lit = ((pa + k + (primary.n === "N" ? 0 : 2)) % 4 === 1);
    g.set(x, y, z, wallMaterial(pa, cornerCell, k, local, lit));
  }

  // Parapet: stone brick wall on the roof edge
  g.set(x, roofY, z, "stone_brick_wall", {
    up: "true", north: "low", south: "low", east: "low", west: "low", waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
