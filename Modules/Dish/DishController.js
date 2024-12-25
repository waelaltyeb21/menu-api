const { isValidObjectId, default: mongoose } = require("mongoose");
const RestaurantModel = require("../Restaurant/RestaurantModel");
const DishModel = require("./DishModel");
const CategoryModel = require("../Category/CategoryModel");
const {
  GetDoc,
  GetAllDocs,
  CreateNewDoc,
  UpdateDoc,
  DeleteDoc,
} = require("../../Config/DbQueries/DbQueries");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
// Create Dish With Check
// const dishes = await CreateNewDoc(DishModel, { name, category }, data);
// console.log("Dish: ", dishes);

const FormatNames = (Dish, Restaurant) => {
  console.log(Dish, Restaurant);
  const RestaurantName = Restaurant.split(" ").join("-");
  const ImageFileName = `${Dish.split(" ").join(
    "-"
  )}-${new Date().getTime()}.webp`;
  console.log(RestaurantName, ImageFileName);
  return { Restaurant: RestaurantName, ImageFileName };
};

const SaveDishImage = async (Buffer, ImageFileName, RestaurantName) => {
  // Restaurant Folder Path
  const FolderPath = path.resolve(__dirname, `../../Uploads/${RestaurantName}`);
  console.log("Root: ", FolderPath);
  // // Create Restaurant Folder If Not Exist
  if (!fs.existsSync(FolderPath)) {
    console.log("Created");
    fs.mkdirSync(FolderPath, { recursive: true });
  }
  const ImagePath = path.join(FolderPath, ImageFileName);
  // Add Image
  const compressedImageBuffer = await sharp(Buffer)
    // .resize(800) // Resize the image (optional)
    .webp({ quality: 80 }) // Compress to Webp with quality 80 (optional)
    .toBuffer();
  // Write Image File To Uploads Folder
  fs.writeFileSync(ImagePath, compressedImageBuffer);
};

const DishController = {
  Testing: async (req, res) => {
    const { restaurant } = req.params;
    try {
      // null / object
      const dishes = await DeleteDoc(DishModel, "67386b75343c9244dacfea79");
      if (!dishes) return res.status(400).json({ msg: "Failed" });
      if (dishes) return res.status(201).json({ msg: "Created" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
  // All Dishes
  GetDishes: async (req, res) => {
    const { restaurant } = req.params;
    try {
      if (isValidObjectId(restaurant)) {
        const [dishesWithCategories] = await RestaurantModel.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(restaurant),
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "_id",
              foreignField: "restaurant",
              as: "categories",
            },
          },
          {
            $lookup: {
              from: "dishes",
              localField: "categories._id",
              foreignField: "category",
              as: "dishes",
            },
          },
          {
            $lookup: {
              from: "tables",
              localField: "_id",
              foreignField: "restaurant",
              as: "tables",
            },
          },
          {
            $project: {
              _id: 0,
              categories: "$categories",
              dishes: "$dishes",
              tables: "$tables",
            },
          },
        ]);
        // If Dishes Found
        if (dishesWithCategories)
          return res.status(200).json(dishesWithCategories);
        return res.status(400).json({ msg: "No Dish Found" });
      }
      return res.status(400).json({ msg: "Invalid Restaurant" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },

  // Get Dish By ID
  GetDish: async (req, res) => {
    const { id, restaurant } = req.params;
    try {
      if (isValidObjectId(id)) {
        const DishDetails = await GetDoc(DishModel, id);
        const CategoriesData = await GetAllDocs(CategoryModel, {
          restaurant: restaurant,
        });
        console.log("Is There: ", !CategoriesData);
        // Check If There Is Data
        if (!DishDetails || !CategoriesData)
          return res.status(400).json({ msg: "هذا الصنف غير موجود" });

        return res
          .status(200)
          .json({ dish: DishDetails, categories: CategoriesData });
      }
      return res.status(400).json({ msg: "Invalid Data" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },

  // Create New Dish
  CreateNewDish: async (req, res) => {
    const { name_ar, name_en, price, category, restaurant, active } = req.body;
    try {
      const name = { ar: name_ar, en: name_en };
      const restaurantData = await GetDoc(RestaurantModel, restaurant);
      // Prepare Restaurant Folder Name
      const { ImageFileName, Restaurant } = FormatNames(
        name.en,
        restaurantData.name.en
      );

      if (req.file) {
        // Save Image
        await SaveDishImage(req.file.buffer, ImageFileName, Restaurant);
        // return res.status(400).json({ msg: "No File Uploaded" });
      }
      // Dish Object
      const DishData = {
        name,
        price,
        category,
        restaurant,
        active,
        image: ImageFileName,
      };
      // Create Dish With Checking If Exist Or Not
      const NewDish = await CreateNewDoc(
        DishModel,
        { name, category },
        DishData
      );

      if (!NewDish)
        return res.status(400).json({ msg: "هذا الصنف موجود بالفعل" });
      // Response To Client Side
      return res.status(201).json({ msg: "تم اضافة صنف جديد بنجاح" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "حدث خطأ اثناء انشاء صنف جديد", error: error });
    }
  },

  // Update Dish
  UpdateDish: async (req, res) => {
    const {
      id,
      name_ar,
      name_en,
      category,
      dishImage,
      price,
      active,
      restaurant,
    } = req.body;
    try {
      const name = { ar: name_ar, en: name_en };
      if (isValidObjectId(id) && isValidObjectId(restaurant)) {
        const data = await RestaurantModel.findById(restaurant);
        const { Restaurant, ImageFileName } = FormatNames(
          name.en,
          data.name.en
        );

        const ImagePath = path.resolve(
          __dirname,
          `../../Uploads/${Restaurant}/${dishImage}`
        );

        if (req.file) {
          if (fs.existsSync(ImagePath)) {
            fs.unlink(ImagePath, (err) => {
              console.log(err);
            });
          }
          // Save Image
          await SaveDishImage(req.file.buffer, ImageFileName, Restaurant);
        }

        const DishData = {
          name,
          image: ImageFileName,
          category,
          price,
          active,
        };
        const DishToUpdate = await UpdateDoc(DishModel, id, DishData);

        // If Not Found
        if (!DishToUpdate)
          return res.status(400).json({ msg: "تعذر العثور على الصنف" });
        return res.status(200).json({ msg: "تم تعديل الصنف" });
      }
      return res.status(400).json({ msg: "البيانات غير صالحة" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },

  // Delete Dish
  DeleteDish: async (req, res) => {
    const { id } = req.params;
    try {
      const DishToDelete = await DeleteDoc(DishModel, id);
      if (!DishToDelete)
        return res.status(400).json({ msg: "محاولة لحذف عنصر غير موجود" });
      return res.status(200).json({ msg: "تم حذف الصنف بنجاح" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "حدث خطأ اثناء حذف الصنف", error: error });
    }
  },
};
module.exports = DishController;
