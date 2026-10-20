// Named helpers from plan.md's VOCABULARY, group h2: window runs and doors, the hall's steel truss, the glass
// vestibule, the galleria skylight, the vault end gable, the gallery slot window, the green roof patch, the lawn path.
//
// Every helper takes the grid first, then its position (and facing where it has one), and returns
// { box, placed, refused }: its footprint box (inclusive corners), how many cells it wrote, and any write it left out.
// Writes stay inside the footprint, go only into air, and never reach y 0 (ground, sand and floors belong to earlier
// parts). Openings and their surrounds are left air by the shell (plan: "leave all openings as air"), so these helpers
// fill them. lawnPath is the one exception: the path is the ground's surface layer, so it replaces that layer only.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const lo = (a, b) => Math.min(a, b);
const hi = (a, b) => Math.max(a, b);

/** A footprint box from two corners; put() writes only into air inside it, at y >= 1, and records what it refused. */
function footprint(g, a, b) {
  const [x0, y0, z0] = [lo(a[0], b[0]), lo(a[1], b[1]), lo(a[2], b[2])];
  const [x1, y1, z1] = [hi(a[0], b[0]), hi(a[1], b[1]), hi(a[2], b[2])];
  const w = { box: [[x0, y0, z0], [x1, y1, z1]], placed: 0, refused: [] };
  w.put = (x, y, z, block, state) => {
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1 && y >= 1;
    if (inside && g.inBounds(x, y, z) && g.isAir(x, y, z)) { g.set(x, y, z, block, state); w.placed++; }
    else w.refused.push([x, y, z, block]);
  };
  return w;
}
const report = (w) => ({ box: w.box, placed: w.placed, refused: w.refused });

/** One 6-wide, 3-high glass run cut into a face, one back from the wall plane, with a slab sill under it.
 *  from..to is the run along the wall (to defaults to from + 5). The ground floor starts at y 2 and runs 4 high. */
export function stripWindowRun(g, { face, plane, from, to = from + 5, y, high = y === 2 ? 4 : 3 }) {
  const across = face === "north" || face === "south" ? "x" : "z";
  const [ox, oz] = OUT[face];
  const glassAt = plane - (across === "x" ? oz : ox);            // one back, inside the building
  const cell = (a, depth, yy) => (across === "x" ? [a, yy, depth] : [depth, yy, a]);
  const pane = across === "x"
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const w = footprint(g, cell(from, lo(plane, glassAt), y - 1), cell(to, hi(plane, glassAt), y + high - 1));
  for (let a = from; a <= to; a++) {
    w.put(...cell(a, plane, y - 1), "smooth_stone_slab", { type: "top", waterlogged: "false" });
    for (let yy = y; yy < y + high; yy++) w.put(...cell(a, glassAt, yy), "glass_pane", pane);
  }
  return report(w);
}

/** A door opening of `width` cells (2 = one double door; 4 = two pairs) with birch_door halves at y 1..2 and air
 *  above at y 3. (x, z) is the first cell of the opening on the wall plane. surround: red_terracotta jambs and lintel. */
export function doorPair(g, { x, z, face, width = 2, surround = false }) {
  const across = face === "north" || face === "south" ? "x" : "z";
  const at = (a, yy) => (across === "x" ? [a, yy, z] : [x, yy, a]);
  const a0 = across === "x" ? x : z;
  const aLo = surround ? a0 - 1 : a0;
  const aHi = surround ? a0 + width : a0 + width - 1;
  const w = footprint(g, at(aLo, 1), at(aHi, surround ? 4 : 3));
  for (let i = 0; i < width; i++) {
    const hinge = i % 2 === 0 ? "left" : "right";                 // each pair hinges on its outer sides
    w.put(...at(a0 + i, 1), ...B.door("birch", face, "lower", hinge));
    w.put(...at(a0 + i, 2), ...B.door("birch", face, "upper", hinge));
  }
  if (surround) {
    for (let yy = 1; yy <= 3; yy++) {
      w.put(...at(a0 - 1, yy), "red_terracotta");
      w.put(...at(a0 + width, yy), "red_terracotta");
    }
    for (let a = aLo; a <= aHi; a++) w.put(...at(a, 4), "red_terracotta");
  }
  return report(w);
}

/** The hall's steel truss in the plane z: light_gray_concrete chords at y 27 and y 23, andesite_wall posts every 6 x
 *  (plus the end) at y 24..25, a chain hanger at y 26 under each top chord, and a peaked diagonal web of andesite_wall
 *  rising and falling 1 y per 1 x between posts. */
export function steelTruss(g, { z, x0 = 20, x1 = 87 }) {
  const w = footprint(g, [x0, 23, z], [x1, 27, z]);
  for (let x = x0; x <= x1; x++) {
    w.put(x, 27, z, "light_gray_concrete");
    w.put(x, 23, z, "light_gray_concrete");
  }
  const posts = [];
  for (let x = x0; x <= x1; x += 6) posts.push(x);
  if (posts.at(-1) !== x1) posts.push(x1);
  for (const x of posts) {
    for (const y of [24, 25]) w.put(x, y, z, "andesite_wall", { up: "true" });
    w.put(x, 26, z, ...B.chain("y", false));
  }
  for (let xa = x0; xa + 6 <= x1; xa += 6) {
    for (let dx = 1; dx <= 5; dx++) w.put(xa + dx, 24 + Math.min(dx, 6 - dx, 2), z, "andesite_wall", { up: "true" });
  }
  return report(w);
}

/** A single-storey glass box: smooth_quartz posts at the corners and every 7 along each edge, glass_pane between,
 *  walls at y 1..h-1, a smooth_quartz_slab rim at y h, and a glass roof at y h with smooth_quartz beams every 7 x. */
export function vestibuleGlassBox(g, { x0, z0, x1, z1, h }) {
  const w = footprint(g, [x0, 1, z0], [x1, h, z1]);
  const post = (a, base, end) => a === base || a === end || (a - base) % 7 === 0;
  for (let y = 1; y < h; y++) {
    for (let x = x0; x <= x1; x++) {
      for (const z of [z0, z1]) {
        if (post(x, x0, x1)) w.put(x, y, z, "smooth_quartz");
        else w.put(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true" });
      }
    }
    for (let z = z0 + 1; z < z1; z++) {
      for (const x of [x0, x1]) {
        if (post(z, z0, z1)) w.put(x, y, z, "smooth_quartz");
        else w.put(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false" });
      }
    }
  }
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      if (edge) w.put(x, h, z, ...B.slab("smooth_quartz", "bottom"));
      else if ((x - x0) % 7 === 0) w.put(x, h, z, "smooth_quartz");
      else w.put(x, h, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true" });
    }
  }
  return report(w);
}

/** A 2-wide glass skylight down the middle of a galleria rect, set in smooth_quartz deck edges on either side. */
export function galleriaSkylight(g, { rect: { x0, z0, x1, z1 }, y = 6 }) {
  const w = footprint(g, [x0, y, z0], [x1, y, z1]);
  const alongX = x1 - x0 >= z1 - z0;
  const mid = alongX ? Math.floor((z0 + z1) / 2) : Math.floor((x0 + x1) / 2);
  const at = (a, d) => (alongX ? [a, y, d] : [d, y, a]);
  for (let a = alongX ? x0 : z0; a <= (alongX ? x1 : z1); a++) {
    for (const d of [mid - 2, mid + 1]) w.put(...at(a, d), "smooth_quartz");
    for (const d of [mid - 1, mid]) w.put(...at(a, d), "glass");
  }
  return report(w);
}

/** Glasshouse vault profile: the glass surface's dx from the axis at each y (plan.md, vault cross-section). */
const vaultDx = (y) => (y <= 7 ? 7 : y <= 10 ? 6 : y <= 13 ? 5 : y <= 15 ? 4 : y <= 17 ? 3 : y === 18 ? 2 : y === 19 ? 1 : 0);

/** The pointed glass gable that closes the vault at z (4 or 43): the full profile of the bay that owns that z, glass
 *  with smooth_quartz mullions every 3 x from the axis. */
export function vaultEndGable(g, { z }) {
  const cx = 231 + Math.min(9, Math.max(0, Math.floor((z - 4) / 4)));
  const w = footprint(g, [cx - 7, 1, z], [cx + 7, 20, z]);
  for (let y = 1; y <= 20; y++) {
    const dx = vaultDx(y);
    for (let x = cx - dx; x <= cx + dx; x++) {
      if (Math.abs(x - cx) % 3 === 0) w.put(x, y, z, "smooth_quartz");
      else w.put(x, y, z, "glass");
    }
  }
  return report(w);
}

/** A 1-wide gray stained-glass slot at y 3..9, one back from the wall at (x, z). face defaults from x: the west wall
 *  is x 257 and the east wall x 296 (plan.md FLOORS/FACADES). */
export function gallerySlotWindow(g, { x, z, face = x <= 257 ? "west" : "east" }) {
  const [ox, oz] = OUT[face];
  const gx = x - ox;                                             // one back, inside the building
  const gz = z - oz;
  const alongZ = face === "west" || face === "east";
  const pane = alongZ
    ? { north: "true", south: "true", east: "false", west: "false" }
    : { east: "true", west: "true", north: "false", south: "false" };
  const w = footprint(g, [lo(x, gx), 3, lo(z, gz)], [hi(x, gx), 9, hi(z, gz)]);
  for (let y = 3; y <= 9; y++) w.put(gx, y, gz, "gray_stained_glass_pane", pane);
  return report(w);
}

/** Planting on a moss deck: grass_block patches in the rect at layer y (ring always grass, the rest ~3 in 4), with
 *  azalea, flowering_azalea and short_grass on top, and a lantern standing on the ring every 8 blocks. */
export function greenRoofPatch(g, { x0, z0, x1, z1, y = 13 }) {
  const w = footprint(g, [x0, y, z0], [x1, y + 1, z1]);
  const ring = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
  const grass = (x, z) => ring(x, z) || (5 * x + 3 * z) % 4 !== 0;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (grass(x, z)) w.put(x, y, z, "grass_block");
    }
  }
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (ring(x, z) && (x - x0 + z - z0) % 8 === 0) w.put(x, y + 1, z, ...B.lantern(false));
      else if (!ring(x, z) && grass(x, z)) {
        const k = (31 * x + 17 * z) % 16;
        if (k === 0) w.put(x, y + 1, z, "azalea");
        else if (k === 1) w.put(x, y + 1, z, "flowering_azalea");
        else if (k < 6) w.put(x, y + 1, z, "short_grass");
      }
    }
  }
  return report(w);
}

/** A 2-wide polished_andesite path through the points ([x, z] pairs) on the ground's surface layer y. The one helper
 *  that replaces what is there: it writes that layer only, and only where there is ground to replace. */
export function lawnPath(g, { points, y = 0, width = 2 }) {
  const cells = new Map();
  for (let i = 0; i + 1 < points.length; i++) {
    const [[ax, az], [bx, bz]] = [points[i], points[i + 1]];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(bz - az), 1);
    const alongX = Math.abs(bx - ax) >= Math.abs(bz - az);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(ax + ((bx - ax) * s) / steps);
      const z = Math.round(az + ((bz - az) * s) / steps);
      for (let k = 0; k < width; k++) {
        const c = alongX ? [x, z + k] : [x + k, z];
        cells.set(c.join(","), c);
      }
    }
  }
  const list = [...cells.values()];
  const xs = list.map((c) => c[0]), zs = list.map((c) => c[1]);
  const w = { box: [[Math.min(...xs), y, Math.min(...zs)], [Math.max(...xs), y, Math.max(...zs)]], placed: 0, refused: [] };
  for (const [x, z] of list) {
    if (g.inBounds(x, y, z) && !g.isAir(x, y, z)) { g.set(x, y, z, "polished_andesite"); w.placed++; }
    else w.refused.push([x, y, z, "polished_andesite"]);
  }
  return report(w);
}
