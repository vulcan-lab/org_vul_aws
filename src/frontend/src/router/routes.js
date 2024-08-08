import SearchFlights from 'pages/SearchFlights.vue';
import FlightResults from 'pages/FlightResults.vue';
import AuthenticationPage from 'pages/AuthenticationPage.vue';
import FlightSelection from 'pages/FlightSelection.vue';
import Bookings from 'pages/BookingsPage.vue'
import ProfilePage from 'pages/ProfilePage.vue';
import TestQselect from 'src/pages/TestQselect.vue';

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { 
        path: '', 
        name:'home', 
        component: SearchFlights,
        alias: "/search",
      },
      { 
        path: '/search/results', 
        name:'searchResults', 
        component: FlightResults,
        alias: "/search",
      },
      {
        name: "selectedFlight",
        path: "/search/results/review",
        component: FlightSelection,
      },
      {
        name: "profile",
        path: "/profile",
        component: ProfilePage,
      },
      {
        name: "bookings",
        path: "/profile/bookings",
        component: Bookings,
      },
      { 
        path: '/auth', 
        name:'auth', 
        component: AuthenticationPage,
      },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
