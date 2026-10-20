import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-style mixed-use block (c. 1980s-90s): five storeys of
// white-tiled concrete, a grey plinth, a shopfront ground floor under a
// canopy, blue-glass window bands with pale frames, a cornice and parapet,
// and a rooftop plant box. Footprint-driven, no interiors.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011440";
const W = 22, H = 38, D = 17;
const STOREY = 5;     // blocks per storey
const TOP = 25;       // last body row (roof surface at ground+26)
const CORNICE = 24;   // cornice row
const PLANT = 26;     // rooftop plant row

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

// A perimeter cell carries glass in window rows unless it is a mullion column.
const isGlassCol = (x, z) => has(x, z) && perim(x, z) && (x + z) % 3 !== 0;

const paneProps = (x, z) => ({
  north: isGlassCol(x, z - 1) ? "true" : "false",
  south: isGlassCol(x, z + 1) ? "true" : "false",
  east: isGlassCol(x + 1, z) ? "true" : "false",
  west: isGlassCol(x - 1, z) ? "true" : "false",
  waterlogged: "false",
});

// Entrance: prefer (10,0) on the low-z face, else the first perimeter cell with min z.
let door = null;
if (has(10, 0) && perim(10, 0)) door = [10, 0];
else {
  let best = null;
  for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
    if (perim(x, z) && (!best || z < best[1] || (z === best[1] && x < best[0]))) best = [x, z];
  }
  door = best;
}

// Pass 1: foundation, storey slabs, roof, walls, shopfronts, windows.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at every storey line and the roof deck (all footprint cells).
  for (let s = 0; s < 5; s++) {
    const base = s === 0 && perim(x, z) ? "polished_andesite" : "smooth_stone";
    put(x, gr + s * STOREY, z, base);
  }
  put(x, gr + TOP, z, perim(x, z) ? "smooth_stone" : "gray_concrete");

  if (!perim(x, z)) continue;

  // Perimeter body: walls, window bands, spandrels, cornice, parapet.
  for (let row = 1; row < CORNICE; row++) {
    if (row % STOREY === 0) continue; // floor lines already placed
    const s = Math.floor(row / STOREY);
    const r = row % STOREY; // 1..4
    const y = gr + row;

    if (s === 0) {
      if (r === 4) {
        put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" }); // canopy
      } else if (door && x === door[0] && z === door[1]) {
        if (r === 3) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else put(x, y, z, "white_concrete"); // transom behind door
      } else if ((x + z) % 6 === 0) {
        put(x, y, z, "light_gray_concrete"); // shopfront mullion
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
      }
      continue;
    }

    if (r === 4) {
      put(x, y, z, "white_concrete"); // spandrel
    } else if ((x + z) % 3 === 0) {
      put(x, y, z, "light_gray_concrete"); // mullion frame
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
    }
  }

  // Base course is the first row of the plinth; cornice and parapet on top.
  put(x, gr + CORNICE, z, "smooth_stone");
  put(x, gr + TOP, z, "smooth_stone");
}

// Entrance door (lower and upper halves) on the chosen perimeter cell.
if (door) {
  const [dx, dz] = door;
  const gr = gnd(dx, dz);
  put(dx, gr + 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Pass 2: warm lights set just inside some upper-floor windows.
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  // Find an outward-facing side (a missing neighbour) and step inward.
  const dx = !has(x + 1, z) ? -1 : !has(x - 1, z) ? 1 : 0;
  const dz = !has(x, z + 1) ? -1 : !has(x, z - 1) ? 1 : 0;
  if (dx === 0 && dz === 0) continue;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || perim(ix, iz)) continue;
  for (let s = 1; s < 5; s++) {
    if (!isGlassCol(x, z)) break;
    if ((x * 5 + z * 3 + s) % 7 !== 0) continue;
    const gi = gnd(ix, iz);
    put(ix, gi + s * STOREY + 2, iz, "glowstone");
  }
}

// Pass 3: rooftop plant box on the interior of the roof.
for (const [x, z, gr] of cells) {
  if (perim(x, z)) continue;
  if (x >= 6 && x <= 15 && z >= 5 && z <= 11) {
    put(x, gr + PLANT, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
