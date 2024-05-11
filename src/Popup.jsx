import useMappicsStore from './MappicsStore';
import { X } from 'react-feather';

export const Popup = ({ location }) => {
  const closeLocation = useMappicsStore((state) => state.closeLocation);

  return (
    <div className="mappics-popup">
      {location.image && (
        <div className="mappics-popup-image">
          <img src={location.image} alt={location?.title} />
        </div>
      )}
      <div className="mappics-popup-content">
        <button className="mappics-popup-close" onClick={closeLocation}>
          <X size={12} />
        </button>
        {location.title && <h4 className="mappics-popup-title">{location.title}</h4>}
      </div>
    </div>
  );
};