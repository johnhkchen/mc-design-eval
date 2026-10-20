import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial block, two storeys over a plinth with a stone cornice and a
// white parapet, in the cream-tile and concrete idiom of 1960s-80s Taipei shophouses.
// Ground floor is a shopfront with a centred entrance on the longest street face.
// Quartz pillars divide the glass; a few glowstone lights sit behind the panes.
// Roof height is about 13 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw352791657";
const W = 16, H = 25, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

// Outward directions per cell: [dx, dz, name]
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const faces = new Map();
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  faces.set(key(x, z), DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz)));
}

// Entrance: the face with the most single-face wall cells, door at its middle cell.
const faceCount = { north: [], south: [], west: [], east: [] };
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fl = faces.get(key(x, z));
  if (fl.length === 1) faceCount[fl[0][2]].push([x, z]);
}
let doorFace = "south";
for (const f of Object.keys(faceCount)) {
  if (faceCount[f].length > faceCount[doorFace].length) doorFace = f;
}
const doorList = faceCount[doorFace].slice().sort((a, b) =>
  (doorFace === "north" || doorFace === "south") ? a[0] - b[0] : a[1] - b[1]);
const doorCell = doorList[Math.floor(doorList.length / 2)] ?? [8, D - 1];
const doorAlongAxisIsX = doorFace === "north" || doorFace === "south";
const doorAlong = doorAlongAxisIsX ? doorCell[0] : doorCell[1];
const doorDir = DIRS.find(d => d[2] === doorFace);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (face) => (face === "north" || face === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const fl = faces.get(key(x, z));

  // Foundation from y 0 up to this cell's ground, then the ground-floor slab.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  // Interior: floor slab and roof deck, air between.
  if (fl.length === 0) {
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "light_gray_concrete");
    // Rooftop plant boxes on a sparse grid.
    if (x % 5 === 2 && z % 5 === 2) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Perimeter facade.
  const [dx, dz, face] = fl[0];
  const corner = fl.length >= 2;
  const along = (face === "north" || face === "south") ? x : z;
  const onDoorFace = fl.some(f => f[2] === doorFace);
  const doorHere = onDoorFace && x === doorCell[0] && z === doorCell[1];
  const flankDoor = onDoorFace && !doorHere && Math.abs(along - doorAlong) === 1;
  const pillar = corner || along % 3 === 0 || flankDoor;
  const pane = paneProps(face);

  // Inward neighbour for interior glow.
  const ix = x - dx, iz = z - dz;
  const innerOpen = inside(ix, iz) && faces.get(key(ix, iz)).length === 0;

  for (let k = 1; k <= 12; k++) {
    const y = gr + k;
    switch (k) {
      case 1: // plinth / door lower half
        if (doorHere) put(x, y, z, "oak_door", { facing: doorFace, half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "stone_bricks");
        break;
      case 2: // shopfront glass / door upper half
        if (doorHere) put(x, y, z, "oak_door", { facing: doorFace, half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (pillar) put(x, y, z, "quartz_pillar", { axis: "y" });
        else put(x, y, z, "glass_pane", pane);
        break;
      case 3: // shopfront glass / transom
        if (pillar) put(x, y, z, "quartz_pillar", { axis: "y" });
        else put(x, y, z, "glass_pane", pane);
        break;
      case 4: // lintel band; stone cap over the entrance
        if (doorHere) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        else put(x, y, z, "white_concrete");
        break;
      case 5: // storey line
        put(x, y, z, "smooth_stone");
        break;
      case 6:
      case 7:
      case 8:
      case 9: // upper storey windows
        if (pillar) put(x, y, z, "quartz_pillar", { axis: "y" });
        else {
          put(x, y, z, "glass_pane", pane);
          if (k === 7 && along % 6 === 1 && innerOpen) put(ix, y, iz, "glowstone");
        }
        break;
      case 10: // cornice
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        break;
      case 11: // parapet
        put(x, y, z, "white_concrete");
        break;
      case 12: // parapet cap
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        break;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
