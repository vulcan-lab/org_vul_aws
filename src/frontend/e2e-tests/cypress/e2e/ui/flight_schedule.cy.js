describe('Flight SCHEDULE API E2E Tests', () => {
 
    const username = 'Delpipi';
    const password = 'delpipi@2024';
    const userPoolWebClientId = '5vv6fgbk1r8n94cvuqfalpcbu1';
    const url = 'https://u3vocbvfnzf5tabczp2enrgbwm.appsync-api.us-east-1.amazonaws.com/graphql';

    before(() => {
        cy.signIn(username, password, userPoolWebClientId);
    });

    it('Should get Flight by schedule', () => {
        const queryData = {
            arrivalAirportCodeDepartureDate: {
              beginsWith: {
                arrivalAirportCode: "MAD",
                departureDate: "2019-12-02"
              }
            },
            departureAirportCode: "LGW"
          };

        const idToken =  localStorage.getItem(`CognitoIdentityServiceProvider.${userPoolWebClientId}.${username}.idToken`);
        //cy.log('ID Token:', idToken);

        cy.request({
            method: 'POST',
            url: `${url}`,
            headers: {
                Authorization: `Bearer ${idToken}`
            },
            body: {
                query: `
                    query GetFlightBySchedule($arrivalAirportCodeDepartureDate: ModelFlightByDepartureScheduleCompositeKeyConditionInput, $departureAirportCode: String!) {
                        getFlightBySchedule(
                        arrivalAirportCodeDepartureDate: $arrivalAirportCodeDepartureDate,
                        departureAirportCode: $departureAirportCode
                        ) {
                        nextToken
                        items {
                            id
                            departureDate
                        }
                        }
                    }
                    `,
                variables: queryData
              }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data.getFlightBySchedule.items).to.be.an('array');
        });
    });
});