const routesContainer = document.querySelector("#routes");
const reservationsContainer = document.querySelector("#reservations");
const searchForm = document.querySelector("#search-form");
const bookingForm = document.querySelector("#booking-form");
const selectedRouteBox = document.querySelector("#selected-route");
const seatMap = document.querySelector("#seat-map");
const seatSelection = document.querySelector("#seat-selection");
const total = document.querySelector("#total");
const seatSummary = document.querySelector("#seat-summary");
const message = document.querySelector("#message");
const routeCount = document.querySelector("#route-count");
const autoPickButton = document.querySelector("#auto-pick");
const clearSeatsButton = document.querySelector("#clear-seats");
const seatPreference = document.querySelector("#seat-preference");
const sortSelect = document.querySelector("#sort");
const typeFilter = document.querySelector("#type-filter");
const fareFilter = document.querySelector("#fare-filter");
const fareValue = document.querySelector("#fare-value");
const favoritesOnly = document.querySelector("#favorites-only");
const timeFilter = document.querySelector("#time-filter");
const quickStats = document.querySelector("#quick-stats");
const recentSearches = document.querySelector("#recent-searches");
const compareStrip = document.querySelector("#compare-strip");
const dateChip = document.querySelector("#date-chip");
const journeyDateInput = document.querySelector("#journeyDate");
const passengerInput = document.querySelector("#passengers");
const swapRouteButton = document.querySelector("#swap-route");
const boardingPoint = document.querySelector("#boardingPoint");
const droppingPoint = document.querySelector("#droppingPoint");
const cityPills = document.querySelectorAll(".city-pills button");
const passengerGender = document.querySelector("#passengerGender");
const passengerAge = document.querySelector("#passengerAge");
const promoCode = document.querySelector("#promoCode");
const fareBreakdown = document.querySelector("#fare-breakdown");
const tripSummary = document.querySelector("#trip-summary");
const travelAssist = document.querySelector("#travel-assist");
const ticketSearchForm = document.querySelector("#ticket-search-form");
const ticketSearch = document.querySelector("#ticket-search");
const helpForm = document.querySelector("#help-form");
const helpStatus = document.querySelector("#help-status");

let allRoutes = [];
let routes = [];
let reservationsCache = [];
let selectedRoute = null;
let selectedSeats = new Set();
let favoriteRoutes = new Set(JSON.parse(localStorage.getItem("favoriteRoutes") || "[]"));
let recentSearchList = JSON.parse(localStorage.getItem("recentSearches") || "[]");
let helpRequests = JSON.parse(localStorage.getItem("helpRequests") || "[]");
let currentSearch = {};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

journeyDateInput.valueAsDate = new Date();

async function api(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function durationToMinutes(duration) {
  const hours = Number(duration.match(/(\d+)h/)?.[1] || 0);
  const minutes = Number(duration.match(/(\d+)m/)?.[1] || 0);
  return hours * 60 + minutes;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(time, offset) {
  const total = timeToMinutes(time) + offset;
  const safeTotal = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(safeTotal / 60);
  const minutes = safeTotal % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getPolicyHours(policy = "") {
  return Number(String(policy).match(/before\s+(\d+)\s+hours?/i)?.[1] || 0);
}

function getJourneyDateTime(route, journeyDate) {
  const date = journeyDate || new Date().toISOString().slice(0, 10);
  return new Date(`${date}T${route.departure}:00`);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function scrollToSeatSelection() {
  window.setTimeout(() => {
    seatSelection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 80);
}

function getCancellationDeadline(route, journeyDate) {
  const hours = getPolicyHours(route.cancellation);
  if (!hours) return "";

  const deadline = getJourneyDateTime(route, journeyDate);
  deadline.setHours(deadline.getHours() - hours);

  return formatDateTime(deadline);
}

function getBoardingCountdown(route, journeyDate) {
  const departure = getJourneyDateTime(route, journeyDate);
  const diff = departure.getTime() - Date.now();

  if (diff <= 0) return "Trip time reached";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function getTimeBand(time) {
  const minutes = timeToMinutes(time);

  if (minutes >= 300 && minutes < 720) return "morning";
  if (minutes >= 720 && minutes < 1020) return "afternoon";
  if (minutes >= 1020 && minutes < 1260) return "evening";
  return "night";
}

function saveRecentSearch(search) {
  if (!search.from || !search.to) return;

  const entry = {
    from: search.from,
    to: search.to,
    journeyDate: search.journeyDate || journeyDateInput.value,
  };
  const key = `${entry.from}|${entry.to}|${entry.journeyDate}`;

  recentSearchList = [
    entry,
    ...recentSearchList.filter((item) => `${item.from}|${item.to}|${item.journeyDate}` !== key),
  ].slice(0, 4);

  localStorage.setItem("recentSearches", JSON.stringify(recentSearchList));
  renderRecentSearches();
}

function renderRecentSearches() {
  if (recentSearchList.length === 0) {
    recentSearches.innerHTML = "";
    return;
  }

  recentSearches.innerHTML = `
    <strong>Recent searches</strong>
    <div>
      ${recentSearchList.map((item, index) => `
        <button type="button" data-recent-index="${index}">
          ${item.from} to ${item.to}
        </button>
      `).join("")}
    </div>
  `;
}

function saveFavoriteRoutes() {
  localStorage.setItem("favoriteRoutes", JSON.stringify([...favoriteRoutes]));
}

function toggleFavoriteRoute(routeId) {
  if (favoriteRoutes.has(routeId)) {
    favoriteRoutes.delete(routeId);
    setMessage("Route removed from favorites.");
  } else {
    favoriteRoutes.add(routeId);
    setMessage("Route saved to favorites.");
  }

  saveFavoriteRoutes();
  applyFilters();
}

window.toggleFavoriteRoute = toggleFavoriteRoute;

function getPromoDiscount(subtotal) {
  const code = promoCode.value.trim().toUpperCase();
  const age = Number(passengerAge.value);

  if (!code || subtotal === 0) {
    return { code: "", discount: 0, note: "" };
  }

  if (code === "MPFIRST") {
    return { code, discount: Math.min(100, Math.round(subtotal * 0.1)), note: "MPFIRST applied" };
  }

  if (code === "WEEKEND") {
    const day = journeyDateInput.value ? new Date(`${journeyDateInput.value}T00:00:00`).getDay() : -1;
    const discount = day === 0 || day === 6 ? Math.round(subtotal * 0.15) : 0;
    return { code, discount, note: discount ? "Weekend fare applied" : "WEEKEND works on Saturday or Sunday" };
  }

  if (code === "STUDENT") {
    const discount = age > 0 && age <= 25 ? Math.min(75, subtotal) : 0;
    return { code, discount, note: discount ? "Student discount applied" : "STUDENT needs age 25 or below" };
  }

  return { code, discount: 0, note: "Code will be checked while booking" };
}

function getRouteBadges(route) {
  if (routes.length === 0) return [];

  const lowestFare = Math.min(...routes.map((item) => item.price));
  const shortestTime = Math.min(...routes.map((item) => durationToMinutes(item.duration)));
  const mostSeats = Math.max(...routes.map((item) => item.availableSeats));
  const badges = [];

  if (route.price === lowestFare) badges.push("Best fare");
  if (durationToMinutes(route.duration) === shortestTime) badges.push("Fastest");
  if (route.availableSeats === mostSeats) badges.push("Most seats");
  if (route.rating >= 4.4) badges.push("Top rated");

  return badges;
}

function tripInsights(route) {
  const minutes = durationToMinutes(route.duration);
  const farePerHour = minutes > 0 ? Math.round(route.price / (minutes / 60)) : route.price;
  const comfortScore = Math.min(98, 68 + route.amenities.length * 6 + Math.round(route.availableSeats / 4));
  const ecoPoints = Math.max(12, Math.round(minutes / 7));

  return [
    `${money.format(farePerHour)}/hr`,
    `${comfortScore}% comfort`,
    `${ecoPoints} eco points`,
  ];
}

function renderStopTrail(route) {
  const stops = route.routeStops || [];
  const places = [route.from, ...stops, route.to];

  return `
    <div class="stop-trail">
      ${places.map((place, index) => `
        <span class="${index === 0 || index === places.length - 1 ? "major" : ""}">${place}</span>
      `).join("")}
    </div>
  `;
}

function renderRestStop(route) {
  if (!route.restStop) return "";

  return `
    <p class="rest-stop">
      <strong>${route.restStop.duration} rest stop</strong>
      <span>${route.restStop.name} | ${route.restStop.note}</span>
    </p>
  `;
}

function getComfortScore(route) {
  return Math.min(98, 68 + route.amenities.length * 6 + Math.round(route.availableSeats / 4));
}

function getDemandLevel(route) {
  const booked = route.seats - route.availableSeats;
  const ratio = route.seats ? booked / route.seats : 0;

  if (ratio >= 0.7) return "High demand";
  if (ratio >= 0.35) return "Filling fast";
  return "Easy seats";
}

function renderCompareStrip() {
  if (routes.length === 0) {
    compareStrip.innerHTML = "";
    return;
  }

  const cheapest = routes.reduce((best, route) => (route.price < best.price ? route : best), routes[0]);
  const fastest = routes.reduce((best, route) => (durationToMinutes(route.duration) < durationToMinutes(best.duration) ? route : best), routes[0]);
  const topRated = routes.reduce((best, route) => (route.rating > best.rating ? route : best), routes[0]);
  const picks = [
    ["Best fare", cheapest, money.format(cheapest.price)],
    ["Fastest", fastest, fastest.duration],
    ["Top rated", topRated, topRated.rating.toFixed(1)],
  ];

  compareStrip.innerHTML = picks.map(([label, route, value]) => `
    <button type="button" data-route-id="${route.id}">
      <span>${label}</span>
      <strong>${route.name}</strong>
      <small>${value} | ${route.departure}</small>
    </button>
  `).join("");
}

function applyFilters() {
  const selectedType = typeFilter.value.toLowerCase();
  const maxFare = Number(fareFilter.value);
  const selectedTime = timeFilter.value;

  routes = allRoutes
    .filter((route) => route.price <= maxFare)
    .filter((route) => !selectedType || route.type.toLowerCase().includes(selectedType))
    .filter((route) => !selectedTime || getTimeBand(route.departure) === selectedTime)
    .filter((route) => !favoritesOnly.checked || favoriteRoutes.has(route.id))
    .sort((a, b) => {
      if (sortSelect.value === "fare") return a.price - b.price;
      if (sortSelect.value === "departure") return timeToMinutes(a.departure) - timeToMinutes(b.departure);
      if (sortSelect.value === "rating") return b.rating - a.rating;
      if (sortSelect.value === "duration") return durationToMinutes(a.duration) - durationToMinutes(b.duration);
      return b.rating * 20 + b.availableSeats - (a.rating * 20 + a.availableSeats);
    });

  fareValue.textContent = `Up to ${money.format(maxFare)}`;

  if (selectedRoute && !routes.some((route) => route.id === selectedRoute.id)) {
    selectedRoute = null;
    selectedSeats = new Set();
  }

  renderStats();
  renderCompareStrip();
  renderRoutes();
  renderSelectedRoute();
}

function renderStats() {
  const minFare = routes.length ? Math.min(...routes.map((route) => route.price)) : 0;
  const bestRating = routes.length ? Math.max(...routes.map((route) => route.rating)) : 0;
  const totalSeats = routes.reduce((sum, route) => sum + route.availableSeats, 0);
  const earliest = routes.length
    ? routes.reduce((best, route) => (timeToMinutes(route.departure) < timeToMinutes(best.departure) ? route : best), routes[0])
    : null;

  quickStats.innerHTML = `
    <div><strong>${routes.length}</strong><span>Buses</span></div>
    <div><strong>${money.format(minFare)}</strong><span>Lowest fare</span></div>
    <div><strong>${bestRating.toFixed(1)}</strong><span>Best rating</span></div>
    <div><strong>${totalSeats}</strong><span>Seats left</span></div>
    <div><strong>${earliest ? earliest.departure : "--"}</strong><span>Earliest</span></div>
    <div><strong>${routes.filter((route) => route.type.includes("AC")).length}</strong><span>AC options</span></div>
  `;
}

function renderRoutes() {
  routeCount.textContent = `${routes.length} bus${routes.length === 1 ? "" : "es"} available`;
  dateChip.textContent = journeyDateInput.value || "Today";

  if (routes.length === 0) {
    routesContainer.innerHTML = '<div class="empty-state">No buses match this search.</div>';
    return;
  }

  routesContainer.innerHTML = routes
    .map((route) => {
      const isSelected = selectedRoute && selectedRoute.id === route.id;
      const badges = getRouteBadges(route);
      const comfortScore = getComfortScore(route);
      return `
        <article class="route-card ${isSelected ? "selected" : ""}">
          <div class="route-ribbon">${getDemandLevel(route)}</div>
          <div class="operator-column">
            <div class="route-title">
              <div class="operator-heading">
                <span class="operator-logo">${route.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h3>${route.name}</h3>
                  <p>${route.type} | ${route.cancellation}</p>
                </div>
              </div>
              <div class="route-actions">
                <button
                  class="favorite-button ${favoriteRoutes.has(route.id) ? "saved" : ""}"
                  type="button"
                  data-favorite-id="${route.id}"
                  onclick="toggleFavoriteRoute('${route.id}')"
                  aria-label="${favoriteRoutes.has(route.id) ? "Remove favorite" : "Save favorite"}"
                >${favoriteRoutes.has(route.id) ? "Saved" : "Save"}</button>
                <div class="rating">${route.rating.toFixed(1)} <span>${route.reviews} reviews</span></div>
              </div>
            </div>
            <div class="badges">${badges.map((badge) => `<span>${badge}</span>`).join("")}</div>
            <div class="timeline">
              <div><strong>${route.departure}</strong><span>${route.from}</span></div>
              <div class="duration-line"><span>${route.duration}</span></div>
              <div><strong>${route.arrival}</strong><span>${route.to}</span></div>
            </div>
            ${renderStopTrail(route)}
            ${renderRestStop(route)}
            <div class="route-meter">
              <span style="width: ${comfortScore}%"></span>
            </div>
            <p class="insights">${tripInsights(route).map((item) => `<span>${item}</span>`).join("")}</p>
            <p class="amenities">${route.amenities.map((item) => `<span>${item}</span>`).join("")}</p>
          </div>
          <div class="fare-column">
            <div class="operator-badge">${getTimeBand(route.departure)}</div>
            <span>Starts from</span>
            <strong>${money.format(route.price)}</strong>
            <small>${route.availableSeats} seats left</small>
            <button type="button" data-route-id="${route.id}" ${route.availableSeats === 0 ? "disabled" : ""}>
              ${isSelected ? "Selected" : "View seats"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPointOptions() {
  const boardings = selectedRoute ? selectedRoute.boardingPoints : [];
  const droppings = selectedRoute ? selectedRoute.droppingPoints : [];

  boardingPoint.innerHTML = boardings.map((point) => `<option>${point}</option>`).join("");
  droppingPoint.innerHTML = droppings.map((point) => `<option>${point}</option>`).join("");
}

function renderSelectedRoute() {
  if (!selectedRoute) {
    selectedRouteBox.className = "empty-state";
    selectedRouteBox.textContent = "Select a bus to choose seats.";
    tripSummary.innerHTML = "";
    travelAssist.innerHTML = "";
    seatMap.innerHTML = "";
    renderPointOptions();
    updateTotal();
    return;
  }

  selectedRouteBox.className = "selected-route";
  selectedRouteBox.innerHTML = `
    <strong>${selectedRoute.name}</strong>
    <span>${selectedRoute.from} to ${selectedRoute.to} | ${journeyDateInput.value}</span>
    <span>${selectedRoute.departure} departure | ${selectedRoute.type}</span>
  `;

  tripSummary.innerHTML = `
    <div><strong>${selectedRoute.duration}</strong><span>Travel time</span></div>
    <div><strong>${getTimeBand(selectedRoute.departure)}</strong><span>Departure band</span></div>
    <div><strong>${selectedRoute.availableSeats}</strong><span>Seats left</span></div>
  `;

  tripSummary.innerHTML += `
    <div class="wide-summary"><strong>${selectedRoute.routeStops.join(" -> ")}</strong><span>Sub stops</span></div>
    <div class="wide-summary"><strong>${selectedRoute.restStop.name}</strong><span>10 min rest stop</span></div>
    <div class="wide-summary policy-summary"><strong>${selectedRoute.cancellation}</strong><span>Cancellation policy</span></div>
  `;

  travelAssist.innerHTML = `
    <div>
      <strong>${addMinutesToTime(selectedRoute.departure, -30)}</strong>
      <span>Report by</span>
    </div>
    <div>
      <strong>${getBoardingCountdown(selectedRoute, journeyDateInput.value)}</strong>
      <span>Boarding countdown</span>
    </div>
    <div>
      <strong>${getCancellationDeadline(selectedRoute, journeyDateInput.value) || "Check operator"}</strong>
      <span>Cancellation deadline</span>
    </div>
  `;

  renderPointOptions();

  seatMap.innerHTML = Array.from({ length: selectedRoute.seats }, (_, index) => {
    const seatNumber = index + 1;
    const isBooked = selectedRoute.reservedSeats.includes(seatNumber);
    const isSelected = selectedSeats.has(seatNumber);
    const genderClass = isSelected ? `gender-${(passengerGender.value || "default").toLowerCase()}` : "";
    const seatType = seatNumber % 4 === 1 || seatNumber % 4 === 0 ? "W" : "A";

    return `
      <button
        class="seat ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""} ${genderClass}"
        type="button"
        data-seat="${seatNumber}"
        ${isBooked ? "disabled" : ""}
        aria-label="Seat ${seatNumber}"
      >
        <span>${seatNumber}</span><small>${seatType}</small>
      </button>
    `;
  }).join("");

  updateTotal();
}

function updateTotal() {
  const count = selectedSeats.size;
  const subtotal = selectedRoute ? selectedRoute.price * count : 0;
  const promo = getPromoDiscount(subtotal);
  const fare = Math.max(0, subtotal - promo.discount);

  seatSummary.textContent = `${count} selected`;
  total.textContent = money.format(fare);
  fareBreakdown.textContent = count
    ? `${money.format(subtotal)} subtotal${promo.discount ? ` - ${money.format(promo.discount)} discount` : ""}${promo.note ? ` | ${promo.note}` : ""}`
    : "No seats selected";
  autoPickButton.disabled = !selectedRoute;
  clearSeatsButton.disabled = selectedSeats.size === 0;
}

function pickBestSeats(count = 1) {
  if (!selectedRoute) return;

  const unavailable = new Set(selectedRoute.reservedSeats);
  const available = Array.from({ length: selectedRoute.seats }, (_, index) => index + 1)
    .filter((seat) => !unavailable.has(seat));
  const windowSeats = available.filter((seat) => seat % 4 === 1 || seat % 4 === 0);
  const aisleSeats = available.filter((seat) => seat % 4 === 2 || seat % 4 === 3);
  const preference = seatPreference.value;
  let chosenSeats = [];

  if (preference === "together") {
    for (let index = 0; index <= available.length - count; index += 1) {
      const block = available.slice(index, index + count);
      const isContinuous = block.every((seat, seatIndex) => seatIndex === 0 || seat === block[seatIndex - 1] + 1);
      if (isContinuous) {
        chosenSeats = block;
        break;
      }
    }
  }

  if (chosenSeats.length === 0) {
    chosenSeats = [
      ...(preference === "aisle" ? aisleSeats : windowSeats),
      ...(preference === "aisle" ? windowSeats : aisleSeats),
    ].slice(0, count);
  }

  selectedSeats = new Set(chosenSeats);
  renderSelectedRoute();
  setMessage(`Auto picked ${chosenSeats.length} ${preference} seat${chosenSeats.length === 1 ? "" : "s"}.`);
}

async function loadRoutes(params = {}) {
  currentSearch = {
    ...currentSearch,
    ...params,
    journeyDate: journeyDateInput.value,
  };
  const query = new URLSearchParams(currentSearch).toString();
  allRoutes = await api(`/api/routes${query ? `?${query}` : ""}`);

  if (selectedRoute) {
    selectedRoute = allRoutes.find((route) => route.id === selectedRoute.id) || null;
  }

  applyFilters();
}

async function loadReservations() {
  const reservations = await api("/api/reservations");
  reservationsCache = reservations;
  renderReservations();
}

function renderReservations() {
  const query = ticketSearch.value.trim().toLowerCase();
  const reservations = reservationsCache.filter((reservation) => {
    if (!query) return true;

    return [
      reservation.id,
      reservation.passengerName,
      reservation.phone,
      reservation.route.from,
      reservation.route.to,
      reservation.status || "Booked",
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  if (reservations.length === 0) {
    reservationsContainer.innerHTML = `<div class="empty-state">${query ? "No ticket matched your search." : "No tickets booked yet."}</div>`;
    return;
  }

  reservationsContainer.innerHTML = reservations
    .map((reservation) => `
      <article class="ticket">
        <div>
          <h3>${reservation.id} - ${reservation.passengerName}</h3>
          <p class="ticket-route">${reservation.route.name} | ${reservation.route.departure} to ${reservation.route.arrival}</p>
          <p class="ticket-route">${reservation.route.routeStops.join(" -> ")} | 10 min rest at ${reservation.route.restStop.name}</p>
          <p class="ticket-meta">
            <span>${reservation.route.from} to ${reservation.route.to}</span>
            <span>${reservation.journeyDate || "Today"}</span>
            <span>Seats ${reservation.seats.join(", ")}</span>
            <span>${reservation.status || "Booked"}</span>
            <span>${getBoardingCountdown(reservation.route, reservation.journeyDate)}</span>
            <span>${money.format(reservation.total)}</span>
            ${reservation.discount ? `<span>${money.format(reservation.discount)} off ${reservation.promoCode}</span>` : ""}
          </p>
          <p class="ticket-help">Report by ${addMinutesToTime(reservation.route.departure, -30)} | Cancel by ${getCancellationDeadline(reservation.route, reservation.journeyDate) || "operator policy"}</p>
        </div>
        <div class="ticket-actions">
          <a class="pdf-button" href="/api/reservations/${reservation.id}/ticket.pdf" download="${reservation.id}.pdf">
            Download PDF
          </a>
          <button
            class="ghost-button checkin-button"
            type="button"
            data-checkin-id="${reservation.id}"
            ${reservation.status === "Checked in" ? "disabled" : ""}
          >${reservation.status === "Checked in" ? "Checked in" : "Check in"}</button>
          <button class="ghost-button" type="button" data-cancel-id="${reservation.id}">Cancel</button>
        </div>
      </article>
    `)
    .join("");
}

routesContainer.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite-id]");
  if (favoriteButton) {
    return;
  }

  const button = event.target.closest("[data-route-id]");
  if (!button) return;

  selectedRoute = routes.find((route) => route.id === button.dataset.routeId);
  selectedSeats = new Set();
  setMessage("");
  renderRoutes();
  renderSelectedRoute();
  scrollToSeatSelection();
});

compareStrip.addEventListener("click", (event) => {
  const button = event.target.closest("[data-route-id]");
  if (!button) return;

  selectedRoute = routes.find((route) => route.id === button.dataset.routeId);
  selectedSeats = new Set();
  setMessage("Best pick selected.");
  renderRoutes();
  renderSelectedRoute();
  scrollToSeatSelection();
});

seatMap.addEventListener("click", (event) => {
  const button = event.target.closest("[data-seat]");
  if (!button || button.disabled) return;

  const seatNumber = Number(button.dataset.seat);
  if (selectedSeats.has(seatNumber)) {
    selectedSeats.delete(seatNumber);
  } else {
    selectedSeats.add(seatNumber);
  }

  renderSelectedRoute();
});

autoPickButton.addEventListener("click", () => {
  pickBestSeats(Number(passengerInput.value) || 1);
});

clearSeatsButton.addEventListener("click", () => {
  selectedSeats = new Set();
  renderSelectedRoute();
  setMessage("");
});

[sortSelect, typeFilter, fareFilter, favoritesOnly].forEach((control) => {
  control.addEventListener("input", applyFilters);
});

timeFilter.addEventListener("input", applyFilters);

swapRouteButton.addEventListener("click", () => {
  const from = searchForm.from.value;
  searchForm.from.value = searchForm.to.value;
  searchForm.to.value = from;
  selectedRoute = null;
  selectedSeats = new Set();
  setMessage("Route swapped.");
  loadRoutes({
    from: searchForm.from.value,
    to: searchForm.to.value,
    journeyDate: journeyDateInput.value,
  }).catch((error) => setMessage(error.message, true));
});

recentSearches.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-recent-index]");
  if (!button) return;

  const search = recentSearchList[Number(button.dataset.recentIndex)];
  searchForm.from.value = search.from;
  searchForm.to.value = search.to;
  journeyDateInput.value = search.journeyDate || journeyDateInput.value;
  selectedRoute = null;
  selectedSeats = new Set();
  setMessage("");
  await loadRoutes(search);
});

passengerGender.addEventListener("change", renderSelectedRoute);
[passengerAge, promoCode, journeyDateInput].forEach((control) => {
  control.addEventListener("input", () => {
    updateTotal();
    if (control === journeyDateInput) {
      loadRoutes(currentSearch).catch((error) => setMessage(error.message, true));
    }
  });
});

cityPills.forEach((button) => {
  button.addEventListener("click", async () => {
    searchForm.from.value = button.dataset.from;
    searchForm.to.value = button.dataset.to;
    selectedRoute = null;
    selectedSeats = new Set();
    setMessage("");
    await loadRoutes({
      from: button.dataset.from,
      to: button.dataset.to,
    });
    saveRecentSearch({
      from: button.dataset.from,
      to: button.dataset.to,
      journeyDate: journeyDateInput.value,
    });
  });
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(searchForm);
  selectedRoute = null;
  selectedSeats = new Set();
  setMessage("");

  await loadRoutes({
    from: formData.get("from"),
    to: formData.get("to"),
    journeyDate: formData.get("journeyDate"),
  });
  saveRecentSearch({
    from: formData.get("from"),
    to: formData.get("to"),
    journeyDate: formData.get("journeyDate"),
  });
});

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedRoute) {
    setMessage("Select a bus before booking.", true);
    return;
  }

  try {
    const formData = new FormData(bookingForm);
    const reservation = await api("/api/reservations", {
      method: "POST",
      body: JSON.stringify({
        routeId: selectedRoute.id,
        journeyDate: journeyDateInput.value,
        boardingPoint: formData.get("boardingPoint"),
        droppingPoint: formData.get("droppingPoint"),
        passengerName: formData.get("passengerName"),
        passengerAge: formData.get("passengerAge"),
        passengerGender: formData.get("passengerGender"),
        passengerEmail: formData.get("passengerEmail"),
        promoCode: formData.get("promoCode"),
        phone: formData.get("phone"),
        seats: [...selectedSeats],
      }),
    });

    setMessage(`Booking confirmed: ${reservation.id}. PDF is ready in My trips.`);
    selectedSeats = new Set();
    bookingForm.reset();
    journeyDateInput.value ||= new Date().toISOString().slice(0, 10);
    await loadRoutes(currentSearch);
    await loadReservations();
  } catch (error) {
    setMessage(error.message, true);
  }
});

reservationsContainer.addEventListener("click", async (event) => {
  const checkInButton = event.target.closest("[data-checkin-id]");
  if (checkInButton) {
    const reservation = await api(`/api/reservations/${checkInButton.dataset.checkinId}/check-in`, { method: "PATCH" });
    setMessage(`${reservation.id} checked in successfully.`);
    await loadReservations();
    return;
  }

  const button = event.target.closest("[data-cancel-id]");
  if (!button) return;

  await api(`/api/reservations/${button.dataset.cancelId}`, { method: "DELETE" });
  setMessage(`Reservation ${button.dataset.cancelId} cancelled.`);
  await loadRoutes(currentSearch);
  await loadReservations();
});

ticketSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderReservations();
});

ticketSearch.addEventListener("input", renderReservations);

helpForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(helpForm);
  const topic = String(formData.get("helpTopic") || "").trim();
  const contact = String(formData.get("helpContact") || "").trim();
  const text = String(formData.get("helpMessage") || "").trim();

  if (!contact || !text) {
    helpStatus.textContent = "Enter ticket ID/phone and a short message.";
    helpStatus.classList.add("error");
    return;
  }

  const request = {
    id: `HELP-${Date.now().toString().slice(-6)}`,
    topic,
    contact,
    text,
    createdAt: new Date().toISOString(),
  };

  helpRequests = [request, ...helpRequests].slice(0, 5);
  localStorage.setItem("helpRequests", JSON.stringify(helpRequests));
  helpStatus.textContent = `${request.id} created. Support desk will use ${contact} to identify your trip.`;
  helpStatus.classList.remove("error");
  helpForm.reset();
});

renderRecentSearches();

Promise.all([loadRoutes(), loadReservations()]).catch((error) => {
  setMessage(error.message, true);
});
