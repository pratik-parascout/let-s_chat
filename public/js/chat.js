document.addEventListener('DOMContentLoaded', () => {
  const messagesContainer = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const groupList = document.getElementById('group-list');
  const createGroupBtn = document.getElementById('create-group');
  const groupNameInput = document.getElementById('group-name');
  let currentGroupId = null; // Track currently selected group
  let lastMessageId = 0; // For incremental message loading

  // Authentication check
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Configure Axios defaults
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // Load initial data
  loadGroups();
  setupEventListeners();

  function setupEventListeners() {
    // Message sending
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // Group creation
    createGroupBtn.addEventListener('click', createGroup);

    // Group selection
    groupList.addEventListener('click', (e) => {
      if (e.target.tagName === 'LI') {
        selectGroup(e.target.dataset.groupId);
      }
    });
  }

  async function loadGroups() {
    try {
      // TODO: Replace with actual group loading endpoint
      const response = await axios.get('/chat/groups');
      groupList.innerHTML = response.data
        .map((group) => `<li data-group-id="${group.id}">${group.name}</li>`)
        .join('');
    } catch (error) {
      handleError(error);
    }
  }

  async function selectGroup(groupId) {
    currentGroupId = groupId;
    document.getElementById('group-title').textContent = document.querySelector(
      `[data-group-id="${groupId}"]`
    ).textContent;
    messagesContainer.innerHTML = '';
    lastMessageId = 0;
    loadMessages();
  }

  async function createGroup() {
    const groupName = groupNameInput.value.trim();
    if (!groupName) return;

    try {
      const response = await axios.post('/chat/groups', {
        name: groupName,
      });
      groupNameInput.value = '';
      loadGroups();
    } catch (error) {
      handleError(error);
    }
  }

  async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentGroupId) return;

    // Log the groupId and content to verify they are being passed correctly
    console.log('Sending message to groupId:', currentGroupId);
    console.log('Message content:', content);

    try {
      const response = await axios.post('/chat/messages', {
        content,
        groupId: currentGroupId,
      });

      messageInput.value = '';
      addMessageToUI(response.data);
      scrollToBottom();
    } catch (error) {
      handleError(error);
    }
  }

  async function loadMessages() {
    if (!currentGroupId) return;

    try {
      const response = await axios.get('/chat/messages', {
        params: {
          groupId: currentGroupId,
          lastMessageId: lastMessageId,
        },
      });

      response.data.forEach((msg) => {
        addMessageToUI(msg);
        lastMessageId = Math.max(lastMessageId, msg.id);
      });

      // Poll for new messages every 2 seconds
      setTimeout(loadMessages, 2000);
    } catch (error) {
      handleError(error);
      setTimeout(loadMessages, 5000); // Retry after 5 seconds on error
    }
  }

  function addMessageToUI(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
      <span class="username">${message.username}:</span>
      <span class="content">${message.content}</span>
      <span class="timestamp">${new Date(
        message.createdAt
      ).toLocaleTimeString()}</span>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function handleError(error) {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        alert(error.response.data.error || 'An error occurred');
      }
    } else {
      alert('Network error - please check your connection');
    }
  }
});
