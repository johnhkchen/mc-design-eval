import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499703";
const W = 11, H = 31, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const byKey = new Map();
for (const [x, z, gr, rf] of cells) byKey.set(key(x, z), { x, z, g: gr, roof: rf });
const list = [...byKey.values()];

// Distance from the outer edge of the footprint (0 = perimeter cell).
const dist = new Map();
const nb4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const q = [];
for (const c of list) {
  const edge = nb4.some(([dx, dz]) => !byKey.has(key(c.x + dx, c.z + dz)));
  if (edge) { dist.set(key(c.x, c.z), 0); q.push(c); }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  const dc = dist.get(key(c.x, c.z));
  for (const [dx, dz] of nb4) {
    const k = key(c.x + dx, c.z + dz);
    if (byKey.has(k) && !dist.has(k)) {
      dist.set(k, dc + 1);
      q.push(byKey.get(k));
    }
  }
}
const dOf = (x, z) => dist.get(key(x, z)) ?? 0;
const isEdge = (x, z) => byKey.has(key(x, z)) && dOf(x, z) === 0;

// Street face is the z = min side; windows avoid piers every third bay.
const zMin = Math.min(...list.map(c => c.z));
const isPier = (x, z) => (x + z) % 3 === 0;
const isWinCell = (x, z) => isEdge(x, z) && !isPier(x, z);
const doorX = 5;

// Deterministic stone variation so walls read as coursed granite, not flat grey.
const wallStone = (x, y, z) => {
  const h = (x * 7 + y * 3 + z * 5) % 11;
  if (h === 0 || h === 5) return "stone_bricks";
  if (h === 3) return "cracked_stone_bricks";
  return "stone";
};

const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const c of list) {
  const { x, z } = c;
  const d = dOf(x, z);
  const gr = Math.max(0, Math.round(c.g));
  const roofR = Math.min(Math.round(c.roof), H - 4);
  const eave = Math.max(gr + 10, roofR - 8);
  const top = Math.min(roofR, eave + 2 * (d + 1));
  const floorY = gr + Math.floor((eave - gr) / 2);
  const shop = z === zMin;
  const onDoorFace = shop && x === doorX;
  const isJamb = shop && (x === doorX - 1 || x === doorX + 1);

  // Foundation fill up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Ground course / floor slab.
  g.set(x, gr, z, d === 0 ? "polished_andesite" : "smooth_stone");

  // Walls: two storeys between ground and eave.
  for (let y = gr + 1; y <= eave - 1; y++) {
    if (d >= 1) {
      // Interior: floor slabs and ceiling only; air elsewhere.
      if (y === floorY || y === eave - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    // Perimeter facade.
    if (onDoorFace) {
      if (y === gr + 1 || y === gr + 2) {
        // Doorway: door at the centre, hanging lantern in the head space.
        if (y === gr + 1) g.set(x, y, z, "oak_door", doorProps("lower"));
        else g.set(x, y, z, "oak_door", doorProps("upper"));
        continue;
      }
      if (y === gr + 3) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
    }
    if (isJamb && y >= gr + 1 && y <= gr + 3) {
      g.set(x, y, z, "polished_andesite");
      continue;
    }
    if (y === floorY || y === eave - 1) { g.set(x, y, z, "polished_andesite"); continue; }
    if (isPier(x, z)) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y < floorY) {
      if (shop) {
        if (y === gr + 1 || y === floorY - 1) g.set(x, y, z, "dark_oak_planks");
        else g.set(x, y, z, "glass");
      } else {
        if (y === gr + 1 || y === floorY - 1) g.set(x, y, z, "polished_andesite");
        else g.set(x, y, z, "glass");
      }
    } else {
      if (y === floorY + 1 || y === eave - 2) g.set(x, y, z, "polished_andesite");
      else g.set(x, y, z, "glass");
    }
  }

  // Textured infill on solid wall cells (piers and bands keep their own blocks).
  for (let y = gr + 1; y <= eave - 1 && d === 0; y++) {
    if (!isPier(x, z) && !(shop && (y === gr + 1 || y === floorY - 1)) && y !== floorY && y !== eave - 1 && y !== floorY + 1 && y !== eave - 2 && y < floorY) {
      // ground-floor glass stays glass; nothing to texture
    }
  }
  if (d === 0) {
    // Piers get coursed granite variation.
    if (isPier(x, z)) {
      for (let y = gr + 1; y <= eave - 2; y++) {
        if (y === floorY) continue;
        g.set(x, y, z, wallStone(x, y, z));
      }
    }
  }

  // Warm lights behind some windows (interior cells beside a window cell).
  if (d === 1) {
    const winNeighbour = nb4.some(([dx, dz]) => isWinCell(x + dx, z + dz));
    if (winNeighbour) {
      if ((x + z) % 2 === 0 && eave >= gr + 11 && floorY + 3 <= eave - 3) {
        g.set(x, floorY + 3, z, "glowstone");
      }
      if ((x + z) % 4 === 1 && gr + 2 <= floorY - 2) {
        g.set(x, gr + 2, z, "glowstone");
      }
    }
  }

  // Steep roof: stepped hip profile, plateau at the lidar height.
  for (let y = eave; y < top; y++) {
    g.set(x, y, z, y === top - 1 && top === roofR ? "polished_deepslate" : "deepslate_tiles");
  }

  // Lit dormers on the street roof slope.
  if (d === 0 && shop && (x === 2 || x === 8) && top >= eave + 2) {
    g.set(x, eave, z, "polished_deepslate");
    g.set(x, eave + 1, z, "glass");
  }

  // Two chimneys on the plateau.
  if (top === roofR && d >= 2 && ((x === 3 && z === 6) || (x === 7 && z === 7))) {
    for (let y = top; y <= top + 2 && y < H; y++) g.set(x, y, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
