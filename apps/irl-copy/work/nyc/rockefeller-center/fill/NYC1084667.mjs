// 745 Seventh Avenue, 1999 commercial and office building: a 149-block (about 166 m) glass-and-stone office tower on a
// five-storey base. Footprint 25 x 54 (x across, low x = west = the Seventh Avenue front; z along the avenue, low z =
// north = the cross street at the base). Lidar roof heights are snapped to the tiers the building steps through (1 =
// open forecourt, 17 = the stone base, 100 / 112 / 123 / 146 / 149 = glass setbacks) and smoothed by a 3x3 majority, so
// the lidar's noise reads as clean tiers. Every storey stands on a solid floor slab (3-block storeys: slab, then two
// rows of glass or piers); the interior behind the facade is air, so the building is a shell with floors. Each tier
// has a parapet on its open edges and a roof cap; the 149 roof carries a louvred mechanical penthouse. The base has
// a shopfront storey; the Seventh Avenue entrance is a recessed bay with a door and a dark canopy band. Warm glowstone
// sits just behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1084667.cells.json`, "utf8"));
const X = 25, Y = 160, Z = 54;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const key = (x, z) => `${x},${z}`;
const inFoot = (x, z) => cell.has(key(x, z));

// Massing: lidar roofs snapped to the tiers, then a 3x3 majority (ties go to the taller tier).
const TIERS = [1, 17, 100, 112, 123, 146, 149];
const snap = (v) => (v <= 1 ? 1 : TIERS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)));
const raw = new Map([...cell].map(([k, { roof }]) => [k, snap(roof)]));
const tier = new Map();
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const t = raw.get(key(x + dx, z + dz));
    if (t !== undefined) votes.set(t, (votes.get(t) ?? 0) + 1);
  }
  let best = 0, n = -1;
  for (const [t, v] of votes) if (v > n || (v === n && t > best)) { best = t; n = v; }
  tier.set(k, best);
}
const top = (x, z) => (inFoot(x, z) ? tier.get(key(x, z)) : 0);   // block height of the column's top (0 outside)
const open = (x, y, z) => y >= top(x, z);                         // nothing built at height y in that column

// Outward normals; W (low x) is the avenue front. An outer face is one whose neighbour is open at that height.
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
const facesAt = (x, y, z) => Object.keys(DIRS).filter((f) => open(x + DIRS[f][0], y, z + DIRS[f][1]));

// Storey rows: the ground row is a granite base course, then per storey a slab row and two glass rows; the top row is the roof cap.
const levelOf = (y, ground, R) => (y === ground ? "base" : y === R - 1 ? "cap" : (y - 1) % 3 === 0 ? "slab" : "glass");

const g = new Voxels([X, Y, Z]);
const lit = [];
const ENTRANCE_Z = [23, 27];   // recessed bay on the W face, z 23..27, door at z 25

for (const [k, { ground }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const R = tier.get(k);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");                 // foundation up to this cell's ground
  if (R === 1) { g.set(x, ground - 1, z, "smooth_stone"); continue; }        // open forecourt: paving on the foundation

  const podium = R === 17;
  for (let y = ground; y < R; y++) {
    const lv = levelOf(y, ground, R);
    if (lv === "base") { g.set(x, y, z, "polished_granite"); continue; }
    if (lv === "cap") { g.set(x, y, z, "smooth_stone"); continue; }
    if (lv === "slab") { g.set(x, y, z, podium ? "smooth_quartz" : "light_gray_concrete"); continue; }

    const faces = facesAt(x, y, z);
    if (!faces.length) continue;                                             // interior air behind the glass
    const f = faces[0];
    const u = f === "W" || f === "E" ? z : x;                                // coordinate along the face
    const shop = podium && y <= ground + 2;                                  // the base's shopfront storey
    const pierBlock = shop ? "polished_granite" : podium ? "smooth_quartz" : "polished_andesite";

    if (f === "W" && x === 0 && y >= ground + 1 && y <= ground + 2 && u >= ENTRANCE_Z[0] && u <= ENTRANCE_Z[1]) {
      if (u === 25) {
        const half = y === ground + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", { facing: "east", half, hinge: "left", open: "false", powered: "false" });
      } else if (u === 24 || u === 26) g.set(x, y, z, "black_stained_glass");
      else g.set(x, y, z, "polished_granite");
      continue;
    }
    if (u % 3 === 0) { g.set(x, y, z, pierBlock); continue; }
    g.set(x, y, z, "light_blue_stained_glass");
    if ((u * 7 + Math.floor(y / 3) * 5) % 9 === 0) lit.push([x, y, z, f]);
  }

  // Parapet on the open edge of the tier, standing on the roof cap.
  if (facesAt(x, R, z).length) g.set(x, R, z, "smooth_quartz");
}

// Warm light just behind some panes: the air gap inside the glass holds a glowstone, never a floor.
for (const [x, y, z, f] of lit) {
  const [dx, dz] = INWARD[f];
  const ix = x + dx, iz = z + dz;
  if (inFoot(ix, iz) && !g.get(ix, y, iz)) g.set(ix, y, iz, "glowstone");
}

// Mechanical penthouse on the 149 roof: louvred sides (iron bars) on a concrete sill, a roof cap at 152.
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (tier.get(k) !== 149 || x < 11 || x > 17 || z < 26 || z > 36) continue;
  const edge = x === 11 || x === 17 || z === 26 || z === 36;
  if (edge) {
    g.set(x, 149, z, "light_gray_concrete");
    g.set(x, 150, z, "iron_bars");
    g.set(x, 151, z, "iron_bars");
  }
  g.set(x, 152, z, "smooth_stone");
}

const { blocks, palette } = g.save(`${DIR}/NYC1084667.nbt`);
console.log(`NYC1084667.nbt: ${blocks} blocks, palette ${palette}`);
