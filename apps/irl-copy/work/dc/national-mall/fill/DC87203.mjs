import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87203";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), {
    g: Math.round(gr),
    r: Math.min(Math.round(rf), H - 2),
  });
}
const has = (x, z) => map.has(key(x, z));

// Palette: Beaux-Arts bank in limestone, dark stone plinth, bronze-tinted doors
const PLINTH = "stone_bricks";
const WALL = "calcite";          // limestone piers
const BELT = "smooth_stone";     // string courses and sills, lighter band
const CAP = "polished_andesite"; // cornice and capitals
const TRIM = "chiseled_stone_bricks"; // entrance surround
const FLOOR = "smooth_stone";
const GLASS = "glass_pane";

for (const [k, cell] of map) {
  const [x, z] = k.split(",").map(Number);
  const gr = cell.g;
  const r = cell.r;

  const mN = !has(x, z - 1);
  const mS = !has(x, z + 1);
  const mW = !has(x - 1, z);
  const mE = !has(x + 1, z);
  const perim = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, PLINTH);

  // Storey bands: ground storey 3 high, then 2-high upper storeys
  const bands = [[gr, gr + 3]];
  let b = gr + 3;
  while (b < r - 1) {
    bands.push([b, Math.min(b + 2, r - 1)]);
    b += 2;
  }
  const bandStarts = new Set(bands.map(([s]) => s));

  // Interior: floor slabs per storey and roof deck; everything else air
  if (!perim) {
    for (const s of bandStarts) put(x, s, z, FLOOR);
    put(x, r - 1, z, FLOOR);
    continue;
  }

  // Perimeter shell
  const isFront = mN || mS; // face runs along x
  const i = isFront ? x : z;
  const dx = mW ? 1 : mE ? -1 : 0; // inward offsets
  const dz = mN ? 1 : mS ? -1 : 0;
  const glassProps = isFront
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isStreet = mN && !corner; // street face (z = 0)
  const doorCol = isStreet && x === 5;
  const surround = isStreet && (x === 4 || x === 6); // entrance jambs

  for (let y = gr; y <= r - 1; y++) {
    if (y === r - 1) {
      put(x, y, z, CAP); // cornice course
      continue;
    }

    if (corner) {
      put(x, y, z, WALL);
      continue;
    }

    if (y === gr) {
      put(x, y, z, PLINTH); // dark base course
      continue;
    }

    // Ground storey: entrance with framed door, otherwise tall window bays
    if (y < gr + 3) {
      if (doorCol) {
        if (y === gr) { put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 1) { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        put(x, y, z, CAP); // lintel over door
        continue;
      }
      if (surround) {
        put(x, y, z, TRIM); // jambs framing the door
        continue;
      }
      if (i % 2 === 1) {
        put(x, y, z, GLASS, glassProps);
        // warm light behind every ground-storey pane so the bank glows at dusk
        put(x + dx, y, z + dz, "glowstone");
      } else {
        put(x, y, z, y === gr + 2 ? CAP : WALL); // capital row above piers
      }
      continue;
    }

    // Upper storeys: belts, window bays, piers
    if (bandStarts.has(y)) {
      put(x, y, z, BELT); // string course / sill line
      continue;
    }
    if (i % 2 === 1) {
      put(x, y, z, GLASS, glassProps);
      if ((i + y) % 3 === 0) put(x + dx, y, z + dz, "shroomlight");
    } else {
      put(x, y, z, WALL);
    }
  }

  // Parapet: balustrade alternating solid piers and open gaps on the roof edge
  if (corner || (i % 2 === 0)) {
    put(x, r, z, CAP);
  }
}

g.save(`${DIR}/${ID}.nbt`);
