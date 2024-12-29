const express = require("express");
const Categories = express.Router();
const {
  GetCategories,
  GetCategory,
  CreateNewCategory,
  UpdateCategory,
  DeleteCategory,
} = require("./CategoryController");

Categories.get("/restaurant_categories/:restaurant", GetCategories);
Categories.get("/:category", GetCategory);
Categories.post("/create_new_category", CreateNewCategory);
Categories.put("/update_category/:id", UpdateCategory);
Categories.delete("/delete_category/:id", DeleteCategory);

module.exports = Categories;
