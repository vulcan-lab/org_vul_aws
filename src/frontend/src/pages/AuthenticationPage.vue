<script setup>
  import { Authenticator } from "@aws-amplify/ui-vue";
  import "@aws-amplify/ui-vue/styles.css";
  import { useRouter } from "vue-router";

  const router = useRouter();

  const formFields = {
    signUp: {
      name: {
        order:1
      },
    },
  }

const navigateToFlights = () => {
  signOut();
  router.push('/flights');
};
</script>

<template>
  <authenticator :sign-up-attributes="['name','phone_number','email']" :form-fields="formFields" variation="modal">
    <template v-slot="{ user, signOut }">
      <h1>Hello {{ user.username }}!</h1>
      <button @click="signOut">Sign Out</button>
      <template v-if="user">
        <br>
        <button @click="navigateToFlights">Flights</button>
      </template>
    </template>
  </authenticator>
</template>