import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001288";
const W = 21, D = 15, H = 47;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mod = (a, n) => ((a % n) + n) % n;

// Footprint lookup and per-cell massing (ground G, roof R), roof quantised to 2-block storeys
const cellMap = new Map();
let Gb = Infinity;
for (const [x, z, g0, r0] of list) {
  const G = clamp(Math.round(g0), 0, H - 14);
  let R = Math.round(r0);
  R = Math.max(R, G + 6);
  R = Math.min(R, 42);
  R = G + 2 * Math.round((R - G) / 2);
  R = clamp(R, G + 6, 42);
  cellMap.set(`${x},${z}`, { x, z, G, R });
  Gb = Math.min(Gb, G);
}
const has = (x, z) => cellMap.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Building centre for the roof plant
let sx = 0, sz = 0, n = 0;
for (const c of cellMap.values()) { sx += c.x; sz += c.z; n++; }
const cx = Math.round(sx / n), cz = Math.round(sz / n);

for (const c of cellMap.values()) {
  const { x, z, G, R } = c;
  const xEdge = !has(x - 1, z) || !has(x + 1, z);
  const zEdge = !has(x, z - 1) || !has(x, z + 1);
  const perim = xEdge || zEdge;
  const corner = xEdge && zEdge;
  const alongZ = xEdge && !zEdge;          // wall runs along z
  const t = alongZ ? z : x;                // coordinate along the face

  for (let y = 0; y < R; y++) {
    let id = null;
    let props;
    const p = mod(y - Gb, 2);

    if (y < G) {
      id = "stone_bricks";                 // foundation
    } else if (y === G) {
      id = perim ? "stone_bricks" : "smooth_stone";   // base course / first floor slab
    } else if (y >= R - 2) {
      id = perim ? "stone_bricks" : "smooth_stone";   // cornice and roof deck
    } else if (p === 0) {
      // floor line: spandrel band (stone every 6 blocks) on the facade, slab inside
      if (perim) id = mod(y - Gb, 6) === 0 ? "smooth_stone" : "bricks";
      else id = "smooth_stone";
    } else if (perim) {
      // window row: stone piers give relief against the brick, glass in between
      if (corner) {
        id = "stone_bricks";
      } else if (t % 3 === 0) {
        id = "polished_andesite";          // piers
      } else if (t % 12 === 1 && mod(y - Gb, 6) === 1) {
        id = "glowstone";                  // sparse warm light behind glass
      } else {
        id = "glass_pane";
        props = alongZ
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      }
    }
    // interior air rows are left empty (no interiors)

    if (id) g.set(x, y, z, id, props);
  }

  // parapet on the perimeter
  if (perim) g.set(x, R, z, "stone_bricks");

  // elevator / mechanical bulkhead on the roof, near the centre
  if (!perim && Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3) {
    for (let y = R; y <= R + 2; y++) {
      g.set(x, y, z, "light_gray_concrete");
    }
    if (Math.abs(x - cx) === 3 || Math.abs(z - cz) === 3) {
      g.set(x, R + 1, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
    }
  }
}

// Entrance on the low-z (Beekman Street) face, near the middle
const front = [...cellMap.values()].filter(c => !has(c.x, c.z - 1));
if (front.length) {
  const midX = (Math.min(...front.map(c => c.x)) + Math.max(...front.map(c => c.x))) / 2;
  const ent = front.reduce((a, b) => (Math.abs(b.x - midX) < Math.abs(a.x - midX) ? b : a));
  const { x: ex, z: ez, G: eG } = ent;

  g.set(ex, eG, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, eG + 1, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(ex, eG + 2, ez, "stone_bricks");   // lintel

  for (const dx of [-1, 1]) {
    const nx = ex + dx;
    const nb = front.find(c => c.x === nx && c.z === ez);
    if (!nb) continue;
    g.set(nx, eG + 2, ez, "stone_bricks");
    g.set(nx, eG + 1, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
