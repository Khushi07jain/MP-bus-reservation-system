const fs = require("fs");
const path = require("path");

const databasePath = path.join(__dirname, "..", "data", "database.json");

const mpCities = [
  "Bhopal",
  "Indore",
  "Jabalpur",
  "Gwalior",
  "Ujjain",
  "Sagar",
  "Rewa",
  "Satna",
  "Ratlam",
  "Dewas",
];

const seedBuses = [
  {
    id: "MP101",
    name: "Narmada Express",
    origin: "Bhopal",
    destination: "Indore",
    departure: "07:00",
    arrival: "11:10",
    duration: "4h 10m",
    fare: 420,
    totalSeats: 34,
    type: "AC Seater",
    rating: 4.5,
    reviews: 920,
    boardingPoints: ["ISBT Bhopal", "Lalghati Square", "Bairagarh"],
    droppingPoints: ["Vijay Nagar", "Sarwate Bus Stand", "Rajendra Nagar"],
    cancellation: "Free cancellation before 6 hours",
    amenities: ["AC", "WiFi", "Charging", "Water"],
  },
  {
    id: "MP204",
    name: "Mahakal Night Rider",
    origin: "Indore",
    destination: "Ujjain",
    departure: "21:30",
    arrival: "23:00",
    duration: "1h 30m",
    fare: 220,
    totalSeats: 30,
    type: "AC Seater",
    rating: 4.6,
    reviews: 780,
    boardingPoints: ["Sarwate Bus Stand", "Vijay Nagar", "Bengali Square"],
    droppingPoints: ["Nanakheda Bus Stand", "Mahakal Lok Gate", "Freeganj"],
    cancellation: "Instant refund before 3 hours",
    amenities: ["AC", "Charging", "Water"],
  },
  {
    id: "MP317",
    name: "Vindhya Sleeper",
    origin: "Bhopal",
    destination: "Jabalpur",
    departure: "22:15",
    arrival: "06:20",
    duration: "8h 05m",
    fare: 780,
    totalSeats: 36,
    type: "AC Sleeper",
    rating: 4.4,
    reviews: 640,
    boardingPoints: ["ISBT Bhopal", "MP Nagar", "Mandideep"],
    droppingPoints: ["Jabalpur ISBT", "Madan Mahal", "Vijay Nagar Jabalpur"],
    cancellation: "Free cancellation before 7 hours",
    amenities: ["Sleeper", "Blanket", "Water"],
  },
  {
    id: "MP422",
    name: "Fort City Connect",
    origin: "Gwalior",
    destination: "Bhopal",
    departure: "06:45",
    arrival: "14:20",
    duration: "7h 35m",
    fare: 560,
    totalSeats: 32,
    type: "AC Seater",
    rating: 4.2,
    reviews: 510,
    boardingPoints: ["Gwalior Bus Stand", "Phool Bagh", "Morar"],
    droppingPoints: ["ISBT Bhopal", "Habibganj", "MP Nagar"],
    cancellation: "Partial refund before 4 hours",
    amenities: ["AC", "Charging", "Water"],
  },
  {
    id: "MP509",
    name: "Bundelkhand Line",
    origin: "Sagar",
    destination: "Bhopal",
    departure: "09:10",
    arrival: "13:35",
    duration: "4h 25m",
    fare: 360,
    totalSeats: 30,
    type: "Non-AC Seater",
    rating: 4.1,
    reviews: 430,
    boardingPoints: ["Sagar Bus Stand", "Makronia", "Civil Lines Sagar"],
    droppingPoints: ["ISBT Bhopal", "BHEL", "Lalghati Square"],
    cancellation: "Free cancellation before 5 hours",
    amenities: ["Charging", "Water"],
  },
  {
    id: "MP612",
    name: "Rewa Royal",
    origin: "Rewa",
    destination: "Satna",
    departure: "17:40",
    arrival: "19:20",
    duration: "1h 40m",
    fare: 180,
    totalSeats: 28,
    type: "Non-AC Seater",
    rating: 4.0,
    reviews: 300,
    boardingPoints: ["Rewa Bus Stand", "Sirmour Chowk", "University Road"],
    droppingPoints: ["Satna Bus Stand", "Civil Lines Satna", "Bharhut Nagar"],
    cancellation: "Free cancellation before 2 hours",
    amenities: ["Water"],
  },
];

function defaultDatabase() {
  return {
    buses: seedBuses,
    reservations: [],
    counters: {
      reservation: 1001,
    },
  };
}

function minutesToTime(totalMinutes) {
  const dayMinutes = 24 * 60;
  const safeMinutes = ((totalMinutes % dayMinutes) + dayMinutes) % dayMinutes;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function createRouteStops(origin, destination, fromIndex, toIndex) {
  const candidates = mpCities.filter((city) => city !== origin && city !== destination);
  const step = Math.max(1, Math.abs(toIndex - fromIndex));
  const count = 2 + ((fromIndex + toIndex) % 2);
  const stops = [];

  for (let index = 0; stops.length < count && index < candidates.length * 2; index += 1) {
    const city = candidates[(fromIndex + toIndex + index * step) % candidates.length];
    if (!stops.includes(city)) {
      stops.push(city);
    }
  }

  return stops;
}

function createRestStop(origin, destination, fromIndex, toIndex) {
  const stops = createRouteStops(origin, destination, fromIndex, toIndex);
  const city = stops[Math.floor(stops.length / 2)] || origin;

  return {
    city,
    name: `${city} Highway Plaza`,
    duration: "10 min",
    note: "Washroom and refreshments break",
  };
}

function createAutoBus(origin, destination, fromIndex, toIndex) {
  const distanceScore = Math.abs(fromIndex - toIndex) + 1;
  const durationMinutes = 95 + distanceScore * 42 + ((fromIndex + toIndex) % 3) * 15;
  const departureMinutes = 360 + ((fromIndex * 83 + toIndex * 47) % 840);
  const isSleeper = durationMinutes >= 360;
  const isAc = (fromIndex + toIndex) % 3 !== 0;
  const type = `${isAc ? "AC" : "Non-AC"} ${isSleeper ? "Sleeper" : "Seater"}`;
  const fare = Math.round((170 + distanceScore * 68 + (isAc ? 90 : 0) + (isSleeper ? 140 : 0)) / 10) * 10;
  const id = `MP-${origin.slice(0, 3)}${destination.slice(0, 3)}`.toUpperCase();

  return {
    id,
    name: `${origin} ${destination} Link`,
    origin,
    destination,
    departure: minutesToTime(departureMinutes),
    arrival: minutesToTime(departureMinutes + durationMinutes),
    duration: formatDuration(durationMinutes),
    fare,
    totalSeats: isSleeper ? 36 : 32,
    type,
    rating: Number((4 + ((fromIndex + toIndex) % 7) / 10).toFixed(1)),
    reviews: 180 + (fromIndex + 1) * 37 + (toIndex + 1) * 29,
    boardingPoints: [`${origin} Bus Stand`, `${origin} City Center`, `${origin} Bypass`],
    droppingPoints: [`${destination} Bus Stand`, `${destination} City Center`, `${destination} Bypass`],
    routeStops: createRouteStops(origin, destination, fromIndex, toIndex),
    restStop: createRestStop(origin, destination, fromIndex, toIndex),
    cancellation: durationMinutes >= 300 ? "Free cancellation before 6 hours" : "Free cancellation before 3 hours",
    amenities: [
      ...(isAc ? ["AC"] : []),
      ...(isSleeper ? ["Sleeper", "Blanket"] : []),
      "Charging",
      "Water",
    ],
  };
}

function ensureRouteCoverage(database) {
  const existingRouteKeys = new Set(database.buses.map((bus) => `${normalize(bus.origin)}>${normalize(bus.destination)}`));
  const existingIds = new Set(database.buses.map((bus) => bus.id));
  let added = false;

  mpCities.forEach((origin, fromIndex) => {
    mpCities.forEach((destination, toIndex) => {
      if (origin === destination) return;

      const routeKey = `${normalize(origin)}>${normalize(destination)}`;
      if (existingRouteKeys.has(routeKey)) return;

      const bus = createAutoBus(origin, destination, fromIndex, toIndex);
      let suffix = 1;

      while (existingIds.has(bus.id)) {
        bus.id = `${bus.id}-${suffix++}`;
      }

      database.buses.push(bus);
      existingRouteKeys.add(routeKey);
      existingIds.add(bus.id);
      added = true;
    });
  });

  return added;
}

function ensureDatabase() {
  const directory = path.dirname(databasePath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(databasePath)) {
    writeDatabase(defaultDatabase());
  }
}

function readDatabase() {
  ensureDatabase();
  const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));

  if (ensureRouteCoverage(database)) {
    writeDatabase(database);
  }

  return database;
}

function writeDatabase(database) {
  fs.writeFileSync(databasePath, `${JSON.stringify(database, null, 2)}\n`);
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function isMPCity(city) {
  return mpCities.some((item) => normalize(item) === normalize(city));
}

function enrichBus(database, bus, journeyDate = "") {
  if (!bus) return null;

  const reservedSeats = database.reservations
    .filter((reservation) => reservation.busId === bus.id)
    .filter((reservation) => !journeyDate || !reservation.journeyDate || reservation.journeyDate === journeyDate)
    .flatMap((reservation) => reservation.seats);
  const type = bus.type || (bus.amenities.includes("Sleeper") ? "AC Sleeper" : "AC Seater");
  const rating = bus.rating || 4.2;
  const reviews = bus.reviews || 120;
  const boardingPoints = bus.boardingPoints || [`${bus.origin} Central Stand`, `${bus.origin} Bypass`];
  const droppingPoints = bus.droppingPoints || [`${bus.destination} Bus Stand`, `${bus.destination} City Center`];
  const cancellation = bus.cancellation || "Free cancellation before 6 hours";
  const fromIndex = mpCities.findIndex((city) => normalize(city) === normalize(bus.origin));
  const toIndex = mpCities.findIndex((city) => normalize(city) === normalize(bus.destination));
  const routeStops = Array.isArray(bus.routeStops) && bus.routeStops.length > 0
    ? bus.routeStops.slice(0, 3)
    : createRouteStops(bus.origin, bus.destination, Math.max(0, fromIndex), Math.max(0, toIndex));
  const restStop = bus.restStop || createRestStop(bus.origin, bus.destination, Math.max(0, fromIndex), Math.max(0, toIndex));

  return {
    ...bus,
    type,
    rating,
    reviews,
    boardingPoints,
    droppingPoints,
    routeStops,
    restStop,
    cancellation,
    from: bus.origin,
    to: bus.destination,
    price: bus.fare,
    seats: bus.totalSeats,
    availableSeats: bus.totalSeats - reservedSeats.length,
    reservedSeats,
  };
}

function listBuses(filters = {}) {
  const database = readDatabase();
  const origin = normalize(filters.from || filters.origin);
  const destination = normalize(filters.to || filters.destination);
  const journeyDate = String(filters.journeyDate || filters.date || "").trim();

  return database.buses
    .filter((bus) => !origin || normalize(bus.origin).includes(origin))
    .filter((bus) => !destination || normalize(bus.destination).includes(destination))
    .map((bus) => enrichBus(database, bus, journeyDate));
}

function getBus(id) {
  const database = readDatabase();
  const bus = database.buses.find((item) => item.id === id);
  return bus ? enrichBus(database, bus) : null;
}

function createBus(payload) {
  const database = readDatabase();
  const id = String(payload.id || `BR${Date.now().toString().slice(-5)}`).trim().toUpperCase();

  if (database.buses.some((bus) => bus.id === id)) {
    const error = new Error("A bus with this id already exists.");
    error.status = 409;
    throw error;
  }

  const bus = {
    id,
    name: String(payload.name || "").trim(),
    origin: String(payload.origin || payload.from || "").trim(),
    destination: String(payload.destination || payload.to || "").trim(),
    departure: String(payload.departure || "").trim(),
    arrival: String(payload.arrival || "").trim(),
    duration: String(payload.duration || "").trim(),
    fare: Number(payload.fare || payload.price),
    totalSeats: Number(payload.totalSeats || payload.seats),
    amenities: Array.isArray(payload.amenities) ? payload.amenities : [],
    type: String(payload.type || "AC Seater").trim(),
    rating: Number(payload.rating || 4.2),
    reviews: Number(payload.reviews || 0),
    boardingPoints: Array.isArray(payload.boardingPoints) ? payload.boardingPoints : [],
    droppingPoints: Array.isArray(payload.droppingPoints) ? payload.droppingPoints : [],
    cancellation: String(payload.cancellation || "Free cancellation before 6 hours").trim(),
  };

  if (!bus.name || !bus.origin || !bus.destination || !bus.departure || !bus.arrival) {
    const error = new Error("Bus name, origin, destination, departure, and arrival are required.");
    error.status = 400;
    throw error;
  }

  if (!isMPCity(bus.origin) || !isMPCity(bus.destination)) {
    const error = new Error(`Only Madhya Pradesh routes are allowed. Supported cities: ${mpCities.join(", ")}.`);
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(bus.fare) || bus.fare <= 0 || !Number.isInteger(bus.totalSeats) || bus.totalSeats <= 0) {
    const error = new Error("Fare and total seats must be valid positive numbers.");
    error.status = 400;
    throw error;
  }

  database.buses.push(bus);
  writeDatabase(database);

  return enrichBus(database, bus);
}

function listReservations() {
  const database = readDatabase();

  return database.reservations.map((reservation) => ({
    ...reservation,
    bus: enrichBus(database, database.buses.find((bus) => bus.id === reservation.busId)),
    route: enrichBus(database, database.buses.find((bus) => bus.id === reservation.busId)),
  }));
}

function getReservation(id) {
  return listReservations().find((reservation) => reservation.id === id) || null;
}

function createReservation(payload) {
  const database = readDatabase();
  const bus = database.buses.find((item) => item.id === payload.busId || item.id === payload.routeId);

  if (!bus) {
    const error = new Error("Selected bus route was not found.");
    error.status = 404;
    throw error;
  }

  const passengerName = String(payload.passengerName || "").trim();
  const phone = String(payload.phone || "").trim();
  const passengerEmail = String(payload.passengerEmail || payload.email || "").trim();
  const passengerAge = String(payload.passengerAge || payload.age || "").trim();
  const passengerGender = String(payload.passengerGender || payload.gender || "").trim();
  const journeyDate = String(payload.journeyDate || "").trim();
  const boardingPoint = String(payload.boardingPoint || "").trim();
  const droppingPoint = String(payload.droppingPoint || "").trim();
  const promoCode = String(payload.promoCode || "").trim().toUpperCase();

  if (!passengerName || !phone) {
    const error = new Error("Passenger name and phone number are required.");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(payload.seats) || payload.seats.length === 0) {
    const error = new Error("Select at least one seat.");
    error.status = 400;
    throw error;
  }

  const seats = [...new Set(payload.seats.map(Number))].sort((a, b) => a - b);
  const invalidSeat = seats.find((seat) => !Number.isInteger(seat) || seat < 1 || seat > bus.totalSeats);

  if (invalidSeat) {
    const error = new Error("One or more selected seats are invalid.");
    error.status = 400;
    throw error;
  }

  const reservedSeats = database.reservations
    .filter((reservation) => reservation.busId === bus.id)
    .filter((reservation) => !journeyDate || !reservation.journeyDate || reservation.journeyDate === journeyDate)
    .flatMap((reservation) => reservation.seats);
  const unavailableSeat = seats.find((seat) => reservedSeats.includes(seat));

  if (unavailableSeat) {
    const error = new Error(`Seat ${unavailableSeat} is already booked.`);
    error.status = 409;
    throw error;
  }

  const subtotal = seats.length * bus.fare;
  const discount = calculateDiscount({
    subtotal,
    promoCode,
    journeyDate,
    passengerAge,
  });

  const reservation = {
    id: `TKT-${database.counters.reservation++}`,
    busId: bus.id,
    passengerName,
    phone,
    passengerEmail,
    passengerAge,
    passengerGender,
    journeyDate,
    boardingPoint,
    droppingPoint,
    seats,
    subtotal,
    discount,
    promoCode: discount > 0 ? promoCode : "",
    total: subtotal - discount,
    status: "Booked",
    checkedInAt: "",
    bookedAt: new Date().toISOString(),
  };

  database.reservations.push(reservation);
  writeDatabase(database);

  return {
    ...reservation,
    bus: enrichBus(database, bus),
    route: enrichBus(database, bus),
  };
}

function deleteReservation(id) {
  const database = readDatabase();
  const index = database.reservations.findIndex((reservation) => reservation.id === id);

  if (index === -1) {
    const error = new Error("Reservation was not found.");
    error.status = 404;
    throw error;
  }

  const [reservation] = database.reservations.splice(index, 1);
  writeDatabase(database);

  return reservation;
}

function calculateDiscount({ subtotal, promoCode, journeyDate, passengerAge }) {
  if (!promoCode) return 0;

  if (promoCode === "MPFIRST") {
    return Math.min(100, Math.round(subtotal * 0.1));
  }

  if (promoCode === "WEEKEND") {
    const day = journeyDate ? new Date(`${journeyDate}T00:00:00`).getDay() : -1;
    return day === 0 || day === 6 ? Math.round(subtotal * 0.15) : 0;
  }

  if (promoCode === "STUDENT") {
    return Number(passengerAge) > 0 && Number(passengerAge) <= 25 ? Math.min(75, subtotal) : 0;
  }

  const error = new Error("Promo code is not valid. Try MPFIRST, WEEKEND, or STUDENT.");
  error.status = 400;
  throw error;
}

function checkInReservation(id) {
  const database = readDatabase();
  const reservation = database.reservations.find((item) => item.id === id);

  if (!reservation) {
    const error = new Error("Reservation was not found.");
    error.status = 404;
    throw error;
  }

  if (reservation.status === "Checked in") {
    return getReservation(id);
  }

  reservation.status = "Checked in";
  reservation.checkedInAt = new Date().toISOString();
  writeDatabase(database);

  return getReservation(id);
}

module.exports = {
  checkInReservation,
  createBus,
  createReservation,
  deleteReservation,
  getBus,
  getReservation,
  listBuses,
  listReservations,
};
