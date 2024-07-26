<template>
    <q-page>
      <div class="row justify-center items-center">
        <q-spinner-gears
            color="primary"
            size="5rem"
            :thickness="5"
            v-if="loading"
            class="q-mt-md"
          />
      </div>
      <div v-if="flights.length && !loading">
        <router-link
          v-for="flight in flights"
          :key="flight.id"
        >
          <flight-card :details="flight" />
        </router-link>
      </div>
      <div v-if="!flights.length && !loading">
       <p>No Corresponding Flights</p>
      </div>
    </q-page>
  </template>
  
<script setup>
  import FlightCard from "../components/FlightCard.vue";
  import FlightLoader from "../components/FlightLoader.vue";
  import { ref, onMounted } from "vue";
  import { FlightService } from "../services/FlightService"
  
  const loading = ref(true);
  const flights = ref([]);
  const error = ref(null);

  onMounted(async () => {
    const departureAirportCode = "LGW"; // Example departure airport code
    const arrivalAirportCode = "MAD"; // Example arrival airport code
    const departureDate = "2019-12-02"; // Example departure date

    try {
      const response = await FlightService.getFlightBySchedule(departureAirportCode, arrivalAirportCode, departureDate);
      flights.value = response.data.getFlightBySchedule.items;
    } catch (err) {
      error.value = err;
      console.error(err);
    } finally {
      loading.value = false;
    }
  });

</script>
<style scoped>

  .heading{
    margin-top: 5.5rem;
  }
  
  .heading__error--cta{
    margin: auto;
    margin-top: 10vh;
    width: 70vw;
  }
  
</style>
