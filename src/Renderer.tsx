import { useEffect, useRef } from "react";
import * as d3 from "d3";
import mapData from "./data/london-boroughs-geojson.json";
import { MAP_COLORS } from "./colors";

export function Renderer() {
  const mapRef = useRef(null);
  const mapZoneRef = useRef(null);

  useEffect(() => {
    let projection = d3.geoNaturalEarth1();
    if (mapZoneRef.current) {
      const mapContainer = mapZoneRef.current as HTMLDivElement;
      const boundingBox = mapContainer.getBoundingClientRect();

      // Casting to any because the json is not exactly as fitSize expect.
      projection.fitSize([boundingBox.width, boundingBox.height], mapData as any);
    }

    let geoGenerator = d3.geoPath().projection(projection);
    const svgElement = d3.select(mapRef.current);
    svgElement
      .selectAll("path")
      .data(mapData.features)
      .join("path")
      // Casting to any because D3 typings are weird
      .attr("d", geoGenerator as any)
      .attr("id", (z) => `zone-${z.properties.id}`)
      .style("fill", MAP_COLORS.IGNORED.fill)
      .style("stroke", MAP_COLORS.IGNORED.stroke);
  });

  return (
    <div ref={mapZoneRef} style={{ height: "100vh" }}>
      <svg width="100%" height="100%" ref={mapRef}></svg>
    </div>
  );
}
