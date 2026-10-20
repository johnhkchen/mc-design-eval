import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw391152168: 9 x 23 footprint, roof about 12 blocks above lowest ground.
// Read as a 1980s Taipei mid-rise: two shopfront/office storeys (5 blocks each),
// white concrete frame with pillars, blue-tinted glazing, brown tile lintels,
// stone sills, cornice and parapet, a framed street entrance, and a roof plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw391152168";
const W = 9, H = 24, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const L = Math.min(...cells.map((c) => c[2]));   // lowest ground (y 0 datum)
const TOP = L + 12;                                // roof surface level

const setB = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces per cell: a face is exterior when the neighbour is not in the footprint.
const FACES = [
  { name: "north", dx: 0, dz: -1, facing: "north", axis: "x" },
  { name: "south", dx: 0, dz: 1, facing: "south", axis: "x" },
  { name: "west", dx: -1, dz: 0, facing: "west", axis: "z" },
  { name: "east", dx: 1, dz: 0, facing: "east", axis: "z" },
];
const exteriorOf = new Map();
for (const [x, z] of cells) {
  exteriorOf.set(key(x, z), FACES.filter((f) => !ground.has(key(x + f.dx, z + f.dz))));
}

// Along-face extent per face, used for bay rhythm (pillar every 3 blocks, plus both ends).
const info = {};
for (const f of FACES) {
  const along = cells
    .filter(([x, z]) => exteriorOf.get(key(x, z)).includes(f))
    .map(([x, z]) => (f.axis === "x" ? x : z));
  info[f.name] = { f, lo: Math.min(...along), hi: Math.max(...along), n: along.length };
}
const isPillar = (I, a) => (a - I.lo) % 3 === 0 || a === I.hi;

// Street front: the longest exterior face.
let front = null;
for (const f of FACES) {
  if (!front || info[f.name].n > info[front.name].n) front = f;
}
const FI = info[front.name];
const mid = (FI.lo + FI.hi) / 2;

// Entrance: a non-pillar bay on the front, lowest ground, nearest the middle.
const doorCands = cells
  .filter(([x, z]) => exteriorOf.get(key(x, z)).includes(front))
  .map(([x, z, gr]) => ({ x, z, gr, a: front.axis === "x" ? x : z }))
  .filter((c) => !isPillar(FI, c.a))
  .sort((p, q) => p.gr - q.gr || Math.abs(p.a - mid) - Math.abs(q.a - mid));
const door = doorCands[0] ?? null;

// Facade block for an exterior column at relative height r (y - L), r >= 1.
function facade(f, x, z, r) {
  const a = f.axis === "x" ? x : z;
  const I = info[f.name];
  const pil = isPillar(I, a);
  const paneProps = f.axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const glass = () => ({ id: "light_blue_stained_glass_pane", props: paneProps });
  const lit = () => ({ id: "yellow_stained_glass_pane", props: paneProps });
  const pillar = () => ({ id: "white_concrete" });

  // Door surround: stone brick jambs flanking the entrance bay.
  if (door && f.name === front.name && Math.abs(a - door.a) === 1 && x === (f.axis === "x" ? x : door.x) && z === (f.axis === "z" ? z : door.z) && r >= 1 && r <= 3) {
    return { id: "stone_bricks" };
  }

  if (r === 5) return { id: "smooth_stone" };                       // storey line
  if (r === 10) return { id: "smooth_stone" };                     // cornice
  if (r === 11) return { id: "stone_brick_slab", props: { type: "bottom", waterlogged: "false" } }; // parapet
  if (r === 4 || r === 9) return { id: "brown_terracotta" };       // tile lintels
  if (r >= 1 && r <= 3) return pil ? pillar() : glass();           // shopfront band
  if (r === 6) return pil ? pillar() : { id: "stone_brick_slab", props: { type: "bottom", waterlogged: "false" } }; // sill
  if (r === 7 || r === 8) {                                        // upper office windows
    if (pil) return pillar();
    if ((a - I.lo) % 6 === 4) return lit();                        // warm lit window
    return glass();
  }
  return pillar();
}

// Build the body column by column.
for (const [x, z, gr] of cells) {
  const ext = exteriorOf.get(key(x, z));

  // Foundation up to this cell's ground, then the ground-level slab/base course.
  for (let y = 0; y < gr; y++) setB(x, y, z, "stone_bricks");
  setB(x, gr, z, "smooth_stone");

  for (let y = gr + 1; y < TOP; y++) {
    const r = y - L;
    if (ext.length === 0) {
      // Interior: floor slab per storey, roof deck, air between.
      if (r === 5) setB(x, y, z, "smooth_stone");
      if (r === 11) setB(x, y, z, "light_gray_concrete");
      continue;
    }
    for (const f of ext) {
      const b = facade(f, x, z, r);
      setB(x, y, z, b.id, b.props);
    }
  }
}

// Roof plant room, centred on the footprint, standing on the interior roof deck.
for (let x = 3; x <= 5; x++) {
  for (let z = 9; z <= 13; z++) {
    if (!ground.has(key(x, z))) continue;
    if (exteriorOf.get(key(x, z)).length) continue;
    setB(x, L + 12, z, "light_gray_concrete");
  }
}
if (ground.has(key(4, 11)) && exteriorOf.get(key(4, 11)).length === 0) {
  setB(4, L + 13, 11, "white_concrete");
}

// Street entrance: double door with a hanging lantern under the tile lintel.
if (door) {
  const dx = door.x, dz = door.z;
  setB(dx, L + 1, dz, "dark_oak_door", {
    facing: front.facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  setB(dx, L + 2, dz, "dark_oak_door", {
    facing: front.facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  setB(dx, L + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
