import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw839833597";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Record: no building data. Read as a 1970s-80s Xinyi-era reinforced-concrete
// low-rise (two storeys over a shopfront ground floor), white-tiled concrete
// facade, storey bands, flat roof with a rooftop water tank and stair housing.
// Roof at y=11 (parapet top 11), storey lines at y=5 and y=10.
const W = 12, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const missing = (x, z) => [!inFp(x, z - 1), !inFp(x, z + 1), !inFp(x - 1, z), !inFp(x + 1, z)].filter(Boolean).length;

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const glassNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim(x, z)) {
    // Interior: floor slab at ground, storey floor at 5, roof slab at 10. Air between.
    put(x, gr, z, "smooth_stone");
    put(x, 5, z, "smooth_stone");
    put(x, 10, z, "light_gray_concrete");
    continue;
  }

  const nm = missing(x, z);
  const corner = nm >= 2;
  let face;
  if (!inFp(x, z - 1)) face = "N";
  else if (!inFp(x, z + 1)) face = "S";
  else if (!inFp(x - 1, z)) face = "W";
  else face = "E";

  const along = (face === "N" || face === "S") ? x : z;
  const winOK = !corner && along % 3 === 1;
  const gp = (face === "N" || face === "S") ? glassNS : glassEW;

  // Inward neighbour (interior cell behind the glass)
  const inward = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[face];

  for (let y = gr; y <= 11; y++) {
    if (y === 11) { put(x, y, z, "white_concrete"); continue; }          // parapet
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }             // base course
    if (y === 5 || y === 10) { put(x, y, z, "light_gray_concrete"); continue; } // storey lines / cornice
    if (y < 5) {
      // Ground floor shopfront glazing with white pillars between bays
      put(x, y, z, winOK ? "glass_pane" : "white_concrete", winOK ? gp : undefined);
    } else if (y >= 6 && y <= 8) {
      // Upper storey windows
      put(x, y, z, winOK ? "glass_pane" : "white_concrete", winOK ? gp : undefined);
    } else {
      put(x, y, z, "white_concrete"); // spandrel at 9
    }
  }

  // Entrance on the north (street) face
  if (face === "N" && x === 6 && gr + 2 <= 4) {
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "stone_bricks"); // lintel over the door
  }

  // Warm lights behind some glass, in the interior cell just inside the window
  if (winOK && inFp(inward[0], inward[1])) {
    const [ix, iz] = inward;
    if ((x + z) % 4 === 1) put(ix, 7, iz, "shroomlight");
    if (along % 6 === 1 && gr + 1 <= 4) put(ix, gr + 1, iz, "lantern", { hanging: "false" });
  }
}

// Rooftop: water tank (3x3 concrete drum with cap) and stair housing, on interior roof cells
for (let x = 3; x <= 5; x++) {
  for (let z = 4; z <= 6; z++) {
    if (!inFp(x, z) || perim(x, z)) continue;
    for (let y = 11; y <= 13; y++) put(x, y, z, "white_concrete");
    put(x, 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (let x = 8; x <= 9; x++) {
  for (let z = 12; z <= 14; z++) {
    if (!inFp(x, z) || perim(x, z)) continue;
    for (let y = 11; y <= 13; y++) put(x, y, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
