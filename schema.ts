import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  userType: text("user_type").notNull(), // employer or jobseeker
  companyName: text("company_name"),
  location: text("location"),
  bio: text("bio"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  userType: true,
  companyName: true,
  location: true,
  bio: true,
});

// Job model
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  salary: text("salary"),
  jobType: text("job_type").notNull(), // full-time, part-time, contract, etc.
  category: text("category").notNull(),
  experienceLevel: text("experience_level").notNull(), // entry, mid, senior
  skills: text("skills").array().notNull(),
  postedDate: timestamp("posted_date").notNull(),
  employerId: integer("employer_id").notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  title: true,
  company: true,
  location: true,
  description: true,
  requirements: true,
  salary: true,
  jobType: true,
  category: true,
  experienceLevel: true,
  skills: true,
  postedDate: true,
  employerId: true,
});

// Application model
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  resume: text("resume").notNull(),
  coverLetter: text("cover_letter"),
  status: text("status").notNull(), // applied, reviewed, interview, rejected, hired
  appliedDate: timestamp("applied_date").notNull(),
});

export const insertApplicationSchema = createInsertSchema(applications).pick({
  jobId: true,
  userId: true,
  name: true,
  email: true,
  phone: true,
  resume: true,
  coverLetter: true,
  status: true,
  appliedDate: true,
});

// Category model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  jobCount: integer("job_count").notNull().default(0),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  icon: true,
  jobCount: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
