import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw538458227: no record, so it is read from the lidar height (roof ~11 blocks above
// lowest ground) as a two-storey, flat-roofed white-tile commercial block with a blue-glass
// curtain of punched windows, a stone base, a cornice and a parapet, typical of late-20th-century
// Taipei retail and office low-rises. Storeys are 5 blocks each.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458227";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, D = 12, H = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, y]) => [key(x, z), y]));
const inside = (x, z) => ground.has(key(x, z));
const grounds = [...ground.values()];
const maxG = Math.max(...grounds);

// Ground floor sits on the highest cell's ground so every cell's floor stands on solid
// foundation; lower cells get extra foundation below.
const Gf = maxG;
const ROOF = Gf + 10;      // roof deck (interior) / cornice level (perimeter)
const TOP = Gf + 11;       // parapet top
if (TOP + 2 >= H) throw new Error(`Building too tall for H=${H}: top ${TOP + 2}`);

const cornerStone = "polished_granite";
const pier = "white_concrete";
const spandrel = "light_gray_concrete";
const cornice = "smooth_quartz";
const floorSlab = "smooth_stone";
const foundation = "stone_bricks";
const glass = "cyan_stained_glass_pane";

const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, floors, perimeter facades.
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  // Foundation: solid from y 0 up to the storey base, so nothing floats on the slope.
  for (let y = 0; y < Gf; y++) g.set(x, y, z, foundation);

  const exN = !inside(x, z - 1), exS = !inside(x, z + 1);
  const exW = !inside(x - 1, z), exE = !inside(x + 1, z);
  const perim = exN || exS || exW || exE;

  if (!perim) {
    // Interior: floor slabs only, air elsewhere (no interiors).
    g.set(x, Gf, z, floorSlab);
    g.set(x, Gf + 5, z, floorSlab);
    g.set(x, ROOF, z, floorSlab);
    continue;
  }

  const corner = (exN || exS) && (exW || exE);
  const alongX = exN || exS; // wall runs east-west

  // Base course, storey belt, cornice and parapet.
  g.set(x, Gf, z, cornerStone);
  g.set(x, Gf + 5, z, spandrel);
  g.set(x, ROOF, z, cornice);
  g.set(x, TOP, z, pier);

  // Window rows: ground storey Gf+1..Gf+4, upper storey Gf+6..Gf+9.
  const rows = [Gf + 1, Gf + 2, Gf + 3, Gf + 4, Gf + 6, Gf + 7, Gf + 8, Gf + 9];
  const pos = alongX ? x : z;
  const start = alongX ? 0 : 0; // footprint is a rectangle from 0
  const isPier = corner || ((pos - start) % 3 === 0);

  const isEntrance = exN && x === 8 && z === 0;

  for (const y of rows) {
    if (isEntrance && (y === Gf + 1 || y === Gf + 2)) continue; // door handled below
    if (isEntrance && y === Gf + 3) { g.set(x, y, z, cornice); continue; } // lintel
    if (isEntrance && y === Gf + 4) { g.set(x, y, z, pier); continue; }
    if (isPier) {
      g.set(x, y, z, pier);
    } else {
      g.set(x, y, z, glass, paneProps(alongX));
      // Warm light in some windows, placed in the room behind the glass.
      const ix = x + (exW ? 1 : exE ? -1 : 0);
      const iz = z + (exN ? 1 : exS ? -1 : 0);
      if (inside(ix, iz) && ((x * 7 + y * 3 + z * 5) % 11 === 0)) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Parapet: full wall block at the top, corners stay solid.
  // (Parapet blocks already placed above.)
}

// Entrance: centred on the north (street) face, with a door that opens into the lobby.
{
  const x = 8, z = 0;
  for (const y of [Gf + 1, Gf + 2]) {
    g.set(x, y, z, "dark_oak_door", {
      facing: "north",
      half: y === Gf + 1 ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
  }
  // Lantern on the lintel, lit at dusk.
  g.set(x, Gf + 3, z - 0, cornice);
  g.set(x, Gf + 4, z, pier);
  // Interior lobby light behind the door.
  if (inside(x, z + 1)) g.set(x, Gf + 2, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// Ground-floor floor slabs and roof deck for every interior cell not handled above.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const perim = !inside(x, z - 1) || !inside(x, z + 1) || !inside(x - 1, z) || !inside(x + 1, z);
  if (!perim) {
    g.set(x, Gf, z, floorSlab);
    g.set(x, Gf + 5, z, floorSlab);
    g.set(x, ROOF, z, floorSlab);
  }
}

// Roof equipment: a plant housing on the roof deck, centred, with a lantern on top.
for (let x = 6; x <= 10; x++) {
  for (let z = 4; z <= 7; z++) {
    if (!inside(x, z)) continue;
    g.set(x, TOP, z, spandrel);
    g.set(x, TOP + 1, z, spandrel);
  }
}
g.set(8, TOP + 2, 5, "sea_lantern");
g.set(8, TOP + 2, 6, "sea_lantern");

g.save(`${DIR}/${ID}.nbt`);
