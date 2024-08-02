<template>
  <q-layout>
    <q-header>
      <q-toolbar class="text-center" color="primary">
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
        >
          <q-icon name="menu" />
        </q-btn>

        <q-toolbar-title class="brand">Flight App</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          size="lg"
          icon="search"
          :to="{ name: 'home' }"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      :content-class="$q.theme === 'mat' ? 'bg-grey-2' : null"
    >
      <q-list no-border link inset-delimiter>
        <q-item clickable v-ripple  
        :to="{ name: 'home' }"
        :class="{'q-item--active': isActive('home')}"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="home" size="2.5em" />
          </q-item-section>
          <q-item-section>
            <q-item-section>Home</q-item-section>
            <q-item-label caption>home</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple
        :to="{ name: 'profile' }"
        :class="{'q-item--active': isActive('profile')}"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="person" size="2.5em" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Profile</q-item-label>
            <q-item-label caption>User profile</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple 
        :to="{ name: 'bookings' }"
        :class="{'q-item--active': isActive('bookings')}"
        >
          <q-item-section avatar>
            <q-icon color="primary" name="flight" size="2.5em" />
          </q-item-section>

          <q-item-section>
            <q-item-label>My Bookings</q-item-label>
            <q-item-label caption>Bookings</q-item-label>
          </q-item-section>
        </q-item>
        
      </q-list>
    </q-drawer>

    <q-page-container class="bg-grey-2">
      
        <router-view />
     
    </q-page-container>
  </q-layout>
</template>

<script setup>
  import { onBeforeMount, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { fetchAuthSession } from '@aws-amplify/auth';
  import { onMounted } from "vue";

  const router = useRouter();

  const isActive = (name) => {
    return router.currentRoute.value.name === name;
  }

  // Redirect to dashboard if already authenticated on component mount
  onBeforeMount(() => {
    console.log("MAINLAYOUT");
    fetchAuthSession().then((session) => {
      try {
        const idToken = session.tokens.idToken;
        router.push({name: 'home'});
      } catch (err) {
        router.push({name: 'auth'});
      }
     
    });
  });

  // Example data for leftDrawer and leftDrawerOpen
  const leftDrawer = ref(true);
  const leftDrawerOpen = ref(router.currentRoute.value.meta.isDesktop || false);
</script>

<style>
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.q-item--active{
  background-color: #e0e0e0;
}

</style>