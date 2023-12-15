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

import { updateCamera } from "./utils/app.js";
import { setCustomConfig } from "./utils/config.js";

/**
 * Creates and returns the camera settings section for the config center
 *
 * @param {CameraConfig} cameraConfig - The camera configuration.
 * @returns {HTMLElement} The camera settings section element.
 */
export const getCameraSettingsSection = (cameraConfig) => {
  const cameraSettingsSection = document.createElement("details");
  cameraSettingsSection.open = true;
  cameraSettingsSection.id = "camera-config";
  cameraSettingsSection.classList.add("config-section");

  const cameraSettingsSummary = document.createElement("summary");

  // Create the camera settings summary HTML elements
  const cameraSettingsTitle = document.createElement("h2");
  cameraSettingsTitle.textContent = "Camera Settings";

  cameraSettingsSummary.appendChild(cameraSettingsTitle);

  // Create the camera settings filters HTML elements
  const cameraSettingsFilters = document.createElement("form");
  cameraSettingsFilters.name = "camera-config";
  cameraSettingsFilters.classList.add("filters");

  // Create the speed filter HTML elements
  const speedFilter = document.createElement("div");

  const speedFilterTitle = document.createElement("h3");
  speedFilterTitle.textContent = "Speed:";

  const autoOrbitFilterTitle = document.createElement("h3");
  autoOrbitFilterTitle.textContent = "Type:";

  const baseRadioButton = document.createElement("input");
  baseRadioButton.type = "radio";
  baseRadioButton.name = "orbitType";

  const dynamicOrbitLabel = document.createElement("label");
  dynamicOrbitLabel.textContent = "Dynamic orbit";
  const dynamicOrbitRadioButton = baseRadioButton.cloneNode();
  dynamicOrbitRadioButton.checked = cameraConfig.orbitType === "dynamic-orbit";
  dynamicOrbitRadioButton.id = "dynamic-orbit";
  dynamicOrbitRadioButton.value = "dynamic-orbit";
  dynamicOrbitLabel.htmlFor = "dynamic-orbit";
  const dynamicOrbitButtonContainer = document.createElement("div");
  dynamicOrbitButtonContainer.appendChild(dynamicOrbitRadioButton);
  dynamicOrbitButtonContainer.appendChild(dynamicOrbitLabel);

  const fixedOrbitLabel = document.createElement("label");
  fixedOrbitLabel.textContent = "Fixed orbit";
  const fixedOrbitRadioButton = baseRadioButton.cloneNode();
  fixedOrbitRadioButton.checked = cameraConfig.orbitType === "fixed-orbit";
  fixedOrbitRadioButton.id = "fixed-orbit";
  fixedOrbitRadioButton.value = "fixed-orbit";
  fixedOrbitLabel.htmlFor = "fixed-orbit";
  const fixedOrbitButtonContainer = document.createElement("div");
  fixedOrbitButtonContainer.appendChild(fixedOrbitRadioButton);
  fixedOrbitButtonContainer.appendChild(fixedOrbitLabel);

  const autoOrbitFilter = document.createElement("div");
  autoOrbitFilter.classList.add("radio-buttons-container");

  autoOrbitFilter.appendChild(autoOrbitFilterTitle);
  autoOrbitFilter.appendChild(dynamicOrbitButtonContainer);
  autoOrbitFilter.appendChild(fixedOrbitButtonContainer);

  const speedFilterSlider = document.createElement("div");
  speedFilterSlider.classList.add("config-slider-container");

  const speedFilterInput = document.createElement("input");
  speedFilterInput.type = "range";
  speedFilterInput.name = "speed";
  speedFilterInput.id = "camera-speed";
  speedFilterInput.min = 0.1;
  speedFilterInput.max = 5;
  speedFilterInput.step = 0.1;
  speedFilterInput.value = cameraConfig.speed;

  speedFilterInput.style.setProperty("--value", speedFilterInput.value);
  speedFilterInput.style.setProperty("--min", speedFilterInput.min);
  speedFilterInput.style.setProperty("--max", speedFilterInput.max);

  // Update the slider progress when the value changed
  speedFilterInput.addEventListener("input", () => {
    speedFilterInput.style.setProperty("--value", speedFilterInput.value);
  });

  // Update the map's camera animation speed when the speed value changed
  speedFilterInput.addEventListener("change", (event) => {
    setCustomConfig("camera.speed", Number(event.target.value));
    updateCamera();
  });

  // Update the map's camera auto orbit type
  fixedOrbitRadioButton.addEventListener("change", (event) => {
    setCustomConfig("camera.orbitType", event.target.value);
    updateCamera();
  });
  dynamicOrbitRadioButton.addEventListener("change", (event) => {
    setCustomConfig("camera.orbitType", event.target.value);
    updateCamera();
  });

  const speedFilterLabelMin = document.createElement("label");
  speedFilterLabelMin.textContent = "Slow";

  const speedFilterLabelMax = document.createElement("label");
  speedFilterLabelMax.textContent = "Fast";

  speedFilterSlider.appendChild(speedFilterInput);
  speedFilterSlider.appendChild(speedFilterLabelMin);
  speedFilterSlider.appendChild(speedFilterLabelMax);
  speedFilter.appendChild(speedFilterTitle);
  speedFilter.appendChild(speedFilterSlider);

  // Append the HTML elements to the section container
  cameraSettingsSection.appendChild(cameraSettingsSummary);

  cameraSettingsFilters.appendChild(autoOrbitFilter);
  cameraSettingsFilters.appendChild(speedFilter);
  cameraSettingsSection.appendChild(cameraSettingsFilters);

  return cameraSettingsSection;
};
