import { DomainData, Flashcard, TrickQuestion, DistractorItem } from "./types";

export const domainsData: DomainData[] = [
  {
    id: "cloud-concepts",
    number: 1,
    name: "Cloud Concepts",
    subtitle: "The Architecture of Agility",
    overviewSummary: "Mastering the cloud value proposition, fundamental architectural principles, cloud economics, and the Shared Responsibility Model (20% of exam).",
    keyFrameworks: [
      {
        title: "Shared Responsibility Model",
        content: "AWS is responsible for security 'OF' the cloud (underlying hardware, global infrastructure, and software). The customer is responsible for security 'IN' the cloud (customer data, IAM roles, guest OS patching, firewall settings).",
      },
      {
        title: "AWS Well-Architected Framework",
        content: "Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability.",
      }
    ],
    keyServices: ["IAM", "EC2", "S3", "VPC", "CloudFront"]
  },
  {
    id: "security-compliance",
    number: 2,
    name: "Security & Compliance",
    subtitle: "The Shield of Least Privilege",
    overviewSummary: "Understanding security and access controls, data protection, security services, compliance tools, and active threat detection (30% of exam).",
    keyFrameworks: [
      {
        title: "Principle of Least Privilege",
        content: "Always grant users and applications only the absolute minimum permissions required to perform their required tasks.",
      }
    ],
    keyServices: ["IAM", "WAF", "Shield", "GuardDuty", "Inspector", "KMS", "Artifact"]
  },
  {
    id: "cloud-technology",
    number: 3,
    name: "Technology & Services",
    subtitle: "The Engine Room of the Cloud",
    overviewSummary: "Exploring key AWS compute, storage, database, networking, and application integration services (34% of exam).",
    keyFrameworks: [
      {
        title: "Serverless vs Server-Based",
        content: "Understanding standard computing (EC2 VM management) versus Serverless (AWS Lambda, Fargate) where AWS automatically scales and maintains resources.",
      }
    ],
    keyServices: ["EC2", "S3", "EBS", "EFS", "RDS", "DynamoDB", "Lambda", "Route 53", "ECS"]
  },
  {
    id: "billing-pricing",
    number: 4,
    name: "Billing & Pricing",
    subtitle: "The Ledger of Cost Optimization",
    overviewSummary: "Navigating AWS pricing models, cost management tools, support tiers, and consolidated billing (16% of exam).",
    keyFrameworks: [
      {
        title: "AWS Budgets vs Cost Explorer",
        content: "Proactive limits with alerts (Budgets) vs retrospective visual graphs and future trend forecasting (Cost Explorer).",
      }
    ],
    keyServices: ["Cost Explorer", "AWS Budgets", "Trusted Advisor", "Pricing Calculator"]
  }
];

export const initialFlashcards: Flashcard[] = [
  // Domain 1
  {
    id: "fc-1",
    domainId: "cloud-concepts",
    question: "Who is responsible for the physical security of AWS data centers?",
    answer: "AWS. This falls under Security 'OF' the Cloud, which includes hardware, physical facilities, and virtualization infrastructure."
  },
  {
    id: "fc-2",
    domainId: "cloud-concepts",
    question: "Is the customer responsible for patching the guest operating system on an Amazon EC2 instance?",
    answer: "Yes. This falls under Security 'IN' the Cloud because the customer owns and maintains the guest OS and any applications installed on it."
  },
  {
    id: "fc-3",
    domainId: "cloud-concepts",
    question: "What is 'elasticity' in cloud computing, and how does it differ from 'scalability'?",
    answer: "Scalability is the structural capacity to handle growth. Elasticity is the automatic matching of resource supply to real-time demand dynamically (scaling down when traffic drops to save cost)."
  },
  {
    id: "fc-4",
    domainId: "cloud-concepts",
    question: "What is the primary financial advantage of shifting from Capex to Opex in AWS?",
    answer: "Instead of paying upfront capital costs for physical data centers before using them (Capex), you pay only for what you consume dynamically (Opex), improving cash flow."
  },
  
  // Domain 2
  {
    id: "fc-5",
    domainId: "security-compliance",
    question: "Which AWS service provides on-demand downloads of official compliance reports and agreements?",
    answer: "AWS Artifact. It is the central, self-service repository for legal and compliance-related AWS audit documents."
  },
  {
    id: "fc-6",
    domainId: "security-compliance",
    question: "What is the primary difference between AWS WAF and AWS Shield?",
    answer: "AWS WAF filters web traffic to protect against application exploits (Layer 7 like SQLi/XSS). AWS Shield protects against massive DDoS attacks at network and transport layers (Layers 3 & 4)."
  },
  {
    id: "fc-7",
    domainId: "security-compliance",
    question: "What is the best practice for giving an application running on an EC2 instance access to an S3 bucket?",
    answer: "Attach an IAM Role to the EC2 instance instead of embedding hardcoded AWS Access Keys inside the application code."
  },
  {
    id: "fc-8",
    domainId: "security-compliance",
    question: "How does Amazon GuardDuty differ from Amazon Inspector?",
    answer: "GuardDuty is a continuous threat detection service scanning VPC, DNS, and CloudTrail logs for intrusions. Inspector is a vulnerability scanner checking EC2 instances for software CVEs."
  },

  // Domain 3
  {
    id: "fc-9",
    domainId: "cloud-technology",
    question: "When should you use Amazon EFS over Amazon EBS?",
    answer: "Use EFS when you need shared file storage that can be mounted concurrently by hundreds of EC2 instances. EBS can only attach to one instance at a time (in standard usage)."
  },
  {
    id: "fc-10",
    domainId: "cloud-technology",
    question: "What does it mean that AWS Lambda is 'serverless'?",
    answer: "AWS manages server allocation, patching, and scales the compute power automatically. The customer only pays for active execution time (measured in milliseconds)."
  },

  // Domain 4
  {
    id: "fc-11",
    domainId: "billing-pricing",
    question: "What tool should you use to receive automated alerts when your projected monthly spend crosses $200?",
    answer: "AWS Budgets. It handles proactive budget limit configurations and email alerts."
  },
  {
    id: "fc-12",
    domainId: "billing-pricing",
    question: "Who is the Technical Account Manager (TAM) and which support plan includes them?",
    answer: "The TAM is a designated AWS engineer acting as your strategic technical advisor. They are only included in the Enterprise Support Plan."
  }
];

export const trickQuestions: TrickQuestion[] = [
  // ==========================================
  // DOMAIN 1: CLOUD CONCEPTS (1 to 13)
  // ==========================================
  {
    id: "q-1",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "An enterprise is planning to migrate its workloads to AWS. The CTO believes that because AWS physical data centers are highly secure and fault-tolerant, the company can deploy applications without setting up multiple subnets, doing manual operating system patches, or configuring firewall rules. Under the Shared Responsibility Model, which is true?",
    options: [
      { key: "A", text: "The customer is relieved of all operating system patching since AWS is responsible for security OF the cloud." },
      { key: "B", text: "AWS automatically handles guest OS updates, application firewall configs, and S3 encryption by default." },
      { key: "C", text: "The CTO is incorrect because the customer remains fully responsible for security IN the cloud, including guest OS patching and firewall configurations." },
      { key: "D", text: "AWS is responsible for patching customer database tables and securing user applications directly." }
    ],
    correctAnswer: "C",
    trickAlert: "Don't confuse security OF the cloud (physical facilities, host virtualization, global infrastructure managed by AWS) with security IN the cloud (customer configurations, guest OS, network rules managed by the customer).",
    correctExplanation: "Option C is correct. The Shared Responsibility Model defines AWS as responsible for security OF the cloud (underlying hardware/virtualization). The customer is responsible for security IN the cloud (operating systems, configurations, IAM, and data).",
    distractorExplanations: {
      A: "Incorrect. Guest operating system patching is the customer's responsibility on services like EC2.",
      B: "Incorrect. AWS does not configure your firewall rules (Security Groups) or S3 bucket encryption automatically.",
      C: "Correct. Highlights the proper dividing line under the Shared Responsibility Model.",
      D: "Incorrect. AWS does not manage customer database entries or application-level security."
    }
  },
  {
    id: "q-2",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "A startup wants to launch a viral gaming app that could scale from 1,000 to 10,000,000 concurrent users within a few hours. Which core cloud design concept represents the ability to automatically and dynamically adjust resources in real-time to match variable user demand?",
    options: [
      { key: "A", text: "Scalability" },
      { key: "B", text: "Elasticity" },
      { key: "C", text: "High Availability" },
      { key: "D", text: "Fault Tolerance" }
    ],
    correctAnswer: "B",
    trickAlert: "Scalability is the ability to handle larger workloads but does not imply dynamic, automated, real-time scaling down. Elasticity is the automatic matching of supply and demand.",
    correctExplanation: "Option B is correct. Elasticity allows an application to scale up when demand spikes and scale down when demand drops, automatically optimizing costs.",
    distractorExplanations: {
      A: "Incorrect. Scalability refers to the general capacity to grow, but does not specify real-time automated contraction to save cost.",
      B: "Correct. Elasticity represents real-time dynamic adjustment to match demand.",
      C: "Incorrect. High Availability ensures services remain accessible, not necessarily matching demand to save cost.",
      D: "Incorrect. Fault Tolerance is the ability to withstand hardware failures without any service degradation."
    }
  },
  {
    id: "q-3",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "A corporate finance department is reviewing IT expenditures. They want to transition from a capital expenditure (Capex) model, which requires massive upfront physical hardware investments, to an operating expenditure (Opex) model. How does AWS support this?",
    options: [
      { key: "A", text: "AWS charges flat monthly fees regardless of your resource utilization to keep costs fully predictable." },
      { key: "B", text: "AWS requires 3-year upfront contracts for all compute services to secure lower rates." },
      { key: "C", text: "AWS allows customers to trade upfront physical asset costs for variable consumption-based pricing." },
      { key: "D", text: "AWS offers free hardware provisioning with billing starting only after 12 months." }
    ],
    correctAnswer: "C",
    trickAlert: "AWS is pay-as-you-go. Avoid answers suggesting flat fees or mandatory 3-year upfront contracts for all resources.",
    correctExplanation: "Option C is correct. One of the primary business values of AWS is the ability to trade capital expense (Capex) for variable operating expense (Opex), paying only for what you use.",
    distractorExplanations: {
      A: "Incorrect. AWS does not charge flat fees; billing is variable based on your consumption.",
      B: "Incorrect. Upfront contracts (like Reserved Instances) are optional, not mandatory.",
      C: "Correct. Highlights the transition from upfront capital expenditures to variable consumption-based pricing.",
      D: "Incorrect. Physical hardware is managed by AWS, and billing starts immediately based on resource run-time."
    }
  },
  {
    id: "q-4",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "An architect is reviewing an application design against the AWS Well-Architected Framework. The goal is to ensure the system can automatically recover from infrastructure failures, scale dynamically to meet demand, and mitigate disruptions. Which pillar is the main focus?",
    options: [
      { key: "A", text: "Performance Efficiency" },
      { key: "B", text: "Reliability" },
      { key: "C", text: "Operational Excellence" },
      { key: "D", text: "Cost Optimization" }
    ],
    correctAnswer: "B",
    trickAlert: "Automatic failure recovery and mitigation of disruptions are the core components of the Reliability pillar. Performance focuses on speed and efficiency.",
    correctExplanation: "Option B is correct. The Reliability pillar focuses on the ability of a system to recover from service or infrastructure disruptions and dynamically acquire resources to meet demand.",
    distractorExplanations: {
      A: "Incorrect. Performance Efficiency deals with using computing resources efficiently to meet requirements.",
      B: "Correct. Reliability covers failure recovery, self-healing, and fault-tolerant structures.",
      C: "Incorrect. Operational Excellence focuses on running and monitoring systems, and continuously improving processes.",
      D: "Incorrect. Cost Optimization focuses on avoiding unnecessary expenditure and maximizing value."
    }
  },
  {
    id: "q-5",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "A software development firm is migrating a database to AWS. They want to ensure that even if an entire physical data center goes offline due to a localized natural disaster, the database will experience zero downtime or data loss. What AWS architecture should they utilize?",
    options: [
      { key: "A", text: "Deploying the database across multiple Edge Locations" },
      { key: "B", text: "Deploying the database in a Multi-Availability Zone (Multi-AZ) configuration" },
      { key: "C", text: "Deploying the database within a single local Subnet with Auto Scaling" },
      { key: "D", text: "Exporting daily backups to AWS KMS" }
    ],
    correctAnswer: "B",
    trickAlert: "Edge Locations are for CloudFront caching, not database multi-zone replication. Backups to KMS (which is a key storage service, not a backup target) are incorrect and represent high data loss.",
    correctExplanation: "Option B is correct. Availability Zones (AZs) are physically distinct data centers within a single AWS Region. A Multi-AZ deployment replicates data synchronously, ensuring seamless failover and high availability during a data center outage.",
    distractorExplanations: {
      A: "Incorrect. Edge Locations cache media and web pages, they do not host relational multi-zone databases.",
      B: "Correct. Multi-AZ is the primary mechanism for localized physical disaster tolerance and high availability.",
      C: "Incorrect. A single subnet is bound to one AZ. If that AZ goes offline, the database is lost regardless of Auto Scaling.",
      D: "Incorrect. Backups are stored in S3, not KMS (Key Management Service). Daily backups would still result in up to 24 hours of data loss."
    }
  },
  {
    id: "q-6",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "A company wants to assess its alignment with AWS cloud migration best practices. They are looking to organize their migration activities into six focus areas, including Business, People, Governance, Platform, Security, and Operations. Which framework defines these six perspectives?",
    options: [
      { key: "A", text: "AWS Well-Architected Framework" },
      { key: "B", text: "AWS Cloud Adoption Framework (AWS CAF)" },
      { key: "C", text: "AWS Migration Evaluator" },
      { key: "D", text: "AWS Professional Services Protocol" }
    ],
    correctAnswer: "B",
    trickAlert: "Well-Architected has 6 Pillars, but the 6 Perspectives (Business, People, Governance, Platform, Security, Operations) belong exclusively to the AWS Cloud Adoption Framework (AWS CAF).",
    correctExplanation: "Option B is correct. The AWS Cloud Adoption Framework (AWS CAF) organizes migration guidance into six perspectives (Business, People, Governance, Platform, Security, Operations) to identify capability gaps.",
    distractorExplanations: {
      A: "Incorrect. Well-Architected has pillars (Operational Excellence, Security, Reliability, Performance, Cost, Sustainability), not perspectives.",
      B: "Correct. Highlights the core structure of the AWS Cloud Adoption Framework.",
      C: "Incorrect. Migration Evaluator is a tool for estimating migration costs, not a strategic framework.",
      D: "Incorrect. This is a fictitious service name."
    }
  },
  {
    id: "q-7",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "How does the AWS cloud pay-as-you-go pricing model provide financial elasticity compared to on-premises deployments?",
    options: [
      { key: "A", text: "You pay a fixed annual rate which is adjusted at the end of the year." },
      { key: "B", text: "You can scale down resources during low-traffic periods and immediately stop paying for them." },
      { key: "C", text: "You are billed in advance based on your historical resource requests." },
      { key: "D", text: "AWS guarantees a 50% discount compared to any local server configuration." }
    ],
    correctAnswer: "B",
    trickAlert: "Pay-as-you-go means you only pay for resources when they are running. Scaling them down immediately stops the accrual of charges.",
    correctExplanation: "Option B is correct. Pay-as-you-go pricing means you only pay for the active compute time or storage you consume, without upfront commitments or idle hardware overhead.",
    distractorExplanations: {
      A: "Incorrect. AWS does not use fixed annual rates for standard on-demand consumption.",
      B: "Correct. Scaling down or stopping instances instantly halts the charge accumulation.",
      C: "Incorrect. AWS bills retrospectively based on actual usage, not in advance based on estimations.",
      D: "Incorrect. AWS does not guarantee flat percentage discounts relative to local setups without optimization."
    }
  },
  {
    id: "q-8",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "A digital media agency can now deploy 100 testing servers within 5 minutes using AWS, whereas it previously took 6 weeks to order, rack, and configure physical hardware. Which cloud benefit does this illustrate?",
    options: [
      { key: "A", text: "Economies of scale" },
      { key: "B", text: "Agility" },
      { key: "C", text: "High availability" },
      { key: "D", text: "Global footprint" }
    ],
    correctAnswer: "B",
    trickAlert: "Speed and responsiveness to business changes (reducing server provisioning from weeks to minutes) is the literal definition of 'Agility' in the Cloud Value Proposition.",
    correctExplanation: "Option B is correct. Agility represents the speed and ease with which you can innovate, test, and deploy resources, reducing time-to-market dramatically.",
    distractorExplanations: {
      A: "Incorrect. Economies of scale refers to AWS passing savings on to customers due to purchasing hardware in massive volumes.",
      B: "Correct. Agility represents rapid experimentation and quick resource delivery.",
      C: "Incorrect. High availability ensures systems are accessible, not that they can be provisioned rapidly.",
      D: "Incorrect. Global footprint refers to deploying in multiple regions around the world."
    }
  },
  {
    id: "q-9",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "AWS continuously lowers pay-as-you-go pricing for customers as more organizations adopt cloud services, enabling AWS to purchase hardware in massive volumes. What benefit is this?",
    options: [
      { key: "A", text: "High elasticity" },
      { key: "B", text: "Massive economies of scale" },
      { key: "C", text: "Trade capital expense for variable expense" },
      { key: "D", text: "Increase speed and agility" }
    ],
    correctAnswer: "B",
    trickAlert: "Massive economies of scale refers directly to how AWS's sheer size allows them to purchase hardware cheaper and pass the savings on to customers.",
    correctExplanation: "Option B is correct. Due to massive usage aggregation, AWS can acquire physical assets at lower costs and translate those savings into pricing cuts.",
    distractorExplanations: {
      A: "Incorrect. Elasticity is about scaling resources up and down.",
      B: "Correct. This directly describes the economic concept of massive economies of scale.",
      C: "Incorrect. This refers to consumption billing, not price cuts from high purchase volumes.",
      D: "Incorrect. Speed and agility refer to deployment times, not physical purchase advantages."
    }
  },
  {
    id: "q-10",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "Under the Shared Responsibility Model, which of the following is considered a shared control that applies to both AWS and the customer, but in different contexts?",
    options: [
      { key: "A", text: "Physical security of data centers" },
      { key: "B", text: "Patch Management" },
      { key: "C", text: "Hypervisor software maintenance" },
      { key: "D", text: "Guest operating system configurations" }
    ],
    correctAnswer: "B",
    trickAlert: "Shared controls are those that apply to both. For patch management, AWS patches physical infrastructure/hypervisors, while the customer patches the guest OS.",
    correctExplanation: "Option B is correct. Patch management is a shared control: AWS is responsible for patching the host OS and physical hardware, while the customer is responsible for patching guest operating systems.",
    distractorExplanations: {
      A: "Incorrect. Physical security is the sole responsibility of AWS (under security OF the cloud).",
      B: "Correct. Explains how patch management represents a shared responsibility with distinct halves.",
      C: "Incorrect. Hypervisor maintenance is the sole responsibility of AWS.",
      D: "Incorrect. Guest OS patching/configuration is the sole responsibility of the customer."
    }
  },
  {
    id: "q-11",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "Which pillar of the AWS Well-Architected Framework focuses on the sustainable use of cloud resources to minimize environmental impact?",
    options: [
      { key: "A", text: "Operational Excellence" },
      { key: "B", text: "Performance Efficiency" },
      { key: "C", text: "Sustainability" },
      { key: "D", text: "Cost Optimization" }
    ],
    correctAnswer: "C",
    trickAlert: "Sustainability is the newest pillar of the Well-Architected Framework, specifically dedicated to reducing environmental footprints and carbon emissions.",
    correctExplanation: "Option C is correct. The Sustainability pillar focuses on environmental impacts, particularly energy reduction and efficient resource modeling.",
    distractorExplanations: {
      A: "Incorrect. Operational Excellence is about process management and automation.",
      B: "Incorrect. Performance Efficiency deals with computing speeds and scaling.",
      C: "Correct. Highlights the focus area of environmental impact and energy footprint.",
      D: "Incorrect. Cost Optimization focuses strictly on financial spending, not environmental carbon footprints."
    }
  },
  {
    id: "q-12",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "What architectural model represents a design where a workload can withstand physical hardware failures without any disruption, usually accomplished by active redundant clustering?",
    options: [
      { key: "A", text: "Dynamic Scalability" },
      { key: "B", text: "Fault Tolerance" },
      { key: "C", text: "Elastic Resource Pooling" },
      { key: "D", text: "Loose Coupling" }
    ],
    correctAnswer: "B",
    trickAlert: "Fault tolerance means zero service degradation during a physical failure. High availability might experience a brief blip or recovery cycle; fault tolerance is seamless.",
    correctExplanation: "Option B is correct. Fault tolerance describes a system's capacity to continue operating without interruption even when major hardware components fail completely.",
    distractorExplanations: {
      A: "Incorrect. Scalability refers to handling volume growth, not hardware failure absorption.",
      B: "Correct. Represents seamless failure resilience with zero downtime or degradation.",
      C: "Incorrect. Elasticity deals with cost and dynamic sizing, not redundancy configurations.",
      D: "Incorrect. Loose Coupling is an architectural practice to isolate services so they do not depend tightly on each other."
    }
  },
  {
    id: "q-13",
    domainId: "cloud-concepts",
    domainName: "Cloud Concepts",
    scenario: "A software provider wants to review their AWS deployment configurations and receive architectural advice based on the six pillars of the Well-Architected Framework. Which free, native AWS tool supports this assessment?",
    options: [
      { key: "A", text: "AWS Trusted Advisor" },
      { key: "B", text: "AWS Well-Architected Tool" },
      { key: "C", text: "AWS Systems Manager Compliance Hub" },
      { key: "D", text: "AWS Artifact" }
    ],
    correctAnswer: "B",
    trickAlert: "Trusted Advisor scans active configurations for automated best practices. The Well-Architected Tool is a self-service questionnaire to review workloads manually against the pillars.",
    correctExplanation: "Option B is correct. The AWS Well-Architected Tool helps you define workloads and compare them against AWS architectural best practices using the framework pillars.",
    distractorExplanations: {
      A: "Incorrect. Trusted Advisor checks live metrics (idle databases, ports, etc.) automatically but doesn't walk you through Well-Architected questionnaires.",
      B: "Correct. Well-Architected Tool is the official mechanism for executing architectural reviews against the pillars.",
      C: "Incorrect. Systems Manager handles server operations and configurations.",
      D: "Incorrect. AWS Artifact downloads compliance certificates and legal documents."
    }
  },

  // ==========================================
  // DOMAIN 2: SECURITY & COMPLIANCE (14 to 33)
  // ==========================================
  {
    id: "q-14",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A network engineer wants to configure firewalls inside a VPC. They require a firewall that is stateful, meaning it automatically allows outbound response traffic for any established inbound request, and operates at the individual EC2 instance level. What resource should they configure?",
    options: [
      { key: "A", text: "Network ACL (NACL)" },
      { key: "B", text: "Security Group" },
      { key: "C", text: "Internet Gateway Route Table" },
      { key: "D", text: "AWS Network Firewall Subnet Filter" }
    ],
    correctAnswer: "B",
    trickAlert: "Security Groups are stateful and operate at the instance level. Network ACLs are stateless, require explicit outbound rules, and operate at the subnet level.",
    correctExplanation: "Option B is correct. Security Groups act as stateful firewalls for virtual instances. Stateful means if an inbound request is permitted, response outbound traffic is automatically allowed.",
    distractorExplanations: {
      A: "Incorrect. Network ACLs are stateless, operate at the subnet level, and require manual configurations of inbound AND outbound rules.",
      B: "Correct. Highlights the stateful nature and instance-level scope of Security Groups.",
      C: "Incorrect. Route tables direct traffic paths, they do not filter security rules.",
      D: "Incorrect. AWS Network Firewall is a massive global VPC firewall, not a simple instance-level stateful group."
    }
  },
  {
    id: "q-15",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "An application running on an Amazon EC2 instance needs to securely read database credentials stored in an Amazon S3 bucket. According to security best practices, how should the application be granted access?",
    options: [
      { key: "A", text: "Embed the root user access keys inside the application configuration file." },
      { key: "B", text: "Create an IAM User, download access keys, and save them in the EC2 operating system." },
      { key: "C", text: "Attach an IAM Role to the EC2 instance containing temporary permissions to access the S3 bucket." },
      { key: "D", text: "Configure the S3 bucket to be fully public so anyone can access it temporarily." }
    ],
    correctAnswer: "C",
    trickAlert: "Never store long-lived credentials (like access keys) on virtual machines or embed them in code. Always use IAM Roles to assign temporary credentials to services.",
    correctExplanation: "Option C is correct. Attaching an IAM Role to an EC2 instance provides secure, temporary credentials that rotate automatically, avoiding hardcoded secrets.",
    distractorExplanations: {
      A: "Incorrect. Embedding root user credentials violates every principle of security and is highly dangerous.",
      B: "Incorrect. Downloading static access keys creates long-lived security credentials that can be leaked or stolen.",
      C: "Correct. IAM Roles provide temporary security tokens, satisfying the Principle of Least Privilege safely.",
      D: "Incorrect. Making S3 buckets public creates a severe data leak and is a critical security failure."
    }
  },
  {
    id: "q-16",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A financial organization must store transactions in an S3 bucket. The data must be encrypted before being written to disk, and the company must maintain full control over the creation, rotation, and deletion of the cryptographic keys. Which service supports this requirement?",
    options: [
      { key: "A", text: "AWS CloudHSM" },
      { key: "B", text: "AWS Key Management Service (AWS KMS)" },
      { key: "C", text: "AWS Artifact" },
      { key: "D", text: "AWS Secrets Manager" }
    ],
    correctAnswer: "B",
    trickAlert: "KMS handles cryptographic keys (creation, rotation, envelope encryption). Secrets Manager stores credentials and database passwords, not raw cryptographic keys for files.",
    correctExplanation: "Option B is correct. AWS KMS is a managed service that makes it easy to create and control customer-managed cryptographic keys used to encrypt your S3 data.",
    distractorExplanations: {
      A: "Incorrect. CloudHSM provides dedicated physical hardware security modules, which is expensive and complex, whereas standard key rotation controls are managed natively by KMS.",
      B: "Correct. KMS is the direct managed service for key management, envelope encryption, and key rotation.",
      C: "Incorrect. AWS Artifact is for downloading compliance audit papers.",
      D: "Incorrect. Secrets Manager is for rotating database passwords, API keys, and connection strings."
    }
  },
  {
    id: "q-17",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A banking website is experiencing high volumes of malicious web exploitation attempts, including SQL Injection and Cross-Site Scripting (XSS) attacks on their login portal. Which perimeter service should they deploy to inspect and filter Layer 7 traffic?",
    options: [
      { key: "A", text: "AWS Shield Standard" },
      { key: "B", text: "AWS WAF (Web Application Firewall)" },
      { key: "C", text: "Amazon GuardDuty" },
      { key: "D", text: "AWS Systems Manager (SSM)" }
    ],
    correctAnswer: "B",
    trickAlert: "Shield handles DDoS attacks (network layers 3 & 4). AWS WAF is specifically designed to inspect HTTP/S traffic at Layer 7 and block SQLi/XSS web exploits.",
    correctExplanation: "Option B is correct. AWS WAF is a web application firewall that lets you monitor HTTP and HTTPS requests that are forwarded to CloudFront, ALB, or API Gateway, and block web exploits.",
    distractorExplanations: {
      A: "Incorrect. AWS Shield provides DDoS protection at layers 3 and 4, it does not analyze Layer 7 application payloads for SQLi.",
      B: "Correct. WAF is the correct layer for filtering web exploits like SQL injections and XSS.",
      C: "Incorrect. GuardDuty is a post-compromise threat detection service, it does not inspect and block active HTTP web payloads.",
      D: "Incorrect. Systems Manager manages server administration, not network firewall inspection."
    }
  },
  {
    id: "q-18",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A compliance auditor wants to find and label any accidentally exposed Personally Identifiable Information (PII) such as passport numbers or credit cards stored across millions of PDF files in Amazon S3. Which machine-learning powered security service should they use?",
    options: [
      { key: "A", text: "Amazon Inspector" },
      { key: "B", text: "Amazon Macie" },
      { key: "C", text: "AWS Artifact" },
      { key: "D", text: "Amazon GuardDuty" }
    ],
    correctAnswer: "B",
    trickAlert: "Inspector scans servers for software bugs (CVEs). Macie scans S3 storage buckets specifically for sensitive personal data (PII) like SSNs, credit cards, or passport images.",
    correctExplanation: "Option B is correct. Amazon Macie is a fully managed data security and privacy service that uses machine learning and pattern matching to discover and protect sensitive data in S3.",
    distractorExplanations: {
      A: "Incorrect. Amazon Inspector scans EC2 instances and containers for operating system vulnerabilities, not raw file content for PII.",
      B: "Correct. Amazon Macie is the standard ML service for S3 sensitive data scanning.",
      C: "Incorrect. AWS Artifact is for downloading compliance reports.",
      D: "Incorrect. Amazon GuardDuty searches log streams for suspicious network behavior, not file data for PII."
    }
  },
  {
    id: "q-19",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A regulatory officer needs to access signed legal agreements and official security certs (like SOC 2 and ISO reports) proving AWS physical data centers meet global compliance mandates. Which AWS service provides these on-demand?",
    options: [
      { key: "A", text: "AWS Security Hub" },
      { key: "B", text: "AWS Systems Manager Compliance" },
      { key: "C", text: "AWS Artifact" },
      { key: "D", text: "AWS Audit Manager" }
    ],
    correctAnswer: "C",
    trickAlert: "Audit Manager helps compile evidence for your own resources. AWS Artifact is the central portal for downloading AWS's global legal compliance certificates.",
    correctExplanation: "Option C is correct. AWS Artifact is the self-service portal that provides on-demand access to AWS security and compliance reports and select online agreements.",
    distractorExplanations: {
      A: "Incorrect. Security Hub aggregates active security alerts across your AWS accounts, it does not store legal audit documents.",
      B: "Incorrect. Systems Manager tracks operational patch compliance of your own EC2 nodes.",
      C: "Correct. AWS Artifact is the official portal for AWS compliance reports.",
      D: "Incorrect. AWS Audit Manager compiles your custom compliance checklists, not AWS compliance papers."
    }
  },
  {
    id: "q-20",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A company wants to implement user sign-up, sign-in, and access control for their custom mobile application, allowing customers to log in using Google or Facebook credentials. Which service should they integrate?",
    options: [
      { key: "A", text: "AWS Directory Service" },
      { key: "B", text: "Amazon Cognito" },
      { key: "C", text: "AWS IAM Identity Center" },
      { key: "D", text: "Amazon Connect" }
    ],
    correctAnswer: "B",
    trickAlert: "AWS Directory Service integrates Microsoft Active Directory. Amazon Cognito is for user sign-in/sign-up and federation (Google/Facebook) inside customer applications.",
    correctExplanation: "Option B is correct. Amazon Cognito provides user directories, profile management, and secure registration/login flows for web and mobile consumer apps.",
    distractorExplanations: {
      A: "Incorrect. Directory Service is for managing corporate Windows logins, not mobile app customer sign-ups.",
      B: "Correct. Cognito handles user pools and federation for consumer applications.",
      C: "Incorrect. IAM Identity Center is for corporate single sign-on across AWS accounts, not mobile app users.",
      D: "Incorrect. Amazon Connect is an omni-channel cloud contact center service."
    }
  },
  {
    id: "q-21",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A security engineer wants to store a relational database password. The system must support automatic rotation of this password every 30 days without manual scripts. Which service should they use?",
    options: [
      { key: "A", text: "AWS Systems Manager Parameter Store" },
      { key: "B", text: "AWS Secrets Manager" },
      { key: "C", text: "AWS Key Management Service (KMS)" },
      { key: "D", text: "AWS Artifact" }
    ],
    correctAnswer: "B",
    trickAlert: "While Parameter Store can store strings, it does not natively rotate passwords. AWS Secrets Manager is specifically built to store and rotate credentials automatically.",
    correctExplanation: "Option B is correct. AWS Secrets Manager helps you protect secrets (like database credentials). It supports automatic rotation of credentials out-of-the-box using Lambda.",
    distractorExplanations: {
      A: "Incorrect. Parameter Store is a configuration management store. It doesn't support built-in secure credential rotation.",
      B: "Correct. Secrets Manager supports credentials storage, secure rotation, and database integration.",
      C: "Incorrect. KMS handles keys for file encryption, not password strings or automatic rotation of database strings.",
      D: "Incorrect. AWS Artifact is for downloading regulatory compliance papers."
    }
  },
  {
    id: "q-22",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A healthcare enterprise wants to continually map their active cloud configurations to HIPAA regulatory frameworks and automatically collect evidence for external audits. Which service compiles this evidence?",
    options: [
      { key: "A", text: "AWS Security Hub" },
      { key: "B", text: "AWS Audit Manager" },
      { key: "C", text: "AWS Shield Advanced" },
      { key: "D", text: "Amazon GuardDuty" }
    ],
    correctAnswer: "B",
    trickAlert: "Security Hub flags misconfigurations. AWS Audit Manager actively maps configurations to compliance standards and automates evidence collection for audits.",
    correctExplanation: "Option B is correct. AWS Audit Manager helps you continuously audit your AWS usage to simplify how you manage risk and compliance with regulations and standards.",
    distractorExplanations: {
      A: "Incorrect. Security Hub gives security postures and scores but doesn't compile official regulatory evidence documents for external auditors.",
      B: "Correct. AWS Audit Manager is the native service for compliance mapping and evidence automation.",
      C: "Incorrect. Shield Advanced is a DDoS mitigation plan.",
      D: "Incorrect. GuardDuty is a post-compromise log scanner."
    }
  },
  {
    id: "q-23",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A security operations team wants to centrally manage firewall rules, Security Group rules, and WAF rules across 100 AWS accounts in an organization. Which service enables this centralized rule management?",
    options: [
      { key: "A", text: "AWS Network Firewall" },
      { key: "B", text: "AWS Firewall Manager" },
      { key: "C", text: "AWS Systems Manager" },
      { key: "D", text: "AWS Control Tower" }
    ],
    correctAnswer: "B",
    trickAlert: "AWS Network Firewall is an actual firewall appliance. AWS Firewall Manager is a security management tool that allows you to configure and deploy firewall rules across multiple accounts.",
    correctExplanation: "Option B is correct. AWS Firewall Manager is a security management service which allows you to centrally configure and manage firewall rules across your accounts and applications.",
    distractorExplanations: {
      A: "Incorrect. Network Firewall provides the filtering engine but does not deploy configurations across multiple organization accounts centrally.",
      B: "Correct. Firewall Manager handles rule distribution and central governance for firewalls, Security Groups, and WAF.",
      C: "Incorrect. Systems Manager manages instances operationally.",
      D: "Incorrect. Control Tower is for landing zones and multi-account setups, not firewalls specifically."
    }
  },
  {
    id: "q-24",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "An AWS account administrator wants to check if their account root user has Multi-Factor Authentication (MFA) enabled, and if any security groups have ports open to the public internet. Which service performs these basic checks?",
    options: [
      { key: "A", text: "Amazon GuardDuty" },
      { key: "B", text: "AWS Trusted Advisor" },
      { key: "C", text: "Amazon Inspector" },
      { key: "D", text: "AWS Security Hub" }
    ],
    correctAnswer: "B",
    trickAlert: "Trusted Advisor scans your account configurations to verify if basic best practices (like MFA on root, public ports) are met.",
    correctExplanation: "Option B is correct. AWS Trusted Advisor inspects your AWS environment and makes recommendations for saving money, improving system performance, and closing security gaps (MFA status, open ports).",
    distractorExplanations: {
      A: "Incorrect. GuardDuty scans logs for active hacks, it does not report passive configuration gaps like a disabled MFA.",
      B: "Correct. Trusted Advisor is the standard checklist for account health across security, cost, and optimization.",
      C: "Incorrect. Inspector scans the software package registry of EC2 instances, not root account parameters.",
      D: "Incorrect. Security Hub aggregates security warnings but does not focus on providing these basic, non-intrusive standard best practice recommendations."
    }
  },
  {
    id: "q-25",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A junior administrator is configuring IAM policies. They should grant users only the absolute minimum permissions required to perform their daily duties. Which core security model represents this practice?",
    options: [
      { key: "A", text: "Shared Responsibility Model" },
      { key: "B", text: "Principle of Least Privilege" },
      { key: "C", text: "Stateless Security Filtering" },
      { key: "D", text: "Defense in Depth" }
    ],
    correctAnswer: "B",
    trickAlert: "Providing minimal permissions (e.g. read-only instead of administrator) is the literal definition of the 'Principle of Least Privilege'.",
    correctExplanation: "Option B is correct. The Principle of Least Privilege is an information security concept where a user is given the minimum level of access necessary to complete their job.",
    distractorExplanations: {
      A: "Incorrect. Shared Responsibility splits host and guest security duties between AWS and the customer.",
      B: "Correct. This is the direct definition of Least Privilege.",
      C: "Incorrect. This refers to stateless network ACL firewalls.",
      D: "Incorrect. Defense in Depth refers to applying multiple distinct layers of security controls throughout a system."
    }
  },
  {
    id: "q-26",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "Which of the following represents a critical security best practice for securing the AWS Account Root User immediately after creation?",
    options: [
      { key: "A", text: "Download the root access keys, save them locally, and log in daily with root." },
      { key: "B", text: "Enable Multi-Factor Authentication (MFA) and delete the root user access keys." },
      { key: "C", text: "Grant full administrator permissions to all application users using root credentials." },
      { key: "D", text: "Share the root password with the development team to speed up deployment." }
    ],
    correctAnswer: "B",
    trickAlert: "Never use the root user for daily administrative tasks, and never create access keys for root. Always delete root access keys and enable MFA.",
    correctExplanation: "Option B is correct. To secure the root user, you must enable MFA, delete root access keys, and create standard IAM users for everyday administration.",
    distractorExplanations: {
      A: "Incorrect. Access keys on the root account are a severe risk. Root should not be used for daily logins.",
      B: "Correct. Highlights the standard AWS root securing protocols.",
      C: "Incorrect. Violates the principle of least privilege.",
      D: "Incorrect. Sharing root credentials is a severe breach of security compliance."
    }
  },
  {
    id: "q-27",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A company wants to prevent unauthorized access to their AWS Management Console by requiring a physical hardware token or mobile authenticator app code in addition to a password. What mechanism is this?",
    options: [
      { key: "A", text: "Identity Federation" },
      { key: "B", text: "Multi-Factor Authentication (MFA)" },
      { key: "C", text: "Single Sign-On (SSO)" },
      { key: "D", text: "IAM Policy Guard" }
    ],
    correctAnswer: "B",
    trickAlert: "Requiring an additional dynamic code from a hardware or software token alongside a password is Multi-Factor Authentication (MFA).",
    correctExplanation: "Option B is correct. MFA adds an extra layer of protection on top of username and password by requiring a unique code from an authenticated device.",
    distractorExplanations: {
      A: "Incorrect. Federation is signing in with external logins like Active Directory.",
      B: "Correct. MFA is the standard multi-step credential confirmation process.",
      C: "Incorrect. Single Sign-On allows a single portal login for multiple accounts.",
      D: "Incorrect. Fictitious security term."
    }
  },
  {
    id: "q-28",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "Under the AWS Shared Responsibility Model, which of the following is an encryption-related task that falls solely on the customer?",
    options: [
      { key: "A", text: "Securing physical access to the cryptographic keys inside AWS facilities." },
      { key: "B", text: "Managing customer data encryption settings and configuring server-side S3 parameters." },
      { key: "C", text: "Replacing failed physical hard drives that hold encrypted virtual volumes." },
      { key: "D", text: "Maintaining the hypervisor firmware used to support KMS encryption hosts." }
    ],
    correctAnswer: "B",
    trickAlert: "AWS secures the underlying physical encryption hardware and KMS host layers. The customer must configure their own S3 bucket settings and choose to enable/disable encryption.",
    correctExplanation: "Option B is correct. Managing client-side or server-side data encryption settings is the customer's responsibility (security IN the cloud).",
    distractorExplanations: {
      A: "Incorrect. Physical security of key storage is managed entirely by AWS.",
      B: "Correct. Explains the customer's role in configuring their own data encryption settings.",
      C: "Incorrect. Physical hardware repair and drive shredding is the sole responsibility of AWS.",
      D: "Incorrect. Hypervisor and host firmware maintenance is managed solely by AWS."
    }
  },
  {
    id: "q-29",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A security manager wants a single, central dashboard that aggregates and prioritizes security alerts and compliance findings across multiple AWS security services like GuardDuty, Inspector, and Macie. Which service provides this central hub?",
    options: [
      { key: "A", text: "AWS Security Hub" },
      { key: "B", text: "AWS Artifact" },
      { key: "C", text: "AWS Organizations" },
      { key: "D", text: "Amazon EventBridge" }
    ],
    correctAnswer: "A",
    trickAlert: "Security Hub aggregates, consolidates, and acts as the central dashboard for security alerts across your active services. AWS Artifact stores documents.",
    correctExplanation: "Option A is correct. AWS Security Hub gives you a comprehensive view of your security state in AWS and helps you measure your environment against security standards.",
    distractorExplanations: {
      A: "Correct. Security Hub consolidates warnings and posture scores from multiple security products.",
      B: "Incorrect. AWS Artifact provides legal compliance documents, not an active alert dashboard.",
      C: "Incorrect. AWS Organizations is for multi-account management and consolidated billing.",
      D: "Incorrect. Amazon EventBridge is an event bus for triggering scripts, not a security console."
    }
  },
  {
    id: "q-30",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A cloud architect needs to configure stateful Layer 3 to Layer 7 network security filtering across a whole VPC, including deep packet inspection. Which service provides this centralized network protection?",
    options: [
      { key: "A", text: "Security Groups" },
      { key: "B", text: "AWS Network Firewall" },
      { key: "C", text: "AWS Shield Standard" },
      { key: "D", text: "AWS Systems Manager" }
    ],
    correctAnswer: "B",
    trickAlert: "Security Groups are stateful firewalls but they only handle simple port filtering at the instance level. Centralized deep packet inspection across a VPC requires AWS Network Firewall.",
    correctExplanation: "Option B is correct. AWS Network Firewall is a managed service that makes it easy to deploy essential network protections for all of your VPCs, providing advanced inspection.",
    distractorExplanations: {
      A: "Incorrect. Security Groups operate strictly at the instance level and do not perform deep packet inspection.",
      B: "Correct. Network Firewall is the central VPC-wide stateful packet inspection service.",
      C: "Incorrect. Shield Standard is specifically for basic L3/L4 DDoS protection.",
      D: "Incorrect. Systems Manager manages servers administratively, not via firewall rules."
    }
  },
  {
    id: "q-31",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "An IAM user is assigned two policies. One policy allows access to an Amazon S3 bucket, while the second policy contains an explicit Deny statement for that same bucket. When the user attempts to access the bucket, what is the result?",
    options: [
      { key: "A", text: "Access is allowed because Allow statements always take precedence over Deny statements." },
      { key: "B", text: "Access is denied because an explicit Deny statement always overrides any Allow statements." },
      { key: "C", text: "Access is allowed because the policies are combined and averaged out." },
      { key: "D", text: "The request fails with a server error due to policy conflict." }
    ],
    correctAnswer: "B",
    trickAlert: "In IAM policy evaluation, an explicit deny overrides any allow statement, no matter what.",
    correctExplanation: "Option B is correct. By default, all requests are denied. If an explicit deny is present in any evaluated policy, the final evaluation is always Deny.",
    distractorExplanations: {
      A: "Incorrect. Denies always beat allows in AWS IAM logic.",
      B: "Correct. Highlights the strict 'explicit deny overrides' rule of IAM.",
      C: "Incorrect. Policies are not 'averaged'; conflicts are resolved with deny-priority.",
      D: "Incorrect. The request does not trigger a server error; it returns a clean '403 Access Denied' authorization code."
    }
  },
  {
    id: "q-32",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A company wants to manage corporate identities and give their staff single sign-on access across multiple AWS accounts and third-party SaaS applications. Which service is designed for this?",
    options: [
      { key: "A", text: "AWS Directory Service" },
      { key: "B", text: "AWS IAM Identity Center" },
      { key: "C", text: "Amazon Cognito" },
      { key: "D", text: "AWS Control Tower" }
    ],
    correctAnswer: "B",
    trickAlert: "AWS IAM Identity Center (formerly AWS Single Sign-On) is the correct service for central single sign-on across accounts. Cognito is for customer-facing mobile applications.",
    correctExplanation: "Option B is correct. AWS IAM Identity Center makes it easy to centrally manage SSO access to all of your AWS accounts and cloud applications.",
    distractorExplanations: {
      A: "Incorrect. Directory Service integrates corporate directories but doesn't handle the central SAML SaaS single sign-on directly without IAM integration.",
      B: "Correct. IAM Identity Center is the native AWS single sign-on hub.",
      C: "Incorrect. Cognito is for app customers logging in, not corporate staff managing multi-account access.",
      D: "Incorrect. Control Tower configures landing zones but isn't the direct identity single sign-on portal."
    }
  },
  {
    id: "q-33",
    domainId: "security-compliance",
    domainName: "Security & Compliance",
    scenario: "A security analyst needs to investigate a potential data security breach. They need a service that automatically gathers and analyzes data from VPC Flow Logs, CloudTrail, and GuardDuty to construct a graph-based view of the security event. Which service should they use?",
    options: [
      { key: "A", text: "Amazon Inspector" },
      { key: "B", text: "Amazon Detective" },
      { key: "C", text: "AWS Security Hub" },
      { key: "D", text: "AWS CloudTrail" }
    ],
    correctAnswer: "B",
    trickAlert: "Amazon Detective analyzes security events and creates graph-based visual relationships. CloudTrail logs events but does not perform graph-based relation analysis.",
    correctExplanation: "Option B is correct. Amazon Detective makes it easy to analyze, investigate, and quickly identify the root cause of security findings or suspicious activities.",
    distractorExplanations: {
      A: "Incorrect. Inspector is a vulnerability scanner for EC2 package registries.",
      B: "Correct. Amazon Detective is the forensic analysis service that maps visual relationship graphs of security events.",
      C: "Incorrect. Security Hub aggregates active posture warnings but doesn't build forensic logs and relationship flows.",
      D: "Incorrect. CloudTrail logs raw API calls but does not analyze them forensic-style in visual graphs."
    }
  },

  // ==========================================
  // DOMAIN 3: TECHNOLOGY & SERVICES (34 to 55)
  // ==========================================
  {
    id: "q-34",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A batch processing job can be interrupted at any time without affecting the final result. The business wants to run these jobs at the absolute lowest cost possible. Which Amazon EC2 pricing model is the most cost-effective?",
    options: [
      { key: "A", text: "On-Demand Instances" },
      { key: "B", text: "Spot Instances" },
      { key: "C", text: "Dedicated Hosts" },
      { key: "D", text: "Reserved Instances" }
    ],
    correctAnswer: "B",
    trickAlert: "If workloads are interruptible, choose Spot Instances (up to 90% discount). Dedicated Hosts are the most expensive, and Reserved/Savings Plans require long-term commitments.",
    correctExplanation: "Option B is correct. Spot Instances use spare EC2 capacity and are available at up to a 90% discount compared to On-Demand. AWS can reclaim them with a 2-minute warning, making them perfect for fault-tolerant, interruptible workloads.",
    distractorExplanations: {
      A: "Incorrect. On-Demand is more expensive and billed by the second without discount.",
      B: "Correct. Spot offers the highest discount for workloads that can be terminated.",
      C: "Incorrect. Dedicated Hosts are physical servers dedicated to a single customer, representing a high-cost option.",
      D: "Incorrect. Reserved Instances require a 1 or 3-year commitment, violating the flexible interruptible nature."
    }
  },
  {
    id: "q-35",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A company has a steady, predictable core database workload that must run 24/7. They want to secure maximum cost savings over a 3-year period but require the flexibility to change instance families during that time. Which option should they select?",
    options: [
      { key: "A", text: "Spot Instances" },
      { key: "B", text: "Compute Savings Plans" },
      { key: "C", text: "Standard Reserved Instances" },
      { key: "D", text: "On-Demand Billing" }
    ],
    correctAnswer: "B",
    trickAlert: "Compute Savings Plans offer up to 66% discount and support changing instance families (unlike Standard Reserved Instances which are locked to specific configurations). Spot is for interruptible workloads, not 24/7 databases.",
    correctExplanation: "Option B is correct. Compute Savings Plans provide maximum flexibility (applying across families, regions, and even Lambda/Fargate) while securing discounts for a 1 or 3-year commitment.",
    distractorExplanations: {
      A: "Incorrect. Spot can be reclaimed by AWS, making it highly unsuitable for a core database.",
      B: "Correct. Compute Savings Plans combine high discounts with instance flexibility.",
      C: "Incorrect. Standard Reserved Instances do not allow changing instance families (only Convertible RIs do).",
      D: "Incorrect. On-Demand billing has no commitments but charges full price, maximizing costs."
    }
  },
  {
    id: "q-36",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A system administrator needs high-performance, short-term, temporary block storage to cache transient logs for an application running on EC2. The data has no persistence requirements, and the lowest latency is desired. What storage should they use?",
    options: [
      { key: "A", text: "Amazon EBS gp3 SSD" },
      { key: "B", text: "EC2 Instance Store" },
      { key: "C", text: "Amazon EFS File System" },
      { key: "D", text: "Amazon S3 Standard" }
    ],
    correctAnswer: "B",
    trickAlert: "EBS gp3 is persistent storage. If a question specifies temporary, transient, or ephemeral block storage with maximum speed, choose EC2 Instance Store.",
    correctExplanation: "Option B is correct. EC2 Instance Store is physical block storage directly attached to the host server. It is ephemeral (data is lost when the instance is stopped or terminated) but offers extremely high speeds and low latency.",
    distractorExplanations: {
      A: "Incorrect. EBS volumes are network-attached, persistent, and survive instance stopping, resulting in slightly higher overhead than physical instance stores.",
      B: "Correct. Highlights the ephemeral, high-speed, host-attached nature of Instance Store.",
      C: "Incorrect. EFS is shared network file storage, which has higher network latencies.",
      D: "Incorrect. S3 is object storage accessed via HTTP, unsuitable for high-speed local block caching."
    }
  },
  {
    id: "q-37",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A media agency needs to host static images and CSS files for a globally accessed website. These files must be accessible directly via web URLs, scale automatically to petabytes, and support public access permissions. Which storage service matches this?",
    options: [
      { key: "A", text: "Amazon EBS" },
      { key: "B", text: "Amazon S3" },
      { key: "C", text: "Amazon EFS" },
      { key: "D", text: "AWS Storage Gateway" }
    ],
    correctAnswer: "B",
    trickAlert: "EBS and EFS are drive formats which require attaching to a virtual machine (EC2) first. They cannot serve direct web URLs. Only Amazon S3 is serverless object storage accessible directly via HTTP.",
    correctExplanation: "Option B is correct. Amazon Simple Storage Service (S3) is an object storage service that offers industry-leading scalability, data availability, and web-accessible object URLs.",
    distractorExplanations: {
      A: "Incorrect. EBS is block storage representing virtual hard drives; it cannot serve files directly over HTTP without a web server.",
      B: "Correct. S3 is object storage that serves files directly over the web.",
      C: "Incorrect. EFS is file system storage that requires mounting to EC2 instances, not direct public URL access.",
      D: "Incorrect. Storage Gateway connects on-premises environments to cloud storage."
    }
  },
  {
    id: "q-38",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A business has millions of legacy S3 files. The access patterns for these files are highly variable and completely unpredictable — some are accessed daily, and others are never accessed. They want to optimize costs automatically without sacrificing performance or manually moving objects. Which storage class should they use?",
    options: [
      { key: "A", text: "Amazon S3 Standard-IA" },
      { key: "B", text: "Amazon S3 Glacier Flexible Retrieval" },
      { key: "C", text: "Amazon S3 Intelligent-Tiering" },
      { key: "D", text: "Amazon S3 Glacier Instant Retrieval" }
    ],
    correctAnswer: "C",
    trickAlert: "If access patterns are 'unknown' or 'unpredictable', always choose Amazon S3 Intelligent-Tiering. It automatically shifts data between frequent and infrequent access tiers without retrieval fees.",
    correctExplanation: "Option C is correct. Amazon S3 Intelligent-Tiering is designed to optimize costs by automatically moving data to the most cost-effective access tier when access patterns change, with zero operational overhead.",
    distractorExplanations: {
      A: "Incorrect. Infrequent Access charges high retrieval fees if the access patterns turn out to be high volume, which is risky for unpredictable data.",
      B: "Incorrect. Glacier requires retrieval wait times, violating the requirement of no performance sacrifices.",
      C: "Correct. Intelligent-Tiering handles dynamic automatic shifting for unpredictable workloads.",
      D: "Incorrect. Glacier Instant Retrieval has higher storage costs and retrieval fees if the data is accessed frequently."
    }
  },
  {
    id: "q-39",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A developer wants to write a short microservice script that processes incoming image uploads. The script should only run when an image is uploaded, execute in less than 5 seconds, and require zero virtual server maintenance. Which service is best?",
    options: [
      { key: "A", text: "Amazon EC2" },
      { key: "B", text: "AWS Lambda" },
      { key: "C", text: "AWS Elastic Beanstalk" },
      { key: "D", text: "Amazon ECS with EC2 Launch Type" }
    ],
    correctAnswer: "B",
    trickAlert: "If a task is short-lived, event-driven (runs only on upload), and requires zero server maintenance, AWS Lambda (serverless) is the correct answer.",
    correctExplanation: "Option B is correct. AWS Lambda is a serverless, event-driven compute service that lets you run code without provisioning or managing servers, billing only for execution milliseconds.",
    distractorExplanations: {
      A: "Incorrect. EC2 requires renting and maintaining a virtual server 24/7, which is expensive and complex for a 5-second script.",
      B: "Correct. AWS Lambda is the premier serverless, event-driven, short-lived compute engine.",
      C: "Incorrect. Elastic Beanstalk deploys web applications on active, persistent server clusters.",
      D: "Incorrect. ECS on EC2 requires provisioning and patching container host virtual instances."
    }
  },
  {
    id: "q-40",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A DevOps engineer wants to run Docker containers on AWS. They want a fully managed container orchestration service that supports native Kubernetes APIs. Which service matches this?",
    options: [
      { key: "A", text: "Amazon Elastic Container Service (ECS)" },
      { key: "B", text: "Amazon Elastic Kubernetes Service (EKS)" },
      { key: "C", text: "AWS Fargate" },
      { key: "D", text: "AWS App Runner" }
    ],
    correctAnswer: "B",
    trickAlert: "ECS is AWS's proprietary container orchestrator. EKS is the Kubernetes-compatible container orchestrator. Fargate is a serverless execution engine, not an orchestrator.",
    correctExplanation: "Option B is correct. Amazon EKS is a managed Kubernetes service that makes it easy to run Kubernetes on AWS without needing to install or operate your own control plane.",
    distractorExplanations: {
      A: "Incorrect. ECS is AWS's proprietary container management engine; it does not support Kubernetes APIs natively.",
      B: "Correct. Amazon EKS represents the native managed Kubernetes system on AWS.",
      C: "Incorrect. AWS Fargate is a serverless compute engine used *by* ECS or EKS to run containers, not an orchestrator itself.",
      D: "Incorrect. App Runner is a simplified container deployment pipeline, not a full Kubernetes orchestrator."
    }
  },
  {
    id: "q-41",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A startup wants to run containers but does not want to provision, patch, manage, or scale any underlying virtual machines or EC2 instances to act as hosts. Which serverless container compute engine meets this?",
    options: [
      { key: "A", text: "Amazon ECS with EC2 Launch Type" },
      { key: "B", text: "AWS Fargate" },
      { key: "C", text: "Amazon Elastic Beanstalk" },
      { key: "D", text: "Amazon S3 Batch Operations" }
    ],
    correctAnswer: "B",
    trickAlert: "AWS Fargate is the serverless compute engine for container services (ECS/EKS). It removes the need to provision or manage EC2 server nodes.",
    correctExplanation: "Option B is correct. AWS Fargate is a serverless, pay-as-you-go compute engine that lets you focus on building applications without managing servers.",
    distractorExplanations: {
      A: "Incorrect. ECS on EC2 requires you to manage and maintain the host EC2 virtual server nodes.",
      B: "Correct. AWS Fargate is the serverless compute resource that runs container workloads on-demand.",
      C: "Incorrect. Elastic Beanstalk automates deployment but still provisions visible EC2 instances for you to manage.",
      D: "Incorrect. S3 Batch Operations runs mass file updates, not Docker containers."
    }
  },
  {
    id: "q-42",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A network architect is setting up a Virtual Private Cloud (VPC). They need to ensure that database servers in a private subnet can download operating system patches from the internet, but prevent any external devices on the public internet from establishing inbound connections to those databases. What should they deploy?",
    options: [
      { key: "A", text: "Internet Gateway (IGW)" },
      { key: "B", text: "NAT Gateway" },
      { key: "C", text: "VPC Peering Connection" },
      { key: "D", text: "Virtual Private Gateway" }
    ],
    correctAnswer: "B",
    trickAlert: "Internet Gateways allow two-way (inbound and outbound) public traffic. NAT Gateways allow outbound-only traffic from private subnets while blocking inbound-initiated traffic.",
    correctExplanation: "Option B is correct. A NAT (Network Address Translation) Gateway allows instances in a private subnet to connect to services outside your VPC, but prevents external systems from initiating connections.",
    distractorExplanations: {
      A: "Incorrect. Internet Gateways allow direct inbound connections from the public internet, violating the security requirement.",
      B: "Correct. NAT Gateway is the native tool for securing outbound-only internet routes from private subnets.",
      C: "Incorrect. VPC Peering connects two isolated VPC private networks together.",
      D: "Incorrect. Virtual Private Gateway is used to connect a secure VPN tunnel, not the public internet."
    }
  },
  {
    id: "q-43",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "An engineer is deploying a database. They require Multi-AZ synchronous replication for automated disaster recovery, automatic operating system updates, and automated scaling of storage. Which database service is most appropriate?",
    options: [
      { key: "A", text: "Amazon DynamoDB" },
      { key: "B", text: "Amazon RDS" },
      { key: "C", text: "Amazon Redshift" },
      { key: "D", text: "Amazon ElastiCache" }
    ],
    correctAnswer: "B",
    trickAlert: "DynamoDB is NoSQL (not relational). Amazon RDS is the fully managed relational database service that supports Multi-AZ deployments, automatic backups, and scaling.",
    correctExplanation: "Option B is correct. Amazon Relational Database Service (RDS) makes it easy to set up, operate, and scale a relational database (SQL) in the cloud, including Multi-AZ high availability.",
    distractorExplanations: {
      A: "Incorrect. DynamoDB is NoSQL, not a standard SQL database service with typical Multi-AZ synchronous failover architectures.",
      B: "Correct. Amazon RDS is the direct managed relational database hosting service.",
      C: "Incorrect. Redshift is a column-oriented analytical data warehouse, not an operational relational database.",
      D: "Incorrect. ElastiCache is an in-memory caching system designed to speed up read operations, not a primary database."
    }
  },
  {
    id: "q-44",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A company wants to decrease loading latency for their web application for users located in Tokyo, even though their primary database and servers are hosted in the Northern Virginia region. Which service should they implement?",
    options: [
      { key: "A", text: "AWS Direct Connect" },
      { key: "B", text: "Amazon Route 53" },
      { key: "C", text: "Amazon CloudFront" },
      { key: "D", text: "AWS Transit Gateway" }
    ],
    correctAnswer: "C",
    trickAlert: "Decreasing web loading latency globally by caching content closer to users is the core function of Amazon CloudFront, AWS's Content Delivery Network (CDN).",
    correctExplanation: "Option C is correct. Amazon CloudFront is a Content Delivery Network (CDN) that delivers static and dynamic web content globally using a network of Edge Locations, caching assets near users.",
    distractorExplanations: {
      A: "Incorrect. Direct Connect establishes a private physical network wire between an office and AWS; it does not cache web content for global end-users.",
      B: "Incorrect. Route 53 is a DNS routing service. While it can direct users to regional endpoints, it does not cache static page assets directly.",
      C: "Correct. CloudFront caches static media, HTML, and assets globally using Edge Locations to minimize latency.",
      D: "Incorrect. Transit Gateway connects multiple VPC networks together, it does not handle web caching."
    }
  },
  {
    id: "q-45",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A company wants to route web traffic to different servers based on which location has the absolute lowest round-trip network transmission speed (lowest millisecond delay) for the end-user. Which Route 53 routing policy should they configure?",
    options: [
      { key: "A", text: "Geolocation Routing Policy" },
      { key: "B", text: "Latency Routing Policy" },
      { key: "C", text: "Weighted Routing Policy" },
      { key: "D", text: "Failover Routing Policy" }
    ],
    correctAnswer: "B",
    trickAlert: "Geolocation routes based on user's geographic location (e.g. EU users go to EU server). Latency routing routes based on network measurement (lowest millisecond delay), which is different.",
    correctExplanation: "Option B is correct. Route 53 Latency Routing routes traffic to the AWS resource that provides the lowest network latency (fastest round-trip time) for the user.",
    distractorExplanations: {
      A: "Incorrect. Geolocation routes traffic based on the geographic origin (country/state) of the user, which doesn't guarantee the lowest millisecond network latency.",
      B: "Correct. Latency Routing is optimized strictly for round-trip speeds.",
      C: "Incorrect. Weighted routing splits traffic by percentages (e.g., 80% to v1, 20% to v2).",
      D: "Incorrect. Failover routing is used for active-passive disaster recovery setups."
    }
  },
  {
    id: "q-46",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A business wants to connect their local, on-premises office network directly to their AWS VPC. They require a dedicated, physical network connection that completely bypasses the public internet to secure stable network throughput. Which service should they choose?",
    options: [
      { key: "A", text: "AWS Site-to-Site VPN" },
      { key: "B", text: "AWS Direct Connect" },
      { key: "C", text: "AWS Transit Gateway" },
      { key: "D", text: "Amazon VPC Peering" }
    ],
    correctAnswer: "B",
    trickAlert: "Site-to-Site VPN is secure but still encrypts and tunnels traffic over the *public* internet. Only AWS Direct Connect is a dedicated *physical* line that bypasses the public internet.",
    correctExplanation: "Option B is correct. AWS Direct Connect links your internal network to an AWS Direct Connect location over a standard fiber-optic cable, bypassing the internet for optimal speed and privacy.",
    distractorExplanations: {
      A: "Incorrect. Site-to-Site VPN is fast to set up but uses the public internet, meaning throughput can be volatile.",
      B: "Correct. Direct Connect is a physical, private telecommunication line directly into AWS infrastructure.",
      C: "Incorrect. Transit Gateway aggregates VPC connections, it does not act as a physical fiber link.",
      D: "Incorrect. VPC Peering connects isolated cloud networks together, not physical offices."
    }
  },
  {
    id: "q-47",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A database administrator wants to speed up read queries for an online store's PostgreSQL database by caching frequent queries in memory. Which service is designed for this?",
    options: [
      { key: "A", text: "Amazon RDS PostgreSQL Multi-AZ" },
      { key: "B", text: "Amazon ElastiCache" },
      { key: "C", text: "Amazon Redshift" },
      { key: "D", text: "Amazon DynamoDB DAX" }
    ],
    correctAnswer: "B",
    trickAlert: "DynamoDB DAX is an in-memory cache *only* for DynamoDB. For caching relational databases (PostgreSQL/MySQL), use Amazon ElastiCache (Redis/Memcached).",
    correctExplanation: "Option B is correct. Amazon ElastiCache is a fully managed in-memory data store and cache service that speeds up database read queries for relational engines.",
    distractorExplanations: {
      A: "Incorrect. RDS Multi-AZ replicates data for disaster recovery; it does not cache queries in RAM for speed optimization.",
      B: "Correct. ElastiCache provides managed Redis or Memcached clusters to cache database queries.",
      C: "Incorrect. Redshift is an analytical data warehouse, not an in-memory query cache.",
      D: "Incorrect. Amazon DynamoDB DAX is a specialized cache designed exclusively for NoSQL DynamoDB tables, not PostgreSQL."
    }
  },
  {
    id: "q-48",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A data analyst needs to query petabytes of structured historic sales data to generate annual business reports. The system must support complex column-oriented analytics and aggregate queries. Which service is best suited?",
    options: [
      { key: "A", text: "Amazon RDS for MySQL" },
      { key: "B", text: "Amazon DynamoDB" },
      { key: "C", text: "Amazon Redshift" },
      { key: "D", text: "Amazon Aurora" }
    ],
    correctAnswer: "C",
    trickAlert: "RDS and Aurora are for daily online transactional processing (OLTP). Massive petabyte-scale column-oriented analytics (OLAP) require Amazon Redshift.",
    correctExplanation: "Option C is correct. Amazon Redshift is a fast, fully managed, petabyte-scale data warehouse designed for column-oriented Online Analytical Processing (OLAP) queries.",
    distractorExplanations: {
      A: "Incorrect. RDS MySQL is designed for transactional database processing, not petabyte-scale analytics.",
      B: "Incorrect. DynamoDB is NoSQL, which does not support complex analytical joins or historic columnar aggregates efficiently.",
      C: "Correct. Redshift is the native AWS petabyte columnar data warehouse service.",
      D: "Incorrect. Aurora is an OLTP relational database, not an analytical data warehouse."
    }
  },
  {
    id: "q-49",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A development team wants to deploy a web application. They want a Platform as a Service (PaaS) solution where they can simply upload their Java code, and AWS will automatically handle provisioning, load balancing, scaling, and application monitoring. Which service meets this?",
    options: [
      { key: "A", text: "AWS CloudFormation" },
      { key: "B", text: "AWS Elastic Beanstalk" },
      { key: "C", text: "AWS Systems Manager" },
      { key: "D", text: "AWS CodePipeline" }
    ],
    correctAnswer: "B",
    trickAlert: "CloudFormation is Infrastructure as Code (requires writing configuration templates). Elastic Beanstalk is PaaS (you upload code, AWS handles the infrastructure automatically).",
    correctExplanation: "Option B is correct. AWS Elastic Beanstalk is an easy-to-use Platform as a Service (PaaS) that automates the deployment and scaling of web apps developed with Java, .NET, PHP, Node.js, Python, Ruby, Go, and Docker.",
    distractorExplanations: {
      A: "Incorrect. CloudFormation requires you to manually write JSON/YAML templates defining all resources, violating the 'just upload code' condition.",
      B: "Correct. Elastic Beanstalk is the native AWS PaaS which handles environment provisioning for uploaded code.",
      C: "Incorrect. Systems Manager operationally manages running servers, it does not act as a code deployment platform.",
      D: "Incorrect. CodePipeline is a CI/CD workflow tool, not an application hosting environment."
    }
  },
  {
    id: "q-50",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A company wants to write JSON or YAML templates to define and provision their entire AWS infrastructure (VPCs, EC2 instances, S3 buckets) in a repeatable, automated manner. What practice and service represents this?",
    options: [
      { key: "A", text: "AWS Elastic Beanstalk" },
      { key: "B", text: "AWS OpsWorks" },
      { key: "C", text: "AWS CloudFormation" },
      { key: "D", text: "AWS CodeDeploy" }
    ],
    correctAnswer: "C",
    trickAlert: "Writing templates to define infrastructure represents Infrastructure as Code (IaC), which is the primary focus of AWS CloudFormation.",
    correctExplanation: "Option C is correct. AWS CloudFormation allows you to model, provision, and manage AWS and third-party resources by treating infrastructure as code via JSON/YAML templates.",
    distractorExplanations: {
      A: "Incorrect. Elastic Beanstalk is a PaaS where you upload software code, not templates that define infrastructure components.",
      B: "Incorrect. OpsWorks is a configuration management service that uses Chef and Puppet.",
      C: "Correct. CloudFormation is the premier AWS Infrastructure as Code (IaC) templating engine.",
      D: "Incorrect. CodeDeploy is a deployment agent used to install packages on active servers."
    }
  },
  {
    id: "q-51",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A cloud architect is designing a decoupled system. They want an asynchronous message queue service where worker servers can pull messages from a buffer queue one by one, ensuring no messages are lost if a server goes offline. Which service is designed for this?",
    options: [
      { key: "A", text: "Amazon Simple Notification Service (SNS)" },
      { key: "B", text: "Amazon Simple Queue Service (SQS)" },
      { key: "C", text: "Amazon Simple Email Service (SES)" },
      { key: "D", text: "Amazon EventBridge" }
    ],
    correctAnswer: "B",
    trickAlert: "SNS is a publish-subscribe service (pushes messages to all subscribers simultaneously). SQS is a queue buffer service (receives, stores, and lets workers pull messages sequentially).",
    correctExplanation: "Option B is correct. Amazon SQS is a fully managed message queuing service that enables you to decouple and scale microservices, distributed systems, and serverless applications.",
    distractorExplanations: {
      A: "Incorrect. Amazon SNS is a push notification service that broadcasts messages instantly without a pulling buffer queue.",
      B: "Correct. SQS provides message queues for pulling and buffering asynchronous transactions.",
      C: "Incorrect. Amazon SES is for sending transactional and marketing emails.",
      D: "Incorrect. Amazon EventBridge is an event router (event bus) rather than a durable pulling queue."
    }
  },
  {
    id: "q-52",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "An enterprise wants to migrate their legacy Oracle database from their local data center to Amazon RDS PostgreSQL. Which AWS service can perform this heterogeneous database engine migration and schema conversion?",
    options: [
      { key: "A", text: "AWS Database Migration Service (DMS)" },
      { key: "B", text: "AWS Application Migration Service (MGN)" },
      { key: "C", text: "AWS Schema Translation Engine (STE)" },
      { key: "D", text: "AWS Snowball Edge" }
    ],
    correctAnswer: "A",
    trickAlert: "AWS DMS (Database Migration Service) handles relational database replication and includes the Schema Conversion Tool (SCT) to migrate heterogeneous engines (Oracle to Postgres).",
    correctExplanation: "Option A is correct. AWS DMS helps you migrate databases to AWS quickly and securely, keeping the source database operational during the migration. It supports heterogeneous conversions.",
    distractorExplanations: {
      A: "Correct. DMS is the native database migration tool, converting database schemas and syncing records.",
      B: "Incorrect. Application Migration Service (MGN) replicates physical server blocks, not specific relational database rows.",
      C: "Incorrect. Fictitious service name (the actual tool is the AWS Schema Conversion Tool, which is a feature of DMS).",
      D: "Incorrect. Snowball Edge is a physical storage transfer device, not a database migration schema converter."
    }
  },
  {
    id: "q-53",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A logistics company needs to physically migrate 150 Terabytes of archival files from a remote research facility with slow, unreliable internet connections. Which AWS physical hardware family should they request to copy the data locally?",
    options: [
      { key: "A", text: "AWS Direct Connect Hub" },
      { key: "B", text: "AWS Snowball Edge Storage Optimized" },
      { key: "C", text: "AWS Storage Gateway Local VM" },
      { key: "D", text: "AWS Outposts Rack" }
    ],
    correctAnswer: "B",
    trickAlert: "AWS Snowball Edge is a physical rugged device shipped to your office to copy data locally and then shipped back to AWS. Perfect for offline, massive transfer.",
    correctExplanation: "Option B is correct. AWS Snowball Edge Storage Optimized provides physical rugged devices with up to 80 TB of storage capacity, shipped to your site for secure local transfers.",
    distractorExplanations: {
      A: "Incorrect. Direct Connect requires a dedicated internet telecommunication wire, which is impossible due to the specified slow, unreliable internet.",
      B: "Correct. Snowball Edge is the standard physical offline shipping appliance.",
      C: "Incorrect. Storage Gateway mounts cloud drives locally, requiring a high-speed stable internet connection.",
      D: "Incorrect. AWS Outposts runs AWS hardware on-premises permanently, it is not a temporary migration shipping crate."
    }
  },
  {
    id: "q-54",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "An administrator wants to audit all API actions taken on their AWS resources, including tracking which specific IAM user deleted an EC2 instance at 3:15 PM. Which service logs these API operations?",
    options: [
      { key: "A", text: "Amazon CloudWatch" },
      { key: "B", text: "AWS CloudTrail" },
      { key: "C", text: "AWS Systems Manager Log Stream" },
      { key: "D", text: "AWS Trusted Advisor" }
    ],
    correctAnswer: "B",
    trickAlert: "CloudWatch monitors performance metrics (CPU usage, RAM, log files). CloudTrail audits API calls (who did what, when, and from what IP). Remember: 'CloudTrail is for audits, CloudWatch is for performance'.",
    correctExplanation: "Option B is correct. AWS CloudTrail is a service that enables governance, compliance, operational auditing, and risk auditing of your AWS account by logging API calls.",
    distractorExplanations: {
      A: "Incorrect. CloudWatch tracks resource performance metrics and alarms, not API call identities or audit histories.",
      B: "Correct. CloudTrail logs who made the API call (e.g. EC2 deletions, S3 creations) for auditing.",
      C: "Incorrect. Systems Manager handles operational commands but does not provide account-wide API governance history.",
      D: "Incorrect. Trusted Advisor is a security and cost recommendation advisor, not an active log collector."
    }
  },
  {
    id: "q-55",
    domainId: "cloud-technology",
    domainName: "Technology & Services",
    scenario: "A business wants to run AWS services and deploy EC2 instances directly inside their own physical, on-premises corporate data center to support strict local latency mandates. Which AWS physical hardware cabinet supports this hybrid setup?",
    options: [
      { key: "A", text: "AWS Wavelength" },
      { key: "B", text: "AWS Local Zones" },
      { key: "C", text: "AWS Outposts" },
      { key: "D", text: "AWS Snowcone" }
    ],
    correctAnswer: "C",
    trickAlert: "AWS Outposts brings physical AWS server racks directly into your physical data center. Wavelength is for 5G mobile edge, and Local Zones are AWS-owned facilities near cities.",
    correctExplanation: "Option C is correct. AWS Outposts is a fully managed service that offers the same AWS infrastructure, AWS services, APIs, and tools to virtually any datacenter or co-location space.",
    distractorExplanations: {
      A: "Incorrect. AWS Wavelength embeds AWS compute in 5G mobile networks, not your local office.",
      B: "Incorrect. Local Zones are AWS data centers located near metro hubs, they do not install physical racks in *your* private data center.",
      C: "Correct. AWS Outposts physical racks provide on-premises hybrid AWS capabilities.",
      D: "Incorrect. Snowcone is a small physical shipping block for data migrations, not a permanent rack server."
    }
  },

  // ==========================================
  // DOMAIN 4: BILLING & PRICING (56 to 65)
  // ==========================================
  {
    id: "q-56",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "A startup CTO is designing a hypothetical multi-tier cloud environment and wants to estimate the expected monthly cost of 5 EC2 instances, 2 RDS databases, and 500 GB of S3 storage before actually provisioning any resources. What tool should they use?",
    options: [
      { key: "A", text: "AWS Cost Explorer" },
      { key: "B", text: "AWS Pricing Calculator" },
      { key: "C", text: "AWS Budgets" },
      { key: "D", text: "AWS Billing Conductor" }
    ],
    correctAnswer: "B",
    trickAlert: "AWS Cost Explorer analyzes *past* active costs. To estimate costs for a hypothetical *future* environment before building it, always use the AWS Pricing Calculator.",
    correctExplanation: "Option B is correct. The AWS Pricing Calculator is a web-based planning tool to create cost estimates for your proposed AWS use cases.",
    distractorExplanations: {
      A: "Incorrect. Cost Explorer requires active spending data inside your account to display retrospectively; it cannot model non-existent workloads.",
      B: "Correct. AWS Pricing Calculator models and estimates costs for non-provisioned infrastructure.",
      C: "Incorrect. AWS Budgets sets up alarms for current workloads, it does not calculate hypothetical model rates.",
      D: "Incorrect. Billing Conductor is for customizing billing templates for clients."
    }
  },
  {
    id: "q-57",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "A parent company manages 15 distinct AWS accounts across various subsidiaries. They want to pay a single consolidated invoice, share volume discounts (like S3 tier rates) across all accounts, and centrally allocate funds. Which service enables this?",
    options: [
      { key: "A", text: "AWS Cost Explorer" },
      { key: "B", text: "AWS Billing Conductor" },
      { key: "C", text: "AWS Organizations" },
      { key: "D", text: "AWS Control Tower" }
    ],
    correctAnswer: "C",
    trickAlert: "Consolidated Billing and shared volume pricing discounts are core features of AWS Organizations, which consolidates multiple member accounts under a single payer account.",
    correctExplanation: "Option C is correct. AWS Organizations supports Consolidated Billing, enabling companies to aggregate usage across multiple accounts to receive volume discounts and pay a single invoice.",
    distractorExplanations: {
      A: "Incorrect. Cost Explorer only reports costs; it does not aggregate multiple billing structures into one invoice.",
      B: "Incorrect. AWS Billing Conductor helps custom-brand billing calculations for resale, but doesn't consolidate base account invoices.",
      C: "Correct. AWS Organizations is the administrative framework that supports centralized multi-account billing.",
      D: "Incorrect. Control Tower automates safe landings and multi-account guardrails but does not manage billing invoices."
    }
  },
  {
    id: "q-58",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "A startup wants to configure proactive alerts that trigger email notifications when their projected monthly spending is forecasted to cross $200. They do not want to stop any databases or delete any instances automatically, only to trigger alarms. What tool should they use?",
    options: [
      { key: "A", text: "AWS Cost Explorer Forecasting Rules" },
      { key: "B", text: "AWS Budgets" },
      { key: "C", text: "AWS Trusted Advisor Cost Hub" },
      { key: "D", text: "AWS Organizations Billing Alerts" }
    ],
    correctAnswer: "B",
    trickAlert: "Cost Explorer has visual forecasts but does not send proactive alarms. Trusted Advisor lists suggestions. Only AWS Budgets allows you to configure alarms on forecasted or actual spend.",
    correctExplanation: "Option B is correct. AWS Budgets allows you to set custom budgets and configure email or SNS alerts when your actual or forecasted costs cross a threshold.",
    distractorExplanations: {
      A: "Incorrect. Cost Explorer is a retrospective reporting interface, not a proactive alerting engine.",
      B: "Correct. AWS Budgets handles proactive limit notifications.",
      C: "Incorrect. Trusted Advisor points out idle databases, but cannot set customizable dollar-threshold alerts.",
      D: "Incorrect. AWS Organizations consolidated billing does not provide customizable dollar alarms natively without attaching Budgets."
    }
  },
  {
    id: "q-59",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "A company wants an AWS support plan that provides access to a designated Technical Account Manager (TAM) who acts as a proactive strategic advisor, and a response time of less than 15 minutes for critical business-down outages. What is the minimum support plan required?",
    options: [
      { key: "A", text: "Business Support Plan" },
      { key: "B", text: "Enterprise Support Plan" },
      { key: "C", text: "Developer Support Plan" },
      { key: "D", text: "Enterprise On-Ramp Support Plan" }
    ],
    correctAnswer: "B",
    trickAlert: "A designated, dedicated TAM (Technical Account Manager) is only included in the Enterprise Support Plan. Enterprise On-Ramp gives access to a TAM 'pool', not a designated TAM.",
    correctExplanation: "Option B is correct. The Enterprise Support Plan is the only plan that includes a designated, dedicated Technical Account Manager (TAM) and a 15-minute response time for critical outages.",
    distractorExplanations: {
      A: "Incorrect. Business Support has a minimum 1-hour response time and has no TAM access.",
      B: "Correct. Enterprise Support provides a designated TAM and 15-minute response SLA.",
      C: "Incorrect. Developer support only has business-hour email access with no TAM or critical SLA.",
      D: "Incorrect. Enterprise On-Ramp provides a *pool* of TAMs, not a dedicated/designated TAM, and has a 30-minute critical response SLA."
    }
  },
  {
    id: "q-60",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "An administrator wants to categorize their AWS bills by department. They want to assign key-value labels to resources (e.g., Department=Finance, Environment=Prod) so they can track individual project expenditures in Cost Explorer. What mechanism should they use?",
    options: [
      { key: "A", text: "AWS Billing Conductor templates" },
      { key: "B", text: "Cost Allocation Tags" },
      { key: "C", text: "AWS Budgets limits" },
      { key: "D", text: "Resource Isolation Groups" }
    ],
    correctAnswer: "B",
    trickAlert: "Using key-value metadata labels (like Department=Finance) on resources to track costs in billing reports is the definition of Cost Allocation Tags.",
    correctExplanation: "Option B is correct. Cost Allocation Tags are key-value metadata labels that you attach to AWS resources. Once activated, AWS uses them to organize your resource costs on your cost allocation report.",
    distractorExplanations: {
      A: "Incorrect. Billing Conductor customizes bills for external clients, not internal resource metadata categorizations.",
      B: "Correct. Cost Allocation Tags allow granular billing tracking in Cost Explorer.",
      C: "Incorrect. AWS Budgets sets up notifications, it does not apply key-value categorization labels to raw virtual resources.",
      D: "Incorrect. Fictitious organization concept."
    }
  },
  {
    id: "q-61",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "A software startup wants 24/7 access to cloud support engineers via phone, chat, and email, and a 1-hour response SLA for production system outages, but does not require a Technical Account Manager. Which support plan is most cost-effective for them?",
    options: [
      { key: "A", text: "Developer Support Plan" },
      { key: "B", text: "Business Support Plan" },
      { key: "C", text: "Enterprise Support Plan" },
      { key: "D", text: "Basic Support Plan" }
    ],
    correctAnswer: "B",
    trickAlert: "Developer Support does not provide phone/chat support (email only) and has no 1-hour SLA. Business Support is the lowest plan that offers 24/7 phone/chat and a 1-hour response for production issues.",
    correctExplanation: "Option B is correct. The Business Support Plan offers 24/7 access to cloud support engineers, a 1-hour production down SLA, and general architectural guidance, without the premium cost of Enterprise plans.",
    distractorExplanations: {
      A: "Incorrect. Developer plan has no phone or chat access and only provides email support during standard business hours.",
      B: "Correct. Business Support delivers 24/7 live assistance and a 1-hour production down SLA.",
      C: "Incorrect. Enterprise is much more expensive and includes TAMs, which the company explicitly said they do not require.",
      D: "Incorrect. Basic plan is free but provides no technical support or response SLAs."
    }
  },
  {
    id: "q-62",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "Which AWS billing support mechanism provides specialized help for billing and account inquiries, helping customers manage invoices, billing disputes, and account queries across any support plan level?",
    options: [
      { key: "A", text: "Technical Account Manager (TAM)" },
      { key: "B", text: "AWS Support Concierge" },
      { key: "C", text: "AWS Trusted Advisor" },
      { key: "D", text: "AWS Systems Manager Compliance" }
    ],
    correctAnswer: "B",
    trickAlert: "TAMs advise on *technical* architecture. The Support Concierge is a specialized billing expert dedicated strictly to *billing and invoice* questions (included in Enterprise support).",
    correctExplanation: "Option B is correct. The Support Concierge is a billing and account specialist who assists with non-technical inquiries, invoice explanations, and billing best practices.",
    distractorExplanations: {
      A: "Incorrect. TAMs are technical advisors, not billing concierge desk agents.",
      B: "Correct. Highlights the role of the AWS Support Concierge for billing assistance.",
      C: "Incorrect. Trusted Advisor is an automated tool, not a human concierge desk.",
      D: "Incorrect. Systems Manager handles backend server patching."
    }
  },
  {
    id: "q-63",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "An enterprise is auditing their commercial software licenses (like Microsoft SQL Server and Oracle DB). They want to track, manage, and prevent violations of these license caps across all EC2 hosts. Which service helps automate this tracking?",
    options: [
      { key: "A", text: "AWS Artifact" },
      { key: "B", text: "AWS License Manager" },
      { key: "C", text: "AWS Organizations" },
      { key: "D", text: "AWS Config" }
    ],
    correctAnswer: "B",
    trickAlert: "AWS License Manager is specifically built to track software license limits and prevent licensing overruns on EC2.",
    correctExplanation: "Option B is correct. AWS License Manager makes it easy to manage your software licenses from vendors (such as Microsoft, SAP, Oracle, and IBM) across AWS and on-premises environments.",
    distractorExplanations: {
      A: "Incorrect. AWS Artifact is for legal auditor reports of AWS, not tracking your custom software licenses.",
      B: "Correct. License Manager is the direct license tracker for host-based software.",
      C: "Incorrect. AWS Organizations is for multi-account billing.",
      D: "Incorrect. AWS Config tracks configuration history but does not govern licensing metrics."
    }
  },
  {
    id: "q-64",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "A business wants to explore, purchase, and immediately deploy verified third-party firewalls and security scanning software that integrates directly with AWS billing. Where should they browse these listings?",
    options: [
      { key: "A", text: "AWS Artifact Portal" },
      { key: "B", text: "AWS Marketplace" },
      { key: "C", text: "AWS Partner Network (APN)" },
      { key: "D", text: "AWS Service Catalog" }
    ],
    correctAnswer: "B",
    trickAlert: "AWS Marketplace is the official digital catalog where customers find, buy, test, and deploy third-party software that runs on AWS.",
    correctExplanation: "Option B is correct. AWS Marketplace is a curated digital catalog that makes it easy for customers to find, buy, consume, and manage third-party software, services, and data.",
    distractorExplanations: {
      A: "Incorrect. Artifact is for downloading regulatory papers.",
      B: "Correct. AWS Marketplace is the transactional store for third-party software integrations.",
      C: "Incorrect. APN is a network of global consulting partners, not an online digital software store.",
      D: "Incorrect. AWS Service Catalog is for managing your company's own approved internal cloud resources, not public third-party purchases."
    }
  },
  {
    id: "q-65",
    domainId: "billing-pricing",
    domainName: "Billing & Pricing",
    scenario: "A financial startup wants to receive automated alerts if their current AWS bill exhibits sudden, unexpected spikes in usage that depart from historical spend baselines. Which tool should they configure?",
    options: [
      { key: "A", text: "AWS Pricing Calculator" },
      { key: "B", text: "AWS Cost Anomaly Detection" },
      { key: "C", text: "AWS Billing Conductor" },
      { key: "D", text: "AWS Trusted Advisor Alerts" }
    ],
    correctAnswer: "B",
    trickAlert: "While AWS Budgets alarms on specified flat dollar thresholds, AWS Cost Anomaly Detection uses machine learning to identify unexpected spikes in billings.",
    correctExplanation: "Option B is correct. AWS Cost Anomaly Detection is a free service that uses machine learning to continuously monitor your cost and usage to detect unusual spend spikes.",
    distractorExplanations: {
      A: "Incorrect. Pricing Calculator is for estimating upfront costs, not detecting active billing anomalies.",
      B: "Correct. AWS Cost Anomaly Detection uses ML to track dynamic cost discrepancies and notify you.",
      C: "Incorrect. Billing Conductor helps customize billing accounts, it doesn't spot active usage anomalies.",
      D: "Incorrect. Trusted Advisor checks basic limits, it does not do real-time ML-based billing spike alerts."
    }
  }
];

export const distractorVault: DistractorItem[] = [
  {
    id: "v-1",
    title: "AWS Shield Standard vs. AWS Shield Advanced",
    category: "Security & Protection",
    serviceA: "AWS Shield Standard",
    serviceB: "AWS Shield Advanced",
    serviceAUsage: "Automatically enabled for free to protect against basic Layer 3 & 4 DDoS attacks across all AWS resources.",
    serviceBUsage: "Paid subscription ($3,000/month) offering tailored protection, DDoS cost protection, 24/7 access to the DDoS Response Team (DRT), and advanced detection.",
    keyTrap: "If a question asks for basic, free, automatic DDoS protection, choose Shield Standard. If it mentions cost protection or 24/7 access to a specialized DDoS response team, choose Shield Advanced."
  },
  {
    id: "v-2",
    title: "AWS WAF vs. Amazon GuardDuty",
    category: "Security & Threat Detection",
    serviceA: "AWS WAF (Web Application Firewall)",
    serviceB: "Amazon GuardDuty",
    serviceAUsage: "Filters active web traffic (Layer 7) to block SQL injections, Cross-Site Scripting (XSS), and bad bots.",
    serviceBUsage: "Intelligent threat detection scanning system logs (VPC Flow, CloudTrail, DNS) using machine learning to detect active server intrusions.",
    keyTrap: "WAF intercepts HTTP/S traffic at the perimeter (blocks bad requests). GuardDuty does NOT block traffic at the firewall; it scans logs in the background to report anomalies."
  },
  {
    id: "v-3",
    title: "S3 Glacier Flexible Retrieval vs. S3 Glacier Deep Archive",
    category: "Storage",
    serviceA: "S3 Glacier Flexible Retrieval",
    serviceB: "S3 Glacier Deep Archive",
    serviceAUsage: "Archival class with flexible retrieval options: Expedited (1-5 mins), Standard (3-5 hours), and Bulk (5-12 hours).",
    serviceBUsage: "Cheapest storage class in AWS. Designed for long-term archiving where access is required only in 12-48 hours.",
    keyTrap: "Glacier Flexible Retrieval is chosen when a retrieval speed of minutes (1-5 min expedited) is needed. Glacier Deep Archive is for ultra-low cost where waiting 12 hours is acceptable."
  },
  {
    id: "v-4",
    title: "Security Groups vs. Network ACLs (NACLs)",
    category: "Networking",
    serviceA: "Security Groups",
    serviceB: "Network ACLs",
    serviceAUsage: "Stateful firewalls operating at the individual EC2 instance level. Automatically allow response traffic.",
    serviceBUsage: "Stateless firewalls operating at the VPC Subnet level. Must explicitly configure inbound and outbound rules.",
    keyTrap: "Security Groups are 'Stateful' (no need to open outbound port if inbound is allowed). Network ACLs are 'Stateless' (you MUST open outbound port manually for response packages)."
  },
  {
    id: "v-5",
    title: "AWS Budgets vs. AWS Cost Explorer",
    category: "Billing & Cost Optimization",
    serviceA: "AWS Budgets",
    serviceB: "AWS Cost Explorer",
    serviceAUsage: "Used to set custom cost/usage limits and configure proactive email notifications when thresholds are crossed.",
    serviceBUsage: "Interactive reporting tool to visually chart past costs, examine spending patterns, and forecast future trends.",
    keyTrap: "AWS Budgets is PROACTIVE (sets alerts for the future). AWS Cost Explorer is RETROSPECTIVE (provides visuals and charts of past expenditures to analyze)."
  },
  {
    id: "v-6",
    title: "Amazon EBS vs. Amazon EFS",
    category: "Storage",
    serviceA: "Amazon EBS (Elastic Block Store)",
    serviceB: "Amazon EFS (Elastic File System)",
    serviceAUsage: "High-performance block storage acting as a virtual hard drive for a single EC2 instance inside one Availability Zone.",
    serviceBUsage: "Serverless, shared network file storage mounted simultaneously by hundreds of virtual instances across multiple zones.",
    keyTrap: "EBS is locked to a single Availability Zone and instance. EFS is multi-AZ, serverless, and supports concurrent attachment."
  },
  {
    id: "v-7",
    title: "AWS Trusted Advisor vs. AWS Inspector",
    category: "Audit & Best Practice",
    serviceA: "AWS Trusted Advisor",
    serviceB: "Amazon Inspector",
    serviceAUsage: "Scans your entire account to recommend best practices in five areas: security, cost, performance, fault tolerance, and limits.",
    serviceBUsage: "Targeted vulnerability scanner specifically for Amazon EC2 instances and container images, checking for software bugs (CVEs).",
    keyTrap: "Trusted Advisor scans your *entire account architecture* against basic best practices (e.g. MFA turned off, idle databases). Inspector scans *individual software packages* running inside virtual machines."
  }
];
