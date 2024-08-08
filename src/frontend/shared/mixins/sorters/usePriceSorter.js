export function usePriceSorter() {
    const sortByPrice = (flights) => {
        return flights.sort((a,b) => a.ticketPrice - b.ticketPrice);
    }

    return{
        sortByPrice
    }
};