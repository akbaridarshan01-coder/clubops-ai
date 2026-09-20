import { clubopsIntelligence } from '../modules/ai/clubopsIntelligence.js';

async function test() {
  const transcript = `First, the venue is now confirmed as Auditorium B. Amit completed
the booking yesterday, so that part is done.

Rahul contacted ABC Company about sponsorship but they haven't
confirmed yet. He will follow up tomorrow. If they don't confirm
by tomorrow evening, we should approach XYZ Company as our backup.

Neel was supposed to test the registration system today, but he
couldn't because Rahul hasn't provided the server credentials.
Rahul said he will send them tonight. Once Neel receives them,
he should test the registration system.

Priya finished the main poster, but because we changed the venue,
she needs to update the venue name and upload the final poster by
Wednesday.

The banners can only be sent for printing after the final poster
is uploaded and the sponsor logo is confirmed.

Also, Neel currently has seven technical tasks. We should consider
moving some work to another technical volunteer.

The team finally decided that the volunteer meeting will be held
tomorrow at 5 PM in Room 204. Please inform all volunteers.`;

  const res = await clubopsIntelligence.analyzeOperationalText(transcript);
  console.log('=== SUMMARY ===');
  console.log(res.summary);
  console.log('\n=== TASKS ===');
  console.log(JSON.stringify(res.tasks, null, 2));
  console.log('\n=== COMPLETED TASKS ===');
  console.log(JSON.stringify(res.completed_tasks, null, 2));
  console.log('\n=== DECISIONS ===');
  console.log(JSON.stringify(res.decisions, null, 2));
  console.log('\n=== DEPENDENCIES ===');
  console.log(JSON.stringify(res.dependencies, null, 2));
  console.log('\n=== CONDITIONS ===');
  console.log(JSON.stringify(res.conditions, null, 2));
  console.log('\n=== ANNOUNCEMENTS ===');
  console.log(JSON.stringify(res.announcements, null, 2));
  console.log('\n=== RISKS ===');
  console.log(JSON.stringify(res.risks, null, 2));
  console.log('\n=== RECOMMENDATIONS ===');
  console.log(JSON.stringify(res.recommendations, null, 2));
  console.log('\n=== EFFICIENCY ===');
  console.log(JSON.stringify(res.efficiency, null, 2));
  process.exit(0);
}

test();
