import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi commercial block (c. 1980s-90s): cream render
// frontage, dark glass shopfronts with stone pillars, red-tile parapet
// (a nod to Taiwanese roof tiling), light-grey roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300013";
const W = 18, H = 23, D = 40;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));

const roofY = minG + 11;   // lidar: roof ~11 blocks above lowest ground
const L1 = minG + 5;       // first floor line (ground storey ~5 blocks)

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward normals in priority order: front (-z) first.
const NORMALS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

function faceOf(x, z) {
  for (const [nx, nz] of NORMALS) if (!has(x + nx, z + nz)) return [nx, nz];
  return null;
}

// Along-face coordinate for facade rhythm.
const along = (x, z, [nx]) => (nx !== 0 ? z : x);

// Pick the door: centre of the front-most exposed face that has cells.
let doorNormal = null;
for (const n of NORMALS) {
  const list = cells.filter(([x, z]) => {
    const f = faceOf(x, z);
    return f && f[0] === n[0] && f[1] === n[1];
  });
  if (list.length) {
    doorNormal = n;
    break;
  }
}
let doorKey = null;
if (doorNormal) {
  const list = cells
    .filter(([x, z]) => {
      const f = faceOf(x, z);
      return f && f[0] === doorNormal[0] && f[1] === doorNormal[1];
    })
    .map(([x, z]) => ({ x, z, u: along(x, z, doorNormal) }))
    .sort((a, b) => a.u - b.u);
  const mid = list[Math.floor(list.length / 2)];
  doorKey = `${mid.x},${mid.z}`;
}

// Pass 1: floors, foundations, roof slab, interior floor slabs.
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");   // foundation
  put(x, gc, z, "smooth_stone");                              // ground floor slab
  if (L1 > gc) put(x, L1, z, "smooth_stone");                 // first floor slab
  put(x, roofY - 1, z, "smooth_stone");                       // roof slab
}

// Pass 2: facades on exposed cells.
const LIGHT_IN = []; // [inX, inZ, y] glowstone spots behind glass
for (const [x, z, gc] of cells) {
  const f = faceOf(x, z);
  if (!f) continue;
  const u = along(x, z, f);
  const isDoor = doorKey === `${x},${z}` && f[0] === doorNormal[0] && f[1] === doorNormal[1];
  const top = roofY - 2;

  for (let y = gc; y <= top; y++) {
    if (isDoor && y <= gc + 1) {
      const half = y === gc ? "lower" : "upper";
      put(x, y, z, "iron_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y < L1) {
      // Ground storey: plinth, shopfront glass, stone pillars, lintel.
      if (y === gc) put(x, y, z, "stone_bricks");
      else if (y === L1 - 1) put(x, y, z, "smooth_quartz");
      else if (u % 3 === 0) put(x, y, z, "stone_bricks");
      else put(x, y, z, "glass");
    } else {
      // Upper storey: spandrels top and bottom, glass panes, quartz mullions.
      if (y === L1 || y === L1 + 1 || y === top) put(x, y, z, "smooth_quartz");
      else if (u % 3 === 0) put(x, y, z, "smooth_quartz");
      else {
        put(x, y, z, "glass_pane");
        if ((u + y) % 4 === 0) {
          const inX = x - f[0], inZ = z - f[1];
          if (has(inX, inZ) && !faceOf(inX, inZ)) LIGHT_IN.push([inX, inZ, y]);
        }
      }
    }
  }

  // Ground-storey interior warm lights, sparse, standing on the ground slab.
  if (L1 > gc && u % 6 === 2 && !isDoor) {
    const inX = x - f[0], inZ = z - f[1];
    if (has(inX, inZ) && !faceOf(inX, inZ)) LIGHT_IN.push([inX, inZ, gc + 1, "lantern"]);
  }

  // Cornice and parapet.
  put(x, roofY - 1, z, "smooth_quartz");
  put(x, roofY, z, "red_terracotta");
}

// Light sources behind the glass.
for (const [x, z, y, kind] of LIGHT_IN) {
  if (kind === "lantern") put(x, y, z, "lantern", { hanging: "false" });
  else {
    put(x, y, z, "glowstone");
  }
}

// Roof plant on the interior of the roof slab.
for (const [x, z] of cells) {
  if (faceOf(x, z)) continue;
  if (x % 5 === 2 && z % 7 === 3) {
    put(x, roofY, z, "light_gray_concrete");
    put(x, roofY + 1, z, "light_gray_concrete");
  }
  if (x % 6 === 4 && z % 9 === 5) {
    put(x, roofY, z, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
