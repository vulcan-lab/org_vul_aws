describe('FETCH BOOKING LIST BY STATUS', () => {

    const username = 'Delpipi';
    const password = 'delpipi@2024';
    const userPoolWebClientId = '5vv6fgbk1r8n94cvuqfalpcbu1';
    const url = 'https://u3vocbvfnzf5tabczp2enrgbwm.appsync-api.us-east-1.amazonaws.com/graphql';

    var userId = 'd44814c8-c031-7047-511d-8d55cddc1f01';

    beforeEach(() => {
        cy.signIn(username, password, userPoolWebClientId);
    });
    
    it('shoud fetch a list of booking', ()=> {
        const fetchData = {
            customer: userId,
            status: {
                eq: "UNCONFIRMED"
            },
            limit: 3
        }

        cy.request({
            method: 'POST',
            url: url,
            headers: { 
                Authorization: localStorage.getItem(`CognitoIdentityServiceProvider.${userPoolWebClientId}.${username}.idToken`),
            },
            body: {
                query : `
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
                `,
                variables: fetchData
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data.getBookingByStatus.items).to.be.an('array');
        });
    });

});