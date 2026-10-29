async function test() {
  try {
    const regResp = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_foo_' + Math.random() + '@test.com', password: 'password', full_name: 'Test' })
    });
    
    if (!regResp.ok) { return console.log("Register failed:", await regResp.text()); }
    const token = (await regResp.json()).token;

    // INIT DB
    await fetch('http://localhost:3000/api/it-dashboard', {
       headers: { 'Authorization': `Bearer ${token}` }
    });

    // 1. Create a helpdesk ticket
    const createResp = await fetch('http://localhost:3000/api/helpdesk', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        helpdesk_id: 'TEST-123',
        site_name: 'Site A',
        assignee: 'John Doe',
        in_progress_count: 5,
        testing_count: 3,
        not_started_count: 1,
        completed_count: 2,
        create_date_time: new Date().toISOString(),
        period_from: '2023-01-01',
        period_to: '2023-01-31'
       })
    });
    
    console.log("Create response:", createResp.status, await createResp.text());

  } catch (err) {
    console.error(err);
  }
}
test();
