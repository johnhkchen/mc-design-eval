import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833558";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 20 x 21, two-storey 1970s concrete shophouse with a tiled-white
// facade, stone plinth, string courses, a cornice and parapet, a shopfront on
// the south face, and a rooftop water tank.
const W = 20, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gr = (x, z) => ground.get(key(x, z));

const base = Math.min(...cells.map((c) => c[2])); // lowest ground under the footprint
const F1 = base + 5;      // first floor line (storey band)
const ROOF = base + 10;   // roof deck / cornice line
const PAR = ROOF + 1;     // parapet course; roof top ~ base + 11

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const FACE_ORDER = ["north", "south", "west", "east"];
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// Entrance: south face cell nearest the face's centre.
const southX = cells.filter(([x, z]) => !has(x, z + 1)).map(([x]) => x);
const meanSouthX = southX.length ? southX.reduce((a, b) => a + b, 0) / southX.length : W / 2;
let ex = southX.length ? southX.reduce((best, x) => (Math.abs(x - meanSouthX) < Math.abs(best - meanSouthX) ? x : best), southX[0]) : 0;
let ez = -1;
for (const [x, z] of cells) if (x === ex && !has(x, z + 1)) ez = Math.max(ez, z);

const isShopCell = (x, z) => z === ez && Math.abs(x - ex) <= 1 && faceOf(x, z) === "south";

// Foundations and interior decks, then the exterior shell.
for (const [x, z, G] of cells) {
  // Solid foundation from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Floor slab at first-storey line and roof deck, interior cells only.
  const exterior = faceOf(x, z) !== null;
  if (!exterior) {
    if (F1 >= G) put(x, F1, z, "light_gray_concrete");
    if (ROOF >= G) put(x, ROOF, z, "light_gray_concrete");
  }

  // Exterior shell.
  if (!exterior) continue;
  const face = faceOf(x, z);
  const [ox, oz] = OUT[face];
  const axisT = face === "north" || face === "south" ? x : z;
  const shop = isShopCell(x, z);

  for (let y = G; y <= ROOF; y++) {
    if (y === base) { put(x, y, z, "stone_bricks"); continue; }          // plinth
    if (y === ROOF || y === F1) { put(x, y, z, "smooth_stone"); continue; } // string course / cornice
    if (shop && y >= base + 1 && y <= base + 3) { put(x, y, z, "glass"); continue; }
    if (shop && y === base + 4) { put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }

    const storeyF = y > F1 ? F1 : base;
    const r = y - storeyF;
    const isWindowCol = axisT % 3 === 1;
    if (r >= 1 && r <= 4 && isWindowCol && !shop) {
      if (r === 1) { put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }
      if (r === 2 || r === 3) {
        const ns = face === "north" || face === "south";
        put(x, y, z, "glass_pane", {
          north: ns ? "false" : "true",
          south: ns ? "false" : "true",
          east: ns ? "true" : "false",
          west: ns ? "true" : "false",
          waterlogged: "false",
        });
        // Warm light just inside some windows.
        const lit = (Math.floor(axisT / 3) + (storeyF === F1 ? 1 : 0)) % 2 === 0;
        const ix = x - ox, iz = z - oz;
        if (r === 2 && lit && has(ix, iz) && y >= gr(ix, iz)) {
          put(ix, y, iz, "glowstone");
        }
        continue;
      }
    }
    put(x, y, z, "white_terracotta");
  }

  // Parapet course on the exterior.
  put(x, PAR, z, "white_terracotta");
}

// Entrance door, canopy lantern.
put(ex, base + 1, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, base + 2, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(ex, base + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });

// Rooftop water tank on the interior, centred on the footprint.
const interior = cells.filter(([x, z]) => faceOf(x, z) === null);
if (interior.length) {
  const cx = interior.reduce((a, c) => a + c[0], 0) / interior.length;
  const cz = interior.reduce((a, c) => a + c[1], 0) / interior.length;
  for (const [x, z, G] of interior) {
    if (Math.abs(x - cx) > 2 || Math.abs(z - cz) > 2) continue;
    if (ROOF < G) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
    put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
