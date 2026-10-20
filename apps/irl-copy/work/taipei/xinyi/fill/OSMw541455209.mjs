import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455209";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 24 x 10. Roughly two storeys of about 5 blocks, parapet at +11 from lowest ground.
// Reads as a 1990s Xinyi commercial block: white concrete frame, glass curtain bays,
// red shop signage band at street level, flat roof with plant boxes.
const W = 24, D = 10, H = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gy]) => [key(x, z), gy]));
const inFp = (x, z) => ground.has(key(x, z));
const base = Math.min(...cells.map((c) => c[2]));
const top = base + 11; // exclusive top: parapet course is top - 1

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const OPP = { north: "south", south: "north", east: "west", west: "east" };
const DX = { north: 0, south: 0, east: 1, west: -1 };
const DZ = { north: -1, south: 1, east: 0, west: 0 };

// Facade block for an exterior cell at height rel (y - base).
function facadeBlock(x, z, r, ext) {
  const street = ext.includes("north");
  const along = ext.includes("north") || ext.includes("south") ? x : z;
  const isEnd = along === 0 || along === W - 1;
  const pier = isEnd || along % 6 === 0;

  if (r === 0) return ["smooth_stone", null];

  if (r >= 1 && r <= 4 && street) {
    if (r === 4) return ["red_concrete", null];
    if (pier) return ["white_concrete", null];
    if (x === 12 && ext.includes("north")) {
      if (r === 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (r === 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      return ["glass_pane", null];
    }
    return ["glass_pane", null];
  }

  if (r === 5) return ["smooth_stone", null]; // storey line
  if (r >= 6 && r <= 8) {
    if (along % 3 === 0) return ["white_concrete", null];
    return ["glass_pane", null];
  }
  if (r === 9) return ["white_concrete", null]; // lintel / cornice
  if (r === 10) return ["white_concrete", null]; // parapet
  if (r >= 1 && r <= 4) {
    // rear or side ground storey: plain concrete with a few openings
    if (along % 6 === 3) return ["glass_pane", null];
    return ["white_concrete", null];
  }
  return ["white_concrete", null];
}

for (const [x, z, gy] of cells) {
  const ext = [];
  if (!inFp(x, z - 1)) ext.push("north");
  if (!inFp(x, z + 1)) ext.push("south");
  if (!inFp(x - 1, z)) ext.push("west");
  if (!inFp(x + 1, z)) ext.push("east");
  const perim = ext.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  for (let y = gy; y < top; y++) {
    const r = y - base;
    if (perim) {
      const [b, p] = facadeBlock(x, z, r, ext);
      put(x, y, z, b, p);
    } else {
      // Interior: floor slabs per storey, air otherwise (no interiors).
      if (y === gy || y === base + 5 || y === base + 10) {
        put(x, y, z, "smooth_stone");
      }
    }
  }

  // Roof plant on interior roof deck, two blocks tall.
  if (!perim && (x % 7 === 3) && (z === 4 || z === 5) && top + 1 < H) {
    put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "light_gray_concrete");
  }
}

// Warm lights behind some glass: place glowstone in the interior cell inward of the window.
for (const [x, z, gy] of cells) {
  const ext = [];
  if (!inFp(x, z - 1)) ext.push("north");
  if (!inFp(x, z + 1)) ext.push("south");
  if (!inFp(x - 1, z)) ext.push("west");
  if (!inFp(x + 1, z)) ext.push("east");
  if (ext.length === 0) continue;

  const along = ext.includes("north") || ext.includes("south") ? x : z;
  const face = ext.includes("north") ? "north" : ext[0];
  const ix = x - DX[face];
  const iz = z - DZ[face];
  if (!inFp(ix, iz)) continue;

  const lightUpper = along % 9 === 4;
  const lightGround = ext.includes("north") && along % 6 === 3;

  if (lightUpper) {
    const y = base + 7;
    if (y > gy) put(ix, y, iz, "glowstone");
  }
  if (lightGround) {
    const y = base + 2;
    if (y > gy) put(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
