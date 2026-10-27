// Way 912170819, Auckland: a two-storey Edwardian brick-and-plaster shop block on a flat site. A 1-block brick shell
// with a quartz string course, lintel and cornice, a brick parapet with a coping, and solid floor slabs at y 0, 4 and
// 9 (the roof deck). Interiors are air behind the glass. The shopfront and door are on the north (street) face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170819.cells.json", "utf8"));
// the lidar gives every cell the same ground (0) and roof (10): one flat roof, no setbacks to step
const roofs = new Set(cells.map((c) => c[3])), grounds = new Set(cells.map((c) => c[2]));
if (roofs.size !== 1 || grounds.size !== 1 || grounds.has(undefined)) throw new Error(`uneven site: roofs ${[...roofs]} grounds ${[...grounds]}`);
const ROOF = [...roofs][0];                 // 10: the roof deck top; the deck is the slab at ROOF - 1
const CAP = ROOF + 1;                       // the parapet's coping, one course above the parapet

const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const FULL = new Set(["bricks", "smooth_quartz", "stone_bricks", "stone", "iron_block", "dark_oak_planks"]);
const onFoot = new Set(cells.map(([x, z]) => `${x},${z}`));
const isIn = (x, z) => onFoot.has(`${x},${z}`);
const exposed = (x, z) => Object.keys(DIR).filter((d) => !isIn(x + DIR[d][0], z + DIR[d][1]));

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { x, y, z, block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };

for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (!ex.length) {
    // interior: the floor slabs at 0, 4 and the roof deck at ROOF - 1 are solid; the air between them is the gap behind the glass
    put(x, 0, z, "stone_bricks");
    put(x, 4, z, "stone");
    put(x, ROOF - 1, z, "stone");
    continue;
  }
  const corner = ex.length > 1;             // quoins: where two faces meet, or a one-cell notch
  const face = ex[0];
  const u = face === "N" || face === "S" ? x : z;   // position along the face: bays of two glass cells, then a pier
  const bay = !corner && u % 3 !== 2;
  const frontDoor = face === "N" && z === 0 && x === 3;
  put(x, 0, z, "stone_bricks");             // base course
  for (const y of [1, 2, 3]) {              // ground storey: shopfront
    if (frontDoor) {
      if (y < 3) put(x, y, z, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
      else put(x, y, z, "lantern", LANTERN); // the entrance light, hung from the string course
    } else if (corner) put(x, y, z, "smooth_quartz");
    else if (bay) put(x, y, z, face === "N" && y === 3 ? "dark_oak_planks" : "glass_pane", { waterlogged: "false" }); // dark fascia over the shop glass
    else put(x, y, z, "bricks");
  }
  put(x, 4, z, "smooth_quartz");            // first-floor string course over the floor slab
  for (const y of [5, 6, 7]) {              // upper storey: sash windows
    if (corner) put(x, y, z, "smooth_quartz");
    else if (bay) put(x, y, z, "glass_pane", { waterlogged: "false" });
    else put(x, y, z, "bricks");
  }
  put(x, 8, z, "smooth_quartz");            // window-head course
  put(x, ROOF - 1, z, "smooth_quartz");     // cornice on the roof-deck slab
  put(x, ROOF, z, "bricks");                // parapet
  put(x, CAP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // coping
}

// roof plant on the deck, a skylight over the stair well with a hanging lantern under it
for (const [x, z] of [[3, 2], [4, 2]]) { if (exposed(x, z).length) throw new Error(`plant cell ${x},${z} is on the wall`); put(x, ROOF, z, "iron_block"); }
put(4, ROOF - 1, 4, "glass");
put(4, ROOF - 2, 4, "lantern", LANTERN);

// warm light: a glowstone on the first-floor slab behind some upper sashes, a shroomlight on the ground floor behind some shop glass
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const [ix, iz] = INWARD[ex[0]];
  const cx = x + ix, cz = z + iz;
  if (!isIn(cx, cz) || exposed(cx, cz).length) continue;   // the cell behind must be an interior, not wall
  if (at(x, 5, z)?.block === "glass_pane" && (x + 2 * z) % 4 === 0 && !at(cx, 5, cz)) put(cx, 5, cz, "glowstone");
  if (at(x, 1, z)?.block === "glass_pane" && (x + z) % 3 === 1 && !at(cx, 1, cz)) put(cx, 1, cz, "shroomlight");
}

// glass panes connect to the walls and panes beside them in the same course, as Minecraft would have them
for (const p of plan.values()) {
  if (p.block !== "glass_pane") continue;
  const state = { waterlogged: "false" };
  for (const [d, [dx, dz]] of Object.entries(DIR)) {
    const n = at(p.x + dx, p.y, p.z + dz);
    state[{ N: "north", S: "south", E: "east", W: "west" }[d]] = n && (n.block === "glass_pane" || FULL.has(n.block)) ? "true" : "false";
  }
  p.state = state;
}

// nothing floats: every block above y 0 stands on a block below, or hangs from the course above. The interior floor and
// roof slabs (y 4 and ROOF - 1) span the air gap between the walls, as a floor on joists does, so they are exempt.
const spans = (p) => (p.y === 4 || p.y === ROOF - 1) && !exposed(p.x, p.z).length;
const floating = [...plan.values()].filter((p) => p.y > 0 && !spans(p) && !at(p.x, p.y - 1, p.z) && !(p.block === "lantern" && p.state.hanging === "true"));
if (floating.length) throw new Error(`floating blocks: ${floating.map((p) => `${p.block}@${p.x},${p.y},${p.z}`).join(" ")}`);

const g = new Voxels([7, 23, 9]);
for (const p of plan.values()) g.set(p.x, p.y, p.z, p.block, p.state);
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170819.nbt");
console.log(`way_912170819: ${out.blocks} blocks, palette ${out.palette}`);
