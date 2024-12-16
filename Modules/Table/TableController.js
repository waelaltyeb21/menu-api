const { default: mongoose, isValidObjectId } = require("mongoose");
const io = require("../../Public");
const TableModel = require("./TableModel");
const { allOrders } = require("../Order/OrderController");
const {
  SendNotificationToRestaurant,
} = require("../Notification/NotificationController");

const TableController = {
  // Get All Tables
  Testing: async (req, res) => {
    const { id } = req.params;
    try {
      if (isValidObjectId(id)) {
        const orders = await allOrders(id);
        const tables = await TableModel.find({ restaurant: id }).sort({
          tableID: 1,
        });
        return res.status(200).json({ orders: orders, tables: tables });
      }
      return res.status(400).json({ msg: "Invalid Restaurant" });
    } catch (error) {
      return res.status(500).json({ msg: "Unexpacted Error" });
    }
  },
  GetTables: async (req, res) => {
    const { restaurant } = req.params;
    try {
      if (isValidObjectId(restaurant)) {
        const tables = await TableModel.find({
          restaurant: restaurant,
        });
        if (!tables) return res.status(400).json({ msg: "No Tables Found" });
        return res.status(200).json({ tables: tables, msg: "All Tables" });
      }
    } catch (error) {
      return res.status(500).json({ msg: "Somthing Went Wrong!" });
    }
  },
  // Get Table By ID
  GetTable: async (req, res) => {
    const { tableID } = req.params;
    try {
      // Check If TableID Is Valid
      if (isValidObjectId(tableID)) {
        // If It's => Find
        const table = await TableModel.findById(tableID);
        // If Found => 200 OK Response
        if (table)
          return res.status(200).json({ msg: "Table Found", table: table });
        // If Not Found => 400 Response
        return res.status(400).json({ msg: "Table Not Found" });
      } else {
        // If Not Valid TableID
        return res.status(400).json({ msg: "Not Valid Table ID" });
      }
    } catch (error) {
      return res.status(500).json({ msg: "Somthing Went Wrong!" });
    }
  },
  // Create New Table
  CreateNewTable: async (req, res) => {
    const { tablesLength, tableLetter, restaurantID } = req.body;
    try {
      if (isValidObjectId(restaurantID)) {
        if (!tablesLength || !tableLetter)
          return res.status(400).json({ msg: "Invalid Values" });

        const newTables = [];
        Array.from({ length: tablesLength }).map((table, index) => {
          newTables[index] = {
            tableID: `${tableLetter}${index + 1}`,
            restaurant: restaurantID,
          };
        });

        // Insert New Tables
        const added = await TableModel.insertMany(newTables);

        if (added) {
          const tables = await TableModel.find({ restaurant: restaurantID });
          // Send Notification To Restaurant
          SendNotificationToRestaurant(
            req.app.get("io"),
            restaurantID,
            tables,
            "New-Tables"
          );
        }
        return res.status(200).json({ msg: "Created Successfuly" });
      }
      return res.status(400).json({ msg: "Invalid Restaurant" });
    } catch (error) {
      return res.status(500).json({ msg: "Somthing Went Wrong!" });
    }
  },
  // Update Table
  UpdateTable: async (req, res) => {
    try {
    } catch (error) {
      return res.status(500).json({ msg: "Somthing Went Wrong!" });
    }
  },
  // Delete Table
  DeleteTable: async (req, res) => {
    const { id } = req.params;
    try {
      if (isValidObjectId(id)) {
        const table = await TableModel.findByIdAndDelete(id);
        if (table) {
          return res.status(200).json({ msg: "تم حذف الطاولة" });
        }
        return res.status(400).json({ msg: "حدث خطأ عند الحذف" });
      }
      return res.status(400).json({ msg: "Invalid Table" });
    } catch (error) {
      return res.status(500).json({ msg: "Somthing Went Wrong!" });
    }
  },
};
module.exports = TableController;
