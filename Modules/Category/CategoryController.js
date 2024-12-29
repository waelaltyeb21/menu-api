const { isValidObjectId, default: mongoose } = require("mongoose");
const CategoryModel = require("./CategoryModel");
const DishModel = require("../Dish/DishModel");
const {
  GetDoc,
  CreateNewDoc,
  UpdateDoc,
  GetAllDocs,
} = require("../../Config/DbQueries/DbQueries");

// Get All Categories
const GetCategories = async (req, res) => {
  const { restaurant } = req.params;
  try {
    if (isValidObjectId(restaurant)) {
      const Categories = await GetAllDocs(CategoryModel, {
        restaurant: restaurant,
      });
      // const Categories = await DishModel.aggregate([
      //   {
      //     $match: {
      //       restaurant: new mongoose.Types.ObjectId(restaurant),
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "categories",
      //       localField: "category",
      //       foreignField: "_id",
      //       as: "categories",
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: "$categories",
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: "$category",
      //       dishCount: { $sum: 1 },
      //       name: { $first: "$categories.name" },
      //       active: { $first: "$categories.active" },
      //     },
      //   },
      // ]);
      // Check If Not Found
      if (!Categories)
        return res
          .status(400)
          .json({ msg: "تعذر العثور على اقسام في هذا المطعم" });
      return res.status(200).json(Categories);
    }
    return res.status(400).json({ msg: "Invalid ID" });
  } catch (error) {
    return res.status(500).json({ msg: "Something Went Wrong!", error: error });
  }
};
// Get Category
const GetCategory = async (req, res) => {
  const { category } = req.params;
  try {
    if (isValidObjectId(category)) {
      const Category = await GetDoc(CategoryModel, category);
      const Dishes = await GetAllDocs(DishModel, { category: category });
      // If Not Found
      if (!Category)
        return res.status(400).json({ msg: "تعذر العثور على هذا القسم" });
      return res.status(200).json({ category: Category, dishes: Dishes });
    }
    return res.status(400).json({ msg: "Invalid Category" });
  } catch (error) {
    return res.status(500).json({ msg: "Something Went Wrong!", error: error });
  }
};
// Create New Category
const CreateNewCategory = async (req, res) => {
  const { name, restaurant, active } = req.body;
  try {
    const CategoryData = { name, restaurant, active };
    const NewCategory = await CreateNewDoc(
      CategoryModel,
      {
        name: name,
        restaurant: restaurant,
      },
      CategoryData
    );
    // If Category Exist
    if (!NewCategory)
      return res.status(400).json({ msg: "هذا القسم موجود بالفعل" });
    return res.status(201).json({
      msg: "تم اضافة قسم جديد بنجاح",
      data: {
        name,
        restaurant,
        active,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "حدث خطأ اثناء انشاء قسم جديد", error: error });
  }
};
// Update Category
const UpdateCategory = async (req, res) => {
  const { name, active } = req.body;
  const { id } = req.params;
  try {
    if (isValidObjectId(id)) {
      const CategoryData = { name, active };
      const CategoryToUpdate = await UpdateDoc(CategoryModel, id, CategoryData);
      // If Not Updated
      if (!CategoryToUpdate)
        return res.status(400).json({ msg: "تعذر العثور على القسم" });
      return res.status(200).json({ msg: "تم تحديث بيانات القسم بنجاح" });
    }
    return res.status(400).json({ msg: "Invalid Category" });
  } catch (error) {
    return res.status(500).json({ msg: "Something Went Wrong!", error: error });
  }
};
// Delete Category
const DeleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    if (isValidObjectId(id)) {
      const category = await CategoryModel.findByIdAndDelete(id);
      const dishes = await DishModel.find({ category: id });
      if (!category)
        return res.status(400).json({ msg: "محاولة لحذف عنصر غير موجود" });
      if (dishes.length != 0) {
        // If There Is Dishes In The Category
        const dishesToDelete = await DishModel.deleteMany({
          _id: { $in: dishes },
        });
        if (dishesToDelete.deletedCount)
          return res.status(200).json({ msg: "تم حذف القسم بنجاح" });
      } else {
        if (category)
          return res.status(200).json({ msg: "تم حذف القسم بنجاح" });
      }
    }
    return res.status(400).json({ msg: "Invalid Category" });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "حدث خطأ اثناء حذف القسم", error: error });
  }
};

module.exports = {
  GetCategories,
  GetCategory,
  CreateNewCategory,
  UpdateCategory,
  DeleteCategory,
};
