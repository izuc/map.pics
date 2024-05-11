const BASE_URL = 'https://map.pics/api/';

// User Registration
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    console.log(data); // Process data
  } catch (error) {
    console.error('Error registering user:', error);
  }
};

// User Login
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    console.log(data); // Process data
  } catch (error) {
    console.error('Error logging in:', error);
  }
};

// Fetch Maps List
export const fetchMapsList = async () => {
  try {
    const response = await fetch(`${BASE_URL}maps`);
    if (!response.ok) throw new Error('Network response was not ok');
    const maps = await response.json();
    return maps; // Ensure this is an array
  } catch (error) {
    console.error('Error fetching maps list:', error);
    return []; // Return an empty array in case of an error
  }
};

// Fetch Map by ID
export const fetchMapById = async (mapId) => {
  try {
    const response = await fetch(`${BASE_URL}maps/?id=${mapId}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const mapDetails = await response.json();
    return mapDetails; // Ensure this is an object with map details
  } catch (error) {
    console.error(`Error fetching map with ID ${mapId}:`, error);
    return null; // Return null or an empty object in case of an error
  }
};

// Fetch Maps by Coordinates
export const fetchMapsByCoordinates = async (lat, lon) => {
  try {
    const response = await fetch(`${BASE_URL}/maps/coordinates?lat=${lat}&lon=${lon}`);
    const maps = await response.json();
    console.log(maps); // Process maps
  } catch (error) {
    console.error('Error fetching maps:', error);
  }
};

// Fetch Pictures by Map ID
export const fetchPicsByMapId = async (mapId) => {
  try {
    const response = await fetch(`${BASE_URL}pics/?map_id=${mapId}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const pics = await response.json();
    return pics; // Ensure this returns an array of pictures
  } catch (error) {
    console.error(`Error fetching pictures for map ID ${mapId}:`, error);
    return []; // Return an empty array in case of an error
  }
};

export const postPicture = async (pictureData) => {
  try {
    const response = await fetch(`${BASE_URL}pics`, {
      method: 'POST',
      body: pictureData // Directly use the FormData object passed as an argument
    });
    const data = await response.json();
    console.log(data); // Process response
    return data; // Return response data
  } catch (error) {
    console.error('Error posting picture:', error);
  }
};

// Fetch User Profile
export const fetchUserProfile = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`);
    const userProfile = await response.json();
    console.log(userProfile); // Process user profile
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
};

// Update User Profile
export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    console.log(data); // Process response
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
};

// Like/Dislike a Picture
export const likeDislikePicture = async (picId, likeData) => {
  try {
    const response = await fetch(`${BASE_URL}/pics/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pic_id: picId, ...likeData })
    });
    const data = await response.json();
    console.log(data); // Process response
  } catch (error) {
    console.error('Error liking/disliking picture:', error);
  }
};

// Fetch Likes and Dislikes for a Picture
export const fetchLikesDislikes = async (picId) => {
  try {
    const response = await fetch(`${BASE_URL}/pics/like?pic_id=${picId}`);
    const data = await response.json();
    console.log(data); // Process response
  } catch (error) {
    console.error('Error fetching likes/dislikes:', error);
  }
};
