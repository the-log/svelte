// const backendURL = 'https://api.log.football/api/graphql';
const backendURL = 'http://localhost:3000/api/graphql';

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
