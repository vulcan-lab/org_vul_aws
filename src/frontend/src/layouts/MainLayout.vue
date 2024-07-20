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
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon color="primary" name="home" />
        </q-item-section>
        <q-item-section>
          <q-item-section>Home</q-item-section>
          <q-item-label caption>home</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon color="primary" name="person" />
        </q-item-section>

        <q-item-section>
          <q-item-label>Profile</q-item-label>
          <q-item-label caption>User profile</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon color="primary" name="flight" />
        </q-item-section>

        <q-item-section>
          <q-item-label>My Bookings</q-item-label>
          <q-item-label caption>Bookings</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    </q-drawer>

    <q-page-container>
      <transition enter-active-class="animated fadeIn" appear>
        <router-view />
      </transition>
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  // name: 'LayoutName',
  data() {
    return {
      leftDrawer: true,
      leftDrawerOpen: this.$q.platform.is.desktop
    };
  }
};
</script>

<style></style>