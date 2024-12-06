const express = require("express");
const TableController = require("./TableController");
const Tables = express.Router();

Tables.get("/restaurant/:id", TableController.Testing);
Tables.get("/:restaurant", TableController.GetTables);
Tables.get("/table/:tableID", TableController.GetTable);
Tables.post("/create_new_tables", TableController.CreateNewTable);
Tables.put("/update_table", TableController.UpdateTable);
Tables.delete("/delete_table/:id", TableController.DeleteTable);

module.exports = Tables;
