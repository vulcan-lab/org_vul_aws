<template>
  <q-page>
    <div class="row q-pa-lg">
        <div class="col-12 q-mb-xl text-center">
            <div class="text-h5 text-primary"> {{ fullName }} </div> 
            <div class="text-h6 text-secondary"> {{ loyalty.level || "bronze" }} </div>
        </div>
        <div class="col-md-6 col-xs-12">
            <div class="row">
                <div class="col-md-4 col-sm-12 text-h6 q-pr-md text-primary text-right">Points : </div>
                <div class="col-md-8 ol-sm-12 text-h4">{{ loyalty.points || 0 }}</div>
            </div>
        </div>
        <div class="col-md-6 col-xs-12 q-pb-lg">
            <div class="row text-left">
                <div class="col-md-4 text-h6 text-primary q-pr-md text-right">Next Tier Progress : </div>
                <div class="col-md-8 text-h4">{{ loyalty.percentage || 0 }}%</div>
            </div>
        </div>
        <div class="col-12 text-center q-pt-lg">
            <h5>Preferences</h5>
        </div>
        <div class="profile__preferences-options col-12">
            <q-list highlight no-border class="q-pa-none q-ml-md" link>
            <a @click="openDialog('diet')">
                <q-item class="q-pa-none q-mt-md">
                    <q-item-section avatar>
                        <q-icon name="tune" size="1.6rem" />
                        </q-item-section>
                        <q-item-section class="text-h6 text-bold">Dietary requirements</q-item-section>
                    </q-item>
            </a>
            <a @click="openDialog('luggage')">
                <q-item class="q-pa-none q-mt-md">
                    <q-item-section avatar>
                        <q-icon name="tune" size="1.6rem" />
                        </q-item-section>
                        <q-item-section class="text-h6 text-bold">Luggage</q-item-section>
                    </q-item>
            </a>
            </q-list>
        </div>
        <div class="col-12 text-center">
            <q-btn
            @click="handleSignOut"
            class="cta__button"
            color="secondary"
            size="1rem"
            label="sign out?"
            />
        </div>
    </div>
    <q-dialog v-model="isDialogOpen">
        <q-card class="my-card" style="width: 300px">
            <q-card-section>
                <div class="text-h6 text-primary">{{ dialogTitle }}</div>
                <div>{{ dialogMessage }}</div>
            </q-card-section>

            <q-card-section>
                <q-option-group
                v-model="selectedOption"
                :options="dialogOptions"
                type="radio"
                color="primary"
                />
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" @click="isDialogOpen = false" />
                <q-btn flat label="OK" color="primary" @click="handleDialogOk" />
            </q-card-actions>
        </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { signOut, getCurrentUser} from 'aws-amplify/auth';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { fetchUserAttributes } from "aws-amplify/auth";
import { onMounted, ref } from "vue";
import { LoyalService } from "src/services/LoyaltyService";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

const $q = useQuasar();
const router = useRouter();

const fullName = ref("");
const loyalty = ref({});

const isDialogOpen = ref(false);
const dialogTitle = ref('');
const dialogMessage = ref('');
const dialogOptions = ref([]);
const selectedOption = ref(null);

const openDialog = (option) => {
  const luggageDialog = {
    title: 'Luggage preference',
    message: 'How many luggages would you like to check-in with?',
    options: [
      { label: '1', value: '1', color: 'primary' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
    ],
  };

  const dietaryDialog = {
    title: 'Dietary preference',
    message: "What's your dietary requirement?",
    options: [
      { label: 'Vegetarian', value: 'vegetarian', color: 'secondary' },
      { label: 'Vegan', value: 'vegan' },
      { label: 'Dairy-free', value: 'dairy-free' },
      { label: 'Regular', value: 'regular' },
    ],
  };

  const dialog = option === 'luggage' ? luggageDialog : dietaryDialog;
  dialogTitle.value = dialog.title;
  dialogMessage.value = dialog.message;
  dialogOptions.value = dialog.options;
  isDialogOpen.value = true;
};

const handleDialogOk = () => {
  $q.notify({ message: `${dialogTitle.value}: ${selectedOption.value}`, type: 'positive' , position: 'top-right'});
  isDialogOpen.value = false;
};

const checkAuthenticated = async () =>{
    try {
        const res = await getCurrentUser();
        fullName.value = (await fetchUserAttributes()).name;
    } catch (error) {
        router.push({name: 'auth'});
    }
};

const getLoyalty = async () => {
  const userId = (await fetchUserAttributes()).sub;
  try {
    loyalty.value = await LoyalService.getLoyalty(userId);
  } catch (error) {
    $q.notify({
      type: "negative",
      message: `${error.message}`,
      position: "top-right",
    });
  }
};

const handleSignOut = async () =>{
  try {
    await signOut();
    router.push({name: 'auth'});
  } catch (error) {
    console.log('error signing out: ', error);
  }
};

onMounted(async () => {
    checkAuthenticated().then(() => getLoyalty());
});


</script>
<style>
    a{
        cursor: pointer;
    }
</style>