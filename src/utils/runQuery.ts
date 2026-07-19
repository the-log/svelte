const { DEV } = import.meta.env;
import { notify } from '../utils/notify';

const prodURL = 'https://api.log.football/api/graphql';
const devURL = 'https://api.log.ddev.site/api/graphql';
const backendURL = DEV ? devURL : prodURL;

// notify() requires a DOM and hydrated Shoelace; failures to toast must not
// mask the underlying error, so they only log.
function notifyFailure(message: string) {
	try {
		notify({
			title: 'Error',
			message,
			variant: 'danger'
		});
	} catch (error) {
		console.error('Unable to display error notification', error);
	}
}

export default async function runQuery(query: string, variables = {}) {
	let json;

	try {
		const response = await fetch(backendURL, {
			method: 'POST',
			cache: 'no-cache',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({
				query,
				variables
			})
		});
		json = await response.json();
	} catch (error) {
		// Network failure or a non-JSON response (e.g. a proxy serving HTML).
		console.error(error);
		notifyFailure('The backend could not be reached. Please try again later.');
		return { data: null, errors: [{ message: 'The backend could not be reached.' }] };
	}

	if (json.errors) {
		console.error(json.errors);
		notifyFailure(json.errors[0]?.message || 'An unknown error occurred.');

		try {
			document.documentElement.dispatchEvent(
				new CustomEvent('graphqlerror', {
					bubbles: false,
					cancelable: false,
					composed: true,
					detail: json
				})
			);
		} catch (error) {
			console.error(error);
		}
	}

	return json;
}
