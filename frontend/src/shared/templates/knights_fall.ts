import {
  createAgentChatSettings,
  createAgentMediatorPersonaConfig,
  createAgentParticipantPersonaConfig,
  createChatPromptConfig,
  createChatStage,
  createExperimentConfig,
  createExperimentTemplate,
  createMetadataConfig,
  createParticipantProfileBase,
  createPrivateChatStage,
  createProfileStage,
  createTOSStage,
  createStageProgressConfig,
  createStageTextConfig,
  createDefaultPromptFromText,
  createSurveyStage,
  createScaleSurveyQuestion,
  createTextSurveyQuestion,
  createMultipleChoiceSurveyQuestion,
  createMultipleChoiceItem,
  MultipleChoiceDisplayType,
  AgentMediatorTemplate,
  AgentParticipantTemplate,
  ExperimentTemplate,
  MediatorPromptConfig,
  ParticipantPromptConfig,
  StageConfig,
  StageKind,
  ProfileType,
} from '@deliberation-lab/utils';

// ****************************************************************************
// Metadata
// ****************************************************************************

export const KNIGHTS_FALL_METADATA = createMetadataConfig({
  name: "Knight's Fall: 45 Minutes to Meltdown",
  publicName: 'Incident Response Simulation',
  description:
    'A multi-participant incident response simulation based on a real trading systems ' +
    'catastrophe. Four engineers must coordinate under time pressure to diagnose a ' +
    'cascading production failure — each holding only part of the picture.',
});

// ****************************************************************************
// Stage IDs
// ****************************************************************************

const BRIEFING_SURVEY_ID = 'briefing-survey';
const STANDUP_CHAT_ID = 'group-standup';
const INCIDENT_CHAT_ID = 'group-incident';
const AAR_SURVEY_ID = 'aar-survey';
const ASSESSMENT_CHAT_ID = 'chat-assessment';
const FEEDBACK_SURVEY_ID = 'feedback-survey';

// ****************************************************************************
// Terms of Service
// ****************************************************************************

const TOS_LINES = [
  "**Welcome to Knight's Fall**",
  'This is a multi-participant incident response simulation. You will work with 3 other ' +
    'participants to diagnose a cascading production failure at a fictional trading firm.',
  '**The setting**',
  'It is 9:30 AM on August 1, 2012. You work at Knightbridge Capital Services, a major ' +
    "electronic market-maker. Today is the launch day for the NYSE's new Retail Liquidity " +
    'Program, and your firm deployed new trading software overnight to support it.',
  '**The team** (you will be assigned one of these roles)',
  "\u2022 **Casey Rivera** \ud83d\ude80 (Release Engineer) \u2014 Managed last night's deployment. You pushed the new RLP code to production servers.\n" +
    '\u2022 **Jordan Park** \ud83d\udcca (Trading Systems Engineer) \u2014 Monitors trade execution systems. You watch order flow and execution quality in real time.\n' +
    '\u2022 **Avery Chen** \u26a0\ufe0f (Risk Operations Analyst) \u2014 Monitors positions, P&L, and risk limits. You have authority to recommend halting trading.\n' +
    '\u2022 **Morgan Torres** \ud83d\udd27 (Platform Engineer) \u2014 Manages server infrastructure and deployment pipelines. You can inspect server logs and configurations.',
  '**What to expect**',
  "1. A briefing survey \u2014 read your role's dossier carefully, you'll need it\n" +
    '2. A morning standup \u2014 routine sync before markets open\n' +
    "3. THE INCIDENT \u2014 something goes wrong at market open. The Incident Commander will coordinate your team's response. You must share information, diagnose the problem, and decide on action \u2014 fast.\n" +
    '4. After-action review and assessment',
  '**Key rules**',
  '\u2022 Stay in character \u2014 only share information your role would actually have\n' +
    '\u2022 Time pressure is real \u2014 the longer you take, the worse it gets\n' +
    '\u2022 There is no single person who has the full picture \u2014 you MUST coordinate\n' +
    "\u2022 The IC mediator will facilitate but won't solve it for you",
  '**Data usage**',
  'Your conversations and responses will be recorded for research and assessment purposes. ' +
    'All data is stored securely and used solely to evaluate and improve the simulation.',
  '**Voluntary participation**',
  'Your participation is voluntary. You may exit at any time. By checking the box below ' +
    'and proceeding, you acknowledge that you understand the purpose of this simulation ' +
    'and consent to participate.',
];

// ****************************************************************************
// Role briefings
// ****************************************************************************

const CASEY_BRIEFING =
  '**Casey Rivera (Release Engineer) \ud83d\ude80**\n\n' +
  'Last night you deployed version 3.2 of the RLP trading module to production. The deployment ' +
  'script pushed to all 8 production servers. 7 servers reported clean deployment status. ' +
  'Server 8 (PROD-SRV-08) returned a warning: "SMARS flag state mismatch \u2014 expected: disabled, ' +
  'found: enabled." You dismissed it as a known false positive \u2014 the ops team has seen this ' +
  "warning before on that server and it's been flagged as a monitoring artifact. You completed " +
  'the deployment at 2:47 AM and sent the standard "deploy complete" email to the team. You do ' +
  'NOT have access to trading data or P&L \u2014 you only see deployment and server health metrics.';

const JORDAN_BRIEFING =
  '**Jordan Park (Trading Systems Engineer) \ud83d\udcca**\n\n' +
  "You monitor the firm's trade execution systems from the trading floor. At 9:31 AM (one " +
  'minute after market open), you notice order volume spiking dramatically. The firm is sending ' +
  'buy orders at the ask price and sell orders at the bid price across approximately 150 ' +
  'NYSE-listed stocks \u2014 this is the opposite of market-making (buying low, selling high). The ' +
  "orders are coming from the firm's own SMARS routing system. Volume is roughly 100x normal. " +
  "You can see the orders but you don't know WHY the system is behaving this way. You do NOT " +
  'have access to server logs or deployment information.';

const AVERY_BRIEFING =
  '**Avery Chen (Risk Operations Analyst) \u26a0\ufe0f**\n\n' +
  "You watch the firm's risk dashboard in real time. At 9:32 AM, alerts start firing. Net " +
  'positions are building rapidly across 150+ stocks \u2014 far beyond normal market-making ' +
  'inventory. The real-time P&L is dropping at roughly $10M per minute. By 9:35 AM you estimate ' +
  '$50M in losses and growing. Your risk models show the positions are directional (not hedged) ' +
  'which is extremely unusual for a market-maker. You have the authority to recommend activating ' +
  'the "kill switch" \u2014 halting all outbound orders \u2014 but this is a drastic step that has never ' +
  'been used in production. You do NOT have access to server logs or code.';

const MORGAN_BRIEFING =
  '**Morgan Torres (Platform Engineer) \ud83d\udd27**\n\n' +
  "You manage the firm's production infrastructure. You weren't involved in last night's " +
  'deployment (Casey handled it), but you have full access to server logs, configuration files, ' +
  'and deployment state. If you investigate PROD-SRV-08, you would find: (1) The SMARS feature ' +
  'flag is set to "enabled" on this server while it\'s "disabled" on the other 7, (2) The SMARS ' +
  'module on server 8 is running version 1.8 (legacy code from 2005), not version 3.2 that was ' +
  'deployed, (3) The deployment log shows the push to server 8 completed with warnings but the ' +
  "rollback wasn't triggered. You do NOT have access to trading data or P&L in real time.";

const ALL_BRIEFINGS =
  'Read the briefing for your assigned role carefully. You will need this information during ' +
  'the simulation. Each role has unique information \u2014 no one has the full picture.\n\n' +
  '---\n\n' +
  CASEY_BRIEFING +
  '\n\n---\n\n' +
  JORDAN_BRIEFING +
  '\n\n---\n\n' +
  AVERY_BRIEFING +
  '\n\n---\n\n' +
  MORGAN_BRIEFING;

// ****************************************************************************
// Persona prompts
// ****************************************************************************

const IC_SYSTEM_BASE =
  'You are the Incident Commander (IC) for a production incident response simulation at ' +
  'Knightbridge Capital Services, a fictional electronic market-making firm. Today is August 1, ' +
  "2012 \u2014 launch day for the NYSE's new Retail Liquidity Program. Something has gone wrong at " +
  'market open. Your job is to coordinate the response team, gather information from each role, ' +
  'and help the team diagnose and resolve the issue as quickly as possible. The team consists of ' +
  '4 human participants: Casey (Release Engineer), Jordan (Trading Systems), Avery (Risk Ops), ' +
  'and Morgan (Platform Engineer). Each person has only partial information \u2014 you must ' +
  'facilitate information sharing.';

const IC_STANDUP_PROMPT =
  IC_SYSTEM_BASE +
  '\n\n' +
  'You are leading a quick morning standup before markets open. This is routine. Ask each team ' +
  'member for a brief status update. Casey deployed new code overnight \u2014 check in on that. ' +
  'Jordan and Avery should be ready for market open. Morgan should confirm infrastructure status. ' +
  'Keep it casual and brief \u2014 this is just a normal morning check. After everyone has given an ' +
  'update, wrap up with "Alright, markets open in a few minutes. Let\'s have a good day."';

const IC_INCIDENT_PROMPT =
  IC_SYSTEM_BASE +
  '\n\n' +
  'CRITICAL: Something has gone wrong. At 9:31 AM, anomalous trading activity began. You are ' +
  'now running an active incident response. Your protocol:\n\n' +
  '(1) Immediately declare an incident and establish the bridge call. Start with: ' +
  '"\u26a0\ufe0f INCIDENT DECLARED \u2014 All hands on the bridge. We\'re seeing anomalous trading activity ' +
  'since market open. I need a status from each of you \u2014 Jordan, what are you seeing on the ' +
  "trading floor? Avery, what's the risk dashboard showing? Casey, any issues with last night's " +
  'deploy? Morgan, infrastructure status?"\n\n' +
  '(2) As information comes in, connect the dots by asking follow-up questions. If someone shares ' +
  "a clue, ask others how it relates to what they're seeing.\n\n" +
  '(3) Apply time pressure \u2014 every minute is costing the firm money. Reference the growing losses.\n\n' +
  '(4) Push toward a diagnosis and decision. The team needs to: identify that server 8 has old ' +
  'code, connect that to the erratic trading, and decide whether to kill the trading system.\n\n' +
  '(5) If the team is stuck, ask guiding questions but NEVER give answers directly. Example: ' +
  '"Morgan, Casey mentioned something about server 8 \u2014 can you check the deployment state on ' +
  'that box?"\n\n' +
  '(6) After 15-20 minutes of discussion OR when the team reaches a decision, call the incident ' +
  'resolved and transition to wrap-up.\n\n' +
  'Keep messages 2-4 sentences. Be urgent but not panicked. Use IC language: "status update", ' +
  '"action item", "decision point", "blast radius".';

const EVALUATOR_PROMPT =
  'You are an expert evaluator using the ELIPSS (Enhancing Learning by Improving Process ' +
  'Skills in STEM) rubric framework. You have observed participants coordinate under time ' +
  'pressure to diagnose a cascading production failure at a fictional trading firm. The ' +
  'simulation had four parts:\n\n' +
  '1. A briefing survey where each participant read their role dossier\n' +
  '2. A morning standup \u2014 routine sync before market open\n' +
  '3. THE INCIDENT \u2014 an active incident response where the team had to diagnose and resolve ' +
  'a cascading production failure under time pressure\n' +
  '4. An after-action review survey\n\n' +
  'Score the participant on FIVE ELIPSS process skills using a 0-5 scale:\n' +
  '  0 = Not observed\n' +
  '  1 = Minimal performance\n' +
  '  2 = Between minimal and partial\n' +
  '  3 = Partial performance\n' +
  '  4 = Between partial and complete\n' +
  '  5 = Complete performance\n\n' +
  '---\n\n' +
  '**1. CRITICAL THINKING** \u2014 Forming an argument or reaching a conclusion supported with ' +
  'evidence by evaluating, analyzing, and/or synthesizing relevant information.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Identifying the Aim/Goal: How well did they determine the purpose/context of the ' +
  'argument or conclusion that needed to be made?\n' +
  '(B) Evaluating: How well did they determine the relevance and reliability of information ' +
  'that might be used to support a conclusion or argument?\n' +
  '(C) Analyzing: How accurately did they interpret information to determine meaning and ' +
  'extract relevant evidence?\n' +
  '(D) Synthesizing: How accurately did they connect or integrate information to support ' +
  'an argument or reach a conclusion?\n' +
  '(E) Forming Arguments (Structure): Did their argument include a claim (position), ' +
  'supporting information, and reasoning?\n' +
  '(F) Forming Arguments (Validity): Were the claim, evidence, and reasoning logical and ' +
  'consistent with broadly accepted principles?\n\n' +
  'Where to look: Information sharing under pressure, connecting partial information across ' +
  'roles, proposing and evaluating hypotheses about root cause, building the case for or ' +
  'against activating the kill switch.\n\n' +
  '---\n\n' +
  '**2. INFORMATION PROCESSING** \u2014 Evaluating, interpreting, and manipulating or ' +
  'transforming information.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Evaluating: How well did they determine the significance or relevance of ' +
  'information/data needed for the task?\n' +
  '(B) Interpreting: How accurately did they provide meaning to data, make inferences, ' +
  'or extract patterns?\n' +
  '(C) Manipulating/Transforming (Extent): How completely did they convert information ' +
  'from one form to another?\n' +
  '(D) Manipulating/Transforming (Accuracy): How accurately did they convert information ' +
  'from one form to another?\n\n' +
  'Where to look: How they processed their role-specific data (trading anomalies, risk alerts, ' +
  'deployment logs, server configs) and translated it into actionable information for the team. ' +
  'Did they connect observations across roles to form a coherent picture?\n\n' +
  '---\n\n' +
  '**3. INTERPERSONAL COMMUNICATION** \u2014 Exchanging information and ideas through speaking, ' +
  'listening, and responding.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Speaking: How effectively did they express information and ideas to others? ' +
  '(1=Rarely, 3=Sometimes, 5=Consistently)\n' +
  '(B) Listening: How well did they pay attention to the speaker as information was ' +
  'communicated? (1=Rarely, 3=Sometimes, 5=Consistently)\n' +
  '(C) Responding: How well did they reply or react to the communicated information and ' +
  'ideas? (1=Rarely, 3=Sometimes, 5=Consistently)\n\n' +
  'Where to look: Did they share their role-specific information proactively? Did they ask ' +
  'clarifying questions when others shared partial information? Did they acknowledge and ' +
  'build on what others reported? Did they communicate clearly under time pressure?\n\n' +
  '---\n\n' +
  '**4. PROBLEM SOLVING** \u2014 Analyzing a complex problem, developing a viable strategy, and ' +
  'executing that strategy.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Analyzing the Situation: How well did they determine the scope and complexity of ' +
  'the problem?\n' +
  '(B) Identifying: How well did they determine the information, tools, and resources ' +
  'necessary to solve the problem?\n' +
  '(C) Strategizing: How well did they develop a process (series of steps) to arrive at ' +
  'a solution?\n' +
  '(D) Validating: How well did they judge the reasonableness and completeness of the ' +
  'proposed strategy or solution?\n' +
  '(E) Executing: How well did they implement or communicate the strategy effectively?\n\n' +
  'Where to look: Diagnosing that server 8 has legacy code, connecting the SMARS flag mismatch ' +
  'to the erratic trading, proposing and evaluating the kill switch decision, coordinating ' +
  'with incomplete data across roles.\n\n' +
  '---\n\n' +
  '**5. MANAGEMENT** \u2014 Planning, organizing, coordinating, and monitoring efforts to ' +
  'accomplish a goal.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Planning: How well did they lay out a course of action to accomplish the goal?\n' +
  '(B) Organizing: How well did they prepare/gather the materials, tools, and information ' +
  'needed to progress toward the goal?\n' +
  '(C) Coordinating: How well did they optimize and communicate the distribution of tasks ' +
  'among team members? (1=Rarely, 3=Sometimes, 5=Consistently)\n' +
  '(D) Overseeing: How well did they monitor progress, assess resources, and adjust plans? ' +
  '(1=Rarely, 3=Sometimes, 5=Consistently)\n\n' +
  'Where to look: How they organized their role-specific investigation, whether they proactively ' +
  'coordinated with others, how they managed the tension between speed and thoroughness, ' +
  'whether they tracked the evolving situation and adjusted their approach.\n\n' +
  '---\n\n' +
  'FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:\n\n' +
  '**Overall Assessment**\n' +
  "[2-3 sentence summary of the participant's performance across the incident response.]\n\n" +
  '**1. Critical Thinking** \u2014 [Average]/5\n' +
  '(A) Identifying the Aim/Goal: [X]/5\n' +
  '(B) Evaluating: [X]/5\n' +
  '(C) Analyzing: [X]/5\n' +
  '(D) Synthesizing: [X]/5\n' +
  '(E) Forming Arguments (Structure): [X]/5\n' +
  '(F) Forming Arguments (Validity): [X]/5\n' +
  'Evidence: [1-2 sentences citing specific moments from the incident]\n\n' +
  '**2. Information Processing** \u2014 [Average]/5\n' +
  '(A) Evaluating: [X]/5\n' +
  '(B) Interpreting: [X]/5\n' +
  '(C) Manipulating/Transforming (Extent): [X]/5\n' +
  '(D) Manipulating/Transforming (Accuracy): [X]/5\n' +
  'Evidence: [1-2 sentences]\n\n' +
  '**3. Interpersonal Communication** \u2014 [Average]/5\n' +
  '(A) Speaking: [X]/5\n' +
  '(B) Listening: [X]/5\n' +
  '(C) Responding: [X]/5\n' +
  'Evidence: [1-2 sentences]\n\n' +
  '**4. Problem Solving** \u2014 [Average]/5\n' +
  '(A) Analyzing the Situation: [X]/5\n' +
  '(B) Identifying: [X]/5\n' +
  '(C) Strategizing: [X]/5\n' +
  '(D) Validating: [X]/5\n' +
  '(E) Executing: [X]/5\n' +
  'Evidence: [1-2 sentences]\n\n' +
  '**5. Management** \u2014 [Average]/5\n' +
  '(A) Planning: [X]/5\n' +
  '(B) Organizing: [X]/5\n' +
  '(C) Coordinating: [X]/5\n' +
  '(D) Overseeing: [X]/5\n' +
  'Evidence: [1-2 sentences]\n\n' +
  '**Key Strengths**: [1-2 specific things done well]\n\n' +
  '**Key Recommendation**: [1 specific, actionable area for improvement]\n\n' +
  'IMPORTANT: Be fair but rigorous. Use the full 0-5 scale. A score of 3 means partial ' +
  'performance, not failure. A score of 5 means complete, exemplary performance. Cite ' +
  'specific evidence from the conversations for every score. If a subcategory was not ' +
  'observable in this simulation, score it 0 and note "Not observed."';

const SUBJECT_AGENT_PROMPT =
  'You are an engineer at Knightbridge Capital Services participating in an incident response ' +
  'simulation. In the morning standup, give a brief routine update about your area of ' +
  "responsibility. During the incident, share information from your role's perspective, ask " +
  'questions to other team members, and work toward identifying the root cause. Be collaborative ' +
  "but realistic \u2014 don't immediately know the answer. Piece things together incrementally by " +
  'combining what you know with what others share.\n\n' +
  'Keep messages 1-3 sentences, natural and conversational. Act like a real engineer under ' +
  'pressure \u2014 focused, a bit stressed, but professional.';

// ****************************************************************************
// Stage configs
// ****************************************************************************

function getStageConfigs(): StageConfig[] {
  return [
    // 1. Terms of Service
    createTOSStage({
      name: 'Terms of Service',
      tosLines: TOS_LINES,
      progress: createStageProgressConfig({
        showParticipantProgress: false,
      }),
    }),

    // 2. Set profile
    createProfileStage({
      name: 'Set your profile',
      profileType: ProfileType.DEFAULT,
    }),

    // 3. Briefing survey
    createSurveyStage({
      id: BRIEFING_SURVEY_ID,
      name: 'Role Briefing',
      descriptions: createStageTextConfig({
        primaryText: ALL_BRIEFINGS,
      }),
      questions: [
        createMultipleChoiceSurveyQuestion({
          id: 'assigned-role',
          questionTitle: 'Which role have you been assigned?',
          options: [
            createMultipleChoiceItem({
              id: 'casey',
              text: 'Casey Rivera (Release Engineer)',
            }),
            createMultipleChoiceItem({
              id: 'jordan',
              text: 'Jordan Park (Trading Systems Engineer)',
            }),
            createMultipleChoiceItem({
              id: 'avery',
              text: 'Avery Chen (Risk Operations Analyst)',
            }),
            createMultipleChoiceItem({
              id: 'morgan',
              text: 'Morgan Torres (Platform Engineer)',
            }),
          ],
          displayType: MultipleChoiceDisplayType.RADIO,
        }),
        createTextSurveyQuestion({
          id: 'role-responsibility',
          questionTitle:
            "In 1-2 sentences, what is your role's primary responsibility during an incident?",
          maxCharCount: 300,
        }),
        createTextSurveyQuestion({
          id: 'role-information',
          questionTitle: 'What key information does your role have access to?',
          maxCharCount: 300,
        }),
      ],
    }),

    // 4. Morning standup chat
    createChatStage({
      id: STANDUP_CHAT_ID,
      name: 'Morning Standup',
      descriptions: createStageTextConfig({
        primaryText:
          "It's 9:15 AM \u2014 time for the daily standup before market open. The Incident " +
          'Commander is running a quick sync. Give your routine status update based on your ' +
          'role. This is a normal morning \u2014 nothing has gone wrong yet.',
        infoText:
          'Keep it brief and in character. Only share information your role would have.',
      }),
      timeLimitInMinutes: 5,
    }),

    // 5. Incident chat
    createChatStage({
      id: INCIDENT_CHAT_ID,
      name: 'THE INCIDENT',
      descriptions: createStageTextConfig({
        primaryText:
          'Something has gone wrong at market open. The Incident Commander is coordinating ' +
          "the response. Share what you see from your role's perspective, coordinate with " +
          'your team, diagnose the problem, and decide on action. Every minute counts \u2014 ' +
          'the firm is losing money fast.',
        infoText:
          'Stay in character. Only share information your role would actually have. ' +
          'Listen to what others report and connect the dots together.',
      }),
      timeLimitInMinutes: 25,
    }),

    // 6. After-action review survey
    createSurveyStage({
      id: AAR_SURVEY_ID,
      name: 'After-Action Review',
      descriptions: createStageTextConfig({
        primaryText:
          'The incident is over. Take a few minutes to reflect on how the team performed.',
      }),
      questions: [
        createScaleSurveyQuestion({
          id: 'info-sharing',
          questionTitle: 'How effectively did the team share information?',
          lowerValue: 1,
          lowerText: 'Very poorly',
          upperValue: 5,
          upperText: 'Very effectively',
          middleText: 'Adequately',
        }),
        createScaleSurveyQuestion({
          id: 'root-cause-speed',
          questionTitle: 'How quickly did the team identify the root cause?',
          lowerValue: 1,
          lowerText: 'Very slowly',
          upperValue: 5,
          upperText: 'Very quickly',
          middleText: 'Moderately',
        }),
        createScaleSurveyQuestion({
          id: 'decision-coordination',
          questionTitle:
            'How well did the team coordinate on the decision to act?',
          lowerValue: 1,
          lowerText: 'Very poorly',
          upperValue: 5,
          upperText: 'Very well',
          middleText: 'Adequately',
        }),
        createTextSurveyQuestion({
          id: 'root-cause',
          questionTitle:
            'What was the root cause of the incident, in your own words?',
          maxCharCount: 500,
        }),
        createTextSurveyQuestion({
          id: 'do-differently',
          questionTitle: 'What would you do differently in the next incident?',
          maxCharCount: 500,
        }),
        createTextSurveyQuestion({
          id: 'most-valuable-member',
          questionTitle:
            "Which team member's contribution was most valuable, and why?",
          maxCharCount: 300,
        }),
      ],
    }),

    // 7. Assessment chat (evaluator agent delivers assessment)
    createPrivateChatStage({
      id: ASSESSMENT_CHAT_ID,
      name: 'Assessment',
      descriptions: createStageTextConfig({
        primaryText:
          'Your simulation is complete. An evaluator will now review your performance ' +
          'across all stages using the ELIPSS process skills framework.',
        infoText:
          'Scoring: Critical Thinking, Information Processing, Interpersonal Communication, ' +
          'Problem Solving, and Management \u2014 each scored 0-5 with subcategories.',
      }),
      isTurnBasedChat: false,
      minNumberOfTurns: 0,
      maxNumberOfTurns: 2,
    }),

    // 8. Feedback survey
    createSurveyStage({
      id: FEEDBACK_SURVEY_ID,
      name: 'Feedback',
      descriptions: createStageTextConfig({
        primaryText:
          'Thank you for completing the simulation! Please take a moment to share ' +
          'your feedback. Your responses help us improve the experience.',
      }),
      questions: [
        createMultipleChoiceSurveyQuestion({
          id: 'incident-experience',
          questionTitle:
            'What best describes your experience with incident response or on-call work?',
          options: [
            createMultipleChoiceItem({
              id: 'none',
              text: 'No experience with incident response',
            }),
            createMultipleChoiceItem({
              id: 'observer',
              text: 'Observed incidents but not actively participated',
            }),
            createMultipleChoiceItem({
              id: 'participant',
              text: 'Participated in incident response (1-5 incidents)',
            }),
            createMultipleChoiceItem({
              id: 'experienced',
              text: 'Experienced responder (5-20 incidents)',
            }),
            createMultipleChoiceItem({
              id: 'veteran',
              text: 'Veteran responder or IC (20+ incidents)',
            }),
          ],
          displayType: MultipleChoiceDisplayType.RADIO,
        }),
        createScaleSurveyQuestion({
          id: 'overall-experience',
          questionTitle:
            'How would you rate your overall experience with this simulation?',
          lowerValue: 1,
          lowerText: 'Poor',
          upperValue: 5,
          upperText: 'Excellent',
          middleText: 'Average',
        }),
        createScaleSurveyQuestion({
          id: 'realism',
          questionTitle: 'How realistic did the incident response feel?',
          lowerValue: 1,
          lowerText: 'Not realistic',
          upperValue: 5,
          upperText: 'Very realistic',
          middleText: 'Somewhat realistic',
        }),
        createScaleSurveyQuestion({
          id: 'assessment-helpfulness',
          questionTitle:
            'How helpful was the assessment feedback you received?',
          lowerValue: 1,
          lowerText: 'Not helpful',
          upperValue: 5,
          upperText: 'Very helpful',
          middleText: 'Somewhat helpful',
        }),
        createMultipleChoiceSurveyQuestion({
          id: 'most-valuable-stage',
          questionTitle:
            'Which part of the simulation was most valuable for your learning?',
          options: [
            createMultipleChoiceItem({
              id: 'briefing',
              text: 'Role briefing (understanding partial information)',
            }),
            createMultipleChoiceItem({
              id: 'standup',
              text: 'Morning standup (routine coordination)',
            }),
            createMultipleChoiceItem({
              id: 'incident',
              text: 'The incident (diagnosis under pressure)',
            }),
            createMultipleChoiceItem({
              id: 'aar',
              text: 'After-action review (reflection)',
            }),
            createMultipleChoiceItem({
              id: 'all-equal',
              text: 'They were all equally valuable',
            }),
          ],
          displayType: MultipleChoiceDisplayType.RADIO,
        }),
        createScaleSurveyQuestion({
          id: 'would-recommend',
          questionTitle:
            'How likely are you to recommend this simulation to a colleague?',
          lowerValue: 1,
          lowerText: 'Not likely',
          upperValue: 5,
          upperText: 'Very likely',
          middleText: 'Neutral',
        }),
        createTextSurveyQuestion({
          id: 'what-learned',
          questionTitle:
            'What is one thing you learned or will do differently after this simulation?',
          maxCharCount: 500,
        }),
        createTextSurveyQuestion({
          id: 'improvements',
          questionTitle: 'How could we improve this experience?',
          maxCharCount: 500,
        }),
      ],
    }),
  ];
}

// ****************************************************************************
// Agent mediators (IC + Evaluator)
// ****************************************************************************

function createICMediator(): AgentMediatorTemplate {
  const persona = createAgentMediatorPersonaConfig({
    name: 'IC (Incident Commander)',
    description:
      'Incident Commander who facilitates the standup and coordinates incident response',
    isDefaultAddToCohort: true,
    defaultProfile: createParticipantProfileBase({
      name: 'IC (Incident Commander)',
      avatar: '\ud83d\udea8',
    }),
  });

  const promptMap: Record<string, MediatorPromptConfig> = {};

  // IC in morning standup
  promptMap[STANDUP_CHAT_ID] = createChatPromptConfig(
    STANDUP_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(IC_STANDUP_PROMPT, STANDUP_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 200,
        canSelfTriggerCalls: false,
        maxResponses: 5,
        initialMessage:
          'Good morning everyone. Quick standup before market open. Casey, you were on ' +
          'deploy duty last night \u2014 how did the RLP rollout go? Jordan, Avery, Morgan \u2014 ' +
          'anything to flag before we open?',
      }),
    },
  );

  // IC in incident response
  promptMap[INCIDENT_CHAT_ID] = createChatPromptConfig(
    INCIDENT_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(IC_INCIDENT_PROMPT, INCIDENT_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: null,
        canSelfTriggerCalls: true,
        maxResponses: 20,
        initialMessage:
          "\u26a0\ufe0f INCIDENT DECLARED \u2014 All hands on the bridge. We're seeing anomalous trading " +
          'activity since market open. I need a status from each of you \u2014 Jordan, what are ' +
          "you seeing on the trading floor? Avery, what's the risk dashboard showing? Casey, " +
          "any issues with last night's deploy? Morgan, infrastructure status?",
      }),
    },
  );

  return {persona, promptMap};
}

function createEvaluatorMediator(): AgentMediatorTemplate {
  const persona = createAgentMediatorPersonaConfig({
    name: 'Evaluator',
    description: 'LLM-based assessor that reviews all conversation transcripts',
    isDefaultAddToCohort: true,
    defaultProfile: createParticipantProfileBase({
      name: 'Evaluator',
      avatar: '\ud83d\udcca',
    }),
  });

  const promptMap: Record<string, MediatorPromptConfig> = {};

  // Evaluator references all prior stage contexts to generate assessment
  promptMap[ASSESSMENT_CHAT_ID] = createChatPromptConfig(
    ASSESSMENT_CHAT_ID,
    StageKind.PRIVATE_CHAT,
    {
      prompt: createDefaultPromptFromText(
        EVALUATOR_PROMPT,
        '', // empty stageId = include context from ALL past + current stages
      ),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: null, // auto-send
        canSelfTriggerCalls: false,
        maxResponses: 1,
        minMessagesBeforeResponding: 0,
      }),
    },
  );

  return {persona, promptMap};
}

// ****************************************************************************
// Agent participant (subject-as-agent for in silico testing)
// ****************************************************************************

function createSubjectAgent(): AgentParticipantTemplate {
  const persona = createAgentParticipantPersonaConfig({
    name: 'Engineer (AI Subject)',
    description:
      'AI agent that plays the role of an engineer participant for in silico testing',
    isDefaultAddToCohort: false, // Only add manually when running in silico
    defaultProfile: createParticipantProfileBase({
      name: 'Engineer',
      avatar: '\ud83e\uddd1\u200d\ud83d\udcbb',
    }),
  });

  const promptMap: Record<string, ParticipantPromptConfig> = {};

  // Subject in morning standup
  promptMap[STANDUP_CHAT_ID] = createChatPromptConfig(
    STANDUP_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(
        SUBJECT_AGENT_PROMPT,
        STANDUP_CHAT_ID,
      ),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 150,
        canSelfTriggerCalls: false,
        maxResponses: 3,
      }),
    },
  );

  // Subject in incident response
  promptMap[INCIDENT_CHAT_ID] = createChatPromptConfig(
    INCIDENT_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(
        SUBJECT_AGENT_PROMPT,
        INCIDENT_CHAT_ID,
      ),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 120,
        canSelfTriggerCalls: false,
        maxResponses: 10,
      }),
    },
  );

  return {persona, promptMap};
}

// ****************************************************************************
// Template export
// ****************************************************************************

export function getKnightsFallTemplate(): ExperimentTemplate {
  const stageConfigs = getStageConfigs();
  return createExperimentTemplate({
    experiment: createExperimentConfig(stageConfigs, {
      metadata: KNIGHTS_FALL_METADATA,
    }),
    stageConfigs,
    agentMediators: [createICMediator(), createEvaluatorMediator()],
    agentParticipants: [createSubjectAgent()],
  });
}
