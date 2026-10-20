import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538464249";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);

// Set helper: props optional
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward direction -> facing name
const FACE = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const SIDES = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// Perimeter sides for a cell
const missingSides = (x, z) => SIDES.filter(([dx, dz]) => !has(x + dx, z + dz));

// Entrance: north-facing perimeter cell closest to the centre line
let entrance = null;
{
  let best = Infinity;
  for (const [key] of ground) {
    const [x, z] = key.split(",").map(Number);
    if (missingSides(x, z).some(([dx, dz]) => dx === 0 && dz === -1)) {
      const d = Math.abs(x - 8);
      if (d < best) { best = d; entrance = [x, z]; }
    }
  }
}

const glassProps = (face) => {
  const ns = face === "north" || face === "south";
  return {
    north: ns ? "true" : "false",
    south: ns ? "true" : "false",
    east: ns ? "false" : "true",
    west: ns ? "false" : "true",
    waterlogged: "false",
  };
};

for (const [x, z, b] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const sides = missingSides(x, z);
  const perimeter = sides.length > 0;
  const corner = sides.length >= 2;

  // Floor slabs: storey 1 deck at b+4, roof deck at b+9 (whole footprint)
  put(x, b + 4, z, "smooth_stone");
  put(x, b + 9, z, "smooth_stone");

  if (perimeter) {
    // Base course
    put(x, b, z, "stone_bricks");

    for (const [dx, dz] of sides) {
      const face = FACE[`${dx},${dz}`];
      const idx = (dx === 0) ? x : z; // position along the face
      const pier = corner || idx % 3 === 0;

      // Storey 1 glazing rows b+1, b+2; spandrel b+3
      for (const y of [b + 1, b + 2]) {
        if (pier) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane", glassProps(face));
      }
      put(x, b + 3, z, pier ? "light_gray_concrete" : "white_concrete");

      // Storey 2 glazing rows b+5..b+7; spandrel b+8
      for (const y of [b + 5, b + 6, b + 7]) {
        if (pier) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane", glassProps(face));
      }
      put(x, b + 8, z, pier ? "light_gray_concrete" : "white_concrete");
    }

    // Cornice band and parapet
    put(x, b + 9, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    put(x, b + 10, z, "white_concrete");
  }
}

// Warm lights behind some storey-2 windows (inside the air gap)
for (const [x, z, b] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const sides = missingSides(x, z);
  if (sides.length !== 1) continue; // only plain facade cells
  const [dx, dz] = sides[0];
  const idx = (dx === 0) ? x : z;
  if (idx % 3 === 0 || idx % 4 !== 1) continue;
  const ix = x - dx, iz = z - dz; // inward cell
  if (!has(ix, iz)) continue;
  put(ix, b + 6, iz, "glowstone");
}

// Entrance: door on the north face, lit by a warm light inside
if (entrance) {
  const [ex, ez] = entrance;
  const b = ground.get(`${ex},${ez}`);
  const doorProps = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  put(ex, b + 1, ez, "dark_oak_door", doorProps("lower"));
  put(ex, b + 2, ez, "dark_oak_door", doorProps("upper"));
  // Flank the door with solid piers, glass above the door line
  for (const ox of [-1, 1]) {
    if (has(ex + ox, ez)) {
      put(ex + ox, b + 1, ez, "light_gray_concrete");
      put(ex + ox, b + 2, ez, "light_gray_concrete");
    }
  }
  // Warm light just inside the lobby
  if (has(ex, ez + 1)) put(ex, b + 2, ez + 1, "glowstone");
}

// Roof equipment: small plant boxes on the roof deck, away from the parapet
for (const [x, z, b] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  if (missingSides(x, z).length > 0) continue;
  if (x % 6 === 3 && z % 5 === 2) {
    put(x, b + 10, z, "light_gray_concrete");
    put(x, b + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
