const { default: mongoose, isValidObjectId } = require("mongoose");
const RestaurantModel = require("./RestaurantModel");
const DishModel = require("../Dish/DishModel");
const TableModel = require("../Table/TableModel");
const {
  GetDoc,
  UpdateDoc,
  CreateNewDoc,
} = require("../../Config/DbQueries/DbQueries");

const RestaurantController = {
  // Get All Restaurants
  GetRestaurant: async (req, res) => {
    const { restaurant } = req.params;
    try {
      if (isValidObjectId(restaurant)) {
        const [restaurantData] = await RestaurantModel.aggregate([
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
              localField: "id",
              foreignField: "categories._id",
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
            $lookup: {
              from: "orders",
              localField: "restaurant",
              foreignField: "id",
              as: "orders",
            },
          },
        ]);

        const supervisor = await RestaurantModel.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(restaurant),
            },
          },
          {
            $lookup: {
              from: "supervisors",
              localField: "restaurant",
              foreignField: "id",
              as: "supervisors",
            },
          },
        ]);

        // Top 5 Dishes
        const dishes = await DishModel.aggregate([
          {
            $match: {
              restaurant: new mongoose.Types.ObjectId(restaurant),
            },
          },
          {
            $group: {
              _id: "$_id",
              name: { $first: "$name" },
              NumberOfOrders: {
                $sum: "$NumberOfOrders",
              },
            },
          },
          {
            $sort: {
              NumberOfOrders: -1,
            },
          },
          {
            $limit: 5,
          },
          {
            $project: {
              __v: 0,
            },
          },
        ]);

        // Get Orders On Proccessing
        const OrdersOnProccessing = restaurantData?.orders?.filter(
          (order) => order?.orderStatus?.isProccessing
        );

        // Get Expacted Salary From Orders On Proccessing
        const expactedEarnings = OrdersOnProccessing?.reduce(
          (prv, cur) => prv + cur.total,
          0
        );
        const ResponseData = {
          earnings: restaurantData?.earnings,
          expactedEarnings: expactedEarnings,
          totalCustomers: restaurantData?.totalCustomers,
          ordersDetails: restaurantData?.ordersDetails,
          ordersOnProccess: OrdersOnProccessing?.length,
          dishesLength: restaurantData?.dishes.length,
          categoriesLength: restaurantData?.categories.length,
          tablesLength: restaurantData?.tables.length,
          ordersLength: restaurantData?.orders.length,
          dishes: dishes,
        };

        // If Dishes Found
        if (restaurantData) return res.status(200).json(ResponseData);
        return res.status(400).json({ msg: "No Data Found" });
      }
      return res.status(400).json({ msg: "Invalid Restaurant" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
  // Get All Restaurants
  GetRestaurants: async (req, res) => {
    try {
      const restaurants = await RestaurantModel.find();
      return res.status(200).json(restaurants);
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
  // Get Restaurant Dishes
  GetRestaurantDishes: async (req, res) => {
    const { restaurantID, tableID } = req.params;
    try {
      if (isValidObjectId(restaurantID) && isValidObjectId(tableID)) {
        // Table && Restaurant Data
        const currentTime = new Date().getHours();
        const table = await TableModel.findById(tableID);
        const restaurant = await RestaurantModel.findById(restaurantID);
        // ---------------------------------------------------------------
        // If Restaurant Doesn't Exist
        if (!restaurant)
          return res.status(400).json({
            msg: {
              ar: "هذا المطعم ليس موجودا",
              en: "This Restaurant Is Not Registreted Yet!",
            },
            restaurant,
          });
        // If Restaurant Is Not Active
        if (!restaurant.active) {
          res.status(400).json({
            msg: {
              ar: "هذا المطعم متوقف عن العمل مؤقتا",
              en: "This Restaurant Is Out Of Service Right Now.",
            },
          });
        }
        // If Restaurant Is Closed
        if (
          parseInt(restaurant.shift.from) >= currentTime &&
          parseInt(restaurant.shift.to) <= currentTime
        )
          return res.status(400).json({
            msg: {
              ar: "المطعم مغلق في هذه الوقت",
              en: "Restaurant Is Close Right Now",
            },
          });
        // ---------------------------------------------------------------
        // If Table Doesn't Exist
        if (!table)
          return res.status(400).json({
            msg: {
              ar: "هذه الطاولة غير مسجلة",
              en: "This Table Is Not Registered",
            },
            restaurant,
          });
        // If Table Not Active
        if (!table.active)
          return res.status(400).json({
            msg: {
              ar: "هذه الطاولة محجوزة",
              en: "This Table Has Been Booked",
            },
          });
        // ---------------------------------------------------------------
        const [restaurantData] = await RestaurantModel.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(restaurantID),
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
            $project: {
              _id: 0,
              restaurant: {
                _id: "$_id",
                name: "$name",
                coords: "$coords",
                shift: "$shift",
                active: "$active",
              },
              categories: "$categories",
              dishes: "$dishes",
            },
          },
        ]);
        // ---------------------------------------------------------------
        if (restaurantData)
          return res.status(200).json({
            ...restaurantData,
            table,
          });
      }
      // ---------------------------------------------------------------
      // Invalid Restaurant
      return res.status(401).json({
        msg: {
          ar: "محاولة لادخال الرابط مباشرة",
          en: "Attempting To Enter Restaurant Or Table ID Manually!",
        },
      });
    } catch (error) {
      return res.status(500).json({
        msg: { ar: "حدث خطأ ما", en: "Something Went Wrong!" },
        error: error.message,
      });
    }
  },
  // Create New Restaurant
  CreateNewRestaurant: async (req, res) => {
    const { name, shift, coords, logo, active } = req.body;
    try {
      const RestaurantData = { name, shift, coords, logo, active };
      const NewRestaurant = await CreateNewDoc(
        RestaurantModel,
        { name: name },
        RestaurantData
      );
      // Check If Restaurant Exist Or Not
      if (!NewRestaurant)
        return res.status(400).json({ msg: "هذا المطعم موجود بالفعل" });
      // Return A Response To FrontEnd
      return res.status(201).json({ msg: "تم اضافة مطعم جديد" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
  // Update Restaurant
  UpdateRestaurant: async (req, res) => {
    const { id, name, shift, coords, distance } = req.body;
    try {
      if (isValidObjectId(id)) {
        const RestaurantData = {
          name,
          shift,
          coords,
          distanceToOrder: distance,
        };
        const RestaurantToUpdate = await UpdateDoc(
          RestaurantModel,
          id,
          RestaurantData
        );

        if (!RestaurantToUpdate)
          return res.status(400).json({ msg: "تعذر تحديث بيانات المطعم" });
        return res.status(200).json({ msg: "تم تحديث بيانات المطعم" });
      }
      return res.status(400).json({ msg: "Invalid Restaurant" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
  // Delete Restaurant
  DeleteRestaurant: async (req, res) => {
    try {
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
};
module.exports = RestaurantController;
