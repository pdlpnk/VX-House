export type OpportunityAvailability = "AVAILABLE" | "UNAVAILABLE" | "PENDING";

export type InstructionStepView = {
  id: string;
  position: number;
  title: string;
  body: string;
  required: boolean;
  warning: string | null;
};

export type InstructionSectionView = {
  id: string;
  position: number;
  title: string;
  body: string;
};

export type InstructionView = {
  id: string;
  version: number;
  title: string;
  summary: string;
  language: "RU" | "TR" | "AZ";
  sections: InstructionSectionView[];
  steps: InstructionStepView[];
};

export type TaskVersionView = {
  id: string;
  definitionId: string;
  version: number;
  title: string;
  summary: string;
  requirements: string[];
  limitations: string[];
  resultRequirements: string[];
  reviewWindowMinutes: number | null;
  availableUntil: string | null;
  completionDeadline: string | null;
  resubmissionPolicy: string;
  instruction: InstructionView | null;
};

export type OpportunityView = {
  id: string;
  key: string;
  type: "TASK" | "INSTRUCTION" | "PROMOCODE" | "FORECAST" | "PERSONAL_CONDITION";
  title: string;
  description: string;
  nextStep: string;
  role: "PLAYER" | "PARTNER";
  market: { code: "TR" | "AZ"; name: string };
  availability: OpportunityAvailability;
  availabilityReason: string;
  task: TaskVersionView | null;
  instruction: InstructionView | null;
};

export type SubmissionVersionView = {
  id: string;
  version: number;
  status: "DRAFT" | "SUBMITTED" | "WITHDRAWN";
  payload: { comment: string; reference: string };
  createdAt: string;
  submittedAt: string | null;
};

export type UserTaskView = {
  id: string;
  status: "AVAILABLE" | "ACCEPTED" | "IN_PROGRESS" | "AWAITING_SUBMISSION" | "SUBMITTED" | "UNDER_REVIEW" | "CLARIFICATION_REQUIRED" | "RESUBMISSION_REQUIRED" | "CONFIRMED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  attemptNumber: number;
  acceptedAt: string | null;
  startedAt: string | null;
  task: TaskVersionView;
  opportunityId: string;
  submissions: SubmissionVersionView[];
  history: { id: string; fromStatus: UserTaskView["status"] | null; toStatus: UserTaskView["status"]; reason: string; occurredAt: string }[];
  review: { decision: string; reason: string; comment: string | null; decidedAt: string } | null;
};

export type OpportunityCatalogQuery = {
  search?: string;
  type?: OpportunityView["type"];
  availability?: OpportunityAvailability;
};
