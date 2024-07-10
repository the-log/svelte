<script lang="ts">
	import queries from "../../utils/queries";
	import runQuery from "../../utils/runQuery";
	import { goto } from "$app/navigation";
  import { notify } from "../../utils/notify";
	import { userStore, authStatusStore } from "../../misc/stores";

  let email: string, token: string, password: string, passwordConf: string;
  let tokenRequested = false;
  let passwordsMatch = false;

  async function formSubmit(e: SubmitEvent) {
    if (!tokenRequested) {
      await sendResetToken(e);
    } else {
      await useResetToken(e);
    }
  }

  async function sendResetToken(e: SubmitEvent) {
    console.log(e);
    const form = e.target as HTMLFormElement;
    const emailField = form.querySelector('#email') as HTMLInputElement;
    const submitButton = form.querySelector('#submit') as HTMLButtonElement;

    emailField.disabled = true;
    submitButton.disabled = true;

    console.log(email);

    await runQuery(queries['request-token'], {email});

    tokenRequested = true;
    submitButton.disabled = false;
  }

  async function useResetToken(e: SubmitEvent) {

    if (!passwordsMatch) {
      notify({
        title: 'Error',
        message: "Passwords must match and be at least 8 characters.",
        variant: 'danger',
      })
      return;
    }

    console.log({email,token,password});

    const {data: {redeemUserPasswordResetToken}} = await runQuery(queries['reset-pass'], {
      email,
      token,
      password
    });

    if (!redeemUserPasswordResetToken) {
      goto('/login');
      notify({
        title: 'Password Reset',
        message: 'Your password has been updated. Please log in.'
      })
    } else {
      const {code, message} = redeemUserPasswordResetToken;

      if (code === "FAILURE") {
        notify({
          title: 'Error',
          message: message,
          variant: 'danger',
        })
      } else {
        goto('/reset');
        notify({
          title: 'Error',
          message: `${message} You will need to create a new one-time code.`,
          variant: 'danger',
        });
      }

    }
  }

  function confirmPass() {
    const isValid = document.querySelector('#newPass')!.hasAttribute('data-user-valid');
    passwordsMatch = (!!password && isValid && password === passwordConf);
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
<h1>Reset Password</h1>

<form on:submit|preventDefault={formSubmit}>
  <a href="/login">← Log In</a>
  {#if !tokenRequested}
  <span>Enter the email for the account you'd like to reset below.</span>
  {/if}
  <sl-input
    id="email"
    size="medium"
    type="email"
    placeholder="Email"
    autocomplete="email"
    on:sl-input={(e)=>{email = e.target.value}}
  ></sl-input>

  {#if tokenRequested}
    <span>If an account exists, a one-time code has been emailed to you.</span>
    <sl-input
      id="token"
      size="medium"
      type="text"
      placeholder="one-time code"
      on:sl-input={(e)=>{token = e.target.value}}
    ></sl-input>

    <sl-input
      id="newPass"
      size="medium"
      type="password"
      placeholder="new password"
      pattern="[^\s]{'{'}8,{'}'}"
      on:sl-input={(e)=>{password = e.target.value; confirmPass()}}
    >
      <span slot="help-text">Password must be at least 8 characters</span>
    </sl-input>

    <sl-input
      id="newPassConf"
      size="medium"
      type="password"
      placeholder="confirm new password"
      on:sl-input={(e)=>{passwordConf = e.target.value; confirmPass()}}
    ></sl-input>
  {/if}

  <sl-button id="submit" type="submit" variant="primary">{!tokenRequested ? 'Submit' : 'Reset Password'}</sl-button>
</form>
