// One Pacific Towers Condominium, 2000 1st Ave (Belltown, 1994): a 21-storey concrete-frame condo tower on a
// granite-grey plinth with a glazed retail base on the north and west (street) faces. Pale precast piers on a
// 4-block bay with dark bronze-grey glass between them, a light spandrel band at every storey line (rows 6, 11, ...
// 106), a setback from storey 17 with a terrace on the ring below it, a cornice and parapet at 111-112, and a
// mechanical penthouse with two plant boxes on the roof. The entrance is a glazed bay on the north face at the
// lowest ground: a short stair inside the vestibule climbs to the lobby floor, under a canopy, with a lantern.
// Interiors are hollow: a floor slab per storey, air behind the glass, glowstone and shroomlight in some windows.
// Each footprint cell is filled from y 0 to its own ground, so the uphill side is buried and the downhill side shows
// basement windows under the lobby.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${HERE}/SEA1270135283.cells.json`, "utf8"));   // [x, z, ground] per footprint cell

const W = 48, D = 60, H = 122;
const SETBACK = 17, TOP = 20, LOBBY = 7, ROOF = 111, PARAPET = 112;
const S = (k) => 6 + 5 * k;                                 // spandrel row of storey k: 6, 11, ... 106

const G = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inside = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);
const NB = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// Depth from the outside: 1 = the exterior ring, 2 = one in, and so on.
const depth = new Map();
let frontier = cells.filter(([x, z]) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1));
for (const [x, z] of frontier) depth.set(`${x},${z}`, 1);
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of Object.values(NB)) {
    const k = `${x + dx},${z + dz}`;
    if (inside(x + dx, z + dz) && !depth.has(k)) { depth.set(k, depth.get(`${x},${z}`) + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}
const dep = (x, z) => depth.get(`${x},${z}`) ?? 0;

// The sides a cell looks out of: a neighbour outside the footprint, or one nearer the outside.
const outward = (x, z) => Object.entries(NB)
  .filter(([, [dx, dz]]) => !inside(x + dx, z + dz) || dep(x + dx, z + dz) < dep(x, z)).map(([f]) => f);
// Piers on a 4-block bay; a corner (two sides) is always a pier.
const isPier = (x, z, f) => f.length !== 1 || ((f[0] === "N" || f[0] === "S" ? x : z) % 4 === 0);
// Panes and bars run along their face: east-west on a north or south face, north-south on an east or west face.
const bars = (f) => (f[0] === "N" || f[0] === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const V = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < H && inside(x, z)) V.set(x, y, z, block, state); };

// Entrance: the lowest glazed bay on the north face. The lobby floor is the slab at y 6 (top at 7), so a stair
// inside the vestibule climbs from the threshold at the cell's ground to that floor, one step per cell.
const cand = cells.filter(([x, z]) => dep(x, z) === 1 && x % 4 === 2 && outward(x, z).join() === "N");
cand.sort((a, b) => ground(a[0], a[1]) - ground(b[0], b[1]) || Math.abs(a[0] - 24) - Math.abs(b[0] - 24));
const [dx, dz] = cand[0];
const g0 = ground(dx, dz);
const flight = new Map();                                    // "x,z" -> top of the step there
for (let j = 1; j <= LOBBY - g0; j++) for (let x = dx - 1; x <= dx + 1; x++) flight.set(`${x},${dz + j}`, g0 + j);
const stepTop = (x, z) => flight.get(`${x},${z}`);

// Foundation and plinth: solid from y 0 up to each cell's ground, then a stone base course to the ground floor.
for (const [x, z, g] of cells) {
  const d = dep(x, z), f = outward(x, z), t = stepTop(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, "stone");
  const top = t === undefined ? 5 : t - 2;                  // a stair cell stays open above its step
  for (let y = g; y <= top; y++) put(x, y, z, d === 1 ? "stone_bricks" : "gray_concrete");
  // Basement windows on the downhill side: the low ground shows the storeys under the lobby.
  if (d === 1 && g <= 3 && !isPier(x, z, f)) for (const y of [2, 3]) if (y >= g) put(x, y, z, "gray_stained_glass_pane", bars(f));
}

// Storeys: the envelope is the outer ring below the setback and the second ring above it.
for (const [x, z] of cells) {
  const d = dep(x, z), t = stepTop(x, z);
  for (let k = 0; k <= TOP; k++) {
    const s = S(k), env = k >= SETBACK ? 2 : 1;
    if (d === env) {
      const f = outward(x, z), pier = isPier(x, z, f);
      const shop = k === 0 && !pier && (f[0] === "N" || f[0] === "W");   // retail on the street faces
      put(x, s, z, pier ? "smooth_quartz" : "light_gray_concrete");       // spandrel
      for (let y = s + 1; y <= s + 4; y++) {
        if (pier) put(x, y, z, "smooth_quartz");
        else if (shop) put(x, y, z, y <= s + 3 ? "glass" : "polished_andesite");
        else put(x, y, z, "gray_stained_glass_pane", bars(f));
      }
      // Warm light one step inside some windows, in the air gap behind the glass.
      const h = ((x * 73856093) ^ (z * 19349663) ^ (k * 83492791)) >>> 0;
      if (!pier && !shop && h % 8 === 0) {
        const [vx, vz] = NB[f[0]], ix = x - vx, iz = z - vz;
        if (inside(ix, iz) && dep(ix, iz) === d + 1 && stepTop(ix, iz) === undefined)
          put(ix, s + 2, iz, h % 16 === 0 ? "shroomlight" : "glowstone");
      }
      if (k === TOP) { put(x, ROOF, z, "smooth_quartz"); put(x, PARAPET, z, "smooth_quartz"); }   // cornice, parapet
      continue;
    }
    if (k === SETBACK && d === 1) { put(x, s, z, "light_gray_concrete"); put(x, s + 1, z, "iron_bars", bars(outward(x, z))); continue; }   // terrace and rail
    if (d > env && !(k === 0 && t !== undefined)) put(x, s, z, "stone");   // floor slab per storey, open over the stair
  }
  if (d > 2) put(x, ROOF, z, "light_gray_concrete");        // roof deck inside the parapet
}

// Entrance: iron doors in the glazed bay, a canopy over the vestibule, the stair, a hanging lantern.
for (let x = dx - 1; x <= dx + 1; x++) for (let z = dz; z <= dz + 1; z++) put(x, g0 + 3, z, "smooth_quartz");
put(dx, g0, dz, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx, g0 + 1, dz, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const [key, top] of flight) {
  const [x, z] = key.split(",").map(Number);
  put(x, top - 1, z, "smooth_quartz_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
}
put(dx, g0 + 2, dz + 1, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: a mechanical penthouse near the middle of the setback roof, with two plant boxes beside it.
const fits = (x0, z0, w, dd, minD) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + dd; z++) if (!inside(x, z) || dep(x, z) < minD) return false;
  return true;
};
let ph = null;
for (let x0 = 0; x0 <= W - 10; x0++) for (let z0 = 0; z0 <= D - 8; z0++) {
  if (!fits(x0, z0, 10, 8, 5)) continue;
  const sc = Math.abs(x0 + 5 - 24) + Math.abs(z0 + 4 - 30);
  if (!ph || sc < ph.sc) ph = { x0, z0, sc };
}
if (ph) {
  for (let x = ph.x0; x < ph.x0 + 10; x++) for (let z = ph.z0; z < ph.z0 + 8; z++) {
    const edgeX = x === ph.x0 || x === ph.x0 + 9, edgeZ = z === ph.z0 || z === ph.z0 + 7;
    put(x, 116, z, "light_gray_concrete");                   // roof slab
    if (!edgeX && !edgeZ) continue;
    const f = edgeZ ? ["N"] : ["W"];
    for (let y = 112; y <= 115; y++) {
      if ((edgeX && edgeZ) || y === 112 || y === 115) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "gray_stained_glass_pane", bars(f));
    }
  }
  for (const [mx, mz] of [[ph.x0 - 6, ph.z0 + 2], [ph.x0 + 12, ph.z0 + 2]]) {
    if (!fits(mx, mz, 4, 3, 3)) continue;
    for (let x = mx; x < mx + 4; x++) for (let z = mz; z < mz + 3; z++) {
      put(x, 112, z, "light_gray_concrete");
      put(x, 113, z, "light_gray_concrete");
      put(x, 114, z, "iron_bars", bars(["N"]));
    }
  }
}

console.log(V.save(`${HERE}/SEA1270135283.nbt`));
