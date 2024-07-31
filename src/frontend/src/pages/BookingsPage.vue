<template>
    <q-page>
      <div class="wrapper">
        <div
          class="q-display-1 text-primary booking__heading"
          data-test="booking-headline"
        >
          <h4>Bookings</h4>
        </div>
      </div>
      <div class="bookings">
        <q-timeline color="secondary" class="q-pl-md">
          <div class="booking" v-for="booking in bookings" :key="booking.id">
            <q-timeline-entry
              class="booking__entry"
              icon="flight_takeoff"
              side="left"
            >
              <h5 vslot="subtitle" class="q-timeline-subtitle">
                <span data-test="booking-city-date">
                  {{ booking.outboundFlight.departureCity }} &mdash;
                  {{ formatDate(booking.createdAt, 'YYYY-MM-DD') }}
                </span>
              </h5>
              <booking-flight
                :bookingID="booking.bookingReference"
                :flight="booking.outboundFlight"
              />
            </q-timeline-entry>
          </div>
        </q-timeline>
        <div class="wrapper">
          <q-btn
            v-if="paginationToken"
            @click="loadBookings"
            class="cta__button"
            color="secondary"
            size="1rem"
            label="Load more bookings?"
            data-test="booking-pagination"
          />
        </div>
      </div>
    </q-page>
</template>
  
<script setup>
  import { onMounted, ref } from "vue";
  import BookingFlight from "../components/BookingFlight.vue";
  import { BookingService } from "../services/BookingService";
  import { FlightService } from "../services/FlightService";
  import { date, useQuasar } from "quasar";
  
  const bookings = ref([]);
  const $q = useQuasar();

  async function updateBookingsWithFlightDetails(items) {
    const updatedItems = await Promise.all(
      items.map(async item => {
        if (item.bookingOutboundFlightId) {
          const flight = await FlightService.getFlight(item.bookingOutboundFlightId);
          return {
            ...item,
            outboundFlight: flight,
          };
        } else {
          return item;
        }
      })
    );
    return updatedItems;
  }

  // Function to format the date
  const formatDate = (dateString, format) => {
    return date.formatDate(dateString, format);
  };

  onMounted(async () => {
    try {
      const fetchedBookings = await BookingService.getBookingByStatus("UNCONFIRMED");
      bookings.value = await updateBookingsWithFlightDetails(fetchedBookings);
    } catch (error) {
      //console.error("ERROR :", error);
      $q.notify({
        type: "negative",
        message: `${error.message}`,
      });
    }
   
  });
</script>

<style>
  
  .booking__heading {
    margin-top: 2rem;
  }
    
  .booking__flight {
    margin: 0 !important;
    margin-right: 1rem !important;
  }
   
  .booking__entry{
    padding-left: 2rem;
  }
    
</style>