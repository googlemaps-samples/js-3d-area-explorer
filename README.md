# 3D Area Explorer solution

![thumbnail](./src/assets/readme_assets/area-explorer-4k.gif)

## Overview

This is the 3D Area Explorer solution. This solution leverages the capabilities of Google Maps Platform [Photorealistic 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles-overview) and the [Places API](https://developers.google.com/maps/documentation/places/web-service) to create captivating, interactive 3D environments.

This repository consists of two parts. A Demo App, which is an example customized deployment, and an Admin App, which provides a UI control panel to adjust the solution settings visually like location, camera, and POI types.

Explore the [solutions landing page](https://developers.google.com/maps/architecture/3d-area-explorer)

## Prerequisites

You need to create a <a href="https://console.cloud.google.com/google/maps-apis/credentials?utm_source=3d_area_explorer" target="_blank">Google Maps Platform API Key</a> and enable the following three APIs:
- <a href="https://console.cloud.google.com/marketplace/product/google/tile.googleapis.com?utm_source=3d_area_explorer" target="_blank">Map Tiles API</a>
- <a href="https://console.cloud.google.com/marketplace/product/google/places-backend.googleapis.com?utm_source=3d_area_explorer" target="_blank">Places API</a>
- <a href="https://console.cloud.google.com/marketplace/product/google/maps-backend.googleapis.com?utm_source=3d_area_explorer" target="_blank">Maps JavaScript API</a>

Also, it is always a good idea to add <a href="https://developers.google.com/maps/api-security-best-practices#restricting-api-keys" target="_blank">restrictions</a> for specific websites (i.e. `localhost:5500` for local development, or `www.yourdomain.com` for production deployment).

## Hosted Admin app

If you want to try the app without any [local installation](#local-development), try our [hosted demo version](https://goo.gle/3d-area-explorer-admin).

### Quickstart - static webserver

1. [Download](https://github.com/googlemaps-samples/js-3d-area-explorer/archive/refs/heads/main.zip) or `git clone` this repository
2. Extract the contents of the `src` folder
3. Adjust the `config.json` to your needs - see [Configuration](#Configuration)
4. Add your Google Maps Platform API key to [env.exmaple.js](src/env.exmaple.js) and rename the file to `env.js`
5. Serve the files with a static webserver

### Quickstart: Start Admin app using build in bash script

1. Clone this repo to your local machine: `git clone ...`
2. Run the admin setup script: `cd js-3d-area-explorer && chmod +x build_admin.sh`
3. Start the server: `./build_admin.sh <YOUR_GMP_API_KEY>`
    * Note: The script can pick up the API_KEY from envrionment variable `API_KEY` as well.


## Build using Node.js

### Demo app

You can  use your own local webserver to show the 3D Area Explorer app like this:

* From the root directory: `npx http-server -p 5500 ./src`
For the local development you still need the API key for 3D Map Tiles and Google Places/Maps requests.

## Build using Docker

### Build the Demo App with Docker

You need to have docker installed to best work with the **demo-app** locally.

1. Clone the repository
2. `docker-compose build demo`
3. `docker-compose up demo`

### Build the Admin app with Docker

There is a second docker compose service `docker-compose up app` which only serves the admin app. For this you may need to update the `config.json` file to include you data.

### Manually build the Admin app
Note: You should follow these instructions if you want to create your own admin app in a
different language other than bash.

To start the local server as **admin app** do the following:

1. Copy the files in demo/src to demo/
     * Bash command from `/demo` directory: `cp -r ../demo/src ./demo`
2. In index.html, at the end of the file, it has reference to main.js. Change it to demo/sidebar.js.
    * Bash command from `/src` directory: `sed -i'.bak' "s/main.js/demo\/sidebar.js/g" index.html`
3. Start the node app by running npx
    * Bash commpand from `src` directory: `http-server -p 5500 ./src`

## Configuration

You can edit the `config.json` file in the `src` directory to change settings. It is also possible to implement your own `loadConfig` function to get configuration from a different file on a different server or to request an API which dynamically returns configuration.

Also, we would recommend that you do not use a global name space for the configuration. The code in this repositiry needs to have a global variable to update the configuration via the config center in the demo deployment.

### Location Configuration

The `location` object in `config.json` sets the center of the neighbourhood. It's the initial viewpoint of the camera in the Cesium viewer.

- `coordinates`: Defines the latitude (`lat`) and longitude (`lng`) for the location you want the camera to pan to first. Adjust these values to set the camera to any specific location on the globe.

### Points of Interest (POI) Configuration

The `poi` object in `config.json` configures the parameters for searching and displaying Points of Interest around the initial camera location. These options are specific to the Google Places API. If you want to use your own Points of Interesst, you don't need these settings.

- `density`: The approximate maximum number of POIs on the map. There are never more than 20 POIs per type due to the restrictions of the Google Places API. Duplicate POIs are filtered out.
- `searchRadius`: Determines the radius in meters for the POI search area from the initial location. Modify this to increase or decrease the search area size (https://developers.google.com/maps/documentation/places/web-service/search-nearby#radius).
- `types`: An array of POI categories to be displayed. Populate this array with different strings that represent the types of POIs you want to include in the search (e.g., "museum", "park", "school") (https://developers.google.com/maps/documentation/places/web-service/search-nearby#type).

### Camera Configuration

The `camera` object in `config.json` configures the parameters for the camera flight around the center of the neighbourhood in the Cesium viewer.

- `speed`: The camera speed in revolutions per minute used for the auto orbit animation.
- `orbitType`: The type of movement for the auto-orbit animation. Possible values are "dynamic-orbit" for an orbit as sine wave and "fixed-orbit" for a simple round orbit.

### Cesium / Globe

Most of the cesium setting are located and documented in `/src/utils/cesium.js`.

Here are some highlights:

- **START_COORDINATES**: To change the very initial start position for the fly to your neihgbourhood
- **CAMERA_OFFSET**: The camera position. Used for the initial setting for the neighbourhood but also for specific markers in `/src/utils/create-marker.js`
- **heading**: refers to the rotation offset (basically the compass direction)
- **pitch**: refers to the tilt of the camera (negative to look down)
- **range**: refers to the distance from the point the camera is looking at

## Repository structure

The repositiory is structured to have separate folder for the actual app (`/src`) and the demo/configuration-ui (`/demo/src`). This is due to fact that we need to deploy different versions.

The app part of the repository is self contained and can be used as is (after updating the configuration). This will show the globe with 3D tiles. Centered on the `location` setting in `config.json`. It will be filled with places from the Google Places API (configured in `config.json`).

The demo folder contains additional code to render a configuration UI to play with the settings in the `config.json`. The code is added to the deployment by way of the `/demo/Dockerfile`.

## Terms of Service
This solution uses Google Maps Platform services. Use of Google Maps Platform services through this solution is subject to the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms).

This solution is not a Google Maps Platform Core Service. Therefore, the Google Maps Platform Terms of Service (e.g. Technical Support Services, Service Level Agreements, and Deprecation Policy) do not apply to the code in this solution.

## Support
This solution is offered via an open source license. It is not governed by the Google Maps Platform Support Technical Support Services Guidelines, the SLA, or the Deprecation Policy (however, any Google Maps Platform services used by the solution remain subject to the Google Maps Platform Terms of Service).

If you find a bug, or have a feature request, please file an issue on GitHub. If you would like to get answers to technical questions from other Google Maps Platform developers, ask through one of our developer community channels. If you'd like to contribute, please check the Contributing guide.

You can also discuss this solution on our Discord server.
