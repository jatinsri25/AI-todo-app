import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

const Create = ({ onTaskAdded }) => {
    const [task, setTask] = useState('');
    const [error, setError] = useState('');

    const createTask = async (e) => {
        e.preventDefault();
        
        if (!task.trim()) {
            setError('Task cannot be empty');
            return;
        }

        try {
            setError('');
            const response = await axios.post('http://localhost:5001/add', { 
                task: task.trim() 
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 201) {
                setTask('');
                if (onTaskAdded) {
                    onTaskAdded();
                } else {
                    window.location.reload();
                }
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to add task';
            setError(errorMessage);
            console.error('Error adding task:', err);
        }
    };

    return (
        <div className='create-form'>
            <input
                type='text'
                placeholder='Enter a task'
                value={task}
                onChange={(e) => {
                    setTask(e.target.value);
                    setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && createTask(e)}
            />
            <button onClick={createTask}>ADD</button>
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default Create;