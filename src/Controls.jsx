import React, { useState, useContext, useEffect, useRef } from 'react';
import { Fullscreen } from './Fullscreen';
import { ArrowLeft, Maximize, Plus, Minus, Camera } from 'react-feather';
import useMappicsStore from './MappicsStore';
import { RoutesPanel } from './Routes';
import { CameraContext } from './CameraContext';
import { fetchMapsList } from './API';
import { useQueryParamsState } from './hooks/useQueryParamsState';

export const Controls = (props) => {
  const [stream, setStream] = useState(null);
  const { showCameraFeed, handleCameraClick, closeCamera } = useContext(CameraContext);

  const settings = useMappicsStore((state) => state.data.settings);
  const toggleSidebar = useMappicsStore((state) => state.toggleSidebar);
  const sidebarClosed = useMappicsStore((state) => state.sidebarClosed);
  const breakpoint = useMappicsStore((state) => state.breakpoint);
  const fetchAndSetSelectedMap = useMappicsStore((state) => state.fetchAndSetSelectedMap);

  const setTarget = useMappicsStore((state) => state.setTarget);
  const setTransition = useMappicsStore((state) => state.setTransition);
  const closeLocation = useMappicsStore((state) => state.closeLocation);

  const [mapsList, setMapsList] = useState([]);
  const [selectedMap, setSelectedMap] = useQueryParamsState('map_id');

  useEffect(() => {
    const fetchMaps = async () => {
      const maps = await fetchMapsList();
      setMapsList(maps);

      if (maps.length > 0) {
        const mapToSelect = selectedMap || maps[0].map_id;
        fetchAndSetSelectedMap(mapToSelect);
      }
    };

    fetchMaps();
  }, []);

  const handleMapSelection = async (mapId) => {
	fetchAndSetSelectedMap(mapId);
	setSelectedMap(mapId);
  
	// Reset zoom and center the map
	setTransition({ duration: 0.4 });
	setTarget({ scale: 1, x: 0.5, y: 0.5 });
	closeLocation();
  };

  return (
    <div className="mappics-controls">
      {settings.sidebar && settings.toggleSidebar && (!sidebarClosed || !settings.filters) && (
        <button className="mappics-sidebar-close" onClick={() => toggleSidebar(false)}>
          <ArrowLeft size={16} />
        </button>
      )}
      <ControlZone position="top-right" {...props} style={{ top: '16px', right: '16px' }}>
        <div className="map-selection-container">
          <select
            id="map-selection"
            value={selectedMap}
            onChange={(e) => handleMapSelection(e.target.value)}
          >
            {mapsList.map((map) => (
              <option key={map.map_id} value={map.map_id}>
                {map.map}
              </option>
            ))}
          </select>
        </div>
        <LayerSwitcher />
        <ZoomButtons />
        <ResetButton accessibility={settings.accessibility} />
        <Fullscreen element={props.element} className="mappics-control-button" accessibility={settings.accessibility} />
        {!showCameraFeed && (
          <button className="mappics-control-button" onClick={handleCameraClick}>
            <Camera size={16} />
          </button>
        )}
      </ControlZone>
      {showCameraFeed && (
        <>
          <FullScreenCameraFeed />
          <button className="close-camera-button" onClick={closeCamera}>
            Close Camera
          </button>
        </>
      )}
    </div>
  );
};

const FullScreenCameraFeed = () => {
  const videoRef = useRef(null);
  const { stream } = useContext(CameraContext);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="fullscreen-camera-feed">
      <video ref={videoRef} autoPlay={true} style={{ width: '100%' }} />
    </div>
  );
};

const ControlZone = ({ position, children, style }) => {
  return (
    <div className={`mappics-control-zone mappics-${position}`} style={style}>
      {children}
    </div>
  );
};

const ResetButton = ({ accessibility }) => {
  const pos = useMappicsStore((state) => state.pos);
  const location = useMappicsStore((state) => state.location);
  const setTarget = useMappicsStore((state) => state.setTarget);
  const setTransition = useMappicsStore((state) => state.setTransition);
  const closeLocation = useMappicsStore((state) => state.closeLocation);

  const resetZoom = () => {
    setTransition({ duration: 0.4 });
    setTarget({ scale: 1 });
    closeLocation();
  };

  if (pos.scale <= 1 && !location) return null;

  return (
    <button className="mappics-control-button" onClick={resetZoom}>
      {accessibility && <span>Reset</span>}
      <Maximize size={16} />
    </button>
  );
};

const ZoomButtons = () => {
  const maxZoom = useMappicsStore((state) => state.data.settings.maxZoom);
  const pos = useMappicsStore((state) => state.pos);
  const setTarget = useMappicsStore((state) => state.setTarget);
  const setTransition = useMappicsStore((state) => state.setTransition);

  const setZoom = (scale) => {
    setTransition({ duration: 0.4 });
    setTarget({ scale: scale });
  };

  return (
    <div className="mappics-control-group">
      <button
        className="mappics-control-button"
        disabled={pos.scale >= maxZoom}
        onClick={() => setZoom(pos.scale * 1.6)}
      >
        <Plus size={16} />
      </button>
      <button
        className="mappics-control-button"
        disabled={pos.scale <= 1}
        onClick={() => setZoom(pos.scale / 1.6)}
      >
        <Minus size={16} />
      </button>
    </div>
  );
};

const LayerSwitcher = () => {
  const layers = useMappicsStore((state) => state.data.layers);
  const layer = useMappicsStore((state) => state.layer);
  const switchLayer = useMappicsStore((state) => state.switchLayer);
  useMappicsStore((state) => state.layer); // re-render

  if (layers.length <= 1) return null;

  return (
    <div className="mappics-layer-switcher">
      {layers.map((l) => (
        <button
          key={l.id}
          className={`${l.id === layer ? 'mappics-active' : ''}`}
          onClick={() => switchLayer(l.id)}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
};