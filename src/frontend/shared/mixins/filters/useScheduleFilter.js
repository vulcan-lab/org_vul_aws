export function useScheduleFilter() {
    const filterBySchedule = (flights, { departure, arrival }) => {
        if (!departure && !arrival) return flights;

        if (departure) {

            let [departureHours, departureMinutes] = departure.split(':').map(Number);

            flights = flights.filter(function(flight) {
                    let flightDatetime = new Date(flight.departureDate);
                    let desiredDeparture = new Date(
                    flightDatetime.getFullYear(),
                    flightDatetime.getMonth(),
                    flightDatetime.getDate(),
                    departureHours,
                    departureMinutes
                );
                let flightSchedule = flightDatetime.getTime();
                let desiredSchedule = desiredDeparture.getTime();
                return flightSchedule >= desiredSchedule;
            });
        }

        if (arrival) {

            let [arrivalHours, arrivalMinutes] = arrival.split(':').map(Number);

            flights = flights.filter(function(flight) {
                    let flightDatetime = new Date(flight.arrivalDate);
                    let desiredArrival = new Date(
                    flightDatetime.getFullYear(),
                    flightDatetime.getMonth(),
                    flightDatetime.getDate(),
                    arrivalHours,
                    arrivalMinutes
                );
                let flightSchedule = flightDatetime.getTime();
                let desiredSchedule = desiredArrival.getTime();
                return flightSchedule <= desiredSchedule;
            });
        }

        return flights;
    }

    return{
        filterBySchedule
    }
};