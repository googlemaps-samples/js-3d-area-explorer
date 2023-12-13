
# 3D Area Explorer



## Overview

This project aims to create an Area Explorer sample app that showcases the new 3D tiles Solution by Google Maps. The demo will be featured at the Architecture Center, allowing users to explore neighbourhoods in 3D and learn about points of interests via digital storytelling.

This repository consists of two parts. The actual app, 3D Area Explorer, and a demo app which adds a control panel for settings.

## Installation

You need to create a [Google API Key](https://console.cloud.google.com/apis/credentials) and restrict it to at least these there APIs.

- Map Tiles API
- Maps JavaScript API
- Places API

Also, it is always a good idea to add restrictions for specific websites (i.e. `localhost:5500` for local development).

### Neighbourhood Discovery

There are no external dependencies to view and work with the Neighbourhood Discovery Tool.

1. download the content of the `src` folder
2. adjust the `config.json` to your needs (see [Configuration](#Configuration))
3. add your API key to `env.js` (see [env.exmaple.js](src/env.exmaple.js))
4. serve the files with a static webserver

If you want to play with the demo (with a configuration UI) without a [local installation](#local-development) you can always use our [hosted version](url).

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

## Local Development

For the local development you still need the API key for 3D Map Tiles and Google Places/Maps requests.

### Docker

You need to have docker installed to best work with the **demo-app** locally. If you want to play with the demo without a local installation you can always use our [hosted version](url)

1. Clone the repository
2. `docker-compose build demo`
3. `docker-compose up demo`

There is a second docker compose service `docker-compose up app` which only serves the final app. For this you may need to update the `config.json` file to include you data.

### NodeJS server

You can always use your own local webserver to show the Neighbourhood Discovery app like so:

`npx http-server -p 5500 ./src`

### IDEs

Most IDEs include some kind of server for static files. Just point it to the `./src` directory and set the right port.

## Deployment

To deploy the neighbourhood discovery you need to upload everything in the `src` folder to a static webserver or some other hosting service. A static webserver is enough. You need a domain for you webspace, though. Since the Google Maps API key is only restricted on a domain you would risk missuse of the key.

Included in the repository is a `Dockerfile` which can be used to build a docker image. This can be used to deploy with Google Cloud Run or other container cloud services.

## Repository structure

The repositiory is structured to have separate folder for the actual app (`/src`) and the demo/configuration-ui (`/demo/src`). This is due to fact that we need to deploy different versions.

The app part of the repository is self contained and can be used as is (after updating the configuration). This will show the globe with 3D tiles. Centered on the `location` setting in `config.json`. It will be filled with places from the Google Places API (configured in `config.json`).

The demo folder contains additional code to render a configuration UI to play with the settings in the `config.json`. The code is added to the deployment by way of the `/demo/Dockerfile`.