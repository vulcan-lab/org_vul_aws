describe('Flight CREATE API E2E Tests', () => {
 
    const username = 'Delpipi';
    const password = 'delpipi@2024';
    const userPoolWebClientId = '5vv6fgbk1r8n94cvuqfalpcbu1';
    const url = 'https://u3vocbvfnzf5tabczp2enrgbwm.appsync-api.us-east-1.amazonaws.com/graphql';

    before(() => {
        cy.signIn(username, password, userPoolWebClientId);
    });

    it('should create a new flight', () => {

        const flightData = {
            departureDate: "2019-12-11T12:00+0000",
            departureAirportCode: "LGW",
            departureAirportName: "London Gatwick",
            departureCity: "London",
            departureLocale: "Europe/London",
            arrivalDate: "2019-12-11T17:30+0000",
            arrivalAirportCode: "MAD",
            arrivalAirportName: "Madrid Barajas",
            arrivalCity: "Madrid",
            arrivalLocale: "Europe/Madrid",
            ticketPrice: 350,
            ticketCurrency: "EUR",
            flightNumber: 1820,
            seatCapacity: 4
        };

        cy.request({
            method: 'POST',
            url: `${url}`,
            headers: {
                Authorization: localStorage.getItem(`CognitoIdentityServiceProvider.${userPoolWebClientId}.${username}.idToken`),
            },
            body: {
                query: `
                mutation CreateFlight($input: CreateFlightInput!) {
                    createFlight(input: $input) {
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
                    }
                }
                `,
                variables: {
                input: flightData
                }
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data.createFlight).to.have.property('departureDate');
            expect(response.body.data.createFlight.departureAirportCode).to.eq(flightData.departureAirportCode);
        });

    });
});