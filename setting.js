// No import needed - supabase will be available globally from script tag

  // ── Tab switching ───────────────────────────────────────
  const tabButtons = document.querySelectorAll('.tab-btn');
  const settingCards = document.querySelectorAll('.setting-card');

  console.log(`Found ${tabButtons.length} tabs`);

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log("Tab clicked:", button.getAttribute('data-target'));

      tabButtons.forEach(btn => btn.classList.remove('active'));
      settingCards.forEach(card => card.classList.remove('active'));

      button.classList.add('active');

      const target = button.getAttribute('data-target');
      const targetCard = document.querySelector(`.setting-card[data-setting="${target}"]`);

      if (targetCard) {
        targetCard.classList.add('active');
      } else {
        console.warn("Target card not found:", target);
      }
    });
  });



document.addEventListener('DOMContentLoaded', () => {
  console.log("Script loaded – DOM ready");

  // Check if supabase is available
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error('Supabase library not loaded. Make sure to include the script tag.');
    alert('Error: Supabase library not loaded. Please check your internet connection and refresh.');
    return;
  }

  const { createClient } = supabase;
  
  const supabaseClient = createClient(
    'https://hrfwntixjesvexqjeviv.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZndudGl4amVzdmV4cWpldml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjE3MTQsImV4cCI6MjA3NDk5NzcxNH0.UaiP3UhfqS6Li6JSAEjsJkAYPfvsqkSgsSGoatOstxs'
  );

  console.log("Supabase client initialized");


  // ── Profile form ────────────────────────────────────────
  const profileForm = document.getElementById('profileForm');

  if (!profileForm) {
    console.error("profileForm not found!");
    return;
  }

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Profile form submitted");

    const name = document.getElementById('name')?.value?.trim() ?? '';
    const email = document.getElementById('email')?.value?.trim() ?? '';
    const phone = document.getElementById('phone')?.value?.trim() ?? '';

    if (!name || !email) {
      alert('Name and email are required!');
      return;
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      alert('You must be logged in to update your profile.');
      console.error('Auth error:', authError);
      return;
    }

    console.log("User ID:", user.id);

    const profileData = {
      name,
      email,
      phone: phone || null,
    };

    const { data, error } = await supabaseClient
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('Update error:', error);
      alert('Failed to update: ' + (error.message || 'Unknown error'));
      return;
    }

    console.log('Updated:', data);
    alert('Profile updated successfully!');
  });

  // ── Address form ────────────────────────────────────────
  const addressForm = document.getElementById('addressForm');

  if (!addressForm) {
    console.error('addressForm not found!');
  } else {
    addressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const presentaddress = document.getElementById('presentAddress')?.value?.trim() ?? '';
      const permentaddress = document.getElementById('permentAddress')?.value?.trim() ?? '';
      const postalcode = document.getElementById('postalCode')?.value?.trim() ?? '';

      if (!presentaddress || !permentaddress || !postalcode) {
        alert('All address fields are required!');
        return;
      }

      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      const user = session?.user;

      if (sessionError || !user) {
        alert('You must be logged in to update your address.');
        console.error('Auth error:', sessionError);
        return;
      }

      const addressData = {
        presentaddress,
        permentaddress,
        postalcode,
      };

      const { data, error } = await supabaseClient
        .from('profiles')
        .update(addressData)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('Update error:', error);
        alert('Failed to update: ' + (error.message || 'Unknown error'));
        return;
      }

      console.log('Updated:', data);
      alert('Address updated successfully!');
    });
  }

  // ── Car information form ─────────────────────────────────
          const carDetailsForm = document.getElementById('carDetailsForm');

        if (!carDetailsForm) {
          console.error('carDetailsForm not found!');
        } else {
          carDetailsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const carCompany = document.getElementById('carCompany')?.value?.trim() ?? '';
            const carModel = document.getElementById('carModel')?.value?.trim() ?? '';
            const carColor = document.getElementById('carColor')?.value?.trim() ?? '';
            const carLicense = document.getElementById('carLicense')?.value?.trim() ?? '';

            if (!carCompany || !carModel || !carColor || !carLicense) {
              alert('All car fields are required!');
              return;
            }

            const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
            const user = session?.user;

            if (sessionError || !user) {
              alert('You must be logged in to update car details.');
              console.error('Auth error:', sessionError);
              return;
            }

            const carData = { 
              user_id: user.id,
              carCompany: carCompany,
              carModel: carModel,
              carColor: carColor,
              carLicense: carLicense,
            };

            // Use user_id as the conflict column to update existing row for this user
            const { data, error } = await supabaseClient
              .from('car_registrations')
              .upsert(carData, { 
                onConflict: 'user_id'  // Changed from 'carLicense' to 'user_id'
              })
              .select();

            if (error) {
              console.error('Upsert error:', error);
              alert('Failed to update car info: ' + (error.message || 'Unknown error'));
              return;
            }

            console.log('Car info saved:', data);
            alert('Car info updated successfully!');
          });
        }
});
