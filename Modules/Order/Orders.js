const express = require("express");
const {
  GetOrders,
  GetOrderForClient,
  GetOrder,
  CreateNewOrder,
  AcceptOrder,
  ComplateOrder,
  UpdateOrder,
  DeleteOrder,
  getOrdersOfWeek,
} = require("./OrderController");
const Orders = express.Router();

Orders.get("/:restaurant", GetOrders);
Orders.get("/order/:id", GetOrder);
Orders.get("/client_order/details/:id", GetOrderForClient);
Orders.post("/create_new_order", CreateNewOrder);
Orders.put("/accept_new_order", AcceptOrder);
Orders.put("/complate_order", ComplateOrder);
Orders.put("/update_order", UpdateOrder);
Orders.delete("/delete_order/:id", DeleteOrder);
Orders.get("/orders/week_orders", getOrdersOfWeek);

module.exports = Orders;
