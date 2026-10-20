// SPDX-License-Identifier: AGPL-3.0-or-later
// Helpers for MarketFront and the Hillclimb Landing (plan.md VOCABULARY, one function per name).
// Every helper takes its position as arguments and writes only inside its own footprint, only into air: a cell that
// already holds a block is skipped and counted, never overwritten (an earlier part owns it). Each returns { placed, skipped }.
// Stone-bearing helpers take ground (a number, or (x, z) => y) and inside (x, z) => bool to clip to the footprint.
import { B, plaque as toolkitPlaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// A writer for one footprint box { x0, x1, y0, y1, z0, z1 }: put() writes into air inside the box, counts the rest.
function writer(g, box) {
  const w = { placed: 0, skipped: 0 };
  const inside = (x, y, z) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1 && z >= box.z0 && z <= box.z1;
  w.put = (x, y, z, block, state, nbt) => {
    if (!inside(x, y, z) || !g.isAir(x, y, z)) { w.skipped++; return; }
    g.set(x, y, z, block, state, nbt);
    w.placed++;
  };
  return w;
}
const report = (w) => ({ placed: w.placed, skipped: w.skipped });
// Glass pane connection states along a run of cells on z: connect to the neighbours inside [a, b].
const runZ = (z, a, b) => ({ north: String(z > a), south: String(z < b), east: "false", west: "false" });

/** One solid tier: body (stone_bricks) from the ground up to deck-1, polished_andesite cap course at deck-1 on the face
 *  edges, smooth_stone deck layer at y = deck. Fills down from the base to ground, so nothing floats. */
export function tierMass(g, { x0, x1, z0, z1, deck, body = "stone_bricks", ground = 0, inside = () => true }) {
  const low = typeof ground === "function" ? ground : () => ground;
  let y0 = deck;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (inside(x, z)) y0 = Math.min(y0, low(x, z));
  const w = writer(g, { x0, x1, y0, y1: deck, z0, z1 });
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inside(x, z)) continue;
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    for (let y = deck - 1; y >= low(x, z); y--) w.put(x, y, z, edge && y === deck - 1 ? "polished_andesite" : body);
    w.put(x, deck, z, "smooth_stone");
  }
  return report(w);
}

/** A stripped spruce post from y0 to y1 (inclusive), axis y. */
export function timberPost(g, { x, z, y0, y1 }) {
  const w = writer(g, { x0: x, x1: x, y0, y1, z0: z, z1: z });
  for (let y = y0; y <= y1; y++) w.put(x, y, z, "stripped_spruce_log", { axis: "y" });
  return report(w);
}

/** One 7-long balcony bay on the west face of the housing: x-2..x-1 a top smooth_stone_slab floor at F, a glass_pane rail
 *  at F+1 on the outer edge, open spruce_trapdoor screens at both bay ends, a spruce_door (both halves) in the wall at
 *  F+1..F+2, and a 3 x 2 glass_pane window set one IN from the wall (x+1) at F+2..F+3. x is the wall's face line (42). */
export function balconyBay(g, { z0, F, x = 42 }) {
  const z1 = z0 + 6;
  const w = writer(g, { x0: x - 2, x1: x + 1, y0: F, y1: F + 3, z0, z1 });
  for (let z = z0; z <= z1; z++) {
    for (const bx of [x - 2, x - 1]) w.put(bx, F, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    w.put(x - 2, F + 1, z, "glass_pane", runZ(z, z0, z1));
  }
  for (const z of [z0, z1]) for (const y of [F + 1, F + 2]) w.put(x - 1, y, z, ...B.trapdoor("spruce", "west", "bottom", true));
  w.put(x, F + 1, z0 + 1, ...B.door("spruce", "west", "lower", "left"));
  w.put(x, F + 2, z0 + 1, ...B.door("spruce", "west", "upper", "left"));
  for (const y of [F + 2, F + 3]) for (let z = z0 + 2; z <= z0 + 4; z++) w.put(x + 1, y, z, "glass_pane", runZ(z, z0 + 2, z0 + 4));
  return report(w);
}

/** A market stall shed front on the east face (x1): spruce posts every 4 along z from y floor+1 to floor+4, a spruce_slab
 *  awning (top half) at floor+5 one block out (x1+1), red and white carpets alternating every 2 cells on it at floor+6,
 *  and a hanging lantern under each bay (hung from the awning). floor is the shed's floor deck (31). */
export function awningStall(g, { x0, x1, z0, z1, floor = 31 }) {
  const e = x1 + 1;
  const w = writer(g, { x0, x1: e, y0: floor + 1, y1: floor + 6, z0, z1 });
  for (let z = z0; z <= z1; z += 4) for (let y = floor + 1; y <= floor + 4; y++) w.put(x1, y, z, "stripped_spruce_log", { axis: "y" });
  for (let z = z0; z <= z1; z++) {
    w.put(e, floor + 5, z, "spruce_slab", { type: "top", waterlogged: "false" });
    w.put(e, floor + 6, z, Math.floor((z - z0) / 2) % 2 === 0 ? "red_carpet" : "white_carpet");
  }
  for (let z = z0 + 2; z <= z1; z += 4) w.put(e, floor + 4, z, ...B.lantern(true));
  return report(w);
}

/** A raised planter bed: a smooth_stone rim ring at y, moss_block/grass_block soil at y inside it, and plants at y+1
 *  (azalea, flowering_azalea, short_grass in a pattern). tree: an oak trunk (3 logs, y+1..y+3) in the centre with a
 *  persistent oak_leaves crown (radius 2, narrowing to 1 at the top) at y+3..y+5. The bed is at least 5 wide for a tree. */
export function planterBed(g, { x0, x1, z0, z1, y = 29, tree = false }) {
  const w = writer(g, { x0, x1, y0: y, y1: tree ? y + 5 : y + 1, z0, z1 });
  const cx = Math.floor((x0 + x1) / 2), cz = Math.floor((z0 + z1) / 2);
  const rim = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (rim(x, z)) { w.put(x, y, z, "smooth_stone"); continue; }
    w.put(x, y, z, (x + z) % 3 === 0 ? "moss_block" : "grass_block");
    if (tree && x === cx && z === cz) continue;
    const k = ((x - x0) + 2 * (z - z0)) % 5;
    if (k === 0) w.put(x, y + 1, z, "azalea");
    else if (k === 1) w.put(x, y + 1, z, "flowering_azalea");
    else if (k === 2 || k === 3) w.put(x, y + 1, z, "short_grass");
  }
  if (tree) {
    for (let ty = y + 1; ty <= y + 3; ty++) w.put(cx, ty, cz, "oak_log", { axis: "y" });
    for (let ly = y + 3; ly <= y + 5; ly++) {
      const r = ly === y + 5 ? 1 : 2;
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        if (dx * dx + dz * dz > r * r || (dx === 0 && dz === 0 && ly <= y + 3)) continue;
        w.put(cx + dx, ly, cz + dz, "oak_leaves", { distance: "7", persistent: "true" });
      }
    }
  }
  return report(w);
}

/** The bronze pig "Billie", anchored at its snout column x (head, x..x+4 long, z..z+1 wide, y..y+3 high): four waxed cut
 *  copper stair feet at y, a waxed copper body at x+1..x+3 y+1..y+2, a waxed copper head column at x (snout stairs facing
 *  west at y+1, the head block at y+2), two waxed cut copper slab ears on the head at y+3, a tail stair at x+4 y+2. */
export function bronzePig(g, { x = 99, z = 170, y = 29 } = {}) {
  const w = writer(g, { x0: x, x1: x + 4, y0: y, y1: y + 3, z0: z, z1: z + 1 });
  for (const fx of [x + 1, x + 3]) for (const fz of [z, z + 1]) w.put(fx, y, fz, ...B.stairs("waxed_cut_copper", "south", "bottom"));
  for (let bx = x + 1; bx <= x + 3; bx++) for (const bz of [z, z + 1]) for (const by of [y + 1, y + 2]) w.put(bx, by, bz, "waxed_copper_block");
  for (const hz of [z, z + 1]) {
    w.put(x, y + 1, hz, ...B.stairs("waxed_cut_copper", "west", "bottom"));
    w.put(x, y + 2, hz, "waxed_copper_block");
    w.put(x, y + 3, hz, ...B.slab("waxed_cut_copper", "top"));
  }
  w.put(x + 4, y + 2, z, ...B.stairs("waxed_cut_copper", "east", "bottom"));
  return report(w);
}

/** A built-up terrace: polished_andesite from the ground up to deck-1 (solid, so nothing floats), smooth_stone deck at
 *  y = deck, a row of smooth_stone_slab seats at deck+1 along the inner x0+1 edge, and andesite_wall rail posts at
 *  deck+1 on the box's corners and every 10 along its edges. box = { x0, x1, z0, z1 }. */
export function terraceMass(g, { box, deck, ground = 0, inside = () => true }) {
  const { x0, x1, z0, z1 } = box, low = typeof ground === "function" ? ground : () => ground;
  let y0 = deck;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (inside(x, z)) y0 = Math.min(y0, low(x, z));
  const w = writer(g, { x0, x1, y0, y1: deck + 1, z0, z1 });
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inside(x, z)) continue;
    for (let y = deck - 1; y >= low(x, z); y--) w.put(x, y, z, "polished_andesite");
    w.put(x, deck, z, "smooth_stone");
    if (x === x0 + 1 && z > z0 && z < z1) w.put(x, deck + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    const post = corner || ((x === x0 || x === x1) && (z - z0) % 10 === 0) || ((z === z0 || z === z1) && (x - x0) % 10 === 0);
    if (post) w.put(x, deck + 1, z, "andesite_wall", { up: "true" });
  }
  return report(w);
}

/** Lettering on a dark gray_concrete board with white_concrete letters, on the wall at `at` (the wall cell; width runs
 *  along the wall, height up). Wraps the toolkit plaque. Air only by default: the board style recolours the wall it
 *  sits on, so that needs replace: true (the ET sign on its west face is the one that does). */
export function plaque(g, text, { face, at, width, height, replace = false }) {
  const avoid = replace ? undefined : (p) => !g.isAir(...p);
  const r = toolkitPlaque(g, text, { face, at, width, height, material: "gray_concrete", letter: "white_concrete", frame: null, avoid });
  return { placed: r.cells, skipped: r.skipped, notes: r.notes };
}
