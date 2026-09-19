import { prisma } from '../../db/prisma.js';

export class DocumentsService {
  async createDocument(data: {
    clubId: string;
    eventId?: string;
    title: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    category: string;
    summary?: string;
    content?: string;
  }) {
    const doc = await prisma.document.create({
      data: {
        clubId: data.clubId,
        eventId: data.eventId || null,
        title: data.title,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        category: data.category,
        summary: data.summary,
        content: data.content,
        chunks: {
          create: [
            {
              content: data.content || data.summary || data.title,
              pageNumber: 1,
            },
          ],
        },
      },
      include: { chunks: true },
    });

    return doc;
  }

  async getClubDocuments(clubId: string, category?: string) {
    const where: any = { clubId };
    if (category) where.category = category;

    return await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { id: true, name: true } },
      },
    });
  }

  async deleteDocument(documentId: string) {
    return await prisma.document.delete({ where: { id: documentId } });
  }
}

export const documentsService = new DocumentsService();
