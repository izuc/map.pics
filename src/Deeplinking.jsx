import { useEffect, useState } from 'react'
import { useQueryParamsState } from './hooks/useQueryParamsState'
import useMappicsStore from './MappicsStore'

export const Deeplinking = ({enabled, children}) => {
	const loading = useMappicsStore(state => state.loading);
	const location = useMappicsStore(state => state.location);
	const openLocation = useMappicsStore(state => state.openLocation);

	const [locationParam, setLocationParam] = useQueryParamsState('location');
	const [initial, setInitial] = useState(false);
	
	useEffect(() => {
		if (!enabled) return;
		if (!loading && !initial && locationParam) {
			setInitial(locationParam);
			setTimeout(() => openLocation(locationParam), 200);
		}

		if (initial && locationParam && locationParam !== initial) {
			setInitial(true);
			openLocation(locationParam);
		}
	}, [enabled, loading, initial, setInitial, locationParam, openLocation]);

	useEffect(() => {
		if (!enabled) return;
		if (location === null) setLocationParam('');
		if (location) setLocationParam(location);
	}, [enabled, location, setLocationParam]);

	return children;
}