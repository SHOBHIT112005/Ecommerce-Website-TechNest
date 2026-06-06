import { model, models, Schema } from "mongoose";

const OrderSchema = new Schema({
    products: Object,
    name: String,
    email: String,
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    address: String,
    city: String,
    status: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending",
    },
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 5 },
    totalAmount: { type: Number, default: 0 },
    paid: {type:Number,default:0},
},{timestamps : true, collection: "Orders"})

const Order = models?.Order || model('Order', OrderSchema);

export default Order;
