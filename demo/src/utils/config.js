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
 * Returns the customized configuration data from URL hash parameters.
 *
 * @returns {Partial<NeighbourhoodDiscoveryConfig>} The customized configuration data.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, Timestamp,addDoc, collection } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js'
import { FIREBASE_API_KEY } from "../../env.js";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "d-area-explorer-staging.firebaseapp.com",
  projectId: "d-area-explorer-staging",
  storageBucket: "d-area-explorer-staging.appspot.com",
  messagingSenderId: "862242299614",
  appId: "1:862242299614:web:815da51faf02d9373f2c4f",
  measurementId: "G-540GBW9XC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app,"metrics-db");


export const getCustomConfig = () => {
  const params = new URLSearchParams(window.location.hash.replace("#", ""));

  const locationConfig = {
    ...(params.get("location.coordinates.lat") &&
      params.get("location.coordinates.lng") && {
        coordinates: {
          lat: Number(params.get("location.coordinates.lat")),
          lng: Number(params.get("location.coordinates.lng")),
        },
      }),
  };

  const poiConfig = {
    ...(params.get("poi.types") && {
      types: params.getAll("poi.types"),
    }),
    ...(params.get("poi.searchRadius") && {
      searchRadius: Number(params.get("poi.searchRadius")),
    }),
    ...(params.get("poi.density") && {
      density: Number(params.get("poi.density")),
    }),
  };

  const cameraConfig = {
    ...(params.get("camera.orbitType") && {
      orbitType: params.get("camera.orbitType"),
    }),
    ...(params.get("camera.speed") && {
      speed: Number(params.get("camera.speed")),
    }),
  };

  return {
    ...(Object.values(locationConfig).length && { location: locationConfig }),
    ...(Object.values(poiConfig).length && { poi: poiConfig }),
    ...(Object.values(cameraConfig).length && { camera: cameraConfig }),
  };
};

/**
 * Sets overrides for the configuration data as URL hash parameters.
 * If the passed value is `undefined`, the given parameter will be removed from the URL.
 *
 * @param {string} parameter - The name of the URL hash parameter to set.
 * @param {string | number | Array<string | number> | undefined} value - The value of the URL hash parameter to set.
 */
export const setCustomConfig = (parameter, value) => {
  const params = new URLSearchParams(window.location.hash.replace("#", ""));

  if (value) {
    if (Array.isArray(value)) {
      // Delete array parameter values and add new array values
      params.delete(parameter);
      for (let index = 0; index < value.length; index++) {
        params.append(parameter, value[index]);
      }
    } else {
      // Override parameter value
      params.set(parameter, value);
    }
  } else {
    // Remove parameter value
    params.delete(parameter);
  }
  window.location.hash = params;
  
};


//const docRef = await addDoc(collection(db, "metrics-url"), data); 
//console.log("Camera settings saved with ID: ", docRef.id);

/**
 * Returns the data of an HTML form element in form of an object.
 *
 * @param {HTMLFormElement} form - The HTML form element to get the data from.
 * @returns {Object} The form data as object.
 */
const getFormData = (form) => {
  const formData = new FormData(form);

  return Array.from(formData.keys()).reduce((result, key) => {
    const inputType = form.querySelector(`input[name="${key}"]`).type;
    // Handle numeric input values
    const isNumericValue = inputType === "number" || inputType === "range";
    const value = isNumericValue
      ? Number(formData.get(key))
      : formData.get(key);

    if (key.includes(".")) {
      // Handle object data with dot-separated keys
      // e.g. "my.nested.keys" results in {my: {nested: {keys: ...}}}
      const [objectKey, ...nestedKeys] = key.split(".");

      const setNestedProperty = (object, properties, value) => {
        const [property, ...nestedProperties] = properties;
        return {
          ...object,
          [property]: nestedProperties.length
            ? setNestedProperty(nestedProperties, value)
            : value,
        };
      };

      result[objectKey] = setNestedProperty(
        result[objectKey] || {},
        nestedKeys,
        value
      );
    } else if (result[key]) {
      // Combine the values of inputs with the same name as array
      result[key] = formData.getAll(key);
    } else {
      result[key] = value;
    }

    return result;
  }, {});
};

/**
 * Returns the location configuration from the config center UI.
 *
 * @returns {LocationConfig} The location configuration.
 */
export const getLocationConfig = () => {
  const locationConfigForm = document.querySelector(
    'form[name="location-config"]'
  );
  return getFormData(locationConfigForm);
};

/**
 * Returns the POI configuration from the config center UI.
 *
 * @returns {PoiConfig} The POI configuration.
 */
export const getPoiConfig = () => {
  const poiConfigForm = document.querySelector('form[name="poi-config"]');
  const poiConfig = getFormData(poiConfigForm);

  return {
    ...poiConfig,
    // Make sure the `types` are always returned in form of an array
    types: Array.isArray(poiConfig.types)
      ? poiConfig.types
      : [poiConfig.types].filter(Boolean),
  };
};

/**
 * Returns the camera configuration from the config center UI.
 *
 * @returns {CameraConfig} The camera configuration.
 */
export const getCameraConfig = () => {
  const cameraConfigForm = document.querySelector('form[name="camera-config"]');
  return getFormData(cameraConfigForm);
};

/**
 * Returns the configuration data from the config center UI.
 *
 * @returns {NeighbourhoodDiscoveryConfig} The configuration data.
 */
export const getConfigCenterConfig = () => ({
  location: getLocationConfig(),
  poi: getPoiConfig(),
  camera: getCameraConfig(),
});
