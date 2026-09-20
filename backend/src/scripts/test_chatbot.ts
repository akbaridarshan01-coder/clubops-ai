import { aiService } from '../modules/ai/ai.service.js';
import { prisma } from '../db/prisma.js';

async function testChatbot() {
  console.log('================================================================');
  console.log('🤖 CLUBOPS AI CHATBOT TEST SUITE');
  console.log('================================================================\n');

  const event = await prisma.event.findFirst({
    where: { name: { contains: 'Tech' } },
    orderBy: { createdAt: 'desc' },
  }) || (await prisma.event.findFirst({ orderBy: { createdAt: 'desc' } }));

  if (!event) {
    console.error('No event found in DB');
    process.exit(1);
  }

  const user = await prisma.user.findFirst();
  const userId = user?.id || 'anonymous';

  console.log(`Using active event: "${event.name}" (${event.id})`);
  console.log(`Using test user: "${user?.name}" (${userId})\n`);

  const queries = [
    'How is the event going?',
    'What should we focus on today?',
    'Who has the highest workload?',
    'Who is available?',
    'Which tasks are blocked?',
    'What dependencies are currently blocking work?',
    'What decisions have been made?',
    'What happens if the sponsor does not confirm?',
    'What happens if Neel cannot complete the technical task?',
    'Who should handle this task?',
    'Create a task for Rahul to contact the sponsor.',
    'Tell all volunteers about tomorrow\'s meeting.',
    'What is the weather like in Paris?', // Testing out-of-scope query
  ];

  for (const q of queries) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`USER: "${q}"`);
    console.log(`------------------------------------------------------------`);
    const res = await aiService.handleCopilotQuery(event.id, q, userId);
    console.log(`AI RESPONSE:\n${res.content}\n`);
    if (res.proposedActions && res.proposedActions.length > 0) {
      console.log(`⚡ PROPOSED ACTIONS (${res.proposedActions.length}):`);
      for (const act of res.proposedActions) {
        console.log(`  - [${act.type}] ${act.buttonLabel} (payload: ${JSON.stringify(act.payload)})`);
      }
    }
  }

  // Also test action execution for one action:
  console.log(`\n============================================================`);
  console.log(`⚡ TESTING ACTION EXECUTION: Create Task`);
  console.log(`============================================================`);
  const createRes = await aiService.handleCopilotQuery(event.id, 'Create a task for Rahul to contact the sponsor.', userId);
  if (createRes.proposedActions && createRes.proposedActions.length > 0) {
    const actionToExec = createRes.proposedActions[0];
    const execResult = await aiService.executeApprovedAction(actionToExec, userId);
    console.log(`EXECUTION RESULT:`, execResult);

    // Test duplicate prevention when running the same command again:
    console.log(`\n⚡ TESTING DUPLICATE PREVENTION:`);
    const dupRes = await aiService.handleCopilotQuery(event.id, 'Create a task for Rahul to contact the sponsor.', userId);
    console.log(`DUPLICATE RESPONSE:\n${dupRes.content}\n`);
    console.log(`PROPOSED ACTIONS COUNT: ${dupRes.proposedActions?.length || 0} (Expected 0)`);
  }

  console.log('\n✅ ALL CHATBOT TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

testChatbot().catch(err => {
  console.error('Error running chatbot test:', err);
  process.exit(1);
});
