import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1088490";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 32, D = 19;
const g = new Voxels([W, H, D]);

// Footprint map: key "x,z" -> { ground, top }
const cm = new Map();
for (const [x, z, ground, roof] of cells) {
  const top = Math.min(H - 3, Math.max(roof, ground + 6));
  cm.set(`${x},${z}`, { ground, top });
}
const at = (x, z) => cm.get(`${x},${z}`);

// Exposed faces of a footprint cell (N = toward low z)
const faces = (x, z) => {
  const f = [];
  if (!at(x, z - 1)) f.push("N");
  if (!at(x, z + 1)) f.push("S");
  if (!at(x - 1, z)) f.push("W");
  if (!at(x + 1, z)) f.push("E");
  return f;
};

// Main entrance: north-facing cell nearest the middle of the north face
let doorKey = null;
let doorX = 8, doorZ = null;
{
  let best = Infinity;
  for (const [key] of cm) {
    const [x, z] = key.split(",").map(Number);
    if (!faces(x, z).includes("N")) continue;
    const d = Math.abs(x - 8);
    if (d < best) { best = d; doorKey = key; doorZ = z; }
  }
}
const [doorXr, doorZr] = doorKey ? doorKey.split(",").map(Number) : [8, 0];
doorX = doorXr; doorZ = doorZr;

const setb = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Cells in the entrance bay (door cell and its neighbours along the north face)
const inEntranceBay = (x, z) =>
  Math.abs(x - doorX) <= 1 && z === doorZ && faces(x, z).includes("N");

for (const [key, { ground, top }] of cm) {
  const [x, z] = key.split(",").map(Number);

  // Foundation
  for (let y = 0; y < ground; y++) setb(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const ring = f.length > 0;

  if (!ring) {
    // Interior: floor slabs and roof deck; air behind the glass
    for (let y = ground; y < top; y++) {
      const rel = y - ground;
      if (rel % 2 === 0 || y === top - 1) {
        setb(x, y, z, y === top - 1 ? "stone_bricks" : "smooth_stone");
      }
    }
    // A few plant boxes on the roof deck, spaced out
    if ((x * 5 + z * 3) % 29 === 0 && top + 1 < H) {
      setb(x, top, z, "light_gray_concrete");
      setb(x, top + 1, z, "light_gray_concrete");
    }
    continue;
  }

  const f0 = f[0];
  const u = (f0 === "N" || f0 === "S") ? x : z;
  const isDoorBay = inEntranceBay(x, z);
  const isDoor = key === doorKey;

  for (let y = ground; y < top; y++) {
    const rel = y - ground;
    let id;

    if (rel === 0) {
      id = "polished_granite";                  // base course
    } else if (y >= top - 2) {
      id = "stone_bricks";                      // cornice and parapet
    } else if (rel <= 2) {
      // Shopfront
      if (isDoor && f.includes("N")) {
        if (rel === 1) {
          setb(x, y, z, "dark_oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (rel === 2) {
          setb(x, y, z, "dark_oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
      }
      if (isDoorBay) {
        // Stone surround either side of the door
        id = "stone_bricks";
      } else {
        id = (u % 3 === 0) ? "stone_bricks" : "light_blue_stained_glass";
      }
    } else if (rel === 3) {
      // Canopy over the entrance bay, plain lighter band elsewhere
      id = isDoorBay ? "dark_oak_slab" : "smooth_stone";
      if (isDoorBay) {
        setb(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
        continue;
      }
    } else if (rel % 2 === 0) {
      id = "smooth_stone";                      // storey line
    } else {
      // Upper windows: regular glass bays between brick piers, sparse warm lights
      if (u % 3 === 0) {
        id = "bricks";
      } else if (((x * 31 + z * 17 + y * 13) % 23) === 0) {
        id = "glowstone";
      } else {
        id = "light_blue_stained_glass";
      }
    }
    setb(x, y, z, id);
  }
}

g.save(`${DIR}/${ID}.nbt`);
