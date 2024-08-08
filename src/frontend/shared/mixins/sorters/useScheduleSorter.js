export function useScheduleSorter() {
    const sortByDeparture = (flights) => {
        return flights.sort((a, b) => {
            let d1 = new Date(a.departureDate);
            let d2 = new Date(b.departureDate);
            return d1.getTime() - d2.getTime();
        });
    }

    return {
        sortByDeparture
    }
}