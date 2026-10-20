import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/TPE106-0165-1F-4.cells.json`, "utf8"));

const W = 14, H = 19, D = 24;
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// footprint: key "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// boundary / missing-neighbour info
const miss = (x, z) => ({
  mx: !has(x - 1, z) || !has(x + 1, z),
  mz: !has(x, z - 1) || !has(x, z + 1),
});
const isRing = (x, z) => { const m = miss(x, z); return m.mx || m.mz; };

// entrance: ring cell on the south (+z) face, nearest the middle of that face
const southFace = [];
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  if (!has(x, z + 1)) southFace.push(x);
}
let entranceKey = null;
if (southFace.length) {
  const xs = [...southFace].sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  const cand = xs.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best), xs[0]);
  entranceKey = `${cand},${[...ground.keys()].map(k => k.split(",").map(Number)).find(([x, z]) => x === cand && !has(x, z + 1))[1]}`;
}

const doorFacing = (x, z) =>
  !has(x, z + 1) ? "south" : !has(x, z - 1) ? "north" : !has(x + 1, z) ? "east" : "west";

// interior cells adjacent to the ring (for behind-glass light)
const adjacentToRing = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => has(x + dx, z + dz) && isRing(x + dx, z + dz));

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const key = `${x},${z}`;
  const ring = isRing(x, z);
  const { mx, mz } = miss(x, z);
  const corner = mx && mz;
  // position along the facade (x on north/south faces, z on east/west faces)
  const t = mz ? x : z;
  const pillar = corner || (t % 3 === 0);
  const isEntrance = key === entranceKey;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let rel = 0; rel <= 6; rel++) {
    const y = gr + rel;
    if (ring) {
      if (rel === 0) {
        put(x, y, z, "polished_andesite");
      } else if (rel <= 3) {
        if (isEntrance && rel === 1) {
          put(x, y, z, "oak_door", { facing: doorFacing(x, z), half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (isEntrance && rel === 2) {
          put(x, y, z, "oak_door", { facing: doorFacing(x, z), half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (isEntrance && rel === 3) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        } else if (pillar) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
      } else if (rel === 4) {
        put(x, y, z, "smooth_quartz");
      } else if (rel === 5) {
        put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      } else {
        put(x, y, z, "white_concrete");
      }
    } else {
      if (rel === 0) put(x, y, z, "gray_concrete");          // ground floor slab
      else if (rel === 4) put(x, y, z, "light_gray_concrete"); // storey ceiling / roof structure
      else if (rel === 5) put(x, y, z, "light_gray_concrete"); // roof deck
      else if (rel === 2 && adjacentToRing(x, z) && (x + z) % 4 === 0) {
        put(x, y, z, "shroomlight"); // warm light behind the glazing
      }
      // rel 1-3 interior: air gap behind the glass
    }
  }

  // rooftop plant units on a few interior roof-deck cells
  if (!ring && x % 4 === 1 && z % 6 === 2) {
    put(x, gr + 6, z, "iron_block");
  }
}

g.save(`${dir}/TPE106-0165-1F-4.nbt`);
