document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("chat-form");
    const input = document.getElementById("user-input");
    const chatContainer = document.getElementById("chat-container");

    // Automatically put focus on input so keypad users don't have to scroll down manually
    input.focus();

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const message = input.value.trim();
        if (!message) return;

        // 1. Add User Message to UI
        addMessage(message, "user");
        input.value = "";
        
        // Disable input while loading to prevent spam
        input.disabled = true;

        // 2. Add temporary loading message
        const loadingId = "load-" + Date.now();
        addMessage("Typing...", "bot loading", loadingId);

        try {
            // 3. Send to our Node backend
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            
            // Remove loading msg
            removeMessage(loadingId);

            if (data.error) {
                addMessage("Error: " + data.error, "bot");
            } else {
                addMessage(data.reply, "bot");
            }
        } catch (err) {
            removeMessage(loadingId);
            addMessage("Network error. Try again.", "bot");
        }

        // Re-enable and focus input
        input.disabled = false;
        input.focus();
    });

    function addMessage(text, type, id = null) {
        const div = document.createElement("div");
        div.className = "message " + type;
        div.textContent = text;
        if (id) div.id = id;
        
        chatContainer.appendChild(div);
        scrollToBottom();
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
    }
});