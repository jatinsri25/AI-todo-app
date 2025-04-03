import React, { useEffect, useState } from 'react';
import Create from './Create';
import './App.css';
import axios from 'axios';
import {
  BsCircle,
  BsCheckCircleFill,
  BsTrash,
  BsPencilSquare,
  BsMoon,
  BsSun,
  BsBoxArrowRight
} from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { getAISuggestions, getMotivationalTip } from './utils/aiHelpers';

const API_BASE_URL = 'http://localhost:5001';

const Home = () => {
  const [todos, setTodos] = useState([]);
  const [editData, setEditData] = useState({ id: '', task: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [motivationalTip, setMotivationalTip] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (todos.length > 0) {
      fetchAISuggestions();
      fetchMotivationalTip();
    } else {
      setAiSuggestions([]);
      setMotivationalTip('');
    }
  }, [todos]);

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/delete/${id}`);
      setTodos(todos.filter(todo => todo._id !== id));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const fetchAISuggestions = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-suggestions`, {
        tasks: todos.map(todo => ({ id: todo._id, task: todo.task, done: todo.done }))
      });
      setAiSuggestions(response.data.suggestions || []);
    } catch {
      setError('❌ Failed to fetch AI suggestions');
    }
  };

  const fetchMotivationalTip = async () => {
    try {
      setMotivationalTip(await getMotivationalTip());
    } catch {
      setMotivationalTip('');
    }
  };

  const fetchTodos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/get`);
      setTodos(Array.from(new Map(response.data.map(todo => [todo._id, todo])).values()));
    } catch {
      setError('Failed to fetch tasks. Please try again.');
      setTodos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = (todo) => {
    if (editData.id === todo._id) {
      updateTask(todo._id, editData.task);
    } else {
      setEditData({ id: todo._id, task: todo.task });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleComplete = async (id) => {
    const originalTodos = [...todos];
    setTodos(prevTodos => prevTodos.map(todo => todo._id === id ? { ...todo, done: !todo.done } : todo));
    try {
      await axios.put(`${API_BASE_URL}/edit/${id}`);
    } catch {
      setTodos(originalTodos);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      localStorage.setItem('darkMode', !prevMode);
      return !prevMode;
    });
  };

  const updateTask = async (id, updatedTask) => {
    if (!updatedTask.trim()) {
      setError('Task cannot be empty');
      setEditData({ id: '', task: '' });
      return;
    }
    const originalTodos = [...todos];
    setTodos(prevTodos => prevTodos.map(todo => todo._id === id ? { ...todo, task: updatedTask.trim() } : todo));
    setEditData({ id: '', task: '' });
    try {
      await axios.put(`${API_BASE_URL}/update/${id}`, { task: updatedTask.trim() });
    } catch {
      setTodos(originalTodos);
    }
  };

  return (
    <main className={`todo-container ${darkMode ? 'dark' : ''}`}>
      <header className="app-header">
        <h1 className="app-title">Todo List</h1>
        <div>
          <button className="dark-mode-toggle" onClick={toggleDarkMode}>
            {darkMode ? <BsSun /> : <BsMoon />}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <BsBoxArrowRight />
          </button>
        </div>
      </header>
      <Create onTaskCreated={fetchTodos} />
      {error && <div className="error-message">{error}</div>}
      {isLoading ? <div className="loading">Loading tasks...</div> : todos.length === 0 ? <div className="no-tasks">No tasks found</div> : (
        <>
          <div className="task-list">
            {todos.map(todo => (
              <div className={`task ${todo.done ? 'completed' : ''}`} key={todo._id}>
                <div className="task-content">
                  <button className="complete-btn" onClick={() => toggleComplete(todo._id)}>
                    {todo.done ? <BsCheckCircleFill /> : <BsCircle />}
                  </button>
                  {editData.id === todo._id ? (
                    <input type="text" value={editData.task} onChange={e => setEditData({ ...editData, task: e.target.value })} onKeyPress={e => e.key === 'Enter' && updateTask(todo._id, editData.task)} onBlur={() => updateTask(todo._id, editData.task)} className="edit-input" autoFocus />
                  ) : (
                    <span className={`task-text ${todo.done ? 'completed-text' : ''}`} onClick={() => handleEditToggle(todo)}>{todo.task}</span>
                  )}
                </div>
                <div className="task-actions">
                  <button className="edit-btn" onClick={() => handleEditToggle(todo)}><BsPencilSquare /></button>
                  <button className="delete-btn" onClick={() => deleteTask(todo._id)}><BsTrash /></button>
                </div>
              </div>
            ))}
          </div>
          {motivationalTip && <div className="motivational-tip">💡 {motivationalTip}</div>}
          {aiSuggestions.length > 0 && <div className="ai-response"><h3>🔍 AI Response:</h3>{aiSuggestions.map((suggestion, index) => <p key={index}>{suggestion}</p>)}</div>}
        </>
      )}
    </main>
  );
};

export default Home;