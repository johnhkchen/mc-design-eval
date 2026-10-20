// Ferry Building kit: seven helpers from plan.md VOCABULARY (voussoirArch, doorPair, balustrade, belfryStage, dome,
// skylight, hangLamp). Each takes its position as arguments and writes only its own footprint, only into air: a cell
// that is not air is refused and reported, never overwritten. Nothing is written below the helper's base row (the
// ground and floors belong to earlier parts). Every helper returns { placed: [[x,y,z]...], refused: [[x,y,z,block]...] }.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// A writer for one call: air-only, each cell at most once per call (corners shared by two faces are written once).
function writer(g) {
  const out = { placed: [], refused: [] };
  const done = new Set();
  const put = (x, y, z, block, state, nbt) => {
    const key = `${x},${y},${z}`;
    if (done.has(key)) return;
    done.add(key);
    if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) out.refused.push([x, y, z, block]);
    else { g.set(x, y, z, block, state, nbt); out.placed.push([x, y, z]); }
  };
  return { out, put };
}

/**
 * Round-headed opening with an upside-down stair ring and a keystone. The opening's outline is the arch: the curve starts
 * at row y0 (full width) and steps in one cell a row until the last ring row; quartz_bricks keystone on the top row.
 * The opening inside the ring is air the shell leaves; nothing is cut. width = outline span in x (even), rise = curve rows.
 */
export function voussoirArch(g, { x0, width, y0, z, rise = Math.floor(width / 2) }) {
  const { out, put } = writer(g);
  for (let k = 0; k < rise; k++) {
    const inset = Math.round((k * (width / 2)) / rise);
    const left = x0 + inset, right = x0 + width - 1 - inset;
    if (left >= right) break;
    put(left, y0 + k, z, ...B.stairs("smooth_quartz", "east", "top"));
    put(right, y0 + k, z, ...B.stairs("smooth_quartz", "west", "top"));
  }
  const apexL = x0 + Math.floor((width - 1) / 2), apexR = x0 + Math.ceil((width - 1) / 2);
  for (const x of new Set([apexL, apexR])) put(x, y0 + rise, z, "quartz_bricks");
  return out;
}

/**
 * Two dark oak doors (both halves each) with a polished deepslate post between them and a transom course above.
 * Doors at x0 and x0+2 (hinges outward), post at x0+1 for rows y..y+2, transom row y+3 across x0..x0+2. Doors face north
 * by default (the street side of the land front).
 */
export function doorPair(g, x0, z, { y = 1, facing = "north" } = {}) {
  const { out, put } = writer(g);
  for (const [x, hinge] of [[x0, "left"], [x0 + 2, "right"]])
    for (const [dy, half] of [[0, "lower"], [1, "upper"]]) put(x, y + dy, z, ...B.door("dark_oak", facing, half, hinge));
  for (let dy = 0; dy < 3; dy++) put(x0 + 1, y + dy, z, "polished_deepslate");
  for (let x = x0; x <= x0 + 2; x++) put(x, y + 3, z, "polished_deepslate");
  return out;
}

/**
 * A low balustrade along x from x0 to x1 at row y, in the plane z: diorite_wall balusters, quartz_pillar posts every 4
 * (and at x1), a smooth_quartz_slab rail on the balusters at row y+1. The rail is a bottom slab: a top slab would float
 * half a block above the balusters.
 */
export function balustrade(g, { x0, x1, y, z }) {
  const { out, put } = writer(g);
  for (let x = x0; x <= x1; x++) {
    if ((x - x0) % 4 === 0 || x === x1) put(x, y, z, "quartz_pillar", { axis: "y" });
    else put(x, y, z, "diorite_wall", { up: "true", north: "none", south: "none", east: x < x1 ? "low" : "none", west: x > x0 ? "low" : "none" });
    put(x, y + 1, z, ...B.slab("smooth_quartz", "bottom"));
  }
  return out;
}

/**
 * One open belfry stage in the box [x0, y0, z0, x1, y1, z1]: quartz_pillar columns at the corners and at colsAt (absolute
 * x on the north/south faces, z on the east/west faces), a diorite_wall sill on row y0 across each opening, flat-headed
 * openings on the faces listed in arches (default all four) with `head` rows of smooth_quartz above them, solid
 * smooth_quartz on the faces that are not open, and a smooth_quartz cornice on row y1. The interior is not written.
 */
export function belfryStage(g, { box: [x0, y0, z0, x1, y1, z1], arches = ["north", "south", "east", "west"], colsAt = [], head = 2 }) {
  const { out, put } = writer(g);
  const yTop = y1 - 1 - head;
  const faces = [
    ["north", (p) => [p, z0], x0, x1, "x"],
    ["south", (p) => [p, z1], x0, x1, "x"],
    ["west", (p) => [x0, p], z0, z1, "z"],
    ["east", (p) => [x1, p], z0, z1, "z"],
  ];
  for (const [face, at, a, b, axis] of faces) {
    const cols = new Set([a, b, ...colsAt.filter((c) => c > a && c < b)]);
    const open = arches.includes(face);
    for (let p = a; p <= b; p++) {
      const [x, z] = at(p);
      if (cols.has(p)) for (let y = y0; y < y1; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
      else if (!open) for (let y = y0; y < y1; y++) put(x, y, z, "smooth_quartz");
      else {
        const sill = axis === "x" ? { up: "true", north: "none", south: "none", east: "low", west: "low" } : { up: "true", north: "low", south: "low", east: "none", west: "none" };
        put(x, y0, z, "diorite_wall", sill);
        for (let y = yTop + 1; y < y1; y++) put(x, y, z, "smooth_quartz");
      }
      put(x, y1, z, "smooth_quartz");
    }
  }
  return out;
}

/**
 * A stepped dome on a lantern: the 5x5 base at x0..x0+4, z0..z0+4 is a ring of smooth_quartz_stairs at row y (facing
 * inward, stepping in), with a smooth_quartz seat over the 3x3 inside it; then a 3x3 smooth_quartz at y+1, a double
 * smooth_quartz_slab (a full course, so the pillar sits flush) at y+2, and a quartz_pillar at the centre, y+3.
 */
export function dome(g, { x0, z0, y = 96 }) {
  const { out, put } = writer(g);
  const cx = x0 + 2, cz = z0 + 2;
  for (let x = x0; x <= x0 + 4; x++) for (let z = z0; z <= z0 + 4; z++) {
    const ring = x === x0 || x === x0 + 4 || z === z0 || z === z0 + 4;
    if (!ring) put(x, y, z, "smooth_quartz");
    else put(x, y, z, ...B.stairs("smooth_quartz", z === z0 ? "south" : z === z0 + 4 ? "north" : x === x0 ? "east" : "west"));
  }
  for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) {
    put(x, y + 1, z, "smooth_quartz");
    put(x, y + 2, z, ...B.slab("smooth_quartz", "double"));
  }
  put(cx, y + 3, cz, "quartz_pillar", { axis: "y" });
  return out;
}

/**
 * A glass clerestory monitor on the nave roof: glass walls on z0 and z1 for rows y and y+1, a glass roof on row y+2
 * across z0..z1, with polished_deepslate ribs (roof cells at x divisible by 4). Defaults are the Ferry nave's monitor.
 */
export function skylight(g, x0, x1, { z0 = 34, z1 = 44, y = 36 } = {}) {
  const { out, put } = writer(g);
  for (let x = x0; x <= x1; x++) {
    for (const z of [z0, z1]) for (const dy of [0, 1]) put(x, y + dy, z, "glass");
    for (let z = z0; z <= z1; z++) put(x, y + 2, z, x % 4 === 0 ? "polished_deepslate" : "glass");
  }
  return out;
}

/**
 * A lantern hanging on a chain from a block above: the lantern at [x, y, z] (hanging=true) and chain cells up to the
 * first solid block. Refuses when there is no block within maxChain cells above (nothing to hang from), and when the
 * lantern would block the 2-high lane over the walking floor (it must sit at least 3 above floor).
 */
export function hangLamp(g, x, y, z, { floor = 1, maxChain = 8 } = {}) {
  const { out, put } = writer(g);
  const refuse = (reason) => Object.assign(out, { reason, refused: [...out.refused, [x, y, z, "lantern"]] });
  if (y - floor < 3) return refuse(`lantern at y${y} would block the 2-high lane over floor y${floor}`);
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return refuse("lantern cell is not air");
  let top = y + 1;
  while (top <= y + maxChain + 1 && g.inBounds(x, top, z) && g.isAir(x, top, z)) top++;
  if (!g.inBounds(x, top, z) || g.isAir(x, top, z) || top - y - 1 > maxChain) return refuse("no block above to hang from");
  put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
  for (let cy = y + 1; cy < top; cy++) put(x, cy, z, ...B.chain("y", false));
  return out;
}
