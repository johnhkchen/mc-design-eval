import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1001342.cells.json`, "utf8"));

const W = 6, HT = 24, D = 15;
const g = new Voxels([W, HT, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= HT) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Flatten the lidar roof into one clean tier: the median roof height,
// clamped to sit at least 5 blocks above the highest ground.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...cells.map(c => Math.round(c[2])));
const TOP = Math.min(HT, Math.max(maxGround + 5, medianRoof));

const map = new Map();
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(HT - 6, Math.round(gr)));
  map.set(`${x},${z}`, { g: ground, T: TOP });
}
const has = (x, z) => map.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposures = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isExterior = (x, z) => exposures(x, z).length > 0;

// Entrance: the exterior, non-corner cell on the lowest-z street face.
let doorCell = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const exp = exposures(x, z);
  const zExp = exp.find(([, dz]) => dz !== 0);
  const xExp = exp.some(([dx]) => dx !== 0);
  if (!zExp || xExp) continue;
  if (!doorCell || z < doorCell.z || (z === doorCell.z && Math.abs(x - W / 2) < Math.abs(doorCell.x - W / 2))) {
    doorCell = { x, z, dz: zExp[1] };
  }
}

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { g: gr, T } = map.get(`${x},${z}`);
  const H = T - gr;
  const n = Math.max(1, Math.floor((H - 2) / 3));

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exp = exposures(x, z);

  if (exp.length === 0) {
    // Interior: floor slabs per storey, air between, roof slab on top
    put(x, gr, z, "oak_planks");
    for (let s = 1; s < n; s++) put(x, gr + 3 * s, z, "oak_planks");
    put(x, T - 1, z, "smooth_stone");
    continue;
  }

  const xFace = exp.some(([dx]) => dx !== 0);
  const zFace = exp.some(([, dz]) => dz !== 0);
  const corner = xFace && zFace;
  // Along-face coordinate: piers every third block, windows between
  const along = zFace && !xFace ? x : z;
  const isBay = !corner && along % 3 !== 0;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  // Inward cell for lamps behind glass
  let ix = x, iz = z;
  if (!corner) {
    if (xFace) ix = x - exp.find(([dx]) => dx !== 0)[0];
    else iz = z - exp.find(([, dz]) => dz !== 0)[1];
  }
  const inwardInterior = !corner && has(ix, iz) && !isExterior(ix, iz);

  for (let s = 0; s < n; s++) {
    const b = gr + 3 * s;

    put(x, b, z, s === 0 ? "stone_bricks" : (isBay ? "smooth_stone" : "bricks"));
    put(x, b + 1, z, isBay ? "glass" : "bricks");
    put(x, b + 2, z, isBay ? "white_concrete" : "bricks");

    if (isDoor && s === 0) {
      const facing = doorCell.dz < 0 ? "north" : "south";
      const props = { facing, hinge: "left", open: "false", powered: "false" };
      put(x, b, z, "oak_door", { ...props, half: "lower" });
      put(x, b + 1, z, "oak_door", { ...props, half: "upper" });
      put(x, b + 2, z, "white_concrete");
    }

    // Warm lamps behind some windows (not in the door bay)
    if (isBay && inwardInterior && (along + s) % 3 === 0 && !(isDoor && s === 0)) {
      put(ix, b + 1, iz, "glowstone");
    }
  }

  // Cornice and parapet from the top of the last storey to the flat roof
  for (let y = gr + 3 * n; y <= T - 1; y++) {
    if (y === T - 1) put(x, y, z, "smooth_stone");
    else if (y === T - 2 && (x + z) % 2 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "bricks");
  }
}

g.save(`${dir}/NYC1001342.nbt`);
