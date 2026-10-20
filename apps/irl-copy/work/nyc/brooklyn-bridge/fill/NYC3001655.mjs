import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001655";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof]));

const W = 14, H = 19, D = 6;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, ground, roof] of rows) {
  cellMap.set(`${x},${z}`, { x, z, ground: Math.round(ground ?? 0), roof });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function faceOf(x, z) {
  if (!has(x, z - 1)) return { axis: "z", idx: x, front: true };
  if (!has(x, z + 1)) return { axis: "z", idx: x, front: false };
  if (!has(x - 1, z)) return { axis: "x", idx: z, front: false };
  if (!has(x + 1, z)) return { axis: "x", idx: z, front: false };
  return null;
}

// Flat roof tier from median lidar roof height (smooths noise)
const roofs = rows.map((r) => r[3]).filter((v) => typeof v === "number").sort((a, b) => a - b);
const medianRoof = roofs.length ? roofs[Math.floor(roofs.length / 2)] : 7;
const topFlat = Math.min(15, Math.max(5, Math.round(medianRoof)));

// Street-facing cells; entrance sits about a quarter along the frontage
const frontXs = rows
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length * 0.25)] : -1;

const GLASS_N = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_S = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, walls, floors, cornice
for (const [x, z, groundRaw] of rows.map(([x, z, gr]) => [x, z, Math.round(gr ?? 0)])) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g0 = Math.min(Math.max(groundRaw, 0), H - 8);
  const top = Math.min(Math.max(topFlat, g0 + 5), H - 3);
  const h = top - g0;

  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  if (exterior(x, z)) {
    const face = faceOf(x, z);
    const onStreet = face && face.axis === "z" && face.front;
    const isDoorCell = onStreet && x === doorX;
    // door surround: stone pilasters beside the entrance on the street face
    const isDoorSurround = onStreet && Math.abs(x - doorX) === 1;

    for (let o = 0; o <= h - 2; o++) {
      const y = g0 + o;
      if (o === 0) {
        g.set(x, y, z, "brown_terracotta"); // brownstone base course
      } else if (o === h - 2) {
        g.set(x, y, z, "bricks"); // brick course under cornice
      } else if (o % 2 === 0) {
        g.set(x, y, z, "brown_terracotta"); // brownstone storey belt
      } else {
        let isWindow = false;
        if (face) {
          const maxIdx = face.axis === "z" ? W - 1 : D - 1;
          isWindow = face.idx >= 1 && face.idx <= maxIdx - 1 && face.idx % 3 !== 0;
        }
        if (isDoorCell && (o === 1 || o === 2)) {
          // door filled in pass 2
        } else if (isDoorCell && o === 3) {
          g.set(x, y, z, "stone_bricks"); // entrance lintel
        } else if (isDoorSurround && o <= 3) {
          g.set(x, y, z, "stone_bricks"); // pilaster framing the door
        } else if (isWindow) {
          g.set(x, y, z, "glass_pane", face.axis === "z" ? GLASS_N : GLASS_S);
          // warm glowstone in the room behind some windows
          if (face.axis === "z" && has(x, z + 1) && !exterior(x, z + 1) && (x * 3 + o) % 5 === 0) {
            g.set(x, y, z + 1, "glowstone");
          }
        } else {
          g.set(x, y, z, "bricks");
        }
      }
    }

    // Cornice / roof edge
    g.set(x, top - 1, z, "smooth_stone");
  } else {
    // Interior: floor slab each storey, air between, flat roof
    for (let o = 0; o <= h - 1; o++) {
      if (o % 2 === 0 || o === h - 1) g.set(x, g0 + o, z, "smooth_stone");
    }
  }
}

// Pass 2: entrance door (drawn after walls so it is not overwritten)
for (const [x, z, groundRaw] of rows.map(([x, z, gr]) => [x, z, Math.round(gr ?? 0)])) {
  if (x !== doorX || z !== 0 || !has(x, z)) continue;
  const g0 = Math.min(Math.max(groundRaw, 0), H - 8);
  g.set(x, g0 + 1, z, "birch_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, g0 + 2, z, "birch_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Chimneys standing on the flat roof
for (const [cx, cz] of [[2, 2], [11, 3]]) {
  if (!has(cx, cz)) continue;
  const gr = Math.round(cellMap.get(`${cx},${cz}`).ground ?? 0);
  const g0 = Math.min(Math.max(gr, 0), H - 8);
  const top = Math.min(Math.max(topFlat, g0 + 5), H - 3);
  g.set(cx, top, cz, "bricks");
  g.set(cx, top + 1, cz, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
