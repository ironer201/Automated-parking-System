//button
const profilebtn = document.getElementById('profilebtn');
const carinfo = document.getElementById('carinfo');
const ownerhistorybtn = document.getElementById('ownerhistorybtn');
const bookinghistorybtn = document.getElementById('bookinghistorybtn');
const analyticsbtn = document.getElementById('analyticsbtn');

const profile = document.getElementById('profile');
const carInfo = document.getElementById('carInfo');
const ownerhis = document.getElementById('ownerhis');
const booking = document.getElementById('booking');
const analytics = document.getElementById('analytics');

//title
const title = document.getElementById('title');

//block 
    profile.style.display = 'block';
    carInfo.style.display = 'none';
    ownerhis.style.display = 'none';
    booking.style.display = 'none';
    analytics.style.display = 'none';



profilebtn.addEventListener('click', function(){
    title.textContent = "Profile";
    profile.style.display = 'block';
    carInfo.style.display = 'none';
    ownerhis.style.display = 'none';
    booking.style.display = 'none';
    analytics.style.display = 'none';
});

carinfo.addEventListener('click', function(){
    title.textContent = "Car Information";
    profile.style.display = 'none';
    carInfo.style.display = 'block';
    ownerhis.style.display = 'none';
    booking.style.display = 'none';
    analytics.style.display = 'none';
});

ownerhistorybtn.addEventListener('click', function(){
    title.textContent = "Owner History";
    profile.style.display = 'none';
    carInfo.style.display = 'none';
    ownerhis.style.display = 'block';
    booking.style.display = 'none';
    analytics.style.display = 'none';
});

bookinghistorybtn.addEventListener('click', function(){
    title.textContent = "Booking History";
    profile.style.display = 'none';
    carInfo.style.display = 'none';
    ownerhis.style.display = 'none';
    booking.style.display = 'block';
    analytics.style.display = 'none';
});

analyticsbtn.addEventListener('click', function(){
    title.textContent = "Analytics";
    profile.style.display = 'none';
    carInfo.style.display = 'none';
    ownerhis.style.display = 'none';
    booking.style.display = 'none';
    analytics.style.display = 'block';
});
//The back-end Logic start here

const nameSpan = document.getElementById('name');
const emailSpan = document.getElementById('email');
const supabaseUrl = 'https://hrfwntixjesvexqjeviv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZndudGl4amVzdmV4cWpldml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjE3MTQsImV4cCI6MjA3NDk5NzcxNH0.UaiP3UhfqS6Li6JSAEjsJkAYPfvsqkSgsSGoatOstxs';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

async function setEmail() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data?.user) return;
    const span = document.getElementById('email');
    if (span) span.textContent = data.user.email ?? '';
}

setEmail();