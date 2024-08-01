<template>
  <div @click="showDialog" class="booking_flights">
    <div class="booking_flight">
      <FlightCard :details="flight" booking />
    </div>
    <q-dialog v-model="bookingDialpg">
      <q-card class="my-card" style="width: 700px; max-width: 80vw;">
        <q-card-section class="row items-center  bg-primary text-white" >
          <div>
            <q-btn flat round dense icon="close" @click="showDialog" />
          </div>
          <div>
            <span class="text-h6">{{ flight.departureAirportCode }} &gt; {{ flight.arrivalAirportCode }}</span>
          </div>
        </q-card-section>

        <q-card-section align="center">
          <div class="text-h5 text-primary" >{{ fullName }}</div>
          <div class="text-subtitle2">Booking reference: {{ props.bookingID }}</div>
        </q-card-section>

        <q-card-section>
          <q-timeline :layout="layout" color="secondary" style="padding: 0 24px;">
            <q-timeline-entry
              :title="departureTime"
              :subtitle="departureDisplayDate"
              side="right"
              icon="flight_takeoff"
            >
              <div align="right">{{ props.flight.departureAirportName }}</div>
            </q-timeline-entry>
            <q-timeline-entry
              :title="arrivalTime"
              :subtitle="arrivalDisplayDate"
              side="right"
              icon="flight_land"
            >
              <div align="right">{{ props.flight.arrivalAirportName }}</div>
            </q-timeline-entry>
          </q-timeline>
        </q-card-section>

        <q-separator />

        <q-card-actions align="evenly">
          <q-btn flat label="Check-in"  v-close-popup />
          <q-btn
            flat
            label="Cancel booking"
            color="negative"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import FlightCard from "./FlightCard.vue";
import BookingCard from "./BookingCard.vue";
import TestDialog from "./TestDialog.vue";
import { fetchUserAttributes } from "aws-amplify/auth";
import { date, useQuasar } from "quasar";

const $q = useQuasar();
const fullName = ref("");
const bookingDialpg = ref(false);

const props = defineProps({
  bookingID: String,
  flight: Object,
});

const departureDisplayDate = computed(() =>
  date.formatDate(props.flight.departureDate, "ddd, DD MMM YYYY")
);
const departureTime = computed(() =>
  date.formatDate(props.flight.departureDate, "HH:mm")
);
const arrivalDisplayDate = computed(() =>
  date.formatDate(props.flight.arrivalDate, "ddd, DD MMM YYYY")
);
const arrivalTime = computed(() =>
  date.formatDate(props.flight.arrivalDate, "HH:mm")
);

const showDialog = () => {
  bookingDialpg.value = !bookingDialpg.value;
};

const layout = computed(() => {
  return $q.screen.lt.sm ? 'dense' : ($q.screen.lt.md ? 'comfortable' : 'loose')
})

onMounted(async () => {
  fullName.value = (await fetchUserAttributes()).name;
});
</script>

<style scoped>
.booking_flight:hover {
  cursor: pointer;
}
</style>
