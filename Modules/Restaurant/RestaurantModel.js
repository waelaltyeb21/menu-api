const mongoose = require("mongoose");
const RestaurantSchema = new mongoose.Schema({
  name: {
    type: Object,
    required: true,
  },
  shift: {
    type: Object,
    required: true,
  },
  coords: {
    type: Object,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  distanceToOrder: {
    type: Number,
    default: 30,
  },
  ordersDetails: {
    type: Object,
  },
  earnings: {
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
const RestaurantModel = mongoose.model("restaurants", RestaurantSchema);
module.exports = RestaurantModel;
