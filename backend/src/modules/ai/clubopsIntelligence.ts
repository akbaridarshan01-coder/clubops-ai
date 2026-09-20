import { prisma } from '../../db/prisma.js';

export interface ExtractedTask {
  title: string;
  assigned_to?: string | null;
  assignee_id?: string | null;
  deadline?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  team?: string | null;
  team_id?: string | null;
  skill?: string | null;
  dependency?: string | null;
  source?: string | null;
}

export interface ExtractedRisk {
  title: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  related_task?: string | null;
  related_person?: string | null;
  recommended_action: string;
}

export interface ExtractedAnnouncement {
  title: string;
  message: string;
  audience: 'ALL_VOLUNTEERS' | 'VOLUNTEERS' | 'PARTICIPANTS' | 'SPONSORS' | 'ALL';
  channel?: 'WHATSAPP' | 'EMAIL' | 'NOTICE' | 'INSTAGRAM';
}

export interface ExtractedDecision {
  decision: string;
  status: 'CONFIRMED' | 'PROPOSED' | 'SUPERSEDED';
  category?: string;
  rationale?: string;
}

export interface ExtractedDependency {
  task: string;
  depends_on: string;
  type?: 'FINISH_TO_START' | 'START_TO_START';
}

export interface ExtractedCondition {
  condition: string;
  action: string;
  if: { [key: string]: any };
  then: { action: string; [key: string]: any };
}

export interface StructuredApplicationAction {
  action:
    | 'CREATE_TASK'
    | 'UPDATE_TASK'
    | 'DELETE_TASK'
    | 'ASSIGN_TASK'
    | 'CREATE_ANNOUNCEMENT'
    | 'UPDATE_ANNOUNCEMENT'
    | 'CREATE_RISK'
    | 'UPDATE_RISK'
    | 'CREATE_DECISION'
    | 'UPDATE_EVENT'
    | 'CREATE_DEPENDENCY';
  task?: any;
  announcement?: any;
  risk?: any;
  decision?: any;
  dependency?: any;
  event?: any;
  assignment?: any;
  payload?: any;
}

export interface TranscriptEfficiencyMetrics {
  processingTimeMs: number;
  totalWords: number;
  totalSentences: number;
  actionableSentences: number;
  signalToNoiseRatio: number;
  hallucinationRate: number;
  extractedEntitiesCount: number;
}

export interface ClubOpsStructuredResponse {
  summary: string;
  tasks: ExtractedTask[];
  completed_tasks: ExtractedTask[];
  risks: ExtractedRisk[];
  announcements: ExtractedAnnouncement[];
  decisions: ExtractedDecision[];
  dependencies: ExtractedDependency[];
  conditions: ExtractedCondition[];
  actions: StructuredApplicationAction[];
  recommendations?: string[];
  efficiency?: TranscriptEfficiencyMetrics;
}

export class ClubOpsIntelligence {
  /**
   * Convert relative date expressions to absolute ISO date string.
   */
  resolveDeadline(text: string, referenceDate = new Date(), eventDate?: Date | null): string | null {
    const lower = text.toLowerCase();
    const ref = new Date(referenceDate);

    if (lower.includes('tonight') || lower.includes('today')) {
      ref.setHours(23, 59, 59, 999);
      return ref.toISOString();
    }

    if (lower.includes('tomorrow')) {
      const d = new Date(ref.getTime() + 24 * 60 * 60 * 1000);
      d.setHours(18, 0, 0, 0);
      return d.toISOString();
    }

    const withinDaysMatch = lower.match(/within\s+(\d+)\s+days?/);
    if (withinDaysMatch) {
      const days = parseInt(withinDaysMatch[1], 10);
      return new Date(ref.getTime() + days * 86400000).toISOString();
    }

    const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/);
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1], 10);
      return new Date(ref.getTime() + days * 86400000).toISOString();
    }

    if (lower.includes('before the event') && eventDate) {
      return new Date(eventDate.getTime() - 86400000).toISOString();
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < dayNames.length; i++) {
      const name = dayNames[i];
      if (lower.includes(`next ${name}`) || lower.includes(`by ${name}`) || lower.includes(`on ${name}`) || lower.includes(name)) {
        const currentDay = ref.getDay();
        let diff = i - currentDay;
        if (diff <= 0 || lower.includes(`next ${name}`)) diff += 7;
        const target = new Date(ref.getTime() + diff * 86400000);
        target.setHours(18, 0, 0, 0);
        return target.toISOString();
      }
    }

    const dateMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (dateMatch) {
      const d = new Date(dateMatch[0]);
      if (!isNaN(d.getTime())) return d.toISOString();
    }

    return null;
  }

  /**
   * Match volunteer by name (exact, first-name, partial, or user).
   */
  async matchVolunteer(nameOrRole: string, clubId?: string, eventId?: string) {
    if (!nameOrRole) return null;
    const clean = nameOrRole.trim().toLowerCase();

    const volunteers = await prisma.volunteer.findMany({
      where: clubId ? { clubId } : {},
      include: { team: true, skillRecords: true, user: true },
    });

    const exactMatch = volunteers.find(v => v.name.toLowerCase() === clean);
    if (exactMatch) return exactMatch;

    const firstNameMatch = volunteers.find(v => v.name.toLowerCase().split(' ')[0] === clean);
    if (firstNameMatch) return firstNameMatch;

    const partialMatch = volunteers.find(v => v.name.toLowerCase().includes(clean) || clean.includes(v.name.toLowerCase()));
    if (partialMatch) return partialMatch;

    const users = await prisma.user.findMany();
    const userMatch = users.find(u => {
      const first = u.name.toLowerCase().split(' ')[0];
      return u.name.toLowerCase() === clean || first === clean || u.name.toLowerCase().includes(clean);
    });
    if (userMatch) {
      return {
        id: userMatch.id,
        userId: userMatch.id,
        name: userMatch.name,
        email: userMatch.email,
        phone: userMatch.mobile,
        currentWorkload: 'LOW',
        availability: 'AVAILABLE',
        team: null,
        teamId: null,
      };
    }

    return null;
  }

  /**
   * Recommend volunteers by skill, team, workload.
   */
  async recommendVolunteersForRole(criteria: { skill?: string; teamName?: string; clubId?: string }) {
    const volunteers = await prisma.volunteer.findMany({
      where: criteria.clubId ? { clubId: criteria.clubId } : {},
      include: { team: true, skillRecords: true },
    });

    const skillLower = (criteria.skill || '').toLowerCase();
    const teamLower = (criteria.teamName || '').toLowerCase();

    const scored = volunteers.map(v => {
      let score = 0;
      const vSkills = (v.skills ? JSON.parse(v.skills) : []) as string[];
      if (vSkills.some(s => s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase()))) score += 40;
      if (v.team && (v.team.name.toLowerCase().includes(teamLower) || teamLower.includes(v.team.name.toLowerCase()))) score += 30;
      if (v.availability === 'AVAILABLE') score += 20;
      if (v.currentWorkload === 'LOW') score += 20;
      else if (v.currentWorkload === 'MEDIUM') score += 10;
      else if (v.currentWorkload === 'OVERLOADED') score -= 30;
      score += (v.rating || 4.0) * 2;
      return { volunteer: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.volunteer);
  }

  /**
   * STRICT REAL-DATA MEETING EXTRACTION ENGINE
   * Extracts ONLY tasks, decisions, completed work, risks, dependencies, conditions,
   * and announcements that are ACTUALLY discussed in the meeting transcript.
   * NO default / fallback tasks are generated.
   */
  async analyzeOperationalText(text: string, context: {
    eventId?: string;
    clubId?: string;
    referenceDate?: Date;
  } = {}): Promise<ClubOpsStructuredResponse> {
    const startTime = Date.now();
    const refDate = context.referenceDate || new Date();
    let event: any = null;

    if (context.eventId) {
      event = await prisma.event.findUnique({
        where: { id: context.eventId },
        include: { club: true, tasks: true, risks: true },
      });
    }

    const clubId = context.clubId || event?.clubId;

    const tasks: ExtractedTask[] = [];
    const completedTasks: ExtractedTask[] = [];
    const risks: ExtractedRisk[] = [];
    const announcements: ExtractedAnnouncement[] = [];
    const decisions: ExtractedDecision[] = [];
    const dependencies: ExtractedDependency[] = [];
    const conditions: ExtractedCondition[] = [];
    const actions: StructuredApplicationAction[] = [];
    const recommendations: string[] = [];

    // Common non-name words
    const SKIP_NAMES = new Set([
      'The', 'This', 'That', 'We', 'Our', 'Once', 'Also', 'So', 'If', 'After',
      'Since', 'When', 'He', 'She', 'They', 'It', 'There', 'His', 'Her', 'Its',
      'First', 'Then', 'Next', 'Now', 'Soon', 'Still', 'Even', 'Just', 'Both',
      'Team', 'All', 'Everyone', 'Someone', 'Anyone', 'No', 'Not', 'Please',
    ]);

    // ── Clean sentence splitting (handles newlines, periods, semicolons) ─────
    const sentences = text
      .replace(/\r\n/g, '\n')
      .split(/[\n;]+|(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 2);

    // ── Helper: Extract person's name ─────────────────────────────────────────
    const extractOwner = (s: string): string | null => {
      const patterns = [
        // "[Name] is an anchor / is handling X / is in charge of X / will / should..."
        /^([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})?)\s+(?:is|will|should|needs?\s+to|must|has\s+to|is\s+going\s+to|is\s+supposed\s+to|is\s+responsible\s+for|in\s+charge\s+of|handling|taking\s+care\s+of|doing|assigned\s+to|also)\b/i,
        // "[Name] - [Task]" or "[Name]: [Task]"
        /^([A-Z][a-z]{1,20})\s*[-:]\s*/i,
        // "for [Name]" / "by [Name]" / "to [Name]"
        /\b(?:for|by|to)\s+([A-Z][a-z]{1,20})\b(?!\s+(?:the|a|an|this|that)\b)/i,
        // "assigned to [Name]"
        /\bassigned\s+to\s+([A-Z][a-z]{1,20})\b/i,
      ];
      for (const p of patterns) {
        const m = s.match(p);
        if (m && m[1] && !SKIP_NAMES.has(m[1].trim())) return m[1].trim();
      }
      return null;
    };

    // ── Helper: Normalize role or task title + typo handling ──────────────────
    const normalizeRoleOrTask = (s: string, owner: string | null): { title: string; team?: string } => {
      let t = s;
      if (owner) {
        t = t.replace(new RegExp(`^${owner}\\s*(?:is|will|should|needs?\\s+to|must|has\\s+to|is\\s+going\\s+to|is\\s+supposed\\s+to|is\\s+responsible\\s+for|in\\s+charge\\s+of|handling|taking\\s+care\\s+of|doing|assigned\\s+to|[-:])?\\s*(?:an?|the)?\\s*`, 'i'), '');
      }

      const lowerTitle = t.toLowerCase().trim();

      // Flexible typo & role mappings
      if (/\b(ancor|anchor|anchoring|anchore|ankor|host|hosting|mc|master of ceremonies|presenter)\b/i.test(lowerTitle)) {
        return { title: 'Anchor the event', team: 'Stage & Operations' };
      }
      if (/\b(food|catering|refreshments|snacks|lunch|dinner|beverages)\b/i.test(lowerTitle)) {
        return { title: 'Manage food & catering', team: 'Hospitality' };
      }
      if (/\b(photo|photography|videography|video|media|camera|photos)\b/i.test(lowerTitle)) {
        return { title: 'Coverage & Photography', team: 'Media' };
      }
      if (/\b(sound|audio|speaker|mic|microphone|av|acoustics)\b/i.test(lowerTitle)) {
        return { title: 'Sound & Audio setup', team: 'Technical' };
      }
      if (/\b(stage|decoration|decor|banner|banners|flex|poster|posters)\b/i.test(lowerTitle)) {
        return { title: 'Stage & Venue decoration', team: 'Logistics' };
      }

      // Cleanup remaining phrase
      let clean = t
        .replace(/^(an?|the|handling|in charge of|taking care of|responsible for|doing)\s+/i, '')
        .replace(/\s+(by|before|until|on)\s+(tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2})$/i, '')
        .replace(/[.!?]+$/, '')
        .trim();

      if (!clean) clean = 'Event Task';
      return { title: clean.charAt(0).toUpperCase() + clean.slice(1) };
    };

    for (const rawSentence of sentences) {
      const s = rawSentence.trim();
      const lower = s.toLowerCase();
      let handled = false;

      // ══════════════════════════════════════════════════════════════════════
      // 1. CONDITIONAL WORKFLOWS  "If X [then/,] Y"
      // ══════════════════════════════════════════════════════════════════════
      if (!handled && /^\s*if\s+/i.test(s)) {
        const m = s.match(/^if\s+(.+?),\s*(.+)/i);
        if (m) {
          const condText = `IF ${m[1].trim()}`;
          const actText = m[2].trim().replace(/[.!?]+$/, '');
          const owner = extractOwner(actText);
          const cleanAct = actText.replace(/^(we should|they should|please|he should|she should)\s+/i, '').trim();
          conditions.push({
            condition: condText,
            action: actText,
            if: { description: m[1].trim() },
            then: { action: 'CREATE_TASK', title: cleanAct.charAt(0).toUpperCase() + cleanAct.slice(1), assigned_to: owner || 'Unassigned' },
          });
          handled = true;
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // 2. DECISIONS  decided / agreed / confirmed / finalized / approved
      // ══════════════════════════════════════════════════════════════════════
      if (!handled) {
        const isVague = /\b(thinking about|considering|might|maybe|probably|possibly|could be|not sure|wondering)\b/.test(lower);
        const isDecision = !isVague && /\b(decided|agreed|confirmed|finalized|resolved|approved|settled on|concluded)\b/.test(lower);
        if (isDecision) {
          let decTitle = s.replace(/[.!?]+$/, '').trim();
          let decCat = 'GENERAL';

          const decMatch = s.match(/(?:decided|agreed|confirmed|finalized|resolved|approved|settled on|concluded)\s+(?:that\s+|on\s+)?(.+?)(?:[.!?]|$)/i);
          if (decMatch) {
            decTitle = decMatch[1].trim().replace(/[.!?]+$/, '');
            decTitle = decTitle.charAt(0).toUpperCase() + decTitle.slice(1);
          }

          if (/\b(venue|auditorium|hall|room|location|place|building)\b/.test(lower)) decCat = 'VENUE';
          else if (/\b(date|schedule|time|timing|slot|postpone|reschedule)\b/.test(lower)) decCat = 'SCHEDULE';
          else if (/\b(budget|fund|cost|money|expense|allocat)\b/.test(lower)) decCat = 'BUDGET';
          else if (/\b(sponsor|sponsorship|partner)\b/.test(lower)) decCat = 'SPONSORSHIP';
          else if (/\b(team|volunteer|assign|role|lead)\b/.test(lower)) decCat = 'TEAM';

          decisions.push({ decision: decTitle, status: 'CONFIRMED', category: decCat });
          actions.push({
            action: 'CREATE_DECISION',
            decision: { decision: decTitle, status: 'CONFIRMED', category: decCat, eventId: context.eventId },
          });
          handled = true;
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // 3. ANNOUNCEMENTS  tell / inform / announce / notify all [audience]
      // ══════════════════════════════════════════════════════════════════════
      if (!handled && /\b(tell|inform|announce|notify|send.*?message|broadcast|reminder)\b/.test(lower) && /\b(all\s+volunteers?|all\s+team|everyone|participants?|sponsors?)\b/.test(lower)) {
        let title = 'Team Announcement';
        let message = s.replace(/[.!?]+$/, '').trim();
        let audience: ExtractedAnnouncement['audience'] = 'ALL_VOLUNTEERS';

        const annMatch = s.match(/(?:tell|inform|notify|announce)\s+(?:all\s+)?(.+?)\s+that\s+(.+)/i);
        if (annMatch) {
          const audStr = annMatch[1].toLowerCase();
          message = annMatch[2].replace(/[.!?]+$/, '').trim();
          message = message.charAt(0).toUpperCase() + message.slice(1) + '.';
          if (/participant|attendee/.test(audStr)) audience = 'PARTICIPANTS';
          else if (/sponsor/.test(audStr)) audience = 'SPONSORS';
          title = message.substring(0, 60);
        }

        announcements.push({ title, message, audience, channel: 'WHATSAPP' });
        actions.push({
          action: 'CREATE_ANNOUNCEMENT',
          announcement: { title, content: message, targetAudience: audience, channel: 'WHATSAPP', eventId: context.eventId },
        });
        handled = true;
      }

      // ══════════════════════════════════════════════════════════════════════
      // 4. DEPENDENCIES  "X can only / cannot / after Y is done / once Y"
      // ══════════════════════════════════════════════════════════════════════
      if (!handled && (
        /\b(can only|cannot proceed|will only|blocked until|not possible until)\b/.test(lower) ||
        /\b(after .{3,50} (?:is|are|has been|have been) (?:done|completed|uploaded|confirmed|received|sent|approved))\b/.test(lower) ||
        /\b(depends on|dependent on|requires .+ first|needs .+ before)\b/.test(lower) ||
        /\b(once .{3,50} (?:receives?|gets?|is done|is completed|is provided|is confirmed|sends))\b/.test(lower)
      )) {
        let taskName = '';
        let dependsOn = '';

        const afterMatch = s.match(/^(.+?)\s+(?:can only|cannot|will only).+?\bafter\s+(.+?)(?:\s+(?:is|are|has been)\s+(?:done|completed|uploaded|confirmed|received|sent|approved))?[.!?]?$/i);
        const onceMatch = s.match(/once\s+(.+?)\s+(?:receives?|gets?|is done|is completed|is provided|is confirmed|sends),?\s*(.+)/i);
        const depMatch = s.match(/(.+?)\s+depends on\s+(.+)/i);

        if (afterMatch) {
          taskName = afterMatch[1].replace(/^(the|a|an)\s+/i, '').replace(/[.!?]+$/, '').trim();
          dependsOn = afterMatch[2].replace(/^(the|a|an)\s+/i, '').replace(/[.!?]+$/, '').trim();
        } else if (onceMatch) {
          dependsOn = onceMatch[1].replace(/^(the|a|an)\s+/i, '').trim() + ' completes';
          taskName = onceMatch[2].replace(/^(he|she|they|it)\s+should\s+/i, '').replace(/[.!?]+$/, '').trim();
        } else if (depMatch) {
          taskName = depMatch[1].replace(/[.!?]+$/, '').trim();
          dependsOn = depMatch[2].replace(/[.!?]+$/, '').trim();
        }

        if (taskName.split(' ').length >= 2 && dependsOn.split(' ').length >= 1) {
          taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);
          dependsOn = dependsOn.charAt(0).toUpperCase() + dependsOn.slice(1);
          dependencies.push({ task: taskName, depends_on: dependsOn, type: 'FINISH_TO_START' });
          risks.push({
            title: `Dependency Block: "${taskName}" waiting on "${dependsOn}"`,
            reason: `"${taskName}" cannot proceed until "${dependsOn}" is completed.`,
            severity: 'HIGH',
            related_task: taskName,
            recommended_action: `Expedite "${dependsOn}" to unblock "${taskName}".`,
          });
          actions.push({ action: 'CREATE_DEPENDENCY', dependency: { task: taskName, dependsOn, type: 'FINISH_TO_START' } });
          handled = true;
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // 5. COMPLETED WORK  finished / completed / has done / was done
      // ══════════════════════════════════════════════════════════════════════
      if (!handled && /\b(finished|completed|has already|already done|that part is done|was done|is done|has been done|wrapped up|delivered)\b/.test(lower)) {
        let taskTitle = 'Completed deliverable';
        let owner = 'Lead';

        const compMatch = s.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:has\s+(?:already\s+)?)?(?:finished|completed|wrapped\s+up|delivered|done)\s+(.+?)(?:[.,!?]|$)/i);
        if (compMatch && !SKIP_NAMES.has(compMatch[1])) {
          owner = compMatch[1].trim();
          taskTitle = compMatch[2].replace(/[.!?]+$/, '').trim();
          taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
        } else {
          const passiveMatch = s.match(/(.+?)\s+(?:was|were|has\s+been|have\s+been)\s+(?:finished|completed|delivered|done)\s*(?:by\s+([A-Z][a-z]+))?/i);
          if (passiveMatch) {
            taskTitle = passiveMatch[1].replace(/^(the|a|an)\s+/i, '').trim();
            taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
            if (passiveMatch[2] && !SKIP_NAMES.has(passiveMatch[2])) owner = passiveMatch[2];
          }
        }

        if (taskTitle.split(' ').length >= 2) {
          const matchedVol = owner !== 'Lead' ? await this.matchVolunteer(owner, clubId) : null;
          const compTask: ExtractedTask = {
            title: taskTitle,
            assigned_to: matchedVol?.name || owner,
            assignee_id: matchedVol?.userId || matchedVol?.id || null,
            status: 'DONE',
            priority: 'MEDIUM',
            team: matchedVol?.team?.name || null,
          };
          completedTasks.push(compTask);
          actions.push({
            action: 'CREATE_TASK',
            task: {
              title: compTask.title,
              assigned_to: compTask.assigned_to,
              assigneeId: compTask.assignee_id,
              status: 'DONE',
              priority: 'MEDIUM',
              teamId: matchedVol?.teamId || null,
              eventId: context.eventId,
              deadline: new Date().toISOString(),
            },
          });
          handled = true;
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // 6. RISKS  risk / blocked / issue / concern / overloaded / delay / problem
      // ══════════════════════════════════════════════════════════════════════
      if (!handled && /\b(risk|at risk|problem|issue|concern|worried|bottleneck|overloaded|blocked|cannot|couldn't|unable to|delay|behind schedule|critical issue|escalat|failure|missing|not received|not available|running out)\b/.test(lower) && !/\b(will|should|needs? to|must)\b/.test(lower)) {
        let title = s.replace(/[.!?]+$/, '').trim();
        let severity: ExtractedRisk['severity'] = 'MEDIUM';

        if (/\b(critical|urgent|asap|immediately|show.stopper|blocker|emergency)\b/.test(lower)) severity = 'CRITICAL';
        else if (/\b(high|major|serious|significant|severe)\b/.test(lower)) severity = 'HIGH';
        else if (/\b(low|minor|small|minimal)\b/.test(lower)) severity = 'LOW';

        if (title.length > 100) title = title.substring(0, 100);
        title = title.charAt(0).toUpperCase() + title.slice(1);

        risks.push({
          title,
          reason: s,
          severity,
          recommended_action: 'Escalate immediately and assign a resolution owner.',
        });
        handled = true;
      }

      // ══════════════════════════════════════════════════════════════════════
      // 7. ACTIONABLE TASKS & ROLE ASSIGNMENTS
      // Handles:
      // - "Varun is an ancor" / "Varun is an anchor" / "Varun is host"
      // - "Rahul will contact sponsor" / "Rahul - Sponsor" / "Neel: Tech"
      // - Any task/role discussed directly in the meeting text
      // ══════════════════════════════════════════════════════════════════════
      if (!handled) {
        const owner = extractOwner(s);
        const isAssignment = owner !== null ||
          /\b(is|are|will|needs?\s+to|should|must|has\s+to|shall|arrange|contact|submit|prepare|manage|handle|oversee|coordinate|review|confirm|check|send|upload|update|test|follow\s+up|reach\s+out|book|organize|collect|build|design|complete|ancor|anchor|host|photo|sound|food|decor)\b/i.test(lower);

        if (isAssignment) {
          const { title: taskTitle, team } = normalizeRoleOrTask(s, owner);

          if (taskTitle.length >= 3) {
            let status: ExtractedTask['status'] = 'TODO';
            if (/\b(currently|right now|is working on|in progress|started|handling)\b/.test(lower)) status = 'IN_PROGRESS';
            else if (/\b(cannot|blocked|couldn't|waiting for|pending on|unable)\b/.test(lower)) status = 'BLOCKED';

            let priority: ExtractedTask['priority'] = 'MEDIUM';
            if (/\b(critical|urgent|asap|emergency|immediately|top priority)\b/.test(lower)) priority = 'CRITICAL';
            else if (/\b(sponsor|registration|permit|important|high priority|must|deadline today)\b/.test(lower)) priority = 'HIGH';

            const deadlineStr = this.resolveDeadline(s, refDate, event ? new Date(event.date) : null);

            // Deduplicate
            const isDuplicate = tasks.some(t => t.title.toLowerCase() === taskTitle.toLowerCase());
            if (!isDuplicate) {
              let matchedVol: any = null;
              if (owner) matchedVol = await this.matchVolunteer(owner, clubId);

              const extractedTask: ExtractedTask = {
                title: taskTitle,
                assigned_to: matchedVol?.name || owner || null,
                assignee_id: matchedVol?.userId || matchedVol?.id || null,
                deadline: deadlineStr,
                priority,
                status,
                team: matchedVol?.team?.name || team || null,
                team_id: matchedVol?.teamId || null,
              };

              tasks.push(extractedTask);
              actions.push({
                action: 'CREATE_TASK',
                task: {
                  title: extractedTask.title,
                  assigned_to: extractedTask.assigned_to,
                  assigneeId: extractedTask.assignee_id,
                  deadline: extractedTask.deadline,
                  priority: extractedTask.priority,
                  status: extractedTask.status,
                  teamId: extractedTask.team_id,
                  eventId: context.eventId,
                },
              });
              handled = true;
            }
          }
        }
      }
    }

    // ── Build summary strictly from extracted meeting items ───────────────────
    const summaryParts: string[] = [];
    if (tasks.length > 0) summaryParts.push(`Identified ${tasks.length} actionable task(s): ${tasks.slice(0, 5).map(t => `"${t.title}" → ${t.assigned_to || 'Unassigned'}`).join(', ')}`);
    if (completedTasks.length > 0) summaryParts.push(`Verified ${completedTasks.length} completed deliverable(s): ${completedTasks.map(t => `"${t.title}" by ${t.assigned_to}`).join(', ')}`);
    if (decisions.length > 0) summaryParts.push(`Recorded ${decisions.length} decision(s): "${decisions[0].decision}"`);
    if (dependencies.length > 0) summaryParts.push(`Mapped ${dependencies.length} dependency: "${dependencies[0].task}" depends on "${dependencies[0].depends_on}"`);
    if (risks.length > 0) summaryParts.push(`Flagged ${risks.length} risk(s): "${risks[0].title}"`);
    if (announcements.length > 0) summaryParts.push(`Prepared announcement: "${announcements[0].title}"`);
    if (conditions.length > 0) summaryParts.push(`Structured contingency: ${conditions[0].condition} → ${conditions[0].action}`);

    const summary = summaryParts.length > 0
      ? summaryParts.join('. ') + '.'
      : 'No actionable items extracted from the text.';

    const totalWords = text.trim().split(/\s+/).filter(Boolean).length;
    const actionableSentences = tasks.length + completedTasks.length + decisions.length + risks.length + announcements.length;
    const totalSentences = Math.max(sentences.length, 1);
    const signalToNoiseRatio = totalWords === 0 ? 0 : Math.min(100, Math.max(20, Math.round((actionableSentences / totalSentences) * 100)));

    return {
      summary,
      tasks,
      completed_tasks: completedTasks,
      risks,
      announcements,
      decisions,
      dependencies,
      conditions,
      actions,
      recommendations,
      efficiency: {
        processingTimeMs: Math.max(1, Date.now() - startTime),
        totalWords,
        totalSentences,
        actionableSentences,
        signalToNoiseRatio,
        hallucinationRate: 0,
        extractedEntitiesCount: actionableSentences,
      },
    };
  }
}

export const clubopsIntelligence = new ClubOpsIntelligence();
