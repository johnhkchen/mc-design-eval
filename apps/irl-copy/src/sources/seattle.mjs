// City of Seattle GIS open data (ArcGIS feature services behind data-seattlecitygis.opendata.arcgis.com). The city's open
// data policy (OD-1, 2016) publishes its data sets "without registration, licensing requirements, or restrictions on use"
// and may ask that a user name the source and version, so every place credits the layer and its year. Parcels are King
// County's tax parcels with the city's overlays. Queried with an envelope in WGS84 (intersects), GeoJSON out, paged.
const S = "https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services";
const LICENCE = "City of Seattle open data (Open Data Policy OD-1: no licensing requirements or restrictions on use; source credited)";
const inSeattle = (p) => p.city === "seattle";

async function arcgis(service, layer, b, { where = "1=1", fields = "*" } = {}) {
  const features = [];
  for (let off = 0; ; off += 2000) {
    const q = new URLSearchParams({ where, outFields: fields, f: "geojson", outSR: "4326", inSR: "4326", resultOffset: String(off), resultRecordCount: "2000",
      ...(b ? { geometry: `${b.west},${b.south},${b.east},${b.north}`, geometryType: "esriGeometryEnvelope", spatialRel: "esriSpatialRelIntersects" } : {}) });
    const r = await fetch(`${S}/${service}/FeatureServer/${layer}/query?${q}`); if (!r.ok) throw new Error(`Seattle ${service}: ${r.status}`);
    const j = await r.json(); if (j.error) throw new Error(`Seattle ${service}: ${JSON.stringify(j.error)}`);
    features.push(...j.features); if (j.features.length < 2000 && !j.properties?.exceededTransferLimit) break;
  }
  return { type: "FeatureCollection", features };
}
const src = (id, layers, name, service, layer, shape) => ({
  id, layers, name, licence: LICENCE, attribution: `City of Seattle, ${name}`, url: `${S}/${service}/FeatureServer/${layer}`, covers: inSeattle,
  async fetch(place, frame) { return shape(await arcgis(service, layer, frame.box)); },
});

/** One of the city's designated landmarks (SMC 25.12) by number: the register gives a point, so its boundary is its tax
 *  parcel's (by PIN) where it has one. */
export async function landmark(no) {
  const { features: [f] } = await arcgis("Landmarks", 0, null, { where: `LANDNO=${+no}` }); if (!f) throw new Error(`no Seattle landmark ${no}`);
  const p = f.properties, lot = p.PIN ? (await arcgis("PARCEL_GEO", 0, null, { where: `PIN='${p.PIN}'`, fields: "PIN" })).features[0] : null;
  return { number: +no, name: p.NAME, address: p.ADDRESS, year: p.EFF_DATE ? new Date(p.EFF_DATE).getUTCFullYear() : null,
    photo: p.PHOTO ?? null, document: p.DOCUMENT ?? null, geometry: lot?.geometry ?? f.geometry, city: "seattle", register: "Seattle landmark" };
}

export default [
  // 10 ft contours (2016, from the city's lidar): elevation in feet. Only a fallback: the 3DEP point cloud covers Seattle
  src("sea-contours", ["ground"], "Contours 10ft 2016", "Contours_10ft_2016", 0, (fc) => ({ ground: { kind: "contours", unit: 0.3048, field: "CONTOUR", ...fc } })),
  // hand-drawn outlines from King County's 2023 orthophotos; no heights (the lidar gives them), joined to parcels by PIN
  src("sea-buildings", ["buildings"], "Building Outlines 2023", "Building_Outlines_2023", 0, (fc) => ({ buildings: { ...fc, features: fc.features.map((f) => ({ ...f,
    properties: { id: `SEA${f.properties.OUTLINE_ID ?? f.properties.OBJECTID}`, parcel: f.properties.PIN ? `SEA${f.properties.PIN}` : null } })) } })),
  src("sea-streets", ["streets"], "Street Network Database (SND)", "Street_Network_Database_SND", 0, (fc) => ({ streets: { ...fc, features: fc.features
    // streets, their ramps, alleys, parking access and stubs (not freeways, stairs, walkways, trails, rail, docks, the monorail)
    .filter((f) => [1, 2, 5, 14, 15].includes(f.properties.SEGMENT_TYPE))
    .map((f) => ({ ...f, properties: { name: f.properties.ORD_STNAME_CONCAT ?? null } })) } })),
  src("sea-parks", ["parks"], "Park Boundary (details)", "Park_Boundary_(details)", 2, (fc) => ({ parks: { ...fc, features: fc.features.map((f) => ({ ...f,
    properties: { name: f.properties.NAME ?? f.properties.PMA_NAME ?? null } })) } })),
  // King County tax parcels: year built, present use and building description (no construction class or storey count)
  src("sea-parcels", ["parcels"], "King County Tax Parcel Polygons with select City of Seattle geographic overlays", "PARCEL_GEO", 0, (fc) => ({ parcels: { type: "FeatureCollection",
    rollYear: null, features: fc.features.map((f) => { const p = f.properties; return { type: "Feature", geometry: f.geometry, properties: { parcel: `SEA${p.PIN}`,
      year: +p.YR_BUILT_MAX || null, stories: null, units: +p.NR_UNITS || null, construction: null, use: p.PRES_USE ?? p.LU_GEN_DESC ?? null, address: p.ADDRESS ?? null,
      name: p.PROP_NAME ?? null } }; }) } })),
  src("sea-landmarks", ["landmarks"], "Landmarks", "Landmarks", 0, (fc) => ({ landmarks: { ...fc, features: fc.features.map((f) => ({ ...f,
    properties: { number: +f.properties.LANDNO || null, name: f.properties.NAME, year: f.properties.EFF_DATE ? new Date(f.properties.EFF_DATE).getUTCFullYear() : null } })) } })),
];
