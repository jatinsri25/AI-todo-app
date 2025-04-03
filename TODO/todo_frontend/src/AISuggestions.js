import React, { useEffect, useState } from "react";
import axios from "axios";
const [aiResponse, setAiResponse] = useState("");


const API_BASE_URL = "http://localhost:5001";

const AISuggestions = ({ todos }) => {
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [motivationalTip, setMotivationalTip] = useState("");

  useEffect(() => {
    if (todos.length > 0) {
      fetchAISuggestions();
      fetchMotivationalTip();
    } else {
      setAiSuggestions([]);
      setMotivationalTip("");
    }
  }, [todos]);

 const fetchAISuggestions = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/ai-suggestions`, {
      tasks: todos.map((todo) => ({
        id: todo._id,
        task: todo.task,
        done: todo.done,
      })),
    });
    const suggestions = response.data?.response?.candidates?.map(candidate =>
      candidate?.content?.parts?.[0]?.text || "No response found."
    ) || [];

    setAiSuggestions(suggestions);
  } catch (err) {
    console.error("Failed to get AI suggestions:", err);
    setAiSuggestions(["Failed to fetch AI response."]);
  }
};

  

  const fetchMotivationalTip = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/motivational-tip`);
      setMotivationalTip(response.data.tip || "");
    } catch (err) {
      console.error("Failed to get motivational tip:", err);
      setMotivationalTip("");
    }
  };

  return (
    <div>
      {motivationalTip && (
        <div className="motivational-tip">
          <p>💡 {motivationalTip}</p>
        </div>
      )}

      {aiSuggestions.length > 0 && (
        <div className="ai-suggestions">
          <h3>📊 Priority Suggestions</h3>
          <ul>
            {aiSuggestions.map((suggestion, index) => {
              const todo = todos.find((t) => t._id === suggestion.id);
              return todo ? (
                <li key={suggestion.id || index}>
                  {todo.task}: Priority {suggestion.priority} - {suggestion.reason}
                </li>
              ) : null;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AISuggestions;
