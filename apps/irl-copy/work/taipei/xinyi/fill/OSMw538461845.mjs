import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi shophouse / commercial block, c. 1990s:
// white tiled walls, stone-brick foundation and base course, light grey
// storey bands and parapet, shopfront with red fascia on the street face,
// upper-floor punched windows with warm light behind some panes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461845";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ROOF_Y = 11;      // roof deck, parapet sits on it
const WALL_TOP = 10;    // top of wall body / cornice course
const BAND_Y = 5;       // storey line between floors
const SIGN_Y = 4;       // shopfront fascia row

const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const ROOF = "light_gray_concrete";
const FASCIA = "red_terracotta";
const GLASS = "glass_pane";

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [
  { n: "W", dx: -1, dz: 0, facing: "west" },
  { n: "E", dx: 1, dz: 0, facing: "east" },
  { n: "N", dx: 0, dz: -1, facing: "north" },
  { n: "S", dx: 0, dz: 1, facing: "south" },
];

// ---- Pass 1: massing, foundation, storey lines, roof -----------------------
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, FOUND);

  const exposed = DIRS.filter((d) => !has(x + d.dx, z + d.dz));

  // solid body up to the cornice (no interiors; floor slabs are the solid lines)
  for (let y = gr + 1; y <= WALL_TOP; y++) g.set(x, y, z, WALL);

  // storey line and cornice band
  if (BAND_Y > gr) g.set(x, BAND_Y, z, BAND);
  if (WALL_TOP > gr) g.set(x, WALL_TOP, z, BAND);

  // roof deck over every footprint cell
  g.set(x, ROOF_Y, z, ROOF);

  if (exposed.length > 0) {
    // base course on exposed faces
    if (gr + 1 <= WALL_TOP) g.set(x, gr + 1, z, BASE);
    // parapet on the perimeter
    g.set(x, ROOF_Y + 1, z, WALL);
    g.set(x, ROOF_Y + 2, z, WALL);
  }
}

// ---- Roof plant: a small mechanical box on the interior roof ----------------
for (let x = 2; x <= 3; x++) {
  for (let z = 16; z <= 17; z++) {
    if (!has(x, z)) continue;
    g.set(x, ROOF_Y + 1, z, "gray_concrete");
    g.set(x, ROOF_Y + 2, z, "gray_concrete");
  }
}

// ---- Pass 2: façade articulation (windows, shopfront, door, air gaps) -------
for (const [x, z, gr] of cells) {
  const exposed = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  // corners (two exposed faces) stay solid so the glazing reads cleanly
  if (exposed.length !== 1) continue;
  const d = exposed[0];
  const t = d.dx !== 0 ? z : x;          // position along the facade
  const inX = x - d.dx, inZ = z - d.dz;  // cell just behind the façade
  const hasInside = has(inX, inZ);

  const airAt = (y) => {
    if (hasInside) g.set(inX, y, inZ, "air");
  };

  if (d.n === "W") {
    // Street-facing shopfront: ground floor glazing, door at the middle
    const gy0 = gr + 2;
    if (gy0 <= SIGN_Y - 1) {
      g.set(x, SIGN_Y, z, FASCIA);
      if (t === 11) {
        // entrance door, two blocks tall
        g.set(x, gy0, z, "dark_oak_door", {
          facing: d.facing, half: "lower", hinge: "left", open: "false", powered: "false",
        });
        if (gy0 + 1 <= SIGN_Y - 1) {
          g.set(x, gy0 + 1, z, "dark_oak_door", {
            facing: d.facing, half: "upper", hinge: "left", open: "false", powered: "false",
          });
        }
        g.set(x, SIGN_Y, z, FASCIA);
      } else if (t % 6 === 0) {
        for (let y = gy0; y <= SIGN_Y - 1; y++) g.set(x, y, z, BAND); // pier
      } else {
        for (let y = gy0; y <= SIGN_Y - 1; y++) {
          g.set(x, y, z, GLASS);
          airAt(y);
        }
      }
    }
  } else {
    // Other faces: ground floor punched windows
    const gy0 = gr + 2;
    for (let y = gy0; y <= SIGN_Y - 1; y++) {
      if (t % 3 === 1) {
        g.set(x, y, z, GLASS);
        airAt(y);
      }
    }
  }

  // Upper floor: windows y 6..8 in every third column, lintel at 9
  for (let y = BAND_Y + 1; y <= BAND_Y + 3; y++) {
    if (t % 3 === 1) {
      g.set(x, y, z, GLASS);
      airAt(y);
    }
  }
  // warm light behind a subset of upper windows
  if (t % 6 === 4 && hasInside) {
    g.set(inX, BAND_Y + 2, inZ, "glowstone");
  }
  // warm light behind a subset of shopfront panes
  if (d.n === "W" && t % 6 === 2 && hasInside && gr + 2 <= SIGN_Y - 1) {
    g.set(inX, gr + 2, inZ, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
