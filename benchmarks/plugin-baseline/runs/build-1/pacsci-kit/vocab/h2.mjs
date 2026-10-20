// Pacific Science Center vocabulary, second set (plan.md VOCABULARY). Each helper takes its position (and facing) as
// arguments and writes only inside its own footprint, only into air. A refused write is returned, never forced.
// Nothing is written at y 0 (the given ground); y 1 is the courtyard floor, which the paving leaves empty where a
// reserved part stands. States are the 1.21.1 ones (mcd states).
import { DIRS, OPPOSITE, arch, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Direction vectors: [x, z] along the face line, and the inward way (away from the face, into the building).
const ALONG = { north: [1, 0], south: [1, 0], east: [0, 1], west: [0, 1] };
const inward = (face) => [DIRS[OPPOSITE[face]][0], DIRS[OPPOSITE[face]][2]];
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const dirOf = ([x, z]) => NAME[`${x},${z}`];
const ALONG_NAMES = { north: ["east", "west"], south: ["east", "west"], east: ["north", "south"], west: ["north", "south"] };

// Glass pane connections: along the face line always, plus one extra side when it stands against a solid block.
const paneState = (face, side) => {
  const on = [...ALONG_NAMES[face], ...(side ? [side] : [])];
  return Object.fromEntries(["north", "east", "south", "west"].map((d) => [d, on.includes(d) ? "true" : "false"]));
};

// A view of the grid that accepts a write only inside the box spanned by p and q, only into air, and at y >= 1.
// Reads pass straight through, so brushes that look at the grid still work. Refused writes land in the returned list.
function gate(g, p, q) {
  const lo = p.map((v, i) => Math.min(v, q[i])), hi = p.map((v, i) => Math.max(v, q[i]));
  const refused = [];
  const view = new Proxy(g, {
    get(t, k) {
      if (k === "refused") return refused;
      if (k === "set") return (x, y, z, block, state, nbt) => {
        const inside = x >= lo[0] && x <= hi[0] && y >= Math.max(1, lo[1]) && y <= hi[1] && z >= lo[2] && z <= hi[2];
        if (inside && t.isAir(x, y, z)) t.set(x, y, z, block, state, nbt);
        else refused.push([x, y, z, block]);
        return view;
      };
      const v = Reflect.get(t, k);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
  return [view, refused];
}

const stairs = (block, facing, half = "bottom") => [block, { facing, half, shape: "straight", waterlogged: "false" }];
const post = { axis: "y" };

/**
 * Pointed lancet in a lattice panel. cell: [x, z] of the outer (panel-plane) cell; face: the way the wall faces.
 * The lancet is recessed one cell: y0..y1-1 is the opening (air, or a pane when glazed), its back is calcite one cell
 * inward, and the top cell at y1 is an upside-down stair facing into the wall. Footprint: the two columns, y0..y1.
 */
export function lancet(g, cell, face, y0, y1, glazed = false) {
  const into = inward(face), back = [cell[0] + into[0], cell[1] + into[1]];
  const [w, refused] = gate(g, [cell[0], y0, cell[1]], [back[0], y1, back[1]]);
  const opening = glazed ? ["gray_stained_glass_pane", paneState(face, dirOf(into))] : ["air"];
  for (let y = y0; y < y1; y++) {
    w.set(cell[0], y, cell[1], ...opening);
    w.set(back[0], y, back[1], "calcite");
  }
  w.set(cell[0], y1, cell[1], ...stairs("smooth_quartz_stairs", dirOf(into), "top"));
  return refused;
}

/**
 * Open pointed-arch arcade bay, 3 deep, on a courtyard face. at: [x, z] of the pier on the face line (depth 0);
 * the bay is 4 cells along the face (pier + three-wide opening) and `depth` deep, with the back screen at depth
 * `depth`. Piers y1..9, openings air y1..8 with upside-down stair shoulders at y7..8, spandrel white_concrete y9,
 * back screen gray_stained_glass_pane y1..7 and calcite y8..9. The shell leaves the screen cells as air.
 */
export function arcade_bay(g, face, [x, z], depth = 3) {
  const along = ALONG[face], into = inward(face);
  const cell = (a, d) => [x + a * along[0] + d * into[0], z + a * along[1] + d * into[1]];
  const P = (c, y) => [c[0], y, c[1]];
  const [w, refused] = gate(g, P(cell(0, 0), 1), P(cell(3, depth), 9));
  for (let y = 1; y <= 9; y++) w.set(...P(cell(0, 0), y), "quartz_pillar", post);
  const shoulderOut = [dirOf([-along[0], -along[1]]), dirOf(along)];
  for (let d = 0; d < depth; d++) {
    for (let a = 1; a <= 3; a++) for (let y = 1; y <= 6; y++) w.set(...P(cell(a, d), y), "air");
    for (const [a, facing] of [[1, shoulderOut[0]], [3, shoulderOut[1]]]) for (const y of [7, 8]) {
      w.set(...P(cell(a, d), y), ...stairs("smooth_quartz_stairs", facing, "top"));
    }
    w.set(...P(cell(2, d), 7), "air");
    w.set(...P(cell(2, d), 8), "air");
    for (let a = 1; a <= 3; a++) w.set(...P(cell(a, d), 9), "white_concrete");
  }
  for (let a = 0; a <= 3; a++) {
    for (let y = 1; y <= 7; y++) w.set(...P(cell(a, depth), y), "gray_stained_glass_pane", paneState(face));
    for (let y = 8; y <= 9; y++) w.set(...P(cell(a, depth), y), "calcite");
  }
  return refused;
}

/**
 * Pointed arch rib (the 2-wide curved frame above a leg pair), in the x-y plane, 1 thick in z. x0..x1 is the outer
 * span (the legs' outside edges), z its row, spring the y where the straight legs stop, crown the apex. The arch
 * brush builds the free-standing frame (voussoir ring, 2 thick, and stairs on the curve steps); its void is left air.
 */
export function arch_frame(g, { x0, x1, z, spring, crown }) {
  const [w, refused] = gate(g, [x0, spring, z], [x1, crown + 2, z]);
  arch(w, {
    at: [x0 + 2, spring, z], width: x1 - x0 + 1 - 4, height: crown - spring, depth: 1, axis: "x", profile: "pointed",
    rise: crown - spring, block: "smooth_quartz", carve: false, frame: { block: "smooth_quartz", thickness: 2 },
  });
  return refused;
}

/**
 * Hanging globe lamp under a cross tie at [x, y, z]: a 4-long chain under the tie, then a hanging lantern. The tie
 * must be solid (a lamp with nothing above it is refused whole).
 */
export function globe_lamp(g, x, y, z) {
  if (g.isAir(x, y, z)) return [[x, y, z, "tie missing: the lamp hangs from a block above"]];
  const [w, refused] = gate(g, [x, y - 5, z], [x, y - 1, z]);
  for (let k = 1; k <= 4; k++) w.set(x, y - k, z, "chain", { axis: "y" });
  w.set(x, y - 5, z, "lantern", { hanging: "true" });
  return refused;
}

/**
 * Fountain bowl centred on [cx, cz], 5x5, y1..4: a quartz pillar pedestal (y1..2), a saucer at y3 (stairs on the
 * edges facing the centre, slabs on the corners and the 3x3 middle), and a water source at y4 over the centre.
 */
export function fountain_bowl(g, cx, cz) {
  const [w, refused] = gate(g, [cx - 2, 1, cz - 2], [cx + 2, 4, cz + 2]);
  w.set(cx, 1, cz, "quartz_pillar", post);
  w.set(cx, 2, cz, "quartz_pillar", post);
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const x = cx + dx, z = cz + dz, edgeX = Math.abs(dx) === 2, edgeZ = Math.abs(dz) === 2;
    if (edgeX && edgeZ) w.set(x, 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    else if (edgeX || edgeZ) {
      const facing = dx === -2 ? "east" : dx === 2 ? "west" : dz === -2 ? "south" : "north";
      w.set(x, 3, z, ...stairs("smooth_quartz_stairs", facing));
    } else w.set(x, 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
  w.set(cx, 4, cz, "water");
  return refused;
}

/**
 * Promenade flight, 2 wide: columns x0..x0+1, one step per cell from z0 (the foot, y1) to z1 (the head), rising to the
 * south (facing south). Each step stands on smooth_quartz that fills down to the floor, so the flight is solid.
 */
export function promenade_stair(g, x0, z0, z1) {
  const n = z1 - z0 + 1;
  const [w, refused] = gate(g, [x0, 1, z0], [x0 + 1, n, z1]);
  for (let i = 0; i < n; i++) {
    const z = z0 + i, top = 1 + i;
    for (let x = x0; x <= x0 + 1; x++) {
      for (let y = 1; y < top; y++) w.set(x, y, z, "smooth_quartz");
      w.set(x, top, z, ...stairs("quartz_stairs", "south"));
    }
  }
  return refused;
}

/**
 * The name on the plaza face: one wall banner per letter, blue banners with white letters, on the column x, row y,
 * from z0 to z1. face is the way the board looks (the banners point that way, hung on the wall behind them).
 */
export function name_band(g, { x, y, z0, z1, face = "west", word = "PACIFIC SCIENCE CENTER" }) {
  const [w, refused] = gate(g, [x, y, z0], [x, y, z1]);
  bannerWord(w, word, { center: [x, y, Math.floor((z0 + z1) / 2)], face, base: "blue", letter: "white" });
  return refused;
}

/** Lamp post on a walk: quartz pillar y1..2 with a standing lantern on top at y3. One column. */
export function lamp_post(g, x, z) {
  const [w, refused] = gate(g, [x, 1, z], [x, 3, z]);
  w.set(x, 1, z, "quartz_pillar", post);
  w.set(x, 2, z, "quartz_pillar", post);
  w.set(x, 3, z, "lantern", { hanging: "false" });
  return refused;
}
