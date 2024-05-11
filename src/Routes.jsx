import { useEffect, useState, useRef } from 'react'
import { Navigation, X, Repeat } from 'react-feather'
import { roundTo } from './utils'
import { motion, AnimatePresence } from 'framer-motion'
import useMappicsStore from './MappicsStore'
import classNames from 'classnames'

const distance = (a, b) => roundTo(Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2));
	
const pointExists = (list, x, y, layer) => {
	for (let i = 0; i < list.length; i++) {
		if ((list[i].x === x) && (list[i].y === y) && (list[i].layer === layer)) return list[i];
	}
	return null;
}

const addPoint = (graph, x, y, layer, endpoint, connect) => {
	let point = pointExists(graph, x, y, layer);
	if (!point) {
		graph.push({x, y, layer, n: []})
		point = graph[graph.length - 1];
		if (endpoint) point.end = endpoint;
		if (connect) point.connect = connect;
	}
	return point;
}

const linkPoint = (a, b, dist = 1, iac) => {
	if (!pointExists(a.n, b.x, b.y)) {
		const link = { to: b, dist: dist };
		if (iac) link.iac = true; // inaccessible

		a.n.push(link);
	}
}

const buildGraph = (routes) => {
	const graph = [];

	routes?.forEach(el => {
		const points = el?.points.split(' ');
		const list = [];

		for (let i = 0; i < points.length; i++) {
			const [x, y] = points[i].split(',');
			const p = addPoint(graph, x, y, el.layer, el.endpoint, el.connect);

			if (i > 0) {
				let dist = distance(p, list[list.length - 1]) * (parseFloat(el.weight) || 1);

				linkPoint(p, list[list.length - 1], dist, el.inaccessible);
				linkPoint(list[list.length - 1], p, dist, el.inaccessible);

				if (el.element === 'polygon') {
					for (let j = list.length - 2; j >= 0; j--) {
						dist = distance(p, list[j]);
						linkPoint(p, list[j], dist, el.inaccessible);
						linkPoint(list[j], p, dist, el.inaccessible);
					}
				}
			}
			list.push(p);
		}
	});

	// connect layers
	for (let i = 0; i < graph.length; i++) {
		if (graph[i].connect && graph[i].end && graph[i].n.length < 2) {
			for (var j = i + 1; j < graph.length; j++) {
				if (graph[j].connect && graph[j].end && graph[j].n.length < 2 && graph[i].end === graph[j].end) {
					linkPoint(graph[i], graph[j], 1);
					linkPoint(graph[j], graph[i], 1);
				}
			}
		}
	}

	return graph;
}

const getEndpoints = (graph, id) => {
	const p = [];
	for (let i = 0; i < graph.length; i++) if (graph[i].end === id && graph[i].n.length < 2) p.push(i);
	if (p.length < 1) console.error('There is no path to ' + id);
	return p;
}

const shortestPath = (graph, a, b, accessible = false) => {
	for (let i = 0; i < graph.length; i++) {
		graph[i].dist = Number.POSITIVE_INFINITY;
		graph[i].prev = undefined;
	}

	// dijkstra
	for (let i = 0; i < a.length; i++) graph[a[i]].dist = 0;
	let q = graph.slice();

	while (q.length > 0) {
		let min = Number.POSITIVE_INFINITY,
			u = 0;
		for (let i = 0; i < q.length; i++) {
			if (q[i].dist < min) {
				u = i;
				min = q[i].dist;
			}
		}
		let p = q[u];
		q.splice(u, 1);
		for (let i = 0; i < p.n.length; i++) {
			if (!accessible || !p.n[i].iac) {
				let alt = p.dist + p.n[i].dist;
				if (alt < p.n[i].to.dist) {
					p.n[i].to.dist = alt;
					p.n[i].to.prev = p;
				}
			}
		}
	}

	let min = Number.POSITIVE_INFINITY,
		target = null,
		path = [];

	for (let i = 0; i < b.length; i++) {
		if (graph[b[i]].dist < min) {
			target = graph[b[i]];
			min = target.dist;
		}
	}
	path.push(target);

	if (!target) return false;

	while (target.prev !== undefined) {
		target = target.prev;
		path.unshift(target);
	}
	return path;
}

const fragmentPath = (path) => {
	return path.reduce((acc, current) => {
		const last = acc[acc.length - 1];

		if (last && last.length > 0 && last[0].layer === current.layer) last.push(current);
		else acc.push([current]);

		return acc;
	}, []);
}

export const useRoutes = () => {
	const wayfinding = useMappicsStore(state => state.data?.settings?.wayfinding);
	const routes = useMappicsStore(state => state.data.routes);
	const setRouteGraph = useMappicsStore(state => state.setRouteGraph);

	useEffect(() => {
		if (wayfinding) setRouteGraph(buildGraph(routes));
	}, [routes, setRouteGraph, wayfinding]);
}

export const AnimatedRoute = ({layer}) => {
	const paths = useMappicsStore(state => state.paths);
	const settings = useMappicsStore(state => state.data.settings);
	const color = useMappicsStore(state => state.data.settings.wayfindingLineColor);
	const lineWidth = useMappicsStore(state => state.data.settings.wayfindingLineWidth) || 3;

	const lastPoint = paths?.[paths.length - 1]?.slice(-1)?.[0];

	if (paths.length < 1) return null;
	return (
		<svg 
			viewBox={`0 0 ${settings.mapWidth} ${settings.mapHeight}`}
			style={{cursor: 'crosshair', pointerEvents: 'none', position: 'absolute', top: 0, left: 0}}
		>
			{ paths.map((path, i) => {
				if (path[0].layer !== layer) return null;
				return <RoundedRoute key={i} i={i} path={path} dist={roundTo(path[path.length-1].dist - path[0].dist, 2)} />
			})}
			
			{ lastPoint.layer === layer && (
				<g>
					<circle cx={lastPoint.x} cy={lastPoint.y} fill="none" r={lineWidth} stroke={color} strokeWidth="1">
						<animate attributeName="r" from={lineWidth} to={lineWidth*2} dur="1.5s" begin="0s" repeatCount="indefinite"/>
						<animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite"/>
					</circle>
					<circle cx={lastPoint.x} cy={lastPoint.y} fill={color} r={lineWidth}/>
				</g>
			)	}
		</svg>
	)
}

const RoundedRoute = ({path, dist, i}) => {
	const color = useMappicsStore(state => state.data.settings.wayfindingLineColor);
	const smoothing = useMappicsStore(state => state.data.settings.wayfindingSmoothing);
	const lineWidth = useMappicsStore(state => state.data.settings.wayfindingLineWidth) || 3;
	const settings = useMappicsStore(state => state.data.settings);
	const setTarget = useMappicsStore(state => state.setTarget);
	const setOffset = useMappicsStore(state => state.setOffset);
	const animatedPath = useMappicsStore(state => state.animatedPath);
	const setAnimatedPath = useMappicsStore(state => state.setAnimatedPath);

	const lineRef = useRef(null);

	const [animating, setAnimating] = useState(false);

	useEffect(() => {
		if (i === animatedPath) {
		const startAnimation = () => {
			setAnimating(true);
			setTimeout(() => {
				setAnimatedPath(animatedPath + 1);
			}, (settings.wayfindingSpeed || 2) * 1000 + 400);
		}

		const bbox = lineRef.current.getBBox();
		setAnimating(false);
		const padding = 40;
		const pos = {
			x: roundTo((bbox.x + bbox.width/2) / settings.mapWidth, 4),
			y: roundTo((bbox.y + bbox.height/2) / settings.mapHeight, 4),
			scale: roundTo(Math.min(settings.mapWidth / (bbox.width + padding), settings.mapHeight / (bbox.height + padding)), 4)
		}
		setOffset({h: 0});
		setTarget(pos);
		const animation = setTimeout(startAnimation, 200);
		
		return () => clearTimeout(animation);
		}

	}, [dist, path, setOffset, setTarget, settings, i, animatedPath, setAnimatedPath]);

	const linePoint = (a, b, smoothing) => {
		const xlen = parseFloat(b.x) - parseFloat(a.x),
			ylen = parseFloat(b.y) - parseFloat(a.y),
			len = Math.abs(a.dist-b.dist),
			size = Math.min(smoothing, len/2),
			r = size / len;
	
		return {
			x: parseFloat(a.x) + xlen * r,
			y: parseFloat(a.y) + ylen * r
		}
	}

	const roundedPath = (list) => {
		let d = 'M ' + list[0].x + ',' + list[0].y;
	
		for (let i = 0; i < list.length; i++) {
			if (smoothing && (i>0 && i<list.length-1)) {
				const p1 = linePoint(list[i], list[i-1], smoothing);
				d += ' L' + p1.x + ',' + p1.y;
				d += ' Q' + list[i].x + ',' + list[i].y;
				const p2 = linePoint(list[i], list[i+1], smoothing);
				d += ' ' + p2.x + ',' + p2.y;
			}
			else d += ' L' + list[i].x + ',' + list[i].y;
		}
	
		return d;
	}

	return (
		<g>
			<path
				className="mappics-routes-line"
				ref={lineRef}
				stroke={color}
				strokeOpacity={0.3}
				strokeWidth={lineWidth}
				strokeLinecap="round"
				fill="none"
				d={roundedPath(path)}
				style={{
					strokeDasharray: i >= animatedPath ? dist + ' ' + dist : 0,
					strokeDashoffset: animating ? 0 : dist,
					transitionDelay: '0.4s',
					transitionTimingFunction: 'ease-in-out',
					transitionDuration: `${settings.wayfindingSpeed || 2}s`,//`${dist/100}s`,
					transitionProperty: animating ? 'stroke-dashoffset' : 'none'
				}}
			/>
			<path
				className="mappics-routes-dashed"
				stroke={color}
				strokeOpacity={1.0}
				strokeWidth={lineWidth/2}
				strokeDasharray={`${lineWidth} ${lineWidth*1.5}`}
				strokeLinecap="round"
				fill="none"
				d={roundedPath(path)}
			/>
		</g>
	)
}

export const RouteButton = ({id}) => {
	const setAny = useMappicsStore(state => state.setAny);
	const hasRoute = useMappicsStore(state => state.hasRoute);
	const routeGraph = useMappicsStore(state => state.routeGraph);
	const fixedFrom = useMappicsStore(state => state.data.settings.wayfindingFixedFrom);

	const [active, setActive] = useState(false);

	useEffect(() => {
		setActive(hasRoute(id) && id !== fixedFrom);
	}, [id, hasRoute, routeGraph, fixedFrom]);

	if (!active) return null;
	return (
		<button
			onClick={() => {
				setAny(id);
			}}
			className="mappics-button mappics-button-icon"
		>
			<Navigation size={16} />
		</button>
	)
}

export const RoutesPanel = () => {
	const location = useMappicsStore(state => state.location);
	const getLocationById = useMappicsStore(state => state.getLocationById);
	const from = useMappicsStore(state => state.from);
	const setFrom = useMappicsStore(state => state.setFrom);
	const to = useMappicsStore(state => state.to);
	const setTo = useMappicsStore(state => state.setTo);
	const routeGraph = useMappicsStore(state => state.routeGraph);
	const setPaths = useMappicsStore(state => state.setPaths);
	const routesOpened = useMappicsStore(state => state.routesOpened);
	const setRoutesOpened = useMappicsStore(state => state.setRoutesOpened);
	const routesAccessible = useMappicsStore(state => state.routesAccessible);
	const hasRoute = useMappicsStore(state => state.hasRoute);
	const settings = useMappicsStore(state => state.data.settings);
	const closeLocation = useMappicsStore(state => state.closeLocation);
	const switchLayer = useMappicsStore(state => state.switchLayer);
	const setAnimatedPath = useMappicsStore(state => state.setAnimatedPath);

	const [selected, setSelected] = useState(false);

	// calculate path
	useEffect(() => {
		if (from && to) {
			setSelected(false);
			const a = getEndpoints(routeGraph, from);
			const b = getEndpoints(routeGraph, to);
		
			const path = shortestPath(routeGraph, a, b, routesAccessible);
			if (path[0]?.layer) switchLayer(path[0].layer);
			closeLocation();
			let fragmented;
			
			if (path) fragmented = fragmentPath(path);
			if (fragmented) setPaths(fragmented);
			setAnimatedPath(0);
		}
		else setPaths([]);
	}, [routeGraph, from, to, setPaths, routesAccessible, closeLocation, switchLayer, setAnimatedPath]);

	// location select
	useEffect(() => {
		if (settings.wayfindingFixedFrom) setFrom(settings.wayfindingFixedFrom);

		if (selected && location && hasRoute(location)) {
			if (selected === 'from') {
				setFrom(location);
				if (!to) setSelected('to');
			}
			else if (selected === 'to') {
				setTo(location);
				if (!from) setSelected('from');
			}
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location])

	const handleClose = () => {
		setRoutesOpened(false);
		if (!settings.wayfindingFixedFrom) setFrom(null);
		setTo(null);
		setSelected(false);
	}

	const handleSwap = () => {
		const temp = from;
		setFrom(to);
		setTo(temp);
	}

	const handleOpen = () => {
		setRoutesOpened(true);
		setSelected('from');
	}

	return (
		<motion.div layout className={classNames('mappics-wayfinding', {'mappics-active': routesOpened})}>
			<AnimatePresence>
				{ routesOpened ?
					<div className="mappics-wayfinding-content">
						<div className="mappics-wayfinding-body">
							<div className="mappics-wayfinding-dots">
								<div></div>
								<div></div>
								<div></div>
							</div>
							<div className="mappics-wayfinding-positions">
								<Position type="from" location={getLocationById(from)} selected={selected} setSelected={setSelected} fixed={settings.wayfindingFixedFrom} />
								<Position type="to" location={getLocationById(to)} selected={selected} setSelected={setSelected} />
							</div>
							{ to && from && !settings.wayfindingFixedFrom && <button className="mappics-wayfinding-swap" onClick={handleSwap}><Repeat size={16} /></button> }
						</div>
						<div className="mappics-wayfinding-bar">
							<button className="mappics-button mappics-button-icon" onClick={handleClose}><X size={16} /></button>
							<div className="mappics-wayfinding-bar-main">
								<AccessibilityButton />
								<button
									className="mappics-button mappics-button-primary"
									disabled={!to || !from}
									onClick={() => setAnimatedPath(0)}
									style={{paddingRight: 8}}
								>
									Go
									<Navigation size={16} opacity={0.5} />
								</button>
							</div>
						</div>
					</div>
					: <button className="mappics-control-button" onClick={handleOpen}><Navigation size={16} /></button>
				}
			</AnimatePresence>
		</motion.div>
	)
}

const AccessibilityButton = () => {
	const routesAccessible = useMappicsStore(state => state.routesAccessible);
	const setRoutesAccessible = useMappicsStore(state => state.setRoutesAccessible);

	return (
		<button
			className={classNames('mappics-button', {'mappics-active': routesAccessible})} 
			onClick={() => setRoutesAccessible(!routesAccessible)}
			style={{padding: 8}}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M11.0933 11.8933C10.7667 11.7533 10.3933 11.9 10.2533 12.2266C9.59333 13.74 8.1 14.72 6.44 14.72C4.14667 14.72 2.28 12.8533 2.28 10.56C2.28 9.07331 3.08 7.69331 4.37333 6.95331C4.68 6.77998 4.78667 6.38664 4.61333 6.07998C4.43333 5.77331 4.04 5.66665 3.73333 5.84665C2.04667 6.80665 1 8.61331 1 10.56C1 13.56 3.44 16 6.44 16C8.60667 16 10.5667 14.72 11.4267 12.7333C11.5667 12.4133 11.4133 12.0333 11.0933 11.8933Z" fill="#030712"/>
				<path d="M15.6733 12.56C15.54 12.2333 15.1733 12.0733 14.84 12.2L13.88 12.5867L12.4867 8.12667C12.4 7.86 12.1533 7.68 11.8733 7.68H7.3L7.1 6.4H9.62667C9.98 6.4 10.2667 6.11333 10.2667 5.76C10.2667 5.40667 9.98 5.12 9.62667 5.12H6.91333L6.58 2.98667C7.06667 2.71333 7.4 2.19333 7.4 1.6C7.4 0.72 6.68 0 5.8 0C4.92 0 4.2 0.72 4.2 1.6C4.2 2.30667 4.66667 2.90667 5.30667 3.11333L6.12667 8.42C6.17333 8.73333 6.44667 8.96 6.76 8.96H11.4067L12.8667 13.6333C12.92 13.8067 13.04 13.9467 13.2 14.02C13.2867 14.06 13.38 14.08 13.4733 14.08C13.5533 14.08 13.6333 14.0667 13.7133 14.0333L15.3133 13.3933C15.6467 13.2667 15.8067 12.8933 15.6733 12.56Z" fill="#030712"/>
			</svg>
		</button>
	)
}

const Position = ({type, location, selected, setSelected, fixed = false}) => {
	const handleClick = () => {
		if (type === selected) setSelected(null);
		else if (!fixed) setSelected(type);
	}

	return (
		<div className="mappics-wayfinding-position">
			<span className="mappics-wayfinding-pin" style={{backgroundColor: location?.id ? '#000' : 'transparent'}}></span>		
			<button
				style={{
					outlineColor: type === selected ? 'var(--primary)' : 'transparent',
					fontWeight: location?.id ? 'bold' : 'normal',
					backgroundColor: type === selected ? 'var(--neutral-100)' : 'transparent'
				}}
				onClick={handleClick}
			>
				{location?.title || location?.id || 'Select ' + type}
			</button>
		</div>
	)
}