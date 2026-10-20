import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw1016280212: 20 x 18 footprint, roof ~21 blocks above lowest ground.
// Reading: a four-storey 1990s Xinyi commercial block, white-concrete frame with
// light-blue glazing, a stone base and shopfront at street level, a red terracotta
// sign band, a quartz parapet, and a small rooftop plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280212";
const W = 20, H = 33, D = 18;
const STOREY = 5;
const STOREYS = 4;
const ROOF_REL = STOREY * STOREYS; // roof deck, relative to base B

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gnd] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gnd))));
}

const has = (x, z) => cells.has(`${x},${z}`);
const list = [...cells.keys()].map((k) => k.split(",").map(Number));
const B = Math.min(...cells.values());           // absolute storey base (lowest ground)
const minX = Math.min(...list.map((c) => c[0]));
const maxX = Math.max(...list.map((c) => c[0]));
const minZ = Math.min(...list.map((c) => c[1]));
const maxZ = Math.max(...list.map((c) => c[1]));

// Entrance: on the north (min z) street front, nearest the middle of the frontage.
const midX = (minX + maxX) / 2;
const frontXs = list.filter(([, z]) => z === minZ).map(([x]) => x);
const doorX = frontXs.length
  ? frontXs.reduce((a, b) => (Math.abs(b - midX) < Math.abs(a - midX) ? b : a))
  : -1;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade classification of a footprint cell from its exposed sides.
function facadeOf(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  const zWall = n || s;   // wall runs along x
  const xWall = w || e;   // wall runs along z
  if (!zWall && !xWall) return null;
  if (zWall && xWall) return { kind: "corner" };
  if (zWall) return { kind: "wall", axis: "x", idx: x, door: n && z === minZ && x === doorX };
  return { kind: "wall", axis: "z", idx: z, door: false };
}

// Glazed bay: a non-mullion, non-door wall cell in a glazed row.
function isGlassBay(f, s, r) {
  if (!f || f.kind !== "wall" || f.door || f.idx % 3 === 0) return false;
  if (s === 0) return r === 1 || r === 2;   // shopfront glass
  return r >= 1 && r <= 3;                  // upper-floor glazing
}

// Warm lamp in the air gap behind some windows (interior cells only).
function glowAt(x, z, s, r) {
  if (r !== 2) return false;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz)) continue;
    const f = facadeOf(nx, nz);
    if (isGlassBay(f, s, r) && (f.idx + s) % 3 === 0) return true;
  }
  return false;
}

// 1. Foundations and body, cell by cell.
for (const [x, z] of list) {
  const gnd = cells.get(`${x},${z}`);
  const f = facadeOf(x, z);

  // Solid foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  for (let y = gnd; y <= B + ROOF_REL; y++) {
    if (y === B + ROOF_REL) {                 // roof deck
      put(x, y, z, "smooth_quartz");
      continue;
    }
    const rel = y - B;
    const s = Math.floor(rel / STOREY);
    const r = rel % STOREY;

    if (f) {
      if (f.kind === "corner") {
        put(x, y, z, s === 0 && r === 0 ? "polished_andesite" : "white_concrete");
        continue;
      }
      if (s === 0 && r === 0) { put(x, y, z, "polished_andesite"); continue; }
      if (r === 0) { put(x, y, z, "white_concrete"); continue; }     // floor line
      if (r === 4) { put(x, y, z, "light_gray_concrete"); continue; } // spandrel
      if (s === 0 && r === 3) { put(x, y, z, "red_terracotta"); continue; } // sign band
      if (s === 0 && f.door && (r === 1 || r === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (f.idx % 3 === 0) { put(x, y, z, "white_concrete"); continue; } // mullion
      const props = f.axis === "x"
        ? { north: "false", south: "false", east: "true", west: "true" }
        : { north: "true", south: "true", east: "false", west: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", props);
    } else {
      // Interior: a floor slab per storey, air gap otherwise, lamps behind some windows.
      if (r === 0) put(x, y, z, "smooth_quartz");
      else if (glowAt(x, z, s, r)) put(x, y, z, "glowstone");
    }
  }

  // Parapet cornice on the perimeter, one block above the roof deck.
  if (f) put(x, B + ROOF_REL + 1, z, "white_concrete");
}

// 2. Rooftop plant box, set back from the parapet.
const bx0 = minX + 5, bx1 = maxX - 5, bz0 = minZ + 4, bz1 = maxZ - 4;
for (const [x, z] of list) {
  if (x < bx0 || x > bx1 || z < bz0 || z > bz1) continue;
  if (cells.get(`${x},${z}`) > B + ROOF_REL) continue;
  const edge = x === bx0 || x === bx1 || z === bz0 || z === bz1;
  for (let y = B + ROOF_REL + 1; y <= B + ROOF_REL + 3; y++) {
    if (y === B + ROOF_REL + 3 || edge) put(x, y, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
