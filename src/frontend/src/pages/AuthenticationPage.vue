<template>
  <authenticator :sign-up-attributes="['name','phone_number','email']" :form-fields="formFields" variation="modal"></authenticator>
</template>

<script setup>
  import { Authenticator} from "@aws-amplify/ui-vue";
  import { Hub } from '@aws-amplify/core'
  import { useRouter } from "vue-router";
  import { getCurrentUser } from '@aws-amplify/auth';
  import { onMounted } from "vue";

  import "@aws-amplify/ui-vue/styles.css";

  const router = useRouter();
  
  const formFields = {
    signUp: {
      name: {
        order:1
      },
    },
  }

  const listener = ({ payload }) => {
    if(payload.event == 'signedIn'){
      router.push({name: 'home'});
    }else{
      console.log('user have not been signedIn successfully.');
    }
  };

  Hub.listen('auth', listener);

  // Redirect to dashboard if already authenticated on component mount
  onMounted(() => {
    getCurrentUser().then(user => {
      if (user) {
        router.push({name: 'home'});
      }else{
        router.push({name: 'auth'});
      }
    });
  });

</script>