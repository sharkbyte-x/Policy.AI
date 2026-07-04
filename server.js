// ==========================================
// STEP 1: Import Required Libraries
// ==========================================

// Express creates our web server
const express = require('express');

// Axios makes HTTP requests to external APIs
const axios = require('axios');

// Claude AI SDK
const Anthropic = require('@anthropic-ai/sdk');

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
// STEP 4: Initialize Claude AI
// ==========================================

// Create AI instance with your API key from .env
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// ==========================================
// STEP 5: Create API Routes
// ==========================================

// ROUTE 1: Get list of recent bills
// When frontend calls GET /api/bills, this runs
app.get('/api/bills', async (req, res) => {
  try {
    // Make request to Congress.gov API
    // Pulls 250 recent bills sorted by most recently updated from 119th Congress
    // Would need to change this so that users can pull bills from different congresses and sort by different criteria (e.g. most recently introduced, most popular, etc.)
    const response = await axios.get(
      `https://api.congress.gov/v3/bill?api_key=${process.env.CONGRESS_API_KEY}&limit=250&format=json&sort=updateDate+desc ` //Sort by most recently updated bills
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
app.get('/api/bill/:congress/:billType/:billNumber', async (req, res) => {
  const { congress, billType, billNumber } = req.params;
  
  try {
    // Fetch main bill details
    const billResponse = await axios.get(
      `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}?api_key=${process.env.CONGRESS_API_KEY}&format=json`
    );
    
    let billData = billResponse.data.bill;
    
    // NEW: Fetch summaries from the separate endpoint
    try {
      const summaryResponse = await axios.get(
        `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}/summaries?api_key=${process.env.CONGRESS_API_KEY}&format=json`
      );
      
      // Add summary data to bill object
      if (summaryResponse.data.summaries && summaryResponse.data.summaries.length > 0) {
        // Get the most recent summary
        billData.summary = {
          text: summaryResponse.data.summaries[0].text
        };
      }
    } catch (summaryError) {
      console.log('No summary available for this bill');
      // If summaries endpoint fails, just continue without summary
    }
    
    // NEW: Fetch full bill text
    try {
      const textResponse = await axios.get(
        `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}/text?api_key=${process.env.CONGRESS_API_KEY}&format=json`
      );
      
      if (textResponse.data.textVersions && textResponse.data.textVersions.length > 0) {
        // Get the most recent text version
        const latestText = textResponse.data.textVersions[0];
        
        billData.text = {
          version: latestText.type,
          date: latestText.date,
          formats: latestText.formats,
          url: latestText.url
        };
      }
    } catch (textError) {
      console.log('No text available for this bill');
    }
    
    res.json({ bill: billData });
  } catch (error) {
    console.error('Error fetching bill details:', error.message);
    res.status(500).json({ error: 'Failed to fetch bill details' });
  }
});

// ROUTE 3: Get AI interpretation of a bill
// Frontend sends POST request with bill text
app.post('/api/interpret', async (req, res) => {
  console.log('Received bill for interpretation');
  try {
    // Get bill information from request body
    const { billText, billTitle } = req.body;
    
    console.log('Sending to Claude...');
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are an expert policy analyst who explains federal legislation with transparency, objectivity, and ethical clarity. Your goal is to help citizens understand what bills actually do without political bias.

Bill Title: ${billTitle}

Bill Text: ${billText}

Please provide an ethical, transparent analysis:

1. **Plain Language Summary** (2-3 sentences explaining what this bill does in simple terms)

2. **Who This Affects** (specific groups of people, industries, or communities impacted)

3. **Key Provisions** (the main things this bill would change or create)

4. **Potential Impacts** (both intended benefits and possible concerns, presented objectively)

5. **Transparency Note** (any important context citizens should know, such as who sponsored it, if it's bipartisan, or if there are competing perspectives)

Be clear, accurate, and balanced. Help citizens make informed decisions.`
      }]
    });

    // Send prompt to Claude and wait for response
    const interpretation = message.content[0].text;
    
    console.log('✅ Got response from Claude');
    
    
    // Send AI's interpretation back to frontend
    res.json({ interpretation });

  } catch (error) {
    console.error('❌ Error interpreting bill:', error.message);
    res.status(500).json({ 
      error: 'Failed to interpret bill. Please try again.',
      details: error.message 
    });
  }
});

// ROUTE 4: Chat endpoint for follow-up questions ← NEW
app.post('/api/chat', async (req, res) => {
  console.log('💬 Chat message received');
  
  try {
    const { billTitle, billText, userQuestion, conversationHistory } = req.body;
    
    console.log('Sending to Claude...');
    
    // Build message history for Claude
    const messages = [
      // Add previous conversation
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      // Add current question
      {
        role: "user",
        content: userQuestion
      }
    ];
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a helpful policy expert answering questions about federal legislation. 
      
Bill: ${billTitle}

Be concise, clear, and helpful. Focus on explaining the bill accurately and answering the user's specific question.`,
      messages: messages
    });

    const response = message.content[0].text;
    
    console.log('✅ Got response from Claude');
    res.json({ response });
    
  } catch (error) {
    console.error('❌ Error in chat:', error.message);
    res.status(500).json({ 
      error: 'Failed to process question. Please try again.',
      details: error.message 
    });
  }
});

// ==========================================
// STEP 6: Start the Server
// ==========================================

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints ready`);
  console.log(`🤖 Claude AI connected`);
});