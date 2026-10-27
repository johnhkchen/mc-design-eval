// A two-storey brick commercial block of the 1920s in Auckland's stripped-classical manner: red brick piers, cream plaster
// a string course, cream window surrounds and a cornice with a parapet cap; a shopfront with a door on the
// downhill (east) street face, where the ground is at 0. Storeys are keyed to the lidar roof (8 above y 0): floor at 0,
// ground storey air 1-3, floor at 4, upper air 5-7, roof 8, parapet cap 9. Every cell stands on the course below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317555.cells.json", "utf8"));
const FP = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, { ground }]));
const ROOF = 8;       // the lidar roof, 6-8 across the footprint, smoothed to one flat tier
const STRING = 4;     // the upper floor slab, and the cream string course on the walls at the same height
const W = 12, H = 21, D = 14;

const inFP = (x, z) => FP.has(`${x},${z}`);
const faces = (x, z) => {                 // exterior faces: N is z-1, S is z+1, E is x+1, W is x-1
  const f = [];
  if (!inFP(x, z - 1)) f.push("N");
  if (!inFP(x, z + 1)) f.push("S");
  if (!inFP(x + 1, z)) f.push("E");
  if (!inFP(x - 1, z)) f.push("W");
  return f;
};
const INWARD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // on an N/S face
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // on an E/W face
const DOOR = [10, 4];                     // the shop door, mid-way along the east street face

const g = new Voxels([W, H, D]);

// what each cell is: its exterior faces (the ragged outline makes most edge cells touch two, so the first one, N before
// S before E before W, is the face it is dressed on), shopfront, window bay, lit or not
const kind = new Map();
for (const [x, z, ground] of cells) {
  const f = faces(x, z);
  const k = { x, z, ground, faces: f, edge: f.length > 0, face: f[0] ?? null };
  if (k.face === "E" && ground === 0 && f.length === 1) k.shop = true;
  if (x === DOOR[0] && z === DOOR[1]) k.door = true;
  if (k.edge && !k.shop) {
    const idx = k.face === "N" || k.face === "S" ? x : z;   // every other bay along a face is a window, the rest piers
    k.window = idx % 2 === 1;
  }
  k.lit = Boolean(k.window) && (x * 7 + z * 3) % 4 === 0;
  kind.set(`${x},${z}`, k);
}

for (const k of kind.values()) {
  const { x, z } = k;
  // the floor: the foundation fill to ground 1 under the cells on the higher side, and the floor slab on every cell
  g.set(x, 0, z, k.edge ? "stone_bricks" : k.ground === 1 ? "stone_bricks" : "smooth_stone");
  if (!k.edge) g.set(x, STRING, z, "smooth_stone");     // interior upper floor
  if (!k.edge) g.set(x, ROOF, z, "gray_concrete");       // flat roof deck
  if (!k.edge) continue;

  // the roof edge: a cornice with a parapet cap on top
  g.set(x, ROOF, z, "smooth_quartz");
  g.set(x, ROOF + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  // the string course at the upper floor
  g.set(x, STRING, z, "smooth_quartz");

  if (k.shop) {
    // the shopfront: glass to the head of the ground storey, a dark fascia over it, and brick above
    for (const y of [1, 2]) g.set(x, y, z, "glass_pane", PANE_EW);
    g.set(x, 3, z, "dark_oak_planks");
    for (const y of [5, 6, 7]) g.set(x, y, z, "bricks");
    if (k.door) {
      g.set(x, 1, z, "oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 2, z, "oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    continue;
  }
  if (k.window) {
    // cream sill and lintels frame each window; the glass fills the two rows between
    g.set(x, 0, z, "smooth_quartz");
    for (const y of [1, 2]) g.set(x, y, z, "glass_pane", k.face === "N" || k.face === "S" ? PANE_NS : PANE_EW);
    g.set(x, 3, z, "smooth_quartz");
    for (const y of [5, 6]) g.set(x, y, z, "glass_pane", k.face === "N" || k.face === "S" ? PANE_NS : PANE_EW);
    g.set(x, 7, z, "smooth_quartz");
    continue;
  }
  // a brick pier between windows
  for (const y of [1, 2, 3, 5, 6, 7]) g.set(x, y, z, "bricks");
}

// the warm lights: a glowstone on the floor behind a lit ground-storey window, and on half of those a shroomlight
// on the upper floor behind the window above it
for (const k of kind.values()) {
  if (!k.lit) continue;
  const [dx, dz] = INWARD[k.face];
  const ix = k.x + dx, iz = k.z + dz;
  const inside = inFP(ix, iz) && faces(ix, iz).length === 0;
  if (!inside) continue;
  g.set(ix, 1, iz, "glowstone");
  if ((k.x + k.z) % 2 === 0) g.set(ix, 5, iz, "shroomlight");
}

// a hanging lantern in the room behind the shop door, and two plant units on the roof
g.set(9, 3, 4, "lantern", { hanging: "true", waterlogged: "false" });
for (const [x, z] of [[4, 6], [5, 6], [7, 11]]) g.set(x, ROOF + 1, z, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317555.nbt";
console.log(JSON.stringify(g.save(out)));
