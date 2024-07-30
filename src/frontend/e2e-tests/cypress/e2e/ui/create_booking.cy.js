describe('Flight CREATE BOOKING E2E tests', () => {

    const username = 'Delpipi';
    const password = 'delpipi@2024';
    const userPoolWebClientId = '5vv6fgbk1r8n94cvuqfalpcbu1';
    const url = 'https://u3vocbvfnzf5tabczp2enrgbwm.appsync-api.us-east-1.amazonaws.com/graphql';

    const FLIGHT_ID = '41fd6d39-e35f-426c-af34-c5c6f3edbaf4';

    beforeEach(() => {
        cy.signIn(username, password, userPoolWebClientId);
    });
    
    it('should create a new booking', () => {
        const BookingData = {
            status: "UNCONFIRMED",
            paymentToken: "add-codl-dd24",
            bookingOutboundFlightId: FLIGHT_ID
        }
    

        cy.request({
            method: 'POST',
            url: url,
            headers: { 
                Authorization: localStorage.getItem(`CognitoIdentityServiceProvider.${userPoolWebClientId}.${username}.idToken`),
            },
            body: {
                query : `
                mutation CreateBooking(
                    $input: CreateBookingInput!
                    $condition: ModelBookingConditionInput
                ) {
                    createBooking(input: $input, condition: $condition) {
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
                `,
                variables: {
                    input: BookingData
                }
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data.createBooking).to.have.property('id');
        });
    });
});