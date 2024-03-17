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
  cesiumViewer,
  performFlyTo,
  setAutoOrbitCameraSpeed,
  setAutoOrbitType,
  updateZoomToRadius,
  zoomResetCallback,
} from "../../utils/cesium.js";
import createMarkers from "../../utils/create-markers.js";
import { getNearbyPois } from "../../utils/places.js";
import { getConfigCenterConfig } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore-lite.js'

//import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAo6DIOnhYdywBidl4clsPZPkQkXfq6QhI",
  authDomain: "d-area-explorer-staging.firebaseapp.com",
  projectId: "d-area-explorer-staging",
  storageBucket: "d-area-explorer-staging.appspot.com",
  messagingSenderId: "862242299614",
  appId: "1:862242299614:web:815da51faf02d9373f2c4f",
  measurementId: "G-540GBW9XC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = getFirestore();

/**
 * Updates the camera of the map with the current configuration values.
 */
export async function updateCamera() {
  console.log("Just inside updateCamera function outside try");
  try {
    console.log("Just inside updateCamera function");
    const { camera: cameraConfig, poi: poiConfig } = getConfigCenterConfig();
    
    // Adjust the camera speed of the auto orbit animation
    setAutoOrbitCameraSpeed(cameraConfig.speed);
    await setAutoOrbitType(cameraConfig.orbitType);
    await updateZoomToRadius(poiConfig.searchRadius);

     // Store camera data in Firestore
     const data = {
      cameraSpeed: cameraConfig.speed,
      orbitType: cameraConfig.orbitType,
      searchRadius: poiConfig.searchRadius,
      // Add other relevant camera data as needed
    };

    //const docRef = await addDoc(collection(analytics, "metrics-collection"), data); 
    // Add a new document in collection "cities" with ID 'LA'
    const res = await db.collection('metrics-collection').add({
      name: 'Tokyo',
      country: 'Japan'
    });
    console.log("Camera settings saved with ID: ", docRef.id);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Updates the location of the map with the current configuration values.
 */
export const updateLocation = async () => {
  try {
    const {
      location: { coordinates },
    } = getConfigCenterConfig();
  
    console.log("Just inside updateLocation function");
     // Store camera data in Firestore
     const data = {
      lat: coordinates.lat,
      long: coordinates.lng
      // cameraSpeed: cameraConfig.speed,
      //orbitType: cameraConfig.orbitType,
      //searchRadius: poiConfig.searchRadius,
      // Add other relevant camera data as needed
    };

   // const docRef = await addDoc(collection(db, "metrics-collection"), data); 
    const res = await db.collection('metrics-collection').add({
    lat: coordinates.lat,
    long: coordinates.lng
  });
    console.log("Camera settings saved with ID: ", docRef.id);
    console.log("The new coordinates set by the user is lat: "+coordinates.lat+" long: "+coordinates.lng)

    // move the camera to face the main location's coordinates
    await performFlyTo(coordinates);
    updateZoomControl(coordinates);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Updates the markers on the map with the current configuration values.
 */
export const updateMarkers = async () => {
  try {
    const {
      location: { coordinates },
      poi: poiConfig,
    } = getConfigCenterConfig();

    // based on the given main location, fetch the surrounding POIs of the selected categories
    const pois = await getNearbyPois(poiConfig, coordinates);
    // remove all markers from the map before creating new ones
    cesiumViewer.entities.removeAll();
    // create markers according to the POIs placed on the map
    await createMarkers(pois, coordinates);
  } catch (error) {
    console.error(error);
  }
};

// A reference to the abort controller used to cancel the zoom reset button click event
let zoomResetController;

/**
 * Updates the zoom reset control button with the given coordinates.
 */
function updateZoomControl(coords) {
  const zoomResetButton = document.querySelector(".zoom-reset-button");

  if (!zoomResetButton) {
    return;
  }

  // cancel the previous zoom reset button click event
  if (zoomResetController) {
    zoomResetController.abort();
  }

  // create a new abort controller for the zoom reset button click event
  zoomResetController = new AbortController();

  // add a click event listener to the zoom reset button
  zoomResetButton.addEventListener(
    "click",
    () => {
      zoomResetCallback(coords);
    },
    { signal: zoomResetController.signal }
  );
}
