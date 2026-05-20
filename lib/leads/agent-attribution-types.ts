export type LeadAgentRole = "referral" | "assigned" | "sourced";

export type LeadAgentPart = {
  userId: string;
  role: LeadAgentRole;
  name: string;
};

export type LeadAgentDisplay = {
  label: string | null;
  parts: LeadAgentPart[];
};

export type LeadPropertyAgents = {
  assigned_user_id: string | null;
  sourced_by_user_id: string | null;
  agent_name: string | null;
};

export type LeadForAgentAttribution = {
  attributed_agent_user_id: string | null;
  properties: LeadPropertyAgents | null;
};

export type LeadForAgentCount = LeadForAgentAttribution & {
  id: string;
};
