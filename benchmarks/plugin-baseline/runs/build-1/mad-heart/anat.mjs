// Anatomy field for mad-heart: screen coordinates (u = viewer's left->right, y up, z front->back).
// The viewer's left is the patient's right (RA, SVC, IVC at small u); the apex points to the viewer's right.
export const NU = 30, NY = 36, NZ = 26;
export const idx = (u, y, z) => (u * NY + y) * NZ + z;
export const inb = (u, y, z) => u >= 0 && u < NU && y >= 0 && y < NY && z >= 0 && z < NZ;

// role codes
export const R = {
  AIR: 0, VM: 1, RA: 2, LA: 3, AUR: 4, AORTA: 5, PULM: 6, VENA: 7, PVEIN: 8, ART: 9, VEIN: 10, FAT: 11,
  FLOOR: 12, WALLIN: 13, RIB: 14,
};

export class Field {
  constructor() { this.a = new Uint8Array(NU * NY * NZ); this.room = new Uint8Array(NU * NY * NZ); }
  get(u, y, z) { return inb(u, y, z) ? this.a[idx(u, y, z)] : 0; }
  set(u, y, z, v) { if (inb(u, y, z)) this.a[idx(u, y, z)] = v; }
  // stamp role v wherever f(cx,cy,cz) (cell centre) is true
  stamp(v, f, box = [0, NU, 0, NY, 0, NZ]) {
    for (let u = box[0]; u < box[1]; u++) for (let y = box[2]; y < box[3]; y++) for (let z = box[4]; z < box[5]; z++)
      if (f(u + 0.5, y + 0.5, z + 0.5)) this.a[idx(u, y, z)] = v;
  }
  carve(f, keep = null) {
    for (let u = 0; u < NU; u++) for (let y = 0; y < NY; y++) for (let z = 0; z < NZ; z++)
      if (f(u + 0.5, y + 0.5, z + 0.5)) { if (!keep || keep(this.a[idx(u, y, z)])) this.a[idx(u, y, z)] = 0; }
  }
  count(v) { let n = 0; for (const x of this.a) if (x === v) n++; return n; }
}

export const ellipsoid = (c, r, clip = null) => (x, y, z) => {
  const dx = (x - c[0]) / r[0], dy = (y - c[1]) / r[1], dz = (z - c[2]) / r[2];
  return dx * dx + dy * dy + dz * dz <= 1 && (!clip || clip(x, y, z));
};

// tilted flattened cone (the ventricular mass)
export function ventricleCone({ apex, base, r1, r2, power = 0.85 }) {
  const a = [base[0] - apex[0], base[1] - apex[1], base[2] - apex[2]];
  const L = Math.hypot(...a);
  const ah = a.map((v) => v / L);
  // e2 = z-axis made orthogonal to the axis, e1 = ah x e2
  let z2 = [0, 0, 1];
  const dz = ah[2];
  let e2 = [z2[0] - dz * ah[0], z2[1] - dz * ah[1], z2[2] - dz * ah[2]];
  const n2 = Math.hypot(...e2); e2 = e2.map((v) => v / n2);
  const e1 = [ah[1] * e2[2] - ah[2] * e2[1], ah[2] * e2[0] - ah[0] * e2[2], ah[0] * e2[1] - ah[1] * e2[0]];
  return (x, y, z) => {
    const p = [x - apex[0], y - apex[1], z - apex[2]];
    const s = p[0] * ah[0] + p[1] * ah[1] + p[2] * ah[2];
    if (s < -2.3) return false;
    const t = Math.max(0, Math.min(1.12, s / L));
    // profile: blunt rounded tip, near-cone body, rounded shoulder past the base
    let k = Math.hypot(Math.sin(0.5 * Math.PI * Math.pow(Math.min(1, t), power)), 0.13);
    if (t > 1) k *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 1) / 0.12, 2)));
    if (s < 0) k = Math.sqrt(Math.max(0, 1 - Math.pow(s / -2.3, 2))) * 0.13;
    const q1 = p[0] * e1[0] + p[1] * e1[1] + p[2] * e1[2];
    const q2 = p[0] * e2[0] + p[1] * e2[1] + p[2] * e2[2];
    const w1 = k * r1, w2 = k * r2;
    if (w1 < 0.3 || w2 < 0.3) return false;
    return (q1 / w1) ** 2 + (q2 / w2) ** 2 <= 1;
  };
}

// swept tube along a polyline of [x,y,z,r?]; pts are control points, Catmull-Rom smoothed
export function pathPoints(pts, step = 0.35) {
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
    const n = Math.max(2, Math.ceil(seg / step));
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      const f = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      const r = p1[3] !== undefined ? p1[3] + ((p2[3] ?? p1[3]) - p1[3]) * t : undefined;
      out.push([f(0), f(1), f(2), r]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function tube(pts, r, step = 0.35) {
  const P = pathPoints(pts, step);
  return (x, y, z) => {
    for (const p of P) {
      const rr = p[3] ?? r;
      const dx = x - p[0], dy = y - p[1], dz = z - p[2];
      if (dx * dx + dy * dy + dz * dz <= rr * rr) return true;
    }
    return false;
  };
}

// nearest-path distance (for painting curves on the surface)
export function distToPath(pts, step = 0.3) {
  const P = pathPoints(pts, step);
  return (x, y) => { let m = 1e9; for (const p of P) { const d = Math.hypot(x - p[0], y - p[1]); if (d < m) m = d; } return m; };
}

export function slice(F, y, chars = null) {
  const ch = chars ?? { 0: ".", 1: "#", 2: "A", 3: "L", 4: "e", 5: "O", 6: "P", 7: "V", 8: "v", 9: "r", 10: "b", 11: "f", 12: "=", 13: "w" };
  let s = `y=${y}\n`;
  for (let z = 0; z < NZ; z++) { let row = ""; for (let u = 0; u < NU; u++) row += ch[F.get(u, y, z)] ?? "?"; s += row + "\n"; }
  return s;
}
export function frontView(F) { // column heights: front-most solid per (u,y): prints role of cell facing viewer
  let s = "";
  for (let y = NY - 1; y >= 0; y--) { let row = ""; for (let u = 0; u < NU; u++) { let c = "."; for (let z = 0; z < NZ; z++) { const v = F.get(u, y, z); if (v) { c = " #ALeOPVvrbf=w"[v] ?? "?"; break; } } row += c; } s += String(y).padStart(2) + " " + row + "\n"; }
  return s;
}

// room label slice: hull '#', cavity cells by room code char
export function roomSlice(F, y) {
  const ch = ".123456789abcdefghij";
  let s = `y=${y}\n   ` + [...Array(NU).keys()].map((u) => u % 10).join("") + "\n";
  for (let z = 0; z < NZ; z++) { let row = String(z).padStart(2) + " "; for (let u = 0; u < NU; u++) { const r = F.room[idx(u, y, z)]; row += r ? ch[r] : (F.get(u, y, z) ? "#" : "."); } s += row + "\n"; }
  return s;
}

// vertical sections: plane z (u across, y up) or plane u (z across, y up)
export function sectionZ(F, z) {
  const ch = ".123456789abcdefghij";
  let s = `z=${z}\n   ` + [...Array(NU).keys()].map((u) => u % 10).join("") + "\n";
  for (let y = NY - 1; y >= 0; y--) { let row = String(y).padStart(2) + " "; for (let u = 0; u < NU; u++) { const r = F.room[idx(u, y, z)]; row += r ? ch[r] : (F.get(u, y, z) ? "#" : "."); } s += row + "\n"; }
  return s;
}
export function sectionU(F, u) {
  const ch = ".123456789abcdefghij";
  let s = `u=${u}\n   ` + [...Array(NZ).keys()].map((z) => z % 10).join("") + "\n";
  for (let y = NY - 1; y >= 0; y--) { let row = String(y).padStart(2) + " "; for (let z = 0; z < NZ; z++) { const r = F.room[idx(u, y, z)]; row += r ? ch[r] : (F.get(u, y, z) ? "#" : "."); } s += row + "\n"; }
  return s;
}
