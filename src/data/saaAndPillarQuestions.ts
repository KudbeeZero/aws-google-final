import { VerifiedQuestion } from "../types/workforce";

export const SEED_VERIFIED_QUESTIONS: VerifiedQuestion[] = [
  // ============================================
  // CLF-C02 — ALL 6 AWS WELL-ARCHITECTED PILLARS
  // ============================================
  {
    id: "seed-clf-opex-1",
    externalKey: "seed-clf-opex-1",
    certTrack: "CLF-C02",
    domainId: "cloud-concepts",
    pillar: "operational_excellence",
    difficulty: "foundation",
    scenario:
      "A startup wants every infrastructure update across dev, staging, and production to be version-controlled, repeatable, and rolled back cleanly in minutes if a release fails. Which AWS Well-Architected Operational Excellence practice and service best satisfies this requirement?",
    options: [
      "Provision environments manually via the AWS Management Console with written checklists",
      "Perform operations as code using AWS CloudFormation templates stored in version control",
      "Create Amazon EC2 AMIs weekly and copy them manually across AWS Regions",
      "Use AWS Cost Explorer to audit infrastructure deployment changes",
    ],
    correctIndex: 1,
    explanation:
      "Operational Excellence emphasizes performing operations as code and making frequent, small, reversible changes. AWS CloudFormation defines infrastructure declaratively so environments stay identical and roll back automatically on error.",
    trapNote: "Manual checklists and AMI snapshots violate the Operations as Code design principle.",
    audioScript:
      "Operational Excellence starts with Operations as Code. Whenever a question asks for repeatable, version-controlled, reversible infrastructure deployments, choose AWS CloudFormation over manual console checklists.",
    aiReviewScore: 96,
    aiReviewNotes: "Verified against AWS Well-Architected Operational Excellence Pillar and CLF-C02 Domain 1.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 142,
    correctCount: 118,
  },
  {
    id: "seed-clf-sec-1",
    externalKey: "seed-clf-sec-1",
    certTrack: "CLF-C02",
    domainId: "security-compliance",
    pillar: "security",
    difficulty: "foundation",
    scenario:
      "An e-commerce company notices automated bots attempting SQL injection and cross-site scripting against its public Amazon CloudFront distribution. Which AWS service should they attach directly to CloudFront to inspect and block Layer 7 HTTP attack patterns?",
    options: [
      "AWS Shield Standard",
      "Amazon GuardDuty",
      "AWS WAF (Web Application Firewall)",
      "Amazon Inspector",
    ],
    correctIndex: 2,
    explanation:
      "AWS WAF operates at Layer 7 (HTTP/HTTPS) and integrates with CloudFront, Application Load Balancer, and API Gateway to block SQL injection, XSS, and custom IP or rate-based rules.",
    trapNote: "Shield defends against volumetric DDoS (Layers 3/4), while GuardDuty detects threats asynchronously rather than inline-blocking SQLi.",
    audioScript:
      "For Security Pillar Layer 7 attacks like SQL injection or cross-site scripting on CloudFront or an ALB, always pick AWS WAF. Shield is for DDoS, and GuardDuty is for threat detection.",
    aiReviewScore: 98,
    aiReviewNotes: "High-yield CLF-C02 Domain 2 Security Pillar distractor question verified.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 215,
    correctCount: 171,
  },
  {
    id: "seed-clf-rel-1",
    externalKey: "seed-clf-rel-1",
    certTrack: "CLF-C02",
    domainId: "cloud-technology",
    pillar: "reliability",
    difficulty: "foundation",
    scenario:
      "A hospital scheduling application runs on Amazon EC2 and Amazon RDS. Management requires the application to survive the sudden outage of an entire data center facility with automatic failover and zero manual intervention. What architecture meets this Reliability Pillar goal?",
    options: [
      "Deploy EC2 in a single Availability Zone with nightly EBS snapshots",
      "Deploy EC2 across multiple Availability Zones behind an Application Load Balancer with Amazon RDS Multi-AZ",
      "Use a single larger EC2 instance type with vertical scaling",
      "Store application logs in Amazon S3 Glacier Deep Archive",
    ],
    correctIndex: 1,
    explanation:
      "Each Availability Zone consists of isolated data centers with independent power and networking. Combining Multi-AZ EC2 + ALB + RDS Multi-AZ ensures automatic failover if one facility goes offline.",
    trapNote: "Vertical scaling removes no single point of failure; nightly snapshots do not provide automatic failover.",
    audioScript:
      "Reliability means designing for failure across isolated facilities. Pair Multi-AZ EC2 behind a load balancer with Amazon RDS Multi-AZ for automatic failover with zero manual steps.",
    aiReviewScore: 97,
    aiReviewNotes: "Core Multi-AZ Reliability Pillar blueprint verified for CLF-C02.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 189,
    correctCount: 162,
  },
  {
    id: "seed-clf-perf-1",
    externalKey: "seed-clf-perf-1",
    certTrack: "CLF-C02",
    domainId: "cloud-technology",
    pillar: "performance_efficiency",
    difficulty: "foundation",
    scenario:
      "A media publisher serves high-resolution images and video thumbnails stored in Amazon S3 in us-east-1 to readers across Tokyo, London, and Sydney. How can they dramatically reduce latency globally without duplicating their entire backend stack?",
    options: [
      "Move the S3 bucket to us-west-2",
      "Place Amazon CloudFront in front of the Amazon S3 bucket to cache content at global Edge Locations",
      "Enable Amazon S3 Versioning on the bucket",
      "Use AWS Direct Connect from the publisher's office",
    ],
    correctIndex: 1,
    explanation:
      "Amazon CloudFront caches static and dynamic content across hundreds of global Edge Locations close to end users, aligning directly with the Performance Efficiency principle 'Go global in minutes'.",
    trapNote: "Direct Connect connects an on-premises data center to AWS; it does not accelerate public internet end-user downloads globally.",
    audioScript:
      "When global users need fast static content from S3, Amazon CloudFront is the Performance Efficiency answer. Edge Locations cache files right next to readers in Tokyo, London, and Sydney.",
    aiReviewScore: 96,
    aiReviewNotes: "Verified Performance Efficiency global edge caching pattern.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 164,
    correctCount: 145,
  },
  {
    id: "seed-clf-cost-1",
    externalKey: "seed-clf-cost-1",
    certTrack: "CLF-C02",
    domainId: "billing-pricing",
    pillar: "cost_optimization",
    difficulty: "foundation",
    scenario:
      "A finance team wants an automated email and SNS alert BEFORE monthly AWS spend exceeds $1,500—including alerts based on forecasted spend—rather than inspecting bills after the month ends. Which tool should they configure?",
    options: [
      "AWS Cost Explorer",
      "AWS Budgets",
      "AWS Pricing Calculator",
      "AWS Trusted Advisor",
    ],
    correctIndex: 1,
    explanation:
      "AWS Budgets provides proactive threshold and forecast-based alerts via email and Amazon SNS, and can even trigger automated budget actions.",
    trapNote: "Cost Explorer visualizes historical and forecasted charts, while Pricing Calculator estimates hypothetical pre-deployment costs.",
    audioScript:
      "PennyWise rule of thumb: if you hear alert, threshold, or notification before you overspend, pick AWS Budgets. Cost Explorer is for visual charts, and Pricing Calculator is for pre-launch estimates.",
    aiReviewScore: 99,
    aiReviewNotes: "Classic CLF-C02 Domain 4 Cost Optimization trap verified.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 230,
    correctCount: 184,
  },
  {
    id: "seed-clf-sust-1",
    externalKey: "seed-clf-sust-1",
    certTrack: "CLF-C02",
    domainId: "cloud-concepts",
    pillar: "sustainability",
    difficulty: "foundation",
    scenario:
      "Under the AWS Sustainability Pillar and Shared Responsibility Model for Sustainability, which action is the CUSTOMER's responsibility to shrink the carbon footprint of their workloads?",
    options: [
      "Sourcing renewable energy and optimizing data center water cooling efficiency",
      "Right-sizing workloads, adopting AWS Graviton processors, and scaling down idle resources",
      "Recycling decommissioned physical server hardware inside AWS Availability Zones",
      "Designing energy-efficient power distribution units for AWS Regions",
    ],
    correctIndex: 1,
    explanation:
      "AWS is responsible for Sustainability OF the cloud (renewable power, building cooling, hardware lifecycle). Customers are responsible for Sustainability IN the cloud (efficient code, Graviton chips, managed serverless, eliminating idle capacity).",
    trapNote: "Watch the OF vs IN distinction—cooling, solar/wind sourcing, and physical hardware disposal belong strictly to AWS.",
    audioScript:
      "Sustainability follows the Shared Responsibility Model too. AWS handles renewable power and data center cooling, while you optimize Sustainability IN the cloud by right-sizing, using Graviton processors, and turning off idle servers.",
    aiReviewScore: 97,
    aiReviewNotes: "High-value Sustainability Pillar question frequently tested on CLF-C02.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 128,
    correctCount: 101,
  },

  // ============================================
  // SAA-C03 — SOLUTIONS ARCHITECT ASSOCIATE
  // ============================================
  {
    id: "seed-saa-sec-1",
    externalKey: "seed-saa-sec-1",
    certTrack: "SAA-C03",
    domainId: "saa-secure",
    pillar: "security",
    difficulty: "associate",
    scenario:
      "A healthcare SaaS backend runs on EC2 instances inside private subnets with no internet gateway attached. The instances must read and write encrypted files in Amazon S3 without traffic ever traversing the public internet or incurring NAT Gateway data processing charges. What should the Solutions Architect configure?",
    options: [
      "Attach an Internet Gateway and restrict traffic using a Network ACL",
      "Create an Amazon S3 Gateway VPC Endpoint and update the private subnet route table",
      "Route all private subnet traffic through a NAT Gateway in a public subnet",
      "Configure VPC Peering between the VPC and the public S3 IP range",
    ],
    correctIndex: 1,
    explanation:
      "An S3 Gateway VPC Endpoint keeps traffic completely inside the Amazon private network, requires zero NAT Gateway hourly or per-GB charges, and is completely free to provision.",
    trapNote: "NAT Gateways route over the public internet and charge per GB processed; Interface Endpoints cost hourly unless PrivateLink from on-prem is required.",
    audioScript:
      "In SAA-C03, private subnets talking to S3 or DynamoDB with zero NAT Gateway charges almost always means a Gateway VPC Endpoint. It is free, private, and configured straight in the subnet route table.",
    aiReviewScore: 98,
    aiReviewNotes: "Flagship SAA-C03 Domain 1 Secure Architecture + Cost Optimization overlap.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 176,
    correctCount: 132,
  },
  {
    id: "seed-saa-sec-2",
    externalKey: "seed-saa-sec-2",
    certTrack: "SAA-C03",
    domainId: "saa-secure",
    pillar: "security",
    difficulty: "challenge",
    scenario:
      "A regulated fintech workload requires automatic 30-day rotation of Amazon Aurora PostgreSQL database credentials with zero hardcoded passwords in application code and minimal operational overhead. Which combination should you architect?",
    options: [
      "Store encrypted passwords in AWS Systems Manager Parameter Store Standard tier with a custom cron job on EC2",
      "Store database credentials in AWS Secrets Manager with automatic rotation enabled and grant the EC2 IAM role read access",
      "Store database passwords inside S3 encrypted with SSE-S3 and download them at boot",
      "Bake the database password into an encrypted Amazon Machine Image (AMI)",
    ],
    correctIndex: 1,
    explanation:
      "AWS Secrets Manager integrates natively with Amazon Aurora/RDS for zero-downtime automated credential rotation via managed Lambda rotation functions, paired cleanly with IAM roles.",
    trapNote: "Parameter Store does not include built-in turnkey RDS credential rotation without writing and maintaining custom automation.",
    audioScript:
      "Whenever SAA-C03 mentions automatic database password rotation with minimal operational overhead, Guardian points directly to AWS Secrets Manager paired with an IAM role.",
    aiReviewScore: 97,
    aiReviewNotes: "Verified SAA-C03 Secrets Manager vs Parameter Store differentiator.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 151,
    correctCount: 115,
  },
  {
    id: "seed-saa-rel-1",
    externalKey: "seed-saa-rel-1",
    certTrack: "SAA-C03",
    domainId: "saa-resilient",
    pillar: "reliability",
    difficulty: "associate",
    scenario:
      "An order-processing API experiences sudden 10x traffic spikes during flash sales. Downstream fulfillment workers can only process 200 orders per second and crash when called synchronously, causing lost orders. How should you decouple this architecture for maximum resilience?",
    options: [
      "Place an Amazon SQS queue between the API tier and an Auto Scaling Group of fulfillment workers scaling on ApproximateNumberOfMessagesVisible",
      "Increase the timeout on the Application Load Balancer to 15 minutes",
      "Switch the API from HTTPS to UDP to drop excess packets",
      "Add Amazon CloudFront in front of the fulfillment database",
    ],
    correctIndex: 0,
    explanation:
      "Decoupling with Amazon SQS buffers burst traffic durably so no orders are lost, while Auto Scaling on queue depth matches worker capacity cleanly to real backlog demand.",
    trapNote: "Raising ALB timeouts does not absorb sustained spikes and exhausts client connections.",
    audioScript:
      "Spiky traffic crashing downstream workers is the textbook SAA-C03 decoupling pattern. Drop an Amazon SQS queue in the middle and scale your worker Auto Scaling Group based on visible queue depth.",
    aiReviewScore: 98,
    aiReviewNotes: "Core SAA-C03 Domain 2 Resilient Architecture decoupling blueprint.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 192,
    correctCount: 158,
  },
  {
    id: "seed-saa-rel-2",
    externalKey: "seed-saa-rel-2",
    certTrack: "SAA-C03",
    domainId: "saa-resilient",
    pillar: "reliability",
    difficulty: "challenge",
    scenario:
      "A global banking platform requires an active-active multi-Region disaster recovery posture with an RPO of under 1 second and RTO under 1 minute for its PostgreSQL-compatible database. Which AWS database capability meets this SLA?",
    options: [
      "Amazon RDS PostgreSQL Multi-AZ in a single Region with automated daily backups",
      "Amazon Aurora Global Database with fast cross-Region storage-level replication and managed failover",
      "Amazon S3 Cross-Region Replication of pg_dump files every hour",
      "Pilot Light EC2 instances running self-managed PostgreSQL with asynchronous EBS snapshots",
    ],
    correctIndex: 1,
    explanation:
      "Amazon Aurora Global Database replicates storage across AWS Regions with typical lag under 1 second and enables cross-Region disaster recovery promotion in under 1 minute.",
    trapNote: "Standard RDS Multi-AZ only protects within one Region; hourly backups violate a sub-second RPO.",
    audioScript:
      "Sub-second cross-Region RPO and under-one-minute RTO for relational data is the signature capability of Amazon Aurora Global Database.",
    aiReviewScore: 96,
    aiReviewNotes: "Verified SAA-C03 multi-Region DR SLA question.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 134,
    correctCount: 98,
  },
  {
    id: "seed-saa-perf-1",
    externalKey: "seed-saa-perf-1",
    certTrack: "SAA-C03",
    domainId: "saa-performant",
    pillar: "performance_efficiency",
    difficulty: "associate",
    scenario:
      "A leaderboard microservice uses Amazon DynamoDB and serves 50,000 read requests per second for the same top-100 player records, experiencing single-digit millisecond latency but needing microsecond read speed with minimal application code changes. What should you deploy?",
    options: [
      "Amazon ElastiCache for Memcached with custom cache invalidation logic",
      "Amazon DynamoDB Accelerator (DAX) in front of the DynamoDB table",
      "Amazon RDS Read Replicas in three Availability Zones",
      "Amazon S3 Transfer Acceleration",
    ],
    correctIndex: 1,
    explanation:
      "DAX is an API-compatible, fully managed in-memory cache purpose-built for DynamoDB that cuts read latency from milliseconds to microseconds with minimal code refactoring.",
    trapNote: "ElastiCache requires explicit cache-aside code changes and invalidation logic; DAX is drop-in API-compatible for DynamoDB.",
    audioScript:
      "Need microsecond reads on DynamoDB with minimal code changes? EcoScale recommends DynamoDB Accelerator—DAX—because it is API-compatible right out of the box.",
    aiReviewScore: 97,
    aiReviewNotes: "Verified SAA-C03 Domain 3 caching differentiator (DAX vs ElastiCache).",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 168,
    correctCount: 137,
  },
  {
    id: "seed-saa-perf-2",
    externalKey: "seed-saa-perf-2",
    certTrack: "SAA-C03",
    domainId: "saa-performant",
    pillar: "performance_efficiency",
    difficulty: "challenge",
    scenario:
      "A real-time multiplayer gaming backend requires deterministic, low-jitter TCP/UDP routing for players worldwide connecting to regional Application Load Balancers, plus two static Anycast IP addresses that clients can allowlist. Which service fits best?",
    options: [
      "Amazon CloudFront",
      "AWS Global Accelerator",
      "Amazon Route 53 Simple Routing",
      "AWS Transit Gateway",
    ],
    correctIndex: 1,
    explanation:
      "AWS Global Accelerator provides two static Anycast IP addresses and routes both TCP and UDP traffic over the AWS global backbone to the healthiest optimal regional endpoint.",
    trapNote: "CloudFront optimizes HTTP/HTTPS cacheable web content; it does not support non-HTTP UDP gaming protocols with static Anycast IPs.",
    audioScript:
      "Static Anycast IPs plus non-HTTP TCP or UDP global acceleration always point to AWS Global Accelerator, whereas CloudFront is for cacheable HTTP web content.",
    aiReviewScore: 98,
    aiReviewNotes: "Verified SAA-C03 Global Accelerator vs CloudFront networking pattern.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 147,
    correctCount: 112,
  },
  {
    id: "seed-saa-cost-1",
    externalKey: "seed-saa-cost-1",
    certTrack: "SAA-C03",
    domainId: "saa-cost",
    pillar: "cost_optimization",
    difficulty: "associate",
    scenario:
      "A genomics lab stores 400 TB of research datasets in Amazon S3. Access patterns are completely unpredictable—some datasets are queried heavily for two weeks, then untouched for months, then suddenly accessed again with zero retrieval delay tolerance. What is the most cost-effective storage class with zero operational overhead?",
    options: [
      "Amazon S3 Standard-Infrequent Access (S3 Standard-IA)",
      "Amazon S3 Intelligent-Tiering",
      "Amazon S3 Glacier Flexible Retrieval",
      "Amazon S3 Glacier Deep Archive",
    ],
    correctIndex: 1,
    explanation:
      "S3 Intelligent-Tiering automatically monitors access patterns and moves objects between Frequent, Infrequent, and Archive Instant Access tiers with no retrieval fees and no millisecond performance penalty.",
    trapNote: "Glacier Flexible Retrieval and Deep Archive introduce minutes-to-hours restore delays; S3 Standard-IA charges retrieval fees when accessed frequently.",
    audioScript:
      "Whenever you read unpredictable or unknown access patterns with instant retrieval required in S3, PennyWise picks Amazon S3 Intelligent-Tiering every single time.",
    aiReviewScore: 99,
    aiReviewNotes: "High-frequency SAA-C03 Domain 4 S3 storage optimization question.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 204,
    correctCount: 175,
  },
  {
    id: "seed-saa-cost-2",
    externalKey: "seed-saa-cost-2",
    certTrack: "SAA-C03",
    domainId: "saa-cost",
    pillar: "cost_optimization",
    difficulty: "challenge",
    scenario:
      "A video rendering pipeline runs stateless containerized jobs on Amazon ECS that checkpoint progress every 60 seconds and can tolerate interruption without losing work. How can the architect cut compute costs by up to 70–90%?",
    options: [
      "Use Dedicated Hosts for all ECS tasks",
      "Run ECS tasks using AWS Fargate Spot or EC2 Spot Instances with mixed-instance diversification",
      "Purchase Standard 3-Year Reserved Instances for burst rendering peaks",
      "Run all rendering sequentially on a single On-Demand instance",
    ],
    correctIndex: 1,
    explanation:
      "Fault-tolerant, checkpointed, interruptible batch and container rendering workloads are the ideal match for Spot capacity, saving up to 90% over On-Demand pricing.",
    trapNote: "Dedicated Hosts are for bring-your-own-license compliance and are the most expensive compute option.",
    audioScript:
      "Stateless, checkpointed, interruptible batch jobs are pure Spot territory. Combine Fargate Spot or diversified EC2 Spot fleets to slash rendering spend by up to ninety percent.",
    aiReviewScore: 96,
    aiReviewNotes: "Verified SAA-C03 Spot compute FinOps scenario.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 158,
    correctCount: 134,
  },
  {
    id: "seed-saa-opex-1",
    externalKey: "seed-saa-opex-1",
    certTrack: "SAA-C03",
    domainId: "saa-resilient",
    pillar: "operational_excellence",
    difficulty: "associate",
    scenario:
      "An enterprise manages 45 AWS accounts via AWS Organizations and needs continuous compliance auditing that detects whenever any S3 bucket becomes publicly readable and automatically remediates the bucket policy. Which service provides this Operational Excellence guardrail?",
    options: [
      "Amazon CloudWatch Logs Insights",
      "AWS Config with Managed Rules and Systems Manager Automation remediation",
      "AWS CloudTrail Insights alone",
      "AWS Trusted Advisor free tier",
    ],
    correctIndex: 1,
    explanation:
      "AWS Config continuously records configuration state changes, evaluates compliance against rules like s3-bucket-public-read-prohibited, and triggers AWS Systems Manager Automation to auto-remediate drift.",
    trapNote: "CloudTrail records who made an API call (audit log), whereas AWS Config evaluates resource configuration state and triggers auto-remediation.",
    audioScript:
      "OpsPulse tip: CloudTrail answers who called an API, while AWS Config tracks resource configuration compliance over time and pairs with Systems Manager Automation for automatic remediation.",
    aiReviewScore: 97,
    aiReviewNotes: "Verified SAA-C03 CloudTrail vs Config operational governance differentiator.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 141,
    correctCount: 108,
  },
  {
    id: "seed-saa-sust-1",
    externalKey: "seed-saa-sust-1",
    certTrack: "SAA-C03",
    domainId: "saa-cost",
    pillar: "sustainability",
    difficulty: "associate",
    scenario:
      "A SaaS platform runs 120 Linux-based containerized microservices on x86 EC2 instances at 18% average CPU utilization. Management asks the Solutions Architect to simultaneously cut energy consumption, lower carbon impact, and reduce compute spend by ~35%. What is the highest-impact architecture move?",
    options: [
      "Migrate containers to AWS Graviton ARM-based instances with right-sized Auto Scaling or AWS Fargate on Graviton",
      "Keep x86 instances running 24/7 at 18% utilization and buy On-Demand Capacity Reservations",
      "Disable Auto Scaling so instance counts remain static",
      "Replicate every microservice into three unused AWS Regions",
    ],
    correctIndex: 0,
    explanation:
      "AWS Graviton processors deliver up to 60% less energy consumption for the same performance alongside up to 40% better price-performance, directly advancing both Sustainability and Cost Optimization Pillars.",
    trapNote: "Capacity Reservations reserve hardware without improving utilization or energy efficiency.",
    audioScript:
      "Graviton ARM processors are a double win for Sustainability and Cost Optimization—delivering up to sixty percent lower energy use and stronger price-performance when paired with right-sized Auto Scaling.",
    aiReviewScore: 96,
    aiReviewNotes: "Verified SAA-C03 Sustainability + Cost Optimization Graviton pattern.",
    reviewedByModel: "gemini-4-hydrogen",
    attemptCount: 119,
    correctCount: 101,
  },
];
