const express = require("express");
const DishController = require("./DishController");
const upload = require("../../Services/UploadMedia");
const Dishes = express.Router();

Dishes.get("/:restaurant", DishController.GetDishes);
Dishes.get("/dish/:id/:restaurant", DishController.GetDish);
Dishes.post("/create_new_dish", upload.single("image"), DishController.CreateNewDish);
Dishes.put("/update_dish", upload.single("image"), DishController.UpdateDish);
Dishes.delete("/delete_dish/:id", DishController.DeleteDish);

module.exports = Dishes;
