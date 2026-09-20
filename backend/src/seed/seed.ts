import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';

async function seed() {
  console.log('[Seed] Wiping ALL data and creating clean minimal seed...');

  // ── Wipe everything ──────────────────────────────────────────────────────
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.aiAction.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.meetingActionItem.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.volunteerSkill.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.team.deleteMany();
  await prisma.eventMetric.deleteMany();
  await prisma.event.deleteMany();
  await prisma.clubMember.deleteMany();
  await prisma.club.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] All tables wiped clean.');

  // ── 1. Create Organizer User ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);
  const organizer = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex.rivera@techclub.org',
      mobile: '+1 (555) 234-5678',
      passwordHash,
      role: 'ORGANIZER',
      verifiedEmail: true,
      verifiedMobile: true,
    },
  });
  console.log(`[Seed] Organizer: ${organizer.email}`);

  // ── 2. Create Club ────────────────────────────────────────────────────────
  const club = await prisma.club.create({
    data: {
      name: 'Tech Innovators Club',
      college: 'California Institute of Technology',
      category: 'Technical',
      description: 'Premier student hackathon and engineering organization.',
      joinCode: 'TECH-2026',
      ownerId: organizer.id,
      members: {
        create: { userId: organizer.id, role: 'OWNER' },
      },
    },
  });
  console.log(`[Seed] Club: ${club.name} (${club.joinCode})`);

  // ── 3. Create 6 Teams ─────────────────────────────────────────────────────
  const teamsData = [
    { name: 'Core Leadership',        color: '#6366F1' },
    { name: 'Technical & Platform',   color: '#06B6D4' },
    { name: 'Logistics & Venue',      color: '#F59E0B' },
    { name: 'Sponsorship & Finance',  color: '#10B981' },
    { name: 'Marketing & Media',      color: '#EC4899' },
    { name: 'Hospitality & Volunteers', color: '#8B5CF6' },
  ];

  for (const t of teamsData) {
    await prisma.team.create({ data: { clubId: club.id, name: t.name, color: t.color } });
  }
  console.log(`[Seed] Created ${teamsData.length} teams.`);

  // ── 4. Create 1 Empty Event ───────────────────────────────────────────────
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 14);

  const event = await prisma.event.create({
    data: {
      clubId: club.id,
      name: 'TechFest 2026',
      type: 'Hackathon',
      date: eventDate,
      expectedParticipants: 0,
      location: 'TBD',
      budget: 0,
      status: 'PLANNING',
      healthScore: 100,
      description: 'Your first event. Add tasks, volunteers, and risks to get started.',
    },
  });
  console.log(`[Seed] Event: ${event.name} — 0 tasks, 0 volunteers, 0 risks`);

  console.log(`
======================================================
  CLEAN SEED COMPLETE
------------------------------------------------------
  Login: alex.rivera@techclub.org
  Password: password123
  Club: Tech Innovators Club (TECH-2026)
  Event: TechFest 2026 (empty — ready for your data)
  Tasks: 0 | Volunteers: 0 | Risks: 0
======================================================
  `);
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
