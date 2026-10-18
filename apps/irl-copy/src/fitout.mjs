// Ground floors and storeys for the massing, so a building is a building and not a shell: a floor at every storey
// (from the assessor's storey count, else ~3.4 m storeys), a front door on the side facing the nearest street, rows of
// windows along that front at each storey, and a glazed shopfront on the ground floor where the record says commercial.
// Still massing: the design pipeline replaces facades and interiors, but it starts from the right storeys and entrance.
//   fitOut(g, b, ctx) -> { storeys, storeyHeight, entrance: [x, y, z, facing] | null, windows }
//   b: a building from build.mjs (cells, own, tops, base, wall, record); ctx: { I, ground, road, sc }
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

export function fitOut(g, b, { I, ground, road, sc }) {
  const rec = b.record, home = /resid|dwelling/i.test(rec?.use ?? ""), shop = /commerc|retail|store|mixed/i.test(rec?.use ?? "") && !/resid/i.test(rec?.use ?? "");
  // the median roof course (not the lowest: a rear extension or an eave would squash every storey); each floor stops
  // under its own cell's roof
  const tv = [...b.tops.values()].sort((p, q) => p - q), h = tv[tv.length >> 1] - b.base, storeys = Math.max(1, Math.min(Math.max(rec?.stories ? Math.round(rec.stories) : 0, Math.round(h / (3.6 * sc))), Math.floor(h / 3)));   // the roll counts living floors only (no raised ground floor or attic)
  const sh = Math.max(3, Math.floor(h / storeys));
  // the edge cells and which way each faces out (the first side whose neighbour isn't the building's)
  const edges = [];
  for (const [x, z] of b.cells) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!b.own.has(I(x + dx, z + dz))) { edges.push({ x, z, dx, dz }); break; }
  // floors: every storey, inside the walls (the ground floor sits a course above the ground under it)
  const inner = b.cells.filter(([x, z]) => !edges.some((e) => e.x === x && e.z === z));
  const floorBlock = home ? "oak_planks" : "smooth_stone";
  for (let k = 0; k < storeys; k++) { const y = b.base + k * sh; for (const [x, z] of inner) if (y < b.tops.get(I(x, z))) g.set(x, y, z, floorBlock); }
  if (!edges.length) return { storeys, storeyHeight: sh, entrance: null, windows: 0 };
  // the street front: the edge cells facing outward that are nearest a street (within 1.5 m of the nearest)
  const d = (e) => road[I(e.x + e.dx, e.z + e.dz)] ?? Infinity, best = Math.min(...edges.map(d));
  const front = Number.isFinite(best) ? edges.filter((e) => d(e) <= best + 1.5 * sc) : [];
  let windows = 0, entrance = null;
  if (front.length) {
    // the door: the middle of the front, two blocks tall (three at 1.4 m-ish scales would be too grand for a house)
    const sorted = front.slice().sort((a, b2) => a.x - b2.x || a.z - b2.z), door = sorted[Math.floor(sorted.length / 2)];
    const facing = FACING[`${door.dx},${door.dz}`], y0 = ground(door.x, door.z) + 1;
    const wood = home ? "spruce" : "dark_oak";
    g.set(door.x, y0, door.z, `${wood}_door`, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(door.x, y0 + 1, door.z, `${wood}_door`, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    entrance = [door.x, y0, door.z, facing];
    // windows: along the front at each storey, every other cell (a glazed shopfront on a commercial ground floor)
    for (const e of front) { if (e === door) continue; const t = b.tops.get(I(e.x, e.z));
      for (let k = 0; k < storeys; k++) { const fy = b.base + k * sh, shopfront = shop && k === 0;
        if (!shopfront && (e.x + e.z) % 2) continue;
        for (let y = fy + 1 + (shopfront ? 0 : 1); y <= fy + Math.min(sh - 1, shopfront ? sh - 1 : 2 + (sc > 1.2 ? 1 : 0)) && y < t; y++) { if (y <= ground(e.x, e.z)) continue; g.set(e.x, y, e.z, "glass_pane"); windows++; } } }
  }
  // a few windows round the other sides, so the back and flanks aren't blank
  for (const e of edges) { if (front.includes(e) || (e.x * 7 + e.z * 3) % 4) continue; const t = b.tops.get(I(e.x, e.z));
    for (let k = 0; k < storeys; k++) { const y = b.base + k * sh + 2; if (y < t && y > ground(e.x, e.z)) { g.set(e.x, y, e.z, "glass_pane"); windows++; } } }
  return { storeys, storeyHeight: sh, entrance, windows };
}
