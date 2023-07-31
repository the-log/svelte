<script lang="ts">
	import queries from "src/utils/queries";
	import runQuery from "src/utils/runQuery";
  import { authStatusStore } from "src/misc/stores";
	import { goto } from "$app/navigation";

  let email: string, password: string;
  let userName = '';
  let isLoggedIn: boolean;


  function attemptLogin(e: SubmitEvent) {
    const messageSpan = (e.target as HTMLFormElement).querySelector('.error')!;
    messageSpan.textContent = "";

    runQuery(queries["begin-session"], {
      identity: email,
      secret: password
    }).then((item) => {
      const {
        authenticateUserWithPassword: response
      } = item.data;

      if (response.message) {
        messageSpan.textContent = response.message;
        console.error(response.message);
      } else if (response.item) {
        authStatusStore.set(true);
        goto('/');
      } else {
        messageSpan.textContent = 'An error has occurred.';
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
  <span class="error"></span>
  <button type="submit">Submit</button>
</form>
