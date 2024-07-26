<template>
  <div class="row flight justify-center items-center q-pa-none q-ma-none">
    <div class="col-md-3 col-sm-12">
      <q-card class="my-card rounded-card" :id="details.flightNumber">
        <div class="row justify-between q-px-md q-py-sm">
          <div class="text-uppercase text-subtitle1 text-grey">Departure</div>
          <div class="text-uppercase text-subtitle1 text-grey">{{  formatDate(details.departureDate,  'DD MMM YYYY') }}</div>
        </div>
        <div class="row justify-between q-px-md q-py-sm">
          <div class="text-uppercase text-h4">{{ details.departureAirportCode }}</div>
          <q-icon color="primary" name="local_airport" size="4em" />
          <div class="text-uppercase text-h4">{{  details.arrivalAirportCode  }}</div>
        </div>
        <div class="row justify-between q-px-md q-py-sm">
          <div class="text-caption text-red">{{ details.departureAirportName }}</div>
          <div class="text-caption text-red">{{  details.arrivalAirportName  }}</div>
        </div>
        <q-separator color="red" inset />
        <div class="row justify-between q-px-md q-py-sm">
          <div class="text-subtitle text-weight-bold"><q-icon name="flight_takeoff" size="2em"/> {{ formattedHoursMinute(details.departureDate) }} </div>
          <div class="text-subtitle text-weight-bold"><q-icon name="schedule" size="2em"/> {{ flightDuration(details.departureDate, details.arrivalDate) }} </div>
          <div class="text-subtitle text-weight-bold"><q-icon name="flight_land" size="2em"/> {{ formattedHoursMinute(details.arrivalDate) }} </div>
        </div>
        <q-separator color="red" inset />
        <div class="row justify-between q-px-md q-py-sm">
          <div class="text-uppercase text-h5 text-red">{{ details.ticketPrice }} EUR</div>
          <div class="text-caption"><b color="primary">Flight no</b> <b class="text-grey">#{{ details.flightNumber }}</b></div>
        </div>
      </q-card>
    </div>
  </div>
</template>
  
<script setup>
  import Flight from "../shared/models/FlightClass";
  import { date } from 'quasar';
 
  // Props
  const props = defineProps({
    /**
     * @param {Flight} details - Sets Flight details from flight object
     * @param {boolean} booking - Limits amount of information in the card to suit a booking display
     */
    details: {
      type: Flight,
      required: true
    },
    booking: { type: Boolean, default: false }
  });

  // Function to format the date
  const formatDate = (dateString, format) => {
    return date.formatDate(dateString, format);
  };

  // Computed property for formatted departure time
  const formattedHoursMinute = (dateString) => {
    return date.formatDate(dateString, 'HH:mm');
  };

  // Computed property for flight duration
  const flightDuration = (departureDate, arrivalDate) => {
    const departure = new Date(departureDate);
    const arrival = new Date(arrivalDate);
    const diffMs = arrival - departure; // difference in milliseconds
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h${diffMinutes}min`;
  };

</script>
  
<style>

  .rounded-card {
    border-radius: 15px;
  }

  .flight {
    margin: 1.3rem 1rem;
  }

</style>