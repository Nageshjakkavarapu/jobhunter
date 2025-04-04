import { 
  users, type User, type InsertUser, 
  jobs, type Job, type InsertJob,
  applications, type Application, type InsertApplication,
  categories, type Category, type InsertCategory
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Job operations
  getJobs(filters?: {
    search?: string;
    location?: string;
    category?: string;
    jobType?: string[];
    experienceLevel?: string[];
    datePosted?: string;
    salaryRange?: string;
  }): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  getJobsByEmployer(employerId: number): Promise<Job[]>;
  
  // Application operations
  getApplicationsByJob(jobId: number): Promise<Application[]>;
  getApplicationsByUser(userId: number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: string): Promise<Application | undefined>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  incrementCategoryJobCount(id: number): Promise<Category | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobs: Map<number, Job>;
  private applications: Map<number, Application>;
  private categories: Map<number, Category>;
  private userIdCounter: number;
  private jobIdCounter: number;
  private applicationIdCounter: number;
  private categoryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.jobs = new Map();
    this.applications = new Map();
    this.categories = new Map();
    this.userIdCounter = 1;
    this.jobIdCounter = 1;
    this.applicationIdCounter = 1;
    this.categoryIdCounter = 1;

    // Initialize with some categories
    this.initializeCategories();
  }

  private initializeCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: 'Technology', icon: 'fa-laptop-code', jobCount: 1245 },
      { name: 'Business', icon: 'fa-chart-line', jobCount: 879 },
      { name: 'Design', icon: 'fa-paint-brush', jobCount: 623 },
      { name: 'Marketing', icon: 'fa-bullhorn', jobCount: 542 },
      { name: 'Healthcare', icon: 'fa-heartbeat', jobCount: 1032 },
      { name: 'Education', icon: 'fa-graduation-cap', jobCount: 478 },
      { name: 'Legal', icon: 'fa-gavel', jobCount: 326 },
      { name: 'Hospitality', icon: 'fa-utensils', jobCount: 587 },
    ];

    defaultCategories.forEach(category => {
      this.createCategory(category);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Job operations
  async getJobs(filters?: {
    search?: string;
    location?: string;
    category?: string;
    jobType?: string[];
    experienceLevel?: string[];
    datePosted?: string;
    salaryRange?: string;
  }): Promise<Job[]> {
    let jobs = Array.from(this.jobs.values());

    if (filters) {
      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(searchTerm) || 
          job.company.toLowerCase().includes(searchTerm) ||
          job.description.toLowerCase().includes(searchTerm)
        );
      }

      // Filter by location
      if (filters.location) {
        const locationTerm = filters.location.toLowerCase();
        jobs = jobs.filter(job => 
          job.location.toLowerCase().includes(locationTerm)
        );
      }

      // Filter by category
      if (filters.category) {
        jobs = jobs.filter(job => job.category === filters.category);
      }

      // Filter by job type
      if (filters.jobType && filters.jobType.length > 0) {
        jobs = jobs.filter(job => filters.jobType?.includes(job.jobType));
      }

      // Filter by experience level
      if (filters.experienceLevel && filters.experienceLevel.length > 0) {
        jobs = jobs.filter(job => filters.experienceLevel?.includes(job.experienceLevel));
      }

      // Filter by date posted
      if (filters.datePosted) {
        const now = new Date();
        const jobDate = new Date(now);

        switch (filters.datePosted) {
          case 'last24h':
            jobDate.setDate(now.getDate() - 1);
            jobs = jobs.filter(job => new Date(job.postedDate) >= jobDate);
            break;
          case 'last3d':
            jobDate.setDate(now.getDate() - 3);
            jobs = jobs.filter(job => new Date(job.postedDate) >= jobDate);
            break;
          case 'last7d':
            jobDate.setDate(now.getDate() - 7);
            jobs = jobs.filter(job => new Date(job.postedDate) >= jobDate);
            break;
          case 'last14d':
            jobDate.setDate(now.getDate() - 14);
            jobs = jobs.filter(job => new Date(job.postedDate) >= jobDate);
            break;
          // 'all' or default, return all jobs
        }
      }

      // Filter by salary range
      if (filters.salaryRange) {
        const minSalary = parseInt(filters.salaryRange.replace(/[^\d]/g, ''));
        jobs = jobs.filter(job => {
          if (!job.salary) return false;
          
          // Extract the minimum salary from the range (e.g., "$50,000 - $70,000" -> 50000)
          const match = job.salary.match(/\$(\d{1,3}(,\d{3})*)/);
          if (!match) return false;
          
          const jobMinSalary = parseInt(match[1].replace(/,/g, ''));
          return jobMinSalary >= minSalary;
        });
      }
    }

    // Sort by most recent
    jobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    
    return jobs;
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const newJob: Job = { ...job, id };
    this.jobs.set(id, newJob);
    
    // Increment job count for the category
    const category = Array.from(this.categories.values()).find(
      (cat) => cat.name === job.category
    );
    
    if (category) {
      this.incrementCategoryJobCount(category.id);
    }
    
    return newJob;
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.employerId === employerId
    );
  }

  // Application operations
  async getApplicationsByJob(jobId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.jobId === jobId
    );
  }

  async getApplicationsByUser(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (application) => application.userId === userId
    );
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const newApplication: Application = { ...application, id };
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async updateApplicationStatus(id: number, status: string): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication: Application = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async incrementCategoryJobCount(id: number): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { 
      ...category, 
      jobCount: category.jobCount + 1 
    };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
}

export const storage = new MemStorage();
