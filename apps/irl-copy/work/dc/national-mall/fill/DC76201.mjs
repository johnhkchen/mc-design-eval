import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC76201";
const W = 17, H = 32, D = 23;
const MAX_TOP = 29;

// Materials: 1930s stripped-classical office block. Pale limestone piers,
// darker stone spandrel bands, granite base, glazed bays between.
const BASE = "polished_granite";
const BAND = "stone_bricks";          // storey spandrel bands, gives horizontal rhythm
const PIER = "quartz_pillar";         // vertical piers, reads as pilasters
const PARAPET = "stone_bricks";
const COPING = "quartz_slab";
const FLOOR = "smooth_stone";
const GLASS = "glass_pane";
const LIGHT = "glowstone";
const DOOR = "dark_oak_door";
const SURROUND = "stone_bricks";
const EQUIP = "iron_block";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof]));

const key = (x, z) => `${x},${z}`;
const F = new Map();
for (const [x, z, g, r] of cells) {
  F.set(key(x, z), { x: +x, z: +z, g: +g, r: +r });
}
const has = (x, z) => F.has(key(x, z));

// y 0 = lowest ground under the footprint.
const minG = Math.min(...[...F.values()].map((c) => c.g));
for (const c of F.values()) {
  c.g -= minG;
  c.r -= minG;
  c.g = Math.max(0, Math.min(c.g, MAX_TOP - 3));
}

// Clean 3-block storey tiers from each cell's ground up to the lidar roof.
for (const c of F.values()) {
  let n = Math.max(1, Math.round((c.r - c.g) / 3));
  n = Math.min(n, Math.floor((MAX_TOP - c.g) / 3));
  n = Math.max(1, n);
  c.n = n;
  c.top = c.g + 3 * n;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exposed faces of a cell (outside the footprint).
const exposure = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

// Entrance: ring cell on the south (max z) face nearest the middle.
const midX = Math.floor(W / 2);
const maxZ = Math.max(...[...F.values()].map((c) => c.z));
let doorKey = null;
let doorX = null;
{
  let best = Infinity;
  for (const c of F.values()) {
    if (c.z !== maxZ || has(c.x, c.z + 1)) continue;
    const d = Math.abs(c.x - midX);
    if (d < best) { best = d; doorKey = key(c.x, c.z); doorX = c.x; }
  }
}

const paneProps = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of F.values()) {
  const { x, z, g: gr, top, n } = c;
  const exp = exposure(x, z);
  const faces = Object.keys(exp).filter((f) => exp[f]);
  const ring = faces.length > 0;
  const corner = faces.length >= 2;
  const primary = faces[0];

  // Foundation: solid granite from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  if (!ring) {
    // Interior: floor slab per storey, roof slab on top, air between (no interiors).
    for (let k = 0; k < n; k++) put(x, gr + 3 * k, z, FLOOR);
    put(x, top - 1, z, FLOOR);
  } else {
    // Perimeter wall column.
    for (let y = gr; y < top; y++) {
      const k = Math.min(Math.floor((y - gr) / 3), n - 1);
      const b = gr + 3 * k;
      const rel = y - b;

      // Parapet on the top row.
      if (y === top - 1) {
        put(x, y, z, PARAPET);
        continue;
      }

      // Storey spandrel band (or granite base course at street level).
      if (rel === 0) {
        put(x, y, z, k === 0 ? BASE : BAND);
        continue;
      }

      const u = primary === "N" || primary === "S" ? x : z;
      const isPier = corner || u % 3 === 0;

      // Entrance door, with stone surround on both sides.
      if (k === 0 && doorKey === key(x, z) && (rel === 1 || rel === 2)) {
        const half = rel === 1 ? "lower" : "upper";
        put(x, y, z, DOOR, { facing: "south", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (k === 0 && doorX !== null && z === maxZ && Math.abs(x - doorX) === 1 && has(x, z) && (rel === 1 || rel === 2)) {
        put(x, y, z, SURROUND);
        continue;
      }

      if (isPier) {
        put(x, y, z, PIER, { axis: "y" });
        continue;
      }

      put(x, y, z, GLASS, paneProps(primary));

      // Warm light behind some glass, in the interior air gap.
      if (rel === 1 && (u + k) % 4 === 1) {
        const inward = {
          N: [x, z + 1],
          S: [x, z - 1],
          W: [x + 1, z],
          E: [x - 1, z],
        }[primary];
        if (has(inward[0], inward[1])) {
          const ic = F.get(key(inward[0], inward[1]));
          const innerExp = exposure(ic.x, ic.z);
          const innerRing = Object.values(innerExp).some(Boolean);
          if (!innerRing && y < ic.top - 1) put(inward[0], y, inward[1], LIGHT);
        }
      }
    }

    // Coping slab capping the parapet (sits on solid parapet).
    put(x, top, z, COPING, { type: "bottom", waterlogged: "false" });
  }

  // Roof equipment on interior roof area.
  if (!ring && x % 6 === 3 && z % 7 === 3 && top <= MAX_TOP - 1) {
    put(x, top, z, EQUIP);
    put(x, top + 1, z, EQUIP);
  }
}

// Warm light just inside the entrance, so the door reads at dusk.
if (doorKey !== null && doorX !== null) {
  const inZ = maxZ - 1;
  const dc = F.get(key(doorX, maxZ));
  if (dc && has(doorX, inZ)) {
    const ic = F.get(key(doorX, inZ));
    if (ic && ic.g + 1 < ic.top - 1) put(doorX, ic.g + 1, inZ, LIGHT);
  }
}

g.save(`${DIR}/${ID}.nbt`);
