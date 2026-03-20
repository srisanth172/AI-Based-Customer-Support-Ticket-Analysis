// Detect if running on Vercel frontend and route to Render backend
const isVercelDeployment = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('onvercel.com');
const CHAT_API_BASE = isVercelDeployment 
	? "https://ai-based-customer-support-ticket-x3ou.onrender.com"
	: window.location.origin;

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatWindow = document.getElementById("chatWindow");
const chatSendButton = document.getElementById("chatSendButton");
const CHAT_AUTH_STORAGE_KEY = "support_auth_state";

let conversation = [];
let awaitingConfirmation = false;
let pendingTicketContext = null;


function inferCategoryFromMessage(message) {
	const lower = String(message || "").toLowerCase();
	if (/(invoice|refund|payment|billing|charge|subscription)/.test(lower)) {
		return "Billing";
	}
	if (/(error|bug|crash|login|password|api|slow|issue|not working|failed)/.test(lower)) {
		return "Technical";
	}
	return "General";
}


function isAffirmative(message) {
	const lower = String(message || "").trim().toLowerCase();
	return /(^(yes|y|yeah|yep|sure|ok|okay)$|please do|go ahead|create ticket|do it)/.test(lower);
}


function isNegative(message) {
	const lower = String(message || "").trim().toLowerCase();
	return /(^(no|n|nope|nah)$|not now|don't|do not|cancel)/.test(lower);
}


function buildOfflineGuidance(message) {
	const category = inferCategoryFromMessage(message);
	const lower = String(message || "").toLowerCase();
	const needsEscalation = /(frustrated|angry|issue|problem|error|failed|bug|human|agent|representative)/.test(lower);

	let response = "Thanks for the details. I can help you here, or create a support ticket so the team can follow up.";
	if (category === "Billing") {
		response = "This looks like a billing request. Share invoice date and account email, and I can create a support ticket now.";
	} else if (category === "Technical") {
		response = "This looks like a technical issue. Share exact steps and error text, and I can create a support ticket now.";
	}

	if (needsEscalation) {
		response = `${response}\n\nWould you like me to create a support ticket for this issue?`;
	}

	return {
		response,
		ask_ticket_confirmation: needsEscalation,
		escalate_to_human: needsEscalation,
		escalation_ticket_id: null,
		pending_ticket_context: {
			title: `${category} support request: ${String(message || "").slice(0, 64)}`,
			description: String(message || "").trim() || "Customer requested support via chat.",
			category,
		},
	};
}


async function createTicketFromPendingContext(context) {
	const payload = {
		title: String(context?.title || "Chat support request").slice(0, 120),
		description: String(context?.description || "Customer requested support via chat.").trim(),
		category: String(context?.category || "General"),
		customer_email: getCustomerEmailForChat(),
		force_escalate: true,
	};

	const response = await fetch(`${CHAT_API_BASE}/create_ticket`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getChatAuthHeaders(),
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json().catch(() => ({}));
	if (!response.ok || !data.ticket_id) {
		throw new Error(data.error || "Could not create ticket right now.");
	}

	return {
		response: `Done. I created a support ticket for you. Ticket ID: ${data.ticket_id}`,
		ask_ticket_confirmation: false,
		escalate_to_human: true,
		escalation_ticket_id: data.ticket_id,
		pending_ticket_context: null,
	};
}


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

	try {
		const response = await fetch(`${CHAT_API_BASE}/chatbot`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...getChatAuthHeaders(),
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json().catch(() => ({}));
		const responseText = String(data?.response || "").toLowerCase();
		const serviceUnavailable = responseText.includes("unable to reach the ai service");

		if (response.ok && !serviceUnavailable) {
			return data;
		}
	} catch {
		// Network errors should fall through to local offline support.
	}

	if (awaitingConfirmation && pendingTicketContext) {
		if (isAffirmative(message)) {
			try {
				return await createTicketFromPendingContext(pendingTicketContext);
			} catch (error) {
				return {
					response: `I could not create the ticket right now. ${error.message}`,
					ask_ticket_confirmation: true,
					escalate_to_human: false,
					escalation_ticket_id: null,
					pending_ticket_context: pendingTicketContext,
				};
			}
		}

		if (isNegative(message)) {
			return {
				response: "No problem. I will continue assisting you here.",
				ask_ticket_confirmation: false,
				escalate_to_human: false,
				escalation_ticket_id: null,
				pending_ticket_context: null,
			};
		}

		return {
			response: "Please reply with yes if you want me to create a support ticket, or no to continue chat.",
			ask_ticket_confirmation: true,
			escalate_to_human: false,
			escalation_ticket_id: null,
			pending_ticket_context: pendingTicketContext,
		};
	}

	return buildOfflineGuidance(message);
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
