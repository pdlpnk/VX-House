export interface StateMachine<TState extends string> {
  readonly initial: TState;
  readonly transitions: Readonly<Record<TState, readonly TState[]>>;
}

export function canTransition<TState extends string>(
  machine: StateMachine<TState>,
  from: TState,
  to: TState,
): boolean {
  return machine.transitions[from]?.includes(to) ?? false;
}

export function assertTransition<TState extends string>(
  machine: StateMachine<TState>,
  from: TState,
  to: TState,
): void {
  if (!canTransition(machine, from, to)) {
    throw new Error(`Transition ${from} -> ${to} is not allowed`);
  }
}

export const accountStateMachine = {
  initial: "PENDING",
  transitions: {
    PENDING: ["ACTIVE", "SUSPENDED", "CLOSED"],
    ACTIVE: ["SUSPENDED", "CLOSED"],
    SUSPENDED: ["ACTIVE", "CLOSED"],
    CLOSED: [],
  },
} as const satisfies StateMachine<"PENDING" | "ACTIVE" | "SUSPENDED" | "CLOSED">;

export const publicationStateMachine = {
  initial: "DRAFT",
  transitions: {
    DRAFT: ["IN_REVIEW", "ARCHIVED"],
    IN_REVIEW: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    PUBLISHED: ["HIDDEN", "ARCHIVED"],
    HIDDEN: ["PUBLISHED", "ARCHIVED"],
    ARCHIVED: [],
  },
} as const satisfies StateMachine<"DRAFT" | "IN_REVIEW" | "PUBLISHED" | "HIDDEN" | "ARCHIVED">;

export const taskStateMachine = {
  initial: "AVAILABLE",
  transitions: {
    AVAILABLE: ["ACCEPTED", "EXPIRED", "CANCELLED"],
    ACCEPTED: ["IN_PROGRESS", "EXPIRED", "CANCELLED"],
    IN_PROGRESS: ["AWAITING_SUBMISSION", "EXPIRED", "CANCELLED"],
    AWAITING_SUBMISSION: ["SUBMITTED", "IN_PROGRESS", "EXPIRED", "CANCELLED"],
    SUBMITTED: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["CLARIFICATION_REQUIRED", "RESUBMISSION_REQUIRED", "CONFIRMED", "REJECTED"],
    CLARIFICATION_REQUIRED: ["UNDER_REVIEW", "RESUBMISSION_REQUIRED", "REJECTED"],
    RESUBMISSION_REQUIRED: ["AWAITING_SUBMISSION", "CANCELLED", "EXPIRED"],
    CONFIRMED: [],
    REJECTED: [],
    EXPIRED: [],
    CANCELLED: [],
  },
} as const satisfies StateMachine<
  | "AVAILABLE"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "AWAITING_SUBMISSION"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CLARIFICATION_REQUIRED"
  | "RESUBMISSION_REQUIRED"
  | "CONFIRMED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED"
>;

export const submissionStateMachine = {
  initial: "DRAFT",
  transitions: {
    DRAFT: ["SUBMITTED", "WITHDRAWN"],
    SUBMITTED: [],
    WITHDRAWN: [],
  },
} as const satisfies StateMachine<"DRAFT" | "SUBMITTED" | "WITHDRAWN">;

export const reviewStateMachine = {
  initial: "PENDING",
  transitions: {
    PENDING: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["CLARIFICATION_REQUIRED", "RESUBMISSION_REQUIRED", "CONFIRMED", "REJECTED"],
    CLARIFICATION_REQUIRED: ["UNDER_REVIEW", "RESUBMISSION_REQUIRED", "REJECTED"],
    RESUBMISSION_REQUIRED: [],
    CONFIRMED: [],
    REJECTED: [],
  },
} as const satisfies StateMachine<
  "PENDING" | "UNDER_REVIEW" | "CLARIFICATION_REQUIRED" | "RESUBMISSION_REQUIRED" | "CONFIRMED" | "REJECTED"
>;

export const rewardStateMachine = {
  initial: "EXPECTED",
  transitions: {
    EXPECTED: ["AWAITING_CONFIRMATION", "CANCELLED", "EXPIRED"],
    AWAITING_CONFIRMATION: ["CONFIRMED", "REJECTED", "CANCELLED", "EXPIRED"],
    CONFIRMED: ["PREPARING", "AVAILABLE", "PROVIDED", "CANCELLED", "EXPIRED"],
    PREPARING: ["AVAILABLE", "PROVIDED", "CANCELLED", "EXPIRED"],
    AVAILABLE: ["PROVIDED", "CANCELLED", "EXPIRED"],
    PROVIDED: [],
    REJECTED: [],
    CANCELLED: [],
    EXPIRED: [],
  },
} as const satisfies StateMachine<
  | "EXPECTED"
  | "AWAITING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "AVAILABLE"
  | "PROVIDED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
>;

export const supportStateMachine = {
  initial: "CREATED",
  transitions: {
    CREATED: ["ASSIGNED", "CLOSED"],
    ASSIGNED: ["WAITING_OPERATOR", "WAITING_USER", "RESOLVED", "CLOSED"],
    WAITING_OPERATOR: ["WAITING_USER", "RESOLVED", "CLOSED"],
    WAITING_USER: ["WAITING_OPERATOR", "RESOLVED", "CLOSED"],
    RESOLVED: ["WAITING_OPERATOR", "WAITING_USER", "CLOSED"],
    CLOSED: ["ASSIGNED"],
  },
} as const satisfies StateMachine<
  "CREATED" | "ASSIGNED" | "WAITING_OPERATOR" | "WAITING_USER" | "RESOLVED" | "CLOSED"
>;

export const appealStateMachine = {
  initial: "DRAFT",
  transitions: {
    DRAFT: ["SUBMITTED", "CANCELLED"],
    SUBMITTED: ["UNDER_REVIEW", "CANCELLED"],
    UNDER_REVIEW: ["UPHELD", "PARTIALLY_UPHELD", "DENIED"],
    UPHELD: [],
    PARTIALLY_UPHELD: [],
    DENIED: [],
    CANCELLED: [],
  },
} as const satisfies StateMachine<
  "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "UPHELD" | "PARTIALLY_UPHELD" | "DENIED" | "CANCELLED"
>;

export const forecastStateMachine = {
  initial: "DRAFT",
  transitions: {
    DRAFT: ["IN_REVIEW", "ARCHIVED"],
    IN_REVIEW: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    PUBLISHED: ["SUPERSEDED", "RETRACTED", "ARCHIVED"],
    SUPERSEDED: ["ARCHIVED"],
    RETRACTED: ["ARCHIVED"],
    ARCHIVED: [],
  },
} as const satisfies StateMachine<
  "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "SUPERSEDED" | "RETRACTED" | "ARCHIVED"
>;
