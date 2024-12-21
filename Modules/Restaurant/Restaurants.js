const express = require("express");
const RestaurantController = require("./RestaurantController");
const Restaurants = express.Router();

Restaurants.get("/:restaurant", RestaurantController.GetRestaurant);
Restaurants.get("/", RestaurantController.GetRestaurants);
// Restaurants.get("/:id", RestaurantController.GetRestaurant);
Restaurants.get("/restaurant/:restaurantID/:tableID", RestaurantController.GetRestaurantDishes);
Restaurants.post("/create_new_restaurant", RestaurantController.CreateNewRestaurant);
Restaurants.put("/update_restaurant", RestaurantController.UpdateRestaurant);
Restaurants.delete("/delete_restaurant", RestaurantController.DeleteRestaurant);

module.exports = Restaurants;