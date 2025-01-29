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

  let lastMessageId = null; // Track the last message ID

  messageInput.addEventListener('input', () => {
    sendButton.disabled = !messageInput.value.trim();
  });

  const sendMessage = async () => {
    const content = messageInput.value.trim();
    if (!content) return;

    try {
      const response = await axios.post('/chat', { content });

      // Ensure response data contains all fields
      const { id, content: messageContent, username, userId } = response.data;

      if (messageContent && username) {
        addMessage(id, messageContent, username, userId);
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

  async function loadMessages() {
    try {
      const response = await axios.get('/chat/messages');
      const messages = response.data;

      if (messages.length === 0) return;

      const newMessages = messages.filter(
        (msg) => lastMessageId === null || msg.id > lastMessageId
      );

      if (newMessages.length > 0) {
        newMessages.forEach((msg) =>
          addMessage(msg.id, msg.content, msg.username, msg.userId)
        );
        lastMessageId = newMessages[newMessages.length - 1].id; // Update last loaded message ID
        scrollToBottom(true);
      }
    } catch (error) {
      handleErrors(error);
    }
  }

  function addMessage(id, content, username, userId) {
    // Check if message is already added
    if (document.getElementById(`message-${id}`)) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.id = `message-${id}`; // Assign unique ID

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

  // Load messages initially
  loadMessages();

  // Check for new messages every second
  setInterval(loadMessages, 1000);
});
