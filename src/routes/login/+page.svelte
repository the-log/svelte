<script lang="ts">
	import queries from "src/utils/queries";
	import runQuery from "src/utils/runQuery";
  import { authStatusStore } from "src/misc/stores";
	import { goto } from "$app/navigation";

  let email: string, password: string;
  let userName = '';
  let isLoggedIn: boolean;


  function attemptLogin(e: SubmitEvent) {
    console.log(e.target);

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
        // messageSpan.textContent = response.message;
        // console.error(response.message);
      } else if (response.item) {
        authStatusStore.set(true);
        goto('/');
      } else {
        // messageSpan.textContent = 'An error has occurred.';
        // console.error(response);
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
  <sl-input
    type="email"
    placeholder="Email"
    autocomplete="email"
    on:sl-input={(e)=>{email = e.target.value}}
  ></sl-input>
  <sl-input
    type="password"
    placeholder="Password"
    autocomplete="password"
    on:sl-input={(e)=>{password = e.target.value}}
  ></sl-input>
  <span class="error"></span>
  <sl-button type="submit" variant="primary">Submit</sl-button>

</form>
