const { isValidObjectId, default: mongoose } = require("mongoose");
const OrderModel = require("./OrderModel");
const TableModel = require("../Table/TableModel");
const RestaurantModel = require("../Restaurant/RestaurantModel");
const DishModel = require("../Dish/DishModel");
const {
  SendNotificationToRestaurant,
  SendNotificationToClient,
} = require("../Notification/NotificationController");
const {
  UpdateDoc,
  DeleteDoc,
  GetAllDocs,
  GetDoc,
} = require("../../Config/DbQueries/DbQueries");

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
      $lookup: {
        from: "restaurants",
        localField: "dishes.restaurant",
        foreignField: "_id",
        as: "restaurants",
      },
    },
    {
      $unwind: "$restaurants",
    },
    {
      $group: {
        _id: "$table",
        user: { $first: "$user" },
        orderStatus: { $first: "$orderStatus" },
        tableName: { $first: "$tableID" },
        orderID: { $first: "$orderID" },
        orderNo: { $first: "$restaurants.ordersDetails.totalRequestedOrders" },
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

const StartAndEndPoint = (period) => {
  const Start = new Date();
  const End = new Date(Start);

  if (period == "day" || period == "Day") {
    Start.setHours(0, 0, 0, 0); // Set to start of the day
    End.setHours(23, 59, 59, 999); // Set to end of the day
    return { Start, End };
  }
  if (period == "week" || period == "Week") {
    const dayOfWeek = Start.getDay(); // 0 (Sunday) - 6 (Saturday)
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust if week starts on Monday
    Start.setDate(Start.getDate() - diffToMonday);
    Start.setHours(0, 0, 0, 0);

    End.setDate(Start.getDate() + 6); // End of the week (6 days later)
    End.setHours(23, 59, 59, 999);
    return { Start, End };
  }
  if (period == "month" || period == "Month") {
    Start.setDate(1); // Set to the first day of the month
    Start.setHours(0, 0, 0, 0);

    End.setMonth(Start.getMonth() + 1); // Set to the first day of the next month
    End.setHours(23, 59, 59, 999);
    return { Start, End };
  }
  if (period == "year" || period == "Year") {
    Start.setMonth(0, 1); // Set to January 1st of the current year
    Start.setHours(0, 0, 0, 0);

    End.setFullYear(Start.getFullYear() + 1); // Set to January 1st of the next year
    End.setHours(23, 59, 59, 999);
    return { Start, End };
  } else {
    return { Start: null, End: null };
  }
};
const generateFakeUsers = async (count = 10, dishes, tables, restaurant) => {
  const FakeOrders = [];
  for (let i = 0; i < count; i++) {
    const orders = [];
    for (let j = 0; j < count; j++) {
      const dish = dishes[j]?._id || dishes[0]?._id;
      orders.push({
        order: dish,
        quantity: Math.floor(Math.random() * 10 + 1),
      });
    }

    console.log(Math.floor(Math.random() * dishes.length));
    FakeOrders.push({
      orders: orders,
      user: {
        name: `Wael Altyeb ${i}`,
        note: `No Sugar`,
      },
      table:
        tables[Math.floor(Math.random() * dishes.length)]?._id ||
        tables[0]?._id,
      restaurant: restaurant,
      orderStatus: "isRequested",
      total: 8000,
      createdAt: new Date().toISOString(),
    });
  }
  await OrderModel.insertMany(FakeOrders);
  console.log(`${count} fake orders generated!`);
  return FakeOrders.length != 0;
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
        // Get Order Details
        const [order] = await OrderModel.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(id),
            },
          },
          {
            $unwind: "$orders",
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
              _id: "$_id",
              restaurant: { $first: "$restaurant" },
              user: { $first: "$user" },
              orderStatus: { $first: "$orderStatus" },
              table: { $first: "$table" },
              totalOrders: { $sum: 1 },
              totalQuntity: { $sum: "$orders.quantity" },
              total: {
                $sum: { $multiply: ["$dishes.price", "$orders.quantity"] },
              },
              dishes: {
                $push: {
                  _id: "$dishes._id",
                  name: "$dishes.name",
                  quantity: "$orders.quantity",
                  price: "$dishes.price",
                },
              },
            },
          },
        ]);

        // Get Dishes
        const restaurant = order.restaurant;
        // const dishes = await DishModel.find({ restaurant: restaurant });
        const dishes = await GetAllDocs(DishModel, { restaurant: restaurant });
        const tables = await GetAllDocs(TableModel, { restaurant: restaurant });

        if (order) return res.status(200).json({ order, dishes, tables });
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
    const { orders, restaurant, table, total, user, orderStatus } = req.body;
    try {
      if (isValidObjectId(table) && isValidObjectId(restaurant)) {
        // If Orders Are More Than 50
        if (orders.length >= 50)
          return res.status(400).json({ msg: "To Much Orders" });
        //
        const status = orderStatus || "isRequested";
        // Orders Data
        const data = {
          orders,
          restaurant,
          table,
          total,
          user,
          orderStatus: status,
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
        // Update Table Status
        const updateTable = await UpdateDoc(TableModel, table, {
          active: false,
        });

        // Request For New Order
        // -----------------------------------------------
        if (createOrder && updateTable) {
          const ordersDetails = await allOrders(restaurant);
          const order = {
            msg: "هنالك طلب جديد!",
            orders: ordersDetails,
          };

          // Send Notification To Restaurant
          SendNotificationToRestaurant(
            req.app.get("io"),
            restaurant,
            order,
            "New-Order"
          );

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
      console.log(error);
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
    const { orderID, table, restaurant } = req.body;
    try {
      if (
        isValidObjectId(orderID) &&
        isValidObjectId(restaurant) &&
        isValidObjectId(table)
      ) {
        const orderStatus = "isProccessing";

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
        const orderStatus = "isPaid";

        // Update Order Status
        const order = await UpdateDoc(OrderModel, orderID, {
          orderStatus,
        });

        if (order) {
          const orders = await allOrders(restaurant);
          await DeleteDoc(OrderModel, orderID);
          await UpdateDoc(TableModel, table, {
            active: true,
          });
          await UpdateDoc(RestaurantModel, restaurant, {
            $inc: { "ordersDetails.totalPaidOrders": 1, earnings: total },
          });
          // Notification When Status Change And When Order Deleted
          SendNotificationToClient(
            req.app.get("io"),
            table,
            {
              msg: "تم الدفع واكمال الطلب بنجاح",
            },
            "Order-Status"
          );
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
    const { id, orders, PrvTable, CurTable, user, orderStatus } = req.body;
    console.log(id, orders, user, orderStatus);
    try {
      if (
        isValidObjectId(id) &&
        isValidObjectId(PrvTable) &&
        isValidObjectId(CurTable)
      ) {
        // const orderStatus = InitialStatus(status);
        const data = {
          orders,
          table: CurTable,
          user,
          orderStatus,
        };

        if (PrvTable != CurTable) {
          console.log("Tables Status Has Been Updated");
          // Update Previous Table To Be Active => true
          await UpdateDoc(TableModel, PrvTable, { active: true });
          // Update Current Table To Be Not Active => false
          await UpdateDoc(TableModel, CurTable, { active: false });
        }

        const order = await UpdateDoc(OrderModel, id, data);

        // Update The Times Of Dish Has Been Ordered
        orders.map(async (order) => {
          await DishModel.findByIdAndUpdate(order.order, {
            $inc: { NumberOfOrders: order.quantity },
          });
        });

        if (order) return res.status(200).json({ msg: "تم تحديث الطلب بنجاح" });

        return res.status(404).json({ msg: "حدث خطأ ما" });
      }
      return res.status(400).json({ msg: "Invalid Data" });
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
        // Restaurant ID
        const restaurantID = order?.restaurant;
        if (order) {
          // Update Table Status
          await UpdateDoc(TableModel, id, {
            active: true,
          });

          // Update Number Of Canceled Orders
          await UpdateDoc(RestaurantModel, restaurantID, {
            $inc: { "ordersDetails.totalCanceledOrders": 1 },
          });

          // Notification To Client
          SendNotificationToClient(
            req.app.get("io"),
            id,
            {
              msg: "تم حذف طلبك",
            },
            "Order-Status"
          );

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
  getOrdersOfWeek: async (req, res) => {
    const { Start, End } = StartAndEndPoint("week");
    if (!(Start && End)) return res.status(400).json({ msg: "No Data" });

    const orders = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: Start, $lt: End },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$user" },
          total: { $first: "$total" },
          table: { $first: "$table" },
          orders: { $first: "$orders" },
        },
      },
    ]);

    if (orders.length != 0) return res.status(200).json(orders);
    return res.status(400).json({ msg: "No Data" });
  },
  GenerateFakeData: async (req, res) => {
    const { count, restaurant } = req.params;
    try {
      const dishes = await GetAllDocs(DishModel, { restaurant: restaurant });
      const tables = await GetAllDocs(TableModel, { restaurant: restaurant });
      const FakeData = generateFakeUsers(count, dishes, tables, restaurant);
      if (FakeData)
        return res
          .status(200)
          .json({ msg: "Fake Data Generates Successfully" });
    } catch (error) {
      return res.status(500).json({ msg: "Internal Server Error" });
    }
  },
};
module.exports = {
  OrderController,
  allOrders,
};
