import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';

async function seed() {
  console.log('[Seed] Starting complete database seed for ClubOps AI...');

  // Clean previous demo data if exists
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

  // 1. Create Demo Organizer User
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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log(`[Seed] Created Organizer User: ${organizer.email}`);

  // 2. Create Club: "Tech Innovators Club"
  const club = await prisma.club.create({
    data: {
      name: 'Tech Innovators Club',
      college: 'California Institute of Technology',
      category: 'Technical',
      description: 'The premier student robotics, software engineering, and hackathon organization at Caltech.',
      joinCode: 'TECH-2026',
      ownerId: organizer.id,
      members: {
        create: {
          userId: organizer.id,
          role: 'OWNER',
        },
      },
    },
  });

  console.log(`[Seed] Created Club: ${club.name} (Code: ${club.joinCode})`);

  // 3. Create Teams
  const teamsData = [
    { name: 'Core Leadership', color: '#6366F1', description: 'Overall steering, administrative permits, and budget oversight' },
    { name: 'Technical & Platform', color: '#06B6D4', description: 'Portals, judge scoring system, devops, campus Wi-Fi infrastructure' },
    { name: 'Logistics & Venue', color: '#F59E0B', description: 'Auditorium load-in, stage audio/visuals, power grids, venue layout' },
    { name: 'Sponsorship & Finance', color: '#10B981', description: 'Corporate partners, cash disbursements, mentor booths' },
    { name: 'Marketing & Media', color: '#EC4899', description: 'Social campaigns, campus posters, reels, livestreaming' },
    { name: 'Hospitality & Volunteers', color: '#8B5CF6', description: 'Participant check-in, badges, catering, volunteer operations' },
  ];

  const createdTeams: { [name: string]: any } = {};
  for (const t of teamsData) {
    const team = await prisma.team.create({
      data: {
        clubId: club.id,
        name: t.name,
        color: t.color,
        description: t.description,
      },
    });
    createdTeams[t.name] = team;
  }

  // 4. Create Event: "TechFest 2026"
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 14); // 14 days from today

  const event = await prisma.event.create({
    data: {
      clubId: club.id,
      name: 'TechFest 2026',
      type: 'Hackathon',
      date: eventDate,
      expectedParticipants: 650,
      location: 'Beckman Auditorium & Annenberg Center',
      budget: 28500,
      status: 'ACTIVE',
      healthScore: 82,
      currentMilestone: 'Sprint 3: Venue Clearances & Registration Surge',
      description: 'Annual flagship 48-hour hackathon, tech expo, and robotics showcase.',
    },
  });

  console.log(`[Seed] Created Event: ${event.name} on ${event.date.toISOString().split('T')[0]}`);

  // 5. Create 30 Realistic Volunteers with Diverse Skills
  const volunteerNames = [
    { name: 'Priya Sharma', email: 'priya.s@caltech.edu', skills: ['Stage Management', 'Logistics', 'Crowd Control'], team: 'Logistics & Venue' },
    { name: 'Rohan Verma', email: 'rohan.v@caltech.edu', skills: ['React', 'Next.js', 'Node.js', 'System Architecture'], team: 'Technical & Platform' },
    { name: 'Karan Patel', email: 'karan.p@caltech.edu', skills: ['Python', 'PostgreSQL', 'QR Scanners'], team: 'Technical & Platform' },
    { name: 'Ananya Iyer', email: 'ananya.i@caltech.edu', skills: ['Graphic Design', 'Figma', 'Instagram Reels', 'Branding'], team: 'Marketing & Media' },
    { name: 'Dev Malhotra', email: 'dev.m@caltech.edu', skills: ['Catering Management', 'Registration Desk', 'Vendor Liaison'], team: 'Hospitality & Volunteers' },
    { name: 'Siddharth Nair', email: 'siddharth.n@caltech.edu', skills: ['Power Systems', 'Audio Engineering', 'Safety Protocols'], team: 'Logistics & Venue' },
    { name: 'Tanvi Saxena', email: 'tanvi.s@caltech.edu', skills: ['Copywriting', 'Public Relations', 'Press Releases'], team: 'Marketing & Media' },
    { name: 'Aarav Mehta', email: 'aarav.m@caltech.edu', skills: ['Sponsorship Outreach', 'Contract Law', 'Pitch Decks'], team: 'Sponsorship & Finance' },
    { name: 'Meera Nambiar', email: 'meera.n@caltech.edu', skills: ['VIP Escort', 'Hospitality', 'Hotel Reservations'], team: 'Hospitality & Volunteers' },
    { name: 'Kabir Joshi', email: 'kabir.j@caltech.edu', skills: ['Network Routing', 'Cisco Switches', 'Wi-Fi Tuning'], team: 'Technical & Platform' },
    { name: 'Sneha Kulkarni', email: 'sneha.k@caltech.edu', skills: ['Photography', 'Lightroom', 'Videography'], team: 'Marketing & Media' },
    { name: 'Arjun Das', email: 'arjun.d@caltech.edu', skills: ['Budget Auditing', 'Reimbursements', 'Excel'], team: 'Sponsorship & Finance' },
    { name: 'Zoya Khan', email: 'zoya.k@caltech.edu', skills: ['First Aid', 'Emergency Evacuation', 'Floor Marshalling'], team: 'Logistics & Venue' },
    { name: 'Rishi Sengupta', email: 'rishi.s@caltech.edu', skills: ['Docker', 'Cloudflare CDN', 'Kubernetes'], team: 'Technical & Platform' },
    { name: 'Divya Pillai', email: 'divya.p@caltech.edu', skills: ['Swag Distribution', 'Badge Printing', 'Helpdesk'], team: 'Hospitality & Volunteers' },
    { name: 'Vikram Rao', email: 'vikram.r@caltech.edu', skills: ['Lighting Rigging', 'Stage Truss', 'Microphone Arrays'], team: 'Logistics & Venue' },
    { name: 'Ishita Bansal', email: 'ishita.b@caltech.edu', skills: ['Social Media Analytics', 'TikTok Ads', 'Discord Moderation'], team: 'Marketing & Media' },
    { name: 'Aditya Roy', email: 'aditya.r@caltech.edu', skills: ['Corporate Sponsorship', 'Partner Booths'], team: 'Sponsorship & Finance' },
    { name: 'Pooja Hegde', email: 'pooja.h@caltech.edu', skills: ['Guest Reception', 'Catering Logistics', 'Keynote Marshalling'], team: 'Hospitality & Volunteers' },
    { name: 'Gaurav Bhat', email: 'gaurav.b@caltech.edu', skills: ['Backend APIs', 'WebSockets', 'Redis'], team: 'Technical & Platform' },
    { name: 'Neha Chawla', email: 'neha.c@caltech.edu', skills: ['Signage Design', 'Wayfinding Posters', 'Illustrator'], team: 'Marketing & Media' },
    { name: 'Manish Tiwari', email: 'manish.t@caltech.edu', skills: ['Heavy Lifting', 'Equipment Transport', 'Vehicles'], team: 'Logistics & Venue' },
    { name: 'Shreya Ghosh', email: 'shreya.g@caltech.edu', skills: ['Participant Onboarding', 'Slack Bot Management'], team: 'Hospitality & Volunteers' },
    { name: 'Harsh Vardhan', email: 'harsh.v@caltech.edu', skills: ['Sponsorship Grants', 'Alumni Outreach'], team: 'Sponsorship & Finance' },
    { name: 'Kavita Menon', email: 'kavita.m@caltech.edu', skills: ['Security Coordination', 'Campus Police Liaison'], team: 'Logistics & Venue' },
    { name: 'Nikhil Aggarwal', email: 'nikhil.a@caltech.edu', skills: ['Hardware Lab Setup', 'Arduino/Raspberry Pi Lending'], team: 'Technical & Platform' },
    { name: 'Bhavna Sen', email: 'bhavna.s@caltech.edu', skills: ['Volunteer Roster Scheduling', 'Shift Swapping'], team: 'Hospitality & Volunteers' },
    { name: 'Rahul Choudhury', email: 'rahul.c@caltech.edu', skills: ['Merchandise Vendor Coordination', 'T-shirt Sizing'], team: 'Sponsorship & Finance' },
    { name: 'Aparna Nair', email: 'aparna.n@caltech.edu', skills: ['Campus Broadcasts', 'WhatsApp Groups', 'SMS Blasts'], team: 'Marketing & Media' },
    { name: 'Sameer Qureshi', email: 'sameer.q@caltech.edu', skills: ['Cleaning Crew Coordination', 'Waste Segregation'], team: 'Logistics & Venue' },
  ];

  const createdVolunteers = [];
  for (let i = 0; i < volunteerNames.length; i++) {
    const v = volunteerNames[i];
    const team = createdTeams[v.team];
    const workloads = ['LOW', 'LOW', 'MEDIUM', 'HIGH', 'OVERLOADED'];
    const workload = i === 0 || i === 4 ? 'HIGH' : i === 1 ? 'OVERLOADED' : workloads[i % workloads.length];

    const vol = await prisma.volunteer.create({
      data: {
        clubId: club.id,
        teamId: team?.id,
        name: v.name,
        email: v.email,
        phone: `+1 (555) 019-${1000 + i}`,
        skills: JSON.stringify(v.skills),
        experienceYears: 1 + (i % 3) * 0.5,
        rating: 4.2 + (i % 8) * 0.1,
        availability: i === 7 ? 'BUSY' : 'AVAILABLE',
        currentWorkload: workload,
        assignedHours: workload === 'OVERLOADED' ? 18 : workload === 'HIGH' ? 12 : 4,
        skillRecords: {
          create: v.skills.map(s => ({ skillName: s, proficiency: 4 })),
        },
      },
    });
    createdVolunteers.push(vol);
  }

  console.log(`[Seed] Created ${createdVolunteers.length} Volunteers with skills and workloads.`);

  // 6. Create 52 Tasks Across All 6 Teams with Realistic Deadlines & Dependencies
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const rawTasks = [
    // Logistics & Venue Tasks (12 tasks)
    { title: 'Auditorium Booking & Admin Clearance', team: 'Logistics & Venue', priority: 'CRITICAL', status: 'IN_PROGRESS', offset: -1, est: 6, risk: 'HIGH', tags: ['Venue', 'Permit'] },
    { title: 'Stage Audio-Visual Truss & Lighting Rigging', team: 'Logistics & Venue', priority: 'CRITICAL', status: 'TODO', offset: 2, est: 8, risk: 'HIGH', tags: ['Stage', 'AV'] },
    { title: 'Campus Facilities Power Load Balancing Inspection', team: 'Logistics & Venue', priority: 'HIGH', status: 'TODO', offset: 3, est: 5, risk: 'MEDIUM', tags: ['Electrical'] },
    { title: '50kVA Backup Diesel Generator Delivery & Fueling', team: 'Logistics & Venue', priority: 'HIGH', status: 'TODO', offset: 4, est: 4, risk: 'MEDIUM', tags: ['Generator'] },
    { title: 'Main Hall Floor Plan & Fire Marshal Evacuation Plan', team: 'Logistics & Venue', priority: 'HIGH', status: 'DONE', offset: -4, est: 5, risk: 'LOW', tags: ['Safety'] },
    { title: 'Table & Ergonomic Chair Rental Contract for 650 Hackers', team: 'Logistics & Venue', priority: 'MEDIUM', status: 'DONE', offset: -2, est: 6, risk: 'LOW', tags: ['Furniture'] },
    { title: 'Hardware Hacking Lab Workbench Power Strip Installation', team: 'Logistics & Venue', priority: 'MEDIUM', status: 'TODO', offset: 5, est: 7, risk: 'LOW', tags: ['HardwareLab'] },
    { title: 'Night-Time Quiet Sleeping Pods & Beanbag Setup', team: 'Logistics & Venue', priority: 'LOW', status: 'TODO', offset: 6, est: 4, risk: 'LOW', tags: ['ChillZone'] },
    { title: 'Trash Cans & E-Waste Segregation Station Deployment', team: 'Logistics & Venue', priority: 'LOW', status: 'TODO', offset: 7, est: 3, risk: 'LOW', tags: ['Sanitation'] },
    { title: 'Campus Security Briefing & Perimeter Barrier Locks', team: 'Logistics & Venue', priority: 'MEDIUM', status: 'TODO', offset: 8, est: 4, risk: 'LOW', tags: ['Security'] },
    { title: 'Keynote Podium & Teleprompter Calibration', team: 'Logistics & Venue', priority: 'LOW', status: 'TODO', offset: 9, est: 2, risk: 'LOW', tags: ['Stage'] },
    { title: 'Post-Event Teardown Logistics & Waste Clearance Plan', team: 'Logistics & Venue', priority: 'LOW', status: 'TODO', offset: 15, est: 6, risk: 'LOW', tags: ['Teardown'] },

    // Technical & Platform Tasks (10 tasks)
    { title: 'Participant Registration Portal & Team Matchmaker', team: 'Technical & Platform', priority: 'CRITICAL', status: 'DONE', offset: -5, est: 18, risk: 'LOW', tags: ['Web', 'Portal'] },
    { title: 'High-Density Wi-Fi Access Point Firmware Stress Test', team: 'Technical & Platform', priority: 'CRITICAL', status: 'BLOCKED', offset: 1, est: 10, risk: 'CRITICAL', tags: ['Network', 'Wi-Fi'] },
    { title: 'QR Code Mobile Check-In Scanner PWA for Volunteers', team: 'Technical & Platform', priority: 'HIGH', status: 'IN_PROGRESS', offset: 2, est: 12, risk: 'MEDIUM', tags: ['Scanner', 'Mobile'] },
    { title: 'Live Judge Scoring Dashboard & Rubric Aggregator', team: 'Technical & Platform', priority: 'HIGH', status: 'TODO', offset: 6, est: 14, risk: 'MEDIUM', tags: ['Judges', 'Scoring'] },
    { title: 'Hardware Loaner Checkout & Serial Barcode Database', team: 'Technical & Platform', priority: 'MEDIUM', status: 'TODO', offset: 5, est: 6, risk: 'LOW', tags: ['Hardware'] },
    { title: 'Automated Discord Notification Bot for Announcements', team: 'Technical & Platform', priority: 'MEDIUM', status: 'DONE', offset: -1, est: 5, risk: 'LOW', tags: ['Discord', 'Bot'] },
    { title: 'Sponsor API Sandbox Cloud Credits Distribution System', team: 'Technical & Platform', priority: 'HIGH', status: 'IN_PROGRESS', offset: 3, est: 8, risk: 'LOW', tags: ['Cloud', 'Sponsors'] },
    { title: 'Main Stage Video Feed Multi-Camera Livestream Pipeline', team: 'Technical & Platform', priority: 'MEDIUM', status: 'TODO', offset: 7, est: 9, risk: 'MEDIUM', tags: ['Livestream'] },
    { title: 'Real-Time Project Submission Portal & Git Verification', team: 'Technical & Platform', priority: 'HIGH', status: 'TODO', offset: 8, est: 12, risk: 'LOW', tags: ['Submissions'] },
    { title: 'Emergency Offline Backup Database Sync Node', team: 'Technical & Platform', priority: 'MEDIUM', status: 'TODO', offset: 4, est: 6, risk: 'LOW', tags: ['Infra'] },

    // Sponsorship & Finance Tasks (8 tasks)
    { title: 'Tier 1 Title Sponsor (\$12,000) Agreement Signing', team: 'Sponsorship & Finance', priority: 'CRITICAL', status: 'DONE', offset: -10, est: 15, risk: 'LOW', tags: ['Finance', 'Sponsors'] },
    { title: 'Sponsorship Cash Disbursement Clearance into Student Fund', team: 'Sponsorship & Finance', priority: 'HIGH', status: 'IN_PROGRESS', offset: 1, est: 8, risk: 'HIGH', tags: ['Banking'] },
    { title: 'Swag Bag Partner Merch Shipment Customs Clearance', team: 'Sponsorship & Finance', priority: 'HIGH', status: 'TODO', offset: 3, est: 6, risk: 'MEDIUM', tags: ['Merch'] },
    { title: 'Sponsor Keynote Speaker Accommodations & Flights', team: 'Sponsorship & Finance', priority: 'MEDIUM', status: 'DONE', offset: -3, est: 6, risk: 'LOW', tags: ['VIP'] },
    { title: 'Workshop Track Prize Matrix & Hackathon Cash Grants', team: 'Sponsorship & Finance', priority: 'HIGH', status: 'DONE', offset: -6, est: 8, risk: 'LOW', tags: ['Prizes'] },
    { title: 'Sponsor Booth Floor Allocation & Electricity Grid Vetting', team: 'Sponsorship & Finance', priority: 'MEDIUM', status: 'TODO', offset: 4, est: 5, risk: 'LOW', tags: ['Booths'] },
    { title: 'Vendor Advance Invoices Approval from Treasurer', team: 'Sponsorship & Finance', priority: 'MEDIUM', status: 'IN_PROGRESS', offset: 2, est: 4, risk: 'LOW', tags: ['Accounting'] },
    { title: 'Post-Event Sponsor ROI Report & Impact Summary Deck', team: 'Sponsorship & Finance', priority: 'LOW', status: 'TODO', offset: 18, est: 10, risk: 'LOW', tags: ['Reports'] },

    // Marketing & Media Tasks (8 tasks)
    { title: 'Instagram Teaser Campaign & Reel Video Drops', team: 'Marketing & Media', priority: 'HIGH', status: 'DONE', offset: -4, est: 10, risk: 'LOW', tags: ['Social'] },
    { title: 'Campus Quadrangle Posters & Digital Billboard Takeover', team: 'Marketing & Media', priority: 'MEDIUM', status: 'DONE', offset: -2, est: 6, risk: 'LOW', tags: ['Print'] },
    { title: 'Official Registration Closing Warning Blast', team: 'Marketing & Media', priority: 'HIGH', status: 'TODO', offset: 1, est: 3, risk: 'LOW', tags: ['Newsletter'] },
    { title: 'Hacker Participant Survival Guide PDF Design', team: 'Marketing & Media', priority: 'MEDIUM', status: 'IN_PROGRESS', offset: 3, est: 7, risk: 'LOW', tags: ['Design'] },
    { title: 'Official Hackathon T-Shirt & Lanyard Design Assets', team: 'Marketing & Media', priority: 'HIGH', status: 'DONE', offset: -8, est: 8, risk: 'LOW', tags: ['Merch'] },
    { title: 'Photographer & Videographer Shot-List & Run-of-Show', team: 'Marketing & Media', priority: 'LOW', status: 'TODO', offset: 6, est: 4, risk: 'LOW', tags: ['Media'] },
    { title: 'Live X (Twitter) & LinkedIn Updates During Ceremony', team: 'Marketing & Media', priority: 'LOW', status: 'TODO', offset: 10, est: 8, risk: 'LOW', tags: ['Coverage'] },
    { title: 'Aftermovie Teaser Editing & YouTube Premiere', team: 'Marketing & Media', priority: 'LOW', status: 'TODO', offset: 16, est: 14, risk: 'LOW', tags: ['Video'] },

    // Hospitality & Volunteers Tasks (8 tasks)
    { title: 'Volunteer Shift Scheduling & Role Allocation Matrix', team: 'Hospitality & Volunteers', priority: 'CRITICAL', status: 'IN_PROGRESS', offset: 1, est: 8, risk: 'HIGH', tags: ['Volunteers'] },
    { title: 'Participant Badge Printing for 650 Hackers & 60 Mentors', team: 'Hospitality & Volunteers', priority: 'HIGH', status: 'TODO', offset: 3, est: 6, risk: 'MEDIUM', tags: ['Badges'] },
    { title: 'Midnight Catering Contract & Pizza Truck Logistics', team: 'Hospitality & Volunteers', priority: 'HIGH', status: 'DONE', offset: -3, est: 5, risk: 'LOW', tags: ['Food'] },
    { title: 'Continuous Coffee, Red Bull & Tea Refill Station Setup', team: 'Hospitality & Volunteers', priority: 'MEDIUM', status: 'TODO', offset: 4, est: 4, risk: 'LOW', tags: ['Snacks'] },
    { title: 'Mentor Lounge Catering & Dietary Restriction Menus', team: 'Hospitality & Volunteers', priority: 'LOW', status: 'TODO', offset: 5, est: 3, risk: 'LOW', tags: ['Mentors'] },
    { title: 'Emergency First Aid Station & Paramedic On-Call Roster', team: 'Hospitality & Volunteers', priority: 'MEDIUM', status: 'DONE', offset: -1, est: 4, risk: 'LOW', tags: ['Health'] },
    { title: 'Swag Bag Stuffing & Assembly Assembly Line', team: 'Hospitality & Volunteers', priority: 'MEDIUM', status: 'TODO', offset: 6, est: 8, risk: 'LOW', tags: ['Swag'] },
    { title: 'Sunday Morning Breakfast Burrito Distribution Schedule', team: 'Hospitality & Volunteers', priority: 'LOW', status: 'TODO', offset: 11, est: 3, risk: 'LOW', tags: ['Breakfast'] },

    // Core Leadership Tasks (6 tasks)
    { title: 'University Dean Operational Safety Briefing & Signature', team: 'Core Leadership', priority: 'CRITICAL', status: 'IN_PROGRESS', offset: 1, est: 4, risk: 'CRITICAL', tags: ['Dean', 'Legal'] },
    { title: 'Hackathon Rulebook, Code of Conduct & IP Guidelines', team: 'Core Leadership', priority: 'HIGH', status: 'DONE', offset: -12, est: 6, risk: 'LOW', tags: ['Rules'] },
    { title: 'Industry Keynote Speaker Invitations & Confirmations', team: 'Core Leadership', priority: 'HIGH', status: 'DONE', offset: -9, est: 10, risk: 'LOW', tags: ['Keynote'] },
    { title: 'Hackathon Opening Ceremony Slide Deck & Run-of-Show', team: 'Core Leadership', priority: 'MEDIUM', status: 'IN_PROGRESS', offset: 5, est: 6, risk: 'LOW', tags: ['Ceremony'] },
    { title: 'Master Event Insurance Policy Payment Confirmation', team: 'Core Leadership', priority: 'HIGH', status: 'DONE', offset: -7, est: 4, risk: 'LOW', tags: ['Insurance'] },
    { title: 'Closing Ceremony Award Trophies & Certificate Distribution', team: 'Core Leadership', priority: 'MEDIUM', status: 'TODO', offset: 12, est: 5, risk: 'LOW', tags: ['Trophies'] },
  ];

  const createdTasksMap = new Map<string, string>();

  for (let i = 0; i < rawTasks.length; i++) {
    const t = rawTasks[i];
    const team = createdTeams[t.team];
    const assignee = createdVolunteers[i % createdVolunteers.length];

    const task = await prisma.task.create({
      data: {
        eventId: event.id,
        teamId: team?.id,
        assigneeId: t.status === 'DONE' || i % 3 !== 0 ? organizer.id : null,
        title: t.title,
        description: `Operational task assigned under the ${t.team} workstream for ${event.name}.`,
        status: t.status,
        priority: t.priority,
        deadline: new Date(now + t.offset * day),
        estimatedHours: t.est,
        actualHours: t.status === 'DONE' ? t.est : 0,
        riskLevel: t.risk,
        tags: JSON.stringify(t.tags),
        completedAt: t.status === 'DONE' ? new Date(now - 2 * day) : null,
      },
    });

    createdTasksMap.set(t.title, task.id);
  }

  console.log(`[Seed] Created ${rawTasks.length} Tasks across all teams.`);

  // 7. Create Critical Dependencies (Stage depends on Venue, Badges depend on Registration, Wi-Fi test depends on Lab Setup)
  const venueTaskId = createdTasksMap.get('Auditorium Booking & Admin Clearance');
  const stageTaskId = createdTasksMap.get('Stage Audio-Visual Truss & Lighting Rigging');
  const powerTaskId = createdTasksMap.get('Campus Facilities Power Load Balancing Inspection');
  const generatorTaskId = createdTasksMap.get('50kVA Backup Diesel Generator Delivery & Fueling');
  const regTaskId = createdTasksMap.get('Participant Registration Portal & Team Matchmaker');
  const badgeTaskId = createdTasksMap.get('Participant Badge Printing for 650 Hackers & 60 Mentors');
  const wifiTaskId = createdTasksMap.get('High-Density Wi-Fi Access Point Firmware Stress Test');

  if (stageTaskId && venueTaskId) {
    await prisma.taskDependency.create({ data: { taskId: stageTaskId, dependsOnTaskId: venueTaskId } });
  }
  if (powerTaskId && venueTaskId) {
    await prisma.taskDependency.create({ data: { taskId: powerTaskId, dependsOnTaskId: venueTaskId } });
  }
  if (generatorTaskId && powerTaskId) {
    await prisma.taskDependency.create({ data: { taskId: generatorTaskId, dependsOnTaskId: powerTaskId } });
  }
  if (badgeTaskId && regTaskId) {
    await prisma.taskDependency.create({ data: { taskId: badgeTaskId, dependsOnTaskId: regTaskId } });
  }
  if (wifiTaskId && powerTaskId) {
    await prisma.taskDependency.create({ data: { taskId: wifiTaskId, dependsOnTaskId: powerTaskId } });
  }

  console.log('[Seed] Created Task Dependencies and Critical Paths.');

  // 8. Create 10 Realistic Risks for Risk Radar
  const risksData = [
    {
      title: 'Auditorium Booking & Air-Conditioning Safety Permit Delay',
      description: 'University administrative board rescheduled safety audit, which risks holding up main stage load-in by 3 days.',
      category: 'VENUE',
      severity: 'CRITICAL',
      status: 'IDENTIFIED',
      impactAnalysis: 'Directly blocks Stage Rigging and Soundcheck. Could compress staging into a single overnight shift.',
      mitigationPlan: 'Prepare Open-Air Amphitheater as contingency; escalate directly to Vice Provost for Student Affairs.',
      affectedTasks: venueTaskId ? [venueTaskId, stageTaskId].filter(Boolean) : [],
    },
    {
      title: 'DHCP Pool Exhaustion Under 650 Concurrent Wi-Fi Clients',
      description: 'Campus IT subnet has a /23 allocation (510 usable leases), insufficient for 650 hackers + phones.',
      category: 'TECHNICAL',
      severity: 'CRITICAL',
      status: 'MITIGATING',
      impactAnalysis: 'Severe connection drops during opening ceremony and project submission window.',
      mitigationPlan: 'Provision 2 secondary Wi-Fi 6 APs on isolated VLAN with external 5G cellular uplink.',
      affectedTasks: wifiTaskId ? [wifiTaskId] : [],
    },
    {
      title: 'Registration Desk Volunteer Deficit During Peak 8 AM Rush',
      description: 'Only 4 check-in volunteers rostered between 07:30 AM and 09:30 AM for 650 participants.',
      category: 'VOLUNTEER',
      severity: 'HIGH',
      status: 'IDENTIFIED',
      impactAnalysis: 'Queue wait times projected to exceed 32 minutes, delaying opening ceremony.',
      mitigationPlan: 'Reallocate 3 volunteers from Marketing and Hospitality to Check-in desks.',
      affectedTasks: badgeTaskId ? [badgeTaskId] : [],
    },
    {
      title: 'Title Sponsor Grant Disbursement Banking Delay',
      description: 'Corporate PO clearance taking longer than anticipated; cash liquidity needed for caterer deposits.',
      category: 'BUDGET',
      severity: 'HIGH',
      status: 'MITIGATING',
      impactAnalysis: 'Food trucks require 50% advance 5 days before festival launch.',
      mitigationPlan: 'Draw temporary \$5,000 credit bridge from Student Council reserve fund.',
      affectedTasks: [],
    },
    {
      title: 'Campus Power Grid Trip Due to High Server/GPU Load',
      description: 'Hackers bringing dual-monitor rigs and heavy RTX machines could trip auditorium breaker circuits.',
      category: 'TECHNICAL',
      severity: 'HIGH',
      status: 'IDENTIFIED',
      impactAnalysis: 'Blackout during active hacking block causing unsaved code loss.',
      mitigationPlan: 'Install dedicated distro boxes connected to backup diesel generator.',
      affectedTasks: generatorTaskId ? [generatorTaskId] : [],
    },
    {
      title: 'Late Arrival of Custom Branded Hacker Lanyards & Swag',
      description: 'Overseas air courier tracking indicates potential 48-hour customs hold at airport terminal.',
      category: 'TIMELINE',
      severity: 'MEDIUM',
      status: 'MITIGATING',
      impactAnalysis: 'Opening registration bags may lack sponsor enamel pins and stickers.',
      mitigationPlan: 'Contract local rapid screen printer in Pasadena for emergency batch.',
      affectedTasks: [],
    },
    {
      title: 'Sudden Rain Forecast Threatening Outdoor Food Truck Station',
      description: 'Weather radar projects a 40% chance of showers on Saturday evening.',
      category: 'VENUE',
      severity: 'MEDIUM',
      status: 'IDENTIFIED',
      impactAnalysis: 'Outdoor food truck seating will be unusable.',
      mitigationPlan: 'Reserve covered north portico and move dining tables indoors.',
      affectedTasks: [],
    },
    {
      title: 'Keynote Speaker Flight Delay from San Francisco',
      description: 'SFO morning fog frequently causes 90-minute delays for morning commuter hops.',
      category: 'TIMELINE',
      severity: 'LOW',
      status: 'IDENTIFIED',
      impactAnalysis: 'Opening keynote might need to be pushed back 30 minutes.',
      mitigationPlan: 'Have keynote speaker arrive the evening prior; hotel booked.',
      affectedTasks: [],
    },
    {
      title: 'Discord Rate Limits on Bulk Hacker Announcements',
      description: 'Sending 650 DMs triggers Discord API spam protections.',
      category: 'TECHNICAL',
      severity: 'LOW',
      status: 'RESOLVED',
      impactAnalysis: 'Failure to broadcast milestone alerts.',
      mitigationPlan: 'Use announcement channel mentions with @everyone tag instead of individual DMs.',
      affectedTasks: [],
    },
    {
      title: 'Catering Vendor Under-estimating Vegan / Gluten-Free Meals',
      description: 'Initial headcount only allocated 8% special dietary options; survey indicates 18%.',
      category: 'VOLUNTEER',
      severity: 'MEDIUM',
      status: 'MITIGATING',
      impactAnalysis: 'Dissatisfaction among participants with strict dietary requirements.',
      mitigationPlan: 'Adjust caterer order sheet to allocate 120 dedicated vegan/GF boxed lunches.',
      affectedTasks: [],
    },
  ];

  for (const r of risksData) {
    await prisma.risk.create({
      data: {
        eventId: event.id,
        title: r.title,
        description: r.description,
        category: r.category,
        severity: r.severity,
        status: r.status,
        impactAnalysis: r.impactAnalysis,
        mitigationPlan: r.mitigationPlan,
        affectedTasks: JSON.stringify(r.affectedTasks),
      },
    });
  }

  console.log(`[Seed] Created ${risksData.length} Risks with impact analyses and mitigation playbooks.`);

  // 9. Create 5 Meetings with Transcripts & Action Items
  const meetingsData = [
    {
      title: 'Sprint 3 Core Planning: Venue Approvals & Sponsor Push',
      location: 'Beckman Institute Conference Room 204',
      date: new Date(now - 3 * day),
      transcript: `Meeting called to order at 5:00 PM. Attendees: Alex, Rohan, Priya, Dev, Ananya.
Priya: The title sponsor agreement with Google Cloud is 95% sealed. They committed \$12,000 plus \$200 GCP credits for every hacker.
Alex: That is huge. What about the venue safety audit?
Rohan: Dean's office rescheduled our walkthrough to Thursday afternoon. That pushes back AV rigging by 48 hours unless we fast-track.
Alex: I will email the Vice Provost directly to unblock this tomorrow morning.
Dev: For registration, we only have 4 volunteers assigned for the 8 AM rush. We need at least 7 desks running.
Ananya: Marketing team has 3 members who can take the morning check-in shift from 7:30 to 10:00 AM.
Rohan: We also need to confirm the 50kVA diesel generator delivery so we don't trip auditorium circuits.`,
    },
    {
      title: 'Technical Infrastructure & Subnet Provisioning Sync',
      location: 'Discord Stage #tech-leads',
      date: new Date(now - 7 * day),
      transcript: `Karan: Wi-Fi capacity test failed when we simulated 500 simultaneous DHCP handshakes on the guest SSID.
Kabir: We spoke with Campus IT network admins. They are creating a dedicated VLAN /22 for TechFest that gives 1024 IPs.
Rohan: Excellent. Make sure the QR code scanner PWA works offline in case local AP drops for 30 seconds.
Gaurav: The judge scoring portal is ready for staging test. We will demo it to Alex on Friday.`,
    },
    {
      title: 'Hospitality, Catering & Participant Logistics Review',
      location: 'Student Union Room 102',
      date: new Date(now - 10 * day),
      transcript: `Dev: We signed the midnight pizza truck and coffee cart contracts. Red Bull is delivering 800 cans on Friday afternoon.
Meera: Badges need to be printed and organized alphabetically in lanyard boxes by Thursday evening.
Dev: What about the volunteer food vouchers?
Priya: Included in the catering package. Every volunteer receives 3 hot meals and an official staff hoodie.`,
    },
    {
      title: 'Marketing Kickoff & Social Reel Sprint',
      location: 'Design Studio Lab B',
      date: new Date(now - 14 * day),
      transcript: `Ananya: Our first Instagram reel hit 14,000 views across campus tech handles.
Tanvi: Hacker survival guide is 80% drafted. We need the final mentor office hours schedule to print.
Sneha: Photographer and videographer run-of-show is prepared. We have 3 DSLR cameras for opening ceremony.`,
    },
    {
      title: 'Executive Sponsor Pitch & Partner Track Allocations',
      location: 'Caltech Alumni House',
      date: new Date(now - 21 * day),
      transcript: `Aarav: Presented to 8 corporate sponsors. Google Cloud, GitHub, and Red Bull confirmed.
Alex: Total confirmed sponsorship is \$28,500. We are in great financial health.
Priya: Cash flow timeline needs to be strictly monitored so vendor checks clear on time.`,
    },
  ];

  for (const m of meetingsData) {
    const meeting = await prisma.meeting.create({
      data: {
        eventId: event.id,
        title: m.title,
        location: m.location,
        date: m.date,
        transcript: m.transcript,
        summary: `Executive summary: Action items identified across venue unblocking, volunteer reallocations, and sponsorship confirmation.`,
        processedAt: new Date(m.date.getTime() + 2 * 60 * 60 * 1000),
      },
    });

    // Create action items for the first meeting
    if (m.title.includes('Sprint 3 Core Planning')) {
      const items = [
        { raw: 'Alex: Email Vice Provost directly to unblock venue walkthrough.', title: 'Email Vice Provost to expedite auditorium permit', owner: 'Alex Rivera', team: 'Core Leadership', priority: 'CRITICAL', deadline: new Date(now + 1 * day) },
        { raw: 'Priya: Finalize Google Cloud \$12,000 contract and credit keys.', title: 'Finalize Google Cloud title sponsor contract', owner: 'Priya Sharma', team: 'Sponsorship & Finance', priority: 'HIGH', deadline: new Date(now + 2 * day) },
        { raw: 'Dev: Move 3 marketing volunteers to morning registration desks.', title: 'Reallocate 3 volunteers to 8 AM check-in desk', owner: 'Dev Malhotra', team: 'Hospitality & Volunteers', priority: 'CRITICAL', deadline: new Date(now + 2 * day) },
        { raw: 'Rohan: Confirm 50kVA diesel generator delivery and fueling time.', title: 'Confirm 50kVA diesel generator delivery slot', owner: 'Rohan Verma', team: 'Logistics & Venue', priority: 'HIGH', deadline: new Date(now + 3 * day) },
        { raw: 'Ananya: Deliver participant survival guide PDF for printing.', title: 'Export final Hacker Survival Guide PDF', owner: 'Ananya Iyer', team: 'Marketing & Media', priority: 'MEDIUM', deadline: new Date(now + 4 * day) },
        { raw: 'Karan: Run offline cache test on QR check-in scanner PWA.', title: 'Validate offline mode on volunteer check-in scanner', owner: 'Karan Patel', team: 'Technical & Platform', priority: 'HIGH', deadline: new Date(now + 2 * day) },
        { raw: 'Meera: Sort and box 650 participant badges alphabetically.', title: 'Assemble and alphabetize 650 participant badges', owner: 'Meera Nambiar', team: 'Hospitality & Volunteers', priority: 'MEDIUM', deadline: new Date(now + 5 * day) },
      ];

      for (const it of items) {
        await prisma.meetingActionItem.create({
          data: {
            meetingId: meeting.id,
            rawText: it.raw,
            extractedTitle: it.title,
            suggestedOwner: it.owner,
            suggestedTeam: it.team,
            suggestedPriority: it.priority,
            suggestedDeadline: it.deadline,
          },
        });
      }
    }
  }

  console.log(`[Seed] Created ${meetingsData.length} Meetings with action item extractions.`);

  // 10. Create 10 Documents for Club Brain
  const docsData = [
    { title: 'TechFest 2025 Financial Audit & Post-Mortem Report.pdf', category: 'REPORT', summary: 'Complete financial and operational retrospective of the 2025 festival with budget lines and bottleneck logs.' },
    { title: 'Campus Facility & Auditorium Booking Guidelines v3.pdf', category: 'GUIDELINE', summary: 'University administration policy for student union and auditorium sound ordinances and fire marshal permits.' },
    { title: 'Sponsorship Inflow Breakdown & Contract Templates.docx', category: 'CONTRACT', summary: 'Standard Tier 1, 2, and 3 corporate partner sponsorship agreements and benefit matrices.' },
    { title: 'Emergency Response & Safety Evacuation Playbook.pdf', category: 'GUIDELINE', summary: 'Campus security protocol, designated assembly areas, first aid stations, and police dispatch contacts.' },
    { title: 'Tech Innovators Club Constitution & Bylaws.pdf', category: 'GUIDELINE', summary: 'Official club charter, election rules, executive authority, and volunteer service certification requirements.' },
    { title: 'Hackathon Rubric & Judge Evaluation Criteria.pdf', category: 'GUIDELINE', summary: 'Scoring criteria across Technical Complexity, Originality, Design, and Presentation (1-10 points each).' },
    { title: 'Catering & Food Vendor Service Agreement 2026.pdf', category: 'CONTRACT', summary: 'Signed terms with food trucks, Midnight Pizza, and campus coffee suppliers.' },
    { title: 'High-Density Wi-Fi Deployment Architecture.pdf', category: 'REPORT', summary: 'VLAN /22 configuration notes, AP channel mapping for auditorium, and fallback 5G uplink credentials.' },
    { title: 'Volunteer Operations Handbook & Shift Matrix.docx', category: 'GUIDELINE', summary: 'Volunteer code of conduct, check-in procedure, shift swapping rules, and certificate eligibility.' },
    { title: 'Previous Hackathon Incident Log 2024-2025.txt', category: 'REPORT', summary: 'Historical catalog of past issues: Wi-Fi DHCP timeouts, late pizza delivery, and air conditioning permits.' },
  ];

  for (const d of docsData) {
    await prisma.document.create({
      data: {
        clubId: club.id,
        eventId: event.id,
        title: d.title,
        fileUrl: `/uploads/${d.title.replace(/\s+/g, '_')}`,
        fileType: d.title.endsWith('.pdf') ? 'PDF' : d.title.endsWith('.docx') ? 'DOCX' : 'TXT',
        fileSize: 1024 * 72,
        category: d.category,
        summary: d.summary,
        chunks: {
          create: [{ content: d.summary, pageNumber: 1 }],
        },
      },
    });
  }

  console.log(`[Seed] Created ${docsData.length} Documents for Club Brain.`);

  // 11. Create Sample Announcements
  await prisma.announcement.create({
    data: {
      eventId: event.id,
      title: '🚨 Registration Closing in 48 Hours!',
      channel: 'WHATSAPP',
      content: `Hey Hackers! 🚀 Over 600 participants have registered for TechFest 2026! Registration officially closes tomorrow at 11:59 PM. Complete your team formation on the portal now!`,
      targetAudience: 'PARTICIPANTS',
      status: 'SENT',
      sentAt: new Date(now - 24 * 60 * 60 * 1000),
    },
  });

  await prisma.announcement.create({
    data: {
      eventId: event.id,
      title: 'Volunteer Briefing & Staff Hoodie Collection',
      channel: 'EMAIL',
      content: `All confirmed volunteers are requested to attend the mandatory rehearsal and badge pickup session this Thursday at 5:00 PM in Beckman 204.`,
      targetAudience: 'VOLUNTEERS',
      status: 'SENT',
      sentAt: new Date(now - 12 * 60 * 60 * 1000),
    },
  });

  // 12. Create Sample Notifications
  await prisma.notification.create({
    data: {
      userId: organizer.id,
      eventId: event.id,
      category: 'RISK',
      title: 'Critical Risk Alert: Venue Approval Pending',
      message: 'Auditorium safety permit has not been approved by Dean Office. Downstream stage tasks at risk.',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: organizer.id,
      eventId: event.id,
      category: 'AI',
      title: 'AI Copilot Recommendation',
      message: 'Registration desk volunteer deficit detected. Recommend moving 3 volunteers from Marketing.',
      read: false,
    },
  });

  console.log('\n======================================================');
  console.log('✅ CLUBOPS AI DEMO SEED COMPLETED SUCCESSFULLY!');
  console.log('------------------------------------------------------');
  console.log('Organizer Credentials:');
  console.log(`Email: ${organizer.email}`);
  console.log('Password: password123');
  console.log(`Club: ${club.name} (Code: ${club.joinCode})`);
  console.log(`Event: ${event.name} (ID: ${event.id})`);
  console.log(`Tasks: ${rawTasks.length} | Volunteers: ${volunteerNames.length} | Risks: ${risksData.length}`);
  console.log('======================================================\n');
}

seed()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
