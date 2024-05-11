import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { roundTo, fileExtension } from './utils';
import { Vectors } from './Vectors';
import { AnimatedRoute } from './Routes';
import { Editor } from './controls/Editor';
import SVG from 'react-inlinesvg';
import DOMPurify from 'dompurify'; // Ensure DOMPurify is imported
import useMappicsStore from './MappicsStore';

export const Layers = ({ parentScale }) => {
	const data = useMappicsStore((state) => state.data);
	const setData = useMappicsStore((state) => state.setData);
	const settings = useMappicsStore((state) => state.data.settings);
	const layer = useMappicsStore((state) => state.layer);
	const layers = useMappicsStore((state) => state.data.layers);
	const setLatLonCache = useMappicsStore((state) => state.setLatLonCache);
	const routesEditing = useMappicsStore((state) => state.routesEditing);
	const selectedMap = useMappicsStore((state) => state.selectedMap); // Get selected map from store
	const [isLoading, setIsLoading] = useState(true); // New loading state
	const [viewBox, setViewBox] = useState(null);

	useEffect(() => {
		setLatLonCache();
	}, [settings?.geo, settings?.extent, settings.mapWidth, setLatLonCache]);

	useEffect(() => {
		if (selectedMap) {
			setIsLoading(false); // Set loading to false when selectedMap is loaded
		}
	}, [selectedMap]);

	const anim = {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { duration: 0.2 },
	};

	const getStyle = () => {
		if (settings.zoom) return {
			width: settings.mapWidth + 'px',
			height: settings.mapHeight + 'px'
		}
		else return {}
	}

	// This effect logs the selected map to the console for debugging purposes
	useEffect(() => {
	}, [selectedMap]);

	useEffect(() => {
		if (selectedMap) {
			// Initialize the viewBox to match the SVG dimensions
			setViewBox(`0 0 ${selectedMap.width} ${selectedMap.height}`);
		}
	}, [selectedMap]);

	return (
		<AnimatePresence mode="wait">
			{isLoading ? (
				<div>Loading map...</div> // Placeholder or loader while waiting for selectedMap
			) : selectedMap ? (
				<motion.div
					className="mappics-layer"
					key={selectedMap.map_id}
					style={getStyle()}
					{...anim}
				>
					<SvgLayer svgContent={selectedMap} viewBox={viewBox} />
				</motion.div>
			) : (
				layers.map((l) => ( // Fallback to previous behavior if no map is selected
					l.id === settings.layer && (
						<motion.div className="mappics-layer" key={l.id} style={getStyle()} {...anim}>
							{fileExtension(l.file) === 'svg' ? <SvgLayer layer={l} /> : <img src={l.file} alt={l.name} />}
							{Editor && (
								<Editor source={data?.routes || []} setSource={(val) => setData({ routes: val })} prefix="path_" parentScale={parentScale} active={routesEditing} />
							)}
							<Vectors source={data?.routes} parentScale={parentScale} active={routesEditing} />
							{settings.wayfinding && <AnimatedRoute layer={l.id} />}
						</motion.div>
					)
				))
			)}
		</AnimatePresence>
	);
}

const SvgLayer = ({ layer, svgContent, ...props }) => {
	const csv = useMappicsStore(state => state.csv);
	const search = useMappicsStore(state => state.search);
	const admin = useMappicsStore(state => state.admin);
	const filters = useMappicsStore(state => state.filters);
	const newLocation = useMappicsStore(state => state.newLocation);
	const dragging = useMappicsStore(state => state.dragging);
	const setEstPos = useMappicsStore(state => state.setEstPos);

	const displayList = useMappicsStore(state => state.displayList);
	const getFilterCount = useMappicsStore(state => state.getFilterCount);
	const getLocationById = useMappicsStore(state => state.getLocationById);
	const getSampledLocation = useMappicsStore(state => state.getSampledLocation);
	const settings = useMappicsStore(state => state.data.settings);
	const locations = useMappicsStore(state => state.data.locations);
	const layers = useMappicsStore(state => state.data.layers);

	const hovered = useMappicsStore(state => state.hovered);
	const setHovered = useMappicsStore(state => state.setHovered);
	const openLocation = useMappicsStore(state => state.openLocation);
	const location = useMappicsStore(state => state.location);
	const [sanitizedSvg, setSanitizedSvg] = useState(null);

	const ref = useRef(null);
	const svgRef = useRef(null);

	useEffect(() => {
		if (ref.current) {
			ref.current.querySelectorAll('.mappics-active').forEach(el => el.classList.remove('mappics-active'));
			if (location) ref.current.getElementById(location)?.classList.add('mappics-active');
		}
	}, [location]);

	useEffect(() => {
		if (ref.current) {
			ref.current.querySelectorAll('.mappics-highlight').forEach(el => el.classList.remove('mappics-highlight'));
			if (hovered) ref.current.getElementById(hovered)?.classList.add('mappics-highlight');
		}
	}, [hovered]);

	useEffect(() => {
		if (ref.current) {
			ref.current.querySelectorAll('.mappics-filtered').forEach(el => el.classList.remove('mappics-filtered'));
			highlightFiltered();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, filters, csv]);

	useEffect(() => {
		if (ref.current && admin) {
			ref.current.querySelectorAll('.mappics-new-location').forEach(el => el.classList.remove('mappics-new-location'));
			if (newLocation) ref.current.getElementById(newLocation)?.classList.add('mappics-new-location');
		}
	}, [admin, newLocation]);

	useEffect(() => {
		ref.current?.querySelectorAll('[id^=MLOC] > *').forEach(el => {
			settleLocation(el);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [locations, layers, csv]);

	const highlightFiltered = () => {
		if (search || getFilterCount() > 0) {
			displayList().forEach(l => {
				ref.current.getElementById(l.id)?.classList.add('mappics-filtered');
			});
		}
	}

	const estimatePositions = () => {
		let estimates = {}
		ref.current.querySelectorAll('[id^=MLOC] > *').forEach(el => {
			const bbox = el.getBBox();
			const title = el.getAttribute('data-name');

			const pos = {
				coord: [roundTo((bbox.x + bbox.width / 2) / settings.mapWidth, 4), roundTo((bbox.y + bbox.height / 2) / settings.mapHeight, 4)],
				zoom: roundTo(Math.min(settings.mapWidth / (bbox.width + 40), settings.mapHeight / (bbox.height + 40)), 4),
				layer: layer.id,
				...(title && { title: title })
			}
			estimates = { ...estimates, [el.id]: pos };

			settleLocation(el);
		});

		highlightFiltered();

		setEstPos(estimates);
	}

	const settleLocation = (el) => {
		el.setAttribute('class', layer.style || '');
		const loc = getLocationById(el.id);
		if (!loc.id) return;
		const sampled = getSampledLocation(loc);
		if (sampled.disable) return;
		if (sampled.color) el.setAttribute('fill', sampled.color);
		if (sampled.style) el.classList.add(sampled.style);
		if (location === el.id) el.classList.add('mappics-active');
	}

	useEffect(() => {
		if (svgContent && svgContent.svg && svgRef.current) {
			// Clear the current content of the svgRef.current
			while (svgRef.current.firstChild) {
				svgRef.current.removeChild(svgRef.current.firstChild);
			}

			// Parse the SVG content and append it to the svgRef.current
			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svgContent.svg, "image/svg+xml");
			const svgElement = svgDoc.documentElement;

			// Remove any existing event listeners on svgRef.current
			svgRef.current.removeEventListener('click', (e) => handleEvent(e, openLocation));
			svgRef.current.removeEventListener('mousemove', (e) => handleEvent(e, setHovered));
			svgRef.current.removeEventListener('touchstart', (e) => handleEvent(e, setHovered));
			svgRef.current.removeEventListener('mouseout', () => setHovered(false));
			svgRef.current.removeEventListener('touchend', () => setHovered(false));

			// Append the new SVG content
			svgRef.current.appendChild(svgElement);

			// Add event listeners to the new SVG element
			svgRef.current.addEventListener('click', (e) => handleEvent(e, openLocation));
			svgRef.current.addEventListener('mousemove', (e) => handleEvent(e, setHovered));
			svgRef.current.addEventListener('touchstart', (e) => handleEvent(e, setHovered));
			svgRef.current.addEventListener('mouseout', () => setHovered(false));
			svgRef.current.addEventListener('touchend', () => setHovered(false));
		}
	}, [svgContent, openLocation, setHovered]);


	const getId = (el) => el.closest('*[id^=MLOC] > *[id]')?.id;

	if (svgContent && svgContent.svg) {
		// Direct SVG content rendering with sanitized SVG content

		return (
			<svg ref={svgRef} {...props}></svg>
		);
	} else if (layer && layer.file) {
		// Rendering from SVG file using react-inlinesvg
		return (
			<SVG
				{...props}
				ref={ref}
				src={layer.file}
				onClick={(e) => {
					if (!dragging) openLocation(getId(e.target));
				}}
				onMouseMove={(e) => setHovered(getId(e.target))}
				onTouchStart={(e) => setHovered(getId(e.target))}
				onMouseOut={() => setHovered(false)}
				onTouchEnd={() => setHovered(false)}
				onLoad={() => estimatePositions && estimatePositions()}
			/>
		);
	} else {
		// Fallback or loading state if neither SVG content nor file path is provided
		return <div>Loading...</div>;
	}
}