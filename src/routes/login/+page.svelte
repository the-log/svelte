<script lang="ts">
	import queries from "../../utils/queries";
	import runQuery from "../../utils/runQuery";
	import { goto } from "$app/navigation";
  import { notify } from "../../utils/notify";
	import { userStore, authStatusStore } from "../../misc/stores";

  let email: string, password: string;

  function attemptLogin(e: SubmitEvent) {

    runQuery(queries["begin-session"], {
      identity: email,
      secret: password
    }).then((item) => {
      const {
        authenticateUserWithPassword: response
      } = item.data;

      // Authentication Error
      if (response.message) {
        notify({
          title: 'Error',
          message: response.message,
          variant: 'danger',
        })
      }

      // Authentication Successful
      else if (response.item) {
        userStore.set({
          userID: response.item.id,
          userName: response.item.name,
          teamID: response.item.team?.id
        })
        authStatusStore.set(true);
        const {name} = response.item
        goto('/');
        notify({
          title: 'Login Successful',
          message: name ? `Welcome, ${name}` : 'Welcome!'
        })
      }
      // Something weird and unexpected
      else {
        notify({
          title: 'Error',
          message: 'An error has occurred. See the console for more details.'
        })
        console.error(item);
      }
    })
  }
</script>

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
<h1>Login</h1>

<form on:submit|preventDefault={attemptLogin}>
  <sl-input
    size="medium"
    type="email"
    placeholder="Email"
    autocomplete="email"
    on:sl-input={(e)=>{email = e.target.value}}
  ></sl-input>
  <sl-input
    size="medium"
    type="password"
    placeholder="Password"
    autocomplete="password"
    on:sl-input={(e)=>{password = e.target.value}}
  ></sl-input>
  <sl-button type="submit" variant="primary">Submit</sl-button>
</form>
