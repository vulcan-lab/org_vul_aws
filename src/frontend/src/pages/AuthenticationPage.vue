<template>
  <authenticator :sign-up-attributes="['name','phone_number','email']" :form-fields="formFields" variation="modal"></authenticator>
</template>

<script setup>
  import { Authenticator} from "@aws-amplify/ui-vue";
  import { Hub } from '@aws-amplify/core'
  import { useRouter } from "vue-router";
  import "@aws-amplify/ui-vue/styles.css";
  import { getCurrentUser } from '@aws-amplify/auth';
  import { onMounted } from "vue";

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
    router.push("/flights");
  }else{
    console.log('user have not been signedIn successfully.');
  }
};

Hub.listen('auth', listener);

// Redirect to dashboard if already authenticated on component mount
onMounted(() => {
  getCurrentUser().then(user => {
    if (user) {
      router.push("/flights");
    }else{
      router.push('/login');
    }
  });
});

</script>