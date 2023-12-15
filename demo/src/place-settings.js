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


import { updateCamera, updateMarkers } from "./utils/app.js";
import { setCustomConfig } from "./utils/config.js";

const PLACES_TYPES = [
  {
    type: "cafe",
    label: "Cafe",
    color: "#FF9E67",
    path: "assets/icons/poi/coffee.svg",
  },
  {
    type: "restaurant",
    label: "Restaurants",
    color: "#FF9E67",
    path: "assets/icons/poi/restaurant.svg",
  },
  {
    type: "store",
    label: "Store",
    color: "#4B96F3",
    path: "assets/icons/poi/store.svg",
  },
  {
    type: "park",
    label: "Park",
    color: "#4DB546",
    path: "assets/icons/poi/park.svg",
  },
  {
    type: "parking",
    label: "Local Parking",
    color: "#7B9EB0",
    path: "assets/icons/poi/parking.svg",
  },
  {
    type: "movie_theater",
    label: "Movie",
    color: "#13B5C7",
    path: "assets/icons/poi/movie.svg",
  },
  {
    type: "tourist_attraction",
    label: "Tourist Attraction",
    color: "#FF9E67",
    path: "assets/icons/poi/photo_camera.svg",
  },
  {
    type: "bank",
    label: "Banks",
    color: "#909CE1",
    path: "assets/icons/poi/bank.svg",
  },
  {
    type: "train_station",
    label: "Train Station",
    color: "#10BDFF",
    path: "assets/icons/poi/train.svg",
  },
  {
    type: "bus_station",
    label: "Bus Station",
    color: "#10BDFF",
    path: "assets/icons/poi/bus.svg",
  },
  {
    type: "airport",
    label: "Airport",
    color: "#10BDFF",
    path: "assets/icons/poi/flight.svg",
  },
];

/**
 * Creates and returns the place types section for the config center
 *
 * @param {PoiConfig} poiConfig - The POI configuration.
 * @returns {HTMLElement} The place types section element.
 */
export const getPlaceSettingsSection = async (poiConfig) => {
  const placeTypesSection = document.createElement("details");
  placeTypesSection.classList.add("config-section");
  placeTypesSection.id = "poi-config";

  const placeTypesSummary = document.createElement("summary");

  // Create the place types summary HTML elements
  const placeTypesTitle = document.createElement("h2");
  placeTypesTitle.textContent = "Place Types";

  placeTypesSummary.appendChild(placeTypesTitle);

  // Create the place types filters HTML elements
  const placeTypesFilters = document.createElement("form");
  placeTypesFilters.name = "poi-config";
  placeTypesFilters.classList.add("filters");

  // Create the place types filter HTML elements
  const placeTypesFilter = document.createElement("div");

  const placeTypesFilterTitle = document.createElement("h3");
  placeTypesFilterTitle.textContent = "Filter:";

  const placeTypesFilterChips = document.createElement("div");
  placeTypesFilterChips.classList.add("places-types-chips");

  for (const { type, label, color, path } of PLACES_TYPES) {
    const isSelected = poiConfig.types.includes(type);

    const chip = document.createElement("label");
    chip.classList.add("chip");
    chip.style.setProperty("--chip-color", color);

    const chipCheckbox = document.createElement("input");
    chipCheckbox.type = "checkbox";
    chipCheckbox.name = "types";
    chipCheckbox.value = type;
    chipCheckbox.checked = isSelected;

    // Update the markers on the map when the place type selection changed
    chipCheckbox.addEventListener("change", () => {
      const poiConfigForm = document.querySelector('form[name="poi-config"]');
      const formData = new FormData(poiConfigForm);
      setCustomConfig("poi.types", formData.getAll("types"));
      updateMarkers();
    });

    chip.appendChild(chipCheckbox);

    if (path) {
      // we are parsing SVG and adding it to the HTML to be able to color the icons easily
      const svgIconString = await fetch(path).then((response) =>
        response.text()
      );
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgIconString, "image/svg+xml");
      const icon = doc.documentElement;

      chip.appendChild(icon);
    }

    chip.append(label);

    placeTypesFilterChips.appendChild(chip);
  }

  placeTypesFilter.appendChild(placeTypesFilterTitle);
  placeTypesFilter.appendChild(placeTypesFilterChips);

  // Create the density filter HTML elements
  const densityFilter = document.createElement("div");

  const densityFilterTitle = document.createElement("h3");
  densityFilterTitle.textContent = "Density:";

  const densityFilterSlider = document.createElement("div");
  densityFilterSlider.classList.add("config-slider-container");

  const densityFilterInput = document.createElement("input");
  densityFilterInput.type = "range";
  densityFilterInput.name = "density";
  densityFilterInput.id = "place-density";
  densityFilterInput.min = 10;
  densityFilterInput.max = 50;
  densityFilterInput.step = 5;
  densityFilterInput.value = poiConfig.density;

  densityFilterInput.style.setProperty("--value", densityFilterInput.value);
  densityFilterInput.style.setProperty("--min", densityFilterInput.min);
  densityFilterInput.style.setProperty("--max", densityFilterInput.max);

  // Update the slider progress when the value changed
  densityFilterInput.addEventListener("input", () => {
    densityFilterInput.style.setProperty("--value", densityFilterInput.value);
  });

  // Update the markers on the map when the density changed
  densityFilterInput.addEventListener("change", (event) => {
    setCustomConfig("poi.density", Number(event.target.value));
    updateMarkers();
  });

  const densityFilterLabelMin = document.createElement("label");
  densityFilterLabelMin.textContent = "Low";

  const densityFilterLabelMax = document.createElement("label");
  densityFilterLabelMax.textContent = "High";

  densityFilterSlider.appendChild(densityFilterInput);
  densityFilterSlider.appendChild(densityFilterLabelMin);
  densityFilterSlider.appendChild(densityFilterLabelMax);
  densityFilter.appendChild(densityFilterTitle);
  densityFilter.appendChild(densityFilterSlider);

  // Create the radius filter HTML elements
  const radiusFilter = document.createElement("div");

  const radiusFilterTitle = document.createElement("h3");
  radiusFilterTitle.textContent = "Radius:";

  const radiusFilterSlider = document.createElement("div");
  radiusFilterSlider.classList.add("config-slider-container");

  const radiusFilterLabel = document.createElement("label");
  radiusFilterLabel.textContent = poiConfig.searchRadius / 1000;
  radiusFilterLabel.classList.add("config-slider-label");
  radiusFilterLabel.for = "place-radius";

  const radiusFilterInput = document.createElement("input");
  radiusFilterInput.type = "range";
  radiusFilterInput.name = "searchRadius";
  radiusFilterInput.id = "place-radius";
  radiusFilterInput.min = 100;
  radiusFilterInput.max = 32000;
  radiusFilterInput.step = 100;
  radiusFilterInput.value = poiConfig.searchRadius;

  radiusFilterSlider.style.setProperty("--value", radiusFilterInput.value);
  radiusFilterSlider.style.setProperty("--min", radiusFilterInput.min);
  radiusFilterSlider.style.setProperty("--max", radiusFilterInput.max);

  // Update the slider progress and label when the value changed
  radiusFilterInput.addEventListener("input", () => {
    radiusFilterSlider.style.setProperty("--value", radiusFilterInput.value);
    radiusFilterLabel.textContent = radiusFilterInput.value / 1000;
  });

  // Update the markers on the map when the radius changed
  radiusFilterInput.addEventListener("change", (event) => {
    setCustomConfig("poi.searchRadius", Number(event.target.value));
    updateMarkers();
    updateCamera();
  });

  const radiusFilterLabelMin = document.createElement("label");
  radiusFilterLabelMin.textContent = `${radiusFilterInput.min / 1000} km`;

  const radiusFilterLabelMax = document.createElement("label");
  radiusFilterLabelMax.textContent = `${radiusFilterInput.max / 1000} km`;

  radiusFilterSlider.appendChild(radiusFilterInput);
  radiusFilterSlider.appendChild(radiusFilterLabel);
  radiusFilterSlider.appendChild(radiusFilterLabelMin);
  radiusFilterSlider.appendChild(radiusFilterLabelMax);
  radiusFilter.appendChild(radiusFilterTitle);
  radiusFilter.appendChild(radiusFilterSlider);

  // Append the HTML elements to the section container
  placeTypesSection.appendChild(placeTypesSummary);

  placeTypesFilters.appendChild(placeTypesFilter);
  placeTypesFilters.appendChild(densityFilter);
  placeTypesFilters.appendChild(radiusFilter);
  placeTypesSection.appendChild(placeTypesFilters);

  return placeTypesSection;
};
