const express = require('express');
const TodoModel = require('../models/Todo');
const { verifyToken } = require('../middleware/authMiddleware'); // Import auth middleware

const router = express.Router();

// Add new todo task
router.post('/add', verifyToken, (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: 'Task is required' });

  TodoModel.create({ task })
    .then(result => res.json(result))
    .catch(err => res.status(500).json({ error: 'Failed to add task', err }));
});

// Get all tasks
router.get('/get', verifyToken, (req, res) => {
  TodoModel.find()
    .then(result => res.json(result))
    .catch(err => res.status(500).json({ error: 'Failed to fetch tasks', err }));
});

// Update task as done
router.put('/edit/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  TodoModel.findByIdAndUpdate(id, { done: true }, { new: true })
    .then(result => res.json(result))
    .catch(err => res.status(500).json({ error: 'Failed to update task', err }));
});

// Update task content
router.put('/update/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { task } = req.body;

  if (!task) return res.status(400).json({ error: 'Task content is required' });

  TodoModel.findByIdAndUpdate(id, { task }, { new: true })
    .then(result => res.json(result))
    .catch(err => res.status(500).json({ error: 'Failed to update task', err }));
});

// Delete a task
router.delete('/delete/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  TodoModel.findByIdAndDelete(id)
    .then(result => res.json(result))
    .catch(err => res.status(500).json({ error: 'Failed to delete task', err }));
});

module.exports = router;
