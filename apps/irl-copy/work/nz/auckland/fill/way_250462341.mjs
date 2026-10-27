// Way 250462341, Mt Eden / Eden Terrace, Auckland: a 1960s reinforced-concrete office-over-shops block.
// Lidar roof heights step it into three flat tiers (tower 14, mid 10, wings 6-8): a stone plinth on the
// slope, storey lines every 4 blocks, piers between glazed bays, air pockets behind the glass, a
// parapet and a grey roof, entrances on the street faces, and roof plant on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_250462341.cells.json`, "utf8"));
const SIZE = [68, 27, 48];
const SLABS = [4, 8, 12];                                  // storey lines: floor slabs 4 blocks apart
const FACE = [[1, 0], [-1, 0], [0, 1], [0, -1]];           // outward normals
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// lidar roof (blocks above y 0) -> flat tier top: tower 14, mid 10, wings 8 or 6
const tierOf = (r) => (r >= 12 ? 14 : r >= 9 ? 10 : r >= 8 ? 8 : 6);

const ky = (x, y, z) => `${x},${y},${z}`;
const key = (x, z) => `${x},${z}`;
// one 3x3 majority pass over the tiers: a lone tower cell on a wing edge is lidar noise, not a pillar
function smoothTiers(src) {
  const out = new Map();
  for (const c of src.values()) {
    const count = {};
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const n = src.get(key(c.x + i, c.z + j));
      if (n) count[n.T] = (count[n.T] ?? 0) + 1;
    }
    const [top, n] = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
    out.set(key(c.x, c.z), { ...c, T: Math.max(n > (count[c.T] ?? 0) ? +top : c.T, c.g + 3) });
  }
  return out;
}
const raw = new Map();                                     // "x,z" -> { x, z, g (ground), T (top) }
for (const [x, z, g, r] of cells) raw.set(key(x, z), { x, z, g, T: tierOf(r) });
// a tier cell with at most two same-tier neighbours is a spike on a wing edge: it drops to its neighbours' tier
function dropSpikes(src) {
  const out = new Map();
  for (const c of src.values()) {
    const nb = [];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (i || j) { const n = src.get(key(c.x + i, c.z + j)); if (n) nb.push(n); }
    const same = nb.filter((n) => n.T === c.T).length;
    const lower = Math.max(...nb.map((n) => n.T));
    out.set(key(c.x, c.z), same <= 2 && lower < c.T ? { ...c, T: Math.max(lower, c.g + 3) } : c);
  }
  return out;
}
const B = dropSpikes(smoothTiers(smoothTiers(raw)));
const cell = (x, z) => B.get(key(x, z));

// what a building row is, from its cell's ground g and top T
function rowKind(y, c) {
  if (y === c.g) return "plinth";
  if (y === c.T - 1) return "parapet";
  if (SLABS.includes(y) && y > c.g && y < c.T - 1) return "string";
  let A = c.g;
  for (const s of SLABS) if (s > c.g && s < y) A = s;
  return y - A === 1 ? "sill" : "glass";
}

const blk = new Map();                                     // "x,y,z" -> { block, state } for facade, doors, plant, lamps
const put = (x, y, z, block, state) => blk.set(ky(x, y, z), { block, state });
const win = [];                                            // glazed cells on exposed faces: { c, d, y }

// 1. exposed faces: outside faces run from the foundation to the top; faces against a lower tier run from that tier's top up
for (const c of B.values()) {
  for (const [dx, dz] of FACE) {
    const n = cell(c.x + dx, c.z + dz);
    const lo = n ? Math.max(n.T, c.g) : 0;
    for (let y = lo; y < c.T; y++) {
      const kind = !n && y < c.g ? "foundation" : rowKind(y, c);
      const along = dx !== 0 ? c.z : c.x;
      if (kind === "foundation" || kind === "plinth") put(c.x, y, c.z, "stone_bricks");
      else if (kind === "sill" || kind === "string" || kind === "parapet") put(c.x, y, c.z, "light_gray_concrete");
      else if (along % 3 === 0) put(c.x, y, c.z, "white_concrete");                              // pier between bays
      else {
        const state = dx !== 0
          ? { north: "true", south: "true", east: "false", west: "false" }
          : { north: "false", south: "false", east: "true", west: "true" };
        put(c.x, y, c.z, "light_blue_stained_glass_pane", state);
        win.push({ c, d: [dx, dz], y });
      }
    }
  }
}

// 2. air gap behind each glazed bay (one block in), kept where the cell inside is not already a facade
const pocket = new Set();
for (const { c, d, y } of win) {
  if (blk.get(ky(c.x, y, c.z))?.block !== "light_blue_stained_glass_pane") continue;   // overwritten by a later face or a door
  const inn = cell(c.x - d[0], c.z - d[1]);
  if (!inn || y <= inn.g || y >= inn.T - 1 || blk.has(ky(inn.x, y, inn.z))) continue;
  pocket.add(ky(inn.x, y, inn.z));
}

// 3. entrances: a door in the ground-floor glazing on the nearest outside face to each target, with a vestibule and canopy
const doors = [];
for (const t of [{ d: [0, -1], along: 8 }, { d: [-1, 0], along: 26 }]) {
  let best = null;
  for (const c of B.values()) {
    if (cell(c.x + t.d[0], c.z + t.d[1]) || c.T < c.g + 6) continue;   // outside faces only, storey tall enough
    const dist = Math.abs((t.d[0] !== 0 ? c.z : c.x) - t.along);
    if (!best || dist < best.dist) best = { c, dist };
  }
  if (!best) continue;
  const { c } = best, [dx, dz] = t.d, ix = c.x - dx, iz = c.z - dz, f = FACING[`${dx},${dz}`];
  put(c.x, c.g + 1, c.z, "iron_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(c.x, c.g + 2, c.z, "iron_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(c.x, c.g + 3, c.z, "light_gray_concrete");
  put(ix, c.g + 3, iz, "light_gray_concrete");                                         // canopy over the vestibule
  pocket.add(ky(ix, c.g + 1, iz)); pocket.add(ky(ix, c.g + 2, iz));
  put(ix, c.g + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
  doors.push({ x: c.x, z: c.z });
}

// 4. warm lights: a lantern on the floor of some air pockets (where the sill below is solid)
let lamps = 0;
for (const p of pocket) {
  const [x, y, z] = p.split(",").map(Number);
  // the pocket's floor is the sill row, which is solid core (not a pocket), so a lantern stands on it
  if (blk.has(ky(x, y, z)) || pocket.has(ky(x, y - 1, z)) || (x + 3 * z + y) % 4 !== 0) continue;
  put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
  lamps++;
}

// 5. core: solid concrete under every row (floors stand on floors, no interior), foundation below each ground
for (const c of B.values()) for (let y = 0; y < c.T; y++) {
  const k = ky(c.x, y, c.z);
  if (blk.has(k) || pocket.has(k)) continue;
  if (y < c.g) put(c.x, y, c.z, "stone_bricks");
  else if (y === c.T - 1) put(c.x, y, c.z, "smooth_stone");                            // roof membrane
  else put(c.x, y, c.z, "white_concrete");
}

// 6. roof plant on the tower: two blocks standing on the flat roof, away from the parapet
const tower = [...B.values()].filter((c) => c.T === 14);
const sitable = (c) => [-1, 0, 1].every((i) => [-1, 0, 1].every((j) => cell(c.x + i, c.z + j)?.T === 14));
const sites = tower.filter(sitable);
const mx = sites.reduce((s, c) => s + c.x, 0) / sites.length, mz = sites.reduce((s, c) => s + c.z, 0) / sites.length;
const near = (px, pz) => sites.reduce((b, c) => (!b || (c.x - px) ** 2 + (c.z - pz) ** 2 < (b.x - px) ** 2 + (b.z - pz) ** 2 ? c : b), null);
const plantA = near(mx, mz), plantB = near(plantA.x + 8, plantA.z + 8);
for (const [pc, w, h, block] of [[plantA, 3, 2, "light_gray_concrete"], [plantB, 2, 3, "stone_bricks"]])
  for (let i = -Math.floor(w / 2); i < w - Math.floor(w / 2); i++) for (let j = -Math.floor(w / 2); j < w - Math.floor(w / 2); j++)
    for (let y = 14; y < 14 + h; y++) put(pc.x + i, y, pc.z + j, block);

// write
const g = new Voxels(SIZE);
for (const [k, { block, state }] of blk) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/way_250462341.nbt`);
const tiers = {};
for (const c of B.values()) tiers[c.T] = (tiers[c.T] ?? 0) + 1;
console.log("cells", B.size, "tiers", JSON.stringify(tiers), "pockets", pocket.size, "lamps", lamps, "doors", JSON.stringify(doors), "roof plant at", plantA.x, plantA.z, plantB.x, plantB.z, "saved", out);
