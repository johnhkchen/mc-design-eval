import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw542017362.cells.json`, "utf8"));

const W = 7, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup
const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, gr);
const has = (x, z) => map.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of map.keys().map(k => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.floor((minX + maxX) / 2);

// Safe setter, props only when given
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane connection states for a facade
const paneProps = (face) =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const ROOF_TOP = 11; // roof deck at 10, parapet at 11

for (const [x, z, gr] of cells) {
  const faces = [];
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");
  if (!has(x + 1, z)) faces.push("east");
  if (!has(x - 1, z)) faces.push("west");
  const perim = faces.length > 0;
  const corner = faces.length >= 2;
  const face = faces[0];
  const alongX = face === "north" || face === "south";
  const t = alongX ? x : z;
  const base = alongX ? minX : minZ;
  const window = perim && !corner && ((t - base) % 2 === 1);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Interior floor at ground, storey slab at 5, roof deck at 10
  if (!perim) {
    put(x, gr, z, "stone_bricks");
    if (gr <= 5) put(x, 5, z, "light_gray_concrete");
    put(x, 10, z, "light_gray_concrete");
  }

  if (perim) {
    // Base course
    put(x, gr, z, "stone_bricks");

    // Door at the middle of the north facade
    const isDoor = face === "north" && faces.includes("north") && x === midX && z === minZ && gr <= 3;

    for (let y = gr + 1; y <= ROOF_TOP; y++) {
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        if (y === gr + 1) {
          put(x, y, z, "dark_oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false"
          });
        } else {
          put(x, y, z, "dark_oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false"
          });
        }
        continue;
      }
      if (y <= 3) {
        // Shopfront glass
        put(x, y, z, window ? "glass_pane" : "white_concrete", window ? paneProps(face) : undefined);
      } else if (y === 4) {
        // Signage band
        put(x, y, z, "red_concrete");
      } else if (y === 5) {
        // Storey line
        put(x, y, z, "light_gray_concrete");
      } else if (y === 6) {
        put(x, y, z, window ? "light_gray_concrete" : "white_concrete");
      } else if (y === 7 || y === 8) {
        if (window) {
          const lit = ((t - base) % 6 === 3) && y === 7;
          if (lit) put(x, y, z, "glowstone");
          else put(x, y, z, "glass_pane", paneProps(face));
        } else {
          put(x, y, z, "white_concrete");
        }
      } else if (y === 9) {
        put(x, y, z, window ? "light_gray_concrete" : "white_concrete");
      } else if (y === 10) {
        // Cornice course
        put(x, y, z, "white_concrete");
      } else if (y === 11) {
        // Parapet
        put(x, y, z, "light_gray_concrete");
      }
    }
  }

  // Roof water tank on interior cells near the middle
  if (!perim && x >= minX + 2 && x <= minX + 3 && z >= minZ + 2 && z <= minZ + 3) {
    put(x, 11, z, "smooth_stone");
    put(x, 12, z, "smooth_stone");
  }
}

g.save(`${DIR}/OSMw542017362.nbt`);
