import { motion } from 'framer-motion'
import { Sliders, Plus, X, Search, ArrowUpRight } from 'react-feather'
import classNames from 'classnames'
import useMappicsStore from './MappicsStore'

export const SearchFilter = ({value, anim}) => {
	const data = useMappicsStore(state => state.data);
	const filtersOpened = useMappicsStore(state => state.filtersOpened);

	const opened = () => (filtersOpened || data.settings.filtersAlwaysVisible) && data.filters?.length > 0;

	return (
		<div className={classNames('mappics-search-filter', {'opened': opened()})}>
			<SearchBar value={value} />
			{ opened() && <Filters anim={anim} /> }
		</div>
	)
}

export const SearchBar = ({value}) => {
	const settings = useMappicsStore(state => state.data.settings);
	const filters = useMappicsStore(state => state.data.filters);
	const toggleFilters = useMappicsStore(state => state.toggleFilters);
	const toggleSidebar = useMappicsStore(state => state.toggleSidebar);
	const setSearch = useMappicsStore(state => state.setSearch);
	const filtersOpened = useMappicsStore(state => state.filtersOpened);
	const getFilterCount = useMappicsStore(state => state.getFilterCount);

	return (
		<div className="mappics-search-bar">
			<label className="mappics-search">
				<Search size={16} />
				<input type="text" placeholder={settings.searchText || "Search"} spellCheck={false} onClick={() => toggleSidebar(true)} onInput={(e) => setSearch(e.target.value)} value={value}/>
				{ value && <button onClick={() => setSearch('')}><X size={12} /></button> }
			</label>
			<SingleSwitch value={!filtersOpened} active={filters?.length > 0 && !settings.filtersAlwaysVisible}>
				<button onClick={() => toggleFilters()}>
					<Sliders size={16}/>
					{ settings.accessibility && <span>Filter</span> }
					<Count nr={getFilterCount()} />
				</button>
			</SingleSwitch>
		</div>
	)
}

const SingleSwitch = ({children, value, active}) => {
	if (!active) return null;
	return (
		<div className="mappics-switch">
			{ value && <div className="mappics-switch-background"></div> }
			{ children }
		</div>
	)
}

const Count = ({nr}) => {
	if (nr < 1) return;
	return <small className="mappics-count">{nr}</small>
}

const Filters = ({anim}) => {
	const filters = useMappicsStore(state => state.data.filters);
	const search = useMappicsStore(state => state.search);
	const getFilterCount = useMappicsStore(state => state.getFilterCount);

	if (!filters) return null;
	return (
		<motion.div className="mappics-filters" key="filters" {...anim} style={{display: 'flex', flexDirection: 'column', overflowY: 'auto'}}>
			<div className="mappics-filters-body">
				{ filters.map((f) => <Filter key={f.id} f={f} />)}
			</div>

			<FiltersFooter shown={getFilterCount() > 0 || search } />
		</motion.div>
	)
}

const FiltersFooter = ({shown}) => {
	const displayList = useMappicsStore(state => state.displayList);
	const clearFilters = useMappicsStore(state => state.clearFilters);
	const toggleSidebar = useMappicsStore(state => state.toggleSidebar);
	const clearText = useMappicsStore(state => state.data.settings.clearText);

	if (!shown) return null;
	return (
		<div className="mappics-filters-footer">
			<button onClick={clearFilters}>
				<X size={12} />
				{clearText || 'Clear'}
			</button>
			<button onClick={toggleSidebar}>
				<b>{ displayList(false).length }</b> found
				<ArrowUpRight size={12} />
			</button>
		</div>
	)
}

const Filter = ({f}) => {
	const filters = useMappicsStore(state => state.filters);
	const setFilter = useMappicsStore(state => state.setFilter);
	const groups = useMappicsStore(state => state.data.groups);

	if (f.disable) return;
	
	switch (f.type) {
		case 'tags':
			return (
				<div className="mappics-tags">
					{ groups && groups.map(g => <Tag key={g.name} group={g} active={Array.isArray(filters.group) && filters.group.includes(g.name)} />) }
				</div>
			)
		case 'checkbox':
			return (
				<label className="mappics-toggle">
					<span>{f.name}</span>
					<div className="mappics-toggle-switch">
						<input type="checkbox" checked={filters[f.id] || false} onChange={() => setFilter(f.id, !filters[f.id])}/><span></span>
					</div>
				</label>
			)
		case 'dropdown':
			return (
				<label>
					<select className="mappics-dropdown" value={filters[f.id]} onChange={e => setFilter(f.id, e.target.value)}>
						{f.value?.split(';').map(v => {
							const pair = v.split(':');
							return <option key={v} value={pair[0]}>{pair[1]}</option>
						})}
					</select>
				</label>
			)
		default:
			return
	}
}

function Tag({group, active}) {
	const toggleGroup = useMappicsStore(state => state.toggleGroup);
	
	const style = {
		color: active ? '#fff' : group.color
	}
	
	if (active) {
		style.borderColor = group.color;
		style.backgroundColor = group.color;
	}
	
	if (group.hide) return false;
	return (
		<button className={classNames('mappics-tag', {'mappics-active': active})} style={style} onClick={() => toggleGroup(group, active)}>
			{ !active && <Plus size={12} /> }
			<span>{group.name}</span>
			{ active && <X size={12} /> }
		</button>
	)
}