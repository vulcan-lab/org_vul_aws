<template>
  <q-page class="container">
    <div class="wrapper">
      <div class="heading">
        <h4>Where next?</h4>
      </div>
    </div>
    <div class="row search__options q-pa-sm justify-center items-center">
      <div class="col-md-6 col-sm-12">

        <div>
          <q-select
            v-model="departureAirportCode"
            :options="filteredDepartureFlights"
            option-label="departureAirportName"
            option-value="departureAirportCode"
            emit-value
            map-options
            use-input
            use-chips
            @filter="filterDepartureFlights"
            label="Select Departure Airport"
            hint="Type to search by airport code or name"
            hide-dropdown-icon
          >
            <template v-slot:before>
              <q-icon name="flight_takeoff" color="primary" size="2rem"/>
            </template>
          </q-select>
        </div>

        <div>
          <q-select
            v-model="arrivalAirportCode"
            :options="filteredArrivalFlights"
            option-label="arrivalAirportName"
            option-value="arrivalAirportCode"
            emit-value
            map-options
            use-input
            use-chips
            @filter="filterArrivalFlights"
            label="Select Arrival Airport"
            hint="Type to search by airport code or name"
            hide-dropdown-icon
          >
            <template v-slot:before>
              <q-icon name="flight_land" color="primary" size="2rem"/>
            </template>
          </q-select>
        </div>

        <div>
          <q-input v-model="departureDate" label="Pick a date" >
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
        </div>

      </div>
    </div>
    <div class="wrapper">
      <q-btn
        @click="searchFlights"
        class="cta__button"
        color="secondary"
        label="Search flights"
        
      >
        <q-icon
          class="cta__button--direction"
          name="keyboard_arrow_right"
          size="2.6rem"
        />
      </q-btn>
    </div>
  </q-page>
</template>
  
<script setup>
  import { onMounted, ref, watch } from 'vue';
  import { date, useQuasar } from 'quasar';
  import { useRouter } from 'vue-router';
  import { FlightService } from 'src/services/FlightService';
  import Fuse from 'fuse.js';

  const router = useRouter();
  const $q = useQuasar();
  
  const departureAirportCode = ref(null);
  const arrivalAirportCode = ref(null);
  const departureDate = ref('');

  const flights = ref([]);
  const filteredDepartureFlights = ref([]);
  const filteredArrivalFlights = ref([]);
  const searchResults = ref([]);

  // Function to format the date
  const formatDate = (dateString, format) => {
    return date.formatDate(dateString, format);
  };

  // Function to remove duplicates based on a specific key
  const removeDuplicates = (array, key) => {
    const seen = new Set();
    return array.filter(item => {
      const k = item[key];
      return seen.has(k) ? false : seen.add(k);
    });
  };
  
  //fetch Flights from aws backend
  const fetchFlights = async () =>{
    try {
      const response = await FlightService.listFlights();
      flights.value = response.data.listFlights.items;
      // Remove duplicates for departure flights
      const uniqueDepartureFlights = removeDuplicates(flights.value, 'departureAirportName');
      filteredDepartureFlights.value = uniqueDepartureFlights;

      // Remove duplicates for arrival flights
      const uniqueArrivalFlights = removeDuplicates(flights.value, 'departureAirportName');
      filteredArrivalFlights.value = uniqueArrivalFlights;
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Error fetching flights'
      });
    }
  };

  // initialize departureFuse with flights
  const departureFuse = new Fuse(flights.value,{
    keys: ['departureAirportCode', 'departureAirportName'],
    threshold: 0.3
  });

  // initialize arrivalFuse with flights
  const arrivalFuse = new Fuse(flights.value,{
    keys: ['arrivalAirportCode', 'arrivalAirportName'],
    threshold: 0.3
  });

  //Filter Departure flights base on user input
  const filterDepartureFlights = (val, update, abort) => {
    // if input value(val) is empty , reset the filter list to show all flights
    if(val === ''){
      filterDepartureFlights.value = removeDuplicates(flights.value, 'departureAirportName');
      update();
      return;
    }

    //otherwise, use departureFuse to search and update the filterDepartureFlights arry
    const result = departureFuse.search(val).map(({item}) => item);
    filterDepartureFlights.value = removeDuplicates(result, 'departureAirportName');
    update();
  };

  const filterArrivalFlights = (val, update,abort) =>{
    if(val === ''){
      filteredArrivalFlights.value = removeDuplicates(flights.value, 'arrivalAirportName');
      update();
      return;
    }

    const result = arrivalFuse.search(val).map(({item}) => item);
    filterArrivalFlights.value = removeDuplicates(result, 'arrivalAirportName');
    update;
  }

  //watch for changes in the flights
  watch(() => flights.value, () => {
    departureFuse.setCollection(flights.value);
    arrivalFuse.setCollection(flights.value);
  });

  const searchFlights = () => {
    const params = {
      departureAirportCode: departureAirportCode.value,
      arrivalAirportCode: arrivalAirportCode.value,
      departureDate: formatDate(departureDate.value, 'YYYY-MM-DD'),
    }

    searchResults.value = flights.value.filter(flight => 
      flight.departureAirportCode === params.departureAirportCode &&
      flight.arrivalAirportCode === params.arrivalAirportCode &&
      flight.departureDate.startsWith(params.departureDate)
    );

    if(searchResults.value.length === 0){
      $q.notify({
        type: 'warning',
        message: 'No flights found matching the search criteria'
      });
    }else{
      params.flights = JSON.stringify(searchResults.value);
      router.push({name: 'searchResults', query: params});
    }

    //router.push({name: 'searchFlights', query: params});

    // Add your flight search logic here
    //console.log('Searching flight params:', params);
  };

  onMounted(async ()=>{
    fetchFlights();
  });

</script>
  
<style scoped>
  .q-btn {
    background-color: red;
    color: white;
  }
</style>
  