<template>
  <q-dialog v-model="dialog" persistent>
    <q-card>
      <q-card-section>
        <q-toolbar color="primary">
          <q-btn flat round dense icon="close" @click="hideDialog" />
          <q-toolbar-title class="booking__modal--title self-center">
            <div class="row q-pt-md">
              <p class="no-margin booking__departure--code" data-test="booking-departure-code">
                {{ departureIata }}
              </p>
              <q-icon name="keyboard_arrow_right" size="1.3rem" />
              <p class="booking__arrival--code" data-test="booking-arrival-code">
                {{ arrivalIata }}
              </p>
            </div>
          </q-toolbar-title>
        </q-toolbar>
      </q-card-section>

      <q-card-section>
        <div class="booking__modal--passenger booking__modal--highlighted text-center q-pa-md">
          <div class="q-headline text-primary q-mb-sm" data-test="booking-customer">
            {{ name }}
          </div>
          <div class="q-body-2">
            Booking reference:
            <span class="text-primary" data-test="booking-reference">
              {{ reference }}
            </span>
          </div>
        </div>

        <q-timeline responsive color="secondary" style="padding: 0 24px;">
          <q-timeline-entry :subtitle="departureDisplayDate" icon="flight_takeoff">
            <q-list highlight no-border class="q-pa-none">
              <q-item class="q-pa-none">
                <q-item-main class="text-bold" :label="departureTime" data-test="booking-departure-time" />
                <q-item-main :label="departureAirportName" data-test="booking-departure-code" />
              </q-item>
            </q-list>
          </q-timeline-entry>

          <q-timeline-entry :subtitle="arrivalDisplayDate" icon="flight_land">
            <q-list highlight no-border class="q-pa-none">
              <q-item class="q-pa-none">
                <q-item-main class="text-bold" :label="arrivalTime" data-test="booking-arrival-time" />
                <q-item-main :label="arrivalAirportName" data-test="booking-arrival-code" />
              </q-item>
            </q-list>
          </q-timeline-entry>
        </q-timeline>
      </q-card-section>

      <q-card-actions>
        <q-btn flat color="primary" label="Check-in" @click="checkIn" />
        <q-btn flat color="secondary" label="Cancel booking" @click="cancelBooking" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, defineProps } from 'vue';
import { date } from 'quasar';

const props = defineProps({
  reference: String,
  name: String,
  departureDate: [String, Date],
  departureAirportName: String,
  departureIata: {
    type: String,
    validator: value => value.length === 3
  },
  arrivalDate: [String, Date],
  arrivalAirportName: String,
  arrivalIata: {
    type: String,
    validator: value => value.length === 3
  }
});

const dialog = ref(false);

const departureDisplayDate = computed(() => date.formatDate(props.departureDate, "ddd, DD MMM YYYY"));
const departureTime = computed(() => date.formatDate(props.departureDate, "HH:mm"));
const arrivalDisplayDate = computed(() => date.formatDate(props.arrivalDate, "ddd, DD MMM YYYY"));
const arrivalTime = computed(() => date.formatDate(props.arrivalDate, "HH:mm"));

const showDialog = () => {
  dialog.value = true;
}

function hideDialog() {
  dialog.value = false;
}

function checkIn() {
  console.log('Check-in not implemented');
}

function cancelBooking() {
  console.log('Cancel booking not implemented');
}
</script>

<style scoped>
.booking__modal--title {
  margin: 0 auto;
}

.booking__modal--highlighted {
  background: #f0f0f0; /* Replace with $grey-1 from variables */
}

.q-timeline-content {
  padding: 0;
}

.q-item {
  min-height: none;
}

h6 {
  margin: 0;
  padding: 0;
}
</style>
