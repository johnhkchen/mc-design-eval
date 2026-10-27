// Corys Electrical, Eden Terrace: a two-storey painted-concrete commercial block of the 1960s, flat roof with a parapet,
// a shopfront ground floor with a yellow fascia, a lower single-storey wing on the west and south. Two tiers from the
// lidar roof (10 and 9 blocks), each storey 4 blocks with its floor slab. No interiors: air behind every pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494237.cells.json", "utf8"));

const WALL = "white_concrete", TRIM = "light_gray_concrete", BASE = "stone_bricks", FASCIA = "yellow_concrete";
const SHOP = "glass", PANE = "glass_pane", LAMP = "glowstone", PLANT = "light_gray_concrete", FAN = "iron_block";

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, t: r >= 10 ? 10 : 9 }]));  // lidar noise (<=9) joins the lower tier
const inFp = (x, z) => foot.has(key(x, z));
// a lone tier cell (lidar speckle) takes its neighbours' tier, so no upper deck hangs over the lower wing
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  const nb = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].map(([a, b]) => foot.get(key(a, b))).filter(Boolean);
  if (nb.filter((n) => n.t === c.t).length > 1) continue;
  const high = nb.filter((n) => n.t === 10).length;
  if (nb.length) c.t = high > nb.length - high ? 10 : 9;
}

// the door: the north (street) frontage cell at the lowest ground nearest the middle of that frontage
const frontage = cells.filter(([x, z, g]) => !inFp(x, z - 1) && g <= 1).sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = frontage[Math.floor(frontage.length / 2)];

const blocks = new Map();   // "x,y,z" -> [block, state]
const put = (x, y, z, b, s) => blocks.set(`${x},${y},${z}`, [b, s]);
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

// plant room on the upper tier, in the middle of the roof
const tier10 = cells.filter(([x, z]) => foot.get(key(x, z)).t === 10 && inFp(x, z - 1) && inFp(x, z + 1) && inFp(x - 1, z) && inFp(x + 1, z));
const cx = Math.round(tier10.reduce((s, c) => s + c[0], 0) / tier10.length);
const cz = Math.round(tier10.reduce((s, c) => s + c[1], 0) / tier10.length);
const onPlant = (x, z) => Math.abs(x - cx) <= 6 && Math.abs(z - cz) <= 4;

for (const [x, z, G] of cells) {
  const { t: T } = foot.get(key(x, z));
  const D = T - 1;                                    // the roof deck
  const exZ = !inFp(x, z - 1) || !inFp(x, z + 1);      // an exterior face on a north or south wall
  const exX = !inFp(x - 1, z) || !inFp(x + 1, z);      // an exterior face on an east or west wall
  const P = exZ || exX;
  const corner = exZ && exX;
  const top = P && T === 10 ? D + 1 : D;               // the parapet stands one above the deck on the upper tier
  const bay = exZ && !exX ? x : z;                     // position along the wall the face is on
  for (let y = 0; y <= top; y++) {
    if (y < G) { put(x, y, z, BASE); continue; }      // the foundation: solid from y 0 up to the ground
    if (!P) {                                          // interior: slabs at 2, 6 and the deck; air between
      if (y < 2) put(x, y, z, BASE);
      else if (y === 2 || y === 6 || y === D) put(x, y, z, TRIM);
      else if (y >= 10 && T === 10 && onPlant(x, z)) put(x, y, z, PLANT);
      continue;
    }
    if (y < 2) { put(x, y, z, BASE); continue; }     // plinth
    if (y === 2) { put(x, y, z, TRIM); continue; }    // base string course
    if (y <= 4) {                                      // shopfront
      const isDoor = x === doorX && z === doorZ;
      if (isDoor) {
        put(x, y, z, "oak_door", { facing: "north", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (corner || bay % 4 === 0) put(x, y, z, WALL);
      else if (y === 3 && bay % 5 === 1) put(x, y, z, LAMP);
      else put(x, y, z, SHOP);
      continue;
    }
    if (y === 5) { put(x, y, z, FASCIA); continue; }   // the company fascia
    if (y === 6) { put(x, y, z, TRIM); continue; }      // first-floor string course
    if (y < D) {                                        // upper windows
      if (corner || bay % 3 === 0) put(x, y, z, WALL);
      else if (y === 7 && bay % 5 === 2) put(x, y, z, LAMP);
      else put(x, y, z, PANE);
      continue;
    }
    if (y === D) { put(x, y, z, TRIM); continue; }      // coping
    put(x, y, z, WALL);                                 // parapet
  }
  if (!P && T === 10 && onPlant(x, z)) {
    // plant room: a box on the deck with fans on top
    for (let y = 10; y <= 11; y++) put(x, y, z, PLANT);
    if (Math.abs(x - cx) % 3 === 0 && Math.abs(z - cz) % 2 === 0) put(x, 12, z, FAN);
  }
}

// glass panes take their connections from their neighbours: solid or pane on a side means connected
const joins = (x, y, z) => { const b = at(x, y, z); return !!b && b[0] !== SHOP; };
for (const [k, [b]] of [...blocks]) {
  if (b !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx, dy, dz) => (joins(x + dx, y + dy, z + dz) ? "true" : "false");
  blocks.set(k, [PANE, {
    north: side(0, 0, -1), south: side(0, 0, 1), east: side(1, 0, 0), west: side(-1, 0, 0), waterlogged: "false",
  }]);
}

const g = new Voxels([112, 22, 71]);
for (const [k, [b, s]] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, s);
}
// nothing floats: every block joins the ground through a chain of touching blocks (floors span between walls)
const seen = new Set();
const queue = [...blocks.keys()].filter((k) => k.split(",")[1] === "0");
queue.forEach((k) => seen.add(k));
for (let i = 0; i < queue.length; i++) {
  const [x, y, z] = queue[i].split(",").map(Number);
  for (const n of [[x + 1, y, z], [x - 1, y, z], [x, y + 1, z], [x, y - 1, z], [x, y, z + 1], [x, y, z - 1]]) {
    const nk = n.join(",");
    if (blocks.has(nk) && !seen.has(nk)) { seen.add(nk); queue.push(nk); }
  }
}
const floating = [...blocks.keys()].filter((k) => !seen.has(k));
if (floating.length) throw new Error(`${floating.length} blocks not connected to the ground, e.g. ${floating.slice(0, 5).join(" ")}`);

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_261494237.nbt";
const r = g.save(out);
console.log(`way_261494237: ${r.blocks} blocks, ${r.palette} palette entries, door at ${doorX},${doorZ}`);
