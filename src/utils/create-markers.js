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

import { updateSidebarElements, toggleSidebar } from "../sidebar/sidebar.js";
import { cesiumViewer, performFlyTo } from "./cesium.js";

// The ID of the center marker
const CENTER_MARKER_ID = "center";

// The size of the marker in relation to the original SVG size.
// We are scaling it down to help preserve clarity when increasing marker size for the selected marker.
const defaultMarkerScale = 0.744;

// Determines the distance between marker and label
const defaultLabelOffset = -60;

// Determines on which distance the marker label will show
const defaultLabelVisibility = new Cesium.NearFarScalar(650, 1, 1000, 0);

/**
 * The instance of the click handler, used when clicking a marker on the map
 * This has to be destroyed/reset manually when changing the location and handling new POIs
 * @type {Cesium.ScreenSpaceEventHandler}
 */
let markerClickHandler = null;

/**
 * The instance of the hover handler, used when hovering a marker on the map
 * This has to be destroyed/reset manually when changing the hover location for new POIs
 * @type {Cesium.ScreenSpaceEventHandler}
 */
let markerHoverHandler = null;

/**
 * @type {string} The ID of the selected marker / place
 */
let selectedMarkerId = null;

/**
 * Asynchronously fetches and parses SVG content from a URL.
 * @param {string} url - URL of the SVG resource.
 * @returns {Promise<Element>} A promise resolving to the SVG element.
 * @throws {Error} Throws an error if the fetch request fails.
 */
async function fetchSvgContent(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG from ${url}.`);
  }
  return new DOMParser().parseFromString(await response.text(), "image/svg+xml")
    .documentElement;
}

/**
 * Sets attributes on an SVG element.
 * @param {Element} svgElement - SVG element to modify.
 * @param {Object} attributes - Key-value pairs of attributes.
 */
function setSvgAttributes(svgElement, attributes) {
  Object.entries(attributes).forEach(([key, value]) =>
    svgElement.setAttribute(key, value)
  );
}

/**
 * Encodes an SVG element to a data URI format.
 * @param {Element} svgElement - SVG element to encode.
 * @returns {string} Data URI of the SVG element.
 */
function encodeSvgToDataUri(svgElement) {
  return `data:image/svg+xml,${encodeURIComponent(svgElement.outerHTML)}`;
}

/**
 * Creates a marker SVG for a given location.
 * @param {Object} markerData - Marker data - either a poi or the center marker.
 * @returns {Promise<string>} A promise resolving to the marker SVG's data URI.
 */
async function createMarkerSvg(markerData) {
  const baseSvgElement = await fetchSvgContent("assets/icons/empty-marker.svg");
  const iconSvgElement = await fetchSvgContent(
    `${markerData.icon_mask_base_uri}.svg`
  );

  // Configurations for the base and icon SVG elements
  const baseConfig = {
    fill: markerData.icon_background_color,
    height: markerData.isCenterLocation ? "70" : "60",
    width: markerData.isCenterLocation ? "96" : "80",
    stroke: markerData.isCenterLocation ? "#8C2820" : "white",
  };

  const iconConfig = {
    width: markerData.isCenterLocation ? "18" : "15",
    height: markerData.isCenterLocation ? "18" : "15",
    x: markerData.isCenterLocation ? "14.5" : "16.5",
    y: markerData.isCenterLocation ? "14.5" : "16.5",
    fill: "white",
    border: "none",
    stroke: "none",
  };

  setSvgAttributes(baseSvgElement, baseConfig);
  setSvgAttributes(iconSvgElement, iconConfig);
  baseSvgElement.appendChild(iconSvgElement);

  return encodeSvgToDataUri(baseSvgElement);
}

/**
 * Helper function to adjust entity height.
 * @param {Cesium.Cartesian3} coord - The original coordinate.
 * @param {number} heightOffset - The height to add to the original coordinate.
 * @returns {Cesium.Cartesian3} The adjusted coordinate.
 */
function addHeightOffset(coord, heightOffset) {
  const cartographic = Cesium.Cartographic.fromCartesian(coord);
  return Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height + heightOffset
  );
}
/**
 * Helper function to truncate the name of a location.
 * @param {string} name - The name of the location.
 * @returns {string} The truncated name.
 */
function truncateName(name) {
  const maximumNameLength = 25;
  if (name.length > maximumNameLength) {
    return name.slice(0, maximumNameLength) + "...";
  }
  return name;
}

/**
 * Helper function to create a polyline entity configuration.
 * @param {Cesium.Cartesian3} options.start - Starting coordinate.
 * @param {Cesium.Cartesian3} options.end - Ending coordinate.
 * @returns {Object} Polyline entity configuration.
 */
function getPolylineConfiguration({ start, end }) {
  return {
    polyline: {
      positions: [start, end],
      material: Cesium.Color.WHITE,
    },
  };
}

/**
 * Helper function to create a marker entity configuration.
 * @param {Cesium.Cartesian3} options.position - The position to place the marker.
 * @param {string} options.name - The location name to display on the marker.
 * @param {number} options.id - ID for the marker (Place ID or custom ID).
 * @param {string} options.markerSvg - Data URI for the marker SVG.
 * @returns {Cesium.Entity.ConstructorOptions} Marker entity configuration.
 */
function getMarkerEntityConfiguration({ position, id, name, markerSvg }) {
  return {
    position,
    id,
    label: {
      font: "20px, var(--font-family)",
      text: truncateName(name),
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineColor: Cesium.Color.GREY,
      outlineWidth: 1,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(0, defaultLabelOffset),
      scaleByDistance: defaultLabelVisibility,
    },
    billboard: {
      image: markerSvg,
      scale: defaultMarkerScale,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    },
  };
}

/**
 * Sets the selected marker and scales it to 1 while scaling the previous marker back to the default scale.
 * @param {Cesium.Entity} marker - The entity object representing the selected marker.
 */
export function setSelectedMarker(marker) {
  const selectedMarker =
    selectedMarkerId && cesiumViewer.entities.getById(selectedMarkerId);

  if (selectedMarker) {
    selectedMarker.billboard.scale = defaultMarkerScale;
    selectedMarker.label.pixelOffset = new Cesium.Cartesian2(
      0,
      defaultLabelOffset
    );
  }

  if (marker) {
    // Scale the new selected marker to 1
    marker.billboard.scale = 1;
    marker.label.pixelOffset = new Cesium.Cartesian2(0, -80);
  }

  // Update the selected marker ID
  selectedMarkerId = marker?.id || null;
}

/**
 * Handles the marker click
 * When a marker is clicked, there are multiple things happening:
 * 1. The camera is moved to the marker position
 * 2. The sidebar is opened and filled with details about the place
 * 3. The clicked marker is scaled up and the previously clicked marker is scaled down
 * @param {object} click - The click event object
 * @param {google.maps.places.PlaceResult[]} pois - the current pois on the map
 */
async function handleClickOnMarker(click, pois) {
  // Raycast from click position returning intercepting object
  const pickedObject = cesiumViewer.scene.pick(click.position);
  // check if "primitive" property is available... (not available when clicking sky for example)
  if (!pickedObject || !pickedObject.primitive) {
    return;
  }

  // get primitive from object
  const { primitive } = pickedObject;
  // check if a billboard (marker) was clicked
  // if not or if the center marker was clicked, return and do nothing
  if (
    !(primitive instanceof Cesium.Billboard) ||
    primitive.id.id === CENTER_MARKER_ID
  ) {
    return;
  }

  const marker = primitive.id;
  const placeId = marker.id;
  const currentPoi = pois.find((poi) => poi.place_id === placeId);

  // if the same marker is clicked again, set the selected marker to null and close the sidebar
  if (selectedMarkerId === placeId) {
    setSelectedMarker(null);
    toggleSidebar("close");
  } else {
    setSelectedMarker(marker);
    toggleSidebar("open");
    // fill the sidebar with details about a place, identifiable by the place id
    updateSidebarElements(placeId);
  }

  // range is the distance between the camera and the marker
  // we subtract 70 (meters) to make sure the label is visible when the camera is close to the marker
  const range = defaultLabelVisibility.near - 70;

  // move the camera to the clicked marker
  await performFlyTo(currentPoi.geometry.location.toJSON(), {
    range,
    duration: 1,
  });
}

/**
 * Adds an event handler to the viewer which is used to pick an object that is under the 2d context of the mouse/pointer.
 * @param {google.maps.places.PlaceResult[]} pois - the current pois on the map
 */
function createMarkerClickHandler(pois) {
  if (markerClickHandler) {
    markerClickHandler.destroy();
  }

  // "Screen" click handler
  markerClickHandler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.canvas);

  // Disable default double click behaviour for cesium viewer on billboard entities
  cesiumViewer.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  );

  // Basically an onClick statement
  markerClickHandler.setInputAction((click) => {
    handleClickOnMarker(click, pois);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK); // This defines that we want to listen for a click event
}

let hoveredMarker = null;

/**
 * Changes the cursors appearance when hovering over a POI marker.
 * When hovering the center marker, the cursor will not change.
 *
 * @param {object} movement - The hover movement event
 */
function handleHover(movement) {
  const pickedObject = cesiumViewer.scene.pick(movement.endPosition);

  if (!pickedObject || !pickedObject.primitive) {
    return;
  }

  // get primitive from object
  const { primitive } = pickedObject;

  // check if a billboard (marker) is being hovered
  if (
    primitive instanceof Cesium.Billboard &&
    primitive.id.id !== CENTER_MARKER_ID
  ) {
    // Sets the marker style to pointer (to indicate that the marker is clickable)
    document.querySelector("body").style.cursor = "pointer";

    // In some cases (due to throttle or because the markers are overlapping),
    // the hoveredMarker is not reset in the else block
    if (hoveredMarker && primitive.id.id !== hoveredMarker.id.id) {
      hoveredMarker.id.label.scaleByDistance = defaultLabelVisibility;
    }

    hoveredMarker = primitive;
    hoveredMarker.id.label.scaleByDistance = undefined;
  } else {
    // Resets the pointer style to back to default when marker is no longer hovered
    document.querySelector("body").style.cursor = "default";

    // Resets marker
    if (hoveredMarker) {
      hoveredMarker.id.label.scaleByDistance = defaultLabelVisibility;
      hoveredMarker = null;
    }
  }
}

/**
 * Throttle function for hover events
 *
 * @param {Function} callback - the function that will be throttled (not called if called within the throttle time)
 * @param {number} wait - the amount of time to wait before allowing calling the function
 */
function throttle(callback, wait) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last < wait) return;
    last = now;
    return callback(...args);
  };
}

/**
 * Changes the mouse pointer to a pointer icon when hovering over a marker on the map to indicate that it is clickable.
 * This is not applied to the center marker as the center marker is not clickable.
 * @param {Cesium.Viewer} viewer - The Cesium viewer object.
 * @param {number} centerLocationIndex - The index of the center location.
 */
function createMarkerHoverHandler() {
  if (markerHoverHandler) {
    markerHoverHandler.destroy();
  }

  markerHoverHandler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.canvas);

  // This throttled callback helps to not call the handle hover function too often and therefore improves performance
  const throttledHandler = throttle(handleHover, 100);

  markerHoverHandler.setInputAction(
    throttledHandler,
    Cesium.ScreenSpaceEventType.MOUSE_MOVE
  );
}

/**
 * Creates the place object for the center marker (this is basically a dummy google.maps.places.PlaceResult)
 *
 * @param {google.maps.LatLngLiteral} coords - coordinates of the center marker around which to auto-orbit
 */
function createCenterMarkerData(coords) {
  return {
    name: "",
    geometry: {
      location: new google.maps.LatLng(coords),
    },
    place_id: null,
    icon_background_color: "#ea4335",
    icon_mask_base_uri: "assets/icons/poi/center",
    isCenterLocation: true,
  };
}

/**
 * Creates markers for each POI and attaches them to the viewer.
 * @param {google.maps.places.PlaceResult[]} pois - Array of points of interest.
 * @param {google.maps.LatLngLiteral} centerCoordinates - The center coordinates of the map.
 */
async function createMarkers(pois, centerCoordinates) {
  if (!cesiumViewer) {
    console.error("Error creating markers: `cesiumViewer` is undefined");
    return;
  }

  // If a marker was selected before, but isn't in POIs list anymore,
  // reset the marker selection and close the sidebar.
  if (
    selectedMarkerId &&
    !pois.some((poi) => poi.place_id === selectedMarkerId)
  ) {
    selectedMarkerId = null;
    toggleSidebar("close");
  }

  const centerMarker = createCenterMarkerData(centerCoordinates);

  const markerCoordinates = [...pois, centerMarker].map((poi) => {
    const { lng, lat } = poi.geometry.location.toJSON();
    return Cesium.Cartesian3.fromDegrees(lng, lat);
  });

  // Modify the position to be on top of terrain (e.g. Rooftops, trees, etc.)
  // this has to be done with the whole coordinates array, because clamping single
  // coords to the ground terrain like this will not work.
  const coordsWithAdjustedHeight =
    await cesiumViewer.scene.clampToHeightMostDetailed(markerCoordinates);

  // iterate the coordinates and get according poi
  coordsWithAdjustedHeight.forEach(async (coord, index) => {
    const markerData = index < pois.length ? pois[index] : centerMarker;
    // add vertical offset between marker and terrain to allow for a line to be rendered in between
    const coordWithHeightOffset = addHeightOffset(coord, 28);
    const id = index < pois.length ? pois[index].place_id : CENTER_MARKER_ID;
    const { name } = markerData;
    const markerSvg = await createMarkerSvg(markerData);

    // add the line and the marker
    const markerEntity = cesiumViewer.entities.add({
      ...getPolylineConfiguration({ start: coord, end: coordWithHeightOffset }),
      ...getMarkerEntityConfiguration({
        position: coordWithHeightOffset,
        id,
        name,
        markerSvg,
      }),
    });

    // Select the marker if it was rerendered and already selected before
    if (selectedMarkerId === id) {
      setSelectedMarker(markerEntity);
    }
  });

  // change mouse pointer to pointer icon when hovering over a marker
  createMarkerHoverHandler();

  // add a click handler to the viewer which handles the click only when clicking on a billboard (Marker) instance
  createMarkerClickHandler(pois);
}

export default createMarkers;
