import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popup } from './Popup';
import { replaceVars } from './utils';
import classNames from 'classnames';
import useMappicsStore from './MappicsStore';

export const Directory = ({ element }) => {
	const [scrollPosition, setScrollPosition] = useState(0);
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const breakpoints = useMappicsStore((state) => state.data.breakpoint);
	const settings = useMappicsStore((state) => state.data.settings);
	const sidebarClosed = useMappicsStore((state) => state.sidebarClosed);
	const breakpoint = useMappicsStore((state) => state.breakpoint);
	const search = useMappicsStore((state) => state.search);
	const setSearch = useMappicsStore((state) => state.setSearch);
	const location = useMappicsStore((state) => state.location);
	const getSampledLocation = useMappicsStore((state) => state.getSampledLocation);
	const displayList = useMappicsStore((state) => state.displayList);
	useMappicsStore((state) => state.filters); // re-render

	const popupOpened = () => location && getSampledLocation().action === 'sidebar';

	const anim = {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { duration: 0.2 },
	};

	useEffect(() => {
		if (breakpoint?.sidebar) element.current.style.setProperty('--sidebar', breakpoint.sidebar + 'px');
	}, [element, breakpoints, breakpoint?.sidebar]);

	const handleSearchChange = (e) => {
		const searchValue = e.target.value;
		setSearch(searchValue);
		setIsSearchOpen(searchValue.trim() !== '');
	};

	const handleLocationClick = () => {
		setIsSearchOpen(false);
	};

	const filteredLocations = displayList(false);

	return (
		<div className="mappics-sidebar">
			<AnimatePresence mode="wait">
				{!popupOpened() ? (
					<>
						<div className={classNames('mappics-search-bar', { open: isSearchOpen })}>
							<label className="mappics-search">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="11" cy="11" r="8"></circle>
									<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
								</svg>
								<input type="text" placeholder="Search" spellCheck="false" value={search || ''} onChange={handleSearchChange} />
							</label>
						</div>
						{!sidebarClosed && (
							<motion.div className={classNames('mappics-dir', { 'search-open': isSearchOpen })} {...anim}>
								{isSearchOpen ? (
									<motion.div className="mappics-search-filter" {...anim}>
										<DirectoryItems locations={filteredLocations} onLocationClick={handleLocationClick} />
									</motion.div>
								) : (
									<DirectoryBody scrollPosition={scrollPosition} setScrollPosition={setScrollPosition} />
								)}
							</motion.div>
						)}
					</>
				) : (
					<motion.div className="mappics-sidebar-popup" {...anim}>
						<Popup location={getSampledLocation()} />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export const DirectoryBody = ({ scrollPosition, setScrollPosition = () => false }) => {
	const list = useRef(null);

	const displayList = useMappicsStore((state) => state.displayList);

	const handleScroll = () => {
		const position = list.current?.scrollTop;
		setScrollPosition(position);
	};

	useEffect(() => {
		if (list.current) {
			list.current.scrollTop = scrollPosition;
			list.current.addEventListener('scroll', handleScroll, { passive: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
		return () => {
			list.current?.removeEventListener('scroll', handleScroll);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [list.current]);

	return (
		<div className="mappics-dir" ref={list}>
			<DirectoryItems locations={displayList(false)} />
		</div>
	);
};

const DirectoryItems = ({ locations, onLocationClick }) => {
	const search = useMappicsStore((state) => state.search);
	const settings = useMappicsStore((state) => state.data.settings);
	const groups = useMappicsStore((state) => state.data.groups);
	const getFilterCount = useMappicsStore((state) => state.getFilterCount);
	const breakpoint = useMappicsStore((state) => state.breakpoint);
	const getSampledLocation = useMappicsStore((state) => state.getSampledLocation);

	const groupBy = (groups, condition) => {
		if (!groups || !condition) return {};

		const grouped = groups.reduce((result, g) => {
			result[g] = locations.filter((l) => condition(l, g));
			return result;
		}, {});

		return Object.entries(grouped);
	};

	if (locations.length < 1) return <i className="mappics-empty-message">No results found.</i>;
	if (!settings.groupBy || getFilterCount() > 0 || search)
		return (
			<ul
				className={classNames('mappics-dir-items', `mappics-${breakpoint?.type}-items`)}
				style={{ gridTemplateColumns: breakpoint?.column ? `repeat(${breakpoint.column}, 1fr)` : '100%' }}
			>
				{locations.map((l) => (
					<Item key={l.id} location={getSampledLocation(l)} onLocationClick={onLocationClick} />
				))}
			</ul>
		);
	else
		return groupBy(
			groups.map((g) => g.name), // groups
			(l, g) => l.group.includes(g) // condition
		).map(([group, items]) => <DirectoryGroup key={group} locations={items} group={group} onLocationClick={onLocationClick} />);
};

const DirectoryGroup = ({ locations, group = null, onLocationClick }) => {
	const breakpoint = useMappicsStore((state) => state.breakpoint);
	const getSampledLocation = useMappicsStore((state) => state.getSampledLocation);

	if (locations.length < 1) return null;
	return (
		<div className="mappics-dir-group">
			<DirectoryGroupTitle group={group} count={locations.length} />
			<ul
				className={classNames('mappics-dir-items', `mappics-${breakpoint?.type}-items`)}
				style={{ gridTemplateColumns: breakpoint?.column ? `repeat(${breakpoint.column}, 1fr)` : '100%' }}
			>
				{locations.map((l) => (
					<Item key={l.id} location={getSampledLocation(l)} onLocationClick={onLocationClick} />
				))}
			</ul>
		</div>
	);
};

const DirectoryGroupTitle = ({ group, count }) => {
	if (!group) return null;
	return (
		<div className="mappics-dir-group-title">
			<span>{group}</span>
			<div className="mappics-line"></div>
			<span>{count}</span>
		</div>
	);
};

const Item = ({ location, onLocationClick, ...attributes }) => {
	const hovered = useMappicsStore((state) => state.hovered);
	const setHovered = useMappicsStore((state) => state.setHovered);
	const loc = useMappicsStore((state) => state.location);
	const openLocation = useMappicsStore((state) => state.openLocation);
	const breakpoint = useMappicsStore((state) => state.breakpoint);
	const search = useMappicsStore((state) => state.search);
	const setSearch = useMappicsStore((state) => state.setSearch);

	const handleClick = (e) => {
		e.preventDefault();
		openLocation(location.id);
		setSearch('');
		onLocationClick();
	};

	const mark = (text) => text?.replace(new RegExp(search, 'gi'), (match) => `<mark>${match}</mark>`);

	return (
		<li>
			<a
				{...attributes}
				className={classNames('mappics-dir-item', `mappics-${breakpoint?.type}-item`, {
					'mappics-highlight': hovered === location.id,
					'mappics-active': loc === location.id,
				})}
				data-location={location.id}
				onClick={handleClick}
				onMouseEnter={() => setHovered(location.id)}
				onTouchStart={() => setHovered(location.id)}
				onMouseLeave={() => setHovered(false)}
				onTouchEnd={() => setHovered(false)}
			>
				<ItemBody location={location} mark={mark} type={breakpoint?.type} />
			</a>
		</li>
	);
};

const ItemBody = ({ location, mark, type = 'list' }) => {
	const settings = useMappicsStore((state) => state.data.settings);

	if (type === 'grid')
		return (
			<>
				{settings.thumbnails && <Thumbnail location={location} />}
				<div className="mappics-item-body">
					<h3 dangerouslySetInnerHTML={{ __html: mark(location.title) }}></h3>
					<h5 dangerouslySetInnerHTML={{ __html: replaceVars(location, 'about') }}></h5>
				</div>
			</>
		);

	return (
		<>
			{settings.thumbnails && <Thumbnail location={location} />}
			<div className="mappics-item-body">
				<h4 dangerouslySetInnerHTML={{ __html: mark(location.title) }}></h4>
				<h5 dangerouslySetInnerHTML={{ __html: replaceVars(location, 'about') }}></h5>
			</div>
		</>
	);
};

const Thumbnail = ({ location }) => {
	const thumbContent = () => {
		if (!location.image) return <span>{location.title?.charAt(0)}</span>;
		return <img src={location.image} alt={location.title} />;
	};

	return <div className="mappics-thumbnail">{thumbContent()}</div>;
};