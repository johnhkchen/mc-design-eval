import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612483";
const W = 19, H = 23, D = 14;

// Record: 2-storey concrete commercial block, roof about 11 blocks above lowest ground.
// Materials: white concrete walls, light grey floor bands, glass panes, quartz cornice,
// stone-brick foundation, shopfront glazing on the north (front) face.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, g] of cells) G.set(x + "," + z, g);
const has = (x, z) => G.has(x + "," + z);
const L = Math.min(...cells.map(c => c[2]));
const R = L + 11; // roof level (top of parapet course is R-1)

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const outs = (x, z) => DIRS.filter(d => !has(x + d[0], z + d[1]));

// Front = north-facing exterior cells (minimum z edge). Door sits at the middle of that face.
const frontCells = cells.filter(([x, z]) => outs(x, z).some(d => d[1] === -1));
let doorX = -1;
if (frontCells.length) {
  const xs = frontCells.map(c => c[0]);
  doorX = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
}

// Pass 1: foundation, floors, walls, windows, door, warm lights.
for (const [x, z, gr] of cells) {
  // Foundation under every footprint cell up to its own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const o = outs(x, z);
  const ext = o.length > 0;
  const corner = o.length >= 2;
  const isFront = o.some(d => d[1] === -1);
  const isDoor = isFront && x === doorX;
  // Inward neighbour (through the outward face), used for glowstone behind glass.
    let inward = null;
  if (ext) {
    const od = o[0];
    const ix = x - od[0], iz = z - od[1];
    if (has(ix, iz) && outs(ix, iz).length === 0) inward = [ix, iz];
  }

  for (let y = gr; y <= R - 2; y++) {
    const rel = y - gr;
    if (rel % 5 === 0) {
      // Floor slab / string course at each storey line.
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!ext) continue; // interior air

    if (rel % 5 === 4) {
      put(x, y, z, "white_concrete"); // lintel band
      continue;
    }
    if (corner) {
      put(x, y, z, "white_concrete"); // corner columns
      continue;
    }

    const isGround = rel < 5;
    if (isDoor && (rel === 1 || rel === 2)) {
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isFront && isGround && (rel === 1 || rel === 2)) {
      put(x, y, z, "light_blue_stained_glass_pane"); // shopfront glazing
      continue;
    }
    if (isFront && isGround && rel === 3) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Upper and side windows: glass panes in a grid with concrete mullions.
    if ((x + z) % 2 === 0) {
      put(x, y, z, "light_blue_stained_glass_pane");
      if (rel === 2 && inward && (x * 3 + z * 7 + gr) % 4 === 0) {
        put(inward[0], y, inward[1], "glowstone"); // warm light behind glass
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Parapet / roof deck at R-1: quartz cornice on the perimeter, grey deck inside.
  if (R - 1 >= gr) {
    put(x, R - 1, z, ext ? "smooth_quartz" : "light_gray_concrete");
  }

  // Ground-floor interior lamp just inside the door.
  if (isDoor && inward) {
    put(inward[0], gr + 1, inward[1], "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 2: roof equipment on interior roof cells (air-cooling boxes and a mast).
const interior = cells.filter(([x, z]) => outs(x, z).length === 0);
for (const [x, z, gr] of interior) {
  if (x % 6 === 3 && z % 5 === 2) {
    put(x, R, z, "gray_concrete");
    put(x, R + 1, z, "gray_concrete");
  }
}
if (interior.length) {
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  let best = interior[0];
  let bd = Infinity;
  for (const c of interior) {
    const d = (c[0] - cx) ** 2 + (c[1] - cz) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  for (let y = R; y <= R + 2; y++) put(best[0], y, best[1], "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
