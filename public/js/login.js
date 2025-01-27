document.querySelector('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value.trim();

  if (!email || !password) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    const response = await axios.post('/login', { email, password });

    if (response.status === 200) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.username); // NEW
      setTimeout(() => {
        window.location.href = '/chat';
      }, 100);
    }
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.msg || 'Login failed. Please try again.');
  }
});
