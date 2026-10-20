import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334984547";
const W = 24, H = 33, D = 19;
const ROOF = 21;      // roof membrane top, ~21 blocks above lowest ground (lidar)
const TOP_WALL = 20;  // last wall row under the roof membrane
const STOREY = 5;     // 5-block storeys: slab/spandrel rows at 0 mod 5 and 4 mod 5

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const footprint = cells.map(([x, z]) => [x, z]);

const inside = (x, z) => gmap.has(`${x},${z}`);
const groundOf = (x, z) => Math.max(0, Math.min(TOP_WALL, gmap.get(`${x},${z}`) ?? 0));

// Safe setter: only inside the footprint and inside the volume
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inside(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Glass panes: connect along the wall they sit in
function paneProps(face) {
  const alongX = face === "N" || face === "S";
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// 1. Foundations, floor slabs, walls, windows, piers, lights
for (const [x, z] of footprint) {
  const G = groundOf(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const faces = {
    N: !inside(x, z - 1),
    S: !inside(x, z + 1),
    W: !inside(x - 1, z),
    E: !inside(x + 1, z),
  };
  const exposed = Object.keys(faces).filter((f) => faces[f]);
  const perimeter = exposed.length > 0;
  const single = exposed.length === 1 ? exposed[0] : null;
  // index along the face: x for north/south faces, z for east/west faces
  const along = single === "N" || single === "S" ? x : z;

  for (let y = G; y <= TOP_WALL; y++) {
    const row = y % STOREY;
    const k = Math.floor(y / STOREY);

    // storey base course / floor slab, across the whole footprint
    if (row === 0) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!perimeter) continue;

    // spandrel under the next floor
    if (row === 4) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // rows 1..3 of each storey: window band, with concrete piers
    // corners and piers every third bay are concrete
    const pier = !single || along % 3 === 0;
    if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", paneProps(single));
    }

    // warm light behind selected windows on the second storey
    if (!pier && row === 2 && k === 1 && ((x * 7 + z * 3) % 9 === 0)) {
      const inward = {
        N: [x, z + 1],
        S: [x, z - 1],
        W: [x + 1, z],
        E: [x - 1, z],
      }[single];
      if (inward && inside(inward[0], inward[1])) {
        put(inward[0], y, inward[1], "shroomlight");
      }
    }
  }
}

// 2. Roof membrane across the whole footprint
for (const [x, z] of footprint) {
  put(x, ROOF, z, "light_gray_concrete");
}

// 3. Parapet on the perimeter, standing on the roof membrane
for (const [x, z] of footprint) {
  const perimeter =
    !inside(x, z - 1) || !inside(x, z + 1) || !inside(x - 1, z) || !inside(x + 1, z);
  if (perimeter) {
    put(x, ROOF + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 4. Main entrance on the south face: two-block door, lintel above
{
  const southCells = footprint
    .filter(([x, z]) => !inside(x, z + 1))
    .map(([x]) => x)
    .sort((a, b) => a - b);
  if (southCells.length > 0) {
    const dx = southCells[Math.floor(southCells.length / 2)];
    const dz = Math.max(...footprint.filter(([x]) => x === dx).map(([, z]) => z));
    const G = groundOf(dx, dz);
    put(dx, G, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(dx, G + 1, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(dx, G + 2, dz, "light_gray_concrete");
  }
}

// 5. Rooftop stair/lift house, centred, standing on the roof membrane
for (let x = 9; x <= 14; x++) {
  for (let z = 6; z <= 12; z++) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "white_concrete");
    put(x, ROOF + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
// small glazed openings on the stair house's south side
for (let x = 10; x <= 13; x++) {
  put(x, ROOF + 2, 12, "glass_pane", paneProps("S"));
}

// 6. Water tank on the roof, west side
for (let x = 2; x <= 4; x++) {
  for (let z = 3; z <= 5; z++) {
    if ((x === 2 || x === 4) && (z === 3 || z === 5)) continue; // round off the corners
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "stone_bricks");
    put(x, ROOF + 4, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}
// tank legs
for (const [x, z] of [[3, 4]]) {
  put(x, ROOF + 1, z, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
