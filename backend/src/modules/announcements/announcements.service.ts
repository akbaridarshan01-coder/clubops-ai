import nodemailer from 'nodemailer';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { realtimeHub } from '../../realtime/socket.js';

export class AnnouncementsService {
  async getAnnouncements(eventId: string) {
    return await prisma.announcement.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private getEmailTransporter() {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      return null;
    }

    const isGmail = env.SMTP_HOST.toLowerCase().includes('gmail') || env.SMTP_USER.toLowerCase().includes('gmail.com');
    return isGmail
      ? nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        })
      : nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });
  }

  async createAnnouncement(data: {
    eventId: string;
    title: string;
    channel: string;
    content: string;
    targetAudience?: string;
  }) {
    // 1. Store announcement in database
    const announcement = await prisma.announcement.create({
      data: {
        eventId: data.eventId,
        title: data.title,
        channel: data.channel,
        content: data.content,
        targetAudience: data.targetAudience || 'ALL',
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // 2. Fetch event & club details
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      include: {
        club: true,
      },
    });

    const eventName = event?.name || 'Club Event';
    const clubName = event?.club?.name || 'Club';

    // 3. Find recipients based on target audience
    let volunteerRecipients: { name: string; email: string; phone?: string | null }[] = [];

    const audience = (data.targetAudience || 'ALL').toUpperCase();

    // If target audience is VOLUNTEERS or ALL / ALL PARTICIPANTS, get event volunteers
    const volunteers = await prisma.volunteer.findMany({
      where: {
        OR: [
          { eventId: data.eventId },
          { clubId: event?.clubId, eventId: null },
        ],
      },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    volunteerRecipients = volunteers.filter(v => Boolean(v.email));

    // Also get club members/users if audience is ALL or GENERAL
    if (audience.includes('ALL') || audience.includes('PARTICIPANTS') || audience.includes('CAMPUS')) {
      const clubMembers = await prisma.clubMember.findMany({
        where: { clubId: event?.clubId },
        include: { user: { select: { name: true, email: true, mobile: true } } },
      });
      for (const m of clubMembers) {
        if (m.user?.email && !volunteerRecipients.some(v => v.email.toLowerCase() === m.user.email.toLowerCase())) {
          volunteerRecipients.push({
            name: m.user.name,
            email: m.user.email,
            phone: m.user.mobile,
          });
        }
      }
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: string[] = [];

    // 4. Send real emails if channel is EMAIL or if user requested broadcast
    if (data.channel === 'EMAIL' || data.channel === 'WHATSAPP') {
      const transporter = this.getEmailTransporter();

      if (transporter && volunteerRecipients.length > 0) {
        const formattedHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 24px; background: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
            <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
              <span style="font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1px;">${clubName} &bull; ${eventName}</span>
              <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 8px 0 4px 0;">${data.title}</h2>
              <span style="font-size: 12px; color: #94a3b8;">Official Volunteer Broadcast</span>
            </div>

            <div style="background: #131b2e; border: 1px solid #28354f; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <div style="font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">${data.content}</div>
            </div>

            <div style="border-top: 1px solid #1e293b; padding-top: 14px; font-size: 11px; color: #64748b; text-align: center;">
              Dispatched via <strong>ClubOps AI</strong> for <strong>${eventName}</strong> &bull; Please do not reply directly to this automated email.
            </div>
          </div>
        `;

        for (const recipient of volunteerRecipients) {
          try {
            await transporter.sendMail({
              from: env.SMTP_FROM,
              to: recipient.email,
              subject: `[${eventName}] ${data.title}`,
              text: `${data.title}\n\n${data.content}\n\n--\n${clubName} - ${eventName}\nPowered by ClubOps AI`,
              html: formattedHtml,
            });
            emailsSent++;
          } catch (err: any) {
            emailsFailed++;
            errors.push(`${recipient.email}: ${err.message}`);
          }
        }
      }
    }

    // 5. Broadcast in real time via WebSocket
    realtimeHub.broadcastToEvent(data.eventId, {
      type: 'ANNOUNCEMENT_BROADCAST',
      payload: {
        ...announcement,
        emailsSent,
        recipientCount: volunteerRecipients.length,
      },
    });

    return {
      ...announcement,
      deliverySummary: {
        totalRecipients: volunteerRecipients.length,
        emailsSent,
        emailsFailed,
        errors: errors.slice(0, 3),
      },
    };
  }
}

export const announcementsService = new AnnouncementsService();
