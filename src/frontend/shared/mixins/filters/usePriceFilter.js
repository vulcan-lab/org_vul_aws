export function usePriceFilter() {
  const filterByMaxPrice = (flights, maxPrice) =>{
    if (!maxPrice) return flights;
    return flights.filter(flight => flight.ticketPrice <= maxPrice);
  }

  return{
    filterByMaxPrice
  }
};