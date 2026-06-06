import { initMongoose } from "../../lib/mongoose";
import Product from "../../models/Products";

export async function findAllProducts() {
    return Product.find().exec();
}


export default async function handle(req, res) {
    try {
        await initMongoose();
        const {ids} = req.query;
        if(ids) {
            const idsarray = ids.split(',');
            res.json(
                await Product.find({
                    '_id':{$in : idsarray}
                }).exec()
            )
        }
        else {
            res.json(await findAllProducts());
        }
    } catch (err) {
        console.error('Products error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
