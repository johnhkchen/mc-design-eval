import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC54821";
const W = 71, H = 35, D = 46;

// Large early-20th-century Beaux-Arts style hotel: limestone-clad, setback massing,
// recessed window bays between piers, a recessed entrance, a cornice, and a
// mechanical penthouse on top.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr, roof] of raw) cells.set(`${x},${z}`, { x, z, gr, roof });
const inFp = (x, z) => cells.has(`${x},${z}`);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Smooth lidar roof noise with a 5x5 median, quantise to 2-block storey tiers,
// and do not let a cell rise far above its wider neighbourhood (removes spikes).
function neighbourhood(c, r) {
  const v = [];
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const n = cells.get(`${c.x + dx},${c.z + dz}`);
    if (n) v.push(n.roof);
  }
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
}
for (const c of cells.values()) {
  c.g = clamp(Math.round(c.gr), 0, H - 1);
  const med5 = neighbourhood(c, 2);
  let target = Math.min(neighbourhood(c, 1), med5 + 2);
  c.rq = 2 * Math.round(target / 2);
  c.rq = clamp(c.rq, c.g + 4, 30);
}

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DOOR_FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const isEdge = (c) => dirs.some(([dx, dz]) => !inFp(c.x + dx, c.z + dz));

// Extent of each exterior face direction, used to centre the entrance.
const faceRange = {};
for (const c of cells.values()) {
  for (const [dx, dz] of dirs) {
    if (inFp(c.x + dx, c.z + dz)) continue;
    const k = `${dx},${dz}`;
    const t = dx ? c.z : c.x;
    const r = (faceRange[k] ??= { min: Infinity, max: -Infinity });
    r.min = Math.min(r.min, t);
    r.max = Math.max(r.max, t);
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Pass 1: solid core from y0 to the roof; foundation stone below the ground line.
for (const c of cells.values()) {
  for (let y = 0; y < c.rq; y++) {
    put(c.x, y, c.z, y < c.g ? "stone_bricks" : "smooth_stone");
  }
}

// Pass 2: roof surfaces on interior cells, parapets on edge cells.
for (const c of cells.values()) {
  if (isEdge(c)) put(c.x, c.rq, c.z, "smooth_quartz");
  else put(c.x, c.rq - 1, c.z, "gray_concrete");
}

// Pass 3: facades.
// Piers stand on the face plane; window bays are recessed one block behind it,
// with glass on the inner cell, so every bay has a reveal and a shadow line.
for (const c of cells.values()) {
  for (const [dx, dz] of dirs) {
    if (inFp(c.x + dx, c.z + dz)) continue;
    const k = `${dx},${dz}`;
    const t = dx ? c.z : c.x;
    const { min, max } = faceRange[k];
    const mid = (min + max) / 2;
    const long = (max - min) >= 9;
    const isEntr = long && Math.abs(t - mid) < 0.5;
    const isEntrSide = long && Math.abs(t - mid) >= 0.5 && Math.abs(t - mid) < 1.6;
    const pillar = ((t % 3) + 3) % 3 === 0;
    const ix = c.x - dx, iz = c.z - dz;
    const hasInner = inFp(ix, iz);
    const facing = DOOR_FACING[k];

    for (let y = c.g; y <= c.rq - 1; y++) {
      const rel = y - c.g;
      let id = "calcite";
      let props = null;
      let bay = false;       // a window bay (recessed)
      let doorway = false;   // recessed entrance opening

      if (rel === 0) {
        id = "polished_andesite";
      } else if (y >= c.rq - 2) {
        // Two-course cornice at the top of the wall.
        id = y === c.rq - 1 ? "smooth_quartz" : "calcite";
      } else if (rel <= 2) {
        // Ground floor: recessed entrance in the centre, shopfront bays elsewhere.
        if (isEntr) {
          doorway = true;
          if (rel <= 2) {
            id = "dark_oak_door";
            props = {
              facing,
              half: rel === 1 ? "lower" : "upper",
              hinge: "left",
              open: "false",
              powered: "false",
            };
          }
        } else if (isEntrSide) {
          id = "polished_andesite";
        } else if (!pillar) {
          bay = true;
        }
      } else if (rel % 2 === 1) {
        // Upper storeys: window rows between storey bands.
        if (!pillar) bay = true;
      }

      if (bay && hasInner) {
        // Recess: air on the face cell, glass (or warm light) on the inner cell.
        put(c.x, y, c.z, "air");
        const warm = ((ix * 7 + iz * 13 + y * 31) % 11) === 0;
        put(ix, y, iz, warm ? "glowstone" : "glass");
      } else if (bay) {
        put(c.x, y, c.z, "glass");
      } else {
        put(c.x, y, c.z, id, props);
      }

      if (doorway && hasInner && rel >= 1 && rel <= 2) {
        put(c.x, y, c.z, rel === 1 ? "dark_oak_door" : "dark_oak_door", props);
        put(ix, y, iz, "air");
      }
    }

    // Entrance: hanging lantern in the recess above the door, lit at dusk.
    if (isEntr && hasInner) {
      put(ix, c.g + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// Pass 4: rooftop mechanical penthouses on interior cells sharing one roof tier.
for (const c of cells.values()) {
  if (isEdge(c)) continue;
  if (c.x % 9 !== 4 || c.z % 9 !== 4) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => cells.get(`${c.x + a},${c.z + b}`));
  if (block.some((n) => !n || n.rq !== c.rq || isEdge(n))) continue;
  const top = c.rq + 3;
  if (top >= H) continue;
  for (const n of block) {
    for (let y = n.rq; y < top; y++) put(n.x, y, n.z, "light_gray_concrete");
    put(n.x, top, n.z, "smooth_stone_slab", { type: "bottom" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
