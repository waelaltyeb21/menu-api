const { isValidObjectId, default: mongoose } = require("mongoose");
const OrderModel = require("./OrderModel");
const TableModel = require("../Table/TableModel");
const RestaurantModel = require("../Restaurant/RestaurantModel");
const DishModel = require("../Dish/DishModel");
const io = require("../../Public");
const {
  SendNotificationToRestaurant,
  SendNotificationToClient,
} = require("../Notification/NotificationController");

const allOrders = async (restaurant) => {
  const orders = await OrderModel.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurant),
      },
    },
    {
      $unwind: "$orders",
    },
    {
      $lookup: {
        from: "tables",
        foreignField: "_id",
        localField: "table",
        as: "tables",
      },
    },
    {
      $unwind: "$tables",
    },
    {
      $project: {
        table: 1,
        tableID: "$tables.tableID",
        orderStatus: 1,
        orderID: "$_id",
        orderStatus: 1,
        orders: 1,
        user: 1,
        total: 1,
        createdAt: 1,
      },
    },
    {
      $lookup: {
        from: "dishes",
        localField: "orders.order",
        foreignField: "_id",
        as: "dishes",
      },
    },
    {
      $unwind: "$dishes",
    },
    {
      $group: {
        _id: "$table",
        user: { $first: "$user" },
        orderStatus: { $first: "$orderStatus" },
        tableName: { $first: "$tableID" },
        orderID: { $first: "$orderID" },
        createdAt: { $first: "$createdAt" },
        totalOrders: { $sum: 1 },
        totalQuntity: { $sum: "$orders.quantity" },
        total: {
          $sum: { $multiply: ["$dishes.price", "$orders.quantity"] },
        },
        dishes: {
          $push: {
            name: "$dishes.name",
            quantity: "$orders.quantity",
            price: "$dishes.price",
          },
        },
      },
    },
  ]);
  return orders;
};

const InitialStatus = (status) => {
  const initial = {
    isRequested: false,
    isProccessing: false,
    isPaid: false,
  };

  return {
    ...initial,
    [status]: true,
  };
};

const OrderController = {
  // Get All Orders
  GetOrders: async (req, res) => {
    const { restaurant } = req.params;
    try {
      if (isValidObjectId(restaurant)) {
        const tables = await TableModel.find({ restaurant: restaurant });
        const orders = await allOrders(restaurant);
        if (orders)
          return res.status(200).json({ orders: orders, tables: tables });
        return res.status(400).json({ msg: "لا توجد طلبات" });
      }
      return res.status(400).json({ msg: "Invalid Restaurant" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
  // Get Order
  GetOrder: async (req, res) => {
    const { id } = req.params;
    try {
      if (isValidObjectId(id)) {
        const [order] = await OrderModel.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(id),
            },
          },
          {
            $lookup: {
              from: "dishes",
              localField: "order",
              foreignField: "id",
              as: "dishes",
            },
          },
        ]);

        if (order) return res.status(200).json(order);
        return res.status(400).json({ msg: "تعذر العثور على الطلب" });
      }
      // -----------------------------------------------
      return res.status(400).json({ msg: "Invalid Order" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
  // Create New Order => IsRequested
  CreateNewOrder: async (req, res) => {
    const { orders, restaurant, table, total, user } = req.body;
    try {
      if (isValidObjectId(table) && isValidObjectId(restaurant)) {
        // Orders Data
        const data = {
          orders,
          restaurant,
          table,
          total,
          user,
          orderStatus: {
            isRequested: true,
            isProccessing: false,
            isPaid: false,
          },
        };

        // Update The Times Of Dish Has Been Ordered
        orders.map(async (order) => {
          await DishModel.findByIdAndUpdate(order.order, {
            $inc: { NumberOfOrders: order.quantity },
          });
        });

        // Update Restaurant Data
        await RestaurantModel.findByIdAndUpdate(restaurant, {
          $inc: {
            "ordersDetails.totalRequestedOrders": 1,
            "ordersDetails.totalCustomers": 1,
          },
        });

        // Check Work Hours
        const workHours = await RestaurantModel.findById(restaurant);
        const currentTime = new Date().getHours();
        const OrderTime =
          parseInt(workHours.shift.from) >= currentTime &&
          parseInt(workHours.shift.to) <= currentTime;

        // If Restaurant Is Close
        if (OrderTime)
          return res.status(400).json({
            msg: {
              ar: "المطعم مغلق في هذه الوقت",
              en: "Restaurant Is Close Right Now",
            },
          });

        // If Table Is Not Active
        const checkTable = await TableModel.findById(table);
        if (!checkTable.active)
          return res.status(400).json({
            msg: {
              ar: "هذه الطاولة محجوزة بالفعل",
              en: "This Table Is Already Booked",
            },
          });

        const createOrder = await OrderModel.create(data);
        // const updateTable = await TableModel.findByIdAndUpdate(
        //   { _id: table },
        //   {
        //     active: false,
        //   }
        // );

        // Request For New Order
        // -----------------------------------------------
        //  && updateTable
        if (createOrder) {
          const ordersDetails = await allOrders(restaurant);
          const order = {
            msg: "هنالك طلب جديد!",
            orders: ordersDetails,
          };

          // Send Notification To Restaurant
          SendNotificationToRestaurant(req.app.get("io"), restaurant, order);

          return res.status(201).json({
            msg: "تم ارسال الطلب بنجاح",
            orders: {
              orders: orders,
              table: table._id,
              total: total,
            },
          });
        }

        return res.status(400).json({
          msg: {
            ar: "تعذر انشاء طلب جديد",
            en: "Faild To Create New Order",
          },
        });
      }
      return res.status(400).json({
        msg: {
          ar: "البيانات غير صالحة",
          en: "Invalid Data",
        },
      });
    } catch (error) {
      return res.status(500).json({
        msg: {
          ar: "حدث خطأ ما",
          en: "Something Went Wrong!",
        },
        error: error,
      });
    }
  },
  // Accept Order => IsProccessing
  AcceptOrder: async (req, res) => {
    const { orderID, total, table, restaurant } = req.body;
    try {
      if (
        isValidObjectId(orderID) &&
        isValidObjectId(restaurant) &&
        isValidObjectId(table)
      ) {
        const orderStatus = InitialStatus("isProccessing");

        // Update Order Status
        const order = await OrderModel.findByIdAndUpdate(orderID, {
          orderStatus,
        });

        if (order) {
          const orders = await allOrders(restaurant);

          // Notification When Status Change And When Order Deleted
          SendNotificationToClient(req.app.get("io"), table, {
            msg: "تم قبول طلبك",
          });

          return res.status(200).json({
            msg: "تم قبول الطلب",
            orders: orders,
          });
        }
        return res.status(400).json({ msg: "No Order Found" });
      }
      return res.status(400).json({ msg: "Invalid Data" });
    } catch (error) {
      return res.status(500).json({ msg: "Unexpacted Error" });
    }
  },
  // Complate Order => IsPaid
  ComplateOrder: async (req, res) => {
    const { orderID, total, table, restaurant } = req.body;
    try {
      if (isValidObjectId(orderID) && isValidObjectId(restaurant)) {
        const orderStatus = InitialStatus("isPaid");

        // Update Order Status
        const order = await OrderModel.findByIdAndUpdate(orderID, {
          orderStatus,
        });

        if (order) {
          const orders = await allOrders(restaurant);
          await OrderModel.findByIdAndDelete(orderID);
          await RestaurantModel.findByIdAndUpdate(restaurant, {
            $inc: { "ordersDetails.totalPaidOrders": 1, earnings: total },
          });
          // Notification When Status Change And When Order Deleted
          SendNotificationToClient(req.app.get("io"), table, {
            msg: "تم الدفع واكمال الطلب بنجاح",
          });
          return res.status(200).json({
            msg: "تم الدفع واكمال الطلب بنجاح",
            orders: orders,
          });
        }
        return res.status(400).json({ msg: "No Order Found" });
      }
      return res.status(400).json({ msg: "Invalid Data" });
    } catch (error) {
      return res.status(500).json({ msg: "Unexpacted Error" });
    }
  },
  // Update Order
  UpdateOrder: async (req, res) => {
    try {
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
  // Delete Order
  DeleteOrder: async (req, res) => {
    const { id } = req.params;
    try {
      if (isValidObjectId(id)) {
        // findOneAndDelete
        const order = await OrderModel.deleteMany({ table: id });
        const restaurantID = order.restaurant;
        if (order) {
          // Update Table Status
          await TableModel.findByIdAndUpdate(id, {
            active: true,
          });

          // Return All Orders After Delete
          await RestaurantModel.findByIdAndUpdate(restaurantID, {
            $inc: { "ordersDetails.totalCanceledOrders": 1 },
          });

          // Notification To Client
          SendNotificationToClient(req.app.get("io"), id, {
            msg: "تم حذف طلبك",
          });

          // Return Response
          return res.status(200).json({ msg: "تم حذف الطلب" });
        }
        return res.status(400).json({ msg: "حدث خطأ اثناء الحذف" });
      }
      return res.status(400).json({ msg: "Invalid Order" });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Something Went Wrong!", error: error });
    }
  },
};
module.exports = {
  OrderController,
  allOrders,
};
