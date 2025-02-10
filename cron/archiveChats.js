// cron/archiveChats.js
const cron = require('node-cron');
const { Op } = require('sequelize');
const sequelize = require('../utils/database');
const Message = require('../models/chat');
const ArchivedChat = require('../models/archivedChat');

// Schedule the job to run every day at midnight (server time)
// The cron expression '0 0 * * *' means at minute 0 of hour 0 (i.e. midnight) every day.
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily archive job...');
  try {
    // Start a transaction
    const transaction = await sequelize.transaction();

    // Calculate the timestamp for one day ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find all messages older than one day
    const oldMessages = await Message.findAll({
      where: {
        createdAt: { [Op.lt]: oneDayAgo },
      },
      transaction,
    });

    if (oldMessages.length > 0) {
      // Prepare data for bulk insertion into ArchivedChat
      const archivedData = oldMessages.map((msg) => ({
        content: msg.content,
        username: msg.username,
        fileUrl: msg.fileUrl,
        fileType: msg.fileType,
        userId: msg.userId,
        groupId: msg.groupId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      }));

      // Bulk create archived messages
      await ArchivedChat.bulkCreate(archivedData, { transaction });

      // Delete the archived messages from the main Chat table
      await Message.destroy({
        where: { createdAt: { [Op.lt]: oneDayAgo } },
        transaction,
      });

      console.log(`Archived and deleted ${oldMessages.length} messages.`);
    } else {
      console.log('No messages to archive.');
    }

    await transaction.commit();
  } catch (error) {
    console.error('Error archiving messages:', error);
  }
});
