// Plantation helpers from plan.md VOCABULARY. Each takes its position (and facing) as arguments and writes only into
// air: a cell that already holds a block (an earlier part's, the ground's, or one this helper just wrote) is skipped.
// Every helper returns { placed, skipped }.
import { B, DIRS, face, hipRoof, shutter } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Writes through g only where the cell is air, so no helper replaces an earlier part's block or the ground.
function airOnly(g) {
  let placed = 0, skipped = 0;
  const put = (x, y, z, block, state) => {
    if (!g.isAir(x, y, z)) { skipped++; return false; }
    g.set(x, y, z, block, state);
    placed++;
    return true;
  };
  return { put, set: put, result: () => ({ placed, skipped }) };
}

/** Rail along x from x0 to x1 at z: birch_fence at y, smooth_quartz_slab (type top) at y+1 over each cell. */
export function balustrade(g, x0, x1, z, y) {
  const w = airOnly(g), a = Math.min(x0, x1), b = Math.max(x0, x1);
  for (let x = a; x <= b; x++) {
    w.put(x, y, z, "birch_fence", { north: "false", south: "false", east: String(x < b), west: String(x > a), waterlogged: "false" });
    w.put(x, y + 1, z, ...B.slab("smooth_quartz", "top"));
  }
  return w.result();
}

/** Open dark_oak shutters for a window, flat on the wall, one cell outside each side. x0..x1 is the window's extent along
 *  the wall (x on a north/south front, z on an east/west one); wall is the wall's z (north/south) or x (east/west).
 *  h = height in cells. face = the way the wall looks. */
export function shutterPair(g, x0, x1, y0, h, face, wall) {
  const w = airOnly(g), out = DIRS[face], across = face === "north" || face === "south";
  for (const a of [x0 - 1, x1 + 1]) {
    const x = (across ? a : wall) + out[0], z = (across ? wall : a) + out[2];
    shutter(w, [x, y0, z], face, "dark_oak", { height: h });
  }
  return w.result();
}

/** Coved living-room vault over the interior box x0..x1, z0..z1: upside-down quartz_stairs against the walls at y0, one
 *  course in at y0+1, then a flat white_concrete panel at y0+2 over the rest. */
export function vaultCove(g, x0, x1, z0, z1, y0 = 15) {
  const w = airOnly(g);
  for (let k = 0; k < 2; k++) for (let x = x0 + k; x <= x1 - k; x++) for (let z = z0 + k; z <= z1 - k; z++) {
    const rim = x === x0 + k || x === x1 - k || z === z0 + k || z === z1 - k;
    if (!rim) continue;
    const facing = x === x0 + k ? "east" : x === x1 - k ? "west" : z === z0 + k ? "south" : "north";
    w.put(x, y0 + k, z, ...B.stairs("quartz", facing, "top"));
  }
  for (let x = x0 + 1; x <= x1 - 1; x++) for (let z = z0 + 1; z <= z1 - 1; z++) w.put(x, y0 + 2, z, "white_concrete");
  return w.result();
}

/** Flowering cherry at (x,z): cherry_log trunk y0..y0+4, a stepped round crown of persistent cherry_leaves (radius 3)
 *  around the trunk top. The trunk is kept where the crown would overlap it. */
export function cherryTree(g, x, z, y0 = 1) {
  const w = airOnly(g), top = y0 + 4;
  for (let y = y0; y <= top; y++) w.put(x, y, z, "cherry_log", { axis: "y" });
  for (const [dy, r] of [[-2, 2], [-1, 3], [0, 3], [1, 2], [2, 1]]) {
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dz * dz <= r * r + r / 2) w.put(x + dx, top + dy, z + dz, "cherry_leaves", { persistent: "true" });
    }
  }
  return w.result();
}

/** Stone urn on a pedestal, 2x2 at (x..x+1, z..z+1): smooth_quartz pedestal at y0, chiseled_quartz_block urn at y0+1,
 *  a flowering_azalea ring on the cells around it at y0. */
export function urn(g, x, z, y0 = 1) {
  const w = airOnly(g);
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
    w.put(x + dx, y0, z + dz, "smooth_quartz");
    w.put(x + dx, y0 + 1, z + dz, "chiseled_quartz_block");
  }
  for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 2; dz++) {
    const ring = dx < 0 || dx > 1 || dz < 0 || dz > 1;
    if (ring) w.put(x + dx, y0, z + dz, "flowering_azalea");
  }
  return w.result();
}

/** Fountain on a 7x7 basin, origin corner (x0, z0): smooth_quartz rim at y0 with chamfered (slab) corners, water inside
 *  it, a quartz_pillar plinth at the centre with a water jet on top at y0+2. The ground row (y0-1) is not written. */
export function fountain(g, x0, z0, y0 = 1) {
  const w = airOnly(g), cx = x0 + 3, cz = z0 + 3;
  w.put(cx, y0, cz, "quartz_pillar", { axis: "y" });
  w.put(cx, y0 + 1, cz, "quartz_pillar", { axis: "y" });
  w.put(cx, y0 + 2, cz, "water");
  for (let dx = 0; dx <= 6; dx++) for (let dz = 0; dz <= 6; dz++) {
    const edge = dx === 0 || dx === 6 || dz === 0 || dz === 6;
    const corner = (dx === 0 || dx === 6) && (dz === 0 || dz === 6);
    if (corner) w.put(x0 + dx, y0, z0 + dz, ...B.slab("smooth_quartz", "bottom"));
    else if (edge) w.put(x0 + dx, y0, z0 + dz, "smooth_quartz");
    else w.put(x0 + dx, y0, z0 + dz, "water");
  }
  return w.result();
}

// Local frame of the cottage: front wall is north, lx 0..11 runs east, lz 0..11 runs south (back), the porch is lz -4..-1.
// The main block is always world x0..x0+11, z0..z0+11; facing turns the whole thing clockwise about its centre.
const TURN = { north: 0, east: 1, south: 2, west: 3 };

/** White guest cottage (the house in miniature) with a 4-column porch, a hip roof and its shutters. (x0, z0) = the main
 *  block's min corner; y0 = the floor row (the ground row y0-1 is not written). Doors are dark_oak, windows glass_pane. */
export function cottage(g, x0, z0, facing = "north", y0 = 1) {
  const w = airOnly(g), k = TURN[facing] ?? 0;
  const turn = (d) => { let f = d; for (let i = 0; i < k; i++) f = face.cw(f); return f; };
  const at = (lx, lz) => {
    let px = 2 * lx - 11, pz = 2 * lz - 11;
    for (let i = 0; i < k; i++) [px, pz] = [-pz, px];
    return [x0 + (px + 11) / 2, z0 + (pz + 11) / 2];
  };
  const put = (lx, y, lz, block, state) => { const [x, z] = at(lx, lz); return w.put(x, y, z, block, state); };
  const windowAt = (lx, lz) => (lz === 0 && [1, 2, 9, 10].includes(lx))
    || (lz === 11 && [3, 4, 7, 8].includes(lx))
    || ((lx === 0 || lx === 11) && [3, 4, 7, 8].includes(lz));

  // floor (bricks, main block) and porch floor (smooth_quartz)
  for (let lx = 0; lx <= 11; lx++) {
    for (let lz = 0; lz <= 11; lz++) put(lx, y0, lz, "bricks");
    for (let lz = -4; lz <= -1; lz++) put(lx, y0, lz, "smooth_quartz");
  }
  // walls y0+1..y0+4: white_concrete, quartz_pillar corners, glass windows and sidelights, transom, door cut-outs
  for (let y = y0 + 1; y <= y0 + 4; y++) {
    for (let lx = 0; lx <= 11; lx++) for (let lz = 0; lz <= 11; lz++) {
      if (lx > 0 && lx < 11 && lz > 0 && lz < 11) continue;
      const corner = (lx === 0 || lx === 11) && (lz === 0 || lz === 11);
      if (corner) put(lx, y, lz, "quartz_pillar", { axis: "y" });
      else if (y <= y0 + 3 && windowAt(lx, lz)) put(lx, y, lz, ...B.pane());
      else if (lz === 0 && (lx === 4 || lx === 7) && y <= y0 + 3) put(lx, y, lz, ...B.pane());
      else if (lz === 0 && (lx === 5 || lx === 6)) {
        if (y === y0 + 3) put(lx, y, lz, ...B.pane());          // transom over the double door
        else if (y === y0 + 4) put(lx, y, lz, "white_concrete");
      } else put(lx, y, lz, "white_concrete");
    }
  }
  // double front door, both halves, hinges mirrored
  put(5, y0 + 1, 0, ...B.door("dark_oak", turn("north"), "lower", "left"));
  put(5, y0 + 2, 0, ...B.door("dark_oak", turn("north"), "upper", "left"));
  put(6, y0 + 1, 0, ...B.door("dark_oak", turn("north"), "lower", "right"));
  put(6, y0 + 2, 0, ...B.door("dark_oak", turn("north"), "upper", "right"));
  // porch: four columns at the front, a beam on top
  for (const lx of [0, 4, 7, 11]) for (let y = y0 + 1; y <= y0 + 4; y++) put(lx, y, -4, "quartz_pillar", { axis: "y" });
  for (let lx = 0; lx <= 11; lx++) put(lx, y0 + 5, -4, "smooth_quartz");
  // plate course over the main block
  for (let lx = 0; lx <= 11; lx++) for (let lz = 0; lz <= 11; lz++) {
    if (lx === 0 || lx === 11 || lz === 0 || lz === 11) put(lx, y0 + 5, lz, "smooth_quartz");
  }
  // plaster ceiling inside the plate, so the rooms' hanging lanterns have a ceiling to hang from
  for (let lx = 1; lx <= 10; lx++) for (let lz = 1; lz <= 10; lz++) put(lx, y0 + 5, lz, "white_concrete");
  // shutters: one cell outside each side of every window, open dark_oak trapdoors flat on the wall
  const shutters = [
    [0, -1, "north"], [3, -1, "north"], [8, -1, "north"], [11, -1, "north"],
    [-1, 2, "west"], [-1, 5, "west"], [-1, 6, "west"], [-1, 9, "west"],
    [12, 2, "east"], [12, 5, "east"], [12, 6, "east"], [12, 9, "east"],
    [2, 12, "south"], [5, 12, "south"], [6, 12, "south"], [9, 12, "south"],
  ];
  for (const [lx, lz, f] of shutters) {
    const [x, z] = at(lx, lz);
    shutter(w, [x, y0 + 1, z], turn(f), "dark_oak", { height: 3 });
  }
  // hip roof over the main block and porch, half pitch, one-cell overhang
  const corners = [[0, -4], [11, -4], [0, 11], [11, 11]].map(([lx, lz]) => at(lx, lz));
  const xs = corners.map((c) => c[0]), zs = corners.map((c) => c[1]);
  hipRoof(w, { footprint: [[Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]], y: y0 + 6, material: "deepslate_tile", pitch: 0.5, overhang: 1 });
  return w.result();
}

/** Front steps: three smooth_quartz_stairs treads rising toward `facing`, the first at (x0, z0) at height y0, `width`
 *  treads across. Bricks under each tread, bricks cheek walls one cell out on each side, smooth_quartz caps, and a newel
 *  with a standing lantern at the bottom of each cheek. The ground row (y0-1) is not written. */
export function frontSteps(g, x0, z0, facing = "south", width = 6, y0 = 1) {
  const w = airOnly(g), [rx, , rz] = DIRS[facing], lat = rx === 0 ? [1, 0] : [0, 1];
  const at = (i, j) => [x0 + i * rx + j * lat[0], z0 + i * rz + j * lat[1]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < width; j++) {
    const [x, z] = at(i, j);
    w.put(x, y0 + i, z, ...B.stairs("smooth_quartz", facing, "bottom"));
    for (let y = y0; y < y0 + i; y++) w.put(x, y, z, "bricks");
  }
  for (const j of [-1, width]) for (let i = 0; i < 3; i++) {
    const [x, z] = at(i, j);
    for (let y = y0; y <= y0 + 2; y++) w.put(x, y, z, "bricks");
    w.put(x, y0 + 3, z, "smooth_quartz");
    if (i === 0) w.put(x, y0 + 4, z, ...B.lantern(false));
  }
  return w.result();
}
