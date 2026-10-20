import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833585";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 20;
const FLOOR = 5;   // storey line (floor band) at y=5
const ROOF = 10;   // top course; roof reads at y=11 (about 11 blocks above lowest ground)

// Era read: a 1980s-90s low-rise commercial block in Xinyi. White tiled/concrete
// walls, gray concrete frames, blue tinted glazing, quartz bands and cornice,
// a stone plinth, one central shopfront entrance on the street (south) face.

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(8, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward directions
const dirs = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const missingFaces = (x, z) =>
  Object.keys(dirs).filter(d => !has(x + dirs[d][0], z + dirs[d][1]));

// Pick entrance on the south (street) face, nearest the footprint centre.
let cxSum = 0;
for (const [x] of cells) cxSum += x;
const cx = cxSum / cells.length;
let entrance = null;
for (const [x, z] of cells) {
  if (missingFaces(x, z).includes("S")) {
    if (!entrance || Math.abs(x - cx) < Math.abs(entrance.x - cx)) {
      entrance = { x, z };
    }
  }
}

// Light positions to be placed after the shell (behind glass, in interior air).
const lights = [];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const miss = missingFaces(x, z);

  if (miss.length === 0) {
    // Interior cell: floor slabs and roof deck only, air between (no interiors).
    for (let y = gr; y <= ROOF; y++) {
      if (y === FLOOR) set(x, y, z, "smooth_quartz");
      else if (y === ROOF) set(x, y, z, "light_gray_concrete");
      else if (y === gr) set(x, y, z, "polished_andesite");
    }
    continue;
  }

  const corner = miss.length >= 2;
  const face = miss.includes("S") ? "S" : miss[0];
  const [dx, dz] = dirs[face];
  const along = face === "N" || face === "S" ? x : z;
  const isEntrance = entrance && entrance.x === x && entrance.z === z && face === "S";

  for (let y = gr; y <= ROOF; y++) {
    // Cornice / roof edge
    if (y === ROOF) { set(x, y, z, "smooth_quartz"); continue; }
    // Storey band
    if (y === FLOOR) { set(x, y, z, "smooth_quartz"); continue; }
    // Base course at the ground line
    if (y === gr) { set(x, y, z, "polished_andesite"); continue; }
    // Corner pilasters run full height
    if (corner) { set(x, y, z, "gray_concrete"); continue; }

    const storey1Win = y > gr && y < FLOOR && y <= gr + 2;
    const storey2Win = y > FLOOR && y < ROOF && y >= FLOOR + 2 && y <= ROOF - 2;

    if (storey1Win || storey2Win) {
      if (along % 3 === 0) {
        set(x, y, z, "gray_concrete");
      } else {
        set(x, y, z, "light_blue_stained_glass");
        // Warm glow behind some upper-storey windows
        if (storey2Win && y === FLOOR + 2 && along % 6 === 2) {
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz)) lights.push([ix, y, iz]);
        }
      }
      continue;
    }

    set(x, y, z, "white_concrete");
  }

  // Entrance: door on the street face, lintel above.
  if (isEntrance) {
    const doorFacing = "south";
    set(x, gr + 1, z, "oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    if (gr + 2 < H) set(x, gr + 2, z, "oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // Door sits under a solid lintel course (rows above the door stay wall/quartz)
    if (gr + 3 <= ROOF && gr + 3 < FLOOR) set(x, gr + 3, z, "smooth_quartz");
  }
}

// Roof plant: small mechanical boxes near the centre of the roof deck.
for (const [x, z, gr] of cells) {
  const miss = missingFaces(x, z);
  if (miss.length === 0 && Math.abs(x - W / 2) <= 2 && Math.abs(z - D / 2) <= 3) {
    set(x, ROOF + 1, z, "smooth_stone");
  }
}

// Place warm lights last so they are not overwritten.
for (const [x, y, z] of lights) set(x, y, z, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
