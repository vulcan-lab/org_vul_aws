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
          <q-input bottom-slots v-model="departureAirportCode" type="text" label="Departure airport">
            <template v-slot:before>
              <q-icon name="flight_takeoff" color="primary" size="2rem"/>
            </template>
          </q-input>
        </div>
        <div>
          <q-input bottom-slots v-model="arrivalAirportCode" type="text" label="Arrival airport">
            <template v-slot:before>
              <q-icon name="flight_land" color="primary" size="2rem"/>
            </template>
          </q-input>
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
  import { ref } from 'vue';
  import { date } from 'quasar';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  
  const departureAirportCode = ref('LGW');
  const arrivalAirportCode = ref('MAD');
  const departureDate = ref('');
  
    // Function to format the date
    const formatDate = (dateString, format) => {
    return date.formatDate(dateString, format);
  };
  
  const searchFlights = () => {
    const params = {
      departureAirportCode: departureAirportCode.value,
      arrivalAirportCode: arrivalAirportCode.value,
      departureDate: formatDate(departureDate.value, 'YYYY-MM-DD')
    }

    router.push({name: 'searchFlights', query: params});

    // Add your flight search logic here
    //console.log('Searching flight params:', params);
  };
</script>
  
<style scoped>
  .q-btn {
    background-color: red;
    color: white;
  }
</style>
  