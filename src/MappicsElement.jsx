import { useEffect, useRef, useState } from 'react'
import { Directory } from './Directory'
import { Container } from './Container'
import { Styles } from './Styles'
import { useSize } from './hooks/useSize'
import { Deeplinking } from './Deeplinking'
import { useRoutes } from './Routes'
import useMappicsStore from './MappicsStore'
import classNames from 'classnames'
import './mappics.css'

const MappicsElement = ({ ...props }) => {
	const element = useRef(null);
	const size = useSize(element);

	const loading = useMappicsStore(state => state.loading);
	const error = useMappicsStore(state => state.error);
	const settings = useMappicsStore(state => state.data.settings);
	const sidebarClosed = useMappicsStore(state => state.sidebarClosed);
	const breakpoint = useMappicsStore(state => state.breakpoint);
	const setZoom = useMappicsStore(state => state.setZoom);
	const breakpoints = useMappicsStore(state => state.data.breakpoints);
	const setBreakpoint = useMappicsStore(state => state.setBreakpoint);
	const deeplinking = useMappicsStore(state => state.data?.settings?.deeplinking);
	const dataLoaded = useMappicsStore(state => state.dataLoaded);
	const openLocation = useMappicsStore(state => state.openLocation);
	const setFixedFrom = useMappicsStore(state => state.setFixedFrom);
	const fetchData = useMappicsStore(state => state.fetchData);
	useMappicsStore(state => state.data); // re-render

	const [clicked, setClicked] = useState(false);

	useEffect(() => {
		if (breakpoint?.portrait) {
			setZoom(4);
		} else {
			setZoom(1);
		}
	}, [breakpoint, setZoom]);

	useEffect(() => {
		if (dataLoaded) return;

		const data = {
			"settings": {
				"title": "Mappics",
				"hoverTooltip": true,
				"deeplinking": true,
				"sidebar": true,
				"rightSidebar": false,
				"toggleSidebar": false,
				"thumbnails": true,
				"sidebarWidth": "300px",
				"sidebarClosed": true,
				"ordered": true,
				"orderBy": "title",
				"portrait": 1000,
				"minZoom": 1,
				"maxZoom": 6,
				"mapWidth": 989.8,
				"mapHeight": 622.95,
				"animations": false,
				"filters": true,
				"filtersOpened": true,
				"layer": "map",
				"location": null,
				"css": ".mappics-thumbnail > img {\\r\\n\\tfilter: grayscale(100%);\\r\\n\\topacity: 0.5;\\r\\n}\\r\\n\\r\\n.mappics-dir-item:hover .mappics-thumbnail img,\\r\\n.mappics-dir-item.mappics-active .mappics-thumbnail img {\\r\\n\\tfilter: grayscale(0%);\\r\\n\\topacity: 1;\\r\\n}\\r\\n\\r\\n.mappics-thumbnail > img {\\r\\n object-fit: contain;\\r\\n}\\r\\n\\r\\n.mappics-popup-image > img {\\r\\n object-fit: contain;\\r\\n padding: 8px;\\r\\n box-sizing: border-box;\\r\\n}",
				"primaryColor": "#1476FF",
				"fullscreen": "bottom-left",
				"layerSwitcher": "top-right",
				"resetButton": "bottom-right",
				"zoomButtons": "bottom-right",
				"zoom": true,
				"geo": true,
				"groupBy": true,
				"filtersAlwaysVisible": false,
				"csvEnabled": false,
				"moreText": "Visit",
				"mouseWheel": true,
				"wayfinding": false,
				"wayfindingSpeed": 3,
				"wayfindingAccessibility": false,
				"wayfindingControls": "top-left",
				"wayfindingSmoothing": 4,
				"wayfindingLineColor": "#e62051",
				"wayfindingOpened": false,
				"hoverAbout": false,
				"wayfindingFixedFrom": "",
			},
			"locations": [],
			"groups": [],
			"layers": [],
			"styles": [],
			"breakpoints": [
				{
					"name": "breakpoint",
					"portrait": true,
					"below": 1000
				},
				{
					"name": "all-screens",
					"below": 8000
				}
			],
			"filters": [],
			"routes": []
		};
		fetchData(data);
	}, [dataLoaded, fetchData]);

	useRoutes();

	// on load
	useEffect(() => {
		if (dataLoaded && props.location) setTimeout(() => openLocation(props.location), 600);
	}, [dataLoaded, openLocation, props.location]);

	// fixed from
	useEffect(() => {
		if (props.fixedfrom) setFixedFrom(props.fixedfrom);
	}, [dataLoaded, props.fixedfrom, setFixedFrom])

	// apply breakpoint
	useEffect(() => {
		const closestBreakpoint = breakpoints?.reduce(
			(max, curr) => size?.width <= curr.below && curr.below < max.below ? curr : max,
			{ below: 10000 }
		);
		setBreakpoint(closestBreakpoint);
	}, [size, breakpoints, setBreakpoint]);

	const getMaxHeight = () => {
		if (settings?.kiosk) return '90vh';
		else if (breakpoint?.portrait) return '90vh';
		else if (breakpoint?.element) return breakpoint.element + 'px';
		else return '90vh'; // Change this line
	};

	if (loading) return <div ref={element} className="mappics-placeholder"><div className="mappics-loader"></div></div>;
	if (error) return <div ref={element} className="mappics-placeholder"><i>{error}</i></div>;
	return (
		<div
			{...props}
			ref={element}
			style={{ height: '100vh' }} // Add this line
			className={classNames('mappics-element', breakpoint?.name, {
				'mappics-portrait': breakpoint?.portrait,
				'mappics-sidebar-right': settings.rightSidebar,
				'mappics-sidebar-closed': sidebarClosed && settings.toggleSidebar,
				'mappics-sidebar-toggle': settings.toggleSidebar
			})}
			onClick={() => {
				if (!clicked) {
					window.dataLayer = window.dataLayer || [];
					window.dataLayer.push({ 'event': 'mappicsUsed' });
					setClicked(true);
				}
			}}
		>
			<Deeplinking enabled={deeplinking}>
				<Styles element={element} />
				<Container element={element} />
				{settings.sidebar && <Directory element={element} />}
			</Deeplinking>
			{/* Add the link element */}
			<div className="created-by">
				Created by <a href="https://www.lance.name" target="_blank" rel="noopener noreferrer">Lance</a>
			</div>
		</div>
	)
}

export default MappicsElement