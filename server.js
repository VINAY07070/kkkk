require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Single File Frontend (HTML, CSS, JS combined)
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Jio AI Chat</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: sans-serif; background-color: #f2f2f2; color: #333; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .header { background-color: #005ce6; color: #fff; padding: 8px; text-align: center; font-weight: bold; font-size: 16px; flex-shrink: 0; }
        #chat-container { flex-grow: 1; overflow-y: auto; padding: 10px; background-color: #ece5dd; display: flex; flex-direction: column; gap: 8px; }
        .message { max-width: 85%; padding: 8px 10px; border-radius: 8px; font-size: 15px; line-height: 1.3; word-wrap: break-word; }
        .message.user { align-self: flex-end; background-color: #dcf8c6; border: 1px solid #c9e6b3; }
        .message.bot { align-self: flex-start; background-color: #fff; border: 1px solid #e0e0e0; }
        .message.loading { color: #888; font-style: italic; background-color: transparent; border: none; }
        #chat-form { display: flex; background-color: #fff; padding: 5px; border-top: 1px solid #ccc; flex-shrink: 0; }
        #user-input { flex-grow: 1; padding: 8px; font-size: 15px; border: 1px solid #ccc; border-radius: 4px; outline: none; }
        #send-btn { margin-left: 5px; padding: 8px 12px; background-color: #005ce6; color: white; border: none; border-radius: 4px; font-size: 15px; cursor: pointer; }
        /* Keypad Focus Styles */
        #user-input:focus, #send-btn:focus { border: 3px solid #ff9900; background-color: #fffde7; }
    </style>
</head>
<body>
    <div class="header">Jio AI</div>
    <div id="chat-container">
        <div class="message bot">Hello! How can I help you today?</div>
    </div>
    <form id="chat-form">
        <input type="text" id="user-input" placeholder="Type..." autocomplete="off" required>
        <button type="submit" id="send-btn">Send</button>
    </form>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const form = document.getElementById("chat-form");
            const input = document.getElementById("user-input");
            const chatContainer = document.getElementById("chat-container");

            input.focus();

            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const message = input.value.trim();
                if (!message) return;

                addMessage(message, "user");
                input.value = "";
                input.disabled = true;

                const loadingId = "load-" + Date.now();
                addMessage("...", "bot loading", loadingId);

                try {
                    const response = await fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: message })
                    });
                    const data = await response.json();
                    
                    document.getElementById(loadingId)?.remove();

                    if (data.error) addMessage("Error: " + data.error, "bot");
                    else addMessage(data.reply, "bot");
                } catch (err) {
                    document.getElementById(loadingId)?.remove();
                    addMessage("Network error.", "bot");
                }

                input.disabled = false;
                input.focus();
            });

            function addMessage(text, type, id = null) {
                const div = document.createElement("div");
                div.className = "message " + type;
                div.textContent = text;
                if (id) div.id = id;
                chatContainer.appendChild(div);
                chatContainer.scrollTo(0, chatContainer.scrollHeight);
            }
        });
    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.send(htmlContent);
});

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        if (!userMessage) {
            return res.status(400).json({ error: "Message required." });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "API key is missing on the server." });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${apiKey}\`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful AI assistant. Keep responses short and simple for a small keypad phone screen." },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: "Failed to get AI response." });
        }

        const data = await response.json();
        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`Jio AI is running on port \${PORT}\`);
});