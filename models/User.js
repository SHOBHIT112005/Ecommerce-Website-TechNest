import { model, models, Schema } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, default: "" },
  email: { type: String, required: true },
  emailLower: { type: String, required: true, index: true },
  image: { type: String, default: "" },
  passwordHash: { type: String, default: "" },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  authProvider: { type: String, default: "guest" },
  isRegistered: { type: Boolean, default: false },
  lastLoginAt: { type: Date, default: null },
  orderHistory: [{ type: Schema.Types.ObjectId, ref: "Order" }],
}, { timestamps: true, collection: "Users" });

const User = models?.User || model("User", UserSchema);

export default User;
