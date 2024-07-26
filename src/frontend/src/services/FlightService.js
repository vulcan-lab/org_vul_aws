import { generateClient } from 'aws-amplify/api';
import * as mutations from '../../../graphql/mutations';
import * as queries from '../../../graphql/queries';

const client = generateClient();

export const FlightService = {
    async createFlight(flight) {
        return await client.graphql({query: mutations.createFlight, variables: {input: flight}});
    },

    async updateFlight(flight) {
        return await client.graphql({query: mutations.updateFlight, variables: {input: flight}});
    },

    async deleteFlight(flightId) {
       return await client.graphql({query: mutations.deleteFlight, variables: { input: {id: flightId}}});
    },
    
    async getFlight(flightId) {
        return await client.graphql({query: queries.getFlight, variables: {input : {id : flightId}}});
    },

    async listFlights(filter) {
        return await client.graphql({query: queries.listFlights, variables: { filter: filter}});
    },

    async getFlightBySchedule(departureAirportCode, arrivalAirportCode, departureDate) {
        return await client.graphql({query: queries.getFlightBySchedule, 
            variables: { 
                arrivalAirportCodeDepartureDate: {
                    beginsWith: {
                    arrivalAirportCode: arrivalAirportCode, 
                    departureDate: departureDate
                    }
                }, 
                departureAirportCode: departureAirportCode
            }
        })
    }
};

