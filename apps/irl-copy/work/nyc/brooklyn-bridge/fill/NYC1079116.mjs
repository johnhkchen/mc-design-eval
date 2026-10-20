import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1079116";
const W = 12, H = 24, D = 5;

// Footprint cells: [x, z, ground, roof]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { g: Math.max(0, Math.round(gr)), r: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);

// Lowest ground under the footprint; storeys are 3 blocks tall from here.
let B = Infinity;
for (const c of map.values()) B = Math.min(B, c.g);
if (!isFinite(B)) B = 0;

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.g;

  // Smooth the lidar roof into flat 3-block tiers, roughly 12 blocks above B.
  let top = B + 3 * Math.max(2, Math.round((c.r - B) / 3));
  top = Math.min(top, H - 3);

  // Exposed faces: north = -z (street side), south = +z, west = -x, east = +x.
  const nE = !has(x, z - 1), sE = !has(x, z + 1);
  const wE = !has(x - 1, z), eE = !has(x + 1, z);
  const wall = nE || sE || wE || eE;
  const door = Math.floor(W / 2);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - B;
    const k = Math.floor(rel / 3);   // storey index (0 = ground floor)
    const rr = rel % 3;              // row within storey

    // Roof surface / cornice
    if (y === top - 1) {
      set(x, y, z, wall ? "stone_bricks" : "gravel");
      continue;
    }
    if (wall && y === top - 2) {
      set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Interior: floor slab per storey, air otherwise
    if (!wall) {
      if (rr === 0) set(x, y, z, "smooth_stone");
      continue;
    }

    // Storey line / bulkhead band course
    if (rr === 0) {
      set(x, y, z, (k === 0 && nE) ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Corners: stone pilasters
    const cornerCell = (nE || sE) && (wE || eE);
    if (cornerCell) {
      set(x, y, z, "stone_bricks");
      continue;
    }

    // Street (north) face, ground floor: shopfront with sign band and transom
    if (nE && k === 0) {
      if (x === door) {
        if (rr === 1) set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (rr === 2) {
        set(x, y, z, "dark_oak_planks");        // sign band above shop glass
      } else if (x === 0 || x === W - 1 || x % 4 === 0) {
        set(x, y, z, "stone_bricks");           // piers
      } else {
        set(x, y, z, "glass");
      }
      continue;
    }

    // North / south faces, upper storeys: window bays between stone pilasters
    if (nE || sE) {
      if (x === 0 || x === W - 1 || x % 3 === 0) {
        set(x, y, z, "stone_bricks");
      } else if (rr === 2 && (x + k + z) % 5 === 0) {
        set(x, y, z, "glowstone");
      } else {
        set(x, y, z, "glass");
      }
      continue;
    }

    // West / east faces: windows
    if (wE || eE) {
      if (rr === 2 && (z + k) % 4 === 1) {
        set(x, y, z, "glowstone");
      } else {
        set(x, y, z, "glass");
      }
    }
  }

  // Rooftop equipment: a brick chimney on one interior roof cell.
  if (!wall && x === 9 && z === 2 && top + 1 < H) {
    set(x, top, z, "bricks");
    set(x, top + 1, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
