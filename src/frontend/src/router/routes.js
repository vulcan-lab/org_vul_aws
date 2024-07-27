import SearchFlights from 'pages/SearchFlights.vue';
import FlightResults from 'pages/FlightResults.vue';
import AuthenticationPage from 'pages/AuthenticationPage.vue';
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
