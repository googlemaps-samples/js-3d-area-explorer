// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { loadConfig } from "./utils/config.js";
import { performFlyTo, initializeCesiumViewer } from "./utils/cesium.js";

import { getNearbyPois } from "./utils/places.js";
import createMarkers from "./utils/create-markers.js";

// Here we load the configuration.
// The current implementation loads our local `config.json`.
//
// This can be changed easily, to fetch from any other API, CMS
// or request some file from another host, by changing the config url parameter.
//
// You could also implement your (dynamic) configuration loading function here.
export const config = await loadConfig("config.json");

const {
  location: { coordinates },
  poi: poiConfig,
  camera: cameraConfig,
} = config;

export async function main() {
  try {
    await initializeCesiumViewer(coordinates, cameraConfig);

    if (coordinates.lat && coordinates.lng) {
      // move the camera to face the main location's coordinates
      await performFlyTo(coordinates);
      // based on the given main location, fetch the surrounding POIs of the selected categories
      const pois = await getNearbyPois(poiConfig, coordinates);
      // create markers according to the POIs placed on the map
      await createMarkers(pois, coordinates);
    }
  } catch (error) {
    console.error(error);
  }
}

main();
