document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const messagesContainer = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const groupList = document.getElementById('group-list');
  const createGroupBtn = document.getElementById('create-group');
  const groupNameInput = document.getElementById('group-name');
  const invitationList = document.getElementById('invitation-list');
  const searchInput = document.getElementById('invitation-search');
  const searchResultsContainer = document.getElementById('search-results');
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('upload-btn');

  let currentGroupId = null;
  let lastMessageId = 0; // For initial history load

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  const username = localStorage.getItem('username') || 'Unknown';

  // Initialize Socket.IO client
  const socket = io();

  // Join a group room with groupId and username
  function joinGroupRoom(groupId) {
    socket.emit('joinGroup', { groupId, username });
  }

  // Socket listeners
  socket.on('newMessage', (message) => {
    if (message.groupId == currentGroupId) {
      addMessageToUI(message);
      scrollToBottom();
      lastMessageId = Math.max(lastMessageId, message.id);
    }
  });

  socket.on('userJoined', (data) => {
    addSystemMessage(`${data.username} has joined the chat.`);
  });

  socket.on('userLeft', (data) => {
    addSystemMessage(`${data.username} has left the chat.`);
  });

  socket.on('invitationUpdated', () => {
    loadInvitations();
  });

  // Initial loads and setup event listeners
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
    document
      .getElementById('search-btn')
      .addEventListener('click', searchUsers);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchUsers();
    });
    // Bind upload button to trigger file input
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
    // When a file is selected, trigger sendFile()
    fileInput.addEventListener('change', sendFile);
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

  async function sendFile() {
    if (!currentGroupId) {
      alert('Please select a group first.');
      return;
    }
    const file = fileInput.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      // Upload file to AWS S3 using our /upload endpoint
      const uploadResponse = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fileUrl = uploadResponse.data.fileUrl;
      const fileType = file.type;
      // Send a multimedia message with fileUrl and fileType
      const messageResponse = await axios.post('/chat/messages', {
        content: '', // Optionally, a caption can be added
        groupId: currentGroupId,
        fileUrl,
        fileType,
      });
      addMessageToUI(messageResponse.data);
      scrollToBottom();
      fileInput.value = ''; // Reset file input
    } catch (error) {
      handleError(error);
    }
  }

  function addMessageToUI(message) {
    // Prevent duplicate rendering by checking if the message element exists
    if (document.getElementById(`msg-${message.id}`)) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.id = `msg-${message.id}`;
    let innerHTML = `<span class="username">${message.username}:</span>`;
    if (message.content) {
      innerHTML += `<span class="content">${message.content}</span>`;
    }
    if (message.fileUrl) {
      if (message.fileType && message.fileType.startsWith('image')) {
        innerHTML += `<img src="${message.fileUrl}" alt="Image" class="chat-image" />`;
      } else if (message.fileType && message.fileType.startsWith('video')) {
        innerHTML += `<video controls class="chat-video">
                        <source src="${message.fileUrl}" type="${message.fileType}">
                      </video>`;
      } else {
        innerHTML += `<a href="${message.fileUrl}" target="_blank" class="download-link">Download File</a>`;
      }
    }
    innerHTML += `<span class="timestamp">${new Date(
      message.createdAt
    ).toLocaleTimeString()}</span>`;
    messageDiv.innerHTML = innerHTML;
    messagesContainer.appendChild(messageDiv);
  }

  function addSystemMessage(text) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'message system';
    systemDiv.textContent = text;
    messagesContainer.appendChild(systemDiv);
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
