import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000073";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 8;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const cellMap = new Map();
for (const [x, z, ground, roof] of cells) {
  cellMap.set(`${x},${z}`, { x, z, gy: Math.round(ground), roof });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

// Shared base row (lowest ground) so storey bands line up across the slope.
const B = Math.min(...[...cellMap.values()].map(c => c.gy));

// Flat roof tier from the median lidar roof, clamped to 9..12 blocks above base.
const roofs = [...cellMap.values()].map(c => c.roof).sort((a, b) => a - b);
let TOP = Math.round(roofs[Math.floor(roofs.length / 2)]);
if (TOP - B < 9) TOP = B + 9;
if (TOP - B > 12) TOP = B + 12;
const T = TOP - B; // rows above base: parapet sits at row T-1

// Exterior faces in priority order. inx/inz point inward (into the building).
const FACES = [
  { name: "N", dx: 0, dz: -1, inx: 0, inz: 1, face: "north", along: "x" },
  { name: "S", dx: 0, dz: 1, inx: 0, inz: -1, face: "south", along: "x" },
  { name: "W", dx: -1, dz: 0, inx: 1, inz: 0, face: "west", along: "z" },
  { name: "E", dx: 1, dz: 0, inx: -1, inz: 0, face: "east", along: "z" },
];

const DOOR_X = Math.floor(W / 2) - 1; // entrance on the street (north) front, x = 7
const glowSpots = [];

// ---- pass 1: foundations, walls, floors, roofs ------------------------------
for (const c of cellMap.values()) {
  const { x, z, gy } = c;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const face = FACES.find(f => !has(x + f.dx, z + f.dz)) || null;
  const idx = face ? (face.along === "x" ? x : z) : 0;
  const len = face ? (face.along === "x" ? W : D) : 1;
  const isCorner = face ? (idx === 0 || idx === len - 1) : false;
  const isWindow = face ? (!isCorner && idx % 2 === 1) : false;
  const isFront = face && face.name === "N" && z === 0;
  const isDoorFrame = isFront && Math.abs(x - DOOR_X) === 1;
  const isDoor = isFront && x === DOOR_X;

  for (let y = gy; y < TOP && y < H; y++) {
    const r = y - B;

    if (face) {
      // Facade shell cell.
      if (r === T - 1) {
        // Parapet cap: corners solid, bays alternating for a broken cornice rhythm.
        g.set(x, y, z, isCorner || idx % 4 === 0 ? "stone_brick_wall" : "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        if (isCorner || idx % 4 === 0) g.set(x, y, z, "stone_brick_wall");
      } else if (r === 0) {
        g.set(x, y, z, "stone_bricks");                // plinth / base course
      } else if (r === 3 || r === 5 || r === 7 || r === 9) {
        g.set(x, y, z, "stone_bricks");                // storey string courses
      } else if (isCorner) {
        // Stone quoins at the corners give the wall relief.
        g.set(x, y, z, r % 2 === 0 ? "stone_bricks" : "chiseled_stone_bricks");
      } else if (r === 1 || r === 2) {
        // Ground storey: shopfront with a framed entrance on the street front.
        if (isDoor && gy <= B + 1) {
          if (r === 1) {
            g.set(x, y, z, "oak_door", { facing: face.face, half: "lower", hinge: "left", open: "false", powered: "false" });
          } else {
            g.set(x, y, z, "oak_door", { facing: face.face, half: "upper", hinge: "left", open: "false", powered: "false" });
          }
        } else if (isDoorFrame) {
          g.set(x, y, z, "stone_bricks");
        } else if (isWindow) {
          g.set(x, y, z, "glass_pane");
          if (r === 1 && idx % 6 === 3) glowSpots.push([x, y, z, face]);
        } else {
          g.set(x, y, z, "bricks");
        }
      } else if (r === 4 || r === 6 || r === 8) {
        // Upper storeys: window bays over brick piers, with stone sills and lintels from the bands.
        if (isWindow) {
          g.set(x, y, z, "glass_pane");
          if (r === 6 && idx % 4 === 1) glowSpots.push([x, y, z, face]);
        } else {
          g.set(x, y, z, "bricks");
        }
      } else {
        g.set(x, y, z, "bricks");
      }
    } else {
      // Interior cell: no rooms, just floor slabs and a roof deck.
      if (r === T - 1) {
        g.set(x, y, z, "smooth_stone");
      } else if (r === 0 || r === 3 || r === 5 || r === 7 || r === 9) {
        g.set(x, y, z, "oak_planks");
      }
    }
  }
}

// ---- pass 2: entrance canopy above the door (dark wood awning on the string course)
for (const dx of [-1, 0, 1]) {
  const cx = DOOR_X + dx;
  const c = cellMap.get(`${cx},0`);
  if (!c) continue;
  const y = 3 + B;
  if (y >= c.gy && y < H) g.set(cx, y, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// ---- pass 3: lights behind glass (glow sits in the interior cell behind each pane)
for (const [x, y, z, face] of glowSpots) {
  const ix = x + face.inx, iz = z + face.inz;
  if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
}

// ---- pass 4: rooftop brick chimney stacks on two interior cells
for (const [cx, cz] of [[4, 3], [11, 4]]) {
  const c = cellMap.get(`${cx},${cz}`);
  if (!c) continue;
  for (let y = TOP; y < TOP + 2 && y < H; y++) g.set(cx, y, cz, "bricks");
  if (TOP + 2 < H) g.set(cx, TOP + 2, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
