const mongoose = require("mongoose");
const TableSchema = new mongoose.Schema({
  tableID: {
    type: String,
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "restaurants",
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});
const TableModel = mongoose.model("tables", TableSchema);
module.exports = TableModel;
