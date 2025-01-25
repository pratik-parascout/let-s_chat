document.querySelector('#signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.querySelector('#name').value;
  const email = document.querySelector('#email').value;
  const phone = document.querySelector('#phone').value;
  const password = document.querySelector('#password').value;

  if (!username || !email || !password) {
    alert('Please fill in all fields and select a rating.');
    return;
  }

  const obj = {
    username,
    email,
    phone,
    password,
  };
  try {
    const response = await axios.post('/signup', obj);
    console.log(response);
    if (response.status === 201) {
      alert('User created successfully');
      window.location.href = '../login/login.html';
    }
  } catch (err) {
    console.log(err);
    if (err.response && err.response.status === 409) {
      alert('User already exists, Please Login');
    } else {
      alert('An error occurred during signup');
    }
  }
});
