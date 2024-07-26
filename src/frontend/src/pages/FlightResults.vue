<template>
    <q-page>
      <flight-toolbar
        :departure="departure"
        :arrival="arrival"
      />
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
  import FlightToolbar from "../components/FlightToolbar.vue";
  import { ref, onMounted } from "vue";
  import { FlightService } from "../services/FlightService"
  import { useRoute } from "vue-router";
  
  const loading = ref(true);
  const flights = ref([]);
  const error = ref(null);

  const route = useRoute();
  const departureAirportCode = ref(route.query.departureAirportCode);
  const arrivalAirportCode = ref(route.query.arrivalAirportCode);
  const departureDate = ref(route.query.departureDate);

  const departure = ref('');
  const arrival = ref('');

  onMounted(async () => {
    //console.log('Search Flight : ', departureAirportCode, arrivalAirportCode, departureDate);
    departure.value = departureAirportCode.value;
    arrival.value = arrivalAirportCode.value;
    try {
      const response = await FlightService.getFlightBySchedule(departureAirportCode.value, arrivalAirportCode.value, departureDate.value);
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
