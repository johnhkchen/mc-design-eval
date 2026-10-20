import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455210.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455210.nbt";

// Footprint 15 x 18, roof surface ~11 blocks above lowest ground.
// Reads as a two-storey mid-rise commercial block, Xinyi c.1990s:
// stone-base, white/quartz facade, cyan glass window grid, shopfront ground floor,
// flat roof with parapet and a small rooftop penthouse.
const W = 15, H = 23, D = 18;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const OUTWARD = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };

const faceList = (x, z) => OUTWARD.filter(([dx, dz]) => !has(x + dx, z + dz));

// Key levels (block indices): ground storey 0..4, floor slab 5,
// upper storey 6..9, roof slab 10, parapet 11.
const FLOOR = 5, ROOF = 10, PARAPET = 11;

// Pass 1: foundation, floor slabs, roof deck, facade.
let doorKey = null;
{
  // choose the front: the north (min z) edge if present, else the first outward face
  const walls = cells.filter(([x, z]) => faceList(x, z).length === 1);
  const front = walls.some(([x, z]) => faceList(x, z)[0][1] === -1) ? [0, -1] : (walls[0] ? faceList(walls[0][0], walls[0][1])[0] : [0, -1]);
  const frontCells = walls
    .filter(([x, z]) => {
      const f = faceList(x, z)[0];
      return f[0] === front[0] && f[1] === front[1];
    })
    .sort((a, b) => (front[1] !== 0 ? a[0] - b[0] : a[1] - b[1]));
  if (frontCells.length) {
    const mid = frontCells[Math.floor(frontCells.length / 2)];
    doorKey = `${mid[0]},${mid[1]}`;
  }
}

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor slab and roof deck
  if (gr <= FLOOR) put(x, FLOOR, z, "light_gray_concrete");
  if (gr <= ROOF) put(x, ROOF, z, "light_gray_concrete");

  const faces = faceList(x, z);
  if (faces.length === 0) continue; // interior cell: stays air above the slabs

  const corner = faces.length >= 2;
  const face = faces[0];
  const alongVal = face[0] !== 0 ? z : x; // coordinate running along the facade
  const pillar = corner || alongVal % 3 === 0;
  const isDoor = `${x},${z}` === doorKey;
  const paneProps = face[0] !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  const inX = x - face[0], inZ = z - face[1]; // interior cell behind this wall cell

  for (let y = gr; y <= PARAPET; y++) {
    if (y === PARAPET) { put(x, y, z, "white_concrete"); continue; }
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }
    if (y === FLOOR || y === ROOF) continue; // already placed

    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: FACING[`${face[0]},${face[1]}`], half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoor && y === gr + 3) { put(x, y, z, "smooth_quartz"); continue; }

    if (y === 4) { put(x, y, z, "smooth_quartz"); continue; }             // transom
    if (y === 6 || y === 9) { put(x, y, z, "white_concrete"); continue; } // sill / lintel bands
    if (y > gr && y <= 3) {                                               // shopfront
      if (pillar) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "cyan_stained_glass_pane", paneProps);
      continue;
    }
    if (y === 7 || y === 8) {                                             // upper windows
      if (pillar) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "cyan_stained_glass_pane", paneProps);
      continue;
    }
  }

  // warm lights behind some glass (interior air cell, not a column)
  if (!corner && !pillar && !isDoor) {
    if (gr + 2 <= 3 && alongVal % 6 === 2 && has(inX, inZ) === true && gr + 2 > gr) {
      put(inX, gr + 2, inZ, "shroomlight");
    }
    if (alongVal % 6 === 4) {
      put(inX, 7, inZ, "glowstone");
    }
  }
}

// Pass 2: rooftop penthouse, standing on the roof deck at y 11.
{
  const x0 = 4, x1 = 10, z0 = 6, z1 = 11;
  let ok = true;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!has(x, z) || gAt(x, z) > ROOF) ok = false;
  if (ok) {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const ring = x === x0 || x === x1 || z === z0 || z === z1;
        for (let y = PARAPET; y <= 13; y++) {
          if (ring) {
            const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
            const along = (x === x0 || x === x1) ? z : x;
            if (y === 12 && !corner && along % 2 === 0) {
              const props = (x === x0 || x === x1)
                ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
              put(x, y, z, "cyan_stained_glass_pane", props);
            } else {
              put(x, y, z, "light_gray_concrete");
            }
          }
        }
        put(x, 14, z, "smooth_stone"); // roof cap
      }
    }
  }
}

g.save(OUT);
