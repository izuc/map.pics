export const roundTo = (number, decimals = 2) => {
	const mult = Math.pow(10, decimals);
	return Math.round(number * mult) / mult;
}

export const fileExtension = (url) => {
	return url?.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();
}

export const replaceVars = (obj, field = 'desc') => {
	if (!obj || !obj[field]) return '';
	return obj[field].replace(/{{(\w+)}}/gi, (match, key) => obj[key.toLowerCase()]);
}