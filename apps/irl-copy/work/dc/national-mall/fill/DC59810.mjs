import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${SRC}/DC59810.cells.json`, "utf8"));

// 1750 New York Ave NW: late-20th-century speculative office block on a
// concrete frame. Precast white piers, light-grey spandrel bands, tinted glass
// panes, granite base and entrance surround, storeys 3 blocks tall with
// storey lines at y%3==0, and a mechanical penthouse on the roof.
const W = 25, H = 27, D = 18;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { x, z, gr: Math.round(gr), rf: Math.round(rf) });
const has = (x, z) => map.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const DOOR_X = 12;
const SURROUND_X = [11, 13];

for (const c of map.values()) {
  const { x, z, gr } = c;
  const minTop = Math.ceil((gr + 3) / 3) * 3;
  const top = Math.min(21, Math.max(minTop, Math.round(c.rf / 3) * 3));

  const nF = !has(x, z - 1);
  const sF = !has(x, z + 1);
  const wF = !has(x - 1, z);
  const eF = !has(x + 1, z);
  const perim = nF || sF || wF || eF;
  const corner = (nF || sF) && (wF || eF);
  const onNS = nF || sF;

  // Foundation under the lowest-ground datum, so nothing floats on slopes.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Piers every 3 cells along each run, plus corners.
  const along = onNS ? x : z;
  const pier = corner || along % 3 === 0;

  // Pane connection: a pane on a N/S run connects east-west, and vice versa.
  const paneProps = {
    north: onNS ? "false" : "true",
    south: onNS ? "false" : "true",
    east: onNS ? "true" : "false",
    west: onNS ? "true" : "false",
    waterlogged: "false",
  };
  if (corner) {
    paneProps.north = "true"; paneProps.south = "true";
    paneProps.east = "true"; paneProps.west = "true";
  }

  for (let y = gr; y < top; y++) {
    if (y === gr) {
      put(x, y, z, perim ? "polished_granite" : "light_gray_concrete");
      continue;
    }

    if (!perim) {
      // Interior: floor slabs per storey, air elsewhere.
      // Warm lights only in the cell directly behind a window, well below the roof.
      if (y % 3 === 0) {
        put(x, y, z, "light_gray_concrete");
      } else if (y % 3 === 1 && y <= top - 2) {
        const behindWindow =
          (has(x, z - 1) && !has(x, z - 2) && z - 1 === 0) ||
          (has(x, z + 1) && !has(x, z + 2) && z + 1 === D - 1) ||
          (has(x - 1, z) && !has(x - 2, z) && x - 1 === 0) ||
          (has(x + 1, z) && !has(x + 2, z) && x + 1 === W - 1);
        if (behindWindow && (x * 5 + z * 3 + y) % 9 === 0) {
          put(x, y, z, "glowstone");
        }
      }
      continue;
    }

    // Entrance on the north (front) face: granite surround, door at centre.
    if (nF && top >= gr + 3 && (y === gr + 1 || y === gr + 2)) {
      if (x === DOOR_X) {
        if (y === gr + 1) {
          const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
          put(x, y, z, "dark_oak_door", { ...dp, half: "lower" });
          put(x, y + 1, z, "dark_oak_door", { ...dp, half: "upper" });
        }
        continue;
      }
      if (SURROUND_X.includes(x)) {
        put(x, y, z, "polished_granite");
        continue;
      }
    }

    if (y % 3 === 0) {
      // Storey line: grey spandrel band.
      put(x, y, z, "light_gray_concrete");
    } else if (pier) {
      put(x, y, z, y < 3 ? "polished_granite" : "white_concrete");
    } else {
      // Window: tinted glass pane with air behind it.
      put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    }
  }

  // Roof deck and cornice.
  put(x, top, z, "light_gray_concrete");
  if (perim) put(x, top + 1, z, "white_concrete");

  // Mechanical penthouse, centred on the roof.
  if (!perim && x >= 8 && x <= 16 && z >= 6 && z <= 11) {
    const ring = x === 8 || x === 16 || z === 6 || z === 11;
    if (ring) {
      put(x, top + 1, z, "light_gray_concrete");
      put(x, top + 2, z, "light_gray_concrete");
    }
    put(x, top + 3, z, "light_gray_concrete");
  }
}

g.save(`${SRC}/DC59810.nbt`);
