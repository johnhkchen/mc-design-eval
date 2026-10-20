import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unidentified office tower, Xinyi district. Read from the lidar record:
// 52 x 51 footprint, roof about 108 blocks above the lowest ground (about 21 storeys).
// Reads as a late-1990s / early-2000s Taipei office block: a stone-based podium with
// shopfronts and a recessed entrance, a glazed tower with spandrels, mullions and
// corner piers, two chamfered setbacks, a mechanical crown with louvres, and a roof spire.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw383729926";
const W = 52, D = 51, H = 120, ROOF = 108;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

// footprint cell -> ground height
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const isFp = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, b) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (typeof b === "string") vox.set(x, y, z, b);
  else vox.set(x, y, z, b.id, b.props);
};

// Tier geometry: chamfered rectangle inset from the footprint.
function inTier(x, z, inset, ch) {
  if (x < inset || x > W - 1 - inset || z < inset || z > D - 1 - inset) return false;
  const dx = Math.min(x - inset, W - 1 - inset - x);
  const dz = Math.min(z - inset, D - 1 - inset - z);
  if (dx < ch && dz < ch && dx + dz < ch) return false;
  return true;
}

// Zones by absolute height: podium to g+20, tower A to 88, setback B to 100, crown to 108.
function tierAt(y, g) {
  if (y < g + 20) return { podium: true };
  if (y < ROOF - 20) return { inset: 5, ch: 5, name: "A" };
  if (y < ROOF - 8) return { inset: 10, ch: 4, name: "B" };
  return { inset: 16, ch: 2, name: "C", crown: true };
}

function inside(x, z, T) {
  if (T.podium) return isFp(x, z);
  return isFp(x, z) && inTier(x, z, T.inset, T.ch);
}

function edgeOf(x, z, T) {
  if (!inside(x, z, T)) return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inside(x + dx, z + dz, T));
}

// Corner cell: outside on one x-side and one z-side.
function cornerOf(x, z, T) {
  return (!inside(x - 1, z, T) || !inside(x + 1, z, T)) &&
         (!inside(x, z - 1, T) || !inside(x, z + 1, T));
}

// Ground floor and podium
function podiumFill(x, z, s, e) {
  if (s === 0) return "stone_bricks";                        // plinth course
  if (s === 4) return "light_gray_concrete";                 // floor slab / fascia
  if (s < 4) {
    if (!e) return null;                                     // interior air

    // Entrance: recessed opening, x 22..28 on the south face.
    const onSouth = z === D - 1;
    if (onSouth && x >= 22 && x <= 28) {
      if (s === 3) return "smooth_stone";                    // canopy / lintel
      if (x === 25) {
        return {
          id: "oak_door",
          props: { facing: "south", half: s === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
        };
      }
      if (s === 1 && (x === 23 || x === 27)) {
        return { id: "lantern", props: { hanging: "false", waterlogged: "false" } };
      }
      if (x === 22 || x === 28) return "stone_bricks";      // door surround
      return "light_blue_stained_glass";
    }

    // Corner piers on the podium
    if (cornerOf(x, z, { podium: true })) return "light_gray_concrete";
    return "light_blue_stained_glass";                       // shopfront glazing
  }
  return storeyFill(x, z, s, e, { podium: true });
}

// Typical office storey on a 5-block module:
// row 0 spandrel/floor slab, rows 1-3 glazing with mullions and corner piers, row 4 slab.
function storeyFill(x, z, s, e, T) {
  const r = s % 5;
  if (r === 0) return e ? "white_concrete" : "light_gray_concrete";
  if (r === 4) return "light_gray_concrete";
  if (!e) return null;                                       // air behind glass
  if (cornerOf(x, z, T)) return "light_gray_concrete";      // corner pier
  const nsFace = !inside(x, z - 1, T) || !inside(x, z + 1, T);
  const mullion = nsFace ? x % 3 === 0 : z % 3 === 0;
  if (mullion) return "light_gray_concrete";
  if ((x * 7 + z * 13 + s * 5) % 19 === 0) return "glowstone"; // warm lit window
  return "cyan_stained_glass";
}

// Mechanical crown: louvred sides, solid deck.
function crownFill(x, y, e) {
  if (y === ROOF) return e ? "light_gray_concrete" : null;  // parapet ring
  if (y === ROOF - 1) return "light_gray_concrete";         // roof deck
  if (!e) return "gray_concrete";
  return y % 2 === 0 ? "iron_bars" : "gray_concrete";
}

for (const [x, z, g] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g && y < H; y++) put(x, y, z, "stone");

  // Building body.
  for (let y = g; y <= Math.min(ROOF, H - 1); y++) {
    const T = tierAt(y, g);
    if (!inside(x, z, T)) continue;
    const e = edgeOf(x, z, T);
    const s = y - g;

    if (T.podium) {
      const b = podiumFill(x, z, s, e);
      if (b) put(x, y, z, b);
    } else if (T.crown) {
      const b = crownFill(x, y, e);
      if (b) put(x, y, z, b);
    } else {
      const b = storeyFill(x, z, s, e, T);
      if (b) put(x, y, z, b);
    }
  }

  // Setback terraces: slab the lower tier's top where the tier above steps in,
  // with a railing on the exposed edge.
  for (const L of [g + 20, ROOF - 20, ROOF - 8, ROOF - 2]) {
    if (L - 1 < g || L > ROOF) continue;
    const T1 = tierAt(L - 1, g);
    const T2 = tierAt(L, g);
    if (inside(x, z, T1) && !inside(x, z, T2)) {
      put(x, L - 1, z, "light_gray_concrete");
      if (edgeOf(x, z, T1)) put(x, L, z, "iron_bars");
    }
  }
}

// Roof spire on the centre line.
for (let y = ROOF + 1; y <= ROOF + 5; y++) {
  put(25, y, 25, { id: "lightning_rod", props: { facing: "up", powered: "false", waterlogged: "false" } });
}

vox.save(`${DIR}/${ID}.nbt`);
