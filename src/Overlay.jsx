import { useState, useRef } from 'react'
import { Tooltip } from './Tooltip'
import { Marker } from './Marker'
import { motion, AnimatePresence } from 'framer-motion'
import { LocationDrag } from './controls/LocationDrag'
import { TooltipNewLocation } from './controls/TooltipNewLocation'
import useMappicsStore from './MappicsStore'

export const Overlay = ({width, aspectRatio}) => {
	const settings = useMappicsStore(state => state.data.settings);
	const hovered = useMappicsStore(state => state.hovered);
	const transition = useMappicsStore(state => state.transition);
	const location = useMappicsStore(state => state.location);
	const layer = useMappicsStore(state => state.layer);
	const newLocation = useMappicsStore(state => state.newLocation);
	const estPos = useMappicsStore(state => state.estPos);
	const getLocationById = useMappicsStore(state => state.getLocationById);
	const getSampledLocation = useMappicsStore(state => state.getSampledLocation);
	const displayList = useMappicsStore(state => state.displayList);
	useMappicsStore(state => state.filters); // re-render

	const [offsets, setOffsets] = useState({});
	const [tempCoord, setTempCoord] = useState({});

	const ref = useRef(null);

	return (
		<motion.div className="mappics-overlay" ref={ref} style={{aspectRatio: aspectRatio}} animate={{width: width || 0}} transition={transition}>
			<AnimatePresence>
				{ displayList()?.map(l => (!l.layer || (l.layer === layer)) &&
					<Marker
						key={l.id}
						location={getSampledLocation(l)}
						setOffsets={setOffsets}
					/>
				)}
				
				{ LocationDrag && location && <LocationDrag location={getLocationById()} layer={layer} dragConstraints={ref} setTempCoord={setTempCoord} /> }
				{ TooltipNewLocation && newLocation && <TooltipNewLocation key="new" location={{id: newLocation, ...estPos[newLocation]}} layer={layer} /> }

				<Tooltip
					key="focused"
					cond={location}
					location={{...getSampledLocation(), ...tempCoord}}
					offset={offsets[location]}
					layer={layer}
				/>

				<Tooltip
					key="hovered"
					cond={settings.hoverTooltip && hovered && hovered !== location}	
					hover={true}
					location={getSampledLocation(getLocationById(hovered))}
					offset={offsets[hovered]}
					layer={layer}
				/>

			</AnimatePresence>
		</motion.div>
	)
}