// Lordaeron house, second generation: depth and detail by default, multi-storey with working stairs.
//
// A body of W x D (odd) is walled one block thick on its line; a RELIEF ring stands one block outside it on every face
// that isn't a party wall: posts and studs proud as logs, the daub recessed behind them, a proud sole plate and girts
// at every floor, stair sills under windows with flower pots, doors in a reveal under a hood, a chimney breast. The
// roof spans the ring (eaves over the relief) and steps on past the gables (verge slices), steep by default.
// Inside: a straight stair of `h` steps per storey along the east wall with a corridor beside it, the top step in the
// floor above; the hall (hearth, table, the trade's workstation) on the ground; chambers with beds above.
// Everything is in the base palette (stone); apply a palette with paletteMap.
import { Grid } from "../grid.mjs";

const B = {
  post: "dark_oak_log[axis=y]", beam: (ax) => `stripped_dark_oak_log[axis=${ax}]`, plinth: "cobblestone", floor: "spruce_planks",
  infill: "calcite", infill_ground: "stone_bricks", roof: "granite", chimney: "bricks",
  stair: (f, half = "bottom") => `granite_stairs[facing=${f},half=${half},shape=straight,waterlogged=false]`,
  slab: "granite_slab[type=bottom,waterlogged=false]",
  brace: (f) => `dark_oak_stairs[facing=${f},half=top,shape=straight,waterlogged=false]`,
  step: (f) => `spruce_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`,
  pane: (ax) => (ax === "x" ? "glass_pane[east=true,north=false,south=false,waterlogged=false,west=true]" : "glass_pane[east=false,north=true,south=true,waterlogged=false,west=false]"),
  door: (f, half, hinge = "left") => `spruce_door[facing=${f},half=${half},hinge=${hinge},open=false,powered=false]`,
};
const OUT = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] };
const FLOWERS = ["potted_red_tulip", "potted_cornflower", "potted_oxeye_daisy", "potted_allium"];

/**
 * p: { W, D, storeys, h (storey height, default 5), pitch (default 2), roof: "gable_x"|"gable_z", party: [west, east]
 *      (booleans: shared walls, no relief), trade (a block id, or "any"), beds (per chamber floor, default 3), shop }
 * Returns { grid, beds, workstations, entrance, size, origin } with the body at `origin` in the grid.
 */
export function house2(p) {
  const W = p.W, D = p.D, S = p.storeys, h = p.h || 5, pitch = p.pitch || 2, party = p.party || [false, false];
  const rw = party[0] ? 0 : 1, re = party[1] ? 0 : 1;                       // relief west / east (0 on a party wall)
  const span = (p.roof === "gable_x" ? D : W) + 2, m = (span - 1) / 2, layers = m * pitch + 1;
  const GW = W + rw + re, GD = D + 2, roofBase = 2 + h * S;
  const g = new Grid([GW, roofBase + layers + 2, GD]);
  const bx = rw, bz = 1;                                                    // the body's north-west corner
  const X = (x) => bx + x, Z = (z) => bz + z;
  const c = (W - 1) / 2, beds = [], workstations = [];
  const set = (x, y, z, s) => g.set(X(x), y, Z(z), s);

  // foundation under the body and its ring
  for (let x = -rw; x < W + re; x++) for (let z = -1; z <= D; z++) { set(x, 0, z, B.plinth); set(x, 1, z, B.plinth); }

  // the faces: each a list of wall positions with the outward direction
  const faces = [
    { name: "front", out: "south", cells: [...Array(W).keys()].map((x) => [x, D - 1]), ax: "x" },
    { name: "back", out: "north", cells: [...Array(W).keys()].map((x) => [x, 0]), ax: "x" },
    { name: "west", out: "west", cells: [...Array(D).keys()].map((z) => [0, z]), ax: "z", party: party[0] },
    { name: "east", out: "east", cells: [...Array(D).keys()].map((z) => [W - 1, z]), ax: "z", party: party[1] },
  ];
  const chimneyZ = Math.floor(D / 2);                                       // the hearth: west wall, middle
  const inward = { south: "north", north: "south", east: "west", west: "east" };

  for (let s = 0; s < S; s++) {
    const gy = 2 + h * s, ground = s === 0, infill = ground ? B.infill_ground : B.infill;
    // floor (the stairwell holes are cut later)
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) set(x, gy, z, B.floor);
    for (const f of faces) {
      const L = f.cells.length;
      f.cells.forEach(([x, z], i) => {
        const corner = i === 0 || i === L - 1;
        if (corner && (f.name === "west" || f.name === "east")) return;      // corners belong to front and back
        const kind = columnKind(f, i, L, ground, p, { x, z, chimneyZ, c });
        // inner layer
        for (let y = gy; y < gy + h; y++) {
          let b;
          if (kind === "chimney") b = B.chimney;
          else if (kind === "post") b = B.post;
          else if (y === gy) b = B.beam(f.ax);                              // sill / girt
          else if (kind === "stud") b = B.post;
          else if (kind === "door") b = y === gy + 1 ? B.door(f.out, "lower") : y === gy + 2 ? B.door(f.out, "upper") : y === gy + 3 ? B.beam(f.ax) : infill;
          else if (kind === "window") b = y >= gy + 2 && y <= gy + h - 2 ? B.pane(f.ax) : infill;
          else if (kind === "shop") b = y >= gy + 2 && y <= gy + h - 2 ? B.pane(f.ax) : infill;
          else b = infill;
          set(x, y, z, b);
        }
        if (f.party) return;
        // relief layer, one block out
        const [dx, dz] = OUT[f.out], ox = x + dx, oz = z + dz;
        for (let y = gy; y < gy + h; y++) {
          let b = null;
          if (kind === "chimney") b = B.chimney;                           // the chimney breast
          else if (kind === "post") b = B.post;                             // corner posts stand proud
          else if (kind === "stud" && y > gy) b = `dark_oak_trapdoor[facing=${f.out},half=bottom,open=true,powered=false,waterlogged=false]`; // studs: boards on the daub
          else if (y === gy) b = "dark_oak_slab[type=bottom,waterlogged=false]"; // the sole plate / girt band: a half block, so no mob spawns on it
          else if ((kind === "window" || kind === "shop") && y === gy + 1) b = kind === "shop" ? "spruce_slab[type=top,waterlogged=false]" : B.brace(inward[f.out]); // a sill
          else if (kind === "window" && y === gy + 2 && ground && f.name === "front" && (x + z) % 2 === 0) b = FLOWERS[(x + s) % FLOWERS.length]; // window box
          else if (kind === "door" && y === gy + 3) b = B.brace(inward[f.out]);   // the door's hood
          else b = "air";                                                   // the daub recessed behind the frame
          set(ox, y, oz, b);
        }
      });
    }
    // relief corners: posts, girt bands
    for (const [cx, cz] of [[-1, -1], [W, -1], [-1, D], [W, D]]) {
      if ((cx < 0 && party[0]) || (cx >= W && party[1])) continue;
      for (let y = gy; y < gy + h; y++) set(cx, y, cz, y === gy ? "dark_oak_slab[type=bottom,waterlogged=false]" : "air"); // the band turns the corner; the post stays one wide
    }
    // party walls carry their relief to the front and back rings
    // room air
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) for (let y = gy + 1; y < gy + h; y++) set(x, y, z, "air");
  }

  // stairs: column sx = W-2 rising north from the front room's row, corridor at W-3; one run per storey below the top
  const sx = W - 2, run = h;                                               // h steps of 1 rise each
  const z0 = D - 2;
  for (let s = 0; s < S - 1; s++) {
    const gy = 2 + h * s;
    for (let k = 0; k < run; k++) set(sx, gy + 1 + k, z0 - k, B.step("north"));
    // headroom: open the floor above over the steps that need it (and the step-up clearance)
    for (let k = 0; k < run - 1; k++) { const top = gy + 2 + k + 1; if (top >= gy + h) set(sx, gy + h, z0 - k, "air"); }
    set(sx, gy + h, z0 - 1, "air");
    set(sx, gy + h, z0 - (run - 1), B.step("north"));                       // the top step, in the floor above
  }

  // fit-out, by storey
  const lantern = "lantern[hanging=true,waterlogged=false]";
  for (let s = 0; s < S; s++) {
    const gy = 2 + h * s, top = gy + h - 1;
    if (s === 0) {
      set(1, gy + 1, chimneyZ, "furnace[facing=east,lit=false]");          // the hearth under the chimney
      if (p.trade) {
        const at = [1, gy + 1, 1];
        set(...at, p.trade === "any" ? "air" : p.trade);
        workstations.push({ at: [X(at[0]), at[1], Z(at[2])], block: p.trade === "any" ? "any" : `minecraft:${p.trade.replace(/^minecraft:|\[.*$/g, "")}` });
      } else set(1, gy + 1, 1, "bookshelf");
      if (W >= 7) { set(2, gy + 1, 1, "crafting_table"); set(1, gy + 1, D - 2, "chest[facing=east,type=single,waterlogged=false]"); }
      if (S === 1) for (const bx2 of [1, W - 4 >= 2 ? W - 4 : 1]) { /* single storey: beds on the ground (not used by the candidates) */ }
    } else {
      // chambers: beds on the west side, aisle at x=2, corridor at W-3
      const slots = [[1, 1], [3, 1], [1, D - 3]].filter(([x]) => x < W - 3);
      for (const [x, z] of slots.slice(0, p.beds || 3)) {
        if (z + 1 >= D - 1) continue;
        set(x, gy + 1, z, "white_bed[facing=north,occupied=false,part=head]"); set(x, gy + 1, z + 1, "white_bed[facing=north,occupied=false,part=foot]");
        beds.push({ head: [X(x), gy + 1, Z(z)], foot: [X(x), gy + 1, Z(z + 1)] });
      }
      if (W >= 7 && D >= 7) set(3, gy + 1, D - 3, "chest[facing=west,type=single,waterlogged=false]");
    }
    set(2, top, Math.floor(D / 2), lantern);                                // over the aisle
    set(W - 3, top, Math.floor(D / 2), lantern);                            // over the corridor and stair
  }

  // roof: slices across `span` (the body plus its ring), steep; gable ends on the wall lines, verges outside
  const rx0 = -rw, rx1 = W - 1 + re;
  const slice = (kind, put) => {                                            // put(k = position across span, y, block)
    for (let k = 0; k < m; k++) for (let t = 0; t < pitch; t++) {
      const y = roofBase + k * pitch + t, last = t === pitch - 1;
      put(k, y, last ? "stair+" : B.roof); put(span - 1 - k, y, last ? "stair-" : B.roof);
      if (kind === "verge") continue;
      for (let i = k + 1; i < span - 1 - k; i++) {
        const isCentre = i === m;
        put(i, y, y === roofBase ? (kind === "gable" ? "tie" : B.floor) : kind === "gable" ? (isCentre ? B.post : B.infill) : B.floor);
      }
    }
    put(m, roofBase + m * pitch, B.slab);
  };
  if (p.roof === "gable_x") {
    for (let x = rx0; x <= rx1; x++) {
      const kind = x < 0 || x > W - 1 ? "verge" : x === 0 || x === W - 1 ? "gable" : "bay";
      slice(kind, (k, y, b) => set(x, y, k - 1, b === "stair+" ? B.stair("south") : b === "stair-" ? B.stair("north") : b === "tie" ? B.beam("z") : b));
    }
    for (const x of [rx0 - 0]) void x;
  } else {
    for (let z = -1; z <= D; z++) {
      const kind = z < 0 || z > D - 1 ? "verge" : z === 0 || z === D - 1 ? "gable" : "bay";
      slice(kind, (k, y, b) => set(k - rw, y, z, b === "stair+" ? B.stair("east") : b === "stair-" ? B.stair("west") : b === "tie" ? B.beam("x") : b));
    }
  }
  // gable verges get a bargeboard of brackets under the verge stairs at the eaves line
  // chimney stack: breast and flue column up through the roof, one above the ridge
  for (let y = roofBase; y <= roofBase + m * pitch + 1; y++) { set(0, y, chimneyZ, B.chimney); if (!party[0]) set(-1, y, chimneyZ, B.chimney); }

  const entrance = { at: [X(c), 3, Z(D - 1)], facing: "south", width: 1 };
  return { grid: g, beds, workstations, entrance, size: g.size, origin: [bx, 0, bz], body: [W, D], roofBase };
}

function columnKind(f, i, L, ground, p, { x, z, chimneyZ, c }) {
  if (i === 0 || i === L - 1) return "post";
  if (f.name === "west" && z === chimneyZ) return "chimney";
  const k = Math.abs(i - (L - 1) / 2);
  if (f.name === "front" || f.name === "back") {
    if (k === 0) return f.name === "front" && ground ? "door" : "stud";
    if (f.name === "front" && ground && k === 1 && L >= 7) return "stud";                // door jambs
    const kk = f.name === "front" && ground && L >= 7 ? k - 1 : k;
    const r = (kk - 1) % 3;
    if (r === 2) return "stud";
    if (f.name === "front" && ground && p.shop && Math.floor((kk - 1) / 3) === 0) return "shop";
    return r === 1 ? "window" : "panel";                                    // one window a bay, daub beside it
  }
  // sides: studs every third from the corners, windows in the middle panels upstairs
  const d = Math.min(i, L - 1 - i);
  if (d % 3 === 0) return "stud";
  if (f.party) return "panel";
  return !ground && d % 3 === 1 ? "window" : "panel";
}
