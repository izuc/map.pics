import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Controls } from './Controls';
import { PanZoom } from './PanZoom';
import { Overlay } from './Overlay';
import { Layers } from './Layers';
import { useSize } from './hooks/useSize';
import useMappicsStore from './MappicsStore';
import { CameraProvider } from './CameraContext';

export const Container = ({ element }) => {
	const [aspectRatio, setAspectRatio] = useState(1.6);
	const settings = useMappicsStore(state => state.data.settings);
	const layers = useMappicsStore(state => state.data.layers);
	const breakpoint = useMappicsStore(state => state.breakpoint);
	const location = useMappicsStore(state => state.location);
	const sidebarClosed = useMappicsStore(state => state.sidebarClosed);
	const zoom = useMappicsStore(state => state.zoom);
	const container = useRef(null);
	const containerSize = useSize(container);

	useEffect(() => {
		if (settings?.mapWidth && settings?.mapHeight) {
			setAspectRatio(settings.mapWidth / settings.mapHeight);
		} else {
			setAspectRatio(1.6);
		}
	}, [settings.mapHeight, settings.mapWidth]);

	useEffect(() => {
		if (settings.padding) {
			element.current.style.setProperty('--container-padding', settings.padding + 'px');
		}
	}, [element, settings.padding]);

	useEffect(() => {
		if (breakpoint?.portrait && container.current.getBoundingClientRect().top < 0) {
			container.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [breakpoint?.portrait, location]);

	const getSidebarWidth = () => {
		if (breakpoint?.sidebar) return breakpoint?.sidebar + 'px';
		if (element.current) return getComputedStyle(element.current).getPropertyValue('--sidebar');
		return 0;
	};

	const getHeight = () => {
		if (settings?.kiosk && !breakpoint?.portrait) return '100vh';
		else if (breakpoint?.portrait) return '100%'; // Change this line
		else if (breakpoint?.container) return breakpoint.container + 'px';
		else return '100%'; // Change this line
	};

	return (
		<motion.div
			className="mappics-container"
			ref={container}
			initial={false}
			transition={{ duration: 0.4 }}
			style={{ height: getHeight() }}
		>
			{settings.zoom ? (
				<PanZoom
					container={container}
					containerSize={containerSize}
					aspectRatio={aspectRatio}
					zoom={zoom}
					breakpoint={breakpoint}
				/>
			) : (
				<>
					<motion.div className="mappics-layers">
						<Layers list={layers} />
						<Overlay aspectRatio={aspectRatio} width={settings?.mapWidth} />
					</motion.div>
				</>
			)}
			<CameraProvider>
				<Controls element={element} />
			</CameraProvider>
		</motion.div>
	);
};