const API_BASE = window.location.origin;

function setMessage(target, text, type = "") {
	target.className = "message-box";
	if (type) {
		target.classList.add(type);
	}
	target.textContent = text;
}

function createStatusControls(ticketId, currentStatus) {
	const statuses = ["open", "in-progress", "resolved"];
	const optionMarkup = statuses
		.map((status) => `<option value="${status}" ${status === currentStatus ? "selected" : ""}>${status}</option>`)
		.join("");

	return `
		<div class="status-controls">
			<select data-ticket-id="${ticketId}">${optionMarkup}</select>
			<button type="button" data-update-id="${ticketId}">Update</button>
		</div>
	`;
}

async function initializeTicketSubmission() {
	const form = document.getElementById("ticketForm");
	const resultSection = document.getElementById("ticketResult");
	const submitButton = document.getElementById("ticketSubmitButton");
	if (!form || !resultSection || !submitButton) {
		return;
	}

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		submitButton.disabled = true;
		submitButton.textContent = "Submitting...";

		const formData = new FormData(form);
		const payload = {
			title: formData.get("title"),
			description: formData.get("description"),
			category: formData.get("category"),
			customer_email: formData.get("customerEmail"),
		};

		setMessage(resultSection, "Submitting ticket...");

		try {
			const response = await fetch(`${API_BASE}/submit_ticket`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to submit ticket.");
			}

			const duplicateLine = data.duplicate_detected
				? ` Similar ticket found (#${data.duplicate_of_id}).`
				: "";

			resultSection.className = "message-box success";
			resultSection.innerHTML = `
				<p>${data.message}</p>
				<p><strong>Ticket ID:</strong> ${data.ticket_id}</p>
				<p><strong>Detected Sentiment:</strong> ${data.sentiment}.${duplicateLine}</p>
			`;
			form.reset();
		} catch (error) {
			setMessage(resultSection, error.message, "error");
		} finally {
			submitButton.disabled = false;
			submitButton.textContent = "Submit Ticket";
		}
	});
}

async function initializeAdminDashboard() {
	const ticketsBody = document.getElementById("ticketsBody");
	const statusMessage = document.getElementById("statusMessage");
	const recurringList = document.getElementById("recurringList");
	if (!ticketsBody || !statusMessage || !recurringList) {
		return;
	}

	const totalTickets = document.getElementById("totalTickets");
	const openTickets = document.getElementById("openTickets");
	const negativeTickets = document.getElementById("negativeTickets");

	async function loadRecurringData() {
		try {
			const response = await fetch(`${API_BASE}/analytics/recurring`);
			const data = await response.json();
			recurringList.innerHTML = "";

			if (!response.ok) {
				recurringList.innerHTML = `<li>${data.error || "Unable to load recurring issues."}</li>`;
				return;
			}

			if (data.length === 0) {
				recurringList.innerHTML = "<li>No recurring issues detected yet.</li>";
				return;
			}

			data.forEach((item) => {
				const listItem = document.createElement("li");
				listItem.textContent = `[${item.category}] ${item.issue} (${item.count} tickets)`;
				recurringList.appendChild(listItem);
			});
		} catch {
			recurringList.innerHTML = "<li>Unable to load recurring issue data.</li>";
		}
	}

	async function loadTickets() {
		statusMessage.textContent = "Loading tickets...";
		try {
			const response = await fetch(`${API_BASE}/tickets`);
			const tickets = await response.json();
			if (!response.ok) {
				throw new Error(tickets.error || "Failed to load tickets.");
			}

			ticketsBody.innerHTML = "";
			tickets.forEach((ticket) => {
				const row = document.createElement("tr");
				row.innerHTML = `
					<td>${ticket.ticket_id}</td>
					<td>${ticket.title}</td>
					<td>${ticket.category}</td>
					<td>${ticket.sentiment}</td>
					<td>${ticket.status}</td>
					<td>${createStatusControls(ticket.ticket_id, ticket.status)}</td>
				`;
				ticketsBody.appendChild(row);
			});

			totalTickets.textContent = `${tickets.length}`;
			openTickets.textContent = `${tickets.filter((item) => item.status === "open").length}`;
			negativeTickets.textContent = `${tickets.filter((item) => item.sentiment === "Negative").length}`;
			statusMessage.textContent = `${tickets.length} ticket(s) loaded.`;

			document.querySelectorAll("[data-update-id]").forEach((button) => {
				button.addEventListener("click", async () => {
					const ticketId = button.getAttribute("data-update-id");
					const selector = document.querySelector(`select[data-ticket-id="${ticketId}"]`);
					const nextStatus = selector.value;

					try {
						const response = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
							method: "PUT",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({ status: nextStatus }),
						});
						const data = await response.json();
						if (!response.ok) {
							throw new Error(data.error || "Failed to update status.");
						}
						statusMessage.textContent = `Ticket #${ticketId} updated to ${data.status}.`;
						await loadTickets();
					} catch (error) {
						statusMessage.textContent = error.message;
					}
				});
			});
		} catch (error) {
			statusMessage.textContent = error.message;
		}
	}

	await loadTickets();
	await loadRecurringData();
	setInterval(async () => {
		await loadTickets();
		await loadRecurringData();
	}, 10000);
}

document.addEventListener("DOMContentLoaded", async () => {
	await initializeTicketSubmission();
	await initializeAdminDashboard();
});
