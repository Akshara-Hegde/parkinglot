const mysql = require("mysql");
const readline = require("readline");

// Create a MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "userid",
  password: "password",
  database: "parkinglot",
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database");
  startProgram();
});

// Create a readline interface for reading user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Start the program by displaying the command prompt
function startProgram() {
  rl.question("Enter a command: ", (command) => {
    executeCommand(command);
  });
}

// Execute the user command
function executeCommand(command) {
  const args = command.split(" ");
  const operation = (args[0] + " " + args[1]).toUpperCase();

  switch (operation) {
    case "CREATE PARKING":
      createParkingLot(args);
      break;
    case "DELETE PARKING":
      deleteParkingLot(args);
      break;
    case "PARK CAR":
      parkVehicle(args);
      break;
    case "LEAVE CAR":
      leaveVehicle(args);
      break;
    case "LIST CAR":
      listParkingLot();
      break;
    default:
      console.log("Invalid command");
      startProgram();
  }
}



// Create a new parking lot
function createParkingLot(args) {
  const insertQuery = "INSERT INTO parking_lots (spaces) VALUES (?)";
  
  const spaces = args[2];

  db.query(insertQuery, [ spaces], (err) => {
    if (err) {
      console.error("Error creating parking lot:", err);
    } else {
      console.log("Parking lot created successfully!");
    }
    startProgram();
  });
}

// Delete an existing parking lot
function deleteParkingLot(args) {
  const id = args[2];
  const deleteQuery = "DELETE FROM parking_lots WHERE id = ?";

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error("Error deleting parking lot:", err);
    } else if (result.affectedRows === 0) {
      console.log("Parking lot not found.");
    } else {
      console.log("Parking lot deleted successfully!");
    }
    startProgram();
  });
}

// Park a vehicle in a parking lot
function parkVehicle(args) {
  const lotid = args[2];
  const licensePlate = args[3];
  const vehicle_type = args[4];

 
  const query1 =
    "SELECT COUNT(*) AS count, spaces FROM parked_vehicles JOIN parking_lots p ON p.id = parking_lot_id WHERE parking_lot_id = ? AND checkout_time IS NULL GROUP BY spaces";
  db.query(query1, [lotid], (err, results) => {
    if (err) {
      console.log("Some error occurred: " + err);
      startProgram();
      return;
    }
    // console.log(results);
    if (results.length > 0 && results[0].count >= results[0].spaces) {
      console.log("Parking Full");
      startProgram();
      return;
    }

    const query2 =
      "INSERT INTO parked_vehicles (license_plate, parking_lot_id, vehicle_type, checkin_time) VALUES (?, ?, ?, NOW())";
    db.query(query2, [licensePlate, lotid, vehicle_type], (err, results) => {
      if (err) {
        console.log("Some error occurred: " + err);
        startProgram();
        return;
      }
      if (results.affectedRows === 0) {
        console.log("Parking not allotted");
      } else {
        console.log("Parking Space allotted successfully");
      }
      startProgram();
    });
  });

}

// Remove a vehicle from a parking lot
function leaveVehicle(args) {
  const licensePlate = args[2];

  const updateQuery =
    "UPDATE parked_vehicles SET checkout_time = NOW() WHERE license_plate = ?";
  console.log(licensePlate)
  db.query(updateQuery, [licensePlate], (err, result) => {
    console.log(result)
    if (err) {
      console.error("Error leaving vehicle:", err);
    } else if (result.affectedRows === 0) {
      console.log("Vehicle not found in any parking lot.");
    } else {
      console.log("Vehicle left successfully!");
      
    }
    startProgram();
  });
}

// List all vehicles parked in all parking lots
function listParkingLot() {
  const selectQuery =
    "SELECT v.license_plate, v.checkin_time, v.checkout_time " +
    "FROM parked_vehicles v " +
    "JOIN parking_lots p ON v.parking_lot_id = p.id " +
    "ORDER BY v.checkin_time DESC";

  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error("Error listing parked vehicles:", err);
    } else {
      console.log("List of parked vehicles:");
      results.forEach((row) => {
        console.log(`License Plate: ${row.license_plate}`);
        console.log(`Parking Lot: ${row.lot_name}`);
        console.log(`Check-in Time: ${row.checkin_time}`);
        console.log(`Check-out Time: ${row.checkout_time}`);
        console.log("--------------------------");
      });
    }
    startProgram();
  });
}
