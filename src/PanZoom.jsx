import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useDragControls } from 'framer-motion';
import { Overlay } from './Overlay';
import { Layers } from './Layers';
import { roundTo } from './utils';
import useMappicsStore from './MappicsStore';

export const PanZoom = ({ container, containerSize, aspectRatio, zoom }) => {
	const settings = useMappicsStore(state => state.data.settings);
	const pos = useMappicsStore(state => state.pos);
	const setPos = useMappicsStore(state => state.setPos);
	const target = useMappicsStore(state => state.target);
	const transition = useMappicsStore(state => state.transition);
	const setTransition = useMappicsStore(state => state.setTransition);
	const dragging = useMappicsStore(state => state.dragging);
	const setDragging = useMappicsStore(state => state.setDragging);
	const offset = useMappicsStore(state => state.offset);

	const [pinch, setPinch] = useState(null); // pinch state to hold initial values and distances
	const calculateDistance = (x1, y1, x2, y2) => {
		return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
	};

	const ref = useRef();

	const dragControls = useDragControls();

	const startDrag = (e) => { dragControls.start(e); };

	const [abs, setAbs] = useState({ scale: 1, x: 0, y: 0 }); // absolute position

	const updatePositionAndScale = (newScale, newX, newY) => {
		setTransition({ duration: 0.3, ease: 'easeOut' }); // Smooth transition
		setAbs({
			scale: newScale,
			x: newX,
			y: newY
		});
	};

	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const scale = useMotionValue(1);

	useEffect(() => {
		setRelPosition(zoom, pos.x, pos.y, { duration: 0 });
	}, [zoom]);

	useEffect(() => { // container resized
		setRelPosition(pos.scale, pos.x, pos.y, { duration: 0 });
	}, [containerSize]);

	useEffect(() => { // location focused
		const focusY = 0.5 + offset.h / containerSize?.height / 2;

		setRelPosition(target.scale, target.x, target.y, transition, focusY ? [0.5, focusY] : undefined);
	}, [target, offset.h]);

	const fitScale = useMemo(() => (
		roundTo(Math.min(containerSize?.height / settings.mapHeight, containerSize?.width / settings.mapWidth), 4)
	), [containerSize?.height, containerSize?.width, settings.mapHeight, settings.mapWidth]);

	const constrainScale = (scale = pos.scale) => roundTo(Math.max(Math.min(scale, settings.maxZoom), settings.minZoom || 1), 4);
	const constrains = (s = abs.scale) => {
		const paddingX = Math.max(s === fitScale ? 0 : containerSize?.width, (containerSize?.width - settings.mapWidth * s)) / 2;
		const paddingY = Math.max(s === fitScale ? 0 : containerSize?.height, (containerSize?.height - settings.mapHeight * s)) / 2;

		return {
			top: Math.round(containerSize?.height - settings.mapHeight * s - paddingY),
			bottom: Math.round(paddingY),
			left: Math.round(containerSize?.width - settings.mapWidth * s - paddingX),
			right: Math.round(paddingX)
		};
	};

	// convert absolute to relative
	const absToRel = (x = abs.x, y = abs.y, scale = abs.scale, focus = [0.5, 0.5]) => ({
		scale: scale / fitScale,
		x: (containerSize?.width * focus[0] - x) / (settings.mapWidth * scale),
		y: (containerSize?.height * focus[1] - y) / (settings.mapHeight * scale)
	});

	// convert relative to absolute
	const relToAbs = (x = pos.x, y = pos.y, scale = pos.scale, focus = [0.5, 0.5]) => ({
		scale: scale * fitScale,
		x: Math.round(containerSize?.width * focus[0] - x * settings.mapWidth * scale * fitScale),
		y: Math.round(containerSize?.height * focus[1] - y * settings.mapHeight * scale * fitScale)
	});

	// set relative position
	const setRelPosition = (newScale = pos.scale, newX = pos.x, newY = pos.y, t = { duration: 0.4 }, focus = [0.5, 0.5]) => {
		const a = relToAbs(newX, newY, constrainScale(newScale), focus);
		const c = constrains(a.scale);

		const newAbs = {
			scale: a.scale,
			x: Math.max(Math.min(a.x, c.right), c.left),
			y: Math.max(Math.min(a.y, c.bottom), c.top)
		};

		if (!newAbs.scale) return;

		setTransition(t);
		setAbs(newAbs);
		setPos(absToRel(newAbs.x, newAbs.y, newAbs.scale, focus));
	};

	const handleWheel = (e) => {
		const containerRect = container.current.getBoundingClientRect();
		const magnitude = 1.6;
		const newZoom = constrainScale((e.deltaY < 0) ? pos.scale * magnitude : pos.scale / magnitude);
		if (newZoom > settings.maxZoom) return;
		const focus = [
			(e.clientX - containerRect.x) / containerRect.width,
			(e.clientY - containerRect.y) / containerRect.height
		];
		const rel = absToRel(abs.x, abs.y, abs.scale, focus);
		setRelPosition(newZoom, rel.x, rel.y, { duration: 0.4 }, focus);
	};

	const pinchPoint = (e) => {
		const c = container.current.getBoundingClientRect();
		return {
			x: c.width - Math.abs(e.touches[0].clientX + e.touches[1].clientX) / 2,
			y: c.height - Math.abs(e.touches[0].clientY + e.touches[1].clientY) / 2,
			dist: Math.sqrt(Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2), Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2))
		}
	}

	const handleTouchStart = (e) => {
		if (e.touches.length === 2) {
			const p1 = e.touches[0];
			const p2 = e.touches[1];
			const dist = calculateDistance(p1.clientX, p1.clientY, p2.clientX, p2.clientY);
			setPinch({
				x: (p1.clientX + p2.clientX) / 2,
				y: (p1.clientY + p2.clientY) / 2,
				dist,
				scale: abs.scale
			});
		}
	};

	const handleTouchMove = (e) => {
		if (e.touches.length === 2 && pinch) {
			e.preventDefault(); // Prevent default behavior (scrolling, zooming)

			const p1 = e.touches[0];
			const p2 = e.touches[1];
			const newDist = calculateDistance(p1.clientX, p1.clientY, p2.clientX, p2.clientY);
			const scaleChange = newDist / pinch.dist; // How much the pinch has changed
			const newScale = constrainScale(pinch.scale * scaleChange);

			if (newScale > settings.maxZoom) return;

			const containerRect = container.current.getBoundingClientRect();
			const focusX = (pinch.x - containerRect.left) / containerRect.width;
			const focusY = (pinch.y - containerRect.top) / containerRect.height;

			const scaleDelta = newScale / abs.scale;
			let newX = focusX * containerRect.width - (focusX * containerRect.width - abs.x) * scaleDelta;
			let newY = focusY * containerRect.height - (focusY * containerRect.height - abs.y) * scaleDelta;

			// Apply constraints to keep the map within the visible area
			const constraints = constrains(newScale);
			newX = Math.max(Math.min(newX, constraints.right), constraints.left);
			newY = Math.max(Math.min(newY, constraints.bottom), constraints.top);

			updatePositionAndScale(newScale, newX, newY);
			setPinch({ ...pinch, x: (p1.clientX + p2.clientX) / 2, y: (p1.clientY + p2.clientY) / 2, dist: newDist, scale: newScale });
		}
	};

	const handleTouchEnd = (e) => {
		if (e.touches.length < 2) {
			setPinch(null);
		}
	};


	useEffect(() => {
		const element = ref.current;

		const hasParentWithClass = (element, className) =>
			!element || !element.parentElement
				? false
				: element.parentElement.classList.contains(className) || hasParentWithClass(element.parentElement, className);

		const handleWheel = (e) => {
			if (!hasParentWithClass(e.target, 'mappics-tooltip')) e.preventDefault();
		};

		if (element) {
			if (settings.mouseWheel !== false) element.addEventListener('wheel', handleWheel, { passive: false });
			else element.removeEventListener('wheel', handleWheel);

			return () => {
				element.removeEventListener('wheel', handleWheel);
			};
		}
	}, [ref, settings?.mouseWheel]);

	const doubleClick = (e) => {
		if (e.detail === 2) {
			const containerRect = container.current.getBoundingClientRect();
			const focus = [
				(e.clientX - containerRect.x) / containerRect.width,
				(e.clientY - containerRect.y) / containerRect.height
			];
			const rel = absToRel(abs.x, abs.y, abs.scale, focus);
			setRelPosition(constrainScale(pos.scale * 2), rel.x, rel.y, { duration: 0.4 }, focus);
		}
	};

	const updatePosState = () => {
		const newAbs = {
			...abs,
			x: x.get(),
			y: y.get()
		};
		setAbs(newAbs);
		setPos(absToRel(newAbs.x, newAbs.y, newAbs.scale));
	};

	const transformTemplate = ({ scale }) => `matrix(${scale}, 0, 0, ${scale}, 0, 0)`;

	return (
		<motion.div
			className="mappics-panzoom"
			drag
			dragControls={dragControls}
			dragListener={false}
			onWheel={settings?.mouseWheel === false ? undefined : handleWheel}
			onClick={doubleClick}
			ref={ref}
			style={{ x, y, cursor: dragging ? 'grabbing' : 'grab' }}
			animate={{ x: abs.x || 0, y: abs.y || 0 }}
			transition={transition}
			dragTransition={{ bounceStiffness: 100, bounceDamping: 20, timeConstant: 100, power: 0.2 }}
			dragElastic={0.3}
			dragConstraints={constrains()}
			onDragStart={() => setDragging(true)}
			onDragEnd={() => setTimeout(() => setDragging(false), 50)}
			onDragTransitionEnd={updatePosState}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			<motion.div
				className="mappics-layers"
				style={{ scale, aspectRatio: aspectRatio }}
				transformTemplate={transformTemplate}
				animate={{ scale: abs.scale || 1 }}
				transition={transition}
				onPointerDown={startDrag}
			>
				<Layers parentScale={abs.scale} />
			</motion.div>
			<Overlay width={settings.mapWidth * abs.scale} aspectRatio={aspectRatio} />
		</motion.div>
	);
};