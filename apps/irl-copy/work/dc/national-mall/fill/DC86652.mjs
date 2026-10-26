import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86652";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 31, D = 15;
const g = new Voxels([W, H, D]);

// Mid-century Downtown office block: calcite/white-concrete frame, stone base,
// storefront ground floor, ribbon windows in tinted glass, quartz mullions,
// cornice and parapet, roof tiers quantised to storey lines, penthouse core.
const key = (x, z) => `${x},${z}`;
const map = new Map();
let rawMax = 0;
for (const [x, z, gr, roof] of cells) {
  const r = Math.round(roof);
  map.set(key(x, z), { x, z, gr: Math.round(gr), roof: r });
  if (r > rawMax) rawMax = r;
}
const has = (x, z) => map.has(key(x, z));

// Quantise roofs to 4-block storey tiers so lidar noise becomes clean flat tiers.
for (const c of map.values()) {
  let t = Math.round(c.roof / 4) * 4;
  t = Math.max(t, c.gr + 4);
  t = Math.min(t, 20);
  c.top = t;
}
let maxTop = 0;
for (const c of map.values()) if (c.top > maxTop) maxTop = c.top;

// Entrances on both long faces (min z and max z), centred on each face.
let minZ = Infinity, maxZ = -Infinity;
for (const c of map.values()) {
  if (c.z < minZ) minZ = c.z;
  if (c.z > maxZ) maxZ = c.z;
}
function faceCentre(zv) {
  const xs = [];
  for (const c of map.values()) if (c.z === zv) xs.push(c.x);
  if (!xs.length) return -1;
  return Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
}
const doors = [
  { z: minZ, x: faceCentre(minZ), facing: "north" },
  { z: maxZ, x: faceCentre(maxZ), facing: "south" },
];

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Penthouse core region (inset from the street faces).
const PH = { x0: 3, x1: 8, z0: 3, z1: 11, h: 3 };
const inPH = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1;

for (const c of map.values()) {
  const { x, z, gr, top } = c;

  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const ext = exN || exS || exW || exE;
  const corner = (exN || exS) && (exW || exE);
  const alongX = exN || exS;
  const u = alongX ? x : z;
  const paneProps = alongX ? paneNS : paneEW;

  // Foundation and street-level slab
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  for (let y = gr + 1; y <= top - 1; y++) {
    const rel = y - gr;
    const isBand = (y % 4 === 0) || rel === 3;

    // Cornice course and parapet
    if (y === top - 1) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === top - 2 && ext) {
      g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    if (!ext) {
      if (isBand) g.set(x, y, z, "white_concrete");
      continue;
    }

    if (corner) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    if (isBand) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Entrance surround and doors on the street faces
    let handled = false;
    for (const d of doors) {
      if (z !== d.z || d.x < 0) continue;
      if (rel === 1 || rel === 2) {
        if (x === d.x) {
          g.set(x, y, z, "dark_oak_door", {
            facing: d.facing,
            half: rel === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          handled = true;
        } else if (Math.abs(x - d.x) === 1) {
          g.set(x, y, z, "smooth_quartz");
          handled = true;
        }
      }
    }
    if (handled) continue;

    // Mullions
    if (u % 3 === 0) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // Glass, with rare warm lit offices above the base
    const lit = rel >= 4 && ((u * 5 + y * 3) % 23 === 0);
    if (lit) {
      g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
    }
  }

  // Penthouse core: glazed shell on the roof tier, solid roof on top
  if (top === maxTop && inPH(x, z)) {
    const edgeX = x === PH.x0 || x === PH.x1;
    const edgeZ = z === PH.z0 || z === PH.z1;
    for (let y = top; y < top + PH.h; y++) {
      if (edgeX && edgeZ) {
        g.set(x, y, z, "smooth_quartz");
      } else if (edgeX || edgeZ) {
        const isWall = edgeZ ? true : false;
        if ((y - top) === 0 || (y - top) === PH.h - 1) {
          g.set(x, y, z, "smooth_quartz");
        } else if (x % 2 === 0 && edgeZ) {
          g.set(x, y, z, "smooth_quartz");
        } else {
          g.set(x, y, z, "light_blue_stained_glass_pane", edgeZ ? paneNS : paneEW);
        }
      }
    }
    g.set(x, top + PH.h, z, "smooth_stone");
  } else if (top === maxTop && !ext && (x + z) % 5 === 0) {
    // Plant boxes on the rest of the main roof
    for (let y = top; y <= top + 1 && y < H; y++) {
      g.set(x, y, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
