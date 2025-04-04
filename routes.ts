import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertJobSchema, insertApplicationSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const newUser = await storage.createUser(userData);
      return res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to retrieve user' });
    }
  });

  // Job routes
  app.get('/api/jobs', async (req: Request, res: Response) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        location: req.query.location as string | undefined,
        category: req.query.category as string | undefined,
        jobType: req.query.jobType ? (req.query.jobType as string).split(',') : undefined,
        experienceLevel: req.query.experienceLevel ? (req.query.experienceLevel as string).split(',') : undefined,
        datePosted: req.query.datePosted as string | undefined,
        salaryRange: req.query.salaryRange as string | undefined
      };
      
      const jobs = await storage.getJobs(filters);
      return res.json(jobs);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to retrieve jobs' });
    }
  });

  app.get('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      return res.json(job);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to retrieve job' });
    }
  });

  app.post('/api/jobs', async (req: Request, res: Response) => {
    try {
      const jobData = insertJobSchema.parse(req.body);
      
      // Set posted date to now if not provided
      if (!jobData.postedDate) {
        jobData.postedDate = new Date();
      }
      
      const newJob = await storage.createJob(jobData);
      return res.status(201).json(newJob);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: 'Failed to create job' });
    }
  });

  app.get('/api/employers/:id/jobs', async (req: Request, res: Response) => {
    try {
      const employerId = parseInt(req.params.id);
      const jobs = await storage.getJobsByEmployer(employerId);
      return res.json(jobs);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to retrieve employer jobs' });
    }
  });

  // Application routes
  app.post('/api/applications', async (req: Request, res: Response) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      
      // Set default status to 'applied' and application date to now if not provided
      if (!applicationData.status) {
        applicationData.status = 'applied';
      }
      
      if (!applicationData.appliedDate) {
        applicationData.appliedDate = new Date();
      }
      
      const newApplication = await storage.createApplication(applicationData);
      return res.status(201).json(newApplication);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: 'Failed to create application' });
    }
  });

  app.get('/api/jobs/:id/applications', async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const applications = await storage.getApplicationsByJob(jobId);
      return res.json(applications);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to retrieve job applications' });
    }
  });

  app.get('/api/users/:id/applications', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const applications = await storage.getApplicationsByUser(userId);
      return res.json(applications);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to retrieve user applications' });
    }
  });

  app.patch('/api/applications/:id/status', async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const updatedApplication = await storage.updateApplicationStatus(applicationId, status);
      
      if (!updatedApplication) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      return res.json(updatedApplication);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to update application status' });
    }
  });

  // Category routes
  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      return res.json(categories);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to retrieve categories' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
