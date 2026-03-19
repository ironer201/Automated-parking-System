import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔴 PUT YOUR OWN KEYS HERE
const supabaseUrl = "Supabased-URL";
const supabaseAnonKey = "Supabase-Anon-key";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const form = document.getElementById("bookingForm");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const vehicleNumber = document.getElementById("vehicleNumber").value;
  const vehicleType = document.getElementById("vehicleType").value;
  const durationOfStay = document.getElementById("durationOfStay").value;
  const paymentType = document.getElementById("paymentType").value;
  const paymentNumber = document.getElementById("paymentNumber").value;
  const bookingDate = document.getElementById("bookingDate").value;
  const startTime = document.getElementById("startTime").value;

  if (
    !vehicleNumber ||
    !vehicleType ||
    !durationOfStay ||
    !paymentType ||
    !paymentNumber ||
    !bookingDate ||
    !startTime
  ) {
    alert("Please fill all fields!");
    return;
  }

  const { error } = await supabase.from("parking_bookings").insert([
    {
      vehicle_number: parseInt(vehicleNumber),
      vehicle_type: vehicleType,
      duration_of_stay: durationOfStay,
      payment_type: paymentType,
      payment_amount: parseFloat(paymentNumber),
      booking_date: bookingDate,
      start_time: startTime
    }
  ]);

  if (error) {
    console.error(error);
    alert("Booking failed: " + error.message);
  } else {
    alert("Booking successful!");
    form.reset();
  }
});
