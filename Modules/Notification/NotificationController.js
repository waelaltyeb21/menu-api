// Restaurants & Clients
let RestaurantsIDs = [];
let ClientsIDs = [];

// Handle Connected Clients
const HandleConnectedClients = (ClientID, SocketID) => {
  const Client = ClientsIDs.find((Client) => Client?.ClientID === ClientID);
  console.log("## Client: ", Client, "##");
  console.log("Check ?", !Client);
  console.log("Clients: ", ClientsIDs);
  if (!Client) {
    console.log("### Client Connected Successfuly ###");
    ClientsIDs.push({ ClientID, SocketID });
  }
};

// Handle Disconnected Clients
const HandleDisconnectedClients = (socketID) => {
  // Find Client
  const Client = ClientsIDs.find((clientID) => clientID?.ClientID == socketID);
  if (Client) {
    ClientsIDs = ClientsIDs.filter(
      (clientID) => clientID?.Socket.id != socketID
    );
    console.log("## Client With Id ", socketID, " Has Been Disconnected ##");
  }
};

// Get Client By ID
const GetClientID = (clientID) => {
  const Client = ClientsIDs.find((Client) => Client?.ClientID == clientID);
  return Client ? Client.SocketID : null;
};

const SendNotificationToClient = (io, ClientID, data) => {
  const SocketID = GetClientID(ClientID);
  console.log("Message Sent To Client With ID: ", SocketID);
  if (SocketID != null) {
    io.to(SocketID).emit("Order-Status", data);
  }
};

// Handle Connected Restaurants
const HandleConnectedRestaurants = (RestaurantID, SocketID) => {
  const restaurant = RestaurantsIDs.find(
    (Restaurant) => Restaurant?.RestaurantID === RestaurantID
  );
  // If Not Register
  if (!restaurant) {
    console.log("### Restaurant Connected Successfuly ###");
    console.log(`ID: ${SocketID}`);
    RestaurantsIDs.push({ RestaurantID, SocketID });
  }
};

// Handle Disonnected Restaurants
const HandleDisonnectedRestaurants = (socketID) => {
  const restaurant = RestaurantsIDs.find(
    (restaurant) => restaurant?.SocketID == socketID
  );
  if (restaurant) {
    RestaurantsIDs = RestaurantsIDs.filter(
      (restaurant) => restaurant?.SocketID != socketID
    );
    console.log(
      "## Restuarant With Id ",
      socketID,
      " Has Been Disconnected ##"
    );
  }
};

// Get Client By ID
const GetRestaurantID = (restaurantID) => {
  const Restaurant = RestaurantsIDs.find(
    (Restaurant) => Restaurant?.RestaurantID === restaurantID
  );
  return Restaurant ? Restaurant?.SocketID : null;
};

// Send A Notification To Restaurant => New Order
const SendNotificationToRestaurant = (io, RestaurantID, order) => {
  const SocketID = GetRestaurantID(RestaurantID);
  if (SocketID != null) {
    io.to(SocketID).emit("New-Order", order);
  }
};

module.exports = {
  RestaurantsIDs,
  GetRestaurantID,
  HandleConnectedRestaurants,
  HandleDisonnectedRestaurants,
  SendNotificationToRestaurant,
  ClientsIDs,
  GetClientID,
  HandleConnectedClients,
  HandleDisconnectedClients,
  SendNotificationToClient,
};
