import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075571";
const W = 9, H = 33, D = 6;
const STOREY = 5, STOREYS = 4;
const RISE = STOREY * STOREYS;   // 20: roof slab level above lowest ground
const PARAPET = RISE + 1;        // 21: parapet course, roof about 21 blocks

const vox = new Voxels([W, H, D]);

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gy] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, gy);
}
const cellsXZ = [...ground.keys()].map((k) => k.split(",").map(Number));
const has = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => ({ N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) });
const isExterior = (x, z) => { const e = edge(x, z); return e.N || e.S || e.W || e.E; };

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// 1. Foundation, floor slabs, roof slab (every cell, standing on what is below)
for (const [x, z] of cellsXZ) {
  const gy = ground.get(`${x},${z}`);
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  for (let s = 0; s <= STOREYS; s++) put(x, gy + STOREY * s, z, "light_gray_concrete");
}

// 2. Facade: storeys with spandrels, window bays, piers, shopfront at street frontage
for (const [x, z] of cellsXZ) {
  if (!isExterior(x, z)) continue;
  const gy = ground.get(`${x},${z}`);
  const e = edge(x, z);
  const onNS = e.N || e.S;
  const corner = onNS && (e.W || e.E);
  const idx = onNS ? x : z;
  const pier = corner || idx % 3 === 0;

  for (let s = 0; s < STOREYS; s++) {
    const b = gy + STOREY * s;
    const shop = s === 0 && e.S;

    // base course on ground floor, spandrel bands for storey lines
    put(x, b + 1, z, s === 0 ? "polished_andesite" : "white_concrete");
    put(x, b + 4, z, "white_concrete");

    for (const dy of [2, 3]) {
      const y = b + dy;
      if (pier) {
        put(x, y, z, "smooth_quartz");
      } else if (dy === 2 && !shop && s >= 1 && (idx + s) % 4 === 0) {
        // warm lit window: glowstone behind the glass
        put(x, y, z, "glowstone");
      } else {
        const id = shop ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane";
        const props = onNS
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, id, props);
      }
    }
  }

  // cornice and parapet on top of the wall
  put(x, gy + RISE, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(x, gy + PARAPET, z, "white_concrete");
}

// 3. Entrance on the street (south) face, nearest the middle of the footprint
{
  const meanX = cellsXZ.reduce((a, [x]) => a + x, 0) / cellsXZ.length;
  let cands = cellsXZ.filter(([x, z]) => edge(x, z).S && isExterior(x, z));
  if (cands.length === 0) cands = cellsXZ.filter(([x, z]) => isExterior(x, z));
  cands.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  if (cands.length) {
    const [dx, dz] = cands[0];
    const gy = ground.get(`${dx},${dz}`);
    put(dx, gy + 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(dx, gy + 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    // warm lantern hanging above the door, under the spandrel
    put(dx, gy + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. Roof equipment on interior cells: two air-handling units
{
  for (const [tx, tz] of [[2, 2], [6, 3]]) {
    if (has(tx, tz) && !isExterior(tx, tz)) {
      const gy = ground.get(`${tx},${tz}`);
      put(tx, gy + PARAPET, tz, "iron_block");
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
