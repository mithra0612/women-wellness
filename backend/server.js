const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

// Import all Mongoose models
const Maternal = require("./Models/Maternal"); 
const Blogs = require("./Models/Blogs");
const Cancer = require("./Models/Cancer");
const HormonalDisorder = require("./Models/HormonalDisorder");
const ReproductiveDisorder = require("./Models/ReproductiveDisorders");
const ReproductivePhenomena = require("./Models/ReproductivePhenomena");
const SexualIntimate = require("./Models/SexualIntimate");
const Schemes = require("./Models/Schemes");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/Blog', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Gemini API configuration
const API_KEY = "AIzaSyBcmdSino5nfSwjB99RJ67mw55wkf-UyZQ";  
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Initialize Gemini AI legacy SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyB99Sd3oSU1NdjYbG6AXizqJJ4uvDspLEg');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Database Content Routes
app.get("/api/maternal", async (req, res) => {
  try {
    const maternalContent = await Maternal.find();
    res.json(maternalContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/blogs", async (req, res) => {
  try {
    const blogContent = await Blogs.find();
    res.json(blogContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/cancer", async (req, res) => {
  try {
    const blogContent = await Cancer.find();
    res.json(blogContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hormonaldisorders', async (req, res) => {
  try {
    const hormonaldisorder = await HormonalDisorder.find();
    res.json(hormonaldisorder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/reproductivedisorders', async (req, res) => {
  try {
    const reproductivedisorders = await ReproductiveDisorder.find();
    res.json(reproductivedisorders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/reproductivephenomena', async (req, res) => {
  try {
    const reproductivephenomena = await ReproductivePhenomena.find();
    res.json(reproductivephenomena);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/sexualintimate', async (req, res) => {
  try {
    const sexualintimate = await SexualIntimate.find();
    res.json(sexualintimate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/schemes', async (req, res) => {
  try {
    const schemes = await Schemes.find();
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Gemini API functions
async function getGeminiResponse(userMessage) {
  try {
    const response = await axios.post(
      API_URL,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
        generationConfig: {
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "text/plain",
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    return `Error: ${error.response?.data?.error?.message || error.message}`;
  }
}

// Gemini AI Chat Routes
// Original implementation using Google SDK
app.post("/chat/legacy", async (req, res) => {
  try {
    const chatHistory = req.body.history || [];
    const msg = req.body.chat;
    
    const chat = model.startChat({
      history: chatHistory
    });

    const result = await chat.sendMessage(msg);
    const response = await result.response;
    const text = response.text();

    res.send({ "text": text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New implementation using direct API calls
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const reply = await getGeminiResponse(userMessage);
  res.json({ reply });
});

app.post("/stream", async (req, res) => {
  try {
    const chatHistory = req.body.history || [];
    const msg = req.body.chat;
  
    const chat = model.startChat({
      history: chatHistory
    });
  
    res.setHeader('Content-Type', 'text/plain');
    const result = await chat.sendMessageStream(msg);
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(chunkText);
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});