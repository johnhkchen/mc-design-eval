import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "TPE100-0181-20F-2";
const W = 311, H = 38, D = 233;

const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const isPerimeter = (x, z) =>
  !inside.has(key(x + 1, z)) || !inside.has(key(x - 1, z)) ||
  !inside.has(key(x, z + 1)) || !inside.has(key(x, z - 1));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
const hx = (maxX - minX) / 2 || 1, hz = (maxZ - minZ) / 2 || 1;

const WALL = 14; // three storeys of about 5 blocks, then the dome
const CAP = 12;  // dome rises to about 26 blocks above lowest ground

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  const edge = isPerimeter(x, z);
  const pier = !edge && x % 12 === 6 && z % 12 === 6;

  const rr = Math.min(1, Math.hypot((x - cx) / hx, (z - cz) / hz));
  const capH = Math.round(CAP * Math.sqrt(Math.max(0, 1 - rr * rr)));
  const wallTop = Math.min(H - 1, gr + WALL);
  const top = Math.min(H - 1, wallTop + capH);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone");

  // Body: storeys from ground to the wall top.
  for (let y = gr; y < wallTop; y++) {
    const rel = y - gr;

    if (edge) {
      const entranceZone = ((x + z) % 60) < 5;
      if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }
      if (rel < 4 && entranceZone) continue; // five-block entrance opening
      if (rel === 4 && entranceZone) { g.set(x, y, z, "smooth_quartz"); continue; }
      if (rel === 2 && entranceZone) { g.set(x, y, z, "lantern", { hanging: "true" }); continue; }
      if (rel % 5 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; } // floor line
      if (rel % 5 === 4) {
        g.set(x, y, z, rel === 13 && (x + z) % 10 === 0 ? "sea_lantern" : "white_concrete");
        continue;
      }
      // Window band: glass with white mullions and warm lights.
      if ((x + z) % 3 === 0) g.set(x, y, z, "white_concrete");
      else if (rel % 5 === 2 && (x + z) % 11 === 0) g.set(x, y, z, "shroomlight");
      else g.set(x, y, z, "light_blue_stained_glass");
    } else if (pier) {
      g.set(x, y, z, "white_concrete");
    } else if (rel % 5 === 0) {
      g.set(x, y, z, "smooth_stone"); // floor slab per storey, air gap otherwise
    }
  }

  // Cornice and dome cap, standing on the wall top.
  const ring = Math.round(rr * 10) % 3 === 0; // gray steel rings across the roof
  for (let y = wallTop; y <= top; y++) {
    if (y === wallTop) {
      g.set(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
    } else if (y === top) {
      g.set(x, y, z, ring ? "gray_concrete" : "iron_block");
    } else {
      g.set(x, y, z, "light_gray_concrete");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
