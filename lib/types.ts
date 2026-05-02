export type Role = "team" | "client";

export type TaskStatus = "todo" | "in_progress" | "done" | "late";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  initials: string | null;
  avatar_color: string | null;
  job_title: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  logo_letter: string | null;
  logo_color: string | null;
  profile_id: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  overall_progress: number;
  target_date: string | null;
  created_at: string;
  client?: Client;
  members?: Profile[];
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  progress: number;
  color: string;
  order_index: number;
  created_at: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  assignee_id: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  assignee?: Profile;
  milestone?: Milestone;
  project?: Project;
}

export interface Update {
  id: string;
  project_id: string;
  title: string;
  color: string;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  sender_id: string | null;
  sender_name: string;
  sender_role: Role;
  content: string;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  profile_id: string;
  profile?: Profile;
}

export interface InternalMessage {
  id: string;
  project_id: string | null;
  sender_id: string | null;
  sender_name: string;
  recipient_id: string | null;
  content: string;
  created_at: string;
}

export type ProposalStatus = "draft" | "sent" | "viewed";

export interface Proposal {
  id: string;
  title: string;
  slug: string;
  html: string;
  client_id: string | null;
  status: ProposalStatus;
  view_count: number;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  client?: Pick<Client, "id" | "name" | "logo_color" | "logo_letter"> & { email?: string | null };
}

export interface ProposalSubmission {
  id: string;
  proposal_id: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  message: string | null;
  selected_template: string | null;
  selected_features: string[] | null;
  submitted_at: string;
}

export interface AiGeneratedTask {
  title: string;
  checkpoints: {
    title: string;
    assigneeId: string | null;
  }[];
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at">;
        Update: Partial<Omit<Client, "id" | "created_at">>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at">;
        Update: Partial<Omit<Project, "id" | "created_at">>;
      };
      milestones: {
        Row: Milestone;
        Insert: Omit<Milestone, "id" | "created_at">;
        Update: Partial<Omit<Milestone, "id" | "created_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at">;
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
      updates: {
        Row: Update;
        Insert: Omit<Update, "id" | "created_at">;
        Update: Partial<Omit<Update, "id" | "created_at">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at">;
        Update: Partial<Omit<Message, "id" | "created_at">>;
      };
      project_members: {
        Row: ProjectMember;
        Insert: ProjectMember;
        Update: Partial<ProjectMember>;
      };
      internal_messages: {
        Row: InternalMessage;
        Insert: Omit<InternalMessage, "id" | "created_at">;
        Update: Partial<Omit<InternalMessage, "id" | "created_at">>;
      };
      proposals: {
        Row: Proposal;
        Insert: Omit<Proposal, "id" | "created_at" | "view_count" | "client"> & { view_count?: number };
        Update: Partial<Omit<Proposal, "id" | "created_at" | "client">>;
      };
      proposal_submissions: {
        Row: ProposalSubmission;
        Insert: Omit<ProposalSubmission, "id" | "submitted_at">;
        Update: Partial<Omit<ProposalSubmission, "id" | "submitted_at">>;
      };
    };
  };
};
