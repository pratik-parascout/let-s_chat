document.addEventListener('DOMContentLoaded', () => {
  const messagesContainer = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  messageInput.addEventListener('input', () => {
    sendButton.disabled = !messageInput.value.trim();
  });

  const sendMessage = async () => {
    const content = messageInput.value.trim();
    if (!content) return;

    try {
      const response = await axios.post('/chat', { content });

      // Ensure response data contains all fields
      const { content: messageContent, username, userId } = response.data;

      if (messageContent && username) {
        addMessage(messageContent, username, userId);
        messageInput.value = '';
        sendButton.disabled = true;
        scrollToBottom(true);
      } else {
        console.error('Invalid response structure:', response.data);
        alert('Failed to send the message.');
      }
    } catch (error) {
      console.error('Send message error:', error);
      handleErrors(error);
    }
  };

  sendButton.addEventListener('click', sendMessage);

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Load initial messages
  loadMessages();

  async function loadMessages() {
    try {
      const response = await axios.get('/chat/messages');
      messagesContainer.innerHTML = '';
      response.data.forEach((msg) =>
        addMessage(msg.content, msg.username, msg.userId)
      );
      scrollToBottom(true);
    } catch (error) {
      handleErrors(error);
    }
  }

  function addMessage(content, username, userId) {
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
