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

const starPath = {
  full: "M5.825 22L7.45 14.975L2 10.25L9.2 9.625L12 3L14.8 9.625L22 10.25L16.55 14.975L18.175 22L12 18.275L5.825 22Z",
  half: "M12 7.27498V16.325L15.6667 18.55L14.6917 14.3833L17.9167 11.5833L13.6667 11.2083L12 7.27498ZM5.825 22L7.45 14.975L2 10.25L9.2 9.625L12 3L14.8 9.625L22 10.25L16.55 14.975L18.175 22L12 18.275L5.825 22Z",
  empty:
    "M8.33333 18.525L12 16.325L15.6667 18.55L14.6917 14.3833L17.9167 11.5833L13.6667 11.2083L12 7.27498L10.3333 11.1833L6.0833 11.5583L9.30833 14.3667L8.33333 18.525ZM5.825 22L7.45 14.975L2 10.25L9.2 9.625L12 3L14.8 9.625L22 10.25L16.55 14.975L18.175 22L12 18.275L5.825 22Z",
};

/**
 * Generates an SVG star icon with the given path.
 *
 * @param {string} path - The path data for the star icon.
 * @returns {string} The SVG code for the star icon.
 */
const generateStarSVG = (path) => {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="${path}" fill="#FBBC04" />
    </svg>`;
};

/**
 * Appends SVG elements to a container element.
 *
 * @param {HTMLElement} container - The container element to append the SVG elements to.
 * @param {string[]} svgStrings - An array of SVG strings to be parsed and appended to the container element.
 */
export const appendSVGElements = (container, svgStrings) => {
  svgStrings.forEach((svgString) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.documentElement;
    container.appendChild(svgElement);
  });
};

/**
 * Generates an array of SVGs for a star rating.
 * @param {number} rating - The rating to generate SVGs for.
 * @returns {string[]} An array of SVG strings representing the star rating.
 * @throws {Error} If the rating is invalid (less than 0 or greater than 5).
 */
export const generateStarRatingSVGs = (rating) => {
  if (!rating || rating < 0 || rating > 5) {
    throw new Error("Invalid rating");
  }

  const decimalPart = rating % 1;

  let fullStars = Math.floor(rating);
  let hasHalfStar = false;

  // if the decimal number is between 0.4 and 0.7, then we add a half star
  // if the decimal number is greater than 0.7, then we have a another full star
  // if the decimal number is less than 0.4, there is no additional star
  if (decimalPart >= 0.4 && decimalPart <= 0.7) {
    hasHalfStar = true;
  } else if (decimalPart >= 0.7) {
    fullStars = Math.ceil(rating);
  }

  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starRatingSVGs = [
    ...new Array(fullStars).fill(generateStarSVG(starPath.full)),
    ...(hasHalfStar ? [generateStarSVG(starPath.half)] : []),
    ...new Array(emptyStars).fill(generateStarSVG(starPath.empty)),
  ];

  return starRatingSVGs;
};
