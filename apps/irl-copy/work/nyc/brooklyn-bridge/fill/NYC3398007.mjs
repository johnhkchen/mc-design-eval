import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3398007";
const W = 23, H = 26, D = 19;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cells = new Map();
for (const [x, z, gr, roof] of raw) {
  cells.set(key(x, z), { x, z, ground: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => cells.has(key(x, z));
const all = [...cells.values()];

// One global storey grid so neighbouring walls line up.
const gbase = Math.min(...all.map(c => c.ground));

// Main roof level = median lidar roof; cells close to it snap to it,
// clearly higher cells keep their own (setback) height.
const roofs = all.map(c => c.roof).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
for (const c of all) {
  let t = Math.abs(c.roof - med) <= 2 ? med : c.roof;
  c.top = Math.min(23, Math.max(c.ground + 4, t));
}

// Exposure of each cell's faces.
for (const c of all) {
  c.nN = !has(c.x, c.z - 1);
  c.nS = !has(c.x, c.z + 1);
  c.nW = !has(c.x - 1, c.z);
  c.nE = !has(c.x + 1, c.z);
  c.edge = c.nN || c.nS || c.nW || c.nE;
  // Interior cells off the main roof level are solid cores so nothing floats.
  c.solid = !c.edge && c.top !== med;
}

// Entrance on the lowest-z street face, centred on that run.
let minZ = Infinity;
for (const c of all) if (c.edge && c.nN) minZ = Math.min(minZ, c.z);
const doorRun = all.filter(c => c.edge && c.nN && c.z === minZ).map(c => c.x).sort((a, b) => a - b);
const doorCell = doorRun.length
  ? cells.get(key(doorRun[Math.floor(doorRun.length / 2)], minZ))
  : null;

const isPier = (u) => u % 3 === 0;

for (const c of all) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, "stone_bricks");

  if (!c.edge) {
    if (c.solid) {
      // Setback core: solid masonry up to the deck, so the tier stands on what is below.
      for (let y = c.ground; y < c.top - 1; y++) g.set(c.x, y, c.z, "bricks");
      g.set(c.x, c.top - 1, c.z, "smooth_stone");
      continue;
    }
    // Interior at main level: floor slabs on the global storey grid, roof deck on top.
    for (let y = c.ground; y < c.top - 1; y++) {
      if (y === c.ground || (y - gbase) % 2 === 0) g.set(c.x, y, c.z, "smooth_stone");
    }
    g.set(c.x, c.top - 1, c.z, "smooth_stone");
    continue;
  }

  const exZ = c.nN || c.nS;
  const exX = c.nE || c.nW;
  const corner = exZ && exX;
  const u = exZ ? c.x : c.z;
  const pier = corner || isPier(u);

  for (let y = c.ground; y < c.top; y++) {
    const rel = y - gbase;
    let id = "bricks", props;

    if (rel === 0) {
      id = "stone_bricks";                       // base course
    } else if (y === c.top - 1) {
      id = "smooth_stone_slab";                  // parapet cap
      props = { type: "bottom", waterlogged: "false" };
    } else if (y === c.top - 2) {
      id = "stone_bricks";                       // cornice band
    } else if (rel % 2 === 0) {
      id = pier ? "bricks" : "smooth_stone";     // storey line / spandrel
    } else {
      if (corner || pier) {
        id = corner ? "stone_bricks" : "bricks";
      } else {
        id = "glass_pane";
        props = exZ
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        // Warm glow in the room behind some panes (only where that room is open air).
        if ((c.x * 5 + c.z * 3 + rel) % 9 === 0) {
          const dx = exX ? (c.nE ? -1 : 1) : 0;
          const dz = exZ ? (c.nN ? 1 : -1) : 0;
          const inner = cells.get(key(c.x + dx, c.z + dz));
          if (inner && !inner.edge && !inner.solid) g.set(inner.x, y, inner.z, "glowstone");
        }
      }
    }
    g.set(c.x, y, c.z, id, props);
  }
}

// Entrance door in the street-side wall.
if (doorCell) {
  const dy = doorCell.ground + 1;
  g.set(doorCell.x, dy, doorCell.z, "oak_door",
    { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorCell.x, dy + 1, doorCell.z, "oak_door",
    { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Elevator bulkhead on the open main-level interior cell nearest the centroid.
const openInterior = all.filter(c => !c.edge && !c.solid);
if (openInterior.length) {
  const cx = all.reduce((s, c) => s + c.x, 0) / all.length;
  const cz = all.reduce((s, c) => s + c.z, 0) / all.length;
  openInterior.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
  const b = openInterior[0];
  g.set(b.x, b.top, b.z, "bricks");
  g.set(b.x, b.top + 1, b.z, "bricks");
  g.set(b.x, b.top + 2, b.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
