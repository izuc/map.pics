# Map.Pics

Map.Pics is a photo sharing app designed for campuses around Australia, enabling users to take photos and upload them with comments. The app allows users to explore interactive maps of various campuses and view photos taken by other users at specific locations on the map.

## Features

- Interactive campus maps generated from OpenStreetMap data
- Photo uploading with comments
- Geocoordinate-based photo placement on the map
- User-friendly interface for easy navigation and exploration

## Technologies Used

- React: The app is built using the React JavaScript library for building user interfaces.
- PHP: The backend API is implemented using PHP to handle data storage and retrieval.
- SVG: The campus maps are created in SVG format, allowing for scalable and interactive map rendering.
- Vite: The app is built and bundled using Vite, a fast build tool for modern web applications.

## Code Structure

The app's codebase is organized as follows:

- `src/`: Contains the main source code files.
- `MappicsElement.jsx`: The main component that renders the app's UI.
- `MappicsStore.jsx`: Manages the app's state using Zustand.
- `API.jsx`: Contains functions for making API requests to the backend.

- `backend/`: Contains the PHP files for the backend API.
- `api/`: Contains the API endpoint files.
 - `api.php`: Handles API requests and interacts with the database.

- `vite.config.js`: Configuration file for Vite build tool.
- `package.json`: Contains the project's dependencies and scripts.

## Acknowledgements

- [OpenStreetMap](https://www.openstreetmap.org/) for providing the map data.

Created by [Lance](https://www.lance.name)
