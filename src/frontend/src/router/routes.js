const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/login' },
      { path: 'login', name:'AuthenticationPage', component: () => import('pages/AuthenticationPage.vue') },
      { path: 'search', name:'SearchFlights', component: () => import('pages/SearchFlights.vue') },
      { path: 'flights', name:'FlightResults', component: () => import('pages/FlightResults.vue')}
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
