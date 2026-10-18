// The Oak Lake park plan: trails, picnic areas and athletic fields, sized in real units (1 block = 1 m).
//   parkPlan(site, { park, roadAt }) -> { areas, trails } with each area's earthwork when it must be level
// Areas that need a level surface (fields, courts) report the pad height that moves the least earth and how much
// moves; picnic areas, the beach and trails follow the ground as it is.

// x0, z0, x1, z1 in the export's frame
export const AREAS = [
  { name: "School", kind: "building", rect: [96, 126, 117, 146], note: "the school building and its yard" },
  // Little League scale: 60 ft (18 m) base paths, outfield fence about 30 m out from home plate
  { name: "Ball field", kind: "field", rect: [121, 125, 155, 158], level: true, note: "Little League diamond, 18-block base paths" },
  // a junior football / soccer pitch with run-off, beside the school
  { name: "Athletic field", kind: "field", rect: [50, 139, 94, 158], level: true, note: "45 x 20 playing field with a running track edge" },
  // two doubles courts, 24 x 11 each (23.77 x 10.97 m), side by side with a block between; up the hill north of Lake
  // Drive (the lakeside strip there is 17 deep, too shallow for a court)
  { name: "Tennis courts", kind: "courts", rect: [100, 0, 122, 23], level: true, note: "two doubles courts" },
  { name: "Lakeside picnic grove", kind: "picnic", rect: [55, 48, 71, 60], note: "tables under the oaks by the bandstand, looking across the water" },
  { name: "South lawn picnic", kind: "picnic", rect: [92, 106, 106, 116], note: "open lawn by the playground, a shelter with a hearth" },
  { name: "Woods picnic shelter", kind: "picnic", rect: [140, 84, 152, 96], note: "a clearing in Oak Woods on the trail, a timber shelter" },
  { name: "Swimming beach", kind: "beach", rect: [54, 78, 63, 94], note: "sand on the west shore beside the boathouse" },
  { name: "Playground", kind: "play", rect: [108, 98, 118, 106], note: "swings, slide, sandpit" },
];
// trails as way points; the shore path is found from the water itself
export const TRAILS = [
  { name: "Oak Woods trail", points: [[126, 66], [140, 72], [152, 84], [154, 100], [148, 116], [134, 121], [129, 104], [131, 86], [126, 66]] },
  { name: "Green Street entrance", points: [[53, 46], [60, 54]] },
  { name: "Church Street entrance", points: [[54, 108], [62, 100]] },
  { name: "North Crescent entrance", points: [[84, 40], [84, 52]] },
  { name: "South Crescent entrance", points: [[78, 121], [80, 113]] },
  { name: "School path", points: [[104, 122], [104, 117]] },
];

const line = (pts, r = 0.8) => { const cells = new Set();
  for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 0; t <= L; t += 0.4) { const x = a[0] + ((b[0] - a[0]) * t) / L, z = a[1] + ((b[1] - a[1]) * t) / L;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const cx = Math.round(x) + dx, cz = Math.round(z) + dz; if (Math.hypot(cx - x, cz - z) <= r) cells.add(`${cx},${cz}`); } } }
  return cells; };

export function parkPlan(site, { park, roadAt }) {
  const { X, Z, H, water } = site;
  // distance from open water, in blocks (4-neighbour)
  // (from the lake itself: its largest body of water, not the pond to the east or the water left in holes)
  const comp = new Int32Array(X * Z).fill(-1), sizes = [];
  for (let s0 = 0; s0 < X * Z; s0++) { if (comp[s0] >= 0 || !water[(s0 / X) | 0][s0 % X]) continue; const id = sizes.length, st = [s0]; comp[s0] = id; let n = 0;
    while (st.length) { const i = st.pop(); n++; const x = i % X, z = (i / X) | 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= X || nz >= Z) continue; const j = nz * X + nx; if (comp[j] < 0 && water[nz][nx]) { comp[j] = id; st.push(j); } } }
    sizes.push(n); }
  const lake = sizes.indexOf(Math.max(...sizes));
  const D = new Int16Array(X * Z).fill(-1), q = [];
  for (let i = 0; i < X * Z; i++) if (comp[i] === lake) { D[i] = 0; q.push(i); }
  for (let h = 0; h < q.length; h++) { const i = q[h], x = i % X, z = (i / X) | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= X || nz >= Z) continue; const j = nz * X + nx; if (D[j] < 0) { D[j] = D[i] + 1; q.push(j); } } }
  const inArea = (x, z) => AREAS.find((a) => x >= a.rect[0] && x <= a.rect[2] && z >= a.rect[1] && z <= a.rect[3]);
  // the shore path: a 2-wide ring 4-5 blocks back from the water, inside the park, round the areas it meets
  const shore = new Set();
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) { const d = D[z * X + x]; if ((d === 4 || d === 5) && park(x, z) && !water[z][x] && !roadAt.has(`${x},${z}`) && !inArea(x, z)) shore.add(`${x},${z}`); }
  const trails = [{ name: "Shore path", cells: shore }, ...TRAILS.map((t) => ({ name: t.name, cells: new Set([...line(t.points)].filter((k) => { const [x, z] = k.split(",").map(Number); return x >= 0 && z >= 0 && x < X && z < Z && !water[z][x] && !roadAt.has(k); })) }))];
  const areas = AREAS.map((a) => {
    const [x0, z0, x1, z1] = a.rect, hs = []; let wet = 0;
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { if (water[z]?.[x]) { wet++; continue; } hs.push(H[z][x]); }
    const out = { ...a, size: [x1 - x0 + 1, z1 - z0 + 1], water: wet };
    if (a.level) { hs.sort((p, q) => p - q); let best = null;
      for (let lv = hs[0]; lv <= hs.at(-1); lv++) { let cut = 0, fill = 0; for (const h of hs) { if (h > lv) cut += h - lv; else fill += lv - h; } if (!best || cut + fill < best.cut + best.fill) best = { pad: lv, cut, fill }; }
      Object.assign(out, best); }
    return out; });
  return { areas, trails, inArea };
}
