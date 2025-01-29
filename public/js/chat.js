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

  let storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
  let lastMessageId = storedMessages.length
    ? storedMessages[storedMessages.length - 1].id
    : 0;

  // Display stored messages instantly
  storedMessages.forEach(({ content, username }) =>
    addMessage(content, username)
  );

  // Fetch only new messages
  loadNewMessages();

  messageInput.addEventListener('input', () => {
    sendButton.disabled = !messageInput.value.trim();
  });

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    try {
      const response = await axios.post('/chat', { content });
      const { content: messageContent, username, id } = response.data;

      addMessage(messageContent, username);
      updateLocalStorage({ id, content: messageContent, username });

      messageInput.value = '';
      sendButton.disabled = true;
      scrollToBottom(true);
    } catch (error) {
      console.error('Send message error:', error);
      handleErrors(error);
    }
  }

  async function loadNewMessages() {
    try {
      const response = await axios.get(
        `/chat/messages?lastMessageId=${lastMessageId}`
      );
      const newMessages = response.data;

      newMessages.forEach(({ id, content, username }) => {
        addMessage(content, username);
        updateLocalStorage({ id, content, username });
      });

      if (newMessages.length) {
        lastMessageId = newMessages[newMessages.length - 1].id;
      }

      // scrollToBottom(true);
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

    const contentSpan = document.createElement('span');
    contentSpan.textContent = content;

    messageDiv.appendChild(userSpan);
    messageDiv.appendChild(contentSpan);
    messagesContainer.appendChild(messageDiv);
  }

  function updateLocalStorage(newMessage) {
    storedMessages.push(newMessage);

    if (storedMessages.length > 10) {
      storedMessages.shift(); // Keep only the latest 10 messages
    }

    localStorage.setItem('messages', JSON.stringify(storedMessages));
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

  setInterval(loadNewMessages, 1000); // Check for new messages every second
});
