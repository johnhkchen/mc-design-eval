// Way 1095572125: a two-storey 1920s brick commercial block on the Mt Eden side of the CBD fringe. Red brick walls, cream
// plaster quoins and string courses, a dark-timber shopfront with a central door, sash-style glass bays, and a parapet
// with a cornice. Every storey stands on the one below; the interior is air with floor slabs and a few hanging lamps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572125.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const footprint = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const has = (x, z) => footprint.has(key(x, z));
// which sides of a cell face outside the footprint
const faces = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });
const outward = (f) => Number(f.n) + Number(f.s) + Number(f.w) + Number(f.e);

const g = new Voxels([10, 23, 7]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// materials: red brick body, cream plaster trim, dark timber shopfront, glass in sash bays
const BRICK = "bricks", TRIM = "smooth_quartz", PLINTH = "stone_bricks", FLOOR = "smooth_stone";
const GLASS = "glass", PANE = "glass_pane", FASCIA = "dark_oak_planks", DOOR = "dark_oak_door", LAMP = "lantern";
const UNIT = "iron_block";

// storeys (height in blocks): plinth y0; ground y1-3; band y4; first floor y5-7; cornice y8; parapet y9 (roof 10)
const BAND = 4, CORNICE = 8, PARAPET = 9;

// the shopfront: the z=6 row faces the street, with the door in its middle cell
const isShopfront = (x, z) => z === 6 && has(x, z) && !has(x, z + 1);
const DOOR_X = 7;

// the sash bays: every other wall cell on a face is a window, corners are trimmed piers, the rest brick
const isWindowBay = (x, z, f) => outward(f) === 1 && (x + z) % 2 === 1;

// the pane's connections run along the wall it sits in, so it joins the piers on either side
const paneState = (x, z, f) => {
  const alongEW = f.n || f.s;
  return {
    north: String(!alongEW && has(x, z - 1)),
    south: String(!alongEW && has(x, z + 1)),
    east: String(alongEW && has(x + 1, z)),
    west: String(alongEW && has(x - 1, z)),
    waterlogged: "false",
  };
};

// one storey's wall cell: a sash bay (glass between the sill and the lintel, trim above), or brick. The stepped footprint
// makes most cells corners, so corner piers would turn the walls to plaster; the cream stays on the bands and lintels.
const storeyWall = (x, z, f, out, y, glassLo, glassHi, lintelY) => {
  if (!isWindowBay(x, z, f)) return put(x, y, z, BRICK);
  if (y >= glassLo && y <= glassHi) return put(x, y, z, PANE, paneState(x, z, f));
  if (y === lintelY) return put(x, y, z, TRIM);
  return put(x, y, z, BRICK);
};

// pass 1: the shell, every cell from the footprint, storey by storey
for (const [x, z, , roofH] of cells) {
  const f = faces(x, z), out = outward(f);
  const DECK = roofH - 2;

  // the plinth round the outside and the floor slab inside, the band between storeys, the roof deck over the top floor
  put(x, 0, z, out ? PLINTH : FLOOR);
  put(x, BAND, z, out ? TRIM : FLOOR);
  put(x, DECK, z, out ? TRIM : FLOOR);

  if (!out) continue; // interior cells: air between the slabs (rooms left open)

  // ground storey (y1-3): the street-front row is shopfront, the rest the same bays as above
  for (let y = 1; y <= 3; y++) {
    if (isShopfront(x, z)) {
      if (y === 3) put(x, y, z, FASCIA);     // fascia over the shop
      else if (x !== DOOR_X) put(x, y, z, GLASS); // the door cell is set below
      continue;
    }
    storeyWall(x, z, f, out, y, 1, 2, 3);
  }
  // first floor (y5-7): sash bays with a lintel over each
  for (let y = 5; y <= 7; y++) storeyWall(x, z, f, out, y, 5, 6, 7);
  // cornice, then the parapet cap, the only walls above the roof deck
  put(x, CORNICE, z, TRIM);
  put(x, PARAPET, z, BRICK);
}

// the shopfront door: lower and upper halves, hinged on the left, facing out to the street
put(DOOR_X, 1, 6, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR_X, 2, 6, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// roof plant on the deck: two units set well in from the parapet
put(4, 9, 3, UNIT);
put(5, 9, 4, UNIT);

// warm lamps hung from the ceilings of some interior cells: under the band in the ground storey, under the deck above the first floor
for (const [x, z] of cells) {
  const f = faces(x, z);
  if (outward(f)) continue;
  if ((x + z) % 3 !== 0) continue;
  put(x, 3, z, LAMP, { hanging: "true", waterlogged: "false" });
  put(x, 7, z, LAMP, { hanging: "true", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572125.nbt");
