<template>
  <div class="flight__options">
    <q-page-sticky expand position="top">
      <q-toolbar class="flight__filter--toolbar" color="grey-1">
        <q-toolbar-title class="text-dark text-weight-bold row">
          <div class="flight__orientation col-11 text-left">
            <span
              class="flight__departure--toolbar"
              data-test="toolbar-departure"
              >{{ props.departure }}</span>
            <q-btn flat round dense icon="swap_horiz" />
            <span
              class="flight__arrival--toolbar"
              data-test="toolbar-arrival"
              >{{ props.arrival }}</span>
          </div>
        </q-toolbar-title>
      </q-toolbar>
    </q-page-sticky>
  </div>
</template>
  
<script setup>
 
  // const flight = new Flight(flightData)
      
  // <flight-toolbar
  //   :departure="flight.departureAirportCode"
  //   :arrival="flight.arrivalAirportCode">
  // </flight-toolbar>

  const props = defineProps({
    departure: {
      type: String,
      required: true
    },
    arrival: {
      type: String,
      required: true
    }
  });

  console.log("PROPS:", props.departure);
</script>