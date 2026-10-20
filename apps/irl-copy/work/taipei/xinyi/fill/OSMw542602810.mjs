import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542602810";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 41, H = 23, D = 10;
const ROOF = 11;          // roof deck level, about 11 blocks above lowest ground
const GROUND_TOP = 4;     // ground storey runs from its ground to y=4
const SLABS = [5, 10];    // storey floor lines

const v = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward normals, checked in order so the z=0 (street) face wins at corners.
const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function outward(x, z) {
  for (const [dx, dz] of dirs) if (!has(x + dx, z + dz)) return [dx, dz];
  return null;
}

// Pane orientation: panes on a face running along x connect east/west, otherwise north/south.
function paneProps(out) {
  return out[1] !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const GLASS = "light_blue_stained_glass_pane";
const MULLION = "smooth_quartz";
const WALL = "white_concrete";
const DECK = "light_gray_concrete";

function inMech(x, z) {
  return x >= 14 && x <= 24 && z >= 3 && z <= 6;
}

for (const [x, z, gc] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) v.set(x, y, z, "stone_bricks");

  const out = outward(x, z);
  const isFront = out && out[1] === -1;
  // Index along the face: x for street/rear faces, z for end faces.
  const idx = out && out[0] !== 0 ? z : x;
  const windowIdx = idx % 4 === 1 || idx % 4 === 2;

  for (let y = gc; y <= ROOF + 2; y++) {
    // Roof level and parapet.
    if (y === ROOF) {
      v.set(x, y, z, out ? MULLION : DECK);
      continue;
    }
    if (y === ROOF + 1) {
      if (out) v.set(x, y, z, WALL);
      else if (inMech(x, z)) v.set(x, y, z, DECK);
      continue;
    }
    if (y === ROOF + 2) {
      if (out) v.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      else if (inMech(x, z)) v.set(x, y, z, DECK);
      continue;
    }

    // Storey floor lines.
    if (SLABS.includes(y)) {
      v.set(x, y, z, out ? MULLION : DECK);
      continue;
    }

    if (y <= GROUND_TOP) {
      // Ground storey (shopfronts on the street face).
      if (!out) continue;
      if (isFront) {
        if (idx === 21 && y === gc) {
          v.set(x, y, z, "oak_door", {
            facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (idx === 21 && y === gc + 1) {
          v.set(x, y, z, "oak_door", {
            facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else if (idx % 4 === 0) {
          v.set(x, y, z, MULLION);
        } else {
          v.set(x, y, z, GLASS, paneProps(out));
        }
      } else {
        if (windowIdx) v.set(x, y, z, GLASS, paneProps(out));
        else v.set(x, y, z, WALL);
      }
      continue;
    }

    if (y >= 6 && y <= 9) {
      // Upper storeys: window grid with mullions.
      if (!out) continue;
      if (windowIdx) {
        v.set(x, y, z, GLASS, paneProps(out));
        // Warm light behind some glass, in the interior cell one step inward.
        if (y === 7 && idx % 8 === 2) {
          const ix = x - out[0], iz = z - out[1];
          if (has(ix, iz)) v.set(ix, y, iz, "glowstone");
        }
      } else {
        v.set(x, y, z, idx % 4 === 0 ? MULLION : WALL);
      }
    }
  }

  // Ground-storey interior light for the street face, near the door.
  if (isFront && idx === 17 && gc <= 2) {
    const iz = z - out[1];
    if (has(x, iz)) v.set(x, gc + 1, iz, "glowstone");
  }
}

v.save(`${DIR}/${ID}.nbt`);
