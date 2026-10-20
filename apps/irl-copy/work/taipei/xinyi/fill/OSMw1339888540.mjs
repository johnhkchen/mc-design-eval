import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339888540";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([6, 19, 6]);

// Roof top sits 7 blocks above the lowest ground: cornice at y=6, parapet slab at y=7.
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.min(gr, 5));
const has = (x, z) => ground.has(key(x, z));

const WIN_PANE = (axisNS) => axisNS
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr0] of cells) {
  const G = Math.min(gr0, 5);

  // Foundation up to this cell's ground, then the storey floor slab at G.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, G, z, "smooth_stone");

  const nOpen = !has(x, z - 1);
  const sOpen = !has(x, z + 1);
  const wOpen = !has(x - 1, z);
  const eOpen = !has(x + 1, z);
  const perim = nOpen || sOpen || wOpen || eOpen;

  if (!perim) {
    // Interior cell: air gap in the storey, roof deck at y=6.
    g.set(x, 6, z, "light_gray_concrete");
    // Warm light just behind the north-face windows.
    if (z === 1 && (x === 2 || x === 3) && G + 2 <= 5) {
      g.set(x, G + 2, z, "glowstone");
    }
    // Small rooftop plant box.
    if (x === 3 && z === 3) g.set(x, 7, z, "iron_block");
    continue;
  }

  const corner = (nOpen || sOpen) && (wOpen || eOpen);

  // Determine which face this perimeter cell belongs to and its index along it.
  let dir, idx;
  if (nOpen) { dir = "n"; idx = x; }
  else if (sOpen) { dir = "s"; idx = x; }
  else if (wOpen) { dir = "w"; idx = z; }
  else { dir = "e"; idx = z; }

  const alongNS = dir === "n" || dir === "s";

  if (corner) {
    // Corner pillar: stone base, concrete shaft.
    for (let y = G + 1; y <= 6; y++) {
      g.set(x, y, z, y === G + 1 ? "stone_bricks" : "white_concrete");
    }
  } else {
    for (let y = G + 1; y <= 5; y++) {
      const r = y - G;
      let id = "white_concrete";
      let props;
      if (r === 1) {
        id = "stone_bricks";                       // base course
      } else if (r === 2 || r === 3) {
        // Ground-floor shopfront / windows on non-corner cells.
        if (idx >= 1 && idx <= 4) {
          id = "glass_pane";
          props = WIN_PANE(alongNS);
        }
      } else if (r === 4) {
        id = "light_gray_concrete";                // spandrel band
      }
      // Entrance on the south face, centre bay.
      if (dir === "s" && idx === 2 && (r === 1 || r === 2)) {
        id = "oak_door";
        props = {
          facing: "south",
          hinge: "left",
          open: "false",
          powered: "false",
          half: r === 1 ? "lower" : "upper",
        };
      }
      g.set(x, y, z, id, props);
    }

    // Canopy over the entrance.
    if (dir === "s" && idx === 2 && G + 3 <= 5) {
      g.set(x, G + 3, z, "red_concrete");
    }
  }

  // Cornice and parapet on the perimeter.
  g.set(x, 6, z, "smooth_stone");
  g.set(x, 7, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
