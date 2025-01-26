document.querySelector('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value.trim();

  if (!email || !password) {
    alert('Please fill in all required fields.');
    return;
  }

  const obj = { email, password };

  try {
    const response = await axios.post('/login', obj);

    if (response.status === 200) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);

      axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${response.data.token}`;

      alert(response.data.msg || 'Login successful');
      window.location.href = '/chat';
    }
  } catch (err) {
    console.error(err);

    if (err.response) {
      switch (err.response.status) {
        case 400:
          alert('Please provide both email and password');
          break;
        case 401:
          alert('Invalid credentials');
          break;
        case 404:
          alert('User not found');
          break;
        case 500:
          alert('Server error. Please try again later');
          break;
        default:
          alert(err.response.data.msg || 'An error occurred during login');
      }
    } else {
      alert('Unable to connect to the server. Please try again later.');
    }
  }
});
