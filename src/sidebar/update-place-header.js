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

import { placeTypes } from "../utils/place-type-details.js";
import {
  generateStarRatingSVGs,
  appendSVGElements,
} from "./update-star-rating.js";

/**
 * Updates the UI elements in the place header with information from the provided place details.
 *
 * @param {Object} placeDetails - Details of the place, including name, photos, rating, user ratings total, and types.
 */
export const updatePlaceHeader = (placeDetails) => {
  // Update place image element or remove it if placeDetails photos don't exist
  const placeImageElement = document.querySelector(".place-image");

  if (placeDetails.photos) {
    // If photos exist, update image source and alt text
    placeImageElement.src = placeDetails.photos[0].getUrl();
    placeImageElement.alt = placeDetails.name;
  } else {
    // If no photos exist, remove the image element
    placeImageElement.remove();
  }

  // Update place name
  const placeNameElement = document.querySelector(".place-name");
  placeNameElement.textContent = placeDetails.name;

  // Rating values might be undefined
  if (placeDetails.rating && placeDetails.user_ratings_total) {
    // Update rating value as number
    const ratingNumberElement = document.querySelector(
      ".rating-overview-number"
    );
    ratingNumberElement.textContent = placeDetails.rating;

    // Update star rating and attach to the sidebar element
    const starRatings = generateStarRatingSVGs(placeDetails.rating);
    const ratingStarsElement = document.querySelector(".rating-overview-stars");
    appendSVGElements(ratingStarsElement, starRatings);

    // Update total reviews count
    const totalReviewsElement = document.querySelector(
      ".rating-overview-total"
    );
    totalReviewsElement.textContent = placeDetails.user_ratings_total
      ? `(${placeDetails.user_ratings_total.toLocaleString()})`
      : "";
  }

  // Update place type
  const placeTypeElement = document.querySelector(".place-type");
  placeTypeElement.textContent = placeTypes[placeDetails.types[0]];
};
