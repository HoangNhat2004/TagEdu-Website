# TagEdu Platform Product Requirements Document (PRD)

## 1. Goals and Background Context

### Goals
- Deliver an engaging browser-based coding journey for children ages 6-15 that sustains long-term learning motivation.
- Enable a clear and confidence-building transition from block-based coding to text-based Python.
- Introduce TagEdu AI Tutor as an in-world guide that provides scaffolded hints without giving direct final answers.
- Align mission-based learning outcomes to CSTA standards for parent, educator, and school credibility.
- Provide child-safe, privacy-first experiences compliant with COPPA/GDPR-K expectations.
- Establish measurable MVP outcomes for engagement, progression, and tutoring effectiveness.

### Background Context
TagEdu is designed to solve a persistent gap in coding education for children: products that are highly engaging often lack rigorous progression to real coding, while products that emphasize syntax and depth can overwhelm beginners. The platform combines a narrative-first learning model ("Legend the Turtle" space missions), age-adaptive user experience, and structured computational thinking progression to keep learners engaged while developing durable skills.

The product strategy centers on delivering educational depth without sacrificing accessibility. The MVP focuses on one complete mission arc, block-to-text progression, and a policy-constrained AI tutor that coaches learners through conceptual and directional hints rather than answer delivery. This approach supports learner independence, reduces frustration-driven dropout, and gives parents/educators transparent standards-linked progress in a safe, trusted environment.

### Change Log
| Date | Version | Description | Author |
|---|---|---|---|
| 2026-03-20 | v0.1 | Initial PRD draft created from project brief and requirements analysis | John (PM) |
| 2026-03-20 | v0.2 | Added full PRD draft in YOLO mode (requirements, UI goals, technical assumptions, epics, stories) | John (PM) |

## 2. Requirements

### Functional
1. **FR1:** The system shall provide age-banded onboarding that routes learners into appropriate pathways for ages 6-8, 9-11, and 12-15.
2. **FR2:** The platform shall deliver a narrative mission experience featuring "Legend the Turtle" with chapter progression and mission objectives.
3. **FR3:** The coding workspace shall support block-based coding for beginner cohorts.
4. **FR4:** The coding workspace shall support text-based Python editing for advanced cohorts.
5. **FR5:** The platform shall provide a hybrid bridge mode where block logic and corresponding Python code are shown in synchronized views.
6. **FR6:** Learners shall be able to run code and receive immediate visual output in a mission canvas.
7. **FR7:** The runtime shall detect execution errors and route them through a child-friendly error translation layer.
8. **FR8:** The platform shall include TagEdu AI Tutor as an in-context guide available during coding activities.
9. **FR9:** TagEdu AI Tutor shall provide tiered help progression: conceptual hints, directional hints, and syntax-focused hints.
10. **FR10:** TagEdu AI Tutor shall avoid revealing final puzzle solutions in protected/assessment mission steps.
11. **FR11:** The tutor experience shall log hint requests, hint levels delivered, and learner response outcomes for analytics.
12. **FR12:** The system shall show mission progress to learners with completion state and next recommended step.
13. **FR13:** The system shall provide a parent/educator dashboard with learner progress and standards-linked visibility.
14. **FR14:** Curriculum items shall map to CSTA-referenced learning objectives and expose mapping metadata in reporting.
15. **FR15:** The platform shall support account linkage between child profiles and verified parent/educator guardians.
16. **FR16:** The system shall provide consent-aware account flows for minor users before full feature activation.
17. **FR17:** Community interactions (if enabled in MVP) shall be restricted to predefined safe reactions with no free-text peer chat.
18. **FR18:** The platform shall provide an internal content model for missions, coding tasks, hints, and narrative dialogue.
19. **FR19:** The system shall support policy configuration for tutor behavior by mission type (practice vs assessment).
20. **FR20:** Product analytics shall track activation, mission completion, retention, and tutoring effectiveness metrics.

### Non Functional
1. **NFR1:** The product shall be accessible as a browser-based web application without mandatory local installation.
2. **NFR2:** The core learner flows shall perform reliably on low-to-mid classroom hardware (e.g., common Chromebooks/tablets).
3. **NFR3:** Rendering and interaction performance shall remain responsive under normal classroom workloads.
4. **NFR4:** The system shall be designed with privacy-by-design principles and data minimization for minors.
5. **NFR5:** Architecture shall support COPPA/GDPR-K-aligned consent, parental controls, retention, and deletion workflows.
6. **NFR6:** The platform shall maintain auditable records for consent, policy decisions, and data lifecycle events.
7. **NFR7:** Tutor guardrails shall be deterministic enough to enforce non-answering behavior in protected contexts.
8. **NFR8:** Critical services shall be observable with logging, metrics, and alerting to support operations and incident response.
9. **NFR9:** The system shall be modular so curriculum content can scale without major platform rewrites.
10. **NFR10:** The architecture shall support secure handling of untrusted learner code execution and isolation boundaries.
11. **NFR11:** Security controls shall apply least-privilege access for administrative and reporting interfaces.
12. **NFR12:** The platform shall support regional compliance extension as launch geographies expand.

## 3. User Interface Design Goals

### Overall UX Vision
TagEdu's UX should feel like an adventure game with real educational rigor. Younger users should see simplified, highly visual interactions, while older users gradually gain a professional coding workspace. The experience must reduce intimidation, reward persistence, and make every coding action feel tied to mission progress.

### Key Interaction Paradigms
- Story-first mission navigation with clear objective prompts.
- Learn-by-doing coding loops (edit -> run -> observe -> improve).
- Guided help via TagEdu AI Tutor with progressive hint escalation.
- Progressive disclosure of complexity by age and proficiency.
- Positive feedback loops that reward effort, debugging, and completion.

### Core Screens and Views
- Age-aware onboarding and guardian linkage flow.
- Learner home/mission map.
- Mission briefing screen (story + goals + constraints).
- Coding studio (instructions, editor, output canvas, tutor panel).
- Run results and error guidance panel.
- Standards/progress summary for learners.
- Parent/educator dashboard.
- Consent/privacy settings and account controls.

### Accessibility: WCAG AA
The MVP targets WCAG AA baseline for web UI, including color contrast, keyboard navigation for core flows, readable typography, and non-color-only cues for key coding states.

### Branding
- Space adventure theme anchored around Legend the Turtle and the TagEdu robot tutor.
- Dark-space base palette with high-contrast accents to emphasize interactive elements.
- Visual consistency between block colors and equivalent syntax highlights in text mode.
- Child-safe, encouraging tone in microcopy, tutor prompts, and error messaging.

### Target Device and Platforms: Web Responsive
Web responsive experience optimized for desktop and tablet browsers in home and classroom settings.

## 4. Technical Assumptions

### Repository Structure: Monorepo
Monorepo to centralize product app, shared domain models, tutor policy modules, content schemas, and analytics contracts for faster coordinated delivery in MVP.

### Service Architecture
Modular monolith for MVP with clear domain boundaries:
- Learning/missions domain
- Coding runtime bridge domain
- Tutor policy and hint orchestration domain
- Accounts/consent domain
- Reporting/analytics domain

This keeps early operational complexity lower than microservices while preserving clean extraction paths post-MVP.

### Testing Requirements
Unit + Integration baseline:
- Unit tests for tutor policy enforcement and curriculum mapping logic.
- Integration tests for core learner journey (mission start -> coding run -> hinting -> completion).
- Integration tests for consent/guardian flows and protected tutoring behavior.
- Manual exploratory testing for age-banded UX and learning flow quality.

### Additional Technical Assumptions and Requests
- Python-first text track for MVP; additional languages post-MVP.
- Runtime strategy may use staged engine choices by cohort/performance needs.
- Tutor logs must avoid storing sensitive child content beyond minimum required telemetry.
- Policy engine for "allowed assistance" vs "disallowed direct answer" must be configurable by mission step.
- Analytics events should be versioned to support future data model evolution.
- Parent-facing reporting requires standards mapping metadata from day one.

## 5. Epic List
- **Epic 1: Foundation, Accounts, and Safety Rails** - Establish deployable platform foundations, account/guardian flows, and compliance guardrails while delivering first usable learner entry points.
- **Epic 2: Mission Learning Core and Coding Runtime** - Deliver the core narrative mission loop with coding workspace and executable visual feedback.
- **Epic 3: TagEdu AI Tutor and Error Guidance** - Launch guided tutoring and child-friendly debugging support without direct answer leakage.
- **Epic 4: Progress Reporting and Standards Visibility** - Deliver learner and parent/educator progress insights with CSTA-linked transparency and MVP success instrumentation.

## 6. Epic Details

## Epic 1 Foundation, Accounts, and Safety Rails
Create the operational and product foundation required for safe learning experiences with minors. This epic delivers account lifecycle, child-guardian linkage, consent controls, and baseline deployability so subsequent learning features can ship on secure rails.

### Story 1.1 Project setup and deployable baseline
As a product team member,
I want a deployable web app baseline with CI and environment configuration,
so that all subsequent features can be delivered and validated quickly and safely.

#### Acceptance Criteria
1. Source repository contains a runnable application scaffold with documented local setup.
2. CI executes tests/lint and reports status on pull requests.
3. Staging environment deployment is automated from main branch.
4. Health-check endpoint/page verifies application availability.

### Story 1.2 Child and guardian account flows
As a parent or educator,
I want to create and link child learner profiles to my account,
so that I can supervise progress and controls.

#### Acceptance Criteria
1. Guardian account creation and authentication are available.
2. Guardian can create at least one linked learner profile.
3. Linked learners are visible in guardian context and isolated from other families.
4. Profile management supports basic edit and deactivation workflows.

### Story 1.3 Consent and privacy controls for minors
As a guardian,
I want consent and data controls before learner access is fully enabled,
so that child safety and legal requirements are met.

#### Acceptance Criteria
1. Consent-aware onboarding blocks full learner activation until required guardian action is complete.
2. Consent status is stored with timestamp and auditable history.
3. Guardian can request data access and deletion through product controls.
4. Data retention/deletion paths are implemented as MVP workflows with operational logs.

### Story 1.4 Safe interaction boundaries
As a platform operator,
I want interaction safeguards that prevent unsafe peer communication,
so that the MVP remains child-safe by default.

#### Acceptance Criteria
1. Free-text peer chat is disabled in MVP.
2. Any social feedback mechanisms are limited to approved predefined reactions.
3. Moderation/policy hooks exist for future social expansion.
4. Safety defaults are enabled for all learner accounts.

## Epic 2 Mission Learning Core and Coding Runtime
Deliver the educational heart of TagEdu: narrative missions, coding workspace, and immediate run feedback. This epic provides a complete learner coding loop and the first mission arc value before advanced tutoring.

### Story 2.1 Mission and content model
As a curriculum designer,
I want a structured mission content model for story, objectives, and coding tasks,
so that learning chapters can be authored consistently.

#### Acceptance Criteria
1. Content schema supports mission metadata, objectives, narrative prompts, and coding challenge definitions.
2. Missions can be loaded/rendered by the learner app from structured content.
3. Versioning approach exists for mission content updates.
4. At least one full introductory mission arc is modeled in the system.

### Story 2.2 Learner mission map and briefing
As a learner,
I want to navigate a mission map and receive clear mission briefings,
so that I know what to do next and why it matters in the story.

#### Acceptance Criteria
1. Learner home shows current chapter progression and next mission.
2. Mission briefing includes objective, success condition, and story context.
3. Mission states (locked, available, completed) are clearly represented.
4. UX is age-adaptive for younger vs older learners.

### Story 2.3 Coding studio with block and text modes
As a learner,
I want an editor that supports my current skill level and progression path,
so that I can code effectively as I advance.

#### Acceptance Criteria
1. Beginner pathway supports block-based coding interactions.
2. Advanced pathway supports Python text editing.
3. Hybrid mode can display synchronized logic between block and text representations.
4. Mode availability respects learner level configuration.

### Story 2.4 Run and visual output feedback loop
As a learner,
I want to run my code and see immediate mission-relevant visual output,
so that I can learn through rapid iteration.

#### Acceptance Criteria
1. Run action executes learner code for the active task.
2. Output canvas updates with mission-relevant visual behavior.
3. Execution failures produce captured error events for downstream guidance.
4. Run cycle performance is responsive for normal classroom usage.

## Epic 3 TagEdu AI Tutor and Error Guidance
Introduce personalized support that increases completion and confidence while preserving productive struggle. This epic operationalizes the non-answering tutor philosophy with enforceable policy and measurable outcomes.

### Story 3.1 Child-friendly error translation
As a learner,
I want technical runtime errors translated into understandable guidance,
so that I can recover without frustration.

#### Acceptance Criteria
1. Common syntax/runtime error categories map to child-friendly messages.
2. Guidance includes what happened, where to look, and a suggested next step.
3. Messaging tone is encouraging and age-appropriate.
4. Raw low-level errors remain available for internal diagnostics only.

### Story 3.2 Tutor hint progression engine
As a learner,
I want hints that grow in specificity only as needed,
so that I can solve problems independently with support.

#### Acceptance Criteria
1. Tutor supports at least three hint levels: conceptual, directional, syntax-focused.
2. Hint escalation considers learner attempts and prior hint history.
3. Tutor prompts include guiding questions, not just instructions.
4. Learner can request additional hint level explicitly.

### Story 3.3 Non-answering tutor policy enforcement
As a product owner,
I want strict guardrails that prevent answer dumping in protected activities,
so that learning integrity and assessment value are preserved.

#### Acceptance Criteria
1. Mission tasks can be marked as protected/assessment contexts.
2. Tutor policy blocks direct final solution output in protected contexts.
3. Policy outcomes are logged for compliance and tuning.
4. Guardrail tests validate representative evasion attempts.

### Story 3.4 Tutor telemetry and effectiveness analytics
As a product analyst,
I want tutor interaction telemetry linked to learning outcomes,
so that we can tune hint strategies and improve completion.

#### Acceptance Criteria
1. Events capture hint request, hint level, learner follow-up action, and outcome.
2. Dashboard-ready aggregates support hint effectiveness analysis.
3. Telemetry respects data minimization constraints for child users.
4. Metrics can be segmented by age band and mission type.

## Epic 4 Progress Reporting and Standards Visibility
Provide transparent evidence of learning progression and platform value to guardians and educators. This epic turns educational activity into understandable, trustworthy progress reporting aligned with standards.

### Story 4.1 Standards mapping integration
As a curriculum lead,
I want each mission task linked to standards metadata,
so that progress can be reported against recognized learning objectives.

#### Acceptance Criteria
1. Standards mapping metadata is attached to relevant mission activities.
2. Mapping supports reporting queries without manual post-processing.
3. Mapping quality checks catch missing or invalid references.
4. Initial MVP missions have complete mapping coverage.

### Story 4.2 Learner progress dashboard
As a learner,
I want to see my progress and milestones,
so that I stay motivated and understand what to do next.

#### Acceptance Criteria
1. Dashboard shows chapter completion and recent achievements.
2. Learner view includes next recommended mission/task.
3. Progress updates reflect latest mission outcomes.
4. UI language is age-appropriate and encouraging.

### Story 4.3 Parent/educator progress dashboard
As a guardian or educator,
I want a clear view of learning progress and support usage,
so that I can monitor outcomes and provide help when needed.

#### Acceptance Criteria
1. Dashboard summarizes mission progress and standards-linked status.
2. Dashboard shows high-level tutor usage indicators without exposing sensitive raw content.
3. Multi-learner guardians can switch between linked child profiles.
4. Data displayed reflects latest available telemetry with clear timestamps.

### Story 4.4 MVP success instrumentation and reporting
As a product team,
I want KPI instrumentation and baseline reporting in place,
so that MVP success can be measured objectively.

#### Acceptance Criteria
1. KPI events are tracked for activation, mission completion, retention proxy, and tutor effectiveness.
2. KPI definitions are documented and agreed across product and engineering.
3. Baseline pilot report can be generated from collected data.
4. Data quality checks identify missing or malformed events.

## 7. Checklist Results Report
PM checklist execution pending. Run checklist after stakeholder review of PRD scope, requirements, and epic sequencing.

## 8. Next Steps

### UX Expert Prompt
Using `docs/prd.md`, create a UX concept package for TagEdu MVP covering age-adaptive flows (6-8 vs 9-11 vs 12-15), mission map, coding studio, and TagEdu AI Tutor interactions. Emphasize child-safe patterns, readability, and progressive disclosure.

### Architect Prompt
Using `docs/prd.md`, produce an MVP architecture plan for a browser-first coding platform with modular monolith boundaries, secure learner code execution, tutor policy enforcement (non-answering in protected contexts), standards mapping, and compliance-ready data workflows.

