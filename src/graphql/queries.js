/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getFlight = /* GraphQL */ `
  query GetFlight($id: ID!) {
    getFlight(id: $id) {
      id
      departureDate
      departureAirportCode
      departureAirportName
      departureCity
      departureLocale
      arrivalDate
      arrivalAirportCode
      arrivalAirportName
      arrivalCity
      arrivalLocale
      ticketPrice
      ticketCurrency
      flightNumber
      seatCapacity
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listFlights = /* GraphQL */ `
  query ListFlights(
    $filter: ModelFlightFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFlights(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        departureDate
        departureAirportCode
        departureAirportName
        departureCity
        departureLocale
        arrivalDate
        arrivalAirportCode
        arrivalAirportName
        arrivalCity
        arrivalLocale
        ticketPrice
        ticketCurrency
        flightNumber
        seatCapacity
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getBooking = /* GraphQL */ `
  query GetBooking($id: ID!) {
    getBooking(id: $id) {
      id
      status
      outboundFlight {
        id
        departureDate
        departureAirportCode
        departureAirportName
        departureCity
        departureLocale
        arrivalDate
        arrivalAirportCode
        arrivalAirportName
        arrivalCity
        arrivalLocale
        ticketPrice
        ticketCurrency
        flightNumber
        seatCapacity
        createdAt
        updatedAt
        owner
        __typename
      }
      paymentToken
      checkedIn
      customer
      createdAt
      bookingReference
      updatedAt
      bookingOutboundFlightId
      __typename
    }
  }
`;
export const listBookings = /* GraphQL */ `
  query ListBookings(
    $filter: ModelBookingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listBookings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        status
        paymentToken
        checkedIn
        customer
        createdAt
        bookingReference
        updatedAt
        bookingOutboundFlightId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getFlightBySchedule = /* GraphQL */ `
  query GetFlightBySchedule(
    $departureAirportCode: String!
    $arrivalAirportCodeDepartureDate: ModelFlightByDepartureScheduleCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelFlightFilterInput
    $limit: Int
    $nextToken: String
  ) {
    getFlightBySchedule(
      departureAirportCode: $departureAirportCode
      arrivalAirportCodeDepartureDate: $arrivalAirportCodeDepartureDate
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        departureDate
        departureAirportCode
        departureAirportName
        departureCity
        departureLocale
        arrivalDate
        arrivalAirportCode
        arrivalAirportName
        arrivalCity
        arrivalLocale
        ticketPrice
        ticketCurrency
        flightNumber
        seatCapacity
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getBookingByStatus = /* GraphQL */ `
  query GetBookingByStatus(
    $customer: String!
    $status: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelBookingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    getBookingByStatus(
      customer: $customer
      status: $status
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        status
        paymentToken
        checkedIn
        customer
        createdAt
        bookingReference
        updatedAt
        bookingOutboundFlightId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
