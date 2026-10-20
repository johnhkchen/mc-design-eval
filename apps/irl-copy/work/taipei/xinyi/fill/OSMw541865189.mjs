import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source record. Read as a two-storey, flat-roofed commercial/residential
// block of the 1980s-90s Xinyi fringe: smooth quartz tile wall, light grey concrete
// storey lines, red terracotta sign band over a glazed ground-floor shopfront, and a
// parapet with a rooftop water tank. Roof about 11 blocks above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865189";
const W = 11, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

const B = Math.min(...ground.values());   // building datum = lowest ground
const FL1 = B + 5;                        // second-floor slab / storey line
const ROOF = B + 10;                      // roof deck
const PAR_TOP = B + 12;                   // parapet top (coping)

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Which cells are on the front (street) face: the z-minimum edge.
const FRONT_Z = Math.min(...[...ground.keys()].map(k => +k.split(",")[1]));
const DOOR_X = 5;

for (const [k, gc] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  const perim = n || s || w || e;

  if (!perim) {
    // Interior: no rooms, only floor slabs and roof deck.
    put(x, gc, z, "smooth_stone");
    if (FL1 > gc) put(x, FL1, z, "smooth_stone");
    if (ROOF > gc) put(x, ROOF, z, "stone");
    continue;
  }

  // Exterior shell.
  put(x, gc, z, "polished_andesite");                 // base course

  for (let y = gc + 1; y <= PAR_TOP; y++) {
    if (y > ROOF + 2) break;
    let id = "smooth_quartz";

    if (y === FL1 || y === B + 9 || y === ROOF) {
      put(x, y, z, "light_gray_concrete");              // storey lines and cornice
      continue;
    }
    if (y === PAR_TOP) {
      put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (y > ROOF) {
      put(x, y, z, "smooth_quartz");                    // parapet
      continue;
    }

    // Pattern index along the face: piers every third cell.
    const idx = (n || s) ? x : z;
    const pier = (idx % 3 === 0) || idx === 0 || idx === (n || s ? W - 1 : D - 1);

    // Ground storey: shopfront on the street face, windows elsewhere.
    if (y >= B + 1 && y <= B + 3) {
      if (n && z === FRONT_Z) {
        if (x === DOOR_X) {
          if (y === B + 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (y === B + 2) put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "smooth_quartz");
        } else if (x === 0 || x === W - 1) {
          id = "smooth_quartz";
          put(x, y, z, id);
        } else {
          put(x, y, z, "glass");
        }
        continue;
      }
      if (!pier) { put(x, y, z, "glass"); continue; }
      put(x, y, z, id);
      continue;
    }

    // Lintel / sign band over the shopfront.
    if (y === B + 4) {
      put(x, y, z, n && z === FRONT_Z ? "red_terracotta" : "smooth_quartz");
      continue;
    }

    // Upper storey windows.
    if (y >= B + 6 && y <= B + 8) {
      if (pier) { put(x, y, z, "smooth_quartz"); continue; }
      put(x, y, z, "glass");
      // Warm light behind some windows, if the inward cell is free interior.
      if ((x * 7 + z * 13 + y * 3) % 5 === 0) {
        const ix = w ? x + 1 : e ? x - 1 : x;
        const iz = n ? z + 1 : s ? z - 1 : z;
        if ((ix !== x || iz !== z) && has(ix, iz)) {
          put(ix, y, iz, "glowstone");
        }
      }
      continue;
    }

    put(x, y, z, id);
  }

  // Roof deck for the whole footprint (interior handled above, perimeter via band).
}

// Rooftop water tank: small box on the roof deck, lid as a slab.
for (let x = 3; x <= 5; x++) {
  for (let z = 7; z <= 9; z++) {
    if (!has(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, "white_concrete");
    put(x, ROOF + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
