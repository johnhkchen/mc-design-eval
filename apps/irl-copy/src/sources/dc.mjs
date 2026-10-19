// Washington, DC: Open Data DC (the District's DC GIS, run by the Office of the Chief Technology Officer), ArcGIS map
// services at maps2.dcgis.dc.gov, queried with an envelope in WGS84 (intersects), GeoJSON out, paged. Open Data DC
// publishes these under Creative Commons Attribution 4.0 International: credit the District (OCTO, Open Data DC).
//   buildings   planimetric footprints (roof lines, 2023 capture), no heights (the lidar gives them); fountains and canopy
//               structures are left out (fountains go to the water); each joined to its tax parcel (SSL) by its centre, and
//               named by the museum or memorial point inside it, else the smallest historic landmark that holds it
//   parcels     owner polygons (the common ownership layer: owner, premise address, use code) with the Office of
//               Planning's existing land use for a readable use; no year built (that is in the CAMA tables)
//   landmarks   the DC Inventory of Historic Sites' landmark boundaries (name, designation year)
//   streets     DDOT's roadway blocks (centrelines with names); interstates are left out (I-395 runs in tunnels and
//               trenches under the Mall and the Capitol)
//   parks       the National Park Service's reservations (the Mall, the Monument grounds, West Potomac Park) and the
//               District's parks
//   water       planimetric waterbodies (the Potomac, the Tidal Basin, the reflecting pools) and the fountains' outlines
// The National Mall is NPS land: paths, pools and trees come from OpenStreetMap (osm.mjs).
const S = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA";
const LICENCE = "CC BY 4.0 (Open Data DC)";
const CREDIT = "District of Columbia, Office of the Chief Technology Officer (OCTO), Open Data DC";
const inDC = (p) => p.city === "washington-dc";

async function arcgis(path, b, { where = "1=1", fields = "*", simplify = null } = {}) {
  const features = [];
  // paged; a layer that can't page (the place-name points) is asked once, whole
  for (let off = 0, page = true; ; off += 1000) {
    const q = new URLSearchParams({ where, outFields: fields, f: "geojson", outSR: "4326", inSR: "4326", ...(page ? { resultOffset: String(off), resultRecordCount: "1000" } : {}), ...(simplify ? { maxAllowableOffset: String(simplify) } : {}),
      geometry: `${b.west},${b.south},${b.east},${b.north}`, geometryType: "esriGeometryEnvelope", spatialRel: "esriSpatialRelIntersects" });
    let j;
    for (let k = 0; ; k++) {                                            // the city's servers drop a request now and then
      const r = await fetch(`${S}/${path}/query?${q}`);
      if (r.ok) { j = await r.json(); if (!j.error) break; if (page && /pagination/i.test(j.error.message ?? "")) break; }
      if (k >= 4) throw new Error(`DC GIS ${path}: ${r.status} ${j?.error ? JSON.stringify(j.error) : ""}`);
      await new Promise((ok) => setTimeout(ok, 2000 * 2 ** k));
    }
    if (j.error) { page = false; off -= 1000; continue; }
    features.push(...j.features); if (!page || (j.features.length < 1000 && !j.properties?.exceededTransferLimit)) break;
  }
  return { type: "FeatureCollection", features };
}

// big outlines (the Potomac is one polygon of 60,000 vertices) are simplified to about a metre (1e-5 degrees): a block is
// 2 m and more at the scales a city district is built at, and every vertex costs each cell of the polygon in cellsIn
const METRE = 1e-5;

// plane geometry in lon/lat (a few km: good enough for joins)
const rings = (g) => (g?.type === "Polygon" ? [g.coordinates] : g?.type === "MultiPolygon" ? g.coordinates : []);
function inRing(p, r) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j];
  if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c; } return c; }
const inside = (p, g) => rings(g).some((poly) => inRing(p, poly[0]) && !poly.slice(1).some((h) => inRing(p, h)));
const ringArea = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };
const area = (g) => rings(g).reduce((s, poly) => s + ringArea(poly[0]) - poly.slice(1).reduce((t, h) => t + ringArea(h), 0), 0);
// a point inside a footprint: its outer ring's centroid when that is inside (it is for most), else the middle of the
// widest horizontal run through it
function centre(g) {
  const poly = rings(g).sort((a, b) => ringArea(b[0]) - ringArea(a[0]))[0]; if (!poly) return null;
  const r = poly[0]; let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]; a += f; cx += (r[j][0] + r[i][0]) * f; cy += (r[j][1] + r[i][1]) * f; }
  const c = a ? [cx / (3 * a), cy / (3 * a)] : r[0]; if (inside(c, g)) return c;
  const y = c[1], xs = []; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y)) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi)); }
  xs.sort((p, q) => p - q); let best = null, w = -1; for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > w) { w = xs[i + 1] - xs[i]; best = [(xs[i] + xs[i + 1]) / 2, y]; }
  return best ?? c;
}
// features bucketed on a coarse lon/lat grid by their bounding boxes, so a few thousand joins stay quick
function index(features, cell = 0.002) {
  const m = new Map(), key = (i, j) => `${i},${j}`;
  for (const f of features) { const pts = rings(f.geometry).flatMap((p) => p[0]); if (!pts.length) continue;
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    for (let i = Math.floor(Math.min(...xs) / cell); i <= Math.floor(Math.max(...xs) / cell); i++) for (let j = Math.floor(Math.min(...ys) / cell); j <= Math.floor(Math.max(...ys) / cell); j++) {
      const k = key(i, j); if (!m.has(k)) m.set(k, []); m.get(k).push(f); } }
  return (p) => m.get(key(Math.floor(p[0] / cell), Math.floor(p[1] / cell))) ?? [];
}
const yearOf = (ms) => (ms ? new Date(ms).getUTCFullYear() : null);

const src = (id, layers, name, path, fetchIt) => ({ id, layers, name, licence: LICENCE, attribution: `${CREDIT}, ${name}`, url: `${S}/${path}`, covers: inDC, fetch: fetchIt });

export default [
  src("dc-buildings", ["buildings"], "Building Footprints", "Facility_and_Structure_WebMercator/MapServer/1", async (place, { box }) => {
    const fc = await arcgis("Facility_and_Structure_WebMercator/MapServer/1", box);
    const [lots, marks, museums, memorials] = await Promise.all([
      arcgis("Property_and_Land_WebMercator/MapServer/40", box, { fields: "SSL" }),
      arcgis("Planning_Landuse_and_Zoning_WebMercator/MapServer/23", box, { fields: "NAME" }),
      arcgis("Cultural_and_Society_WebMercator/MapServer/54", box, { fields: "DCGIS.PLACE_NAMES_PT.NAME" }),
      arcgis("Cultural_and_Society_WebMercator/MapServer/55", box, { fields: "DCGIS.PLACE_NAMES_PT.NAME" })]);
    const lotAt = index(lots.features), markAt = index(marks.features);
    const points = [...museums.features, ...memorials.features].filter((f) => f.geometry?.type === "Point")
      .map((f) => ({ at: f.geometry.coordinates, name: Object.entries(f.properties).find(([k]) => /NAME$/.test(k))?.[1] })).filter((p) => p.name);
    const features = fc.features.filter((f) => !/^(Fountain|Canopy Structure)$/.test(f.properties.DESCRIPTION ?? "") && rings(f.geometry).length).map((f) => {
      const c = centre(f.geometry), a = area(f.geometry);
      const lot = c && lotAt(c).find((l) => inside(c, l.geometry));
      const named = points.find((p) => inside(p.at, f.geometry))?.name
        ?? (c && markAt(c).filter((m) => inside(c, m.geometry) && area(m.geometry) <= 3 * a).sort((p, q) => area(p.geometry) - area(q.geometry))[0]?.properties.NAME) ?? null;
      return { ...f, properties: { id: `DC${f.properties.OBJECTID}`, parcel: lot ? `DC${lot.properties.SSL}` : null, name: named, kind: f.properties.DESCRIPTION ?? null } };
    });
    return { buildings: { type: "FeatureCollection", features } };
  }),
  // the common ownership layer, with the Office of Planning's existing land use (by SSL) for a use in words
  src("dc-parcels", ["parcels"], "Owner Polygons (Common Ownership Layer)", "Property_and_Land_WebMercator/MapServer/40", async (place, { box }) => {
    const [own, lu] = await Promise.all([arcgis("Property_and_Land_WebMercator/MapServer/40", box, { fields: "SSL,OWNERNAME,PREMISEADD,USECODE" }),
      arcgis("Planning_Landuse_and_Zoning_WebMercator/MapServer/4", box, { fields: "SSL,DESCRIPTION" })]);
    const use = new Map(lu.features.map((f) => [f.properties.SSL, f.properties.DESCRIPTION]));
    return { parcels: { type: "FeatureCollection", rollYear: null, features: own.features.map((f) => { const p = f.properties; return { type: "Feature", geometry: f.geometry,
      properties: { parcel: `DC${p.SSL}`, year: null, stories: null, units: null, construction: null, use: use.get(p.SSL) ?? (p.USECODE ? `use code ${p.USECODE}` : null),
        address: p.PREMISEADD ?? null, owner: p.OWNERNAME ?? null } }; }) } };
  }),
  src("dc-landmarks", ["landmarks"], "Historic Landmarks", "Planning_Landuse_and_Zoning_WebMercator/MapServer/23", async (place, { box }) => {
    const fc = await arcgis("Planning_Landuse_and_Zoning_WebMercator/MapServer/23", box, { fields: "NAME,DESIGNATION_DATE" });
    return { landmarks: { ...fc, features: fc.features.map((f) => ({ ...f, properties: { number: null, name: f.properties.NAME, year: yearOf(f.properties.DESIGNATION_DATE) } })) } };
  }),
  src("dc-streets", ["streets"], "Roadway Block (DDOT)", "Transportation_WebMercator/MapServer/163", async (place, { box }) => {
    const fc = await arcgis("Transportation_WebMercator/MapServer/163", box, { fields: "ROUTENAME,STREETNAME,STREETTYPE,FHWAFUNCTIONALCLASS" });
    return { streets: { ...fc, features: fc.features.filter((f) => +f.properties.FHWAFUNCTIONALCLASS !== 1 && f.properties.STREETTYPE !== "I")
      .map((f) => ({ ...f, properties: { name: (f.properties.ROUTENAME ?? "").replace(/\s+/g, " ").trim() || null } })) } };
  }),
  src("dc-parks", ["parks"], "National Parks and DC Parks", "Recreation_WebMercator/MapServer/10", async (place, { box }) => {
    const [nps, dpr] = await Promise.all([arcgis("Recreation_WebMercator/MapServer/10", box, { fields: "NAME,LABEL,RESERVE", simplify: METRE }), arcgis("Recreation_WebMercator/MapServer/9", box, { fields: "NAME", simplify: METRE })]);
    return { parks: { type: "FeatureCollection", features: [...nps.features.map((f) => ({ ...f, properties: { name: f.properties.LABEL ?? f.properties.NAME, owner: "NPS", reservation: f.properties.RESERVE ?? null } })),
      ...dpr.features.map((f) => ({ ...f, properties: { name: f.properties.NAME, owner: "DPR" } }))] } };
  }),
  src("dc-water", ["water"], "Waterbodies and fountains", "Environment_Water_WebMercator/MapServer/24", async (place, { box }) => {
    const [wb, ft] = await Promise.all([arcgis("Environment_Water_WebMercator/MapServer/24", box, { fields: "DESCRIPTION", simplify: METRE }),
      arcgis("Facility_and_Structure_WebMercator/MapServer/1", box, { where: "DESCRIPTION='Fountain'", fields: "DESCRIPTION" })]);
    return { water: { type: "FeatureCollection", features: [...wb.features, ...ft.features].map((f) => ({ ...f, properties: { kind: f.properties.DESCRIPTION ?? null } })) } };
  }),
];
