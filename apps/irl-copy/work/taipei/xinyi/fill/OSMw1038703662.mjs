import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703662";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise 2-storey commercial block, c. 1980s-90s Xinyi street frontage:
// stone plinth, shopfront ground floor, tiled white upper floor with
// glazed bays, cornice, parapet, rooftop plant.
const W = 40, H = 23, D = 22;
const FLOOR = 5;   // floor band between storeys
const CORN = 10;   // cornice / roof deck level
const ROOF = 11;   // parapet top (about 11 above lowest ground)

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => gmap.has(key(x, z));

const minZ = Math.min(...cells.map(([, z]) => z));

// Pick the entrance: front (lowest z) cell with the lowest ground, nearest the centre.
const frontCells = cells.filter(([x, z]) => z === minZ && !has(x, z - 1));
const cx = W / 2;
let door = null;
for (const [x, z, gr] of frontCells) {
  if (!door || gr < door[2] || (gr === door[2] && Math.abs(x - cx) < Math.abs(door[0] - cx))) {
    door = [x, z, gr];
  }
}
const doorKey = door ? key(door[0], door[1]) : null;

for (const [x, z, gr] of cells) {
  const gg = Math.min(gr, H - 1);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone_bricks");

  const exNS = !has(x, z - 1) || !has(x, z + 1); // wall runs along x
  const exEW = !has(x - 1, z) || !has(x + 1, z); // wall runs along z
  const perim = exNS || exEW;
  const corner = exNS && exEW;

  if (!perim) {
    // Interior: floor slab per storey, roof deck, air elsewhere.
    if (gg < FLOOR) g.set(x, FLOOR, z, "smooth_stone");
    if (gg <= CORN) g.set(x, CORN, z, "light_gray_concrete");
    // Rooftop plant room in the middle of the roof.
    if (gg <= CORN && Math.abs(x - 20) <= 5 && Math.abs(z - 11) <= 4) {
      g.set(x, ROOF, z, "gray_concrete");
      g.set(x, ROOF + 1, z, "gray_concrete");
      if (Math.abs(x - 20) <= 3 && Math.abs(z - 11) <= 2) {
        g.set(x, ROOF + 2, z, "iron_bars");
      }
    }
    continue;
  }

  // Bay index along the exposed wall; piers at corners and every 4th block.
  const bay = exNS ? x : z;
  const pier = corner || bay % 4 === 0;
  const litBay = !pier && bay % 5 === 2;
  const isDoorCell = key(x, z) === doorKey;

  for (let y = gg; y <= ROOF; y++) {
    if (y >= H) break;

    if (y < FLOOR) {
      // Ground floor: shopfront.
      if (y === gg) {
        g.set(x, y, z, "stone_bricks");                 // plinth
      } else if (y === 4) {
        g.set(x, y, z, pier ? "smooth_quartz" : "light_gray_concrete"); // lintel
      } else if (pier) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "glass");
      }
    } else if (y === FLOOR) {
      g.set(x, y, z, "light_gray_concrete");            // floor band
    } else if (y < CORN) {
      // Upper storey: glazed bays between tiled piers.
      if (pier) {
        g.set(x, y, z, "smooth_quartz");
      } else if (y === FLOOR + 1 || y === CORN - 1) {
        g.set(x, y, z, "light_gray_concrete");          // sill / head frame
      } else if (y === 7 && litBay) {
        g.set(x, y, z, "glowstone");                    // warm light behind glazing
      } else {
        g.set(x, y, z, "glass_pane");
      }
    } else if (y === CORN) {
      g.set(x, y, z, pier ? "smooth_quartz" : "stone_brick_slab", pier ? {} : { type: "bottom" });
    } else {
      // Parapet.
      g.set(x, y, z, pier ? "smooth_quartz" : "white_concrete");
    }
  }

  // Entrance on the front face: door in the glazing, lintel canopy above.
  if (isDoorCell && gg + 2 < FLOOR) {
    g.set(x, gg + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gg + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 4, z, "stone_brick_slab", { type: "top" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
