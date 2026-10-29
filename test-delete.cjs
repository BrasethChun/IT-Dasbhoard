async function test() {
  const regResp = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_del_' + Math.random() + '@test.com', password: 'password', full_name: 'Test' })
  });
  const token = (await regResp.json()).token;

  const createResp = await fetch('http://localhost:3000/api/helpdesk', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ helpdesk_id: 'TEST-DEL' })
  });
  const created = await createResp.json();
  const id = created.data.id;
  console.log("Created id:", id);

  const delResp = await fetch(`http://localhost:3000/api/helpdesk/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log("Delete status:", delResp.status);
  console.log("Delete body:", await delResp.text());
}
test();
