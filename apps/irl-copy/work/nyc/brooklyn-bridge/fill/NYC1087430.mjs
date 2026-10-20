import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 320 Pearl Street, South Street Seaport Historic District Extension, 2002 office block.
// Read as a late-1990s/2000s brick-based commercial building: brick piers, smooth stone
// spandrel bands, tinted glazing in between, a granite base course, a stone cornice, and
// a lobby with an iron door on the street (north) face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1087430";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 34, D = 16;
const PITCH = 3;                 // storey pitch in blocks (~4.3 m office floor)
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  const ground = Math.max(0, Math.min(H - 4, Math.round(gr)));
  const n = Math.max(1, Math.round((Math.round(roof) - ground) / PITCH));
  const top = Math.min(H - 1, ground + PITCH * n);
  map.set(key(x, z), { x, z, gr: ground, top });
}
const has = (x, z) => map.has(key(x, z));
const get = (x, z) => map.get(key(x, z));

// Perimeter flags and missing-neighbour sides
for (const c of map.values()) {
  c.nN = !has(c.x, c.z - 1);
  c.nS = !has(c.x, c.z + 1);
  c.nW = !has(c.x - 1, c.z);
  c.nE = !has(c.x + 1, c.z);
  c.perim = c.nN || c.nS || c.nW || c.nE;
}

// Tallest roof for penthouse placement
const maxTop = Math.max(...[...map.values()].map(c => c.top));

// Street door: the north-edge cell nearest the middle of the frontage
let doorCell = null;
for (const c of map.values()) {
  if (!c.nN) continue;
  if (!doorCell || Math.abs(c.x - 5) < Math.abs(doorCell.x - 5)) doorCell = c;
}

// Inward neighbour of a perimeter cell (for glowing lights behind glass)
function inward(c) {
  if (c.nN) return [c.x, c.z + 1];
  if (c.nS) return [c.x, c.z - 1];
  if (c.nW) return [c.x + 1, c.z];
  if (c.nE) return [c.x - 1, c.z];
  return null;
}

// Pass 1: foundations, floors, walls, caps
for (const c of map.values()) {
  const { x, z, gr, top } = c;

  // Foundation fills from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const r = (y - gr) % PITCH;
    const s = Math.floor((y - gr) / PITCH);
    const isCap = y === top - 1;

    if (!c.perim) {
      // Interior: floor slabs each storey and roof cap only (air between)
      if (r === 0) g.set(x, y, z, "smooth_stone");
      if (isCap) g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Facade cell
    const along = (c.nN || c.nS) ? x : z;
    const pier = along % 3 === 0;

    let block;
    if (isCap) block = "stone_bricks";                 // cornice / parapet
    else if (y === gr) block = "polished_granite";     // base course
    else if (r === 0) block = "smooth_stone";          // storey line / spandrel
    else if (pier) block = "bricks";                   // masonry piers
    else block = "light_blue_stained_glass";           // glazing

    // Lobby door on the street face, ground storey
    if (c === doorCell && s === 0 && (r === 1 || r === 2) && !isCap) {
      if (r === 1) {
        g.set(x, y, z, "iron_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false"
        });
      } else {
        g.set(x, y, z, "iron_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false"
        });
      }
      continue;
    }

    g.set(x, y, z, block);
  }
}

// Pass 2: warm light behind some windows, lantern inside the lobby
for (const c of map.values()) {
  if (!c.perim) continue;
  const inn = inward(c);
  if (!inn) continue;
  const [ix, iz] = inn;
  const ic = get(ix, iz);
  if (!ic || ic.perim) continue;

  for (let y = c.gr + 1; y < c.top - 1; y++) {
    const r = (y - c.gr) % PITCH;
    const s = Math.floor((y - c.gr) / PITCH);
    if (r === 0) continue;
    if (y >= ic.top) continue;

    if (c === doorCell && s === 0) {
      // lobby lantern just inside the door, on the ground-floor slab
      if (r === 1 && ix === c.x && iz === c.z + 1) {
        g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
      continue;
    }

    const along = (c.nN || c.nS) ? c.x : c.z;
    if (along % 3 === 0) continue;             // only behind glazing
    if ((c.x + c.z + y) % 4 === 0) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

// Pass 3: rooftop plant room on the tallest interior cells
for (const c of map.values()) {
  if (c.perim) continue;
  if (c.top !== maxTop) continue;
  if (c.x < 3 || c.x > 7 || c.z < 4 || c.z > 11) continue;
  if (c.top + 2 > H - 1) continue;
  g.set(c.x, c.top, c.z, "light_gray_concrete");
  g.set(c.x, c.top + 1, c.z, "light_gray_concrete");
  g.set(c.x, c.top + 2, c.z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
