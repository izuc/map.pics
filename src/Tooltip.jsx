import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Popup } from './Popup'
import { replaceVars } from './utils'
import useMappicsStore from './MappicsStore'
import classNames from 'classnames'

export const Tooltip = ({cond = true, location, hover = false, offset = 0, layer}) => {
	const ref = useRef(null);

	const hoverAbout = useMappicsStore(state => state.data.settings.hoverAbout);
	const setOffset = useMappicsStore(state => state.setOffset);

	useEffect(() => {
		if (cond && !hover) setOffset({h: ref.current?.offsetHeight - offset});

	}, [location.id]);
	
	if (!cond) return null;
	if (!location.id || !location.coord || location.disable || (location.layer && location.layer !== layer) || (hover && !location.title)) return null;
	if (!hover && location?.action === 'none') return null;

	return (
		<motion.div
			className={classNames('mappics-tooltip mappics-popup', {'mappics-tooltip-hover' : hover})}
			style={{
				maxWidth: '320px',
				maxHeight: '240px',
				top: `calc(${location.coord[1] * 100}% + ${offset - 16}px)`,
				left: `calc(${location.coord[0] * 100}% + ${offset + 20}px)`,
			}}
			initial={{ scale: 0.4, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			exit={{ scale: 0.4, opacity: 0 }}
			transition={{ duration: 0.2 }}
			onWheel={e => e.stopPropagation()}
			ref={ref}
		>
			{ !hover && location.action !== 'sidebar'
				? <Popup location={location} />
				: (
					<div className="mappics-popup-content mappics-popup-micro">
						<div className="mappics-popup-title">
							<h4>{location.title}</h4>
							{ hoverAbout && <h5 dangerouslySetInnerHTML={{__html: replaceVars(location, 'about')}}></h5> }
						</div>
					</div>
				)
			}
		</motion.div>
	)
}