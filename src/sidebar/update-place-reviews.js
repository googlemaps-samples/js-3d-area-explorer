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
  generateStarRatingSVGs,
  appendSVGElements,
} from "./update-star-rating.js";

/**
 * Creates and appends review elements to the reviews container.
 * @param {Array} placeReviews - An array of place reviews.
 */
export const updatePlaceReviews = (placeReviews) => {
  const reviewContainerElement = document.querySelector(
    placeReviews ? ".reviews-scroll-container" : ".reviews"
  );

  if (!placeReviews) {
    const noReviewsContainer = document.createElement("div");
    noReviewsContainer.classList.add("no-reviews");
    noReviewsContainer.textContent = "No reviews available.";

    reviewContainerElement.appendChild(noReviewsContainer);
    return;
  }

  placeReviews.forEach((review) => {
    const formattedReview = createReviewElement(review);
    reviewContainerElement.appendChild(formattedReview);
  });
};

/**
 * Creates a review element with the given review data.
 * @param {Object} review - The review data.
 * @param {string} review.author_name - The username of the reviewer.
 * @param {string} review.text - The content of the review.
 * @param {string} review.rating - The date of the review.
 * @param {string} review.relative_time_description - The description of the date of the review.
 * @returns {HTMLElement} The review element.
 */
function createReviewElement(review) {
  // Creating elements
  const reviewContainerElement = document.createElement("div");
  reviewContainerElement.classList.add("review");

  const userNameElement = document.createElement("span");
  userNameElement.classList.add("username");
  userNameElement.textContent = review.author_name;

  const ratingInfoElement = document.createElement("div");
  ratingInfoElement.classList.add("rating-info-container");

  const reviewContentElement = document.createElement("span");
  reviewContentElement.classList.add("rating-overview-stars");
  const stars = generateStarRatingSVGs(review.rating);

  appendSVGElements(reviewContentElement, stars);

  ratingInfoElement.appendChild(reviewContentElement);

  const dateElement = document.createElement("span");
  dateElement.textContent = review.relative_time_description;

  ratingInfoElement.appendChild(dateElement);

  const reviewTextElement = truncateText(review.text);

  // Appending elements to the review div
  reviewContainerElement.appendChild(userNameElement);
  reviewContainerElement.appendChild(ratingInfoElement);
  reviewContainerElement.appendChild(reviewTextElement);

  return reviewContainerElement;
}

/**
 * Truncates text in a paragraph and adds a "Show More" button to expand the text. Becomes "Show Less" when expanded.
 * @param {HTMLElement} textContainer - The container element for the text.
 * @param {string} text - The text to be truncated.
 * @param {number} [maxWords=30] - The maximum number of words to display before truncating.
 */
export const truncateText = (text, maxWords = 30) => {
  const textElement = document.createElement("p");
  const words = text.split(" ");

  if (words.length <= maxWords) {
    textElement.innerHTML = text;

    return textElement;
  }

  const truncatedText = words.slice(0, maxWords).join(" ");
  const toggleButton = document.createElement("button");
  toggleButton.classList.add("text-button");
  toggleButton.textContent = "Show More";

  textElement.textContent = truncatedText + "... ";
  textElement.appendChild(toggleButton);

  let isTextTruncated = false;

  toggleButton.addEventListener("click", () => {
    if (isTextTruncated) {
      textElement.textContent = truncatedText + "... ";
      textElement.appendChild(toggleButton);
      toggleButton.textContent = "Show More";
    } else {
      textElement.innerHTML = text + " ";
      textElement.appendChild(toggleButton);
      toggleButton.textContent = "Show Less";
    }

    isTextTruncated = !isTextTruncated;
  });

  return textElement;
};
