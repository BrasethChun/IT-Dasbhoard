import fetch from 'node-fetch';

async function test() {
  try {
    // 1. Register a user
    const regResp = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_count@test.com', password: 'password', full_name: 'Test' })
    });
    const regData = await regResp.json();
    const token = regData.token;
    console.log("Registered. Token length:", token.length);

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
