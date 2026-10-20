// Shin Kong Mitsukoshi A8 (Xinyi, Taipei). Mid-rise mall: two 5-block storeys on a stone
// base, pale stone frame over glass with alternating tints, a stone parapet and cornice,
// a marked entrance with pylons and a sea lantern, and rooftop plant boxes with lanterns.
// Roof sits 11 blocks above the lowest ground (top block at B + 10).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw274647896";
const W = 69, H = 23, D = 193;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// outward direction per facing: [dx, dz]
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const edgeFaces = (x, z) => {
  const f = [];
  for (const [name, [dx, dz]] of Object.entries(OUT)) {
    if (!has(x + dx, z + dz)) f.push(name);
  }
  return f;
};

// Pass 1: foundation, floor slabs, roof deck for every footprint cell.
for (const [x, z, B] of cells) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");        // foundation to ground
  put(x, B, z, "polished_andesite");                                 // base slab
  put(x, B + 5, z, "light_gray_concrete");                           // storey-2 floor slab
  put(x, B + 10, z, "light_gray_concrete");                          // roof deck (pale, reads from air)
}

// Choose the main facade (most single-face edge cells) and its entrance centre.
const faceCount = { north: [], south: [], west: [], east: [] };
for (const [x, z] of cells) {
  const f = edgeFaces(x, z);
  if (f.length === 1) {
    const face = f[0];
    const along = face === "north" || face === "south" ? x : z;
    faceCount[face].push(along);
  }
}
let mainFace = "south", best = -1;
for (const [face, arr] of Object.entries(faceCount)) {
  if (arr.length > best) { best = arr.length; mainFace = face; }
}
const mainAlong = faceCount[mainFace].slice().sort((a, b) => a - b);
const cEnt = mainAlong.length ? mainAlong[Math.floor(mainAlong.length / 2)] : 0;

// Pass 2: facade on every edge cell.
for (const [x, z, B] of cells) {
  const faces = edgeFaces(x, z);
  if (faces.length === 0) continue;

  const corner = faces.length >= 2;
  const face = faces[0];
  const [dx, dz] = OUT[face];
  const along = face === "north" || face === "south" ? x : z;
  const inEnt = !corner && face === mainFace && Math.abs(along - cEnt) <= 2;
  const pylon = !corner && face === mainFace && Math.abs(along - cEnt) === 3;

  for (let y = B + 1; y <= B + 9; y++) {
    if (corner) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (y <= B + 4) {
      // Ground storey: shopfront with base course, pylons, or entrance opening.
      if (inEnt) {
        if (y <= B + 2 && along === cEnt) {
          put(x, y, z, "dark_oak_door", {
            facing: face,
            half: y === B + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (y <= B + 3) {
          // open entrance: leave air
        } else if (y === B + 4 && along === cEnt) {
          put(x, y, z, "sea_lantern");                                // entrance beacon
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
      } else if (pylon) {
        put(x, y, z, "white_concrete");                               // entrance pylons
      } else if (y === B + 1) {
        put(x, y, z, "polished_andesite");
      } else {
        put(x, y, z, along % 4 === 0 ? "white_concrete" : "light_blue_stained_glass");
      }
    } else if (y === B + 5) {
      put(x, y, z, "smooth_stone");                                   // storey line
    } else if (y === B + 9) {
      put(x, y, z, "smooth_stone");                                   // upper cornice band
    } else {
      // Upper storey: frame every third bay, alternate glass tint by bay for rhythm.
      if (along % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, (along % 6 < 3) ? "light_blue_stained_glass" : "cyan_stained_glass");
    }
  }

  // Parapet cap, stepped up one block at pylon bays for a visible rhythm.
  put(x, B + 10, z, "smooth_stone");
  if (!corner && along % 6 === 0) put(x, B + 10, z, "white_concrete");

  // Warm lights just inside the glass, in a few bays.
  if (!corner) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz)) {
      const iB = groundAt(ix, iz);
      if (along % 6 === 3) put(ix, iB + 7, iz, "glowstone");
      if (!inEnt && along % 8 === 1) put(ix, B + 2, iz, "glowstone");
    }
  }
}

// Pass 3: rooftop plant boxes with lanterns, on interior roof only.
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 8; j++) {
    const x0 = 10 + 14 * i, z0 = 14 + 22 * j;
    const block = [];
    for (let x = x0; x < x0 + 5; x++) {
      for (let z = z0; z < z0 + 5; z++) {
        if (!has(x, z) || edgeFaces(x, z).length) { block.length = 0; break; }
        block.push([x, z, groundAt(x, z)]);
      }
      if (block.length === 0) break;
    }
    if (block.length !== 25) continue;
    for (const [x, z, B] of block) {
      put(x, B + 11, z, "stone_bricks");
      put(x, B + 12, z, "stone_bricks");
    }
    const [cx, cz, cB] = block[12];
    put(cx, cB + 13, cz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
