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

import { updatePlaceHeader } from "./update-place-header.js";
import { updatePlaceOverview } from "./update-place-overview.js";
import { updatePlaceReviews } from "./update-place-reviews.js";

import { getPlaceDetails } from "../utils/places.js";
import { setSelectedMarker } from "../utils/create-markers.js";

const baseSidebar = document.getElementById("sidebar").cloneNode(true); // empty sidebar state for resetting purposes
let closeButtonListener = null; // A reference to the event listener

/**
 * This functions resets the sidebar to the original state defined in the index.html
 *
 * Doing it this way is much simpler than manually removing current elements before adding
 * them again with different data.
 *
 * It replaces the current sidebar html with the original state.
 * Then the `addSidebarElements` function may be called to fill the sidebar with data again.
 */
async function resetSidebar() {
  const currentSidebar = document.getElementById("sidebar");

  // Check if both sidebars exist
  if (!baseSidebar || !currentSidebar) {
    console.error("Sidebar elements not found.");
    return;
  }

  // Clear current sidebar
  while (currentSidebar.firstChild) {
    currentSidebar.removeChild(currentSidebar.firstChild);
  }

  // Clone and append children from the base sidebar
  for (let child of baseSidebar.children) {
    currentSidebar.appendChild(child.cloneNode(true));
  }
}

/**
 * Simply adds a classname to the main element opening the sidebar
 *
 * @param {'open' | 'close'} action - to open or close the sidebar
 */
export function toggleSidebar(action) {
  const mainElement = document.querySelector("main");
  if (action === "open") {
    mainElement.classList.add("sidebar-is-open");
  } else if (action === "close") {
    mainElement.classList.remove("sidebar-is-open");

    const closeButton = mainElement.querySelector(".sidebar-close-button");
    if (!(closeButtonListener && closeButton)) return;

    closeButton.removeEventListener("click", closeButtonListener);
    closeButtonListener = null;
  }
}

/**
 * Adds a click event listener to the close button of the sidebar.
 *
 * @param {Cesium.Billboard} entity - The entity of a given location.
 */
function addCloseButtonListener(entity) {
  const closeButton = document.querySelector(".sidebar-close-button");

  closeButtonListener = () => {
    setSelectedMarker(entity);
    toggleSidebar("close");
  };

  closeButton.addEventListener("click", closeButtonListener);
}

/**
 * Adds sidebar elements for a given place.
 *
 * @param {string} placeId - The place-id of a given location.
 * @param {Cesium.Billboard} entity - The entity of a given location.
 */
export async function updateSidebarElements(placeId) {
  // reset sidebar to base state before adding data
  await resetSidebar();

  // add an event listener to handle the close button click
  addCloseButtonListener();

  // get all place details to be displayed in the sidebar
  const placeDetails = await getPlaceDetails(placeId);

  updatePlaceHeader(placeDetails);
  updatePlaceOverview(placeDetails);
  updatePlaceReviews(placeDetails.reviews);
}
