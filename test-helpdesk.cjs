async function test() {
  try {
    const regResp = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_hd_' + Math.random() + '@test.com', password: 'password', full_name: 'Test' })
    });
    
    if (!regResp.ok) { return console.log("Register failed:", await regResp.text()); }
    const token = (await regResp.json()).token;

    // 1. Create a helpdesk ticket
    const createResp = await fetch('http://localhost:3000/api/helpdesk', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        helpdesk_id: 'TEST-123',
        site_name: 'Site A',
        assignee: 'John Doe',
        pending_count: 5,
        completed_count: 2,
        create_date_time: new Date().toISOString(),
        period_from: '2023-01-01',
        period_to: '2023-01-31'
       })
    });
    
    console.log("Create response:", createResp.status, await createResp.text());

    // 2. Fetch helpdesk
    const listResp = await fetch('http://localhost:3000/api/helpdesk', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listText = await listResp.text();
    console.log("List response:", listResp.status, listText.substring(0, 100));
  } catch (err) {
    console.error(err);
  }
}
test();
