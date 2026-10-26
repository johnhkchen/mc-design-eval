import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1133 20th St NW, Commercial-Office-Large: a pale limestone-clad office of the 1920s-30s stripped-classical kind,
// on a stone plinth, with a shopfront and a central doorway on its street face (z = 0). The lidar roof record reads as
// three flat tiers: a 1-storey annex on the east edge (roof 2-3), a 4-storey wing around the footprint (roof 12), and a
// 5-storey body in the middle (roof 14-15) that rises above the wings as a setback tower, with plant on its roof.
// Storeys are 3-block modules: a string course at each floor line, then two rows of glass between calcite piers.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC67394.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 19, D = 15, Y = 27;
const g = new Voxels([W, Y, D]);

const key = (x, z) => `${x},${z}`;
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const groundAt = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

// the tiers: the lidar roof, smoothed over each cell's 3 x 3 neighbourhood, rounded to a flat tier per zone
const WING = 12, BODY = 15, ANNEX = 3;
const H = new Map();
for (const [x, z, , r] of cells) {
  if (r <= 3) { H.set(key(x, z), ANNEX); continue; }
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const v = roofAt.get(key(x + dx, z + dz));
    if (v !== undefined) { s += v; n++; }
  }
  H.set(key(x, z), s / n >= 13.5 ? BODY : WING);
}
const top = (x, z) => H.get(key(x, z)) ?? 0;
// solid from y 0 up to the tier: the plinth and the storeys; a cell's neighbour with no block at that y is an exposed face
const occ = (x, y, z) => y >= 0 && y < top(x, z);
const inside = (x, z) => H.has(key(x, z));

// glass panes join along their wall: east-west on a north/south face, north-south on an east/west face
const pane = (onZ) => (onZ ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });
const put = (x, y, z, id, state) => g.set(x, y, z, id, state);

// the street face: a shopfront band on the ground floor (y 1-2) with a double doorway at x 7-8, under a canopy at y 3
const DOOR_X = [7, 8];
const CANOPY_X = [6, 7, 8, 9];

// one exposed facade block: calcite piers and corners, sandstone string courses, glass between, the cornice on top
function facade(x, y, z, faces) {
  if (y === top(x, z) - 1) return { id: "smooth_sandstone" }; // cornice at the top of the tier
  const onZ = faces.N || faces.S, onX = faces.E || faces.W;
  const front = faces.N && z === 0;
  if (front && y <= 2 && DOOR_X.includes(x)) return { id: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 7 ? "left" : "right", open: "false", powered: "false" } };
  if (front && y === 3 && CANOPY_X.includes(x)) return { id: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } };
  if (y % 3 === 0) return { id: "smooth_sandstone" }; // storey line
  if (onZ && onX) return { id: "calcite" }; // corner pier
  const i = onZ ? x : z; // along the face
  if (i % 3 === 0) return { id: "calcite" }; // pier: the frame between bays
  return { id: "glass_pane", state: pane(onZ) };
}

const lights = [];
// the tiers, cell by cell from the plinth up to each tier's top
for (const [x, z] of [...H.keys()].map((k) => k.split(",").map(Number))) {
  const h = top(x, z);
  for (let y = 0; y < h; y++) {
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; } // plinth course, and the floor of the ground storey
    const faces = { N: !occ(x, y, z - 1), S: !occ(x, y, z + 1), W: !occ(x - 1, y, z), E: !occ(x + 1, y, z) };
    const exposed = faces.N || faces.S || faces.E || faces.W;
    if (!exposed) {
      if (y === h - 1) put(x, y, z, "smooth_stone"); // roof deck
      else if (y % 3 === 0) put(x, y, z, "smooth_stone"); // floor slab; the air above is the gap behind the glass
      continue;
    }
    const b = facade(x, y, z, faces);
    put(x, y, z, b.id, b.state);
    if (b.id === "glass_pane") {
      // warm light in some bays: glowstone just inside the glass, in the air gap, where that cell is still empty
      if (((x + y * 2 + z) % 5) === 0) {
        const inward = faces.N ? [x, y, z + 1] : faces.S ? [x, y, z - 1] : faces.W ? [x + 1, y, z] : [x - 1, y, z];
        if (inside(inward[0], inward[2]) && inward[1] % 3 !== 0) lights.push(inward);
      }
    }
  }
}
for (const [x, y, z] of lights) if (!g.get(x, y, z)) put(x, y, z, "glowstone");

// the entrance's lamps under the canopy edges (the canopy at y 3, the lamps hang from it)
put(6, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
put(9, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant on the body's roof: two 3 x 2 boxes of stone and a grille, standing on the roof deck at y 14
const interior = (x, z) => [[-1, 0], [1, 0], [0, -1], [0, 1]].every(([dx, dz]) => top(x + dx, z + dz) === BODY);
const plantSpots = [[6, 4], [11, 9]];
for (const [px, pz] of plantSpots) {
  for (let x = px; x < px + 3; x++) for (let z = pz; z < pz + 2; z++) {
    if (!interior(x, z)) continue;
    put(x, BODY, z, "smooth_stone");
    put(x, BODY + 1, z, "iron_bars");
  }
}

// checks: nothing hangs in the air (each block has a block below it, or is on the plinth), and each column tops out at its tier
const hanging = [];
for (let y = 1; y < Y; y++) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (g.get(x, y, z) && !g.get(x, y - 1, z)) hanging.push([x, y, z]);
const topOf = (x, z) => { for (let y = Y - 1; y >= 0; y--) if (g.get(x, y, z)) return y + 1; return 0; };
let worst = 0;
for (const [x, z] of [...H.keys()].map((k) => k.split(",").map(Number))) worst = Math.max(worst, Math.abs(topOf(x, z) - top(x, z)));
const r = g.save(`${DIR}/DC67394.nbt`);
console.log({ ...r, hanging: hanging.length, worstTopMinusTier: worst, lights: lights.length, cells: cells.length, groundsZero: [...groundAt.values()].filter((v) => v === 0).length });
