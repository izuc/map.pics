import React, { useState, createContext, useCallback, useEffect } from 'react';
import Camera from 'react-html5-camera-photo';
import 'react-html5-camera-photo/build/css/index.css';

import { postPicture } from './API'; // Adjust the import path as necessary
import useMappicsStore from './MappicsStore'; // Adjust the import path as necessary

export const CameraContext = createContext();

export const CameraProvider = ({ children }) => {
    const [showCameraFeed, setShowCameraFeed] = useState(false);
    const [dataUri, setDataUri] = useState('');
    const [photoDescription, setPhotoDescription] = useState('');
    const fetchAndSetPicsByMapId = useMappicsStore(state => state.fetchAndSetPicsByMapId);
    const selectedMap = useMappicsStore(state => state.selectedMap);

    const handleCameraClick = useCallback(() => {
        setShowCameraFeed(true);
    }, []);

    const getLocation = async () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const location = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        resolve(location);
                    },
                    error => {
                        reject(error);
                    }
                );
            } else {
                reject(new Error('Geolocation is not supported by this browser.'));
            }
        });
    };

    const closeCamera = useCallback(() => {
        setShowCameraFeed(false);
        setDataUri('');
    }, []);

    // Add or remove the 'no-scroll' class from body when showCameraFeed changes
    useEffect(() => {
        if (showCameraFeed) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }

        // Cleanup function to ensure the class is removed when the component unmounts
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, [showCameraFeed]);

    const handleTakePhotoAnimationDone = async (dataUri) => {
        console.log('Photo taken');
        setDataUri(dataUri);

        const location = await getLocation().catch(error => {
            console.error("Error getting location:", error);
            return null; // Handle location error appropriately
        });
        if (!location) return;

        // Convert Data URI to File object as in the original takePhoto function
        const byteString = atob(dataUri.split(',')[1]);
        const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const file = new Blob([ab], { type: mimeString });

        const photoData = new FormData();
        photoData.append('image', file);
        photoData.append('lat', location.lat.toString());
        photoData.append('lon', location.lon.toString());
        photoData.append('pic', photoDescription);
        photoData.append('user_id', '1'); // Adjust as necessary
        photoData.append('map_id', selectedMap.map_id.toString()); // Adjust as necessary

        postPicture(photoData).then(async () => { // Make this callback async
            console.log("Picture posted successfully");
            closeCamera();

            if (selectedMap && selectedMap.map_id) {
                await fetchAndSetPicsByMapId(selectedMap.map_id);
            }
        }).catch(error => {
            console.error("Error posting picture:", error);
        });
    };

    return (
        <CameraContext.Provider value={{ handleTakePhotoAnimationDone, setPhotoDescription, showCameraFeed, closeCamera, handleCameraClick }}>
            {children}
            {showCameraFeed && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 2000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                    }}
                >
                    {dataUri ? (
                        <div>
                            <img src={dataUri} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button onClick={() => setDataUri('')}>Retake Photo</button>
                        </div>
                    ) : (
                        <Camera
                            onTakePhotoAnimationDone={handleTakePhotoAnimationDone}
                            isFullscreen={true}
                            idealFacingMode="environment"
                            isMaxResolution={true}
                            sizeFactor={1}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    )}
                    <div style={{ position: 'absolute', bottom: 200, left: 0, right: 0, textAlign: 'center', zIndex: 1000 }}>
                        <input
                            type="text"
                            placeholder="Add a description..."
                            value={photoDescription}
                            onChange={(e) => setPhotoDescription(e.target.value)}
                            style={{ marginBottom: '10px', padding: 25, width: '75%', maxWidth: 500, fontSize: '1.5rem', opacity: 0.8, height: 'auto', minHeight: 100, borderRadius: 10 }}
                        />
                    </div>
                </div>
            )}
        </CameraContext.Provider>
    );

};

export default CameraProvider;
