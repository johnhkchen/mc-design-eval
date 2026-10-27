// Way 292861514: an eight-storey concrete-and-glass office block on a 35 x 28 footprint, c. 1970s-80s, CBD edge.
// Lidar roof is flat (31-34 blocks on most cells, median 32 = 8 storeys of 4); the few cells at 44-59 are DSM spikes
// on the rim, clamped to the roof. Solid frame and core, a window ribbon per storey with white piers, a storefront on
// the downhill (ground 0) side with a door and hood, a parapet and a roof plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 35, H = 72, D = 28;
const STOREY = 4, ROOF = 32;                       // roof top surface at y 32 (body y 0..31), parapet to 33
const cells = JSON.parse(readFileSync(`${DIR}/way_292861514.cells.json`, "utf8"));   // [x, z, ground, roof]

const ground = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, gr] of cells) ground[x][z] = gr;
const inF = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground[x][z] >= 0;

// the four sides as [outward dx, dz, name]
const SIDES = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const outward = (x, z) => SIDES.filter(([dx, dz]) => !inF(x + dx, z + dz));
// ring0: a facade cell (has a neighbour outside the footprint); ring1: the cell behind it (air pocket); core: the rest (solid)
const kind = (x, z) => {
  if (!inF(x, z)) return "out";
  if (outward(x, z).length) return "ring0";
  return SIDES.some(([dx, dz]) => inF(x + dx, z + dz) && outward(x + dx, z + dz).length) ? "ring1" : "core";
};
const pane = (block, x, z, [odx]) => {
  // a pane joins its neighbours along the face (not out of it): the face runs east-west on a north/south wall
  const plane = odx !== 0 ? [[0, 1, "south"], [0, -1, "north"]] : [[1, 0, "east"], [-1, 0, "west"]];
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [dx, dz, name] of plane) st[name] = String(inF(x + dx, z + dz));
  return { block, state: st };
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const clear = (x, y, z) => g.setCellAt(g.at(x, y, z), 0);   // an air pocket (missing cells are air)

// 1. foundation to the ground, solid core to the roof, roof slab
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (let y = gr; y < ROOF - 1; y++) put(x, y, z, "stone");
  put(x, ROOF - 1, z, "light_gray_concrete");
}

// 2. the facade (ring0): ground band, storey slabs, window ribbons with piers, cornice, parapet
const door = (() => {
  const shops = cells.filter(([x, z, gr]) => gr === 0 && outward(x, z).some(([, dz]) => dz === -1));
  shops.sort((a, b) => a[0] - b[0]);
  return shops[Math.floor(shops.length / 2)];
})();
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  if (!out.length) continue;
  const [odx, odz] = out[0];
  const along = odz !== 0 ? x : z;            // index along the face, for the window rhythm
  const shop = gr === 0 && out.some(([dx, dz]) => dx === -1 || dz === -1);   // the downhill, north-west side

  // ground band: a storefront on the shop side, a plinth everywhere else
  for (let y = gr; y < STOREY; y++) {
    let b = "polished_andesite";
    if (shop) b = y === 0 ? "polished_andesite" : y < 3 ? "glass" : "light_gray_concrete";
    put(x, y, z, b);
  }
  // warm light behind some shop glass
  if (shop && along % 3 === 1) for (const y of [1, 2]) { const [nx, nz] = [x - odx, z - odz]; if (inF(nx, nz)) put(nx, y, nz, "glowstone"); }

  // storeys 1..7: slab line, two window rows between, header (the top header is the cornice)
  for (let k = 1; k * STOREY < ROOF; k++) {
    const s = k * STOREY, pier = along % 3 === 0;
    put(x, s, z, "light_gray_concrete");
    for (const y of [s + 1, s + 2]) {
      if (pier) put(x, y, z, "white_concrete");
      else { const p = pane("light_blue_stained_glass_pane", x, z, out[0]); put(x, y, z, p.block, p.state); }
    }
    put(x, s + 3, z, k === 7 ? "polished_andesite" : "light_gray_concrete");
    // air pocket behind the window, with a warm light in some of them
    if (!pier) {
      const [nx, nz] = [x - odx, z - odz];
      if (inF(nx, nz) && kind(nx, nz) !== "ring0") {
        const lit = (x * 5 + z * 3 + k * 7) % 9 === 0;
        for (const y of [s + 1, s + 2]) lit ? put(nx, y, nz, "glowstone") : clear(nx, y, nz);
      }
    }
  }
  put(x, ROOF, z, "light_gray_concrete");       // parapet
}

// 3. entrance on the storefront: a door (lower and upper half) under a hood
if (door) {
  const [x, z] = door;
  const out = outward(x, z); const [odx, odz] = out.find(([dx, dz]) => dx === -1 || dz === -1) ?? out[0];
  const facing = odz === -1 ? "north" : odz === 1 ? "south" : odx === -1 ? "west" : "east";
  put(x, 0, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const a of [-1, 0, 1]) {
    const hx = x + (odz !== 0 ? a : 0), hz = z + (odx !== 0 ? a : 0);
    if (inF(hx, hz)) put(hx, 2, hz, "polished_andesite");
  }
}

// 4. roof plant room: a 7 x 5 box on the roof, nearest the middle of the footprint, off the facade
let best = null;
for (let x0 = 0; x0 + 7 <= W; x0++) for (let z0 = 0; z0 + 5 <= D; z0++) {
  let ok = true;
  for (let x = x0; x < x0 + 7 && ok; x++) for (let z = z0; z < z0 + 5 && ok; z++) ok = inF(x, z) && kind(x, z) !== "ring0";
  if (!ok) continue;
  const score = Math.abs(x0 + 3 - 17) + Math.abs(z0 + 2 - 14);
  if (!best || score < best.score) best = { x0, z0, score };
}
if (best) {
  const { x0, z0 } = best;
  for (let x = x0; x < x0 + 7; x++) for (let z = z0; z < z0 + 5; z++) {
    const edge = x === x0 || x === x0 + 6 || z === z0 || z === z0 + 4;
    put(x, ROOF, z, "light_gray_concrete");
    // plant walls: concrete with one band of louvred glass
    if (edge) for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, y === ROOF + 2 ? "glass" : "light_gray_concrete");
    put(x, ROOF + 4, z, "polished_andesite");
  }
  put(x0 + 3, ROOF + 5, z0 + 2, "lightning_rod");
}

const { blocks, palette } = g.save(`${DIR}/way_292861514.nbt`);
console.log(JSON.stringify({ footprint: cells.length, roof: ROOF, plant: best, door: door ? door.slice(0, 2) : null, blocks, palette }));
