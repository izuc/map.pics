import { useEffect, useMemo } from 'react'
import useMappicsStore from './MappicsStore';

export const Styles = ({element}) => {
	const settings = useMappicsStore(state => state.data.settings);
	const styles = useMappicsStore(state => state.data.styles);

	useEffect(() => {
		if (settings.primaryColor) element.current.style.setProperty('--primary', settings.primaryColor);
		else element.current.style.removeProperty('--primary');
	}, [element, settings.primaryColor]);

	const style = useMemo(() => {
		let css = '';

		const svgSelector = (c, state = '') => `.mappics-layer svg .${c}${state}, .mappics-layer svg .${c}${state} > *`;
		const markerSelector = (c, state = '') => `.mappics-overlay .mappics-marker.${c}${state}`;
		const rule = (prop, val) => val ? `${prop}:${val} !important;` : '';

		const svg = (s) => {
			if (!s.svg) return '';

			let css = `${svgSelector(s.class)} {${
				rule('fill', s['base-color']) +
				rule('stroke', s['base-stroke']) +
				rule('stroke-width', s['stroke-width'])
			}}`;

			css += `${svgSelector(s.class, '.mappics-highlight')} {${
				rule('fill', s['hover-color']) +
				rule('stroke', s['hover-stroke'])
			}}`;

			css += `${svgSelector(s.class, '.mappics-filtered')} {${
				rule('fill', s['hover-color']) +
				rule('stroke', s['hover-stroke'])
			}}`;

			css += `${svgSelector(s.class, '.mappics-active')} {${
				rule('fill', s['active-color']) +
				rule('stroke', s['active-stroke'])
			}}`;

			return css;
		}

		const marker = (s) => {
			if (!s.marker) return '';

			let css = `${markerSelector(s.class)} {${
				rule('background-color', s['base-color']) +
				rule('outline', `${s['stroke-width']}px solid ${s['base-stroke']}`) +
				rule('color', s['text-color'])
			}}`;

			css += `${markerSelector(s.class, '.mappics-highlight')} {${
				rule('background-color', s['hover-color']) +
				rule('border-color', s['hover-stroke'])
			}}`;

			css += `${markerSelector(s.class, '.mappics-active')} {${
				rule('background-color', s['active-color']) +
				rule('outline-color', s['active-stroke'])
			}}`;

			return css;
		}

		if (styles) {
			styles.forEach((s) => {
				css += svg(s) + marker(s);
			});
		}

		if (settings?.css) css += settings.css;

		if (css) return <style>{css}</style>
		else return null;
	}, [styles, settings.css]);

	return style;
}