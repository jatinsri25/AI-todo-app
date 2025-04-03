// src/utils/aiHelpers.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001'; // Make sure this is correct

export const getAISuggestions = async (tasks) => {
    try {
        console.log("Request body:", tasks); // Debugging
        const response =await axios.post(`${API_BASE_URL}/api/ai-suggestions`, { tasks });
 // Send as object
        return response.data.suggestions || [];
    } catch (error) {
        console.error("Error fetching AI suggestions:", error.response?.data || error.message);
        return [];
    }
};



export const getMotivationalTip = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/motivational-tip`);
        return response.data.tip || '';
    } catch (error) {
        console.error("Error fetching motivational tip:", error);
        return '';
    }
};
