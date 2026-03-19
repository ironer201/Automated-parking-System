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

const supabaseUrl = "Supabased-URL";
const supabaseAnonKey = "Supabase-Anon-key";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

const nameEl = document.getElementById('name');
const emailEl = document.getElementById('email');
let currentUser = null; // Store current user

async function loadCurrentUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
        nameEl.textContent = 'Not logged in';
        emailEl.textContent = '';
        currentUser = null;
        return;
    }

    currentUser = user; // Store the user record
    emailEl.textContent = user.email || 'No email';

    const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.given_name ||
        '';

    nameEl.textContent = fullName || 'No name set';
}

loadCurrentUser();
