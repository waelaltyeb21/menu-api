const mongoose = require("mongoose");
const CategorySchema = new mongoose.Schema({
  name: {
    type: Object,
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "restaurants",
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date,
  }
});
const CategoryModel = mongoose.model("categories", CategorySchema);
module.exports = CategoryModel;
