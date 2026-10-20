import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3391190.cells.json`, "utf8"));

const W = 19, H = 29, D = 28;
const g = new Voxels([W, H, D]);

// ---- helpers -------------------------------------------------------------
const map = new Map();
for (const c of cells) map.set(`${c[0]},${c[1]}`, c);
const inside = (x, z) => map.has(`${x},${z}`);

const OUT = [
  [0, -1, "north"],
  [0, 1, "south"],
  [1, 0, "east"],
  [-1, 0, "west"],
];

const clampY = (y) => Math.max(0, Math.min(H - 1, Math.round(y)));
const S = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D) return;
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

function isPerimeter(x, z) {
  for (const [dx, dz] of OUT) if (!inside(x + dx, z + dz)) return true;
  return false;
}

// ---- pass 1: massing, foundations, facade articulation -------------------
const windows = [];

for (const [x, z, groundRaw, roofRaw] of cells) {
  const G = clampY(groundRaw);
  const R = Math.max(G + 4, clampY(roofRaw));
  const outs = OUT.filter(([dx, dz]) => !inside(x + dx, z + dz));
  const perim = outs.length > 0;

  // foundation: dark rubble stone below grade
  for (let y = 0; y < G; y++) S(x, y, z, "stone");

  // solid brick body up to the roof
  for (let y = G; y < R; y++) S(x, y, z, "bricks");

  // base course
  S(x, G, z, "stone_bricks");

  if (perim) {
    if (outs.length >= 2) {
      // corner quoins: stone with alternating courses, reads as a masonry corner
      for (let y = G + 1; y < R; y++) {
        const course = (y - G) % 3 === 0;
        S(x, y, z, course ? "stone_bricks" : "bricks");
      }
    } else {
      const [dx, dz] = outs[0];
      const alongX = dz !== 0;
      const idx = alongX ? x : z;
      const isPier = ((idx % 3) + 3) % 3 === 0;
      const props = alongX ? PANE_NS : PANE_EW;
      const bx = x - dx, bz = z - dz;
      const behindIsInterior = inside(bx, bz) && !isPerimeter(bx, bz);

      for (let y = G + 1; y < R; y++) {
        if (y >= R - 2) {
          S(x, y, z, "stone_bricks"); // parapet
          continue;
        }
        if (y < G + 3) {
          // shopfront band: glass with brick piers
          if (isPier) S(x, y, z, "bricks");
          else {
            S(x, y, z, "glass_pane", props);
            if (behindIsInterior) windows.push({ bx, bz, y, k: 0, x, z });
          }
          continue;
        }
        const rel = (y - G - 3) % 3;
        if (rel === 0) {
          // storey line: a stone-brick slab reads as a thin string course, not a grey band
          S(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
        } else if (isPier) {
          S(x, y, z, "bricks");
        } else {
          S(x, y, z, "glass_pane", props);
          if (behindIsInterior) {
            windows.push({ bx, bz, y, k: Math.floor((y - G - 3) / 3), x, z });
          }
        }
      }
    }
    // cornice cap
    S(x, R - 1, z, "stone_bricks");
  } else {
    S(x, R - 1, z, "smooth_stone");
  }
}

// ---- pass 2: air gap behind glass, then warm lights ----------------------
for (const w of windows) {
  const c = map.get(`${w.bx},${w.bz}`);
  if (!c) continue;
  const G = clampY(c[2]);
  const R = Math.max(G + 4, clampY(c[3]));
  if (w.y < R - 2) S(w.bx, w.y, w.bz, "air");
}
for (const w of windows) {
  const c = map.get(`${w.bx},${w.bz}`);
  if (!c) continue;
  const G = clampY(c[2]);
  const R = Math.max(G + 4, clampY(c[3]));
  if (w.y >= R - 2) continue;
  // more warm windows at dusk: roughly every third one, lower row of each storey
  const lit = (w.x * 7 + w.z * 13 + w.k * 5) % 3 === 0;
  if (lit && (w.y - G) % 3 !== 0) {
    S(w.bx, w.y, w.bz, "glowstone");
  }
}

// ---- entrances: one door at the middle of each street face ---------------
for (const [dx, dz, facing] of OUT) {
  const list = [];
  for (const [x, z, groundRaw] of cells) {
    if (inside(x + dx, z + dz)) continue;
    const outs = OUT.filter(([ox, oz]) => !inside(x + ox, z + oz));
    if (outs.length !== 1) continue;
    list.push({ x, z, G: clampY(groundRaw), along: dz !== 0 ? x : z });
  }
  if (list.length < 5) continue;
  list.sort((a, b) => a.along - b.along);
  const door = list[Math.floor(list.length / 2)];
  const { x, z, G } = door;
  const alongX = dz !== 0;

  // dark stone frame: jambs and a lintel on the storey line above
  for (const s of [-1, 1]) {
    const nx = alongX ? x + s : x;
    const nz = alongX ? z : z + s;
    if (inside(nx, nz)) {
      S(nx, G + 1, nz, "stone_bricks");
      // lantern hanging beside the door, attached to the storey line above
      S(nx, G + 2, nz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
  // door itself
  S(x, G + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  S(x, G + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  // dark lintel over the door cell
  S(x, G + 3, z, "stone_bricks");
}

// ---- roof equipment: a small wooden water tower near the middle ----------
{
  let best = null;
  const cx = W / 2, cz = D / 2;
  for (const [x, z, , roofRaw] of cells) {
    const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (!quad.every(([qx, qz]) => inside(qx, qz) && !isPerimeter(qx, qz))) continue;
    const dist = Math.hypot(x - cx, z - cz);
    if (!best || dist < best.dist) best = { x, z, roof: clampY(roofRaw), dist };
  }
  if (best) {
    const { x, z, roof } = best;
    const posts = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    for (const [px, pz] of posts) {
      S(px, roof, pz, "oak_log", { axis: "y" });
      S(px, roof + 1, pz, "oak_log", { axis: "y" });
    }
    for (const [px, pz] of posts) S(px, roof + 2, pz, "oak_planks");
    S(x, roof + 3, z, "oak_planks");
  }
}

g.save(`${DIR}/NYC3391190.nbt`);
