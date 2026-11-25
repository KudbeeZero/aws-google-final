export type SQSQueueType = "standard" | "fifo";

export type SQSEventType =
  | "quiz_fail"
  | "quiz_pass"
  | "trap_triggered"
  | "card_review"
  | "pillar_gap"
  | "burst_simulation";

export type SQSMessageStatus = "queued" | "in_flight" | "dead_letter" | "processed";

export interface SQSStudyMessage {
  id: string;
  messageId: string;
  queueType: SQSQueueType;
  eventType: SQSEventType;
  conceptKey: string;
  conceptTitle: string;
  pillarId: string;
  certTrack: "CLF-C02" | "SAA-C03";
  payload: {
    questionSnippet?: string;
    selectedAnswer?: string;
    correctAnswer?: string;
    distractorTrap?: string;
    pillar?: string;
    notes?: string;
    [key: string]: any;
  };
  status: SQSMessageStatus;
  receiveCount: number;
  maxReceiveCount: number;
  sentTimestamp: number;
  visibilityTimeoutUntil?: number | null;
  approximateLatencyMs: number;
  deadLetterReason?: string;
}

export interface SQSQueueMetrics {
  totalMessages: number;
  queuedCount: number;
  inFlightCount: number;
  deadLetterCount: number;
  processedCount: number;
  throughputPerSec: number;
  averageProcessingLatencyMs: number;
  activeWorkers: number;
  queueType: SQSQueueType;
  visibilityTimeoutSec: number;
}

export interface SocraticRemediationResult {
  conceptKey: string;
  conceptTitle: string;
  pillarId: string;
  rootCauseDiagnosis: string;
  analogy: string;
  architecturalPrescription: string;
  socraticCheckQuestion: {
    scenario: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  spokenAudioScript: string;
}
