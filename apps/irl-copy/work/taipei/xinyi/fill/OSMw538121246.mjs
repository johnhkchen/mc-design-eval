import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121246";
const W = 34, H = 23, D = 18;

// Roof deck sits at y=11 (about 11 blocks above lowest ground); parapet to y=12.
const ROOF = 11;
const WALL_TOP = 10;   // cornice course
const FLOOR2 = 5;      // second-floor line, absolute
const LINTEL_Y = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

const paneProps = (zFace) => zFace
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorProps = (half) => ({
  facing: "south", half, hinge: "left", open: "false", powered: "false",
});

for (const [x, z, gr] of cells) {
  const gy = gr;
  const missing = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const perim = missing.n || missing.s || missing.w || missing.e;
  const zFace = missing.n || missing.s;
  const xFace = missing.w || missing.e;
  const corner = zFace && xFace;

  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Roof deck over every footprint cell, parapet on the perimeter.
  g.set(x, ROOF, z, "stone");
  if (perim) g.set(x, ROOF + 1, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, no walls.
    g.set(x, gy, z, "smooth_stone");
    if (FLOOR2 > gy) g.set(x, FLOOR2, z, "smooth_stone");
    // Roof plant boxes.
    if (x % 9 === 4 && z % 6 === 3) {
      g.set(x, ROOF + 1, z, "smooth_stone");
      g.set(x, ROOF + 2, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter wall, bottom (base course) to cornice.
  const idx = zFace ? x : z;
  const pier = corner || idx % 4 === 0;
  const onNorthEntrance = missing.n && x >= 15 && x <= 18;
  const lit = !corner && idx % 8 === 6;

  for (let y = gy; y <= WALL_TOP; y++) {
    if (y === gy) {
      g.set(x, y, z, "stone_bricks");                    // base course
    } else if (y === WALL_TOP) {
      g.set(x, y, z, "smooth_stone");                    // cornice
    } else if (y === LINTEL_Y) {
      g.set(x, y, z, "white_concrete");                  // ground storey lintel
    } else if (y === FLOOR2) {
      g.set(x, y, z, "light_gray_concrete");             // storey line
    } else if (y === 6 || y === 9) {
      g.set(x, y, z, "white_concrete");                  // spandrels
    } else if (y < LINTEL_Y) {
      // Ground storey shopfront.
      if (onNorthEntrance) {
        if ((x === 16 || x === 17) && y <= gy + 2) {
          g.set(x, y, z, "oak_door", doorProps(y === gy + 1 ? "lower" : "upper"));
        } else {
          g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(zFace));
        }
      } else if (pier) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(zFace));
      }
    } else {
      // Upper storey glazing.
      if (pier) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(zFace));
      }
    }
  }

  // Entrance transom and canopy line over the doors.
  if (onNorthEntrance && gy + 3 <= LINTEL_Y - 1) {
    g.set(x, gy + 3, z, "light_blue_stained_glass_pane", paneProps(zFace));
  }

  // Warm interior light behind selected upper windows.
  if (lit && !pier) {
    let ix = x, iz = z;
    if (missing.n) iz = z + 1;
    else if (missing.s) iz = z - 1;
    else if (missing.w) ix = x + 1;
    else if (missing.e) ix = x - 1;
    if (has(ix, iz) && !(ix === x && iz === z)) {
      g.set(ix, 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
