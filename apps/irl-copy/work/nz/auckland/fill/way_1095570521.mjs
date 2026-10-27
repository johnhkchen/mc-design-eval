// Way 1095570521: a two-storey Edwardian red-brick shop-and-office block in Auckland's central city.
// Record from the lidar: a flat roof 10 blocks above the lowest ground, footprint 9 x 7 cells, no foundation
// (every cell's ground is 0). Massing is therefore one flat block: a plinth, a shopfront storey, a string course,
// an upper storey with sash windows, a quartz cornice and a brick parapet with a stone coping. Corners and piers
// are quartz and brick; the front (north, the face toward the street) has the glazed shopfront and the door.
// The inside is air with floor slabs, lit by a few glowstone and shroomlight blocks behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570521.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570521.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell

const R = 10;                                            // lidar roof height: flat across the footprint
const g = new Voxels([9, 23, 7]);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const key = (x, z) => `${x},${z}`;
const inF = new Set(cells.map(([x, z]) => key(x, z)));
const inside = (x, z) => inF.has(key(x, z));
// the sides of a cell that face outside the footprint
const exposed = (x, z) => Object.keys(DIRS).filter((f) => !inside(x + DIRS[f][0], z + DIRS[f][1]));

// each footprint cell: "core" (no outside face), "corner" (two or more), or "wall" (one) with its facing
const kindOf = new Map();
for (const [x, z, ground, roof] of cells) {
  if (ground !== 0 || roof !== R) throw new Error(`cell ${x},${z}: massing is not flat (ground ${ground}, roof ${roof})`);
  const ex = exposed(x, z);
  kindOf.set(key(x, z), { kind: ex.length === 0 ? "core" : ex.length > 1 ? "corner" : "wall", face: ex[0] ?? null, ex });
}
const kindAt = (x, z) => kindOf.get(key(x, z));

// a wall cell is a pier every third cell along its face, otherwise a window bay; the front (N) is the shopfront
const isPier = (x, z, face) => (face === "N" || face === "S" ? x : z) % 3 === 2;
// ---- the building ----
for (const [x, z] of cells) {
  const { kind, face } = kindAt(x, z);
  const corner = kind === "corner", core = kind === "core";
  const pier = corner || (kind === "wall" && isPier(x, z, face));
  const front = face === "N" && kind === "wall";
  const frontDoor = front && x === 4 && z === 1;

  // y 0: plinth on the outside, a stone floor inside
  g.set(x, 0, z, core ? "smooth_stone" : "stone_bricks");

  // y 1..3: ground storey. Corners and piers are quartz and brick; bays are glass on a dark sill; the front is the shop.
  if (!core) {
    if (corner || pier) for (const y of [1, 2, 3]) g.set(x, y, z, "bricks");
    else if (frontDoor) {
      g.set(x, 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, 3, z, "glass_pane");
    } else {
      g.set(x, 1, z, front ? "polished_andesite" : "stone_bricks");
      for (const y of [2, 3]) g.set(x, y, z, "glass_pane");
    }
  }
  // y 4: string course outside, the first floor inside
  g.set(x, 4, z, core ? "oak_planks" : "smooth_quartz");

  // y 5..7: upper storey. Corners and piers run up; bays are sash windows with a transom at y 6
  if (!core) {
    // upper piers are quartz pilasters between the sashes; corners stay brick so the stepped outline reads as brick
    if (corner || pier) for (const y of [5, 6, 7]) g.set(x, y, z, pier && !corner ? "smooth_quartz" : "bricks");
    else { g.set(x, 5, z, "glass_pane"); g.set(x, 6, z, "smooth_quartz"); g.set(x, 7, z, "glass_pane"); }
  }
  // y 8: cornice outside, the attic floor inside
  g.set(x, 8, z, core ? "oak_planks" : "smooth_quartz");

  // y 9: parapet on the outside, roof membrane inside
  if (core) g.set(x, 9, z, "smooth_stone");
  else g.set(x, 9, z, "bricks");

  // y 10: stone coping on the parapet
  if (!core) g.set(x, 10, z, "stone_brick_slab", { type: "top" });
}

// ---- inside: the air gap behind the glass, with a few warm lights ----
// a window bay on the footprint's edge, next to this core cell (not a pier)
const bayBeside = (x, z) => Object.keys(DIRS).some((f) => {
  const nx = x + DIRS[f][0], nz = z + DIRS[f][1];
  if (!inside(nx, nz)) return false;
  const n = kindAt(nx, nz);
  return n.kind === "wall" && !isPier(nx, nz, n.face);
});
for (const [x, z] of cells) {
  if (kindAt(x, z).kind !== "core") continue;
  // glowstone behind an upper window, shroomlight behind a ground window
  if (bayBeside(x, z) && (x + z) % 2 === 0) g.set(x, 5, z, "glowstone");
  if (bayBeside(x, z) && (x + z) % 2 === 1) g.set(x, 2, z, "shroomlight");
  // hanging lanterns under the attic floor
  if ((2 * x + z) % 5 === 0) g.set(x, 7, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- roof plant: an air-conditioning unit on two core cells, set on the roof membrane ----
for (const [x, z] of [[4, 4], [5, 4]]) {
  if (kindAt(x, z)?.kind !== "core") throw new Error(`plant cell ${x},${z} is not core`);
  g.set(x, 10, z, "iron_block");
  g.set(x, 11, z, "iron_bars");
}

const stats = g.save(OUT);
console.log(`way_1095570521: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
