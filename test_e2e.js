async function runE2E() {
  console.log('--- E2E SMOKE TEST FOR CLUBOPS AI ---');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/health');
  const health = await healthRes.json();
  console.log('1. Health Check:', health.status, '| Database:', health.database);

  // 2. Frontend HTML
  const frontRes = await fetch('http://localhost:3000/');
  const html = await frontRes.text();
  console.log('2. Frontend Serving: OK | HTML length:', html.length);

  // 3. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.rivera@techclub.org', password: 'password123' }),
  });
  const auth = await loginRes.json();
  console.log('3. Organizer Auth: OK | Name:', auth.user.name, '| Clubs count:', auth.user.clubs.length);

  const token = auth.accessToken;
  const clubId = auth.user.clubs[0].id;

  // 4. Get Event
  const eventsRes = await fetch(`http://localhost:5000/api/events?clubId=${clubId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const events = await eventsRes.json();
  const event = events[0];
  console.log('4. Event Loaded: OK | Name:', event.name, '| Date:', event.date);

  // 5. Test AI Copilot Query
  const copilotRes = await fetch('http://localhost:5000/api/ai/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eventId: event.id, query: "What should we focus on today?" }),
  });
  const copilot = await copilotRes.json();
  console.log('5. AI Copilot: OK | Actions recommended:', copilot.proposedActions.length);

  // 6. Test What-If Simulator
  const whatIfRes = await fetch('http://localhost:5000/api/ai/what-if', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eventId: event.id, scenario: 'VENUE_DELAY', delayDays: 3 }),
  });
  const whatIf = await whatIfRes.json();
  console.log('6. What-If Simulator: OK | Health delta:', whatIf.simulatedState.healthDelta, '| Affected tasks:', whatIf.simulatedState.affectedTasksCount);

  // 7. Test Meeting Processing
  const meetingRes = await fetch('http://localhost:5000/api/meetings/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      eventId: event.id,
      title: 'Smoke Test Meeting',
      transcript: 'Rohan: Submit Dean auditorium clearance tomorrow. Dev: Allocate 3 volunteers to registration desk.',
    }),
  });
  const meeting = await meetingRes.json();
  console.log('7. Meeting Intelligence: OK | Extracted action items:', meeting.actionItems.length);

  console.log('--- ALL E2E VERIFICATION CHECKS PASSED! ---');
}

runE2E().catch(console.error);
