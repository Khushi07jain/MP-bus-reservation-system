function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function textLine(text, x, y, size = 12) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildTicketContent(reservation) {
  const route = reservation.route;
  const verificationCode = `${reservation.id}-${reservation.busId}-${reservation.seats.join("")}`;

  const lines = [
    "0.95 0.98 0.97 rg 0 0 595 842 re f",
    "0.08 0.20 0.18 rg 0 742 595 100 re f",
    textLine("BUS TICKET", 48, 790, 26),
    textLine("Transit Desk Reservation", 48, 764, 13),
    "0.96 0.62 0.04 rg 430 766 95 28 re f",
    textLine(reservation.id, 445, 775, 13),

    "1 1 1 rg 36 116 523 585 re f",
    "0.82 0.88 0.86 RG 36 116 523 585 re S",
    "0 0 0 rg",

    textLine("Passenger", 64, 654, 11),
    textLine(reservation.passengerName, 64, 630, 18),

    textLine("Phone", 330, 654, 11),
    textLine(reservation.phone, 330, 630, 14),

    "0.86 0.90 0.88 RG 64 600 467 0 m 531 600 l S",

    textLine("Bus", 64, 566, 11),
    textLine(route.name, 64, 542, 18),

    textLine("Route", 64, 506, 11),
    textLine(`${route.origin} to ${route.destination}`, 64, 482, 18),

    textLine("Journey Date", 330, 506, 11),
    textLine(reservation.journeyDate || "Today", 330, 482, 14),

    textLine("Departure", 64, 446, 11),
    textLine(route.departure, 64, 422, 18),

    textLine("Arrival", 222, 446, 11),
    textLine(route.arrival, 222, 422, 18),

    textLine("Duration", 380, 446, 11),
    textLine(route.duration, 380, 422, 18),

    "0.86 0.90 0.88 RG 64 392 467 0 m 531 392 l S",

    textLine("Seats", 64, 356, 11),
    textLine(reservation.seats.join(", "), 64, 332, 22),

    textLine("Status", 64, 310, 11),
    textLine(reservation.status || "Booked", 64, 296, 12),

    textLine("Total Fare", 330, 356, 11),
    textLine(`Rs ${reservation.total}`, 330, 332, 22),

    ...(reservation.discount
      ? [
          textLine(
            `Discount: Rs ${reservation.discount} (${reservation.promoCode})`,
            330,
            310,
            11
          ),
        ]
      : []),

    textLine("Booked At", 64, 284, 11),
    textLine(formatDate(reservation.bookedAt), 64, 260, 14),

    textLine("Verification Code", 330, 284, 11),
    textLine(verificationCode, 330, 260, 14),

    textLine("Boarding", 64, 232, 11),
    textLine(
      reservation.boardingPoint ||
        route.boardingPoints?.[0] ||
        route.origin,
      64,
      212,
      12
    ),

    textLine("Dropping", 330, 232, 11),
    textLine(
      reservation.droppingPoint ||
        route.droppingPoints?.[0] ||
        route.destination,
      330,
      212,
      12
    ),

    "0.08 0.47 0.43 rg 64 184 467 44 re f",
    textLine(
      "Show this PDF ticket at boarding. Carry a valid photo ID.",
      86,
      202,
      13
    ),

    "0.37 0.44 0.42 rg",
    textLine("Thank you for choosing Transit Desk.", 64, 84, 11),
  ];

  return lines.join("\n");
}

function createTicketPdf(reservation) {
  const content = buildTicketContent(reservation);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

module.exports = {
  createTicketPdf,
};