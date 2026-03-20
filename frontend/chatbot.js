const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatWindow = document.getElementById("chatWindow");
const chatSendButton = document.getElementById("chatSendButton");
const CHAT_AUTH_STORAGE_KEY = "support_auth_state";

let conversation = [];
let awaitingConfirmation = false;
let pendingTicketContext = null;


function getChatAuthHeaders() {
	try {
		const raw = localStorage.getItem(CHAT_AUTH_STORAGE_KEY);
		if (!raw) {
			return {};
		}
		const parsed = JSON.parse(raw);
		if (!parsed || !parsed.access_token) {
			return {};
		}
		return {
			Authorization: `Bearer ${parsed.access_token}`,
		};
	} catch {
		return {};
	}
}


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


function getCustomerEmailForChat() {
	const emailInput = document.getElementById("customerEmail");
	return emailInput ? String(emailInput.value || "").trim().toLowerCase() : "";
}


async function sendChatMessage(message) {
	const payload = {
		message,
		customer_email: getCustomerEmailForChat(),
		conversation,
		awaiting_confirmation: awaitingConfirmation,
		pending_ticket_context: pendingTicketContext,
	};

	const response = await fetch(`${window.location.origin}/chatbot`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getChatAuthHeaders(),
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.error || "Chat request failed.");
	}
	return data;
}


if (chatForm && chatInput && chatWindow && chatSendButton) {
	appendBubble("Hello, I am your AI support assistant. Ask anything, and I can create a ticket only if you confirm.", "bot");

	chatForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const message = chatInput.value.trim();
		if (!message) {
			return;
		}

		appendBubble(message, "user");
		conversation.push({ role: "user", content: message });
		chatInput.value = "";
		chatSendButton.disabled = true;
		chatSendButton.textContent = "Sending...";

		try {
			const data = await sendChatMessage(message);
			appendBubble(data.response, "bot");
			conversation.push({ role: "assistant", content: data.response });

			awaitingConfirmation = Boolean(data.ask_ticket_confirmation);
			pendingTicketContext = data.pending_ticket_context || pendingTicketContext;

			if (data.escalation_ticket_id) {
				appendBubble(`Support ticket created: ${data.escalation_ticket_id}`, "bot");
				conversation.push({ role: "assistant", content: `Support ticket created: ${data.escalation_ticket_id}` });
				awaitingConfirmation = false;
				pendingTicketContext = null;
			}
		} catch (error) {
			appendBubble(`Error: ${error.message}`, "bot");
		} finally {
			chatSendButton.disabled = false;
			chatSendButton.textContent = "Send";
		}
	});
}
