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

import { updateLocation, updateMarkers } from "./utils/app.js";
import { setCustomConfig } from "./utils/config.js";

/**
 * Creates and returns the location section for the config center
 *
 * @param {LocationConfig} locationConfig - The location configuration.
 * @returns {HTMLElement} The location section element.
 */
export const getLocationSettingsSection = async (locationConfig) => {
  const { coordinates } = locationConfig;

  const locationSection = document.createElement("form");
  locationSection.name = "location-config";

  // Create the location HTML elements
  const locationHiddenInputLat = document.createElement("input");
  locationHiddenInputLat.hidden = true;
  locationHiddenInputLat.name = "coordinates.lat";
  locationHiddenInputLat.value = coordinates.lat;
  locationHiddenInputLat.type = "number";

  const locationHiddenInputLng = document.createElement("input");
  locationHiddenInputLng.type = "number";
  locationHiddenInputLng.name = "coordinates.lng";
  locationHiddenInputLng.value = coordinates.lng;
  locationHiddenInputLng.hidden = true;

  const locationInputContainer = document.createElement("div");
  locationInputContainer.classList.add("location-input");

  const locationInput = document.createElement("input");
  locationInput.type = "text";
  // Prevent event bubbling to not trigger the toggle event of the details element while typing
  locationInput.onkeyup = (event) => event.preventDefault();

  const options = { fields: ["geometry"] };
  const autocomplete = new google.maps.places.Autocomplete(
    locationInput,
    options
  );

  // Listen to location changes
  autocomplete.addListener("place_changed", () => {
    const selectedPlace = autocomplete.getPlace();

    // Catch user pressed enter key without selecting a place in the list
    if (!selectedPlace.geometry) {
      return;
    }

    const { location } = selectedPlace.geometry;

    // Update location config input values
    locationHiddenInputLat.value = location.lat();
    locationHiddenInputLng.value = location.lng();

    setCustomConfig("location.coordinates.lat", location.lat());
    setCustomConfig("location.coordinates.lng", location.lng());

    // Update the map location and markers
    updateLocation();
    updateMarkers();
  });

  // Append the HTML elements to the section container
  locationSection.appendChild(locationHiddenInputLat);
  locationSection.appendChild(locationHiddenInputLng);

  locationInputContainer.appendChild(locationInput);
  locationSection.appendChild(locationInputContainer);

  return locationSection;
};
