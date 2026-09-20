import { prisma } from '../db/prisma.js';

async function main() {
  const event = await prisma.event.findFirst({
    where: { name: { contains: 'DPL' } },
    include: {
      tasks: {
        include: {
          assignee: true,
          dependencies: { include: { dependsOn: true } },
        },
      },
      risks: true,
      club: true,
    },
  });

  if (!event) {
    console.log('No DPL event found');
    return;
  }

  console.log(`EVENT: ${event.name} (${event.id})`);
  console.log(`Club ID: ${event.clubId}`);
  console.log(`Tasks (${event.tasks.length}):`);
  for (const t of event.tasks) {
    console.log(` - [${t.status}] ${t.title} (Owner: ${t.assignee?.name || 'Unassigned'}, Due: ${t.deadline})`);
  }

  const volunteers = await prisma.volunteer.findMany({
    where: { clubId: event.clubId },
  });
  console.log(`Volunteers (${volunteers.length}):`);
  for (const v of volunteers) {
    console.log(` - ${v.name} (Workload: ${v.currentWorkload})`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
