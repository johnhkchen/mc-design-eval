import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883606";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 7 x 23 x 16 canvas: x 0..6, z 0..15. Roof surface at y 11 (about 11 blocks above lowest ground).
const W = 7, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Two storeys of 5 blocks: storey 1 at y 0..4, storey 2 at y 5..9, roof deck y 10, parapet y 11.
// Era read: 1970s-80s Taipei concrete mid-rise shophouse, white concrete frame, tiled bands,
// ground-floor shopfront with glass and a red awning over the entrance, flat roof with parapet.

const minG = Math.min(...cells.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - minG);

const has = (x, z) => ground.has(`${x},${z}`);
const gzAt = (x, z) => ground.get(`${x},${z}`);
const isShell = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const isInterior = (x, z) => has(x, z) && !isShell(x, z);

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glassZ = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

const doorProps = (facing, half) => ({
  facing, half, hinge: "left", open: "false", powered: "false",
});

// Decide the block for one shell cell at height y.
function shellBlock(x, y, z, gz) {
  const exX = !has(x - 1, z) || !has(x + 1, z);
  const exZ = !has(x, z - 1) || !has(x, z + 1);
  const xFace = exX && !exZ;
  const zFace = exZ && !exX;
  const corner = exX && exZ;
  const east = !has(x + 1, z);

  if (y === gz) return ["stone_bricks"];                 // base course at ground line
  if (y === 4) {
    if (xFace && z >= 6 && z <= 8) return ["red_terracotta"]; // entrance awning band
    return ["white_concrete"];
  }
  if (y === 5) return ["light_gray_concrete"];           // storey line
  if (y === 9) return ["white_concrete"];
  if (y === 10) return ["smooth_quartz"];                // cornice
  if (y === 11) return ["white_concrete"];               // parapet

  const storey1 = y >= 1 && y <= 3;
  const storey2 = y >= 6 && y <= 8;
  if (!storey1 && !storey2) return ["white_concrete"];

  if (corner) return ["white_concrete"];

  if (xFace) {
    if (storey1) {
      if (z === 7) {
        // Entrance door, transom above it
        const facing = east ? "east" : "west";
        if (y === 1) return ["oak_door", doorProps(facing, "lower")];
        if (y === 2) return ["oak_door", doorProps(facing, "upper")];
        return ["white_concrete"];
      }
      if (z >= 2 && z <= 13) return ["glass_pane", glassX];
      return ["white_concrete"];
    }
    // Storey 2: window bays with piers every third bay
    if (z % 3 !== 0) return ["glass_pane", glassX];
    return ["white_concrete"];
  }

  if (zFace) {
    if (x % 2 === 1) return ["glass_pane", glassZ];
    return ["white_concrete"];
  }

  return ["white_concrete"];
}

// Main massing: foundation fill, shell, interior floor slabs.
for (const [x, z, gr] of cells) {
  const gz = gr - minG;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gz; y++) put(x, y, z, "stone_bricks");

  if (isShell(x, z)) {
    for (let y = gz; y <= 11; y++) {
      const [id, p] = shellBlock(x, y, z, gz);
      put(x, y, z, id, p);
    }
  } else {
    // Interior: only floor slabs (air gap behind glass, no rooms)
    for (const y of [gz, 5, 10]) {
      if (y >= gz && y <= 10) put(x, y, z, "smooth_stone");
    }
  }
}

// Rooftop plant: water tank and stair housing on the roof deck
for (let x = 2; x <= 3; x++) {
  for (let z = 3; z <= 4; z++) {
    if (isInterior(x, z)) {
      put(x, 11, z, "iron_block");
      put(x, 12, z, "iron_block");
    }
  }
}
for (let x = 1; x <= 2; x++) {
  for (let z = 11; z <= 13; z++) {
    if (isInterior(x, z)) {
      for (let y = 11; y <= 13; y++) put(x, y, z, "light_gray_concrete");
    }
  }
}

// Warm lights behind glass in some bays (interior cells next to the facade)
for (let z = 2; z <= 13; z++) {
  for (const x of [1, 5]) {
    if (!isInterior(x, z)) continue;
    if (z === 4 || z === 10) put(x, 6, z, "glowstone");
    if (z === 10 && gzAt(x, z) === 0) put(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
