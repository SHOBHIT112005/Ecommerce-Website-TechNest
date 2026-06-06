import { initMongoose } from "@/lib/mongoose";
import Stripe from "stripe";
import { buffer } from 'micro';
import Order from '@/models/Order';
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    await initMongoose();
    
    const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    try {
        const buf = await buffer(req);
        const signature = req.headers['stripe-signature'];
        const event = stripe.webhooks.constructEvent(buf, signature, signingSecret);

        if (event?.type === 'checkout.session.completed') {
            const metadata = event.data?.object?.metadata;
            const paymentStatus = event.data?.object?.payment_status;
            if (metadata?.orderId && paymentStatus === 'paid') {
                const updatedOrder = await Order.findByIdAndUpdate(
                    metadata.orderId,
                    { paid: 1, status: "completed" },
                    { new: true },
                ).exec();

                if (updatedOrder?.user) {
                    await User.findByIdAndUpdate(
                        updatedOrder.user,
                        { $addToSet: { orderHistory: updatedOrder._id } },
                    ).exec();
                }
            }
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Error:', err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
