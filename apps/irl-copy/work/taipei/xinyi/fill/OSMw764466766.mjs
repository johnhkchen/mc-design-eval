import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const P = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw764466766";
const cells = JSON.parse(readFileSync(P + ".cells.json", "utf8"));

const W = 30, H = 38, D = 31;
const g = new Voxels([W, H, D]);

// Footprint lookup
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const has = (x, z) => G.has(x + "," + z);
const ground = (x, z) => G.get(x + "," + z);

const minG = Math.min(...cells.map((c) => c[2]));
const T = minG + 26;                       // roof level (flat, shared by all cells)
const minX = Math.min(...cells.map((c) => c[0])), maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1])), maxZ = Math.max(...cells.map((c) => c[1]));
const cx = Math.floor((minX + maxX) / 2), cz = Math.floor((minZ + maxZ) / 2);

const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const corner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
// true when the facade cell sits on a N/S face, so its wall runs along x
const alongX = (x, z) => !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (x, z) =>
  alongX(x, z)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Body: foundation, storeys, interior floor slabs, facade, roof and parapet
for (const [x, z, gr] of cells) {
  const isE = edge(x, z);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const top = Math.max(T, gr + 1);
  for (let y = gr; y < top; y++) {
    const rel = (((y - minG) % 5) + 5) % 5;   // storey lines every 5 blocks, shared by all cells
    if (!isE) {
      // no interior: air behind the glass, just a floor slab per storey
      if (y === gr || rel === 0) put(x, y, z, "smooth_quartz");
      continue;
    }
    if (rel === 0) { put(x, y, z, "smooth_quartz"); continue; }   // storey band / cornice line
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }     // base course
    if (rel === 4) { put(x, y, z, "light_gray_concrete"); continue; } // spandrel
    // rel 1..3: window zone
    const ground1 = y < minG + 5;
    const idx = alongX(x, z) ? x : z;
    if (corner(x, z) || idx % 3 === 0) {
      put(x, y, z, "white_concrete");                                  // mullion
    } else if (!ground1 && rel === 2 && ((idx * 5 + Math.floor((y - minG) / 5) * 7) % 13 === 0)) {
      put(x, y, z, "glowstone");                                       // warm lit window
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
    }
  }

  // roof slab, parapet on the edge
  put(x, top, z, "light_gray_concrete");
  if (isE) put(x, top + 1, z, "stone_brick_wall");
}

// Main entrance on the street-side (lowest z) face, nearest the middle
{
  const zEdge = Math.min(...cells.filter((c) => c[1] === minZ).map((c) => c[0]));
  let best = null;
  for (const [x, z] of cells) {
    if (z !== minZ) continue;
    if (best === null || Math.abs(x - cx) < Math.abs(best - cx)) best = x;
  }
  const dx = best ?? zEdge, dz = minZ, dg = ground(dx, dz);
  put(dx, dg, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 2, dz, "smooth_quartz");          // lintel
  put(dx, dg + 3, dz, "glowstone");              // warm light above the door
}

// Roof plant room (inside the footprint, off the edge)
for (const [x, z] of cells) {
  if (edge(x, z)) continue;
  if (Math.abs(x - cx) > 5 || Math.abs(z - cz) > 6) continue;
  put(x, T + 1, z, "light_gray_concrete");
  put(x, T + 2, z, "light_gray_concrete");
  put(x, T + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Central mast with lightning rod
if (has(cx, cz)) {
  put(cx, T + 3, cz, "light_gray_concrete");
  put(cx, T + 4, cz, "light_gray_concrete");
  for (let y = T + 5; y <= T + 7; y++) put(cx, y, cz, "lightning_rod");
}

g.save(P + ".nbt");
