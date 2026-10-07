require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the lightweight frontend
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        if (!userMessage) {
            return res.status(400).json({ error: "Message is required." });
        }

        // Fetch to OpenAI (or OpenAI-compatible) API
        // For Render, API_KEY should be set in the Render Dashboard Environment Variables
        const apiKey = process.env.API_KEY || process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: "API key is not configured on the server." });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // Or change to gpt-4o-mini / whatever model you prefer
                messages: [
                    { role: "system", content: "You are a helpful AI assistant. Keep responses short and simple, as the user is reading on a small keypad phone screen." },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error("API Error:", errData);
            return res.status(response.status).json({ error: "Failed to get AI response." });
        }

        const data = await response.json();
        const botReply = data.choices[0].message.content;

        res.json({ reply: botReply });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});