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

import {
  cesiumViewer,
  performFlyTo,
  setAutoOrbitCameraSpeed,
  setAutoOrbitType,
  updateZoomToRadius,
  zoomResetCallback,
} from "../../utils/cesium.js";
import createMarkers from "../../utils/create-markers.js";
import { getNearbyPois } from "../../utils/places.js";

import { getConfigCenterConfig } from "./config.js";

/**
 * Updates the camera of the map with the current configuration values.
 */
export async function updateCamera() {
  try {
    const { camera: cameraConfig, poi: poiConfig } = getConfigCenterConfig();

    console.info("The new camera settings set by the user is camera speed: "+cameraConfig.speed+" orbit type: "+cameraConfig.orbitType)
    // Adjust the camera speed of the auto orbit animation
    setAutoOrbitCameraSpeed(cameraConfig.speed);
    await setAutoOrbitType(cameraConfig.orbitType);
    await updateZoomToRadius(poiConfig.searchRadius);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Updates the location of the map with the current configuration values.
 */
export const updateLocation = async () => {
  try {
    const {
      location: { coordinates },
    } = getConfigCenterConfig();
    console.log("The new coordinates set by the user is lat: "+coordinates.lat+" long: "+coordinates.lng)

    // move the camera to face the main location's coordinates
    await performFlyTo(coordinates);
    updateZoomControl(coordinates);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Updates the markers on the map with the current configuration values.
 */
export const updateMarkers = async () => {
  try {
    const {
      location: { coordinates },
      poi: poiConfig,
    } = getConfigCenterConfig();

    // based on the given main location, fetch the surrounding POIs of the selected categories
    const pois = await getNearbyPois(poiConfig, coordinates);
    // remove all markers from the map before creating new ones
    cesiumViewer.entities.removeAll();
    // create markers according to the POIs placed on the map
    await createMarkers(pois, coordinates);
  } catch (error) {
    console.error(error);
  }
};

// A reference to the abort controller used to cancel the zoom reset button click event
let zoomResetController;

/**
 * Updates the zoom reset control button with the given coordinates.
 */
function updateZoomControl(coords) {
  const zoomResetButton = document.querySelector(".zoom-reset-button");

  if (!zoomResetButton) {
    return;
  }

  // cancel the previous zoom reset button click event
  if (zoomResetController) {
    zoomResetController.abort();
  }

  // create a new abort controller for the zoom reset button click event
  zoomResetController = new AbortController();

  // add a click event listener to the zoom reset button
  zoomResetButton.addEventListener(
    "click",
    () => {
      zoomResetCallback(coords);
    },
    { signal: zoomResetController.signal }
  );
}
