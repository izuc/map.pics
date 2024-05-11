import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'react-feather'
import useMappicsStore from '../../../mappics/src/MappicsStore'

export const TooltipNewLocation = ({location, layer}) => {
	const data = useMappicsStore(state => state.data);
	const setData = useMappicsStore(state => state.setData);
	const openLocation = useMappicsStore(state => state.openLocation);
	const setNewLocation = useMappicsStore(state => state.setNewLocation);
	const ref = useRef(null);

	const closeTooltip = () => {
		setNewLocation(false);
	}

	const capitalize = (str) => str.replace(/-/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase());

	const addLocation = () => {
		setData({
			locations: [ { title: location.title || capitalize(location.id), ...location}, ...data.locations ]
		});
		setNewLocation(false);
		openLocation(location.id);
	}

	if (location.layer && location.layer !== layer) return null;
	if (!location.coord) return null;
	return (
		<motion.div
			className="mappics-tooltip"
			initial={{ scale: 0.4, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			exit={{ scale: 0.4, opacity: 0 }}
			transition={{ duration: 0.2 }}
			ref={ref}
			style={{
				maxWidth: '320px',
				maxHeight: '200px',
				top: `calc(${location.coord[1] * 100}% + ${0 - 16}px)`,
				left: (location.coord[0] * 100) + '%'
			}}
		>
			<div className="mappics-tooltip-content">
				<button className="mappics-tooltip-close" onClick={closeTooltip}><X size={12}/></button>
				<div className="mappics-tooltip-title">
					<h5>Add location</h5>
				</div>
				<div className="mappics-tooltip-footer">
					<button className="mappics-button-small" style={{backgroundColor: '#9747FF'}} onClick={addLocation}><Plus size={16}/></button>
					<code>{location.id}</code>
				</div>
			</div>
			<StripePattern />
		</motion.div>
	)
}

const StripePattern = () => {
	return (
		<svg width="100%" height="100%" style={{position:'absolute', pointerEvents: 'none'}}>
			<defs>
				<pattern id="mappics-stripe-pattern" patternTransform="rotate(135)" width="100%" height="2" x="0" y="0" patternUnits="userSpaceOnUse">
						<rect x="0" y="0" width="100%" height="1" fill="rgba(151, 71, 255, 0.2)"></rect>
						<rect x="0" y="1" width="100%" height="1" fill="#fafafa"></rect>
				</pattern>
			</defs>
		</svg>
	)
}