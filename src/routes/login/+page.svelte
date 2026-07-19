<script lang="ts">
	import { preventDefault } from 'svelte/legacy';

	import queries from '../../utils/queries';
	import runQuery from '../../utils/runQuery';
	import { goto } from '$app/navigation';
	import { notify } from '../../utils/notify';
	import { userStore, authStatusStore } from '../../misc/stores';

	let email: string = $state(),
		password: string = $state();

	function attemptLogin(e: SubmitEvent) {
		runQuery(queries['begin-session'], {
			identity: email,
			secret: password
		}).then((item) => {
			const { authenticateUserWithPassword: response } = item.data;

			// Authentication Error
			if (response.message) {
				notify({
					title: 'Error',
					message: response.message,
					variant: 'danger'
				});
			}

			// Authentication Successful
			else if (response.item) {
				userStore.set({
					isAdmin: response.item.isAdmin,
					userID: response.item.id,
					userName: response.item.name,
					teamID: response.item.team?.id
				});
				authStatusStore.set(true);
				const { name } = response.item;
				goto('/');
				notify({
					title: 'Login Successful',
					message: name ? `Welcome, ${name}` : 'Welcome!'
				});
			}
			// Something weird and unexpected
			else {
				notify({
					title: 'Error',
					message: `
          <sl-details summary="An error has occurred">
            ${item}
          </sl-details>
          `
				});
				console.error(item);
			}
		});
	}
</script>

<svelte:head>
	<title>Login — The League of Ordinary Gentlemen</title>
</svelte:head>

<h1>Login</h1>

<form onsubmit={preventDefault(attemptLogin)}>
	<sl-input
		size="medium"
		type="email"
		placeholder="Email"
		autocomplete="email"
		onsl-input={(e) => {
			email = e.target.value;
		}}
	></sl-input>
	<sl-input
		size="medium"
		type="password"
		placeholder="Password"
		autocomplete="current-password"
		onsl-input={(e) => {
			password = e.target.value;
		}}
	></sl-input>
	<a href="/reset">Forgot Password?</a>
	<sl-button type="submit" variant="primary">Submit</sl-button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: flex-start;
	}

	form sl-alert {
		/* display: block; */
		width: 100%;
		max-width: 20em;
	}
</style>
