<template>
    <q-page>
      <flight-toolbar
        v-if="departureDate && departureAirportCode && arrivalAirportCode"
        :departure="departure"
        :arrival="arrival"
      />
      <q-page-sticky
      v-if="departureDate && departureAirportCode && arrivalAirportCode"
      position="top-right"
      :offset="[15, 13]"
      >
        <q-fab flat icon="tune" direction="left">
          <q-fab-action color="secondary" icon="attach_money" glossy>
            <q-popup-edit
              @save="setPrice"
              title="Max Price filter"
              buttons
              v-model="maxPriceFilter"
              v-slot="scope"
            >
              <q-slider
                color="secondary"
                :min="minimumPrice"
                :max="maximumPrice"
                label
                label-always
                v-model="scope.value"
                @keyup.enter="scope.set"
                class="filter__price"
              />
            </q-popup-edit>
          </q-fab-action>
          <q-fab-action color="secondary" icon="schedule" glossy>
            <q-popup-edit title="Schedule filter">
              <q-input v-model="departureTimeFilter" label="Depart at">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="departureTimeFilter" mask="HH:mm" format24h  @update:model-value="setDeparture">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <q-input v-model="arrivalTimeFilter" label="Arrive by" class="filter__arrival">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="arrivalTimeFilter" mask="HH:mm" format24h @update:model-value="setArrival">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

            </q-popup-edit>
          </q-fab-action>
          <q-fab-action
            color="secondary"
            icon="cancel"
            @click="filteredFlights = flights"
            glossy
            class="filter__cta"
          />
        </q-fab>
      </q-page-sticky>
      <div class="row justify-center items-center q-mt-lg">
        <q-spinner-gears
          color="primary"
          size="5rem"
          :thickness="5"
          v-if="loading"
          class="q-mt-md"
        />
      </div>
      <div v-if=" filteredFlights.length && !loading">
        <router-link
          v-for="flight in filteredFlights"
          :key="flight.id"
        >
          <flight-card :details="flight" />
        </router-link>
      </div>
      <div v-if="!filteredFlights.length && !loading">
       <p>No Corresponding Flights</p>
      </div>
    </q-page>
  </template>
  
<script setup>
  import FlightCard from "../components/FlightCard.vue";
  import FlightToolbar from "../components/FlightToolbar.vue";
  import { ref, onMounted, computed } from "vue";
  import { FlightService } from "../services/FlightService"
  import { useRoute } from "vue-router";
  import { usePriceFilter } from "../../shared/mixins/filters/usePriceFilter";
  import { useScheduleFilter } from "../../shared/mixins/filters/useScheduleFilter";
  import { usePriceSorter } from "../../shared/mixins/sorters/usePriceSorter";
  import { useScheduleSorter } from "../../shared/mixins/sorters/useScheduleSorter";
  
  const { filterByMaxPrice } = usePriceFilter();
  const { filterBySchedule } = useScheduleFilter();
  const { sortByPrice } = usePriceSorter();
  const { sortByDeparture } = useScheduleSorter();

  const loading = ref(true);
  const filteredFlights = ref([]);
  const error = ref(null);

  const route = useRoute();
  const departureAirportCode = ref(route.query.departureAirportCode);
  const arrivalAirportCode = ref(route.query.arrivalAirportCode);
  const departureDate = ref(route.query.departureDate);
  const flights = ref([]);

  const departure = ref('');
  const arrival = ref('');
  const departureTimeFilter = ref('');
  const arrivalTimeFilter = ref('');
  const maxPriceFilter = ref(300);
  

  onMounted(async () => {
    //console.log('Search Flight : ', departureAirportCode, arrivalAirportCode, departureDate);
    departure.value = departureAirportCode.value;
    arrival.value = arrivalAirportCode.value;
    
    try {
      flights.value = route.query.flights ? JSON.parse(route.query.flights) : [];
      filteredFlights.value = flights.value;
    } catch (err) {
      error.value = err;
      console.error(err);
    } finally {
      loading.value = false;
    }
  });

  const setPrice = (maxPrice) => {
    maxPriceFilter.value = maxPrice;
    let vols = filterByMaxPrice(flights.value, maxPriceFilter.value);
    filteredFlights.value = sortByPrice(vols);
  };
  /**
   * setDeparture method updates departureTimeFilter and filter flights via filterBySchedule mixin
   */
   const setDeparture = (departure) => {
    departureTimeFilter.value = departure;
    let vols = filterBySchedule(flights.value, {
      departure: departureTimeFilter.value
    });
    filteredFlights.value = sortByDeparture(vols);
  };

  /**
   * setArrival method updates arrivalTimeFilter and filter flights via filterBySchedule mixin
   */
   const setArrival = (arrival) => {
    arrivalTimeFilter.value = arrival;
    filteredFlights.value = filterBySchedule(flights.value, {
      arrival: arrivalTimeFilter.value
    });
  };

  const maximumPrice = computed(() => {
    return Math.max(...flights.value.map(flight => flight.ticketPrice), 500);
  });

  const minimumPrice = computed(() => {
    return Math.min(...flights.value.map(flight => flight.ticketPrice), 1);
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
