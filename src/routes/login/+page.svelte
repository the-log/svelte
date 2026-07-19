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
			if (item.errors) return; // runQuery already notified the user

			const response = item.data?.authenticateUserWithPassword;

			// Authentication Error
			if (response?.message) {
				notify({
					title: 'Error',
					message: response.message,
					variant: 'danger'
				});
			}

			// Authentication Successful
			else if (response?.item) {
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
					message: 'An unexpected response was received from the server. Please try again.',
					variant: 'danger'
				});
				console.error(item);
			}
		});
	}
</script>

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
		autocomplete="password"
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
