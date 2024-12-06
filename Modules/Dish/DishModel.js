const mongoose = require("mongoose");
const DishSchema = new mongoose.Schema({
  name: {
    type: Object,
    // required: true,
  },
  price: {
    type: Number,
    // required: true,
  },
  image: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "categories",
    // required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "resturants",
    required: true,
  },
  NumberOfOrders: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date,
  },
});
const DishModel = mongoose.model("dishes", DishSchema);
module.exports = DishModel;
