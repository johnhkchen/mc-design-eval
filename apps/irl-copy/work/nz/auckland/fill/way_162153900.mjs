import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 162153900, Mt Eden / Newton: a 1930s-style red-brick commercial block, read from the lidar roof heights. The roof
// heights are median-smoothed into three flat tiers (one, two and three storeys, the tallest on the north-east edge),
// each storey 4 blocks with a 5-block shopfront at the bottom. Render bands and lintels in smooth quartz, a glazed
// shopfront with a dark timber awning and a door on the south side, lit windows behind the glass in some bays, and a
// few roof units. Each footprint cell is one brick thick; the interior is air, with a floor slab per storey.
const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_162153900.cells.json`, "utf8"));

const W = 17, D = 25, H = 28;
const vox = new Voxels([W, H, D]);

const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { x, z, gr, r });
const cellAt = (x, z) => byXZ.get(`${x},${z}`);
const nbr = (c, [dx, dz]) => cellAt(c.x + dx, c.z + dz);
const inner = (c, face) => { const [dx, dz] = FACES[face]; return nbr(c, [-dx, -dz]); };
const list = [...byXZ.values()];

// 1. Flat tiers: the median roof of each cell and its footprint neighbours decides one, two or three storeys.
// Floors sit at the ground line then every 4 blocks above a 5-block shopfront; the roof row is the top block.
for (const c of list) {
  const rs = [c.r, ...Object.values(FACES).map((d) => nbr(c, d)?.r).filter((v) => v !== undefined)].sort((a, b) => a - b);
  const m = rs[rs.length >> 1];
  c.n = m <= 8 ? 1 : m <= 11 ? 2 : 3;
  c.floors = Array.from({ length: c.n }, (_, k) => (k === 0 ? c.gr : c.gr + 5 + 4 * (k - 1)));
  c.top = c.gr + 5 + 4 * (c.n - 1);
  c.faces = Object.keys(FACES).filter((f) => !nbr(c, FACES[f]));
}

// 2. Shell cells: on the outside edge, or beside a lower neighbour (a party wall above the lower roof). Others are interior.
for (const c of list) {
  c.shell = c.faces.length > 0 || Object.values(FACES).some((d) => { const n = nbr(c, d); return n && n.top < c.top; });
}

// 3. The entrance: the south-edge bay nearest x 9 whose inside is an interior cell, so the door opens onto air.
const doorCands = list.filter((c) => c.faces.join() === "south" && inner(c, "south") && !inner(c, "south").shell);
const door = doorCands.sort((a, b) => Math.abs(a.x - 9) - Math.abs(b.x - 9))[0];

// 4. Windows: an exterior bay of glass unless it is a pier (every third cell along the face) or a corner; its inside is air.
for (const c of list) {
  c.corner = c.faces.length >= 2;
  c.door = c === door;
  c.win = false;
  if (c.shell && c.faces.length === 1 && !c.door) {
    const face = c.faces[0];
    const i = face === "north" || face === "south" ? c.x : c.z;
    const ic = inner(c, face);
    c.win = i % 3 !== 0 && !!ic && !ic.shell;
  }
}

// What a shell cell's column holds at height y: the base course, a storey's floor band, its window zone, its lintel,
// or the roof.
function roleAt(c, y) {
  if (y === c.gr) return "base";
  if (y === c.top) return "roof";
  for (let k = 0; k < c.n; k++) {
    const F = c.floors[k], next = k + 1 < c.n ? c.floors[k + 1] : c.top;
    if (y >= F && y < next) {
      if (k > 0 && y === F) return "band";
      if (y === next - 1) return "lintel";
      return "zone";
    }
  }
  return "above";
}

// 5. Columns. The foundation fills from y 0 to each cell's ground; the building stands on it.
for (const c of list) {
  for (let y = 0; y < c.gr; y++) vox.set(c.x, y, c.z, "stone_bricks");

  if (!c.shell) {
    // Interior: a slab per storey and the roof, the rest of the column stays air.
    for (const F of c.floors) vox.set(c.x, F, c.z, "smooth_stone");
    vox.set(c.x, c.top, c.z, "smooth_stone");
    continue;
  }

  for (let y = c.gr; y <= c.top; y++) {
    const role = roleAt(c, y);
    if (role === "base") { vox.set(c.x, y, c.z, "stone_bricks"); continue; }
    if (role === "band" || role === "lintel") {
      // the canopy over the entrance replaces the lintel of the three bays either side of the door
      if (role === "lintel" && door && c.faces.join() === "south" && Math.abs(c.x - door.x) <= 1) {
        vox.set(c.x, y, c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      } else vox.set(c.x, y, c.z, "smooth_quartz");
      continue;
    }
    if (role === "roof") {
      vox.set(c.x, y, c.z, c.faces.length ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    // window zone: corners are brick piers, as are the piers between bays
    if (c.corner) { vox.set(c.x, y, c.z, "bricks"); continue; }
    if (c.door && (y === c.gr + 1 || y === c.gr + 2)) {
      const half = y === c.gr + 1 ? "lower" : "upper";
      vox.set(c.x, y, c.z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (c.win || (c.door && y === c.gr + 3)) {
      const across = c.faces[0] === "west" || c.faces[0] === "east";
      const pane = across
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
      vox.set(c.x, y, c.z, "glass_pane", pane);
      continue;
    }
    vox.set(c.x, y, c.z, "bricks");
  }

  // The tallest tier's parapet: alternate cap and brick along each outside face.
  if (c.n === 3 && c.faces.length) {
    const i = c.faces[0] === "west" || c.faces[0] === "east" ? c.z : c.x;
    vox.set(c.x, c.top + 1, c.z, i % 2 === 0 ? "smooth_quartz" : "bricks");
  }
}

// 6. Warm light behind some glass: glowstone on the ground floor, shroomlight above, on the interior air's floor.
for (const c of list) {
  if (!c.win) continue;
  const ic = inner(c, c.faces[0]);
  c.floors.forEach((F, k) => {
    if ((c.x + c.z + k) % 3 === 0) vox.set(ic.x, F + 1, ic.z, k === 0 ? "glowstone" : "shroomlight");
  });
}

// 7. Roof plant on the interior roofs: a regular grid of units standing on the roof surface.
for (const c of list) {
  if (!c.shell && c.x % 4 === 2 && c.z % 4 === 2) vox.set(c.x, c.top + 1, c.z, "iron_block");
}

const counts = vox.save(`${HERE}/way_162153900.nbt`);
console.log(`way_162153900.nbt: ${counts.blocks} blocks, palette ${counts.palette}; tiers 1/2/3 storeys: ${[1, 2, 3].map((n) => list.filter((c) => c.n === n).length).join(" / ")}`);
