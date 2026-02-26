const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatWindow = document.getElementById("chatWindow");
const chatSendButton = document.getElementById("chatSendButton");


function appendBubble(content, role) {
	if (!chatWindow) {
		return;
	}

	const bubble = document.createElement("div");
	bubble.className = `chat-bubble ${role}`;
	bubble.textContent = content;
	chatWindow.appendChild(bubble);
	chatWindow.scrollTop = chatWindow.scrollHeight;
}


async function sendChatMessage(message) {
	const response = await fetch(`${window.location.origin}/chatbot/ask`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ message }),
	});
	return response.json();
}


if (chatForm && chatInput && chatWindow && chatSendButton) {
	appendBubble("Hello! I am your AI support assistant. How can I help today?", "bot");

	chatForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const message = chatInput.value.trim();
		if (!message) {
			return;
		}

		appendBubble(message, "user");
		chatInput.value = "";
		chatSendButton.disabled = true;
		chatSendButton.textContent = "Sending...";

		try {
			const data = await sendChatMessage(message);
			if (data.error) {
				throw new Error(data.error);
			}

			appendBubble(data.response, "bot");
			if (data.escalate_to_human) {
				const escalationMessage = data.escalation_ticket_id
					? `I have escalated this to a human agent. Ticket #${data.escalation_ticket_id} was created.`
					: "I have escalated this to a human agent.";
				appendBubble(escalationMessage, "bot");
			}
		} catch (error) {
			appendBubble(`Error: ${error.message}`, "bot");
		} finally {
			chatSendButton.disabled = false;
			chatSendButton.textContent = "Send";
		}
	});
}
