async function test() {
  try {
    // 1. Register a user
    const regResp = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_count_' + Math.random() + '@test.com', password: 'password', full_name: 'Test' })
    });
    
    // Check if error
    if (!regResp.ok) {
       console.log("Register failed:", await regResp.text());
       return;
    }
    const regData = await regResp.json();
    const token = regData.token;
    console.log("Registered. Token length:", token.length);

    // BREAK THE DATABASE CONNECTION STRING TEMPORARILY OR QUERY A NON-EXISTENT TABLE
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
