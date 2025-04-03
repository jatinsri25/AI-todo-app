const cron = require('node-cron');
const { sendNotification } = require('../services/notifications');
const Todo = require('../models/Todo');

cron.schedule('0 9 * * *', async () => {
  const overdueTasks = await Todo.find({
    deadline: { $lt: new Date() },
    completed: false
  }).populate('user');

  overdueTasks.forEach(task => {
    const message = `Reminder: Your task "${task.description}" is overdue!`;
    sendNotification(task.user.email, 'Task Reminder', message);
  });
});