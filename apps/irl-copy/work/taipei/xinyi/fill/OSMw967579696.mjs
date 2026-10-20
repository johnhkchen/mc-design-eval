import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial block, c. 1980s-90s Xinyi: two storeys of cream concrete
// over a stone plinth, shopfront glazing on the ground floor, blue-tinted
// window bands above, a quartz cornice and a parapet. Roof top sits 10 blocks
// above the lowest ground (11 blocks tall including the top course).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw967579696";
const W = 29, H = 23, D = 38;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), Math.round(gy));
const has = (x, z) => ground.has(key(x, z));

const B = Math.min(...ground.values());          // lowest ground under the footprint
const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Exterior faces of a footprint cell: n (z-1), s (z+1), w (x-1), e (x+1)
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
}
const isPerim = (x, z) => faces(x, z).length > 0;

// Pier (white frame) vs glazed bay along the facade; corners are always piers.
function isPier(x, z, f) {
  const ns = f.includes("n") || f.includes("s");
  const ew = f.includes("w") || f.includes("e");
  if (ns && ew) return true;
  const u = ns ? x - minX : z - minZ;
  return u % 4 === 0;
}

// Main entrance: the north-facing cell nearest the middle of that frontage.
let doorKey = null;
{
  const northXs = cells.filter(([x, z]) => faces(x, z).includes("n")).map((c) => c[0]);
  if (northXs.length) {
    const mid = (Math.min(...northXs) + Math.max(...northXs)) / 2;
    let best = Infinity;
    for (const x of northXs) {
      const dist = Math.abs(x - mid);
      if (dist < best) {
        best = dist;
        doorKey = key(x, cells.find(([cx, cz]) => cx === x && faces(cx, cz).includes("n"))[1]);
      }
    }
  }
}

// Pass 1: foundation, walls, floors, cornice, parapet, roof deck.
for (const [cx, cz, cg0] of cells) {
  const x = cx, z = cz;
  const gy = Math.round(cg0);
  const f = faces(x, z);
  const perim = f.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  for (let y = gy; y <= B + 10; y++) {
    const rel = y - B;
    if (rel === 0) {
      if (perim) put(x, y, z, "polished_andesite");              // base course / plinth
    } else if (rel >= 1 && rel <= 3) {
      if (perim) {
        if (doorKey === key(x, z) && rel === 1) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (doorKey === key(x, z) && rel === 2) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (isPier(x, z, f)) {
          put(x, y, z, "white_concrete");                          // shopfront mullion
        } else {
          put(x, y, z, "glass");                                   // shopfront glazing
        }
      }
    } else if (rel === 4) {
      if (perim) put(x, y, z, "smooth_quartz");                    // lintel over shopfront
    } else if (rel === 5) {
      // Floor slab between storeys, all cells.
      if (perim) put(x, y, z, "smooth_quartz");                    // storey line belt
      else put(x, y, z, "light_gray_concrete");                    // floor slab
    } else if (rel >= 6 && rel <= 8) {
      if (perim) {
        if (isPier(x, z, f)) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass");
      }
    } else if (rel === 9) {
      // Roof deck over every cell; perimeter gets the quartz cornice.
      if (perim) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_gray_concrete");
    } else if (rel === 10) {
      if (perim) put(x, y, z, "white_concrete");                   // parapet, top course
    }
  }
}

// Pass 2: rooftop plant on interior cells, standing on the roof deck.
for (const [cx, cz] of cells) {
  if (isPerim(cx, cz)) continue;
  if (cx % 6 === 2 && cz % 6 === 2) put(cx, B + 10, cz, "iron_block");
}

// Pass 3: warm lights in the air gap behind the glazing.
// Inward offset for each exterior face.
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
for (const [cx, cz] of cells) {
  const f = faces(cx, cz);
  if (!f.length) continue;
  if (isPier(cx, cz, f)) continue;
  const face = f[0];
  const [dx, dz] = inward[face];
  const ix = cx + dx, iz = cz + dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const u = (face === "n" || face === "s") ? cx - minX : cz - minZ;
  if (u % 8 === 2) {
    const gy = Math.round(ground.get(key(ix, iz)));
    // Shopfront lamp (ground floor) and upper-floor lamp.
    if (B + 2 >= gy) put(ix, B + 2, iz, "glowstone");
    if (u % 16 === 2) put(ix, B + 7, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
