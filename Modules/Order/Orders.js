const express = require("express");
const { OrderController } = require("./OrderController");
const Orders = express.Router();

Orders.get("/:restaurant", OrderController.GetOrders);
Orders.get("/order/:id", OrderController.GetOrder);
Orders.post("/create_new_order", OrderController.CreateNewOrder);
Orders.put("/accept_new_order", OrderController.AcceptOrder);
Orders.put("/complate_order", OrderController.ComplateOrder);
Orders.put("/update_order", OrderController.UpdateOrder);
Orders.delete("/delete_order/:id", OrderController.DeleteOrder);

module.exports = Orders;
