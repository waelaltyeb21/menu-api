const express = require("express");
const CategoryController = require("./CategoryController");
const Categories = express.Router();

Categories.get("/restaurant_categories/:restaurant", CategoryController.GetCategories);
Categories.get("/:category", CategoryController.GetCategory);
Categories.post("/create_new_category", CategoryController.CreateNewCategory);
Categories.put("/update_category/:id", CategoryController.UpdateCategory);
Categories.delete("/delete_category/:id", CategoryController.DeleteCategory);

module.exports = Categories;
