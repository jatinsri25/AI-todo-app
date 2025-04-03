require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const TodoModel = require("./models/Todo");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found in environment variables. Using fallback or default.");
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '30d'
  });
};

app.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    
    const user = await User.create({ email, password });
    
    const token = generateToken(user._id);
    
    res.status(201).json({ 
      token,
      userId: user._id,
      email: user.email
    });
    
  } catch (err) {
    next(err);
  }
});

app.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user._id);
    
    res.json({ 
      token,
      userId: user._id,
      email: user.email
    });
    
  } catch (err) {
    next(err);
  }
});

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is protected data', user: req.user });
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes.",
});
app.use(globalLimiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "AI API rate limit exceeded. Please try again in a minute.",
});

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TODO")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error(" MongoDB connection error:", err));

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const validateTask = (req, res, next) => {
  const { task } = req.body;
  if (!task || typeof task !== "string" || task.trim().length === 0) {
    return res.status(400).json({ error: " Valid task text is required" });
  }
  req.body.task = task.trim();
  next();
};

app.post("/api/ai/task-priorities", aiLimiter, async (req, res, next) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: " No tasks provided or invalid format" });
    }

    const validTasks = tasks.filter(t => t && typeof t.task === 'string' && t.task.trim() !== '').map(t => t.task);
    if (validTasks.length === 0) {
        return res.status(400).json({ error: " No valid task content provided" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `Given these tasks: ${JSON.stringify(validTasks)}, rank them based on priority and urgency. Provide the ranked list, one task per line.`;

    console.log("Sending prompt to AI (Priorities):", prompt);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    console.log(" Full AI Response (Priorities):", JSON.stringify(result, null, 2));

    const response = result?.response;

    if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log("AI response for priorities is empty or has unexpected structure.");
      return res.json({ suggestions: ["Could not determine priorities from AI.", "Please review manually."] });
    }

    const responseText = response.candidates[0].content.parts[0].text;
    const suggestions = responseText
        .trim()
        .split('\n')
        .map(s => s.trim().replace(/^[\d.*-]+\s*/, ''))
        .filter(s => s.length > 0);

    res.json({ suggestions });

  } catch (error) {
    console.error(" AI Error (Priorities):", error);
    if (error.message.includes("API key not valid")) {
         return res.status(500).json({ error: "AI Service Error: Invalid API Key." });
    }
    next(error);
  }
});

app.post("/api/ai-suggestions", aiLimiter, async (req, res, next) => {
  try {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Invalid request format or empty tasks list" });
    }

    const taskTexts = tasks
      .map(t => t?.task)
      .filter(text => typeof text === 'string' && text.trim() !== '')
      .join(", ");

    if (!taskTexts) {
        return res.status(400).json({ error: "No valid task content provided" });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = `Given these tasks: ${taskTexts}, suggest 3-5 practical ways to prioritize and complete them efficiently. Return ONLY a simple bulleted list (use '*' for bullets), with one suggestion per line.`;

      console.log("Sending prompt to AI (Suggestions):", prompt);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      console.log("Full AI Response (Suggestions):", JSON.stringify(result, null, 2));

      const response = result?.response;

      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const responseText = response.candidates[0].content.parts[0].text;
        const suggestions = responseText
          .trim()
          .split("\n")
          .filter(line => line.trim() !== "")
          .map(line => line.trim().replace(/^[\d.*-]+\s*/, ''))
          .filter(s => s.length > 0);

        if (suggestions.length > 0) {
            return res.json({ suggestions });
        }
      }

      console.log("Using fallback suggestions due to missing/empty AI response or processing issue.");
      return res.json({
        suggestions: [
          "Group similar tasks together to minimize context switching.",
          "Complete the quickest tasks first ('quick wins') to build momentum.",
          "Use the Eisenhower Matrix (Urgent/Important) to prioritize.",
          "Break larger tasks into smaller, more manageable sub-tasks.",
          "Set specific 'focus time' blocks for important tasks."
        ],
        note: "Using default suggestions (AI service unavailable or response issue)"
      });

    } catch (aiError) {
      console.error("Error calling AI API (Suggestions):", aiError);
        if (aiError.message.includes("API key not valid")) {
            return res.status(500).json({ error: "AI Service Error: Invalid API Key." });
        }
      return res.json({
        suggestions: [
          "Complete tasks in order of deadline proximity.",
          "Tackle the most complex or challenging task when your energy is highest.",
          "Consider if any tasks can be delegated.",
          "Use the '2-minute rule': if a task takes less than 2 minutes, do it immediately.",
          "Prioritize tasks based on their impact towards your main goals."
        ],
        note: "Using default suggestions (AI service error)"
      });
    }

  } catch (error) {
    console.error("General error in AI suggestions route:", error);
    next(error);
  }
});

app.get("/api/motivational-tip", (req, res) => {
  const tips = [
      "Keep pushing forward! Every small step counts.",
      "Believe you can and you're halfway there.",
      "Don't watch the clock; do what it does. Keep going.",
      "The secret of getting ahead is getting started.",
      "Success is not final, failure is not fatal: It is the courage to continue that counts."
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  res.json({ tip: randomTip });
});

app.post("/add", validateTask, async (req, res, next) => {
  try {
    const newTodo = await TodoModel.create({ task: req.body.task, done: false });
    res.status(201).json(newTodo);
  } catch (err) {
    console.error("aError adding task:", err);
    next(err);
  }
});

app.get("/get", async (req, res, next) => {
  try {
    const todos = await TodoModel.find().sort({ createdAt: -1 }).lean();
    res.json(todos);
  } catch (err) {
    console.error("Error getting tasks:", err);
    next(err);
  }
});

app.put("/edit/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "_idInvalid task ID format" });
    }
    const updatedTodo = await TodoModel.findByIdAndUpdate(id, { done: true }, { new: true });

    if (!updatedTodo) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTodo);
  } catch (err) {
    console.error(" Error marking task done:", err);
    next(err);
  }
});

app.put("/update/:id", validateTask, async (req, res, next) => {
  try {
    const { id } = req.params;
     if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid task ID format" });
    }
    const updatedTodo = await TodoModel.findByIdAndUpdate(id, { task: req.body.task }, { new: true });

    if (!updatedTodo) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTodo);
  } catch (err) {
    console.error("Error updating task text:", err);
    next(err);
  }
});

app.delete("/delete/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
     if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid task ID format" });
    }
    const deletedTodo = await TodoModel.findByIdAndDelete(id);

    if (!deletedTodo) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully", deletedTaskId: id });
  } catch (err) {
    console.error("Error deleting task:", err);
    next(err);
  }
});

app.get("/api/test-gemini", aiLimiter, async (req, res) => {
  try {
    console.log("Testing Gemini API connection...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Hello! Please respond ONLY with the text: The API is working correctly." }] }],
    });

    console.log(" Test AI Response:", JSON.stringify(result, null, 2));

    const response = result?.response;
    const testText = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    res.json({
      success: true,
      apiKeyLast4: GEMINI_API_KEY.slice(-4),
      aiResponse: testText || "No text received from AI.",
    });
  } catch (error) {
    console.error("API Test Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unknown error occurred during the test.",
      apiKeyLast4: GEMINI_API_KEY.slice(-4),
      details: error.toString()
    });
  }
});

app.use((err, req, res, next) => {
  console.error("Global Error Handler Caught:", err.stack || err);

  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";

  res.status(statusCode).json({
     error: message,
     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server listening attentively on port: ${PORT}`));

module.exports = app;