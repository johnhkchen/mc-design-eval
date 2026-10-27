// Lordaeron house, third generation: on the agreed 1 + 2 grid (posts 1, bays 2, storey 5, relief 1), so a body is
// 3n + 1 wide and deep (7, 10, 13) and the golden houses can be cut into the WFC modules exactly.
//
// Every face is posts and 2-wide bays. A bay's detail follows the room behind it (the plan): a chamber or the hall
// takes a window pair with stair sills (and window boxes on the street front), the stair core takes a single landing
// window, a store a plain daub bay, the hearth the chimney breast. The front's ground storey has one door bay: a door
// and a sidelight, either hand. Relief: corner posts proud as logs, inner posts as dark boards on the daub, a half-slab
// girt band at every floor, the daub between. A party wall (terraces) has no relief.
// Stair cores: "straight" (2 x 5: a run of 5 along the east interior wall with a corridor beside it) for bodies 7+ deep;
// "turned" (3 x 3: up 3 north, a corner stair, then 2 east, the top step in the floor above) for 7 x 7 terrace units.
import { Grid } from "../grid.mjs";

const B = {
  post: "dark_oak_log[axis=y]", beam: (ax) => `stripped_dark_oak_log[axis=${ax}]`, plinth: "cobblestone", floor: "spruce_planks",
  infill: "calcite", infill_ground: "stone_bricks", roof: "granite", chimney: "bricks",
  rstair: (f) => `granite_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`,
  slab: "granite_slab[type=bottom,waterlogged=false]",
  sill: (f) => `dark_oak_stairs[facing=${f},half=top,shape=straight,waterlogged=false]`,
  board: (f) => `dark_oak_trapdoor[facing=${f},half=bottom,open=true,powered=false,waterlogged=false]`,
  band: "dark_oak_slab[type=bottom,waterlogged=false]",
  ledge: (f) => `spruce_trapdoor[facing=${f},half=top,open=false,powered=false,waterlogged=false]`,
  step: (f, shape = "straight") => `spruce_stairs[facing=${f},half=bottom,shape=${shape},waterlogged=false]`,
  pane: (ax) => (ax === "x" ? "glass_pane[east=true,north=false,south=false,waterlogged=false,west=true]" : "glass_pane[east=false,north=true,south=true,waterlogged=false,west=false]"),
  door: (f, half, hinge) => `spruce_door[facing=${f},half=${half},hinge=${hinge},open=false,powered=false]`,
  lantern: "lantern[hanging=true,waterlogged=false]",
};
const potted = (f, behind, bay, s, cell, kind) => kind === "window" && f.name === "front" && behind !== "stair" && (bay + s) % 2 === 0 && cell === 0;
const OUT = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] };
const IN = { south: "north", north: "south", east: "west", west: "east" };
const FLOWERS = ["potted_red_tulip", "potted_cornflower", "potted_oxeye_daisy", "potted_allium", "potted_azure_bluet"];

/**
 * p: { W, D (3n+1), storeys, h (5), pitch (2), roof: gable_x|gable_z, party: [west, east], core: straight|turned,
 *      door: left|right (the door's hand in its bay), doorBay (index, default the bay west of centre), trade, shop,
 *      beds (per chamber floor) }
 */
export function house3(p) {
  const W = p.W, D = p.D, S = p.storeys, h = p.h || 5, pitch = p.pitch || 2, party = p.party || [false, false];
  if ((W - 1) % 3 || (D - 1) % 3) throw new Error(`body ${W} x ${D} is off the 1 + 2 grid (3n + 1)`);
  const rw = party[0] ? 0 : 1, re = party[1] ? 0 : 1;
  const span = (p.roof === "gable_x" ? D : W) + (p.roof === "gable_x" ? 2 : rw + re), roofBase = 2 + h * S;
  const m = Math.floor((span - 1) / 2), layers = m * pitch + 1;
  const g = new Grid([W + rw + re, roofBase + layers + 2, D + 2]);
  const X = (x) => x + rw, Z = (z) => z + 1, set = (x, y, z, s) => g.set(X(x), y, Z(z), s);
  const core = p.core || (D >= 7 && W >= 10 ? "straight" : "turned");
  const nb = (W - 1) / 3, doorBay = p.doorBay ?? Math.floor((nb - 1) / 2), hand = p.door || "right";
  const beds = [], workstations = [], plan = [];

  // the plan: which room is behind each interior cell, per storey (for `behind` and for the golden plan file)
  const coreCells = new Set();
  const inCore = (x, z) => coreCells.has(`${x},${z}`);
  if (core === "straight") for (let z = 1; z <= 5; z++) { coreCells.add(`${W - 2},${z}`); coreCells.add(`${W - 3},${z}`); }
  else for (let x = W - 4; x <= W - 2; x++) for (let z = 1; z <= 3; z++) coreCells.add(`${x},${z}`);
  const room = (s, x, z) => (inCore(x, z) ? "stair" : s === 0 ? "hall" : "chamber");

  // foundation under body and relief
  for (let x = -rw; x < W + re; x++) for (let z = -1; z <= D; z++) { set(x, 0, z, B.plinth); set(x, 1, z, B.plinth); }

  const faces = [
    { name: "front", out: "south", ax: "x", L: W, at: (i) => [i, D - 1], behind: (i) => [Math.min(Math.max(i, 1), W - 2), D - 2] },
    { name: "back", out: "north", ax: "x", L: W, at: (i) => [i, 0], behind: (i) => [Math.min(Math.max(i, 1), W - 2), 1] },
    { name: "west", out: "west", ax: "z", L: D, at: (i) => [0, i], behind: (i) => [1, Math.min(Math.max(i, 1), D - 2)], party: party[0] },
    { name: "east", out: "east", ax: "z", L: D, at: (i) => [W - 1, i], behind: (i) => [W - 2, Math.min(Math.max(i, 1), D - 2)], party: party[1] },
  ];
  const chimneyZ = 3;                                                       // a post line on every 7+ deep side

  for (let s = 0; s < S; s++) {
    const gy = 2 + h * s, ground = s === 0, infill = ground ? B.infill_ground : B.infill;
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) { set(x, gy, z, B.floor); for (let y = gy + 1; y < gy + h; y++) set(x, y, z, "air"); }
    const rows = [];
    for (const f of faces) {
      for (let i = 0; i < f.L; i++) {
        const corner = i === 0 || i === f.L - 1;
        if (corner && (f.name === "west" || f.name === "east")) continue;
        const [x, z] = f.at(i), isPost = i % 3 === 0, bay = Math.floor(i / 3), cell = (i % 3) - 1;
        const [bx, bz] = f.behind(i), behind = room(s, bx, bz);
        let kind;
        if (corner) kind = "corner";
        else if (f.name === "west" && !party[0] && i === chimneyZ && D >= 7) kind = "chimney";
        else if (isPost) kind = "post";
        else if (f.name === "front" && ground && bay === doorBay) kind = (cell === 1) === (hand === "right") ? "door" : "sidelight";
        else if (f.party) kind = "plain";
        else if (behind === "stair") kind = cell === 0 ? "window" : "plain";             // a single landing window
        else if (ground && f.name !== "front" && f.name !== "back") kind = cell === 0 ? "window" : "plain";
        else if (ground && p.shop && f.name === "front") kind = "shop";
        else kind = "window";                                                              // chamber or hall: a window pair
        rows.push({ f, i, x, z, kind, behind });
        // the wall layer
        for (let y = gy; y < gy + h; y++) {
          let b;
          if (kind === "chimney") b = B.chimney;
          else if (kind === "corner") b = B.post;
          else if (y === gy) b = B.beam(f.ax);
          else if (kind === "post") b = B.post;
          else if (kind === "door") b = y === gy + 1 ? B.door(f.out, "lower", hand === "right" ? "left" : "right") : y === gy + 2 ? B.door(f.out, "upper", hand === "right" ? "left" : "right") : y === gy + 3 ? B.beam(f.ax) : infill;
          else if (kind === "window" || kind === "sidelight") b = y >= gy + 2 && y <= gy + h - 2 ? B.pane(f.ax) : infill;
          else if (kind === "shop") b = y >= gy + 2 && y <= gy + h - 2 ? B.pane(f.ax) : infill;
          else b = infill;
          set(x, y, z, b);
        }
        if (f.party) continue;
        // the relief layer
        const [dx, dz] = OUT[f.out], ox = x + dx, oz = z + dz;
        for (let y = gy; y < gy + h; y++) {
          let b;
          if (kind === "chimney") b = B.chimney;                                           // the breast
          else if (kind === "corner") b = B.post;                                          // corner posts proud
          else if (y === gy) b = B.band;                                                   // the girt band
          else if (kind === "post") b = B.board(f.out);                                    // inner posts: boards on the daub
          else if ((kind === "window" || kind === "sidelight") && y === gy + 1) b = potted(f, behind, bay, s, cell, kind) ? B.sill(IN[f.out]) : B.ledge(f.out); // a stair sill under a window box, a thin ledge elsewhere (no mob spawns on it)
          else if (kind === "shop" && y === gy + 1) b = "spruce_slab[type=top,waterlogged=false]";  // the shop counter
          else if (y === gy + 2 && potted(f, behind, bay, s, cell, kind)) b = FLOWERS[(bay + s) % FLOWERS.length];
          else if (kind === "door" && y === gy + 3) b = B.sill(IN[f.out]);                  // the hood
          else b = "air";
          set(ox, y, oz, b);
        }
      }
    }
    // the band turns the outside corners
    for (const [cx, cz] of [[-1, -1], [W, -1], [-1, D], [W, D]]) if (!((cx < 0 && party[0]) || (cx >= W && party[1]))) for (let y = gy; y < gy + h; y++) set(cx, y, cz, y === gy ? B.band : "air");
    plan.push(rows.length);
  }

  // stair cores, one run per storey below the top
  const holes = [], steps = [];
  for (let s = 0; s < S - 1; s++) {
    const gy = 2 + h * s, up = gy + h;
    if (core === "straight") {
      const sx = W - 2;
      for (let k = 0; k < 5; k++) steps.push([sx, gy + 1 + k, 5 - k, B.step("north")]);
      for (const z of [4, 3, 2]) holes.push([sx, up, z]);
    } else {
      const x0 = W - 4;                                                    // up 3 north, a corner, 2 east
      steps.push([x0, gy + 1, 3, B.step("north")], [x0, gy + 2, 2, B.step("north")], [x0, gy + 3, 1, B.step("east", "outer_left")],
        [x0 + 1, gy + 4, 1, B.step("east")], [x0 + 2, gy + 5, 1, B.step("east")]);
      holes.push([x0, up, 1], [x0, up, 2], [x0 + 1, up, 1]);
    }
  }
  for (const [x, y, z] of holes) set(x, y, z, "air");
  for (const [x, y, z, b] of steps) set(x, y, z, b);

  // fit-out
  const bedSlots = core === "straight" ? [[1, 1], [3, 1], [1, 4], [3, 4], [5, 1], [5, 4]] : [[1, 1], [2, 1]];
  for (let s = 0; s < S; s++) {
    const gy = 2 + h * s, top = gy + h - 1;
    if (s === 0) {
      const backHearth = party[0] || D < 7;                             // on a party wall the hearth sits in the back corner
      set(1, gy + 1, backHearth ? 1 : chimneyZ, "furnace[facing=east,lit=false]");
      const ws = backHearth ? [2, gy + 1, 1] : [1, gy + 1, 1];
      if (p.trade) { set(...ws, p.trade === "any" ? "air" : p.trade); workstations.push({ at: [X(ws[0]), ws[1], Z(ws[2])], block: p.trade === "any" ? "any" : `minecraft:${p.trade.replace(/^minecraft:|\[.*$/g, "")}` }); }
      else set(...ws, "bookshelf");
      if (W >= 10 && !backHearth) set(2, gy + 1, 1, "crafting_table");
    } else {
      let n = 0;
      for (const [x, z] of bedSlots) {
        if (n >= (p.beds || (core === "straight" ? 3 : 2))) break;
        if (x >= W - 1 || z + 1 >= D - 1 || inCore(x, z) || inCore(x, z + 1)) continue;
        set(x, gy + 1, z, "white_bed[facing=north,occupied=false,part=head]"); set(x, gy + 1, z + 1, "white_bed[facing=north,occupied=false,part=foot]");
        beds.push({ head: [X(x), gy + 1, Z(z)], foot: [X(x), gy + 1, Z(z + 1)] }); n++;
      }
    }
    // light: a lantern over the room and one over the stair, from the ceiling
    set(2, top, D - 2, B.lantern);
    if (core === "straight") set(W - 3, top, 3, B.lantern); else set(W - 3, top, 2, B.lantern);
    if (W >= 10) { set(5, top, 3, B.lantern); set(2, top, 2, B.lantern); }
  }

  // roof over the relief: gable ends on the walls, verges outside, steep
  const slice = (kind, put) => {
    for (let k = 0; k < m; k++) for (let t = 0; t < pitch; t++) {
      const y = roofBase + k * pitch + t, last = t === pitch - 1;
      put(k, y, last ? "+" : B.roof); put(span - 1 - k, y, last ? "-" : B.roof);
      if (kind === "verge") continue;
      for (let i = k + 1; i < span - 1 - k; i++) put(i, y, y === roofBase ? (kind === "gable" ? "tie" : B.floor) : kind === "gable" ? (Math.abs(i - (span - 1) / 2) < 1 ? B.post : B.infill) : B.floor);
    }
    for (let i = m; i < span - m; i++) put(i, roofBase + m * pitch, B.slab);   // the ridge: one or two wide
  };
  if (p.roof === "gable_x") {
    for (let x = -rw; x < W + re; x++) {
      const kind = x < 0 || x >= W ? "verge" : x === 0 || x === W - 1 ? (party[x === 0 ? 0 : 1] ? "bay" : "gable") : "bay";
      slice(kind, (k, y, b) => set(x, y, k - 1, b === "+" ? B.rstair("south") : b === "-" ? B.rstair("north") : b === "tie" ? B.beam("z") : b));
    }
  } else {
    for (let z = -1; z <= D; z++) {
      const kind = z < 0 || z >= D ? "verge" : z === 0 || z === D - 1 ? "gable" : "bay";
      slice(kind, (k, y, b) => set(k - rw, y, z, b === "+" ? B.rstair("east") : b === "-" ? B.rstair("west") : b === "tie" ? B.beam("x") : b));
    }
  }
  // the chimney stack: breast and flue up through the roof, one above the ridge
  const cz = !party[0] && D >= 7 ? chimneyZ : 1;
  for (let y = roofBase; y <= roofBase + m * pitch + 1; y++) { set(0, y, cz, B.chimney); if (!party[0]) set(-1, y, cz, B.chimney); }

  const doorX = doorBay * 3 + 1 + (hand === "right" ? 1 : 0);
  // the room plan per storey, interior cells north to south: S stair core, H hall, C chamber, b bed, h hearth, w workstation
  const rooms = [];
  for (let s2 = 0; s2 < S; s2++) {
    const gy = 2 + h * s2, rows = [];
    for (let z = 1; z < D - 1; z++) {
      let row = "";
      for (let x = 1; x < W - 1; x++) {
        const b = g.get(X(x), gy + 1, Z(z)) || "";
        row += /_bed/.test(b) ? "b" : /furnace/.test(b) ? "h" : inCore(x, z) ? "S" : workstations.some((w) => w.at[0] === X(x) && w.at[2] === Z(z) && w.at[1] === gy + 1) ? "w" : s2 === 0 ? "H" : "C";
      }
      rows.push(row);
    }
    rooms.push({ storey: s2, floor_y: gy, rows });
  }
  return { grid: g, beds, workstations, rooms, entrance: { at: [X(doorX), 3, Z(D - 1)], facing: "south", width: 1 },
    size: g.size, body: [W, D], relief: [rw, re], core, roofBase };
}

/** A terrace of 7 x 7 units on G1: party walls between, relief at the ends and on front and back. */
export function terrace3(p) {
  const n = p.units, W = 7, unitStep = W - 1, total = unitStep * n + 1;
  const parts = [];
  for (let u = 0; u < n; u++) parts.push(house3({ ...p, W, D: 7, core: "turned", roof: "gable_x", party: [u > 0, u < n - 1], door: u % 2 ? "left" : "right" }));
  const H = Math.max(...parts.map((r) => r.size[1])), g = new Grid([total + 2, H, 9]);
  const beds = [], entrances = [];
  let ox = 0;
  parts.forEach((r, u) => {
    const shift = u === 0 ? 0 : 1 + u * unitStep;                        // the first unit carries the west relief column
    g.paste(r.grid, shift, 0, 0);
    beds.push(...r.beds.map((b) => ({ head: [b.head[0] + shift, b.head[1], b.head[2]], foot: [b.foot[0] + shift, b.foot[1], b.foot[2]] })));
    entrances.push({ ...r.entrance, at: [r.entrance.at[0] + shift, r.entrance.at[1], r.entrance.at[2]] });
    ox = shift;
  });
  g.size[0] = Math.max(...[...g.each()].map(([x]) => x)) + 1;
  return { grid: g, beds, workstations: [], entrances, size: g.size };
}
