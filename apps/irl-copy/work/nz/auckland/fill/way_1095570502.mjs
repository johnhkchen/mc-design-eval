// way 1095570502: a two-storey Edwardian brick shop-house (c.1910) on a 23-cell stepped footprint, flat lidar roof at 10.
// Front (north face) has a shopfront with a central door and a dark timber fascia, a smooth-quartz string course and
// cornice, a stone-brick plinth, a parapet cap, and a small roof plant room. Upper windows are alternate bays of glass
// panes; glowstone and lanterns sit in the air gap behind the glass where a real interior cell is there.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570502.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570502.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ROOF = cells[0][3];
if (cells.some(([, , g, r]) => g !== 0 || r !== ROOF)) throw new Error("expected flat ground 0 and one roof height");

const P = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => P.has(`${x},${z}`);
// [dx, dz, facing] for north, east, south, west
const DIRS = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const edge = (x, z) => exposed(x, z).length > 0;

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { x, y, z, block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

const deck = ROOF - 1;     // roof deck layer; the parapet cap sits on it at ROOF
const cornice = ROOF - 2;  // quartz cornice band under the roof deck
const sill = 4;            // floor slab / string course between the storeys

for (const [x, z] of cells) {
  const isEdge = edge(x, z);
  const north = exposed(x, z).some(([, dz, f]) => f === "north");
  put(x, 0, z, "stone_bricks");                        // plinth and ground floor slab
  put(x, sill, z, isEdge ? "smooth_quartz" : "smooth_stone");
  put(x, deck, z, "smooth_stone");                     // roof deck over the whole footprint

  if (!isEdge) continue;                               // interiors stay air between the floors (no furnishings)

  for (let y = 1; y <= 3; y++) {                       // ground storey, commercial
    if (north) {
      if (x === 2 && z === 0) put(x, y, z, "dark_oak_planks");   // door cell (set below), fascia above
      else if (x % 2 === 1 && y <= 2) put(x, y, z, "glass_pane");
      else put(x, y, z, y === 3 ? "dark_oak_planks" : "bricks");
    } else {
      put(x, y, z, (x + z) % 2 === 0 && y <= 2 ? "glass_pane" : "bricks");
    }
  }
  if (north) put(x, sill, z, "dark_oak_slab", { type: "top", waterlogged: "false" });   // shopfront awning ledge
  for (let y = 5; y <= 7; y++) put(x, y, z, (x + z) % 2 === 1 ? "glass_pane" : "bricks");   // upper bays
  put(x, cornice, z, "smooth_quartz");
  put(x, ROOF, z, "smooth_quartz");                    // parapet cap
}

// the entrance: a dark oak door in the middle of the north shopfront
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(2, 1, 0, "dark_oak_door", door("lower"));
put(2, 2, 0, "dark_oak_door", door("upper"));

// warm light in the air gap behind the glass, only where the cell behind is a real interior cell
for (const [x, z] of cells) {
  if (!edge(x, z)) continue;
  const out = exposed(x, z)[0];
  if (!out) continue;
  const ix = x - out[0], iz = z - out[1];
  if (!has(ix, iz) || edge(ix, iz)) continue;
  const glass = at(x, 6, z)?.block === "glass_pane" ? 6 : at(x, 2, z)?.block === "glass_pane" ? 2 : null;
  if (glass === 6) put(ix, 5, iz, "glowstone");   // stands on the floor slab, behind the lower pane
  if (glass === 2) put(ix, 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// rooftop plant room on two interior roof cells
for (const [x, z] of [[6, 3], [7, 3]]) {
  put(x, ROOF, z, "stone_bricks");
  put(x, ROOF + 1, z, "stone_bricks");
}

// glass panes connect to any neighbouring block in the same layer, as the game would set them
const connect = (x, y, z) => {
  const s = {};
  for (const [dx, dz, f] of DIRS) {
    const n = at(x + dx, y, z + dz);
    s[f] = String(!!n && !["lantern", "dark_oak_door"].includes(n.block));
  }
  return s;
};
for (const e of plan.values()) if (e.block === "glass_pane") e.state = { ...connect(e.x, e.y, e.z), waterlogged: "false" };

// every block above the ground rests on something: a wall course on the course below, a floor or deck slab on the
// perimeter ring it spans from (the interiors are air, as in the brief), a lantern hangs from the floor above
const spansRing = (e) => (e.y === sill || e.y === deck) && cells.some(([x, z]) => edge(x, z) && at(x, e.y, z));
const floating = [...plan.values()].filter((e) => e.y > 0 && e.block !== "lantern"
  && !at(e.x, e.y - 1, e.z) && !spansRing(e));
if (floating.length) throw new Error(`floating blocks: ${floating.map((e) => `${e.x},${e.y},${e.z} ${e.block}`).join("; ")}`);

const g = new Voxels([9, 23, 5]);
for (const e of plan.values()) g.set(e.x, e.y, e.z, e.block, e.state);
const stats = g.save(OUT);
console.log(JSON.stringify({ file: OUT, ...stats, footprint: cells.length, roof: ROOF }));
