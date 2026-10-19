// New York City: NYC Open Data (Socrata, data.cityofnewyork.us) for building footprints, street centrelines and parks,
// and the Department of City Planning's MapPLUTO (tax lots with PLUTO's attributes, an ArcGIS feature service) for the
// parcels. NYC Open Data is published under the city's Open Data Law (Local Law 11 of 2012) and its Terms of Use: free,
// no registration, no restriction on use, the city credited and not implying endorsement. MapPLUTO is free from DCP,
// provided "as is"; its credit line is "NYC Department of City Planning, MapPLUTO <version>". Footprint heights are in
// feet; the lidar (USGS 3DEP NY_NewYorkCity, 2017) gives each cell's roof, capped at the footprint's recorded roof.
const D = "https://data.cityofnewyork.us/resource";
const OPEN = "NYC Open Data Terms of Use (Open Data Law, Local Law 11 of 2012: free, no restrictions on use; source credited)";
const PLUTO = "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0";
const FT = 0.3048;
const inNYC = (p) => p.city === "new-york";

async function socrata(id, geom, b, where = null) {
  const poly = `POLYGON((${b.west} ${b.north}, ${b.east} ${b.north}, ${b.east} ${b.south}, ${b.west} ${b.south}, ${b.west} ${b.north}))`, features = [];
  for (let off = 0; ; off += 5000) {
    const q = new URLSearchParams({ $where: `intersects(${geom}, '${poly}')${where ? ` AND ${where}` : ""}`, $limit: "5000", $offset: String(off), $order: ":id" });
    const r = await fetch(`${D}/${id}.geojson?${q}`); if (!r.ok) throw new Error(`NYC Open Data ${id}: ${r.status} ${await r.text()}`);
    const j = await r.json(); features.push(...j.features); if (j.features.length < 5000) break;
  }
  return { type: "FeatureCollection", features };
}
async function arcgis(url, b, fields) {
  const features = [];
  for (let off = 0; ; off += 2000) {
    const q = new URLSearchParams({ where: "1=1", outFields: fields, f: "geojson", outSR: "4326", inSR: "4326", resultOffset: String(off), resultRecordCount: "2000",
      geometry: `${b.west},${b.south},${b.east},${b.north}`, geometryType: "esriGeometryEnvelope", spatialRel: "esriSpatialRelIntersects" });
    const r = await fetch(`${url}/query?${q}`); if (!r.ok) throw new Error(`MapPLUTO: ${r.status}`);
    const j = await r.json(); if (j.error) throw new Error(`MapPLUTO: ${JSON.stringify(j.error)}`);
    features.push(...j.features); if (j.features.length < 2000 && !j.properties?.exceededTransferLimit) break;
  }
  return { type: "FeatureCollection", features };
}
const src = (id, layers, name, dataset, geom, shape, where = null) => ({
  id, layers, name, licence: OPEN, attribution: `City of New York, NYC Open Data: ${name}`, url: `https://data.cityofnewyork.us/d/${dataset}`, covers: inNYC,
  async fetch(place, frame) { return shape(await socrata(dataset, geom, frame.box, where)); },
});

// PLUTO's land use codes
const LAND_USE = { "01": "One & Two Family Buildings", "02": "Multi-Family Walk-Up Buildings", "03": "Multi-Family Elevator Buildings", "04": "Mixed Residential & Commercial Buildings",
  "05": "Commercial & Office Buildings", "06": "Industrial & Manufacturing", "07": "Transportation & Utility", "08": "Public Facilities & Institutions", "09": "Open Space & Outdoor Recreation",
  "10": "Parking Facilities", "11": "Vacant Land" };
// footprint feature codes left out: skybridges (2110) and temporary structures (1005)
const NOT_BUILDINGS = new Set(["2110", "1005"]);

export default [
  // OTI's Building Footprints (photogrammetric, kept current): BIN, BBL, roof height and ground elevation in feet, year built, name
  src("nyc-buildings", ["buildings"], "Building Footprints", "5zhs-2jue", "the_geom", (fc) => ({ buildings: { ...fc, features: fc.features
    .filter((f) => !NOT_BUILDINGS.has(String(f.properties.feature_code)) && f.properties.last_status_type !== "Demolition")
    .map((f) => { const p = f.properties, h = +p.height_roof * FT, bbl = p.mappluto_bbl || p.base_bbl;
      return { ...f, properties: { id: `NYC${p.bin ?? p.doitt_id}`, parcel: bbl ? `NYC${String(bbl).replace(/\.0+$/, "")}` : null, height: h > 0 ? +h.toFixed(1) : NaN,
        peak: h > 0 ? +(h + 2).toFixed(1) : null, name: p.name ?? null, year: +p.construction_year || null, groundFt: +p.ground_elevation || null } }; }) } })),
  // the street centreline (CSCL): constructed streets and alleys (not highways, ramps, paths, steps or non-physical segments)
  src("nyc-streets", ["streets"], "Centerline", "inkn-q76z", "the_geom", (fc) => ({ streets: { ...fc, features: fc.features
    .filter((f) => ["1", "10"].includes(String(f.properties.rw_type)) && String(f.properties.status ?? "2") === "2")
    .map((f) => ({ ...f, properties: { name: f.properties.stname_label ?? f.properties.full_street_name ?? null, width: +f.properties.streetwidth * FT || null } })) } })),
  src("nyc-parks", ["parks"], "Parks Properties", "enfh-gkve", "multipolygon", (fc) => ({ parks: { ...fc, features: fc.features.map((f) => ({ ...f,
    properties: { name: f.properties.signname ?? f.properties.name311 ?? null } })) } })),
  // MapPLUTO (DCP): each tax lot's polygon with PLUTO's record. Joined to a footprint by its BBL.
  { id: "nyc-parcels", layers: ["parcels"], name: "MapPLUTO (Department of City Planning)", licence: "NYC Department of City Planning, free to use (provided as is; source credited)",
    attribution: "NYC Department of City Planning, MapPLUTO", url: "https://www.nyc.gov/site/planning/data-maps/open-data/dwn-pluto-mappluto.page", covers: inNYC,
    async fetch(place, frame) {
      const fc = await arcgis(PLUTO, frame.box, "BBL,Address,LandUse,BldgClass,YearBuilt,OwnerName,NumFloors,UnitsTotal,Landmark,HistDist,Version");
      const version = fc.features[0]?.properties.Version ?? null;
      return { parcels: { type: "FeatureCollection", rollYear: version, features: fc.features.map((f) => { const p = f.properties; return { type: "Feature", geometry: f.geometry,
        properties: { parcel: `NYC${p.BBL}`, year: +p.YearBuilt || null, stories: +p.NumFloors || null, units: +p.UnitsTotal || null, construction: null,
          use: LAND_USE[p.LandUse] ?? null, buildingClass: p.BldgClass ?? null, address: p.Address ?? null, owner: p.OwnerName ?? null,
          landmark: [p.Landmark && `NYC ${p.Landmark.toLowerCase()}`, p.HistDist && `in the ${p.HistDist} historic district`].filter(Boolean).join(" ") || null, name: null } }; }) } };
    } },
];
