import { Request, Response } from 'express';
import { tasksService } from './tasks.service.js';

export class TasksController {
  async getTasks(req: Request, res: Response) {
    try {
      const eventId = req.query.eventId as string;
      if (!eventId) return res.status(400).json({ error: 'eventId query parameter is required.' });

      const filters = {
        teamId: req.query.teamId as string | undefined,
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        assigneeId: req.query.assigneeId as string | undefined,
      };

      const tasks = await tasksService.getTasks(eventId, filters);
      return res.json(tasks);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async createTask(req: Request, res: Response) {
    try {
      const { eventId, title, description, teamId, assigneeId, priority, deadline, estimatedHours, riskLevel, tags } = req.body;
      if (!eventId || !title || !deadline) {
        return res.status(400).json({ error: 'eventId, title, and deadline are required.' });
      }

      const task = await tasksService.createTask(eventId, {
        title,
        description,
        teamId,
        assigneeId,
        priority,
        deadline,
        estimatedHours,
        riskLevel,
        tags,
      });

      return res.status(201).json(task);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const taskId = req.params.id;
      const updated = await tasksService.updateTask(taskId, req.body);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const taskId = req.params.id;
      const result = await tasksService.deleteTask(taskId);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async addDependency(req: Request, res: Response) {
    try {
      const taskId = req.params.id;
      const { dependsOnTaskId, type } = req.body;
      if (!dependsOnTaskId) {
        return res.status(400).json({ error: 'dependsOnTaskId is required.' });
      }

      const dep = await tasksService.addDependency(taskId, dependsOnTaskId, type);
      return res.status(201).json(dep);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async removeDependency(req: Request, res: Response) {
    try {
      const taskId = req.params.id;
      const dependsOnTaskId = req.params.dependsOnTaskId;
      const result = await tasksService.removeDependency(taskId, dependsOnTaskId);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async assignTask(req: Request, res: Response) {
    try {
      const taskId = req.params.id;
      const { assigneeId } = req.body;
      const updated = await tasksService.assignTask(taskId, assigneeId);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const tasksController = new TasksController();
