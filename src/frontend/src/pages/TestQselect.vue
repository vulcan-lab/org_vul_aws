<template>
  <q-page>
    <q-select
      v-model="selectedDepartureAirport"
      :options="filteredDepartureFlights"
      option-label="departureAirportName"
      option-value="departureAirportCode"
      use-input
      use-chips
      @filter="filterDepartureFlights"
      label="Select Departure Airport"
      hint="Type to search by airport code or name"
      hide-dropdown-icon
      filled
    />

    <q-select
      v-model="selectedArrivalAirport"
      :options="filteredArrivalFlights"
      option-label="arrivalAirportName"
      option-value="arrivalAirportCode"
      use-input
      use-chips
      @filter="filterArrivalFlights"
      label="Select Arrival Airport"
      hint="Type to search by airport code or name"
      hide-dropdown-icon
      filled
    />

    <q-input v-model="departureDate" label="Pick a date">
      <template v-slot:before>
        <q-icon name="event" color="primary" size="2rem"/>
      </template>
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date v-model="departureDate" mask="ddd, DD MMM YYYY">
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Close" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <q-select
      v-model="selectedDepartureDate"
      :options="filteredDepartureDates"
      option-label="departureDate"
      option-value="departureDate"
      use-input
      use-chips
      @filter="filterDepartureDates"
      label="Select Departure Date"
      hint="Type to search by date"
      hide-dropdown-icon
      filled
    />
  </q-page>
</template>
<script setup>
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import Fuse from 'fuse.js';
import { FlightService } from 'src/services/FlightService';

const $q = useQuasar();

const selectedDepartureAirport = ref(null);
const selectedArrivalAirport = ref(null);
const selectedDepartureDate = ref(null);
const departureDate = ref(null);
const flights = ref([]);
const filteredDepartureFlights = ref([]);
const filteredArrivalFlights = ref([]);
const filteredDepartureDates = ref([]);

const fetchFlights = async () => {
  try {
    const response = await FlightService.listFlights();
    flights.value = response.data.listFlights.items;
    filteredDepartureFlights.value = flights.value;
    filteredArrivalFlights.value = flights.value;
    filteredDepartureDates.value = [...new Set(flights.value.map(flight => flight.departureDate))];
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error fetching flights'
    });
  }
};

const departureFuse = new Fuse(flights.value, {
  keys: ['departureAirportCode', 'departureAirportName'],
  threshold: 0.3
});

const arrivalFuse = new Fuse(flights.value, {
  keys: ['arrivalAirportCode', 'arrivalAirportName'],
  threshold: 0.3
});

const dateFuse = new Fuse(filteredDepartureDates.value, {
  keys: ['departureDate'],
  threshold: 0.3
});

const filterDepartureFlights = (val, update, abort) => {
  if (val === '') {
    filteredDepartureFlights.value = flights.value;
    update();
    return;
  }

  const result = departureFuse.search(val).map(({ item }) => item);
  filteredDepartureFlights.value = result;
  update();
};

const filterArrivalFlights = (val, update, abort) => {
  if (val === '') {
    filteredArrivalFlights.value = flights.value;
    update();
    return;
  }

  const result = arrivalFuse.search(val).map(({ item }) => item);
  filteredArrivalFlights.value = result;
  update();
};

const filterDepartureDates = (val, update, abort) => {
  if (val === '') {
    filteredDepartureDates.value = [...new Set(flights.value.map(flight => flight.departureDate))];
    update();
    return;
  }

  const result = dateFuse.search(val).map(({ item }) => item);
  filteredDepartureDates.value = result;
  update();
};

watch(() => flights.value, () => {
  departureFuse.setCollection(flights.value);
  arrivalFuse.setCollection(flights.value);
  dateFuse.setCollection([...new Set(flights.value.map(flight => flight.departureDate))]);
});

// Fetch flights on component mount
fetchFlights();
</script>
