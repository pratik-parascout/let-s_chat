document.addEventListener('DOMContentLoaded', () => {
  const messagesContainer = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const groupList = document.getElementById('group-list');
  const createGroupBtn = document.getElementById('create-group');
  const groupNameInput = document.getElementById('group-name');
  const invitationList = document.getElementById('invitation-list');
  const searchInput = document.getElementById('invitation-search');
  const searchResultsContainer = document.getElementById('search-results');

  let currentGroupId = null;
  let lastMessageId = 0;

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  const socket = io();

  function joinGroupRoom(groupId) {
    socket.emit('joinGroup', groupId);
  }

  socket.on('newMessage', (message) => {
    if (message.groupId == currentGroupId) {
      addMessageToUI(message);
      scrollToBottom();
      lastMessageId = Math.max(lastMessageId, message.id);
    }
  });

  socket.on('invitationUpdated', (data) => {
    loadInvitations();
  });

  loadGroups();
  loadInvitations();
  setupEventListeners();

  function setupEventListeners() {
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    createGroupBtn.addEventListener('click', createGroup);
    groupList.addEventListener('click', (e) => {
      if (e.target.tagName === 'LI') {
        selectGroup(e.target.dataset.groupId);
      }
    });
    // Bind search input events
    document
      .getElementById('search-btn')
      .addEventListener('click', searchUsers);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchUsers();
    });
  }

  async function loadGroups() {
    try {
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
    // Update the group title in the header
    const groupTitleElem = document.getElementById('group-title');
    const selectedGroupElem = document.querySelector(
      `[data-group-id="${groupId}"]`
    );
    groupTitleElem.textContent = selectedGroupElem
      ? selectedGroupElem.textContent
      : 'Group';
    messagesContainer.innerHTML = '';
    lastMessageId = 0;
    joinGroupRoom(groupId);
    loadMessagesHistory();
  }

  async function loadMessagesHistory() {
    if (!currentGroupId) return;
    try {
      const response = await axios.get('/chat/messages', {
        params: { groupId: currentGroupId, lastMessageId: lastMessageId },
      });
      response.data.forEach((msg) => {
        addMessageToUI(msg);
        lastMessageId = Math.max(lastMessageId, msg.id);
      });
      scrollToBottom();
    } catch (error) {
      handleError(error);
    }
  }

  async function createGroup() {
    const groupName = groupNameInput.value.trim();
    if (!groupName) return;
    try {
      await axios.post('/chat/groups', { name: groupName });
      groupNameInput.value = '';
      loadGroups();
    } catch (error) {
      handleError(error);
    }
  }

  async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentGroupId) return;
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

  function addMessageToUI(message) {
    // Prevent duplicate rendering by checking if the message already exists
    if (document.getElementById(`msg-${message.id}`)) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.id = `msg-${message.id}`;
    messageDiv.innerHTML = `
      <span class="username">${message.username}:</span>
      <span class="content">${message.content}</span>
      <span class="timestamp">${new Date(
        message.createdAt
      ).toLocaleTimeString()}</span>
    `;
    messagesContainer.appendChild(messageDiv);
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

  // -------------------------
  // Invitation Functions
  // -------------------------
  async function loadInvitations() {
    try {
      const response = await axios.get('/invitations');
      invitationList.innerHTML = response.data
        .map((invitation) => {
          return `<li data-id="${invitation.id}">
                    ${invitation.Group.name} - Invited by: ${invitation.Inviter.username}
                    <button onclick="acceptInvitation(${invitation.id})">Accept</button>
                    <button onclick="rejectInvitation(${invitation.id})">Reject</button>
                  </li>`;
        })
        .join('');
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  }

  async function searchUsers() {
    const query = searchInput.value.trim();
    if (query.length < 2) {
      searchResultsContainer.innerHTML = '';
      return;
    }
    try {
      const response = await axios.get('/invitations/search', {
        params: { q: query },
      });
      searchResultsContainer.innerHTML = response.data
        .map(
          (user) => `
          <li data-user-id="${user.id}">
            ${user.username} (${user.email})
            <button onclick="sendInvitationFromSearch(${user.id})">Invite</button>
          </li>
        `
        )
        .join('');
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }

  async function sendInvitationFromSearch(userId) {
    if (!currentGroupId) {
      alert('Please select a group first.');
      return;
    }
    console.log(
      'Sending invitation for userId:',
      userId,
      'in group:',
      currentGroupId
    );
    try {
      const response = await axios.post('/invitations/send', {
        groupId: currentGroupId,
        invitedUserId: userId,
      });
      console.log('Invitation response:', response.data);
      alert('Invitation sent.');
      searchInput.value = '';
      searchResultsContainer.innerHTML = '';
      loadInvitations();
      socket.emit('invitationUpdated', { groupId: currentGroupId });
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert(error.response?.data?.error || 'Failed to send invitation');
    }
  }

  window.acceptInvitation = async function (invitationId) {
    try {
      await axios.post(`/invitations/${invitationId}/accept`);
      loadInvitations();
      loadGroups();
      socket.emit('invitationUpdated', { groupId: currentGroupId });
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  window.rejectInvitation = async function (invitationId) {
    try {
      await axios.post(`/invitations/${invitationId}/reject`);
      loadInvitations();
      socket.emit('invitationUpdated', { groupId: currentGroupId });
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  window.sendInvitationFromSearch = sendInvitationFromSearch;

  loadInvitations();
});
