// Detect if running on Vercel frontend and route to Render backend
const isVercelDeployment = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('onvercel.com');
const runtimeApiBase = String(window.NEXT_PUBLIC_API_URL || "").trim();
const API_BASE = isVercelDeployment 
	? (runtimeApiBase || "https://ai-based-customer-support-ticket-x3ou.onrender.com")
	: window.location.origin;
const AUTH_STORAGE_KEY = "support_auth_state";


function getAuthState() {
	try {
		const raw = localStorage.getItem(AUTH_STORAGE_KEY);
		if (!raw) {
			return null;
		}
		return JSON.parse(raw);
	} catch {
		return null;
	}
}


function setAuthState(state) {
	localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}


function clearAuthState() {
	localStorage.removeItem(AUTH_STORAGE_KEY);
}


function setMessage(target, text, type = "") {
	if (!target) {
		return;
	}
	target.className = "message-box";
	if (type) {
		target.classList.add(type);
	}
	target.textContent = text;
}

function authHeaders() {
	const state = getAuthState();
	if (!state || !state.access_token) {
		return {};
	}
	return {
		Authorization: `Bearer ${state.access_token}`,
	};
}


async function apiRequest(path, options = {}) {
	const config = {
		method: options.method || "GET",
		headers: {
			"Content-Type": "application/json",
			...authHeaders(),
			...(options.headers || {}),
		},
		credentials: "include",  // Include cookies in cross-origin requests
	};

	if (options.body !== undefined) {
		config.body = JSON.stringify(options.body);
	}

	try {
		const response = await fetch(`${API_BASE}${path}`, config);
		const data = await response.json().catch(() => ({}));
		if (!response.ok) {
			console.error(`[API Error] ${path}: ${response.status}`, data);
			throw new Error(data.error || data.message || `Request failed: ${response.status}`);
		}
		return data;
	} catch (error) {
		console.error(`[API Exception] ${path}: ${error.message}`);
		throw error;
	}
}


function redirectToRole(role) {
	if (role === "admin") {
		window.location.href = "/admin";
		return;
	}
	window.location.href = "/customer";
}


function enforceRouteAccess(page) {
	const state = getAuthState();
	const authPages = new Set(["login", "register", "forgot-password"]);

	if (page === "admin") {
		if (!state) {
			window.location.href = "/login";
			return { blocked: true, state: null };
		}
		if (state.role !== "admin") {
			redirectToRole(state.role);
			return { blocked: true, state: null };
		}
		return { blocked: false, state };
	}

	if (page === "customer") {
		if (!state) {
			window.location.href = "/login";
			return { blocked: true, state: null };
		}
		if (state.role !== "customer") {
			redirectToRole(state.role);
			return { blocked: true, state: null };
		}
		return { blocked: false, state };
	}

	if (authPages.has(page) && state && state.role) {
		redirectToRole(state.role);
		return { blocked: true, state };
	}

	return { blocked: false, state };
}


async function initializeLoginPage() {
	const loginForm = document.getElementById("loginForm");
	const loginMessage = document.getElementById("loginMessage");
	const loginSubmitButton = document.getElementById("loginSubmitButton");
	const puzzleQuestion = document.getElementById("puzzleQuestion");
	const puzzleAnswerInput = document.getElementById("puzzleAnswer");
	const refreshPuzzleButton = document.getElementById("refreshPuzzleButton");
	if (!loginForm || !loginMessage || !loginSubmitButton || !puzzleQuestion || !puzzleAnswerInput || !refreshPuzzleButton) {
		return;
	}

	let puzzleId = "";

	async function loadPuzzle() {
		try {
			const data = await apiRequest("/auth/puzzle", { method: "POST" });
			puzzleId = data.puzzle_id;
			puzzleQuestion.textContent = data.question;
			puzzleAnswerInput.value = "";
		} catch (error) {
			setMessage(loginMessage, error.message, "error");
		}
	}

	refreshPuzzleButton.addEventListener("click", loadPuzzle);

	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		loginSubmitButton.disabled = true;
		loginSubmitButton.textContent = "Signing in...";

		const email = String(document.getElementById("loginEmail")?.value || "").trim().toLowerCase();
		const password = String(document.getElementById("loginPassword")?.value || "");
		const puzzleAnswer = String(document.getElementById("puzzleAnswer")?.value || "").trim();
		const payload = {
			email,
			password,
			puzzle_id: puzzleId,
			puzzle_answer: puzzleAnswer,
		};

		try {
			const data = await apiRequest("/login", { method: "POST", body: payload });
			setAuthState(data);
			setMessage(loginMessage, "Login successful. Redirecting...", "success");
			redirectToRole(data.role);
		} catch (error) {
			setMessage(loginMessage, error.message, "error");
			await loadPuzzle();
		} finally {
			loginSubmitButton.disabled = false;
			loginSubmitButton.textContent = "Login";
		}
	});

	await loadPuzzle();
}


async function initializeRegisterPage() {
	const registerForm = document.getElementById("registerForm");
	const registerMessage = document.getElementById("registerMessage");
	const registerSubmitButton = document.getElementById("registerSubmitButton");
	if (!registerForm || !registerMessage || !registerSubmitButton) {
		return;
	}

	registerForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		registerSubmitButton.disabled = true;
		registerSubmitButton.textContent = "Creating account...";

		const username = String(document.getElementById("registerUsername")?.value || "").trim();
		const email = String(document.getElementById("registerEmail")?.value || "").trim().toLowerCase();
		const password = String(document.getElementById("registerPassword")?.value || "");
		const confirmPassword = String(document.getElementById("registerConfirmPassword")?.value || "");
		const role = String(document.getElementById("registerRole")?.value || "customer").trim().toLowerCase();

		if (password !== confirmPassword) {
			setMessage(registerMessage, "Passwords do not match.", "error");
			registerSubmitButton.disabled = false;
			registerSubmitButton.textContent = "Register";
			return;
		}

		try {
			const data = await apiRequest("/register", {
				method: "POST",
				body: { username, email, password, role },
			});
			setMessage(registerMessage, `${data.message} Redirecting to login...`, "success");
			setTimeout(() => {
				window.location.href = "/login";
			}, 1200);
		} catch (error) {
			setMessage(registerMessage, error.message, "error");
		} finally {
			registerSubmitButton.disabled = false;
			registerSubmitButton.textContent = "Register";
		}
	});
}


async function initializeForgotPasswordPage() {
	const forgotRequestForm = document.getElementById("forgotRequestForm");
	const forgotVerifyForm = document.getElementById("forgotVerifyForm");
	const forgotResetForm = document.getElementById("forgotResetForm");
	const forgotMessage = document.getElementById("forgotMessage");
	if (!forgotRequestForm || !forgotVerifyForm || !forgotResetForm || !forgotMessage) {
		return;
	}

	let resetEmail = "";

	forgotRequestForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const emailInput = document.getElementById("forgotEmail");
		resetEmail = String(emailInput?.value || "").trim().toLowerCase();

		try {
			const data = await apiRequest("/forgot-password/request", {
				method: "POST",
				body: { email: resetEmail },
			});
			const codeHint = data.verification_code ? ` Code: ${data.verification_code}` : "";
			setMessage(forgotMessage, `${data.message}${codeHint}`, "success");
		} catch (error) {
			setMessage(forgotMessage, error.message, "error");
		}
	});

	forgotVerifyForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const code = String(document.getElementById("forgotCode")?.value || "").trim();

		try {
			const data = await apiRequest("/forgot-password/verify", {
				method: "POST",
				body: { email: resetEmail, code },
			});
			setMessage(forgotMessage, data.message, "success");
		} catch (error) {
			setMessage(forgotMessage, error.message, "error");
		}
	});

	forgotResetForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const code = String(document.getElementById("forgotCode")?.value || "").trim();
		const newPassword = String(document.getElementById("newPassword")?.value || "");
		const confirmPassword = String(document.getElementById("confirmNewPassword")?.value || "");

		if (newPassword !== confirmPassword) {
			setMessage(forgotMessage, "Passwords do not match.", "error");
			return;
		}

		try {
			const data = await apiRequest("/forgot-password/reset", {
				method: "POST",
				body: {
					email: resetEmail,
					code,
					new_password: newPassword,
				},
			});
			setMessage(forgotMessage, `${data.message} Redirecting to login...`, "success");
			setTimeout(() => {
				window.location.href = "/login";
			}, 1200);
		} catch (error) {
			setMessage(forgotMessage, error.message, "error");
		}
	});
}


function formatStatus(status) {
	return String(status || "open")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}


function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}


async function initializeCustomerDashboard(authState) {
	if (!authState) {
		return;
	}

	const welcome = document.getElementById("customerWelcome");
	if (welcome) {
		welcome.textContent = `Welcome ${authState.username || authState.email || "customer"}. Submit requests, track ticket status, and use AI assistant.`;
	}

	const logoutButton = document.getElementById("logoutCustomerButton");
	if (logoutButton) {
		logoutButton.addEventListener("click", () => {
			clearAuthState();
			window.location.href = "/login";
		});
	}

	const emailField = document.getElementById("customerEmail");
	if (emailField && authState.email) {
		emailField.value = authState.email;
	}

	const ticketForm = document.getElementById("ticketForm");
	const ticketResult = document.getElementById("ticketResult");
	const submitButton = document.getElementById("ticketSubmitButton");

	if (ticketForm && ticketResult && submitButton) {
		ticketForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		submitButton.disabled = true;
		submitButton.textContent = "Submitting...";

		const formData = new FormData(ticketForm);
		const payload = {
			title: formData.get("title"),
			description: formData.get("description"),
			category: formData.get("category"),
			customer_email: formData.get("customerEmail"),
		};

		try {
			const data = await apiRequest("/create_ticket", { method: "POST", body: payload });
			setMessage(
				ticketResult,
				`Ticket submitted successfully. Ticket ID: ${data.ticket_id}. Current status: ${formatStatus(data.status)}.`,
				"success"
			);
			ticketForm.reset();
			if (authState.email) {
				emailField.value = authState.email;
			}
		} catch (error) {
			setMessage(ticketResult, error.message, "error");
		} finally {
			submitButton.disabled = false;
			submitButton.textContent = "Submit Ticket";
		}
		});
	}

	const lookupForm = document.getElementById("ticketLookupForm");
	const lookupResult = document.getElementById("ticketLookupResult");

	if (lookupForm && lookupResult) {
		lookupForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const ticketId = String(document.getElementById("lookupTicketId")?.value || "").trim().toUpperCase();
		if (!ticketId) {
			setMessage(lookupResult, "Enter a ticket ID.", "error");
			return;
		}

		try {
			const data = await apiRequest(`/check_ticket_status/${encodeURIComponent(ticketId)}`);
			setMessage(lookupResult, `Ticket ${ticketId} is currently ${formatStatus(data.status)}.`, "success");
		} catch (error) {
			setMessage(lookupResult, error.message, "error");
		}
		});
	}
}


function renderSentimentChart(sentimentCounts) {
	const canvas = document.getElementById("sentimentChart");
	if (!canvas) {
		return;
	}

	const context = canvas.getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);

	const labels = ["positive", "neutral", "negative"];
	const colors = ["#34d399", "#60a5fa", "#f87171"];
	const values = labels.map((label) => Number(sentimentCounts[label] || 0));
	const maxValue = Math.max(1, ...values);

	const chartPadding = 30;
	const chartHeight = canvas.height - chartPadding * 2;
	const barWidth = 80;
	const gap = 45;

	values.forEach((value, index) => {
		const x = 40 + index * (barWidth + gap);
		const barHeight = (value / maxValue) * chartHeight;
		const y = canvas.height - chartPadding - barHeight;

		context.fillStyle = colors[index];
		context.fillRect(x, y, barWidth, barHeight);

		context.fillStyle = "#0f172a";
		context.font = "600 13px Plus Jakarta Sans, Segoe UI, sans-serif";
		context.fillText(labels[index], x, canvas.height - 8);
		context.fillText(String(value), x + barWidth / 2 - 6, y - 8);
	});
}


function createStatusControls(ticketId, currentStatus) {
	const statuses = ["open", "in-progress", "resolved"];
	const optionMarkup = statuses
		.map((status) => {
			const label = formatStatus(status);
			return `<option value="${status}" ${status === currentStatus ? "selected" : ""}>${label}</option>`;
		})
		.join("");

	return `
		<div class="status-controls">
			<select data-ticket-id="${ticketId}">${optionMarkup}</select>
			<button type="button" data-update-id="${ticketId}">Update</button>
		</div>
	`;
}


async function initializeAdminDashboard(authState) {
	if (!authState) {
		return;
	}

	const welcome = document.getElementById("adminWelcome");
	if (welcome) {
		welcome.textContent = `Signed in as ${authState.username || authState.email || "admin"}`;
	}

	const logoutButton = document.getElementById("logoutAdminButton");
	if (logoutButton) {
		logoutButton.addEventListener("click", () => {
			clearAuthState();
			window.location.href = "/login";
		});
	}

	const ticketsBody = document.getElementById("ticketsBody");
	const statusMessage = document.getElementById("statusMessage");
	const recurringList = document.getElementById("recurringList");
	const totalTickets = document.getElementById("totalTickets");
	const openTickets = document.getElementById("openTickets");
	const negativeTickets = document.getElementById("negativeTickets");
	const resolvedTickets = document.getElementById("resolvedTickets");
	const sidebarOpenCount = document.getElementById("sidebarOpenCount");

	const searchInput = document.getElementById("searchInput");
	const statusFilter = document.getElementById("statusFilter");
	const priorityFilter = document.getElementById("priorityFilter");
	const sortHeaders = document.querySelectorAll("[data-sort-key]");

	const emptyState = document.getElementById("emptyState");
	const paginationInfo = document.getElementById("paginationInfo");
	const paginationBtns = document.getElementById("paginationBtns");

	const refreshButton = document.getElementById("refreshTicketsButton");
	const exportButton = document.getElementById("exportTicketsButton");

	const ticketModal = document.getElementById("ticketModal");
	const modalCloseButton = document.getElementById("modalCloseButton");
	const modalCloseButtonSecondary = document.getElementById("modalCloseButtonSecondary");
	const modalUpdateStatusButton = document.getElementById("modalUpdateStatusButton");
	const modalStatusSelect = document.getElementById("modalStatusSelect");

	const modalTicketId = document.getElementById("modalTicketId");
	const modalSubTitle = document.getElementById("modalSubTitle");
	const modalCustomer = document.getElementById("modalCustomer");
	const modalEmail = document.getElementById("modalEmail");
	const modalCategory = document.getElementById("modalCategory");
	const modalPriority = document.getElementById("modalPriority");
	const modalStatus = document.getElementById("modalStatus");
	const modalSentiment = document.getElementById("modalSentiment");
	const modalSubject = document.getElementById("modalSubject");
	const modalDescription = document.getElementById("modalDescription");
	const modalEscalation = document.getElementById("modalEscalation");

	const tableState = {
		allTickets: [],
		filteredTickets: [],
		currentPage: 1,
		pageSize: 8,
		sortKey: "priority",
		sortDirection: "desc",
		activeTicketId: "",
	};

	if (refreshButton) {
		refreshButton.classList.remove("ghost-button");
		refreshButton.classList.add("btn", "btn-secondary", "btn-sm");
	}

	if (exportButton) {
		exportButton.classList.add("btn", "btn-primary", "btn-sm");
	}

	[searchInput, statusFilter, priorityFilter, modalStatusSelect].forEach((element) => {
		if (element) {
			element.classList.add("form-control");
		}
	});

	let tableLoader = null;

	function ensureTableLoader() {
		if (tableLoader) {
			return tableLoader;
		}

		const tableWrap = ticketsBody ? ticketsBody.closest(".table-wrap") : null;
		if (!tableWrap) {
			return null;
		}

		tableWrap.style.position = "relative";
		tableLoader = document.createElement("div");
		tableLoader.id = "tableLoader";
		tableLoader.className = "spinner-overlay hidden";

		const spinner = document.createElement("div");
		spinner.className = "spinner-lg";
		tableLoader.appendChild(spinner);

		tableWrap.appendChild(tableLoader);
		return tableLoader;
	}

	function setTableLoading(isLoading) {
		const loader = ensureTableLoader();
		if (!loader) {
			return;
		}
		loader.classList.toggle("hidden", !isLoading);
	}

	function formatDateTime(value) {
		if (!value) {
			return "-";
		}
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return "-";
		}
		return date.toLocaleString();
	}

	function sentimentRank(sentiment) {
		const normalized = String(sentiment || "").toLowerCase();
		if (normalized === "negative") {
			return 0;
		}
		if (normalized === "neutral") {
			return 1;
		}
		if (normalized === "positive") {
			return 2;
		}
		return 3;
	}

	function statusRank(status) {
		const normalized = String(status || "").toLowerCase();
		if (normalized === "open") {
			return 0;
		}
		if (normalized === "in-progress") {
			return 1;
		}
		if (normalized === "resolved") {
			return 2;
		}
		return 3;
	}

	function sentimentBarWidth(sentiment) {
		const normalized = String(sentiment || "").toLowerCase();
		if (normalized === "negative") {
			return 90;
		}
		if (normalized === "neutral") {
			return 60;
		}
		return 35;
	}

	function getCustomerName(customerEmail) {
		const normalizedEmail = String(customerEmail || "").trim();
		if (!normalizedEmail) {
			return "Guest";
		}
		const localPart = normalizedEmail.split("@")[0] || "Guest";
		const cleaned = localPart.replace(/[._-]+/g, " ").trim();
		return cleaned ? formatStatus(cleaned) : "Guest";
	}

	function setModalValue(element, value) {
		if (!element) {
			return;
		}
		element.textContent = String(value || "-");
	}

	function getSortValue(ticket, key) {
		switch (key) {
			case "ticket_id":
				return String(ticket.ticket_id || "").toLowerCase();
			case "customer":
				return String(ticket.customer_email || "").toLowerCase();
			case "category":
				return String(ticket.category || "").toLowerCase();
			case "priority":
				return Number(ticket.priority_score || 0);
			case "status":
				return statusRank(ticket.status);
			case "sentiment":
				return sentimentRank(ticket.sentiment);
			case "updated_at":
				return Date.parse(ticket.updated_at || ticket.created_at || "") || 0;
			default:
				return String(ticket.ticket_id || "").toLowerCase();
		}
	}

	function applyFiltersAndSort() {
		const searchTerm = String(searchInput?.value || "").trim().toLowerCase();
		const selectedStatus = String(statusFilter?.value || "").trim().toLowerCase();
		const selectedPriority = String(priorityFilter?.value || "").trim().toLowerCase();

		const filtered = tableState.allTickets.filter((ticket) => {
			const statusValue = String(ticket.status || "").toLowerCase();
			const priorityValue = String(ticket.priority_level || "").toLowerCase();
			const searchable = [
				ticket.ticket_id,
				ticket.title,
				ticket.category,
				ticket.sentiment,
				ticket.customer_email,
			].join(" ").toLowerCase();

			const matchSearch = !searchTerm || searchable.includes(searchTerm);
			const matchStatus = !selectedStatus || statusValue === selectedStatus;
			const matchPriority = !selectedPriority || priorityValue === selectedPriority;

			return matchSearch && matchStatus && matchPriority;
		});

		const sortMultiplier = tableState.sortDirection === "asc" ? 1 : -1;
		filtered.sort((first, second) => {
			const firstValue = getSortValue(first, tableState.sortKey);
			const secondValue = getSortValue(second, tableState.sortKey);

			if (typeof firstValue === "number" && typeof secondValue === "number") {
				if (firstValue === secondValue) {
					return 0;
				}
				return (firstValue - secondValue) * sortMultiplier;
			}

			if (String(firstValue) === String(secondValue)) {
				return 0;
			}
			return String(firstValue).localeCompare(String(secondValue)) * sortMultiplier;
		});

		tableState.filteredTickets = filtered;
		const totalPages = Math.max(1, Math.ceil(filtered.length / tableState.pageSize));
		if (tableState.currentPage > totalPages) {
			tableState.currentPage = totalPages;
		}
		if (tableState.currentPage < 1) {
			tableState.currentPage = 1;
		}

		renderSortIndicators();
		renderTable();
		renderPagination();

		if (emptyState) {
			emptyState.classList.toggle("hidden", filtered.length > 0);
		}

		if (statusMessage) {
			statusMessage.textContent = `${filtered.length} of ${tableState.allTickets.length} ticket(s) shown.`;
		}
	}

	function renderSortIndicators() {
		sortHeaders.forEach((header) => {
			const key = String(header.getAttribute("data-sort-key") || "").trim();
			const arrow = header.querySelector(".sort-arrow");
			const isActive = key === tableState.sortKey;
			header.classList.toggle("sorted", isActive);
			if (!arrow) {
				return;
			}
			if (!isActive) {
				arrow.textContent = "v";
				return;
			}
			arrow.textContent = tableState.sortDirection === "asc" ? "v" : "^";
		});
	}

	function normalizeStatusValue(value) {
		const normalized = String(value || "")
			.trim()
			.toLowerCase()
			.replaceAll("_", "-")
			.replaceAll(" ", "-");

		if (normalized === "inprogress") {
			return "in-progress";
		}

		if (normalized === "open" || normalized === "in-progress" || normalized === "resolved") {
			return normalized;
		}

		return "open";
	}

	async function updateTicketStatusById(ticketId, nextStatus, closeModalOnSuccess = false) {
		if (!ticketId) {
			return;
		}

		const normalizedStatus = normalizeStatusValue(nextStatus);

		try {
			await apiRequest(`/update_ticket_status/${encodeURIComponent(ticketId)}`, {
				method: "PUT",
				body: { status: normalizedStatus },
			});
		} catch (primaryError) {
			try {
				await apiRequest("/update_ticket_status", {
					method: "PUT",
					body: {
						ticket_id: ticketId,
						status: normalizedStatus,
					},
				});
			} catch (secondaryError) {
				if (statusMessage) {
					statusMessage.textContent = secondaryError.message || primaryError.message;
				}
				return;
			}
		}

		if (statusMessage) {
			statusMessage.textContent = `Ticket ${ticketId} updated to ${formatStatus(normalizedStatus)}.`;
		}

		if (closeModalOnSuccess) {
			closeTicketModal();
		}

		await refreshAll();
	}

	function openTicketModal(ticketId) {
		if (!ticketModal) {
			return;
		}

		const ticket = tableState.allTickets.find((item) => String(item.ticket_id) === String(ticketId));
		if (!ticket) {
			return;
		}

		tableState.activeTicketId = String(ticket.ticket_id);
		const customerEmail = String(ticket.customer_email || "").trim().toLowerCase();

		setModalValue(modalTicketId, `Ticket ${ticket.ticket_id}`);
		setModalValue(modalSubTitle, `Last updated: ${formatDateTime(ticket.updated_at || ticket.created_at)}`);
		setModalValue(modalCustomer, getCustomerName(customerEmail));
		setModalValue(modalEmail, customerEmail || "Not provided");
		setModalValue(modalCategory, ticket.category);
		setModalValue(modalPriority, `${formatStatus(ticket.priority_level)} (${ticket.priority_score})`);
		setModalValue(modalStatus, formatStatus(ticket.status));
		setModalValue(modalSentiment, formatStatus(ticket.sentiment));
		setModalValue(modalSubject, ticket.title || "-");
		setModalValue(modalDescription, ticket.description || "-");
		setModalValue(modalEscalation, ticket.escalation_reason || "None");

		if (modalStatusSelect) {
			modalStatusSelect.value = String(ticket.status || "open").toLowerCase();
		}

		ticketModal.classList.remove("hidden");
	}

	function closeTicketModal() {
		tableState.activeTicketId = "";
		if (ticketModal) {
			ticketModal.classList.add("hidden");
		}
	}

	function bindRowActions() {
		document.querySelectorAll("[data-update-id]").forEach((button) => {
			button.addEventListener("click", async () => {
				const ticketId = String(button.getAttribute("data-update-id") || "").trim();
				const controls = button.closest(".status-controls");
				const select = controls ? controls.querySelector("select[data-ticket-id]") : null;
				const nextStatus = select ? select.value : "open";
				await updateTicketStatusById(ticketId, nextStatus, false);
			});
		});

		document.querySelectorAll("[data-view-id]").forEach((button) => {
			button.addEventListener("click", () => {
				const ticketId = String(button.getAttribute("data-view-id") || "").trim();
				openTicketModal(ticketId);
			});
		});
	}

	function renderTable() {
		if (!ticketsBody) {
			return;
		}

		const startIndex = (tableState.currentPage - 1) * tableState.pageSize;
		const pageTickets = tableState.filteredTickets.slice(startIndex, startIndex + tableState.pageSize);
		ticketsBody.innerHTML = "";

		pageTickets.forEach((ticket) => {
			const row = document.createElement("tr");
			const statusClass = String(ticket.status || "open").replace(/[^a-z-]/g, "");
			const priorityClass = String(ticket.priority_level || "low").replace(/[^a-z-]/g, "");
			const sentimentClass = String(ticket.sentiment || "neutral").toLowerCase();
			const updatedText = formatDateTime(ticket.updated_at || ticket.created_at);
			const customerEmail = String(ticket.customer_email || "").trim().toLowerCase();
			const customerName = getCustomerName(customerEmail);

			row.innerHTML = `
				<td><span class="ticket-id-cell">${escapeHtml(ticket.ticket_id)}</span></td>
				<td>
					<div class="td-primary">${escapeHtml(customerName)}</div>
					<div class="muted-inline">${escapeHtml(customerEmail || "not provided")}</div>
				</td>
				<td>${escapeHtml(ticket.category)}</td>
				<td><span class="priority-pill ${priorityClass}">${escapeHtml(formatStatus(ticket.priority_level))} (${escapeHtml(ticket.priority_score)})</span></td>
				<td><span class="status-pill ${statusClass}">${escapeHtml(formatStatus(ticket.status))}</span></td>
				<td>
					<div class="sentiment-cell">
						<span>${escapeHtml(formatStatus(ticket.sentiment))}</span>
						<div class="sentiment-track"><div class="sentiment-fill ${escapeHtml(sentimentClass)}" style="width:${sentimentBarWidth(sentimentClass)}%"></div></div>
					</div>
				</td>
				<td>${escapeHtml(updatedText)}</td>
				<td>
					<div class="td-actions">
						<button type="button" class="act-btn" data-view-id="${escapeHtml(ticket.ticket_id)}">Details</button>
					</div>
					${createStatusControls(ticket.ticket_id, ticket.status)}
				</td>
			`;
			ticketsBody.appendChild(row);
		});

		bindRowActions();
	}

	function renderPagination() {
		if (!paginationInfo || !paginationBtns) {
			return;
		}

		const totalItems = tableState.filteredTickets.length;
		const totalPages = Math.max(1, Math.ceil(totalItems / tableState.pageSize));

		if (totalItems === 0) {
			paginationInfo.textContent = "0 tickets";
			paginationBtns.innerHTML = "";
			return;
		}

		const startItem = (tableState.currentPage - 1) * tableState.pageSize + 1;
		const endItem = Math.min(tableState.currentPage * tableState.pageSize, totalItems);
		paginationInfo.textContent = `${startItem}-${endItem} of ${totalItems}`;

		paginationBtns.innerHTML = "";

		function createPageButton(label, targetPage, active = false, disabled = false) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "pg-btn";
			button.textContent = label;
			button.disabled = disabled;
			if (active) {
				button.classList.add("active");
			}
			if (disabled) {
				button.style.opacity = "0.45";
			}
			button.addEventListener("click", () => {
				tableState.currentPage = targetPage;
				renderTable();
				renderPagination();
			});
			paginationBtns.appendChild(button);
		}

		createPageButton("<", Math.max(1, tableState.currentPage - 1), false, tableState.currentPage === 1);

		let firstPage = Math.max(1, tableState.currentPage - 2);
		let lastPage = Math.min(totalPages, firstPage + 4);
		firstPage = Math.max(1, lastPage - 4);

		for (let page = firstPage; page <= lastPage; page += 1) {
			createPageButton(String(page), page, page === tableState.currentPage, false);
		}

		createPageButton(">", Math.min(totalPages, tableState.currentPage + 1), false, tableState.currentPage === totalPages);
	}

	function csvEscape(value) {
		const content = String(value ?? "");
		if (/[",\n]/.test(content)) {
			return `"${content.replaceAll("\"", "\"\"")}"`;
		}
		return content;
	}

	function exportTicketsToCsv() {
		const source = tableState.filteredTickets.length ? tableState.filteredTickets : tableState.allTickets;
		if (!source.length) {
			if (statusMessage) {
				statusMessage.textContent = "No tickets available to export.";
			}
			return;
		}

		const headers = [
			"ticket_id",
			"title",
			"category",
			"status",
			"sentiment",
			"priority_level",
			"priority_score",
			"customer_email",
			"created_at",
			"updated_at",
			"escalation_reason",
		];

		const rows = source.map((ticket) => headers.map((field) => csvEscape(ticket[field])).join(","));
		const csv = `${headers.join(",")}\n${rows.join("\n")}`;

		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		const timestamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");

		link.href = url;
		link.download = `tickets-export-${timestamp}.csv`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);

		if (statusMessage) {
			statusMessage.textContent = `${source.length} ticket(s) exported.`;
		}
	}

	async function loadOverview() {
		const overview = await apiRequest("/analytics/overview");
		if (totalTickets) {
			totalTickets.textContent = String(overview.total_tickets || 0);
		}
		if (openTickets) {
			openTickets.textContent = String(overview.open_tickets || 0);
		}
		if (negativeTickets) {
			negativeTickets.textContent = String(overview.negative_sentiment_count || 0);
		}
		if (resolvedTickets) {
			resolvedTickets.textContent = String((overview.status_counts || {}).resolved || 0);
		}
		if (sidebarOpenCount) {
			sidebarOpenCount.textContent = String(overview.open_tickets || 0);
		}
		renderSentimentChart(overview.sentiment_counts || {});
	}

	async function loadRecurring() {
		const data = await apiRequest("/analytics/recurring");
		if (!recurringList) {
			return;
		}
		recurringList.innerHTML = "";
		if (!data.length) {
			recurringList.innerHTML = "<li>No recurring issues yet.</li>";
			return;
		}

		data.forEach((item) => {
			const li = document.createElement("li");
			li.textContent = `[${item.category}] ${item.issue} (${item.count})`;
			recurringList.appendChild(li);
		});
	}

	async function loadTickets() {
		if (!ticketsBody) {
			return;
		}

		setTableLoading(true);
		try {
			tableState.allTickets = await apiRequest("/get_tickets");
			applyFiltersAndSort();
		} finally {
			setTableLoading(false);
		}
	}

	async function refreshAll() {
		try {
			await loadOverview();
			await loadRecurring();
			await loadTickets();
		} catch (error) {
			if (statusMessage) {
				statusMessage.textContent = error.message;
			}
		}
	}

	if (searchInput) {
		searchInput.addEventListener("input", () => {
			tableState.currentPage = 1;
			applyFiltersAndSort();
		});
	}

	if (statusFilter) {
		statusFilter.addEventListener("change", () => {
			tableState.currentPage = 1;
			applyFiltersAndSort();
		});
	}

	if (priorityFilter) {
		priorityFilter.addEventListener("change", () => {
			tableState.currentPage = 1;
			applyFiltersAndSort();
		});
	}

	sortHeaders.forEach((header) => {
		header.addEventListener("click", () => {
			const key = String(header.getAttribute("data-sort-key") || "").trim();
			if (!key) {
				return;
			}

			if (tableState.sortKey === key) {
				tableState.sortDirection = tableState.sortDirection === "asc" ? "desc" : "asc";
			} else {
				tableState.sortKey = key;
				tableState.sortDirection = key === "priority" || key === "updated_at" ? "desc" : "asc";
			}

			tableState.currentPage = 1;
			applyFiltersAndSort();
		});
	});

	if (refreshButton) {
		refreshButton.addEventListener("click", refreshAll);
	}

	if (exportButton) {
		exportButton.addEventListener("click", exportTicketsToCsv);
	}

	if (modalCloseButton) {
		modalCloseButton.addEventListener("click", closeTicketModal);
	}

	if (modalCloseButtonSecondary) {
		modalCloseButtonSecondary.addEventListener("click", closeTicketModal);
	}

	if (ticketModal) {
		ticketModal.addEventListener("click", (event) => {
			if (event.target === ticketModal) {
				closeTicketModal();
			}
		});
	}

	if (modalUpdateStatusButton) {
		modalUpdateStatusButton.addEventListener("click", async () => {
			if (!tableState.activeTicketId) {
				return;
			}
			const nextStatus = modalStatusSelect ? modalStatusSelect.value : "open";
			await updateTicketStatusById(tableState.activeTicketId, nextStatus, true);
		});
	}

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			closeTicketModal();
		}
	});

	await refreshAll();
	setInterval(refreshAll, 12000);
}


document.addEventListener("DOMContentLoaded", async () => {
	const page = document.body.getAttribute("data-page") || "login";
	const access = enforceRouteAccess(page);
	if (access.blocked) {
		return;
	}
	const authState = access.state;

	if (page === "login") {
		await initializeLoginPage();
		return;
	}

	if (page === "register") {
		await initializeRegisterPage();
		return;
	}

	if (page === "forgot-password") {
		await initializeForgotPasswordPage();
		return;
	}

	if (page === "customer") {
		await initializeCustomerDashboard(authState);
		return;
	}

	if (page === "admin") {
		await initializeAdminDashboard(authState);
	}
});
