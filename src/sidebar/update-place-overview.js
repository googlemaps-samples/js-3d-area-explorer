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

/**
 * Updates a place overview element with the given contact information.
 * This function is responsible for populating the overview of a place
 * including address, website, phone, and opening hours. If any property
 * of placeDetails is undefined, the corresponding section will not be rendered.
 * If no data is available, the sidebar is cleared and a disclaimer is displayed.
 *
 * @param {google.maps.places.PlaceResult} placeDetails - The details of the place to create an overview for.
 */
export const updatePlaceOverview = (placeDetails) => {
  const placeOverviewElement = document.querySelector(".place-overview");
  if (!placeOverviewElement) {
    return;
  }

  // Populate different sections of the place overview
  if (placeDetails.formatted_address) {
    populateAddress(placeOverviewElement, placeDetails);
  } else {
    removeElement(".address");
  }

  if (placeDetails.website) {
    populateWebsite(placeOverviewElement, placeDetails);
  } else {
    removeElement(".website");
  }

  if (placeDetails.formatted_phone_number) {
    populatePhone(placeOverviewElement, placeDetails);
  } else {
    removeElement(".phone");
  }

  if (placeDetails.opening_hours) {
    populateOpeningHours(placeOverviewElement, placeDetails);
  } else {
    removeElement(".opening-hours");
  }
};

/**
 * Populates the address section of the place overview.
 *
 * @param {Element} container - The container element for the place overview.
 * @param {google.maps.places.PlaceResult} placeDetails - The details of the place.
 */
const populateAddress = (container, placeDetails) => {
  const placeAddress = container.querySelector(".address > p");

  placeAddress.innerText = placeDetails.formatted_address;
};

/**
 * Populates the phone section of the place overview.
 *
 * @param {Element} container - The container element for the place overview.
 * @param {google.maps.places.PlaceResult} placeDetails - The details of the place.
 */
const populatePhone = (container, placeDetails) => {
  const placePhone = container.querySelector(".phone > p");

  placePhone.innerText = placeDetails.formatted_phone_number;
};

/**
 * Populates the opening hours section of the place overview.
 * Fixed issue with appending elements to a potentially null container.
 *
 * @param {Element} container - The container element for the place overview.
 * @param {google.maps.places.PlaceResult} placeDetails - The details of the place.
 */
const populateOpeningHours = (container, placeDetails) => {
  const openingHoursSummary = container.querySelector(".opening-hours-summary");
  const openingHoursDetails = container.querySelector(".opening-hours-details");

  if (!openingHoursSummary || !openingHoursDetails) {
    return; // Guard against null elements
  }

  const openingHours = placeDetails.opening_hours;
  const openingHoursElement = document.createElement("span");

  openingHoursElement.classList.add(openingHours.isOpen() ? "open" : "closed");
  openingHoursElement.innerText = openingHours.isOpen() ? "Open" : "Closed";
  openingHoursSummary.appendChild(openingHoursElement);

  // Calculate the day of the week
  const dayOfTheWeek = (new Date().getDay() - 1 + 7) % 7;

  for (const [weekday, text] of openingHours.weekday_text.entries()) {
    appendOpeningHoursDetail(
      openingHoursDetails,
      text,
      weekday === dayOfTheWeek,
      openingHours.isOpen()
    );
  }
};

/**
 * Appends a day's opening hours detail to the container.
 *
 * @param {Element} container - The container element for the opening hours details.
 * @param {string} text - The opening hours text for a specific day.
 * @param {boolean} isToday - Indicates if the day is the current day.
 * @param {boolean} isOpenToday - Indicates if the place is open today.
 */
const appendOpeningHoursDetail = (container, text, isToday, isOpenToday) => {
  const openingHoursDayElement = document.createElement("span");
  const day = text.match(/^.+?(?=:)/)[0] || "";

  openingHoursDayElement.classList.add("day");
  openingHoursDayElement.innerText = day.trim();

  const openingHoursTimeElement = document.createElement("span");
  const time = text.split(/^.+?:\s/)[1] || "";

  openingHoursTimeElement.classList.add("time");
  openingHoursTimeElement.innerText = time.trim();

  if (isToday) {
    openingHoursDayElement.classList.add("today");
    openingHoursTimeElement.classList.add("today");

    if (isOpenToday) {
      // Display the time of today's opening hours in the summary
      document
        .querySelector(".opening-hours-summary")
        .appendChild(openingHoursTimeElement.cloneNode(true));
    }
  }

  container.appendChild(openingHoursDayElement);
  container.appendChild(openingHoursTimeElement);
};

/**
 * Populates the website section of the place overview. Handles cases where
 * the website property might be undefined.
 *
 * @param {Element} container - The container element for the place overview.
 * @param {google.maps.places.PlaceResult} placeDetails - The details of the place.
 */
const populateWebsite = (container, placeDetails) => {
  const placeWebsiteLink = container.querySelector(".website > a");

  try {
    const url = new URL(placeDetails.website);

    placeWebsiteLink.innerText = url.hostname || placeDetails.website;
    placeWebsiteLink.href = placeDetails.website;
    placeWebsiteLink.target = "_blank";
  } catch (e) {
    console.error("Error parsing website URL:", e);
  }
};

/**
 * Removes the specified element from the DOM.
 *
 * @param {string} selector - The CSS selector of the element to remove.
 */
const removeElement = (selector) => {
  const element = document.querySelector(selector);
  if (element) {
    element.parentNode.removeChild(element);
  }
};

/**
 * Displays a disclaimer in the sidebar when no place details data is available.
 */
const displayNoDataDisclaimer = () => {
  const sidebar = document.querySelector("#sidebar");
  if (!sidebar) {
    return;
  }

  const disclaimer = document.createElement("p");
  disclaimer.textContent = "No place details available.";
  sidebar.appendChild(disclaimer);
};
