document.querySelector('#signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect input values
  const username = document.querySelector('#name').value.trim();
  const email = document.querySelector('#email').value.trim();
  const phone = document.querySelector('#phone').value.trim();
  const password = document.querySelector('#password').value.trim();

  // Validate inputs
  if (!username || !email || !password) {
    alert('Please fill in all required fields.');
    return;
  }

  const obj = { username, email, phone, password };

  try {
    // Send request to the server
    const response = await axios.post('/signup', obj);

    if (response.status === 201) {
      alert('User created successfully');
      document.querySelector('#signup-form').reset();
      window.location.href = '../login'; // Redirect to login page
    }
  } catch (err) {
    console.error(err);

    if (err.response) {
      // Handle specific error responses
      if (err.response.status === 400) {
        alert('User already exists');
      } else if (err.response.status === 409) {
        alert('User already exists, Please Login');
      } else {
        alert(err.response.data.error || 'An error occurred during signup');
      }
    } else {
      // Handle network errors or unexpected issues
      alert('Unable to connect to the server. Please try again later.');
    }
  }
});
