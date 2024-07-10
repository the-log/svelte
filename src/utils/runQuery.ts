const { DEV } = import.meta.env;
import { notify } from "../utils/notify";

const prodURL = 'https://api.log.football/api/graphql';
const devURL = 'https://api.log.ddev.site/api/graphql';
const backendURL = DEV ? devURL : prodURL;

export default async function runQuery(query: string, variables = {}) {
  return fetch(backendURL, {
    method: 'POST',
    cache: 'no-cache',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    })
  })
  .then(r => r.json())
  .then(json => {
    if (json.errors) {
      notify({
        title: 'Error',
        message: "An error has occurred. See the console for more details.",
        variant: 'danger',
      });
      console.error(json.errors);

      document.documentElement.dispatchEvent(new CustomEvent('graphqlerror', {
        bubbles: false,
        cancelable: false,
        composed: true,
        detail: json
      }))
    }

    return json;
  })
}
