"use client";

import turfArea from "@turf/area";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

type BoundaryDrawMapProps = {
  fieldName: string;
  areaFieldId: string;
  defaultBoundary?: string | null;
};

type DrawFeatureEvent = {
  features: Array<{
    id?: string | number;
  }>;
};

const squareMetersPerAcre = 4046.8564224;
const fallbackCenter: [number, number] = [73.0479, 33.6844];

function parseBoundary(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed?.type === "Feature" && parsed.geometry?.type === "Polygon" ? parsed : null;
  } catch {
    return null;
  }
}

function polygonCenter(feature: GeoJSON.Feature<GeoJSON.Polygon>) {
  const ring = feature.geometry.coordinates[0] ?? [];
  if (ring.length === 0) {
    return fallbackCenter;
  }

  const totals = ring.reduce(
    (sum, coordinate) => ({
      lng: sum.lng + coordinate[0],
      lat: sum.lat + coordinate[1]
    }),
    { lng: 0, lat: 0 }
  );

  return [totals.lng / ring.length, totals.lat / ring.length] as [number, number];
}

function setAreaInputValue(id: string, acres: number | null) {
  const input = document.getElementById(id) as HTMLInputElement | null;
  if (!input) {
    return;
  }

  input.value = acres === null ? "" : acres.toFixed(2);
}

export function BoundaryDrawMap({ fieldName, areaFieldId, defaultBoundary }: BoundaryDrawMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [boundary, setBoundary] = useState(defaultBoundary ?? "");
  const [acres, setAcres] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const container = mapContainerRef.current;

    if (!container) {
      return;
    }

    if (!token) {
      setMessage("Add NEXT_PUBLIC_MAPBOX_TOKEN to enable boundary drawing.");
      return;
    }

    mapboxgl.accessToken = token;
    const initialBoundary = parseBoundary(defaultBoundary);
    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: initialBoundary ? polygonCenter(initialBoundary) : fallbackCenter,
      zoom: initialBoundary ? 14 : 11
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: initialBoundary ? "simple_select" : "draw_polygon"
    });

    function syncBoundary(featureId?: string) {
      const polygons = draw.getAll().features.filter((entry): entry is GeoJSON.Feature<GeoJSON.Polygon> => entry.geometry?.type === "Polygon");
      const feature =
        polygons.find((entry) => String(entry.id) === featureId) ??
        polygons.at(-1) ??
        null;

      if (!feature) {
        setBoundary("");
        setAcres(null);
        setAreaInputValue(areaFieldId, null);
        return;
      }

      for (const polygon of polygons) {
        if (polygon.id && polygon.id !== feature.id) {
          draw.delete(String(polygon.id));
        }
      }

      const nextAcres = turfArea(feature) / squareMetersPerAcre;
      setBoundary(JSON.stringify(feature));
      setAcres(nextAcres);
      setAreaInputValue(areaFieldId, nextAcres);
    }

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-left");
    map.addControl(draw, "top-right");

    map.on("load", () => {
      if (initialBoundary) {
        draw.add(initialBoundary);
        syncBoundary();
      }
    });

    map.on("draw.create", (event: DrawFeatureEvent) => syncBoundary(String(event.features[0]?.id ?? "")));
    map.on("draw.update", (event: DrawFeatureEvent) => syncBoundary(String(event.features[0]?.id ?? "")));
    map.on("draw.delete", syncBoundary);

    return () => {
      map.remove();
    };
  }, [areaFieldId, defaultBoundary]);

  return (
    <section className="space-y-3 border-t border-slate-200 pt-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Map boundary</h2>
        {acres !== null ? <p className="text-sm text-slate-600">Calculated area: {acres.toFixed(2)} acres</p> : null}
        {message ? <p className="text-sm text-amber-700">{message}</p> : null}
      </div>
      <input type="hidden" name={fieldName} value={boundary} />
      <div ref={mapContainerRef} className="h-[420px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100" />
    </section>
  );
}
