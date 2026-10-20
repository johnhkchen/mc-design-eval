// Taipei, Xinyi district: OSMw1071343644. No tags on record, so this is a generic
// two-storey, flat-roofed commercial block of the 1990s to 2000s. It has a
// white-concrete facade with light-grey storey bands, a parapet with rooftop
// A/C units, a ground-floor shopfront with a recessed dark-oak entrance, and
// window bays with warm shroomlights set inside behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343644";
const W = 42, H = 23, D = 112;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, h] of cells) {
  ground.set(key(x, z), h);
  if (h < minG) minG = h;
}
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

// Roof surface sits about 11 blocks above the lowest ground: slab at R, parapet at R+1.
const R = Math.min(minG + 10, H - 2);
const SL = minG + 5; // second-floor slab level (storey height 5)

// Outward-facing sides of a footprint cell.
const outward = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

// Entrance on the north (low-z) street face, centred on x 20.
const ENTRY_X = 20;
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const inBox = (x, z) =>
  (x >= 6 && x <= 12 && z >= 20 && z <= 26) || (x >= 28 && x <= 35 && z >= 80 && z <= 88);

const lamps = [];

for (const [x, z, h] of cells) {
  const faces = outward(x, z);
  const perim = faces.length > 0;
  const edge = perim && faces.length === 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < h; y++) put(x, y, z, "stone_bricks");

  // Ground slab / base course.
  put(x, h, z, perim ? "light_gray_concrete" : "smooth_stone");

  if (h > R) continue;

  // Second-floor slab.
  if (SL > h && SL <= R) put(x, SL, z, perim ? "light_gray_concrete" : "smooth_stone");

  // Roof slab and parapet.
  put(x, R, z, "light_gray_concrete");
  if (perim) put(x, R + 1, z, "white_concrete");

  // Rooftop A/C plant on interior cells.
  if (!perim && inBox(x, z)) put(x, R + 1, z, "iron_block");

  // Walls, windows and bands on the perimeter.
  if (perim) {
    const idx = faces[0] === "N" || faces[0] === "S" ? x : z;
    const pattern = idx % 4 === 1 || idx % 4 === 2;
    const entry = edge && faces[0] === "N" && x === ENTRY_X;
    const isN = faces[0] === "N";
    const isS = faces[0] === "S";
    const isW = faces[0] === "W";
    const pane = isN || isS ? PANE_NS : PANE_EW;

    for (let y = h + 1; y <= R - 1; y++) {
      const upper = y >= SL;
      const f = upper ? SL : h;
      const c = upper ? R : SL;

      if (y === SL || y === c - 1) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }

      const winRow = upper ? (y >= f + 2 && y <= c - 2) : (y <= c - 2);

      if (entry && !upper) {
        if (y === h + 1 || y === h + 2) {
          const half = y === h + 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: "north", half, hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (y === h + 3 && (x === 18 || x === 23)) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          continue;
        }
        if (y === h + 3) {
          put(x, y, z, "glass_pane", PANE_EW);
          continue;
        }
      }

      if (edge && winRow && pattern) {
        put(x, y, z, "glass_pane", pane);
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Corners stay solid so the bays do not break at the turns.
    if (!edge) {
      for (let y = h + 1; y <= R - 1; y++) {
        if (y !== SL) put(x, y, z, "white_concrete");
      }
    }

    // Record warm lights behind glass bays, placed on the interior side.
    if (edge && pattern) {
      for (let y = h + 2; y <= R - 2; y++) {
        const upperStorey = y >= SL;
        const f = upperStorey ? SL : h;
        const c = upperStorey ? R : SL;
        if (y < f + 2 || y > c - 2) continue;
        if (y === SL || y === R) continue;
        if ((x + y) % 3 !== 0) continue;
        let ix = x, iz = z;
        if (isN) iz = z + 1;
        else if (isS) iz = z - 1;
        else if (isW) ix = x + 1;
        else ix = x - 1;
        if (has(ix, iz) && outward(ix, iz).length === 0) lamps.push([ix, y, iz]);
      }
    }
  }
}

// Shroomlights on the interior side of glass bays.
for (const [x, y, z] of lamps) put(x, y, z, "shroomlight");

g.save(`${DIR}/${ID}.nbt`);
