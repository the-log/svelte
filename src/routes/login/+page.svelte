<script lang="ts">
	import queries from "src/utils/queries";
	import runQuery from "src/utils/runQuery";
  import { userStore, teamStore } from "src/misc/stores";
	import { goto } from "$app/navigation";

  let email: string, password: string;

  function attemptLogin() {
    runQuery(queries["begin-session"], {
      identity: email,
      secret: password
    }).then(({data}) => {
      const {
        authenticateUserWithPassword: response
      } = data;

      if (response.message) {
        console.error(response.message);
      } else if (response.item) {
        userStore.set(response.item);
        goto('/');
      } else {
        console.error(response);
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
</style>
<h1>Login</h1>

<form on:submit|preventDefault={attemptLogin}>
  <input type="email" name="email" id="email" placeholder="email" bind:value={email} />
  <input type="password" name="password" id="password" placeholder="password" bind:value={password} />
  <button type="submit">Submit</button>
</form>
