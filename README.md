# MP Bus Reservation System

An Express-based Madhya Pradesh bus reservation app with a persistent local database and a RedBus-style booking flow.

## Run

```powershell
npm start
```

Open `http://localhost:8080`.

## Database

The app stores data in `data/database.json`. It is created automatically with seeded buses the first time the backend reads bus data.

Stored tables:

- `buses`
- `reservations`
- `counters`

## API

- `GET /api/health` - backend health check
- `GET /api/buses` - list buses with seat availability
- `GET /api/buses?from=Bhopal&to=Indore` - search MP buses
- `GET /api/buses/:id` - get one bus
- `POST /api/buses` - add a bus route
- `GET /api/reservations` - list tickets
- `GET /api/reservations/:id` - get one ticket
- `GET /api/reservations/:id/ticket.pdf` - download ticket PDF
- `POST /api/reservations` - book seats
- `PATCH /api/reservations/:id/check-in` - mark a ticket as checked in
- `DELETE /api/reservations/:id` - cancel a ticket

Example booking body:

```json
{
  "busId": "MP101",
  "journeyDate": "2026-05-08",
  "boardingPoint": "ISBT Bhopal",
  "droppingPoint": "Vijay Nagar",
  "passengerName": "Asha Sharma",
  "passengerAge": "24",
  "passengerGender": "Female",
  "passengerEmail": "asha@example.com",
  "promoCode": "MPFIRST",
  "phone": "9999999999",
  "seats": [1, 2]
}
```

## Features

- RedBus-style search page with date and passenger count
- MP-only route data and backend city validation
- Buses available across every supported MP city pair
- Filters for bus type, fare, and sorting
- Departure time filter for morning, afternoon, evening, and night buses
- Swap route button and recent search shortcuts
- Rich bus cards with rating, reviews, amenities, cancellation policy, and route timeline
- Route sub-stops for intermediate MP cities on each route
- Proper 10-minute rest stop details with plaza name and refreshment note
- Seat layout with available, selected, and booked states
- Direct jump to seat selection after choosing a bus
- Auto seat picking
- Seat preference auto-pick for window, aisle, or together seats
- Live trip summary after selecting a bus
- Travel assist panel with report-by time, boarding countdown, and cancellation deadline
- Clear cancellation policy in the booking review panel
- Boarding and dropping point selection
- Date-specific seat availability, so the same bus can be booked independently across journey dates
- Favorite route saving in the browser
- Promo fare discounts with `MPFIRST`, `WEEKEND`, and `STUDENT`
- Ticket check-in status for current reservations
- PNR/ticket search by ticket id, passenger, phone, city, or status
- Help center with FAQs, support categories, and local help request IDs
- Persistent reservations
- Downloadable PDF ticket with verification code
