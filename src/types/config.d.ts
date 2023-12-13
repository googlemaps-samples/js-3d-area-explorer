export interface NeighbourhoodDiscoveryConfig {
  location: LocationConfig;
  poi: PoiConfig;
  camera: CameraConfig;
}

interface LocationConfig {
  coordinates: google.maps.LatLngLiteral;
}

interface PoiConfig {
  types: string[];
  searchRadius: number; // in meters
  density: number;
}

interface CameraConfig {
  orbitType: "fixed-orbit" | "dynamic-orbit";
  speed: number; // in revolutions per minute
}
