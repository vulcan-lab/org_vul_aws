import { generateClient } from "aws-amplify/api"
import { getLoyalty } from "../../../graphql/queries";

const client = generateClient();

export const LoyalService = {
    async getLoyalty( userId ) {
        return await client.graphql({query: getLoyalty, variables: { customer: userId}});
    }
}