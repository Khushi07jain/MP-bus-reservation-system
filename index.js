const express = require("express");
const path = require("path");
const database = require("./src/database");
const { createTicketPdf } = require("./src/ticketPdf");

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function sendError(res, error) {
  res.status(error.status || 500).json({
    message: error.message || "Internal server error.",
  });
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "bus-reservation-system",
    storage: "file-database",
  });
});

app.get("/api/buses", (req, res) => {
  res.json(database.listBuses(req.query));
});

app.get("/api/buses/:id", (req, res) => {
  const bus = database.getBus(req.params.id);

  if (!bus) {
    return res.status(404).json({ message: "Bus route was not found." });
  }

  res.json(bus);
});

app.post("/api/buses", (req, res) => {
  try {
    res.status(201).json(database.createBus(req.body));
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/routes", (req, res) => {
  res.json(database.listBuses(req.query));
});

app.get("/api/reservations", (req, res) => {
  res.json(database.listReservations());
});

app.get("/api/reservations/:id", (req, res) => {
  const reservation = database.getReservation(req.params.id);

  if (!reservation) {
    return res.status(404).json({ message: "Reservation was not found." });
  }

  res.json(reservation);
});

app.get("/api/reservations/:id/ticket.pdf", (req, res) => {
  const reservation = database.getReservation(req.params.id);

  if (!reservation) {
    return res.status(404).json({ message: "Reservation was not found." });
  }

  const pdf = createTicketPdf(reservation);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${reservation.id}.pdf"`);
  res.setHeader("Content-Length", pdf.length);
  res.send(pdf);
});

app.post("/api/reservations", (req, res) => {
  try {
    res.status(201).json(database.createReservation(req.body));
  } catch (error) {
    sendError(res, error);
  }
});

app.patch("/api/reservations/:id/check-in", (req, res) => {
  try {
    res.json(database.checkInReservation(req.params.id));
  } catch (error) {
    sendError(res, error);
  }
});

app.delete("/api/reservations/:id", (req, res) => {
  try {
    res.json(database.deleteReservation(req.params.id));
  } catch (error) {
    sendError(res, error);
  }
});

app.listen(port, () => {
  console.log(`Bus reservation system is running at http://localhost:${port}`);
});
