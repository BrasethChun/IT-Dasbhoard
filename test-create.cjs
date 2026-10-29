async function test() {
  try {
    const regResp = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_create_' + Math.random() + '@test.com', password: 'password', full_name: 'Test' })
    });
    
    if (!regResp.ok) { return console.log("Register failed:", await regResp.text()); }
    const token = (await regResp.json()).token;

    // 1. Create a note
    const createResp = await fetch('http://localhost:3000/api/notes', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Note', content: 'Testing content' })
    });
    
    console.log("Create response:", createResp.status, await createResp.text());

    // 2. Fetch count
    const countResp = await fetch('http://localhost:3000/api/notes/count', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const countText = await countResp.text();
    console.log("Count response:", countResp.status, countText.substring(0, 100));
  } catch (err) {
    console.error(err);
  }
}
test();
