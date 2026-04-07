// ==========================================
// STEP 1: Import Required Libraries
// ==========================================

// Express creates our web server
const express = require('express');

// Axios makes HTTP requests to external APIs
const axios = require('axios');

// Google's Gemini AI library
const { GoogleGenerativeAI } = require('@google/generative-ai');

// CORS allows frontend and backend to communicate
const cors = require('cors');

// Dotenv loads our API keys from .env file
require('dotenv').config();

// ==========================================
// STEP 2: Initialize Express App
// ==========================================

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// STEP 3: Configure Middleware
// ==========================================

// These are functions that process requests before they reach our routes

// CORS: Allows requests from any origin
app.use(cors());

// Parse JSON data from requests
app.use(express.json());

// Serve static files (HTML, CSS, JS) from 'public' folder
app.use(express.static('public'));

// ==========================================
// STEP 4: Initialize Gemini AI
// ==========================================

// Create AI instance with your API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// STEP 5: Create API Routes
// ==========================================

// ROUTE 1: Get list of recent bills
// When frontend calls GET /api/bills, this runs
app.get('/api/bills', async (req, res) => {
  try {
    // Make request to Congress.gov API
    const response = await axios.get(
      `https://api.congress.gov/v3/bill?api_key=${process.env.CONGRESS_API_KEY}&limit=20&format=json`
    );
    
    // Send the data back to frontend
    res.json(response.data);
  } catch (error) {
    // If something goes wrong, send error message
    console.error('Error fetching bills:', error.message);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// ROUTE 2: Get details of a specific bill
// URL pattern: /api/bill/118/hr/1234
app.get('/api/bill/:congress/:billType/:billNumber', async (req, res) => {
  // Extract parameters from URL
  const { congress, billType, billNumber } = req.params;
  
  try {
    // Request specific bill details
    const response = await axios.get(
      `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}?api_key=${process.env.CONGRESS_API_KEY}&format=json`
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching bill details:', error.message);
    res.status(500).json({ error: 'Failed to fetch bill details' });
  }
});

// ROUTE 3: Get AI interpretation of a bill
// Frontend sends POST request with bill text
app.post('/api/interpret', async (req, res) => {
  try {
    // Get bill information from request body
    const { billText, billTitle } = req.body;
    
    // Select Gemini model to use
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create a detailed prompt for the AI
    const prompt = `You are a helpful assistant that explains federal legislation in simple terms. 
    
Bill Title: ${billTitle}

Bill Text: ${billText}

Please provide:
1. A brief summary (2-3 sentences)
2. Who this bill affects
3. Key provisions (main points)
4. Potential impact

Keep the explanation accessible to the general public. Use simple language.`;

    // Send prompt to Gemini and wait for response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const interpretation = response.text();
    
    // Send AI's interpretation back to frontend
    res.json({ interpretation });
  } catch (error) {
    console.error('Error interpreting bill:', error.message);
    res.status(500).json({ error: 'Failed to interpret bill. Please try again.' });
  }
});

// ==========================================
// STEP 6: Start the Server
// ==========================================

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints ready`);
  console.log(`🤖 Gemini AI connected`);
});