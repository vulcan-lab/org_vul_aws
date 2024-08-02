import { generateClient } from "aws-amplify/api"
import { getLoyalty } from "../../../graphql/queries";

const client = generateClient();

export const LoyalService = {
    async getLoyalty( userId ) {
        try {
            const res = await client.graphql({query: getLoyalty, variables: { customer: userId}});
            return res.data.datagetLoyalty.Loyalty;
        } catch (error) {
            throw new Error("get customer loyalty failed : ", error.message);
        }
    }
}