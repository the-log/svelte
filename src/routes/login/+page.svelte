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
        console.log("Logged in as: ", response.item);

        userStore.set(response.item);
        teamStore.set(response.item.team.abbreviation);
        goto('/');
      } else {
        console.error(response);
      }
    })
  }
</script>

<h1>Login</h1>

<form on:submit|preventDefault={attemptLogin}>
  <input type="email" name="email" id="email" bind:value={email} />
  <input type="password" name="password" id="password" bind:value={password} />
  <input type="submit" value="submit" hidden>
</form>
