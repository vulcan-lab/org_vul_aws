<template>
  <q-page>
    <div class="q-pa-md flex justify-center">
      <q-spinner-gears
          color="primary"
          size="5rem"
          :thickness="5"
          v-if="loading"
          class="q-mt-md"
        />
    </div>
    <div v-if="bookings.length && !loading">
      <div class="wrapper">
        <div
          class="q-display-1 text-primary booking__heading"
          data-test="booking-headline"
        >
        <div class="text-h4">Bookings</div>
        </div>
      </div>
      <div class="bookings">
        <div class="booking" v-for="booking in bookings" :key="booking.id">
          <q-item>
            <q-item-section avatar>
              <q-avatar
                color="secondary"
                text-color="white"
                icon="flight_takeoff"
              />
            </q-item-section>
            <q-item-section class="text-h6">
              {{ booking.outboundFlight.departureCity }} &mdash;
              {{ formatDate(new Date(booking.createdAt), "DD MMM YYYY") }}
            </q-item-section>
          </q-item>
          <booking-flight
            :bookingID="booking.bookingReference"
            :flight="booking.outboundFlight"
          />
        </div>
      </div>
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
    <div v-if="!bookings.length && !loading">
      <p>No Bookings</p>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from "vue";
import BookingFlight from "../components/BookingFlight.vue";
import { BookingService } from "../services/BookingService";
import { FlightService } from "../services/FlightService";
import { date, useQuasar } from "quasar";
import { getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "vue-router";

const $q = useQuasar();
const router = useRouter();

const bookings = ref([]);
const loading = ref(true);
const paginationToken = ref("");

const checkAuthenticated = async () =>{
  try {
      const res = await getCurrentUser();
  } catch (error) {
      router.push({name: 'auth'});
      exit;
  }
};

async function updateBookingsWithFlightDetails(items) {
  const updatedItems = await Promise.all(
    items.map(async (item) => {
      if (item.bookingOutboundFlightId) {
        const flight = await FlightService.getFlight(
          item.bookingOutboundFlightId
        );
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

const loadBookings = async () =>{
  loading.value = true;
  const status = "UNCONFIRMED";
  try {
    const data = await BookingService.getBookingByStatus(status, paginationToken.value
    );
    bookings.value = await updateBookingsWithFlightDetails(data.items);
    paginationToken.value = data.nextToken;
    
  } catch (error) {
    $q.notify({
      type: "negative",
      message: `${error.message}`,
      position: 'top-right'
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  checkAuthenticated().then(() => loadBookings());
});
</script>
