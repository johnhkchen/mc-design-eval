import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989987";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 21 x 38 x 16: footprint 21 x 16, five-storey Xinyi-era office/retail block
// (cream tile-clad concrete frame, glazed bays, granite base, roof plant room).
const W = 21, H = 38, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);
const GLASS = "glass_pane";

for (const [x, z, gr] of cells) {
  const b = gr; // this cell's own ground; storeys stand on it
  const mX = !has(x - 1, z) || !has(x + 1, z);
  const mZ = !has(x, z - 1) || !has(x, z + 1);
  const edge = mX || mZ;
  const pillar = (mX && mZ) || (mZ && x % 3 === 0) || (mX && z % 3 === 0);
  const front = mZ && z === minZ;
  const isDoor = front && (x === cx || x === cx + 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Ground course / floor.
  put(x, b, z, edge ? "polished_granite" : "smooth_stone");

  // Ground-floor shopfront / entrance, offsets 1..4.
  for (let off = 1; off <= 4; off++) {
    const y = b + off;
    if (!edge) continue; // interior air
    if (isDoor) {
      if (off === 1) put(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: x === cx ? "left" : "right", open: "false", powered: "false" });
      else if (off === 2) put(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: x === cx ? "left" : "right", open: "false", powered: "false" });
      else put(x, y, z, "polished_granite");
      continue;
    }
    if (pillar) put(x, y, z, "white_concrete");
    else if (off === 4) put(x, y, z, "smooth_quartz");
    else put(x, y, z, GLASS);
  }

  // Lanterns flanking the entrance, inside the shopfront.
  if (front && !edge === false && has(x, z) && z === minZ + 1 && (x === cx - 1 || x === cx + 2)) {
    put(x, b + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // Upper storeys 1..4: spandrel at offset 0, glazed bays above.
  for (let k = 1; k <= 4; k++) {
    const base = b + 5 * k;
    if (edge) {
      put(x, base, z, pillar ? "white_concrete" : "smooth_quartz");
    } else {
      put(x, base, z, "light_gray_concrete"); // floor slab
    }
    for (let off = 1; off <= 4; off++) {
      const y = base + off;
      if (!edge) continue;
      if (pillar) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, GLASS);
      // Warm light just inside some windows.
      if (off === 2 && (x + z + k) % 4 === 0) {
        let dx = 0, dz = 0;
        if (mZ) dz = z === minZ ? 1 : -1;
        else if (mX) dx = x === minX ? 1 : -1;
        if (has(x + dx, z + dz)) put(x + dx, y, z + dz, (k % 2) ? "shroomlight" : "glowstone");
      }
    }
  }

  // Roof level at b+25: parapet on the edge, roof deck inside.
  const roof = b + 25;
  if (edge) {
    put(x, roof, z, pillar ? "white_concrete" : "smooth_quartz");
  } else {
    put(x, roof, z, "light_gray_concrete");
  }

  // Roof plant room, centred, standing on the roof deck.
  const dx0 = x - cx, dz0 = z - cz;
  if (Math.abs(dx0) <= 3 && Math.abs(dz0) <= 2) {
    const ring = Math.abs(dx0) === 3 || Math.abs(dz0) === 2;
    for (let off = 1; off <= 3; off++) {
      const y = roof + off;
      if (ring) put(x, y, z, off === 2 && !(Math.abs(dx0) === 3 && Math.abs(dz0) === 2) ? GLASS : "light_gray_concrete");
    }
    put(x, roof + 4, z, "light_gray_concrete"); // ceiling slab
    put(x, roof + 5, z, "smooth_quartz");       // cap
  }
  if (x === cx && z === cz) put(x, roof + 6, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
