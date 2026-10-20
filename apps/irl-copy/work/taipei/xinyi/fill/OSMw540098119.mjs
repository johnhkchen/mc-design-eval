import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block (c. 1990s Xinyi): white concrete piers,
// glazed bays, quartz cornice, lintel and spandrel bands, flat roof with plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098119";
const W = 23, H = 23, D = 18;
const ROOF_Y = 10;      // cornice / roof deck level, top of body = 11 blocks
const SPANDREL_Y = 5;   // storey line / upper floor slab
const LINTEL_Y = 4;     // ground-storey head band
const PANE = "glass_pane";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const minG = Math.min(...list.map((c) => c[2]));

const G = new Map();
for (const [x, z, gr] of list) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(`${x},${z}`, Math.max(0, Math.min(gr - minG, 8)));
}
const fp = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const isPerim = (x, z) =>
  fp(x, z) && (!fp(x - 1, z) || !fp(x + 1, z) || !fp(x, z - 1) || !fp(x, z + 1));
const cells = [...G.keys()].map((k) => k.split(",").map(Number));

// Entrance: the south-facing exposed cell nearest the footprint's middle.
const southExposed = cells.filter(([x, z]) => !fp(x, z + 1));
const midX = southExposed.length
  ? southExposed.reduce((a, [x]) => a + x, 0) / southExposed.length
  : W / 2;
let ent = null;
for (const [x, z] of southExposed) {
  if (!ent || Math.abs(x - midX) < Math.abs(ent[0] - midX)) ent = [x, z];
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

const paneProps = (orient) =>
  orient === "x"
    ? { east: "true", north: "false", south: "false", west: "true", waterlogged: "false" }
    : { east: "false", north: "true", south: "true", west: "false", waterlogged: "false" };

// Returns [id, props?] for a perimeter wall cell at height y.
function wallBlock(x, z, y, gr, orient) {
  if (y === gr) return ["polished_andesite"];           // base course
  if (y === ROOF_Y) return ["smooth_quartz"];           // cornice
  if (orient === "c") return ["white_concrete"];        // corner piers
  const k = orient === "x" ? x : z;
  const pier = k % 3 === 0;                             // mullion every third bay
  if (y <= 3) {                                         // shopfront
    return pier ? ["smooth_quartz"] : [PANE, paneProps(orient)];
  }
  if (y === LINTEL_Y) return ["smooth_quartz"];         // ground-storey head
  if (y === SPANDREL_Y) return ["light_gray_concrete"]; // storey line
  return pier ? ["white_concrete"] : [PANE, paneProps(orient)]; // upper windows
}

for (const [x, z] of cells) {
  const gr = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  if (!perim) {
    // Interior: floor slabs and roof deck only; air behind the glass.
    put(x, gr, z, "light_gray_concrete");
    if (SPANDREL_Y > gr) put(x, SPANDREL_Y, z, "light_gray_concrete");
    if (ROOF_Y >= gr) put(x, ROOF_Y, z, "light_gray_concrete");

    // Warm light behind some windows (interior cells beside the facade).
    const nearFacade =
      isPerim(x - 1, z) || isPerim(x + 1, z) || isPerim(x, z - 1) || isPerim(x, z + 1);
    if (nearFacade && gr <= 6 && (x * 3 + z * 5) % 4 === 0) {
      put(x, 7, z, "glowstone");
    }

    // Roof plant: small AC units on the deck.
    if (ROOF_Y >= gr && x % 5 === 2 && z % 5 === 2) {
      put(x, ROOF_Y + 1, z, "iron_block");
    }
    continue;
  }

  // Perimeter shell.
  const mX = !fp(x - 1, z) || !fp(x + 1, z);
  const mZ = !fp(x, z - 1) || !fp(x, z + 1);
  const orient = mX && mZ ? "c" : mZ ? "x" : "z";
  const isEnt = ent && ent[0] === x && ent[1] === z;
  const doorHere = isEnt && gr + 2 <= 3;

  for (let y = gr; y <= ROOF_Y; y++) {
    if (doorHere && (y === gr + 1 || y === gr + 2)) continue; // door set below
    const [id, props] = wallBlock(x, z, y, gr, orient);
    put(x, y, z, id, props);
  }

  if (doorHere) {
    put(x, gr + 1, z, "iron_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 2, z, "iron_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Hanging lanterns either side of the entrance, under the lintel.
if (ent) {
  const [ex, ez] = ent;
  for (const dx of [-1, 1]) {
    const x = ex + dx;
    if (!isPerim(x, ez)) continue;
    const gr = gnd(x, ez);
    if (3 > gr && LINTEL_Y > 3) {
      put(x, 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
