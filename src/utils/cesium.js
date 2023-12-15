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


import { GOOGLE_MAPS_API_KEY } from "../../env.js";

// Camera height above the target when flying to a point.
const CAMERA_HEIGHT = 100;

// Pitch 30 degrees downwards
const BASE_PITCH = -30;

// change the pitch by 10 degrees over time
const AUTO_ORBIT_PITCH_AMPLITUDE = 10;

// Distance variation relative to initial range.
const RANGE_AMPLITUDE_RELATIVE = 0.55;

// Determines how much the camera should zoom in or out
const ZOOM_FACTOR = 20;

// Camera heading (rotation), pitch (tilt), and range (distance) for resetting view.
const CAMERA_OFFSET = {
  heading: 0, // No rotation offset.
  pitch: Cesium.Math.toRadians(BASE_PITCH),
  range: 800, // 800 meters from the center.
};

// Default camera start position in longitude, latitude, and altitude.
const START_COORDINATES = {
  longitude: 0,
  latitude: 60,
  height: 15000000, // 15,000 km above the surface
};

/**
 * An export of the CesiumJS viewer instance to be accessed by other modules.
 * @type {Cesium.Viewer} The CesiumJS viewer instance.
 */
export let cesiumViewer;

/**
 * Value is set by the `setAutoOrbit` function. This value will be filled by the config file.
 * @type {number} The camera speed for the auto orbit animation in revolutions per minute
 */
let autoOrbitCameraSpeed = 0;

/**
 * Auto-orbit type - either a simple round orbit or a dynamic orbit with variable distance and pitch based on a sine function
 * @type {"fixed-orbit" | "dynamic-orbit"}
 */
let autoOrbitType = null;

/**
 * @type {number} The current animation frame id
 */
let animationFrameId = 0;

/**
 * Coordinates in the format {lat: number, lng: number}. The last defined coordinates the camera flew to
 * @type {Object|null}
 * @property {number} lat - The latitude value.
 * @property {number} lng - The longitude value.
 */
let flyToCoordinates = null;

/**
 * @type {boolean} Whether the UI elements are initialized or not.
 */
let isUIInitialized = false;

/**
 * Asynchronously creates a Google Photorealistic 3D tileset using a provided Google Maps API key
 * and adds it to a CesiumJS viewer's scene.
 *
 * @throws {Error} If an error occurs during tileset creation, an error message is logged to the console.
 * @returns {Promise<void>} A Promise that resolves when the tileset has been successfully added to the viewer's scene.
 */
async function createTileset() {
  try {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(
      "https://tile.googleapis.com/v1/3dtiles/root.json?key=" +
        GOOGLE_MAPS_API_KEY
    );

    // Add tileset to the scene
    cesiumViewer.scene.primitives.add(tileset);
  } catch (error) {
    console.error(`Error creating tileset: ${error}`);
  }
}

/**
 * The `createAttribution` function is designed to add attribution information
 * to a CesiumJS 3D map viewer. It includes both an image and text
 * attribution to acknowledge the data sources and contributors used in the map.
 */
function createAttribution() {
  if (!cesiumViewer) {
    console.error("Error creating attribution: `cesiumViewer` is undefined");
    return;
  }

  const cesiumCredits = cesiumViewer.scene.frameState.creditDisplay.container;

  // Create attribution text element
  const text = document.createTextNode(
    "Google • Landsat / Copernicus • IBCAO • Data SIO, NOAA, U.S. Navy, NGA, GEBCO • U.S. Geological Survey"
  );
  text.className = "cesium-credits__text";

  cesiumCredits.prepend(text);

  // Create image element for Google's logo
  const img = document.createElement("img");
  img.src = "assets/google-attribution.png";
  img.alt = "Google";

  cesiumCredits.prepend(img);
}

/**
 * Adjusts the height of the given coordinates to be above the surface by the specified offset height.
 *
 * @param {google.maps.LatLngLiteral} coords - The latitude and longitude coordinates.
 * @return {Promise<Cesium.Cartesian3>} A Cartesian3 object with adjusted height.
 */
async function adjustCoordinateHeight(coords) {
  const { lat, lng } = coords;

  const cartesian = Cesium.Cartesian3.fromDegrees(lng, lat);
  const clampedCoords = await cesiumViewer.scene.clampToHeightMostDetailed([
    cartesian,
  ]);

  const cartographic = Cesium.Cartographic.fromCartesian(clampedCoords[0]);
  return Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height + CAMERA_HEIGHT
  );
}

/**
 * Flies the camera to the given coordinates with the specified offset to the surface.
 *
 * @param {object} options - Pass the params as options object.
 * @param {google.maps.LatLngLiteral} [options.coords] - The coordinates to fly to.
 * @param {Cesium.HeadingPitchRange} [options.offset] - The offset from the target in the local east-north-up reference frame centered at the target.
 * @param {Function | undefined} [options.onComplete] - The function to execute when the flight is complete.
 * @param {number | undefined} [options.duration] - The duration of the fly-to animation in seconds. If undefined, Cesium calculates an ideal duration based on the distance to be traveled by the flight.
 */
async function flyToBoundingSphere({ coords, offset, onComplete, duration }) {
  flyToCoordinates = coords;
  const adjustedCoords = await adjustCoordinateHeight(coords);

  cesiumViewer.camera.flyToBoundingSphere(
    new Cesium.BoundingSphere(adjustedCoords, 0),
    {
      offset,
      complete: onComplete,
      duration,
    }
  );
}

/**
 * Updates the camera speed for the auto orbit animation
 *
 * @param {number} speed - The new camera speed value in revolutions per minute.
 */
export function setAutoOrbitCameraSpeed(speed) {
  autoOrbitCameraSpeed = speed;
}

/**
 * Update the auto-orbit type / style
 *
 * @param {"fixed-orbit" | "dynamic-orbit"} newOrbitType - "fixed-orbit" for a simple round orbit and "dynamic-orbit" for an orbit as sine wave
 */
export async function setAutoOrbitType(newOrbitType) {
  // if the auto-orbit type didn't change, do nothing
  if (newOrbitType === autoOrbitType) {
    return;
  }
  // set the current auto-orbit type
  autoOrbitType = newOrbitType;
}

/**
 * When changing the auto-orbit type, this function transitions the camera between the two range and pitch values
 */
export async function transitionAutoOrbit() {
  // stop the auto-orbit camera to move the camera
  stopAutoOrbitAnimation();

  // use base values and current camera heading
  await flyToBoundingSphere({
    coords: flyToCoordinates,
    offset: {
      heading: cesiumViewer.camera.heading, // same heading as current to not turn camera weirdly
      pitch: CAMERA_OFFSET.pitch,
      range: CAMERA_OFFSET.range,
    },
    // on complete: start auto-orbit again
    onComplete: startAutoOrbitAnimation,

    // when switching to the fixed-orbit use a longer steady transition
    // the dynamic-orbit starts at the fixed-orbit range so no transition is needed
    duration: autoOrbitType === "fixed-orbit" ? 1 : 0, // the duration of the transition in seconds}
  });
}

/**
 * Asynchronously updates the zoom level of the CesiumJS viewer to a specified range,
 * flying to a bounding sphere centered around predefined coordinates.
 *
 * @param {number} range - The desired range (zoom level) for the viewer.
 * @returns {Promise<void>} A Promise that resolves when the fly-to animation is complete.
  }
 */
export async function updateZoomToRadius(range) {
  stopAutoOrbitAnimation();

  await flyToBoundingSphere({
    coords: flyToCoordinates,
    offset: {
      heading: cesiumViewer.camera.heading,
      pitch: CAMERA_OFFSET.pitch,
      range,
    },
    onComplete: startAutoOrbitAnimation,
  });
}

/**
 * Checks if auto orbit is enabled.
 *
 * @returns {boolean} - True if auto orbit is enabled, false otherwise.
 */
function isAutoOrbitEnabled() {
  const autoOrbitSwitchInput = document.getElementById("toggle-switch");

  return autoOrbitSwitchInput.checked;
}

/**
 * Performs auto-orbit animation by continuously updating the camera position and orientation.
 */
async function startAutoOrbitAnimation() {
  const autoOrbitSwitchInput = document.getElementById("toggle-switch");
  // Check the toggle switch
  autoOrbitSwitchInput.checked = true;

  let center = null;

  // This statement checks if flyToCoordinates are defined or not.
  // If they are, we have a center to orbit around
  // If they are not, we determine the current center within the view
  if (flyToCoordinates) {
    // calculate the center coordinates so that they are not below the terrain
    center = await adjustCoordinateHeight(flyToCoordinates);
  } else {
    center = cesiumViewer.scene.pickPosition(
      new Cesium.Cartesian2(
        Math.round(cesiumViewer.container.clientWidth / 2),
        Math.round(cesiumViewer.container.clientHeight / 2)
      )
    );
  }

  if (!Cesium.defined(center) || !center) {
    return;
  }

  // get the current camera parameters to start the auto-orbit seamlessly after the fly to animation
  const initialPitch = cesiumViewer.camera.pitch;
  const initialHeading = cesiumViewer.camera.heading;
  const initialRange = Cesium.Cartesian3.distance(
    center,
    cesiumViewer.camera.position
  );

  // the amount of camera tilt towards the ground in degrees (then converted to radians)
  const pitchAmplitude = Cesium.Math.toRadians(AUTO_ORBIT_PITCH_AMPLITUDE);

  let previousFrameTimestamp = Date.now();
  let heading = initialHeading;

  /**
   * Calculates the current frame of the auto orbit animation
   * to update the camera position and orientation.
   * @function
   */
  const calculateAutoOrbitFrame = () => {
    const currentTimestamp = Date.now();
    const secondsSinceLastFrame =
      (currentTimestamp - previousFrameTimestamp) / 1000;
    const radian =
      secondsSinceLastFrame * (autoOrbitCameraSpeed / 60) * Math.PI * 2;

    heading += radian;

    const totalHeadingChange = heading - initialHeading;

    // change the camera pitch by time elapsed (pitch is the up down rotation of the camera)
    const dynamicPitch =
      initialPitch + pitchAmplitude * Math.sin(totalHeadingChange);
    const pitch =
      autoOrbitType === "dynamic-orbit" ? dynamicPitch : initialPitch;

    // change the camera range by time elapsed (range is the distance of the camera from the center)
    const dynamicRange =
      initialRange +
      RANGE_AMPLITUDE_RELATIVE * initialRange * -Math.sin(totalHeadingChange);
    const range =
      autoOrbitType === "dynamic-orbit" ? dynamicRange : initialRange;

    // update the camera position and orientation
    cesiumViewer.camera.flyToBoundingSphere(
      new Cesium.BoundingSphere(center, 0),
      {
        offset: new Cesium.HeadingPitchRange(heading, pitch, range),
        duration: 0,
      }
    );

    previousFrameTimestamp = currentTimestamp;

    // Recursively call the `calculateAutoOrbitFrame` function with `requestAnimationFrame`
    animationFrameId = requestAnimationFrame(calculateAutoOrbitFrame);
  };

  calculateAutoOrbitFrame();
}

/**
 * Stops the auto orbit animation and unchecks the toggle switch.
 */
const stopAutoOrbitAnimation = () => {
  const autoOrbitSwitchInput = document.getElementById("toggle-switch");
  // Uncheck the toggle switch
  autoOrbitSwitchInput.checked = false;

  // Cancel the animation frame
  cancelAnimationFrame(animationFrameId);
};

/**
 * Initializes auto orbit event listeners.
 *
 * @param {CameraConfig} cameraConfig - The camera configuration.
 */
async function initializeAutoOrbit(cameraConfig) {
  // Get the toggle switch from to control auto orbit
  const autoOrbitSwitchInput = document.getElementById("toggle-switch");
  // Enable auto orbit by default
  autoOrbitSwitchInput.checked = true;

  // Set the camera speed for the auto orbit animation
  setAutoOrbitCameraSpeed(cameraConfig.speed);

  // Set the auto orbit type
  await setAutoOrbitType(cameraConfig.orbitType);

  // Add an event listener to the toggle switch to enable/disable auto orbit
  autoOrbitSwitchInput.addEventListener("click", () => {
    if (isAutoOrbitEnabled()) {
      startAutoOrbitAnimation(); // (Re-)start the auto orbit animation
    } else {
      stopAutoOrbitAnimation();
    }
  });

  // The types of events that will stop the auto orbit animation
  const eventTypes = ["pointerdown", "wheel"];

  // Add event listeners to the viewer canvas to disable auto orbit
  eventTypes.forEach((eventType) =>
    cesiumViewer.canvas.addEventListener(eventType, () => {
      stopAutoOrbitAnimation();
      // As we are moving a away from a selected poi / center
      // We reset the flyToCoordinates
      flyToCoordinates = null;
    })
  );
}

/**
 * Shows UI elements by removing the "overlay-is-hidden" class from the ".custom-overlay" element.
 */
function showUIElements() {
  const overlay = document.querySelector(".custom-overlay");
  overlay.classList.remove("overlay-is-hidden");

  isUIInitialized = true;
}

/**
 * Performs a fly-to animation on the Cesium viewer to the specified coordinates.
 *
 * @param {google.maps.LatLngLiteral} coords - The coordinates to fly to.
 * @param {Object | undefined} options - Options to pass for the fly-to animation.
 * @param {number | undefined} options.range - The range between camera and center.
 * @param {number | undefined} options.duration - The duration of the fly-to animation in seconds. If undefined, Cesium calculates an ideal duration based on the distance to be traveled by the flight.
 * @throws {Error} Throws an error if no coordinates are provided.
 */
export async function performFlyTo(coords, options = {}) {
  if (!coords) {
    throw new Error("No coordinates to fly-to provided.");
  }

  try {
    const { range = CAMERA_OFFSET.range, duration } = options;

    // Stop the auto orbit animation while performing the fly-to animation
    if (isAutoOrbitEnabled()) {
      cancelAnimationFrame(animationFrameId);
    }

    const completeCallback = () => {
      // Initialize the UI elements if needed
      if (!isUIInitialized) {
        showUIElements();
      }
      // Start auto orbit animation again if needed
      if (isAutoOrbitEnabled()) {
        startAutoOrbitAnimation();
      }
    };

    // Keep the current camera heading when flying to new coordinates
    const offset = {
      ...CAMERA_OFFSET,
      heading: cesiumViewer.camera.heading,
      range,
    };

    await flyToBoundingSphere({
      coords,
      offset,
      onComplete: completeCallback,
      duration,
    });
  } catch (error) {
    console.error(`Error performing fly to: ${error}`);
  }
}

/**
 * The `initializeCesiumViewer` function is responsible for initializing a CesiumJS 3D map viewer,
 * configuring its default camera position and orientation, and adding both a 3D
 * tileset and attribution to the viewer.
 *
 * @param {google.maps.LatLngLiteral} centerCoordinates - The center coordinates.
 * @param {CameraConfig} cameraConfig - The camera configuration.
 */
export async function initializeCesiumViewer(centerCoordinates, cameraConfig) {
  // Set the default access token to null to prevent the CesiumJS viewer from requesting an access token
  Cesium.Ion.defaultAccessToken = null;

  // most options prevent the creation of certain built-in widgets (cesium ui elements)
  cesiumViewer = new Cesium.Viewer("cesium-container", {
    baseLayerPicker: false,
    imageryProvider: false,
    homeButton: false,
    fullscreenButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    geocoder: false,
    infoBox: false,
    selectionIndicator: false,
    timeline: false,
    animation: false,
  });

  // disable the default lighting of the globe
  cesiumViewer.scene.globe.baseColor = Cesium.Color.TRANSPARENT;

  // this is foremost to improve the resolution of icons and text displayed in the cesium viewer
  cesiumViewer.resolutionScale = 2;

  // Disable free-look, the camera view direction can only be changed through translating or rotating
  cesiumViewer.scene.screenSpaceCameraController.enableLook = false;

  const { latitude, longitude, height } = START_COORDINATES;

  // Set the starting position and orientation of the camera
  cesiumViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
    orientation: {
      heading: 0, // no heading
      pitch: Cesium.Math.toRadians(-90), // -90 degrees to the tangent plane (looking down)
      roll: 0,
    },
  });

  await createTileset();
  createAttribution();
  initializeZoomControl(centerCoordinates);
  await initializeAutoOrbit(cameraConfig);
}

/**
 * Callback for the zoom reset button
 * @param {coords} coords -  coordinates to fly to
 */
export const zoomResetCallback = async (coords) => {
  await flyToBoundingSphere({
    offset: CAMERA_OFFSET,
    coords,
  });
};

/**
 * Initializes the zoom control for the Cesium viewer.
 *
 * @param {google.maps.LatLngLiteral} centerCoordinates - The center coordinates.
 */
function initializeZoomControl(centerCoordinates) {
  // Get the zoom controls container from the DOM
  const zoomControls = document.querySelector(".zoom-control");

  // Get the zoom control buttons from the DOM
  const zoomInButton = document.querySelector(".zoom-in-button");
  const zoomOutButton = document.querySelector(".zoom-out-button");
  const zoomResetButton = document.querySelector(".zoom-reset-button");

  // Stop the auto orbit animation when the any of the zoom controls are clicked
  zoomControls.addEventListener("click", () => {
    if (isAutoOrbitEnabled()) {
      stopAutoOrbitAnimation();
    }
  });

  // Add event listeners to the zoom control buttons
  zoomInButton.addEventListener("click", () => {
    cesiumViewer.camera.zoomIn(ZOOM_FACTOR);
  });

  zoomOutButton.addEventListener("click", () => {
    cesiumViewer.camera.zoomOut(ZOOM_FACTOR);
  });

  if (centerCoordinates.lat && centerCoordinates.lng) {
    zoomResetButton.addEventListener("click", () =>
      zoomResetCallback(centerCoordinates)
    );
  }
}
