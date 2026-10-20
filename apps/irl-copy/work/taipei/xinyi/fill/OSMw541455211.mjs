import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455211";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 10 x 17 footprint, roof about 11 blocks above lowest ground.
// Reading: a 1980s reinforced-concrete mixed-use block in Xinyi, two storeys of
// white concrete with light-grey frames, a stone-brick base, a shopfront with
// glass and a central entrance on the north (street) face, a parapet and a
// rooftop water tank and condenser.
const W = 10, H = 23, D = 17;
const v = new Voxels([W, H, D]);

const TOP = 10;      // roof slab level (interior); cornice at TOP on the perimeter
const FLOOR = 5;     // upper floor slab / string course
const PARAPET = 11;  // parapet course on the perimeter

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => groundOf.has(key(x, z));
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

// Pass 1: foundations, interior floor slabs, perimeter walls and parapet.
for (const [x, z] of cells) {
  const b = groundOf.get(key(x, z));
  for (let y = 0; y < b; y++) v.set(x, y, z, "stone_bricks");

  const fN = !has(x, z - 1), fS = !has(x, z + 1);
  const fW = !has(x - 1, z), fE = !has(x + 1, z);
  const perim = isPerim(x, z);
  const rx = x - minX, rz = z - minZ;

  if (!perim) {
    // Interior: floor slabs per storey, air in between (no interiors).
    if (b <= TOP) v.set(x, b, z, "light_gray_concrete");
    if (b < FLOOR) v.set(x, FLOOR, z, "light_gray_concrete");
    v.set(x, TOP, z, "light_gray_concrete");
    if (b + 1 <= TOP) {
      // roof slab stands on the interior; keep the air above it free
    }
    continue;
  }

  const corner = (fW || fE) && (fN || fS);
  const along = (fN || fS) ? rx : rz;   // position along the wall
  const pier = corner || along % 3 === 0;
  const entrance = fN && (rx === 4 || rx === 5);

  // Walls from the base course up to the cornice, then the parapet.
  for (let y = b; y <= TOP; y++) {
    let id;
    let props;

    if (corner) {
      id = "light_gray_concrete";                        // corner columns
    } else if (y === b) {
      id = "stone_bricks";                               // base course
    } else if (y === FLOOR) {
      id = "light_gray_concrete";                        // storey string course
    } else if (y < FLOOR) {
      // Ground storey: shopfront band.
      if (y === 4) {
        id = "stone_bricks";                             // lintel
      } else if (entrance && y <= b + 2) {
        id = "dark_oak_door";                            // central double entrance
        props = {
          facing: "north",
          half: y === b + 1 ? "lower" : "upper",
          hinge: rx === 4 ? "left" : "right",
          open: "false",
          powered: "false",
        };
      } else if (entrance) {
        id = "stone_bricks";                             // canopy over the door
      } else if (pier) {
        id = "white_concrete";
      } else {
        id = fN ? "glass" : "glass_pane";                // shopfront glass / windows
      }
    } else {
      // Upper storey: window grid with sills, heads and cornice.
      if (y === 6) {
        id = pier ? "white_concrete" : "light_gray_concrete";  // sill
      } else if (y === 9) {
        id = "light_gray_concrete";                            // head
      } else if (y === TOP) {
        id = "smooth_stone";                                   // cornice
      } else {
        id = pier ? "white_concrete" : "glass_pane";           // windows
      }
    }

    v.set(x, y, z, id, props);
  }

  // Parapet course on top of the perimeter walls.
  v.set(x, PARAPET, z, "stone_bricks");
}

// Pass 2: warm lights behind some windows (interior cell behind the glass).
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const fN = !has(x, z - 1), fS = !has(x, z + 1);
  const fW = !has(x - 1, z), fE = !has(x + 1, z);
  const corner = (fW || fE) && (fN || fS);
  if (corner) continue;
  const single = (fN !== fS) || (fW !== fE);
  if (!single) continue;

  const ix = fE && !fW ? x - 1 : fW && !fE ? x + 1 : x;
  const iz = fS && !fN ? z - 1 : fN && !fS ? z + 1 : z;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;

  const b = groundOf.get(key(x, z));
  const rx = x - minX, rz = z - minZ;
  const along = (fN || fS) ? rx : rz;
  const pier = along % 3 === 0;
  const entrance = fN && (rx === 4 || rx === 5);

  // Upper storey lamps.
  if (!pier && along % 6 === 1 && 7 > b && 7 < PARAPET) {
    v.set(ix, 7, iz, "glowstone");
  }
  // Shopfront lamps.
  if (!pier && !entrance && along % 6 === 2 && b + 2 < 4 && b + 2 > b) {
    v.set(ix, b + 2, iz, "shroomlight");
  }
}

// Pass 3: roof equipment standing on the interior roof slab.
const roofFree = (x, z) => has(x, z) && !isPerim(x, z);

// Water tank: 3x3 cylinder approximation, 3 blocks tall, smooth cap.
const tankX = [6, 7, 8], tankZ = [10, 11, 12];
for (const rx of tankX) for (const rz of tankZ) {
  const x = minX + rx, z = minZ + rz;
  const corner = (rx === 6 || rx === 8) && (rz === 10 || rz === 12);
  if (corner || !roofFree(x, z)) continue;
  for (let y = PARAPET; y <= PARAPET + 2; y++) v.set(x, y, z, "light_gray_concrete");
  v.set(x, PARAPET + 3, z, "smooth_stone");
}

// Condenser units: two iron-clad blocks stacked.
for (const [rx, rz] of [[2, 3], [2, 4]]) {
  const x = minX + rx, z = minZ + rz;
  if (!roofFree(x, z)) continue;
  v.set(x, PARAPET, z, "iron_block");
  v.set(x, PARAPET + 1, z, "iron_block");
}

v.save(`${DIR}/${ID}.nbt`);
