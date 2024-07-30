<template>
  <q-page>
    <flight-toolbar
      v-if="selectedFlight"
      :departure="selectedFlight.departureAirportCode"
      :arrival="selectedFlight.arrivalAirportCode"
    />
    <div class="flights">
      <div class="heading">
        <div
          class="q-headline text-primary text-center flight__headline"
          data-test="flight-headline"
        >
          <h4>Review your selection</h4>
        </div>
        <div class="loader" v-if="loading">
          <flight-loader></flight-loader>
        </div>
      </div>
      <flight-card v-if="selectedFlight" :details="selectedFlight" />
    </div>
    <div class="form__payment">
      <div class="text-center">
        <div
          class="form__header q-pt-md q-headline text-primary text-center"
          data-test="form-header"
        >
          Payment details
        </div>
        
        <q-btn
          @click="payment"
          class="cta__button text-weight-medium"
          color="secondary"
          label="Agree and pay now"
          data-test="payment-button"
        >
          <q-icon
            class="cta__button--direction"
            name="keyboard_arrow_right"
            size="2.6rem"
          />
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script setup>
// @ts-nocheck
import { ref, computed, onBeforeMount, onMounted } from "vue";
import { BookingService } from "../services/BookingService";
import { useStore } from "vuex";
import FlightCard from "../components/FlightCard.vue";
import FlightToolbar from "../components/FlightToolbar.vue";
import { useVuelidate } from "@vuelidate/core";
import { required, minLength } from "@vuelidate/validators";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const departure = ref("");
const arrival = ref("");
const selectedFlight = route.query.flight
  ? JSON.parse(route.query.flight)
  : null;

console.log("SELECTEDFLIGHT : ", selectedFlight.value);

const form = ref({
  name: "",
  country: "",
  postcode: "",
  countryOptions: ["BR", "UK", "US"],
  isCardInvalid: true,
});

const token = ref({
  details: "",
  error: "",
});

const stripeKey =
  "pk_test_51PhwbjDWE31jyBLsLeTbV3dF7yWvpm9Af23q0mDn8FgAObEPgHCf3T25ktcoKcbbhgxkRWTIali48W93spKd5GaQ00kNRIahGM";

const validations = useVuelidate(
  {
    form: {
      name: { required },
      country: { required },
      postcode: { required, minLength: minLength(3) },
    },
  },
  form
);

onMounted(() => {
  console.log("SELECTEDFLIGHT2 : ", selectedFlight2);

  departure.value = selectedFlight.value.departureAirportCode;
  arrival.value = selectedFlight.value.arrivalAirportCode;

  loadStripeJS()
    .then(loadStripeElements)
    .catch((err) => console.error(err));
});

const payment = async () => {
  const options = {
    name: form.value.name,
    address_zip: form.value.postcode,
    address_country: form.value.country,
  };

  try {
    const { token: stripeToken, error } = await stripe.createToken(
      card,
      options
    );
    token.value.details = stripeToken;
    token.value.error = error;

    if (token.value.error) throw token.value.error;

    const bookingId = await BookingService.processBooking({
      paymentToken: token.value,
      outboundFlight: selectedFlight.value,
    });

    //router.push({ name: "bookings" });
    $q.notify({
      message: `Booking ${bookingId} proccessed successful`,
      color: "green",
    });
  } catch (err) {
    $q.notify({
      type: "negative",
      message: `${err}`,
    });
  }
};

const loadStripeJS = () => {
  return new Promise((resolve, reject) => {
    const stripeScript = document.createElement("script");
    stripeScript.async = true;
    stripeScript.src = "https://js.stripe.com/v3/";
    stripeScript.addEventListener("load", resolve);
    stripeScript.addEventListener("error", () =>
      reject("Error loading Stripe Elements.")
    );
    document.head.appendChild(stripeScript);
  });
};

const loadStripeElements = () => {
  stripe = Stripe(stripeKey);
  const elements = stripe.elements();
  const style = {
    base: {
      iconColor: "#666EE8",
      color: "#31325F",
      lineHeight: "40px",
      fontWeight: 300,
      fontFamily: "Helvetica Neue",
      fontSize: "15px",
      "::placeholder": { color: "#CFD7E0" },
    },
  };

  card = elements.create("cardNumber", { style });
  const cardExpiryElement = elements.create("cardExpiry", { style });
  const cardCvcElement = elements.create("cardCvc", { style });

  card.mount("#card-number-element");
  cardExpiryElement.mount("#card-expiry-element");
  cardCvcElement.mount("#card-cvc-element");

  card.on("change", (event) => updateCardFeedback(event));
  cardExpiryElement.on("change", (event) => updateCardFeedback(event));
  cardCvcElement.on("change", (event) => updateCardFeedback(event));
};

const updateCardFeedback = (result) => {
  token.value.error = result.error;
  form.value.isCardInvalid = !result.complete;
};
</script>

<style scoped>
.flights {
  margin-top: var(--content-toolbar-margin);
}

.q-headline {
  margin-top: 2rem;
}

.form__payment,
.form__header {
  background: var(--grey-2);
}

form {
  width: auto;
  margin: 20px;
}

.group {
  background: white;
  box-shadow: 0 7px 14px 0 rgba(49, 49, 93, 0.1),
    0 3px 6px 0 rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  margin-bottom: 20px;
}

label {
  position: relative;
  font-weight: 300;
  height: 40px;
  line-height: 40px;
  display: flex;
}

.group label:not(:last-child) {
  border-bottom: 1px solid #f0f5fa;
}

label > span {
  width: 120px;
  text-align: right;
  margin-right: 0.4rem;
}

.field {
  background: transparent;
  font-weight: 300;
  border: none;
  color: #31325f;
  outline: none;
  flex: 1;
  padding-right: 10px;
  padding-left: 10px;
  cursor: text;
}

.field::-webkit-input-placeholder {
  color: #cfd7e0;
}

.field::-moz-placeholder {
  color: #cfd7e0;
}

.outcome {
  float: left;
  width: 100%;
  padding-top: 8px;
  min-height: 24px;
  text-align: center;
}

.error {
  font-size: 20px;
}

.error.visible {
  display: inline;
}

.separator {
  box-shadow: 0 7px 14px 0 rgba(49, 49, 93, 0.1),
    0 3px 6px 0 rgba(0, 0, 0, 0.08);
}

.loader {
  width: 150%;
}
</style>
