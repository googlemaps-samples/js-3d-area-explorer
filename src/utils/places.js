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

import { GOOGLE_MAPS_API_KEY } from "../../env.js";

/** @type {google.maps.places.PlacesService} */
let placesService = null;

/**
 * Asynchronously initializes and loads the Google Maps JavaScript API with specific configurations.
 * This function is responsible for adding a script to the document head, loading the Google Maps Places library,
 * and creating a PlacesService for use in the application.
 *
 * @param {string} GOOGLE_MAPS_API_KEY - The Google Maps API key required for API access.
 */
async function initGoogleMaps() {
  // This part is from https://developers.google.com/maps/documentation/javascript/libraries
  const script = document.createElement("script");
  script.type = "text/javascript";
  // prettier-ignore
  script.innerText = (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
  key: GOOGLE_MAPS_API_KEY,
  v: "weekly",
});

  // add the script to the document head
  document.head.appendChild(script);

  // Load the Google Maps places libray
  await google.maps.importLibrary("places");

  // assign the PlacesService to the local global variable
  placesService = new google.maps.places.PlacesService(
    document.createElement("div")
  );
}

await initGoogleMaps();

/**
 * Returns details for a given place ID.
 *
 * @param {string} placeId - The ID of the place to retrieve details for.
 * @returns {Promise<google.maps.places.PlaceResult>} - A promise that resolves with an object containing details for the specified place.
 */
export async function getPlaceDetails(placeId) {
  const request = {
    placeId: placeId,
  };

  return new Promise((resolve, reject) => {
    placesService.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        resolve(place); // Resolve the promise with the 'place' value
      } else {
        reject(new Error("Failed to get place details")); // Reject the promise in case of an error
      }
    });
  });
}

/**
 * Async wrapper for the places nearby search to use async/await pattern
 *
 * @param {google.maps.places.PlaceSearchRequest} request
 * @returns {Promise<google.maps.places.PlaceResult[]>}
 */

async function asyncNearbySearch(request) {
  return new Promise((resolve, reject) => {
    placesService.nearbySearch(request, (results, status) => {
      if (status === "OK" || status === "ZERO_RESULTS") {
        resolve(results);
      } else {
        reject("Places nearby request failed");
      }
    });
  });
}

/**
 * Retrieves the nearby places based on the selected POIs
 *
 * @param {PoiConfig} poiConfig
 * @param {google.maps.LatLng} coordinates
 *
 * @returns {Promise<google.maps.places.PlaceResult[]>}
 */
export async function getNearbyPois(poiConfig, coordinates) {
  const placesPromises = [];

  for (const locationType of poiConfig.types) {
    /** @type {google.maps.places.PlaceSearchRequest} */
    const request = {
      location: coordinates,
      radius: poiConfig.searchRadius,
      type: locationType,
    };

    const placesPromise = asyncNearbySearch(request);
    placesPromises.push(placesPromise);
  }

  const placesResults = await Promise.all(placesPromises);
  const allPlaces = placesResults.flat();
  const totalNumberOfPlaces = allPlaces.length;

  /**
   * Reduce places depending on the density configuration value
   * while keeping the proportion per type in the requested area
   *
   * @param {google.maps.places.PlaceResult[]} placesOfOneType - The place results of a location type
   * @returns {google.maps.places.PlaceResult[]}
   */
  const reducePlaces = (placesOfOneType) => {
    const numberOfPlaces = Math.round(
      (placesOfOneType.length / totalNumberOfPlaces) * poiConfig.density
    );
    // Keep at least one place per type
    return placesOfOneType.slice(0, Math.max(1, numberOfPlaces));
  };

  const places =
    totalNumberOfPlaces <= poiConfig.density
      ? allPlaces
      : placesResults.map(reducePlaces).flat();

  // A place can possibly have multiple types and therefore can be fetched more than once,
  // so we need to filter out duplicates.
  return places.reduce((uniquePlaces, place) => {
    // Check if the place ID is not in the accumulator array
    if (!uniquePlaces.some(({ place_id }) => place_id === place.place_id)) {
      uniquePlaces.push(place);
    }
    return uniquePlaces;
  }, []);
}

/**
 * Fetches the coordinates of a place using its placeId via the Google Places API.
 *
 * @param {string} placeId - The placeId to fetch the coordinates for.
 * @returns {Promise<google.maps.LatLng | null>} The coordinates of the given place or null if not found.
 */
function fetchCoordsByPlaceId(placeId) {
  return new Promise((resolve, reject) => {
    const request = {
      placeId: placeId,
      fields: ["geometry"],
    };

    placesService.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        resolve(place.geometry.location);
      } else {
        reject(new Error(status));
      }
    });
  });
}

/**
 * Fetches the coordinates of a given place using its name via the Google Places API.
 *
 * @param {string} placeName - The name of the place to fetch the coordinates for.
 * @returns {Promise<google.maps.LatLng | null>} The coordinates of the given place or null if not found.
 */
function fetchCoordsByPlaceName(placeName) {
  return new Promise((resolve, reject) => {
    const request = {
      query: placeName,
      fields: ["geometry"],
    };

    placesService.findPlaceFromQuery(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        resolve(results[0].geometry.location);
      } else {
        reject(new Error(status));
      }
    });
  });
}

/**
 * Converts a location (either a string, LatLng or placeId) into a Google Maps LatLng object.
 * It requires the caller to know if they are providing a place name or a placeId.
 *
 * @param {google.maps.LatLng | string} location - The location to be converted (can be place name or placeId).
 * @param {'placeName' | 'placeId' | 'coords'} type - The type of the location provided.
 *
 * @returns {Promise<google.maps.LatLng>} The Google Maps LatLng object.
 */
export async function getLocation(location, type) {
  const coords = new google.maps.LatLng(location);

  // If the coordinates are valid, return them immediately
  if (!isNaN(coords.lat()) && !isNaN(coords.lng())) {
    return coords;
  }

  // Fetch based on the type provided
  if (type === "placeId") {
    return await fetchCoordsByPlaceId(location);
  } else if (type === "placeName") {
    return await fetchCoordsByPlaceName(location);
  } else {
    throw new Error("Invalid type provided to getLocation.");
  }
}
