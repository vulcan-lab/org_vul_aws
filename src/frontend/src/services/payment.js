import Stripe from 'stripe';

const secret_key = "sk_test_51PhwbjDWE31jyBLsdskMA59Bk8WnJjLJbryHy5QYa9KPu73aYL2yjc4P29hiVe2bugGQuuYG8sLo8p4GuJK5RKgQ00yBTKf5ET";

const stripe = new Stripe(secret_key)

export async function proccessPayment({
    paymentToken,
    outboundFlight,
    customerEmail
}){

    if(!paymentToken) throw 'Invalid payment token';

    const chargeData = {
        amount: outboundFlight.ticketPrice,
        currency: outboundFlight.ticketCurrency,
        source: paymentToken.details.id,
        description: `Payment by ${customerEmail}`,
        receipt_email: customerEmail
    };

    try {
        const chargeToken = await stripe.charges.create(chargeData);
        return chargeToken;
    } catch (error) {
        throw new Error(`Payment failed: ${error.message}`);
    }
}