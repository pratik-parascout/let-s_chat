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

  let lastMessageId = null;

  let storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
  displayMessages(storedMessages);

  if (storedMessages.length > 0) {
    lastMessageId = storedMessages[storedMessages.length - 1].id;
  }

  messageInput.addEventListener('input', () => {
    sendButton.disabled = !messageInput.value.trim();
  });

  const sendMessage = async () => {
    const content = messageInput.value.trim();
    if (!content) return;

    try {
      const response = await axios.post('/chat', { content });

      const { id, content: messageContent, username, userId } = response.data;

      if (messageContent && username) {
        addMessage(id, messageContent, username, userId);
        messageInput.value = '';
        sendButton.disabled = true;
        scrollToBottom(true);

        updateLocalStorage({ id, content: messageContent, username, userId });
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

  async function loadNewMessages() {
    try {
      const response = await axios.get(
        `/chat/messages?lastMessageId=${lastMessageId || 0}`
      );
      const newMessages = response.data;

      if (newMessages.length === 0) return;

      newMessages.forEach((msg) =>
        addMessage(msg.id, msg.content, msg.username, msg.userId)
      );
      lastMessageId = newMessages[newMessages.length - 1].id;

      newMessages.forEach(updateLocalStorage);
    } catch (error) {
      handleErrors(error);
    }
  }

  function addMessage(id, content, username, userId) {
    if (document.getElementById(`message-${id}`)) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.id = `message-${id}`;

    const userSpan = document.createElement('span');
    userSpan.classList.add('username');
    userSpan.textContent = `${username}: `;
    messageDiv.appendChild(userSpan);

    const contentSpan = document.createElement('span');
    contentSpan.textContent = content;
    messageDiv.appendChild(contentSpan);

    messagesContainer.appendChild(messageDiv);
  }

  function displayMessages(messages) {
    messagesContainer.innerHTML = ''; // Clear previous messages
    messages.forEach((msg) =>
      addMessage(msg.id, msg.content, msg.username, msg.userId)
    );
    scrollToBottom(true);
  }

  function updateLocalStorage(newMessage) {
    let messages = JSON.parse(localStorage.getItem('chatMessages')) || [];

    messages.push(newMessage);
    if (messages.length > 10) {
      messages = messages.slice(-10);
    }

    localStorage.setItem('chatMessages', JSON.stringify(messages));
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

  // Load new messages every second
  setInterval(loadNewMessages, 1000);
});
