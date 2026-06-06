const { Schema, model, models } = require("mongoose");

const ProductSchema = new Schema({
    name: String,
    description: String,
    price: Number,
    categories: [String],
    picture: String,
}, { collection: "Products" });

const Product = models?.Product || model('Product', ProductSchema);

export default Product;
