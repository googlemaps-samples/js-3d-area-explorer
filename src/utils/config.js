/**
 * Function to deep freeze an object.
 *
 * (See MDN deep freeze example: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
 *
 * @param {Object} object - The object to freeze.
 * @returns {*} The frozen object.
 */
function deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];

    if ((value && typeof value === "object") || typeof value === "function") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}

/**
 * Asynchronously fetches and loads a configuration file in JSON format.
 *
 * If successful, the configuration data is returned for use in the application.
 * The returned configuration object is deep-frozen to prevent modifications.
 *
 * If an error occurs during the fetch or parsing, an error message is thrown.
 *
 * @param {string} configUrl - The URL of the configuration file to be fetched.
 * @returns {Object} A Promise that resolves with the loaded and parsed configuration data.
 *
 * @throws {string} If an error occurs during the fetch or parsing, a descriptive error message is thrown.
 *
 * @example
 * // Usage example:
 * const configUrl = "path/to/config.json";
 * try {
 *   const configData = await loadConfig(configUrl);
 *   console.log('Configuration loaded successfully:', configData);
 * } catch (error) {
 *   console.error('Error loading config:', error);
 * }
 */
export async function loadConfig(configUrl) {
  try {
    // Fetch the configuration data from the specified URL.
    const configResponse = await fetch(configUrl);
    // Parse the JSON data
    const configData = await configResponse.json();

    // Freeze the config object with all its properties
    deepFreeze(configData);

    return configData;
  } catch (error) {
    // Handle and report any errors during the process.
    throw `Failed to load and parse configuration data: ${error}`;
  }
}
