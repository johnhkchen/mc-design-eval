import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw456299354: 14 x 68 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey (about 5 blocks each) 1980s Taipei mixed-use block:
// white tiled concrete walls, light grey floor bands, stone plinth and cornice,
// shopfront glazing on the ground floor, a recessed entrance on the street face,
// a flat roof with a small penthouse and rooftop plant.

const W = 14, H = 23, D = 68;
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456299354";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
let B = Infinity;
for (const [x, z, g] of cells) {
  G.set(`${x},${z}`, g);
  B = Math.min(B, g);
}
if (!Number.isFinite(B)) B = 0;

// Storey lines are absolute, measured from the lowest ground B.
// Floor 1: y B..B+4, floor slab B+5, floor 2: B+6..B+9, cornice/deck B+10.
// Roof surface at B+11 (about 11 blocks above the lowest ground).
const DECK = B + 10;

const inside = (x, z) => G.has(`${x},${z}`);

const vox = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) vox.set(x, y, z, b, p);
  else vox.set(x, y, z, b);
};

// Panes on west/east faces run north-south; panes on north/south faces run east-west.
const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_Z = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

for (const [x, z, g] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  const fW = !inside(x - 1, z);
  const fE = !inside(x + 1, z);
  const fN = !inside(x, z - 1);
  const fS = !inside(x, z + 1);
  const edge = fW || fE || fN || fS;
  const corner = (fW || fE) && (fN || fS);
  const xFace = fW || fE; // facade runs along z

  if (!edge) {
    // Interior: ground floor slab, a floor slab at B+5 and the roof deck at DECK.
    if (g < DECK) {
      put(x, g, z, "smooth_stone");
      if (B + 5 > g) put(x, B + 5, z, "light_gray_concrete");
      put(x, DECK, z, "light_gray_concrete");
    }
    continue;
  }

  if (g >= DECK) continue;

  // Edge cell: plinth course, then walls with window grids.
  put(x, g, z, "stone_bricks");

  const t = xFace ? z : x;          // position along the facade
  const L = xFace ? D : W;          // facade length
  const dx = fW ? 1 : fE ? -1 : 0;  // inward direction
  const dz = fN ? 1 : fS ? -1 : 0;

  const isWinCol = !corner && t >= 2 && t <= L - 3 && (t % 4 === 1 || t % 4 === 2);
  const isEntrance = fW && !corner && t >= 32 && t <= 36;
  const winRow = (y) => (y >= g + 1 && y <= B + 3) || (y >= B + 6 && y <= B + 8);

  for (let y = g + 1; y < DECK; y++) {
    let b = "white_concrete";
    let p;
    if (y === B + 4 || y === B + 5 || y === B + 9) {
      b = "light_gray_concrete"; // storey lines and sill/lintel bands
    } else if (!corner && winRow(y) && isWinCol) {
      b = "glass_pane";
      p = xFace ? GLASS_X : GLASS_Z;
    }
    put(x, y, z, b, p);
  }

  // Cornice course at the top of the walls.
  put(x, DECK, z, "smooth_stone");

  // Recessed entrance on the west (street) face.
  if (isEntrance) {
    put(x, g + 3, z, "dark_oak_planks"); // lintel over the lobby
    if (t === 34) {
      put(x, g + 1, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, g + 2, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    if (t === 33 || t === 35) {
      // Lobby lantern on the floor just inside the door, and a soffit canopy over the glazing.
      if (inside(x + 1, z)) {
        put(x + 1, g + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
        put(x + 1, g + 3, z, "dark_oak_planks");
      }
    }
  }

  // Warm lights behind some upper and lower windows (air gap behind the glass).
  if (isWinCol && !isEntrance && (dx || dz) && inside(x + dx, z + dz)) {
    for (let y = g + 1; y < DECK; y++) {
      if (!winRow(y)) continue;
      if ((t * 3 + y) % 5 === 0) {
        put(x + dx, y, z + dz, (t + y) % 2 === 0 ? "glowstone" : "shroomlight");
      }
    }
  }
}

// Roof: mechanical penthouse, rooftop plant and a lightning rod.
const TOP = DECK + 1;
for (let x = 3; x <= 10; x++) {
  for (let z = 24; z <= 41; z++) {
    if (!inside(x, z)) continue;
    const ring = x === 3 || x === 10 || z === 24 || z === 41;
    for (let y = TOP; y <= TOP + 2; y++) {
      if (ring) {
        let b = "light_gray_concrete";
        if (y === TOP + 1 && x === 3 && z % 3 === 0) b = "iron_bars";
        put(x, y, z, b);
      }
    }
    put(x, TOP + 3, z, "smooth_stone");
  }
}
for (const [x, z] of [[12, 50], [12, 54], [1, 58]]) {
  if (inside(x, z)) {
    put(x, TOP, z, "smooth_stone");
    put(x, TOP + 1, z, "iron_block");
  }
}
if (inside(6, 10)) put(6, TOP, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

vox.save(`${DIR}/${ID}.nbt`);
