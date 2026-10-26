import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73401.cells.json`, "utf8"));

// 1937 stripped-classical office block: light limestone walls on a rusticated
// base, flat roof with parapet, 3-block storeys, central attic pavilion,
// dark-bronze-style doors in a quartz surround on the z=0 end.
const W = 20, H = 26, D = 75, TOP = 25;
const g = new Voxels([W, H, D]);

const STOREY = 3;
const WALL = "calcite";
const PIER = "white_concrete";
const BASE_A = "stone_bricks";
const BASE_B = "cracked_stone_bricks";
const BAND = "smooth_quartz";
const CAP = "polished_diorite";
const GLASS = "light_gray_stained_glass";
const FLOOR = "smooth_stone";
const ROOF = "gray_concrete";
const PARAPET = "stone_brick_wall";
const FOUND = "stone_bricks";
const LIGHT = "glowstone";
const MECH = "light_gray_concrete";
const ATTIC = "calcite";
const ATTIC_GLASS = "light_gray_stained_glass";

// Lidar-driven, storey-quantised roof per footprint cell.
const cell = new Map();
for (const [x, z, gr0, rf] of cells) {
  const gr = Math.max(0, gr0);
  let r = gr + STOREY * Math.max(1, Math.round((rf - gr) / STOREY));
  r = Math.max(gr + STOREY, Math.min(TOP, r));
  cell.set(`${x},${z}`, { gr, r });
}
const has = (x, z) => cell.has(`${x},${z}`);

const put = (x, y, z, name, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

for (const [key, { gr, r }] of cell) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y0 to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const perimeter = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const endFace = !has(x, z - 1) || !has(x, z + 1); // short ends
  const t = endFace ? x : z;
  const edgeCorner = endFace ? (x === 0 || x === W - 1) : (z === 0 || z === D - 1);

  if (perimeter) {
    for (let y = gr; y <= r - 2; y++) {
      const lvl = y - gr;
      // Pilaster bays every 4 cells; corners always solid.
      const pier = t % 4 === 0 || edgeCorner;

      // Entrance surround on the z=0 end: x 7..12, doors at 9-10.
      if (z === 0 && x >= 7 && x <= 12 && lvl <= 2) {
        if (lvl <= 1 && (x === 9 || x === 10)) {
          put(x, y, z, "dark_oak_door", {
            facing: "north", half: lvl === 0 ? "lower" : "upper",
            hinge: x === 9 ? "left" : "right", open: "false", powered: "false",
          });
        } else if (lvl === 2 && (x === 8 || x === 11)) {
          put(x, y, z, CAP);
        } else if (x === 7 || x === 12) {
          put(x, y, z, CAP);
        } else if (lvl === 2) {
          put(x, y, z, BAND);
        } else {
          put(x, y, z, WALL);
        }
        continue;
      }

      if (lvl === 0) {
        // Rusticated base course, alternating courses.
        put(x, y, z, (t % 2 === 0) ? BASE_A : BASE_B);
      } else if (lvl % STOREY === 0) {
        put(x, y, z, BAND);                       // storey line
      } else if (pier) {
        // Pier column; capital course above each window band.
        put(x, y, z, lvl % STOREY === 2 ? CAP : PIER);
      } else {
        put(x, y, z, GLASS);                      // window
      }
    }
    // Cornice, then parapet.
    put(x, r - 1, z, BAND);
    put(x, r, z, PARAPET);
  } else {
    // Interior: floor slabs, air gaps, roof deck.
    for (let y = gr; y <= r - 2; y++) {
      if ((y - gr) % STOREY === 0) put(x, y, z, FLOOR);
    }
    put(x, r - 1, z, ROOF);

    // Warm lights just inside the window bays, standing on storey floors.
    if ((x === 1 || x === W - 2) && z % 6 === 0) {
      for (let y = gr; y <= r - 2; y++) {
        if ((y - gr) % STOREY === 0 && (y - gr) + 1 <= r - 2) {
          put(x, y + 1, z, LIGHT);
        }
      }
    }

    // Roof plant units standing on the roof deck.
    if (x % 7 === 3 && z % 11 === 5) put(x, r, z, MECH);

    // Central attic pavilion: three storeys of calcite with a glazed band,
    // set on the lidar roof so it reads as the crown of the building.
    const inPavilion = x >= 5 && x <= 14 && z >= 30 && z <= 44;
    const pavTop = r + STOREY;
    if (inPavilion && pavTop <= TOP) {
      const edge = x === 5 || x === 14 || z === 30 || z === 44;
      for (let y = r; y < pavTop; y++) {
        const lvl = y - r;
        if (lvl === 0) put(x, y, z, BAND);
        else if (edge && lvl === 1 && (x + z) % 2 === 0) put(x, y, z, ATTIC_GLASS);
        else if (edge) put(x, y, z, ATTIC);
        else put(x, y, z, lvl === STOREY - 1 ? BAND : ATTIC);
      }
      // Pavilion parapet, and a warm light inside.
      if (edge) put(x, pavTop, z, PARAPET);
      if (!edge && x === 7 && z === 37) put(x, r + 1, z, LIGHT);
    }
  }
}

g.save(`${DIR}/DC73401.nbt`);
