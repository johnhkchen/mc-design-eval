import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise commercial block, c. 1990s-2000s Xinyi style:
// white concrete piers, grey spandrels, glass bays, granite-look base,
// shopfront on the north (street) face, stepped roof with a penthouse and mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265945";
const W = 10, H = 46, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ROOF = 32;          // roof deck top surface sits at y 33
const TOP = 34;           // parapet cap
const ABS_FLOORS = [7, 12, 17, 22, 27]; // floor slabs at absolute heights (5-block storeys)

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);
const exposed = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));
const midX = (minX + maxX) / 2;

// Door: the north-exposed cell nearest the middle of the front
let doorX = null;
for (const [x, z] of cells) {
  if (exposed(x, z).N && (doorX === null || Math.abs(x - midX) < Math.abs(doorX - midX))) doorX = x;
}

for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const perim = ex.N || ex.S || ex.W || ex.E;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  // Floor slabs: ground slab at this cell's ground, then absolute storey lines above it
  const floors = [gr, ...ABS_FLOORS.filter(f => f > gr)];
  for (const f of floors) put(x, f, z, "light_gray_concrete");

  // Base course at ground on the perimeter
  if (perim) put(x, gr, z, "stone_bricks");

  // Storeys between consecutive floor slabs
  for (let i = 0; i < floors.length; i++) {
    const F = floors[i];
    const next = i + 1 < floors.length ? floors[i + 1] : ROOF;
    const lo = F + 1;
    const hi = next - 1;
    const first = i === 0;
    const top = i === floors.length - 1;

    for (let y = lo; y <= hi; y++) {
      if (!perim) {
        // Warm light behind the north glazing, on interior cells next to the front wall
        if (z === 1 && has(x, 0) && i >= 1 && i % 2 === 1 && x % 3 === 1 && y === lo + 2) {
          put(x, y, z, "glowstone");
        }
        continue;
      }

      const ns = ex.N || ex.S;
      const idx = ns ? x : z;
      const pier = idx % 3 === 0;
      let id, p;

      if (top && y === hi) {
        id = "smooth_stone";                      // cornice
      } else if (y === lo || y === hi) {
        id = "light_gray_concrete";               // spandrel
      } else if (first && ex.N && y <= lo + 2) {
        id = pier ? "white_concrete" : "glass";   // shopfront glazing
      } else if (first && ex.N && y === lo + 3) {
        id = "light_gray_concrete";               // shopfront transom / fascia
      } else {
        id = pier ? "white_concrete" : "glass_pane";
        if (!pier) p = ns ? PANE_NS : PANE_EW;
        // Warm light in some upper windows
        if (!pier && !first && i % 2 === 0 && idx % 6 === 4 && y === lo + 2 && ns && ex.N) {
          id = "shroomlight";
        }
      }

      // Entrance door on the north face
      if (first && ex.N && x === doorX && (y === lo || y === lo + 1)) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: y === lo ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      put(x, y, z, id, p);
    }
  }

  // Roof deck and parapet
  put(x, ROOF, z, "light_gray_concrete");
  if (perim) {
    put(x, 33, z, "white_concrete");
    put(x, TOP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Mechanical penthouse, inset two cells, standing on the roof deck
const pX0 = minX + 2, pX1 = maxX - 2, pZ0 = minZ + 2, pZ1 = maxZ - 2;
const inPH = (x, z) => x >= pX0 && x <= pX1 && z >= pZ0 && z <= pZ1 && has(x, z);

for (let x = pX0; x <= pX1; x++) {
  for (let z = pZ0; z <= pZ1; z++) {
    if (!inPH(x, z)) continue;
    const edge = !inPH(x - 1, z) || !inPH(x + 1, z) || !inPH(x, z - 1) || !inPH(x, z + 1);
    const corner = (x === pX0 || x === pX1) && (z === pZ0 || z === pZ1);
    put(x, 33, z, "white_concrete");
    if (edge) {
      put(x, 34, z, corner ? "white_concrete" : "glass");
      put(x, 35, z, corner ? "white_concrete" : "glass");
    }
    put(x, 36, z, "smooth_stone");
  }
}

// Mast on the penthouse
const cx = Math.round((pX0 + pX1) / 2);
const cz = Math.round((pZ0 + pZ1) / 2);
if (inPH(cx, cz)) {
  for (let y = 37; y <= 39; y++) {
    put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
