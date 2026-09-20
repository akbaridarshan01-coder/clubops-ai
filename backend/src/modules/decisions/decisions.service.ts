import { prisma } from '../../db/prisma.js';
import { realtimeHub } from '../../realtime/socket.js';
import { v4 as uuidv4 } from 'uuid';

export interface DecisionRecord {
  id: string;
  eventId: string;
  meetingId?: string | null;
  decision: string;
  status: string; // CONFIRMED, PROPOSED, SUPERSEDED
  category?: string | null; // VENUE, BUDGET, SCHEDULE, GENERAL
  rationale?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class DecisionsService {
  private initialized = false;

  async initTable() {
    if (this.initialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Decision (
          id TEXT PRIMARY KEY,
          eventId TEXT NOT NULL,
          meetingId TEXT,
          decision TEXT NOT NULL,
          status TEXT DEFAULT 'CONFIRMED',
          category TEXT,
          rationale TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      this.initialized = true;
    } catch (err) {
      console.error('[DecisionsService] Failed to initialize table:', err);
    }
  }

  async getEventDecisions(eventId: string): Promise<DecisionRecord[]> {
    await this.initTable();
    const rows = await prisma.$queryRawUnsafe<DecisionRecord[]>(
      `SELECT * FROM Decision WHERE eventId = ? ORDER BY createdAt DESC`,
      eventId
    );
    return rows;
  }

  async createDecision(data: {
    eventId: string;
    meetingId?: string | null;
    decision: string;
    status?: string;
    category?: string | null;
    rationale?: string | null;
  }): Promise<DecisionRecord> {
    await this.initTable();
    const id = uuidv4();
    const status = data.status || 'CONFIRMED';
    const category = data.category || 'GENERAL';
    const rationale = data.rationale || null;
    const meetingId = data.meetingId || null;
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO Decision (id, eventId, meetingId, decision, status, category, rationale, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.eventId,
      meetingId,
      data.decision,
      status,
      category,
      rationale,
      now,
      now
    );

    const created: DecisionRecord = {
      id,
      eventId: data.eventId,
      meetingId,
      decision: data.decision,
      status,
      category,
      rationale,
      createdAt: now,
      updatedAt: now,
    };

    realtimeHub.broadcastToEvent(data.eventId, {
      type: 'DECISION_CREATED',
      payload: created,
    });

    return created;
  }

  async updateDecision(id: string, data: Partial<DecisionRecord>): Promise<DecisionRecord | null> {
    await this.initTable();
    const existing = await prisma.$queryRawUnsafe<DecisionRecord[]>(
      `SELECT * FROM Decision WHERE id = ?`,
      id
    );
    if (!existing || existing.length === 0) return null;

    const current = existing[0];
    const decision = data.decision ?? current.decision;
    const status = data.status ?? current.status;
    const category = data.category ?? current.category;
    const rationale = data.rationale ?? current.rationale;
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `UPDATE Decision SET decision = ?, status = ?, category = ?, rationale = ?, updatedAt = ? WHERE id = ?`,
      decision,
      status,
      category,
      rationale,
      now,
      id
    );

    const updated: DecisionRecord = {
      ...current,
      decision,
      status,
      category,
      rationale,
      updatedAt: now,
    };

    realtimeHub.broadcastToEvent(current.eventId, {
      type: 'DECISION_UPDATED',
      payload: updated,
    });

    return updated;
  }

  async deleteDecision(id: string): Promise<boolean> {
    await this.initTable();
    const existing = await prisma.$queryRawUnsafe<DecisionRecord[]>(
      `SELECT * FROM Decision WHERE id = ?`,
      id
    );
    if (!existing || existing.length === 0) return false;

    await prisma.$executeRawUnsafe(`DELETE FROM Decision WHERE id = ?`, id);
    realtimeHub.broadcastToEvent(existing[0].eventId, {
      type: 'DECISION_DELETED',
      payload: { id, eventId: existing[0].eventId },
    });
    return true;
  }
}

export const decisionsService = new DecisionsService();
