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

import { config } from "../main.js";

import { getCameraSettingsSection } from "./camera-settings.js";
import { getLocationSettingsSection } from "./location-settings.js";
import { getPlaceSettingsSection } from "./place-settings.js";

import { updateCamera, updateLocation, updateMarkers } from "./utils/app.js";
import { getCustomConfig } from "./utils/config.js";

/**
 * Returns the data URL for the configuration data download.
 *
 * @returns {string} The data URL.
 */
export const getConfigDownloadDataUrl = () => {
  const customConfig = getCustomConfig();
  // Combine the config customizations with the default config
  const combinedConfig = {
    location: { ...config.location, ...customConfig.location },
    poi: { ...config.poi, ...customConfig.poi },
    camera: { ...config.camera, ...customConfig.camera },
  };

  return `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(combinedConfig)
  )}`;
};

/**
 * Toggles the visibility of configuration sections based on the state of a configuration section.
 *
 * If the state of the configuration section is "open," it closes all other configuration sections will be closed.
 *
 * @param {Event} event - The event object of the clicked `details` element
 * specifically the `newState` property.
 */
const toggleConfigSection = (event) => {
  if (event.newState === "open") {
    const details = document.querySelectorAll(
      `.config-section:not(#${event.target.id})`
    );

    details.forEach((detail) => (detail.open = false));
  }
};

/**
 * Creates the config center UI and adds it to the DOM
 */
const createConfigCenter = async () => {
  const customConfig = getCustomConfig();
  // Combine the config customizations with the default config
  const locationConfig = { ...config.location, ...customConfig.location };
  const poiConfig = { ...config.poi, ...customConfig.poi };
  const cameraConfig = { ...config.camera, ...customConfig.camera };

  const mainContainerElement = document.querySelector(".main-container");

  const configCenterPanel = document.createElement("details");
  configCenterPanel.classList.add("config-center-panel");
  configCenterPanel.open = true;

  // Create the config center summary HTML elements
  const summary = document.createElement("summary");

  const summaryHeader = document.createElement("div");
  summaryHeader.classList.add("config-center-panel-header");

  const gmpLogo = document.createElement("img");
  gmpLogo.classList.add("gmp-logo");
  gmpLogo.src = "assets/google-maps-platform-logo.svg";
  gmpLogo.alt = "Google Maps Platform";

  const summaryTitle = document.createElement("h1");
  summaryTitle.classList.add("title");
  summaryTitle.textContent = "3D Area Explorer";

  const summaryDescription = document.createElement("p");
  summaryDescription.classList.add("description");
  summaryDescription.textContent =
    "Choose your location and select the place type you want to show in the surrounding.";

  const locationSection = await getLocationSettingsSection(locationConfig);

  // Create the config center details HTML elements
  const placeTypesSection = await getPlaceSettingsSection(poiConfig);
  const cameraSettingsSection = getCameraSettingsSection(cameraConfig);

  [placeTypesSection, cameraSettingsSection].forEach((section) => {
    section.addEventListener("toggle", toggleConfigSection);
  });

  const downloadButton = document.createElement("a");
  downloadButton.classList.add("button", "download-button");

  const downloadIconString = await fetch("/assets/icons/download.svg").then(
    (response) => response.text()
  );
  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(
    downloadIconString,
    "image/svg+xml"
  );
  const downloadIcon = svgDocument.documentElement;

  downloadButton.textContent = "Download Config";
  downloadButton.prepend(downloadIcon);

  downloadButton.setAttribute("href", getConfigDownloadDataUrl());
  downloadButton.setAttribute("download", "config.json");

  downloadButton.addEventListener("click", (event) => {
    // Update data URL with current configuration data before downloading
    event.target.href = getConfigDownloadDataUrl();
  });

  const architectureCenterLink = document.createElement("a");
  architectureCenterLink.classList.add("architecture-center-link");
  architectureCenterLink.href = "https://github.com/googlemaps-samples/js-3d-area-explorer"; // TODO: add architecture center link
  architectureCenterLink.target = "_blank";
  architectureCenterLink.textContent = "Downlad the code";

  // Append the HTML elements to the container
  summaryHeader.appendChild(gmpLogo);
  summary.appendChild(summaryHeader);
  summary.appendChild(summaryTitle);
  summary.appendChild(summaryDescription);
  summary.appendChild(locationSection);

  configCenterPanel.appendChild(summary);
  configCenterPanel.appendChild(cameraSettingsSection);
  configCenterPanel.appendChild(placeTypesSection);
  configCenterPanel.appendChild(architectureCenterLink);

  mainContainerElement.appendChild(configCenterPanel);
  mainContainerElement.appendChild(downloadButton);
  // Update the map according to the received custom config
  if (customConfig.camera) {
    updateCamera();
  }
  if (customConfig.location) {
    updateLocation();
  }
  if (customConfig.location || customConfig.poi) {
    updateMarkers();
  }
};

createConfigCenter();
