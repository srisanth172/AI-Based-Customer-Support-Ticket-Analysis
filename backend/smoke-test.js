const base = 'http://localhost:5000/api';

const stamp = Date.now();
const adminEmail = `admin.${stamp}@example.com`;
const customerEmail = `customer.${stamp}@example.com`;
const password = 'Pass@1234';

const results = [];

const push = (step, ok, detail) => {
  results.push({ step, ok, detail });
};

const json = async (res) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
};

const call = async (path, options = {}) => {
  const res = await fetch(`${base}${path}`, options);
  const body = await json(res);
  return { status: res.status, body };
};

(async () => {
  try {
    const adminReg = await call('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Admin', email: adminEmail, password, role: 'admin' }),
    });
    push('register_admin', adminReg.status === 201, `status=${adminReg.status}`);
    if (adminReg.status !== 201) throw new Error(JSON.stringify(adminReg.body));

    const customerReg = await call('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Customer', email: customerEmail, password, role: 'customer' }),
    });
    push('register_customer', customerReg.status === 201, `status=${customerReg.status}`);
    if (customerReg.status !== 201) throw new Error(JSON.stringify(customerReg.body));

    const adminLogin = await call('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: adminEmail, password }),
    });
    const adminToken = adminLogin.body?.token;
    push('login_admin', Boolean(adminToken), `status=${adminLogin.status}`);
    if (!adminToken) throw new Error(JSON.stringify(adminLogin.body));

    const customerLogin = await call('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: customerEmail, password }),
    });
    const customerToken = customerLogin.body?.token;
    push('login_customer', Boolean(customerToken), `status=${customerLogin.status}`);
    if (!customerToken) throw new Error(JSON.stringify(customerLogin.body));

    const createdTicket = await call('/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        messages: [{ sender: 'user', text: 'Smoke test ticket created from API check.' }],
      }),
    });
    const ticketId = createdTicket.body?.ticketId;
    push('create_ticket_customer', Boolean(ticketId), `status=${createdTicket.status}, ticketId=${ticketId || 'none'}`);
    if (!ticketId) throw new Error(JSON.stringify(createdTicket.body));

    const listTickets = await call('/tickets', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const count = Array.isArray(listTickets.body?.tickets) ? listTickets.body.tickets.length : 0;
    push('list_tickets_customer', count >= 1, `status=${listTickets.status}, count=${count}`);

    const stats = await call('/tickets/stats', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    push('stats_admin', typeof stats.body?.totalTickets === 'number', `status=${stats.status}, total=${stats.body?.totalTickets}`);

    const resolved = await call(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'resolved' }),
    });
    push('resolve_ticket_admin', resolved.body?.status === 'resolved', `status=${resolved.status}, state=${resolved.body?.status}`);

    const byId = await call(`/tickets/${ticketId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    push('get_ticket_admin', Boolean(byId.body?.ticketId), `status=${byId.status}, ticketId=${byId.body?.ticketId || 'none'}`);
  } catch (error) {
    push('exception', false, error.message);
  }

  console.log(JSON.stringify(results, null, 2));
})();
