// Procedural generator for Trial 012-vRefRevise-designdoc — "Temple of the Azure Meridian".
// SECOND PASS: a Mughal dawn-shrine (Taj-grounded) carrying the document's BOLD jewel scheme.
// The reference is white marble — information, not mandate. This pass keeps the proven craft
// from the Taj (bulbed onion-on-a-tall-drum, four free-standing minarets, deep iwan + stacked
// niches carved by EXCLUSION, flanking chattris) but commits to the split-complementary palette:
// lapis ultramarine body (dominant), warped-planks teal dome-skin + trim (supporting), purpur
// violet string-courses (inlay hinge), and gold for finials / the dome's equatorial band /
// arch keystones (warm accent). Never white. Generates to the LIVE schema, validates, renders.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileValidator, formatErrors } from "../../../../src/artifact.mjs";
import { renderArtifact } from "../../../../render/src/render-tool.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---- palette (document's split-complementary jewel hierarchy) ----
// Keys retain their structural ROLE from the Taj-marble pass; only the COLOR is re-committed,
// so the proven geometry below is untouched while the facade reads bold, never white.
const B = {
  quartz:   "minecraft:lapis_block",                  // DOMINANT ultramarine — body / drum / minaret shafts
  smoothQ:  "minecraft:warped_planks",                // SUPPORTING teal — dome skin, trim caps, parapet, dado
  diorite:  "minecraft:purpur_block",                 // INLAY violet — string-courses, frames, reveals, rings
  polDio:   "minecraft:purpur_block",                 // INLAY violet — fine framing lines (same hue)
  redS:     "minecraft:polished_blackstone",          // dark plinth body (terrace lifts the shrine)
  smoothRed:"minecraft:polished_blackstone_bricks",   // plinth crown course
  cutRed:   "minecraft:gold_block",                   // ACCENT gold — keystones / spandrels / gilded inlay
  gold:     "minecraft:gold_block",                   // ACCENT gold — silhouette finials, equatorial band
};

const P = [];
const fill = (x0,y0,z0,x1,y1,z1,block,state) => {
  const p = { op:"fill",
    from:[Math.min(x0,x1),Math.min(y0,y1),Math.min(z0,z1)],
    to:[Math.max(x0,x1),Math.max(y0,y1),Math.max(z0,z1)], block };
  if (state) p.state = state;
  P.push(p);
};
const vox = (x,y,z,block,state) => { const p={op:"voxel",pos:[x,y,z],block}; if(state)p.state=state; P.push(p); };

// ---------------------------------------------------------------------------
// GEOMETRY — facade faces +Z, proudest front at z=0, relief recedes into -Z.
// ---------------------------------------------------------------------------
const XC = 28;                 // bilateral symmetry axis
const MX0 = 0, MX1 = 56;       // full plinth footprint (width 57)
const ZBACK = -17;             // deepest structural plane (plinth/body back)

// dark plinth (terrace — ~1/6 of total height)
const PL_Y0 = 0, PL_Y1 = 6;

// cubic lapis body
const BX0 = 12, BX1 = 44;      // body width 33, centered on XC
const BODY_Y0 = 7, BODY_Y1 = 30;
const Z_BODY = -16;            // body solid-column depth

// central iwan (pishtaq) — recessed pointed-arch portal, ~0.6× body width
const PISH_X0 = 18, PISH_X1 = 38;     // pishtaq frame band
const IW_L = 22, IW_R = 34;           // iwan opening (width 13)
const IW_SPRING = 15;                 // springline
const IW_BASE = 7;
const Z_IWAN = -7;                    // iwan back wall (deep recess)

// side bays — two stacked arched niches each
const Z_NICHE = -4;

// drum + onion dome
const DRUM_Y0 = 31, DRUM_Y1 = 35, DRUM_R = 8;

// ---- pointed (equilateral four-centred) arch test ----
function archOpen(x, y, xL, xR, ys) {
  if (x < xL || x > xR) return false;
  if (y < ys) return y >= 0;
  const R = xR - xL;
  return (x-xL)**2 + (y-ys)**2 <= R*R && (x-xR)**2 + (y-ys)**2 <= R*R;
}
const iwanOpen = (x,y) => archOpen(x, y, IW_L, IW_R, IW_SPRING) && y <= 27;
const NICHE_DEFS = [
  { xL:13, xR:16, base:9,  ys:13, top:16 }, // left lower
  { xL:13, xR:16, base:19, ys:23, top:26 }, // left upper
  { xL:40, xR:43, base:9,  ys:13, top:16 }, // right lower
  { xL:40, xR:43, base:19, ys:23, top:26 }, // right upper
];
const nicheOpen = (x,y) =>
  NICHE_DEFS.some(n => y >= n.base && y <= n.top && archOpen(x, y, n.xL, n.xR, n.ys));

// ---------------------------------------------------------------------------
// 1. PLINTH — dark terrace with a crown course and a thin gilded tread band
// ---------------------------------------------------------------------------
fill(MX0, PL_Y0, 0, MX1, PL_Y1-1, ZBACK, B.redS);
fill(MX0, PL_Y1, 0, MX1, PL_Y1, ZBACK, B.smoothRed);          // crown course
fill(MX0+1, PL_Y1, 0, MX1-1, PL_Y1, 0, B.cutRed);             // thin gilded band on the tread
// teal dado line where the body meets the terrace
fill(BX0, BODY_Y0, 0, BX1, BODY_Y0, 0, B.smoothQ);

// ---------------------------------------------------------------------------
// 2. BODY — solid lapis columns everywhere EXCEPT the iwan + niche openings
//    (recess by exclusion: openings get a back wall, neighbours stay full-depth)
// ---------------------------------------------------------------------------
fill(BX0, BODY_Y0, ZBACK, BX1, BODY_Y1, ZBACK+1, B.quartz);    // back slab closes the rear
for (let y = BODY_Y0; y <= BODY_Y1; y++) {
  let x = BX0;
  while (x <= BX1) {
    const solid = !(iwanOpen(x,y) || nicheOpen(x,y));
    if (!solid) { x++; continue; }
    let xe = x;
    while (xe+1 <= BX1 && !(iwanOpen(xe+1,y) || nicheOpen(xe+1,y))) xe++;
    fill(x, y, Z_BODY, xe, y, 0, B.quartz);
    x = xe + 1;
  }
}

// ---------------------------------------------------------------------------
// 3. IWAN back wall + inner modelling (lapis in shadow, violet ground, gold door)
// ---------------------------------------------------------------------------
for (let y = IW_BASE; y <= 27; y++) {
  let x = IW_L;
  while (x <= IW_R) {
    if (!iwanOpen(x,y)) { x++; continue; }
    let xe = x; while (xe+1 <= IW_R && iwanOpen(xe+1,y)) xe++;
    fill(x, y, Z_IWAN, xe, y, Z_IWAN, B.quartz);               // lapis back wall
    x = xe + 1;
  }
}
// recessed mihrab niche at the iwan base — violet ground with a gilded door
fill(XC-2, IW_BASE, Z_IWAN+1, XC+2, IW_BASE+6, Z_IWAN+1, B.diorite);   // violet ground
fill(XC-1, IW_BASE, Z_IWAN+2, XC+1, IW_BASE+5, Z_IWAN+2, B.cutRed);    // gilded door
// inner jamb faces, one block in, in violet — gives the tunnel a soft recessed edge
for (let y = IW_BASE; y <= 27; y++) {
  if (iwanOpen(IW_L+1, y)) vox(IW_L+1, y, Z_IWAN+3, B.polDio);
  if (iwanOpen(IW_R-1, y)) vox(IW_R-1, y, Z_IWAN+3, B.polDio);
}

// ---------------------------------------------------------------------------
// 4. PISHTAQ framing (flat inlay in the z=0 front plane) — violet frame, gold keystone
// ---------------------------------------------------------------------------
fill(PISH_X0, BODY_Y0, 0, PISH_X0, BODY_Y1, 0, B.diorite);
fill(PISH_X1, BODY_Y0, 0, PISH_X1, BODY_Y1, 0, B.diorite);
fill(PISH_X0, BODY_Y1, 0, PISH_X1, BODY_Y1, 0, B.diorite);
fill(PISH_X0, BODY_Y0, 0, PISH_X1, BODY_Y0, 0, B.diorite);
// thin gilded inner line just inside the violet frame (calligraphic band)
fill(PISH_X0+1, BODY_Y0+1, 0, PISH_X0+1, BODY_Y1-1, 0, B.cutRed);
fill(PISH_X1-1, BODY_Y0+1, 0, PISH_X1-1, BODY_Y1-1, 0, B.cutRed);
fill(PISH_X0+1, BODY_Y1-1, 0, PISH_X1-1, BODY_Y1-1, 0, B.cutRed);
// archivolt: trace the arch boundary one cell outside the opening in violet (front plane)
for (let y = IW_SPRING; y <= 28; y++) {
  for (let x = IW_L-1; x <= IW_R+1; x++) {
    const inside = archOpen(x, y, IW_L, IW_R, IW_SPRING) && y <= 27;
    const outNbr = !inside && (
      (archOpen(x-1,y,IW_L,IW_R,IW_SPRING)&&y<=27) ||
      (archOpen(x+1,y,IW_L,IW_R,IW_SPRING)&&y<=27) ||
      (archOpen(x,y-1,IW_L,IW_R,IW_SPRING)&&y-1<=27) );
    if (outNbr && x >= PISH_X0+1 && x <= PISH_X1-1 && y <= BODY_Y1-1)
      vox(x, y, 0, B.diorite);
  }
}
vox(XC, 28, 0, B.gold); vox(XC-1, 28, 0, B.gold); vox(XC+1, 28, 0, B.gold); // gold keystone
// spandrel rosettes — small gilded discs in the upper corners of the pishtaq
function disc2D(cx, cy, r, z, block) {
  for (let a=-r; a<=r; a++) for (let b=-r; b<=r; b++) {
    if (a*a+b*b > r*r) continue;
    vox(cx+a, cy+b, z, block);
  }
}
disc2D(PISH_X0+3, BODY_Y1-3, 2, 0, B.cutRed);
disc2D(PISH_X1-3, BODY_Y1-3, 2, 0, B.cutRed);

// ---------------------------------------------------------------------------
// 5. NICHE back walls + violet frames (lapis recess, gilded inlay centre)
// ---------------------------------------------------------------------------
for (const n of NICHE_DEFS) {
  for (let y = n.base; y <= n.top; y++) {
    for (let x = n.xL; x <= n.xR; x++) {
      if (archOpen(x,y,n.xL,n.xR,n.ys)) vox(x, y, Z_NICHE, B.quartz); // lapis back wall
    }
  }
  // gilded inlay panel low in the niche
  fill(n.xL+1, n.base, Z_NICHE+1, n.xR-1, n.base+2, Z_NICHE+1, B.cutRed);
  // violet frame outline in the front plane around the niche head
  for (let y = n.base; y <= n.top+1; y++) {
    for (let x = n.xL-1; x <= n.xR+1; x++) {
      const inside = archOpen(x,y,n.xL,n.xR,n.ys) && y <= n.top;
      const outNbr = !inside && (
        archOpen(x-1,y,n.xL,n.xR,n.ys)||archOpen(x+1,y,n.xL,n.xR,n.ys)||
        (archOpen(x,y-1,n.xL,n.xR,n.ys)&&y-1>=n.base));
      if (outNbr && x>=BX0 && x<=BX1) vox(x, y, 0, B.diorite);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. STRING COURSES + CORNICE — violet banding + teal parapet over the body
// ---------------------------------------------------------------------------
const stringRun = (y, block) => {
  let x = BX0;
  while (x <= BX1) {
    if (iwanOpen(x,y)||nicheOpen(x,y)) { x++; continue; }
    let xe = x; while (xe+1<=BX1 && !(iwanOpen(xe+1,y)||nicheOpen(xe+1,y))) xe++;
    fill(x, y, 0, xe, y, 0, block); x = xe+1;
  }
};
stringRun(17, B.diorite);                          // violet mid-register string course (storey marker)
fill(BX0, BODY_Y1, 0, BX1, BODY_Y1, 0, B.smoothQ); // teal parapet edge over the body
fill(BX0, BODY_Y1-1, 0, BX1, BODY_Y1-1, 0, B.cutRed); // gilded cornice line (gold-and-purpur cornice)

// ---------------------------------------------------------------------------
// 7. DRUM — lapis cylinder (front half) with a violet balcony band + windows
// ---------------------------------------------------------------------------
function cylFront(cx, y0, y1, r, block) {
  for (let dx = -r; dx <= r; dx++) {
    const zr = Math.round(Math.sqrt(Math.max(0, r*r - dx*dx)));
    fill(cx+dx, y0, 0, cx+dx, y1, -zr, block);
  }
}
function ringBand(cx, y, r, block) {
  for (let dx = -r; dx <= r; dx++) {
    const zr = Math.round(Math.sqrt(Math.max(0, r*r - dx*dx)));
    fill(cx+dx, y, 0, cx+dx, y, -zr, block);
  }
}
cylFront(XC, DRUM_Y0, DRUM_Y1, DRUM_R, B.quartz);
ringBand(XC, DRUM_Y0, DRUM_R+1, B.diorite);            // violet base balcony band
for (const dx of [-5,-2,2,5]) { vox(XC+dx, DRUM_Y1-2, 0, B.diorite); vox(XC+dx, DRUM_Y1-1, 0, B.diorite); }

// ---------------------------------------------------------------------------
// 8. ONION DOME — teal skin, bulbous belly overhangs the drum, GOLD equatorial band
// ---------------------------------------------------------------------------
function domeLayer(cx, y, r, block) {
  for (let dx = -r; dx <= r; dx++) {
    const zr = Math.round(Math.sqrt(Math.max(0, r*r - dx*dx)));
    fill(cx+dx, y, 0, cx+dx, y, -zr, block);
  }
}
const DOME = [ // [y, radius] — neck pinched to 6 under the r8 drum so the r11 belly overhangs,
               // then a smooth taper up to the lotus bud. Dome height (36..47) ≈ body height.
  [36,6],[37,8],[38,10],[39,11],[40,11],[41,10],[42,8],[43,6],[44,4],[45,3],[46,2],[47,1],
];
for (const [y,r] of DOME) domeLayer(XC, y, r, B.smoothQ);   // teal dome skin
ringBand(XC, 36, 7, B.diorite);                              // violet seam ring at the pinched neck
ringBand(XC, 40, 11, B.gold);                                // GOLD equatorial band at the belly
// ---- gilded lotus finial — the silhouette apex ----
vox(XC, 48, 0, B.gold);
vox(XC, 49, 0, B.gold);
vox(XC, 50, 0, B.gold);            // spike tip (total height 50)

// ---------------------------------------------------------------------------
// 9. CHATTRIS — small teal-domed kiosks flanking the main dome (echo in miniature)
// ---------------------------------------------------------------------------
function chattri(cx, baseY) {
  cylFront(cx, baseY, baseY+2, 2, B.quartz);          // lapis posts/drum
  domeLayer(cx, baseY+3, 3, B.smoothQ);               // teal mini onion
  domeLayer(cx, baseY+4, 2, B.smoothQ);
  domeLayer(cx, baseY+5, 1, B.smoothQ);
  vox(cx, baseY+6, 0, B.gold);                        // gold tip
  ringBand(cx, baseY, 3, B.diorite);                  // violet ring
}
chattri(15, 31);
chattri(41, 31);

// ---------------------------------------------------------------------------
// 10. MINARETS — four slender free-standing lapis towers framing the dome
// ---------------------------------------------------------------------------
function minaret(cx, cz) {
  const r = 2, top = 40;
  for (let dx = -r; dx <= r; dx++) {
    const zr = Math.round(Math.sqrt(Math.max(0, r*r - dx*dx)));
    fill(cx+dx, PL_Y1+1, cz, cx+dx, top, cz-zr, B.quartz);   // lapis shaft to the dome spring line
  }
  // three violet balcony rings dividing the shaft into stages (storey markers)
  for (const by of [16, 26, 36]) {
    for (let dx = -(r+1); dx <= (r+1); dx++) {
      const zr = Math.round(Math.sqrt(Math.max(0, (r+1)*(r+1) - dx*dx)));
      fill(cx+dx, by, cz, cx+dx, by, cz-zr, B.diorite);
    }
  }
  // chattri cap: teal mini onion + gilded finial
  for (const [yy,rr] of [[41,3],[42,3],[43,2],[44,1]]) {
    for (let dx=-rr; dx<=rr; dx++){
      const zr=Math.round(Math.sqrt(Math.max(0,rr*rr-dx*dx)));
      fill(cx+dx, yy, cz, cx+dx, yy, cz-zr, B.smoothQ);
    }
  }
  vox(cx, 45, cz, B.smoothQ);
  vox(cx, 46, cz, B.gold);
}
minaret(5, 0);    minaret(51, 0);     // front pair (free-standing, gap to body)
minaret(5, -15);  minaret(51, -15);   // rear pair at the platform's back corners

// ---------------------------------------------------------------------------
// assemble + validate + render
// ---------------------------------------------------------------------------
const manifest = [...new Set(P.map(p=>p.block))];
const artifact = {
  schema_version: "1.0.0",
  metadata: {
    trial_id: "012-vRefRevise-designdoc",
    prompting_method_id: "temple-facade-reference-revise.v0",
    model_id: "claude-opus-4-8",
    seed: 11,
    server_state_id: "flat-creative-superflat.v1",
  },
  style: {
    name: "Mughal dawn-shrine — jewel-faced (Azure Meridian)",
    rationale: "Second pass holds the Taj-grounded craft (bulbed onion on a tall drum — neck pinched to r6 under the r8 drum so the r11 belly overhangs; four free-standing minarets to the spring line; deep iwan + stacked niches carved by exclusion; flanking chattris) but commits the document's split-complementary jewel scheme instead of white: lapis ultramarine body, warped-planks teal dome-skin/trim, purpur violet string-courses, and gold for the keystones, the dome's equatorial band, and every finial. Bold, never white.",
  },
  palette: { palette_id: "azure-meridian-jewel", manifest },
  placements: P,
};

const validate = compileValidator();
if (!validate(artifact)) {
  console.error("SCHEMA INVALID:\n" + formatErrors(validate.errors));
  process.exit(1);
}
console.log(`schema OK — ${P.length} placements, ${manifest.length} block types`);
writeFileSync(join(HERE, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

const report = await renderArtifact(artifact, {
  outPath: join(HERE, "render.png"),
  view: { azimuthDeg: 0, elevationDeg: 0, fov: 40 },
});
console.log("rendered:", report.path);
console.log("placed:", report.placed, "unmapped:", JSON.stringify(report.unmapped));
console.log("bounds:", JSON.stringify(report.bounds));
