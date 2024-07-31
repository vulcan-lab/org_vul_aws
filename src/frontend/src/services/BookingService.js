import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import * as mutations from '../../../graphql/mutations';
import * as queries from '../../../graphql/queries';
import { useQuasar } from 'quasar';
import { proccessPayment } from './payment';

const client = generateClient();
const $q = useQuasar();

export const BookingService = {

    async createBooking( booking ) {
        return await client.graphql({query: mutations.createBooking, variables: { input: booking }});
    },

    async updateBooking( booking ) {
        return await client.graphql({ query: mutations.updateBooking, variables: { input: booking }});
    },

    async deleteBooking( bookingId ) {
        return await client.graphql({query: mutations.deleteBooking, variables: { input: {id: bookingId}}});
    },

    async processBooking ( { paymentToken, outboundFlight } ) {

        try {
            const customerEmail = (await fetchUserAttributes()).email;

            //let chargeToken = await proccessPayment({paymentToken, outboundFlight, customerEmail});

            // const processBookingInput = {
            //     paymentToken: chargeToken,
            //     bookingOutboundFlightId: outboundFlight.id
            // }
            //const res = await client.graphql({query: mutations.processBooking, variables: { input: processBookingInput}});

            // const bookingData = {
            //     status: "UNCONFIRMED",
            //     paymentToken: chargeToken,
            //     bookingOutboundFlightId: outboundFlight.id
            // }

            // const res =  await client.graphql({query: mutations.createBooking, variables: { input: bookingData}});
            // return res.data.createBooking.id;

            return 'aaf';

        } catch (error) {
            //console.error(`Procces booking failed, ${error.message}`);
            throw new Error(`Procces booking failed, ${error.message}`);
        }
        
    },

    async getBooking( bookingId ) {
        return await client.graphql({ query: queries.getBooking, variables: {id: bookingId}});
    },

    async listBookings( filter ) {
        return await client.graphql({query: queries.listBookings, variables: { input: {filter: filter}}});
    },

    async getBookingByStatus( status ) {
        try {
            const userId = (await fetchUserAttributes()).sub;
            const fetchData = {
                customer: userId,
                status: {
                    eq: status
                },
                limit: 3
            }

            const res = await client.graphql({query: queries.getBookingByStatus, variables: fetchData});
            return  res.data.getBookingByStatus.items;

        } catch (error) {
            //console.error(`Get booking by ${status} failed: ${error.message}`);
            throw new Error(`Get booking by ${status} failed: ${error.message}`);
        }
    }
}