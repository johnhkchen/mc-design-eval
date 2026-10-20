import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001483";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 1899 Brooklyn Heights multi-family walk-up: brick walls on a stone base,
// stone storey bands and cornice, a flat roof with parapet, one entrance.
const W = 17, H = 31, D = 5;
const g = new Voxels([W, H, D]);

const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  raw.set(`${x},${z}`, { x, z, gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => raw.has(`${x},${z}`);
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

// Building-wide roof level: quantised to a whole number of storeys (3 blocks)
// above the building's median ground, so every storey and tier is complete.
const allG = [...raw.values()].map((c) => c.gr);
const allR = [...raw.values()].map((c) => c.rf);
const baseG = median(allG);
const medR = median(allR);
const nStoreys = Math.max(3, Math.min(9, Math.round((medR - baseG) / 3)));
const mainRoof = Math.min(H - 2, baseG + 3 * nStoreys);
const wingRoof = Math.max(baseG + 6, mainRoof - 6);

// Smooth ground by 3x3 median so the foundation steps cleanly on slopes.
const smoothGround = (x, z) => {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (has(x + dx, z + dz)) vals.push(raw.get(`${x + dx},${z + dz}`).gr);
  return Math.max(0, median(vals));
};

const cellMap = new Map();
for (const c of raw.values()) {
  const ground = smoothGround(c.x, c.z);
  // Lidar roof: low lidar reads as a lower wing, otherwise the main roof.
  const lowWing = c.rf <= medR - 6;
  let roof = lowWing ? wingRoof : mainRoof;
  roof = Math.min(H - 2, Math.max(ground + 6, roof));
  cellMap.set(`${c.x},${c.z}`, { x: c.x, z: c.z, ground, roof });
}

const hasCell = (x, z) => cellMap.has(`${x},${z}`);
const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];
const exposed = (c) => DIRS.filter((d) => !hasCell(c.x + d.dx, c.z + d.dz));

// Pass 1: foundation, brick walls, roof surface
for (const c of cellMap.values()) {
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, "stone_bricks");
  for (let y = c.ground; y < c.roof; y++) g.set(c.x, y, c.z, "bricks");
  g.set(c.x, c.roof - 1, c.z, "smooth_stone");
}

// Pass 2: facade articulation on exposed faces
for (const c of cellMap.values()) {
  for (const d of exposed(c)) {
    const along = d.dx !== 0 ? c.z : c.x;
    const winColumn = along % 2 === 1;
    const inner = { x: c.x - d.dx, z: c.z - d.dz };
    const innerExists = hasCell(inner.x, inner.z);
    const alongNS = d.dz !== 0;
    for (let y = c.ground; y < c.roof; y++) {
      if (y === c.roof - 1) { g.set(c.x, y, c.z, "stone_bricks"); continue; } // cornice
      const o = (y - c.ground) % 3;
      if (o === 0) { g.set(c.x, y, c.z, "stone_bricks"); continue; }        // storey line
      if (!winColumn) { g.set(c.x, y, c.z, "bricks"); continue; }          // brick pier
      g.set(c.x, y, c.z, "glass_pane", {
        north: alongNS ? "false" : "true",
        south: alongNS ? "false" : "true",
        east: alongNS ? "true" : "false",
        west: alongNS ? "true" : "false",
      });
      if (innerExists) {
        // One warm light per storey on a sparse subset of windows.
        const lit = (c.x * 3 + c.z * 5 + y) % 11 === 0 && o === 1;
        g.set(inner.x, y, inner.z, lit ? "glowstone" : "air");
      }
    }
  }
}

// Parapet on exposed roof edges
for (const c of cellMap.values()) {
  if (exposed(c).length > 0) g.set(c.x, c.roof, c.z, "stone_brick_wall");
}

// Entrance: door on the street-facing exposed cell nearest the facade centre,
// preferring the lowest ground so it sits at the base of the building.
const candidates = [];
for (const c of cellMap.values()) {
  for (const d of exposed(c)) candidates.push({ c, d });
}
candidates.sort((a, b) => {
  const pa = (a.d.name === "north" ? 0 : 1);
  const pb = (b.d.name === "north" ? 0 : 1);
  if (pa !== pb) return pa - pb;
  return Math.abs(a.c.x - 8) - Math.abs(b.c.x - 8);
});
if (candidates.length) {
  const { c, d } = candidates[0];
  const y0 = c.ground;
  g.set(c.x, y0, c.z, "dark_oak_door", {
    facing: d.name, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(c.x, y0 + 1, c.z, "dark_oak_door", {
    facing: d.name, half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
