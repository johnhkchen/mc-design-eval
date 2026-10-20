import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw535173671";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 20, H = 23, D = 17;
const ROOF = 11;          // roof surface about 11 blocks above lowest ground
const TOP = ROOF - 1;     // top body block (roof deck)
const g = new Voxels([W, H, D]);

// Lookup of footprint cells -> ground
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);
const groundOf = (x, z) => gmap.get(`${x},${z}`);

// Which sides of a cell face outside the footprint
function missing(x, z) {
  const m = [];
  if (!has(x, z - 1)) m.push("N");
  if (!has(x, z + 1)) m.push("S");
  if (!has(x - 1, z)) m.push("W");
  if (!has(x + 1, z)) m.push("E");
  return m;
}
const isPerim = (x, z) => missing(x, z).length > 0;

// Glass pane with connections running along the facade
function pane(face) {
  const alongX = face === "N" || face === "S";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

// Facade colours: white plaster, quartz bands, andesite plinth, light glass
const WALL = "white_concrete";
const BAND = "smooth_quartz";
const PLINTH = "polished_andesite";
const GLASS = "light_blue_stained_glass_pane";
const PILLAR = "quartz_pillar";
const FLOOR = "smooth_stone";
const FOUND = "stone_bricks";

// Pass 1: foundations, body, facade, floors
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const m = missing(x, z);
  const perim = m.length > 0;
  const corner = m.length >= 2;
  const face = m.length === 1 ? m[0] : null;
  const pos = face === "N" || face === "S" ? x : z;
  const win = perim && !corner && pos % 3 === 1;
  const bodyBottom = Math.min(gr, TOP);

  for (let y = bodyBottom; y <= TOP; y++) {
    if (perim) {
      if (y === gr) {
        g.set(x, y, z, PLINTH);                       // base course
      } else if (y === TOP) {
        g.set(x, y, z, BAND);                         // cornice
      } else if (corner) {
        g.set(x, y, z, PILLAR, { axis: "y" });        // corner piers
      } else if ((y >= 1 && y <= 3 && win) || (y >= 6 && y <= 8 && win)) {
        g.set(x, y, z, GLASS, pane(face));            // glazing
      } else if (y === 4 || y === 9) {
        g.set(x, y, z, BAND);                         // storey lines
      } else {
        g.set(x, y, z, WALL);
      }
    } else {
      // Interior: floor slabs only, the rest is air behind the glass
      if (y === gr || y === 5 || y === TOP) g.set(x, y, z, FLOOR);
    }
  }

  // Parapet and roof equipment
  if (perim) {
    g.set(x, ROOF, z, corner ? PILLAR : WALL, corner ? { axis: "y" } : undefined);
  } else if ((x + 2 * z) % 7 === 0) {
    g.set(x, ROOF, z, "gray_concrete");              // rooftop plant boxes
  }
}

// Pass 2: warm lights behind some upper-storey windows
for (const [x, z, gr] of cells) {
  const m = missing(x, z);
  if (m.length !== 1 || m[0] === undefined) continue;
  const face = m[0];
  const pos = face === "N" || face === "S" ? x : z;
  if (pos % 6 !== 1 || 7 < gr) continue;
  let ix = x, iz = z;
  if (face === "N") iz = z + 1;
  if (face === "S") iz = z - 1;
  if (face === "W") ix = x + 1;
  if (face === "E") ix = x - 1;
  if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, 7, iz, "glowstone");
}

// Pass 3: entrance on the north (z-min) front, nearest the footprint centre
{
  const xs = cells.map(c => c[0]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  let best = null;
  for (const [x, z, gr] of cells) {
    const m = missing(x, z);
    if (m.length === 1 && m[0] === "N") {
      if (!best || Math.abs(x - cx) < Math.abs(best[0] - cx)) best = [x, z, gr];
    }
  }
  if (best) {
    const [x, z, gr] = best;
    const yl = gr + 1, yu = gr + 2;
    // Stone surround either side of the door
    for (const dx of [-1, 1]) {
      if (has(x + dx, z) && isPerim(x + dx, z)) {
        g.set(x + dx, yl, z, PLINTH);
        g.set(x + dx, yu, z, PLINTH);
      }
    }
    g.set(x, yl, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, yu, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Canopy over the entrance, inside the footprint
    if (has(x, z + 1)) g.set(x, gr + 3, z + 1, BAND);
  }
}

g.save(`${dir}/${id}.nbt`);
