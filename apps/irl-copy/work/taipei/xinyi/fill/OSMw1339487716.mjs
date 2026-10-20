import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339487716";
const W = 147, H = 24, D = 36;

// Low-rise commercial block, c. 1990s Taipei: two storeys over a shopfront
// base, white tiled walls, quartz piers and bands, tinted glazing, parapet.
// Storey plan (relative to each cell's ground g):
//   g        base course / floor slab
//   g+1..g+4 ground storey: shopfront, entrances, fascia at g+4
//   g+5      floor slab / cornice band
//   g+6..g+9 upper storey: windows with spandrels at g+6 and g+9
//   g+10     roof deck / cornice
//   g+11     parapet
//   g+12     coping (top of building: 12 blocks above lowest ground)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(key(x, z), gr);
const has = (x, z) => groundAt.has(key(x, z));

// direction: [dx, dz, facing name]
const DIRS = {
  N: [0, -1, "north"],
  S: [0, 1, "south"],
  W: [-1, 0, "west"],
  E: [1, 0, "east"],
};
const OPP = { N: "S", S: "N", W: "E", E: "W" };

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const [x, z, rawGround] of cells) {
  // keep the roof (ground + 12) inside the volume
  const gr = Math.max(0, Math.min(rawGround, H - 13));

  const outs = Object.keys(DIRS).filter(
    (d) => !has(x + DIRS[d][0], z + DIRS[d][1]),
  );
  const facade = outs.length > 0;
  const od = facade ? outs[0] : null;
  const idx = facade ? (od === "N" || od === "S" ? x : z) : 0;
  const alongX = facade && (od === "N" || od === "S");
  const facing = facade ? DIRS[od][2] : null;

  // inward neighbour (for placing warm light behind glass)
  const inX = facade ? x - DIRS[od][0] : 0;
  const inZ = facade ? z - DIRS[od][1] : 0;
  const hasInward = facade && has(inX, inZ);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // base course / floor slab at ground level
  put(x, gr, z, facade ? "polished_andesite" : "smooth_stone");

  // ---- ground storey: shopfront (y g+1..g+4) ----
  if (facade) {
    const isPier = idx % 6 === 0;
    const isEntrance = idx % 36 === 16 || idx % 36 === 17;

    for (let y = gr + 1; y <= gr + 4; y++) {
      if (isEntrance && y <= gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing,
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isPier) {
        put(x, y, z, "smooth_quartz");
      } else if (y === gr + 4) {
        put(x, y, z, "smooth_quartz"); // fascia band
      } else {
        // shopfront glass, pane oriented along the facade
        const props = alongX
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, "light_blue_stained_glass_pane", props);
      }
    }
  }

  // ---- floor slab / cornice band at g+5 ----
  put(x, gr + 5, z, facade ? "smooth_quartz" : "light_gray_concrete");

  // ---- upper storey: y g+6..g+9 ----
  if (facade) {
    const isPier = idx % 6 === 0;
    const lit = idx % 12 === 3 || idx % 12 === 9;
    for (let y = gr + 6; y <= gr + 9; y++) {
      if (isPier) {
        put(x, y, z, "smooth_quartz");
      } else if (y === gr + 6 || y === gr + 9) {
        put(x, y, z, "white_concrete"); // spandrels
      } else {
        const props = alongX
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, "gray_stained_glass_pane", props);
        // warm light in the room behind a few lit windows
        if (lit && y === gr + 7 && hasInward) {
          put(inX, y, inZ, "glowstone");
        }
      }
    }
  }

  // ---- roof deck / cornice at g+10 ----
  put(x, gr + 10, z, facade ? "smooth_quartz" : "light_gray_concrete");

  // ---- parapet and coping (facade only) ----
  if (facade) {
    put(x, gr + 11, z, "white_concrete");
    put(x, gr + 12, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else if ((x * 7 + z * 3) % 31 === 0) {
    // roof plant on interior cells
    put(x, gr + 11, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
