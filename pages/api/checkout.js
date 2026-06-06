import Product from "@/models/Products";
import { initMongoose } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { applyRateLimit } from "@/lib/rateLimit";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const DELIVERY_FEE = 5;
export default async function handler(req,res) {
    try {
        const allowed = applyRateLimit(req, res, {
            keyPrefix: "checkout",
            windowMs: 60 * 1000,
            maxRequests: 20,
        });
        if (!allowed) return;

        await initMongoose();

        if(req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        
        const {name,address,city} = req.body;
        const authSession = await getServerSession(req, res, authOptions);
        const sessionEmail = authSession?.user?.email?.trim();
        if (!sessionEmail) {
            res.status(401).json({ error: 'Please sign in to place an order' });
            return;
        }

        const email = sessionEmail;
        const productIds = req.body.products?.split(',').filter(Boolean) || [];

        if (!name?.trim()) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }
        if (!address?.trim()) {
            res.status(400).json({ error: 'Address is required' });
            return;
        }
        if (!city?.trim()) {
            res.status(400).json({ error: 'City is required' });
            return;
        }
        if (!productIds.length || productIds.every(id => !id)) {
            res.status(400).json({ error: 'Cart is empty' });
            return;
        }

        const uniqIds = [...new Set(productIds)];
        const products = await Product.find({_id:{$in:uniqIds}}).exec();
        let line_items = [];
        let subtotal = 0;

        for(let productId of uniqIds) {
            const quantity = productIds.filter(id => id === productId).length;
            const product = products.find(p => p._id.toString() === productId);
            if (!product) continue;

            subtotal += product.price * quantity;
            line_items.push({
                quantity,
                price_data: {
                    currency : 'USD',
                    product_data : {name : product.name},
                    unit_amount : product.price * 100,
                }
            })
        }

        if (!line_items.length) {
            res.status(400).json({ error: 'No valid products found in cart' });
            return;
        }

        const totalAmount = subtotal + DELIVERY_FEE;
        const normalizedEmail = email.toLowerCase();

        const userDoc = await User.findOneAndUpdate(
            { emailLower: normalizedEmail },
            {
                $set: {
                    name: authSession?.user?.name || name.trim(),
                    email,
                    emailLower: normalizedEmail,
                    image: authSession?.user?.image || "",
                    authProvider: "credentials",
                    isRegistered: true,
                },
                $setOnInsert: {
                    role: "user",
                    orderHistory: [],
                },
            },
            { upsert: true, new: true },
        ).exec();

        const order = await Order.create({
            products: line_items,
            name,
            email,
            user: userDoc?._id || null,
            address,
            city,
            status: "pending",
            subtotal,
            deliveryFee: DELIVERY_FEE,
            totalAmount,
            paid:0,
        });

        if (userDoc?._id) {
            await User.findByIdAndUpdate(
                userDoc._id,
                { $addToSet: { orderHistory: order._id } },
            ).exec();
        }

        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            mode: 'payment',
            customer_email : email,
            success_url: `${req.headers.origin}/my-orders?refresh=orders`,
            cancel_url: `${req.headers.origin}/?canceled=true`,
            metadata: {orderId:order._id.toString()},
        });
        res.redirect(303, session.url);
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
