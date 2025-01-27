document.addEventListener('DOMContentLoaded', () => {
  const messagesContainer = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');

  // Authentication check
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // Input handling
  messageInput.addEventListener('input', () => {
    sendButton.disabled = !messageInput.value.trim();
  });

  // Message sending
  sendButton.addEventListener('click', async () => {
    const content = messageInput.value.trim();
    if (!content) return;

    try {
      const response = await axios.post(
        '/chat',
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Updated to use username from response
      addMessage(response.data.content, response.data.username);
      messageInput.value = '';
      sendButton.disabled = true;
      scrollToBottom(true);
    } catch (error) {
      handleErrors(error);
    }
  });

  // Load initial messages
  loadMessages();

  async function loadMessages() {
    try {
      const response = await axios.get('/chat/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      messagesContainer.innerHTML = '';
      response.data.forEach((msg) => addMessage(msg.content, msg.username));
      scrollToBottom(true);
    } catch (error) {
      handleErrors(error);
    }
  }

  function addMessage(content, username) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    const userSpan = document.createElement('span');
    userSpan.classList.add('username');
    userSpan.textContent = `${username}: `;
    messageDiv.appendChild(userSpan);

    const contentSpan = document.createElement('span');
    contentSpan.textContent = content;
    messageDiv.appendChild(contentSpan);

    messagesContainer.appendChild(messageDiv);
  }

  function scrollToBottom(force = false) {
    if (
      force ||
      messagesContainer.scrollHeight - messagesContainer.scrollTop ===
        messagesContainer.clientHeight
    ) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function handleErrors(error) {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.clear();
        alert('Session expired. Please log in again.');
        window.location.href = '/login';
      } else {
        alert(error.response.data?.error || 'An error occurred');
      }
    } else {
      alert('Network error. Check your internet connection.');
    }
  }
});
