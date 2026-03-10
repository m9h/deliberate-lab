/**
 * Run Thinking Higher experiment in silico using Firebase emulators.
 *
 * Requires:
 *   - Firebase emulators running (./run_locally.sh or manual start)
 *   - Gemini API key saved in experimenter settings (via the DL frontend)
 *
 * Usage:
 *   npx tsx scripts/run_in_silico.ts
 */

import {initializeApp, getApps} from 'firebase-admin/app';
import {getFirestore, Timestamp} from 'firebase-admin/firestore';

// Point at emulators
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FUNCTIONS_EMULATOR_HOST = '127.0.0.1:5001';

const PROJECT_ID = 'deliberate-lab-local';
const EXPERIMENTER_EMAIL = 'experimenter@google.com';

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({projectId: PROJECT_ID});
}
const db = getFirestore();
db.settings({ignoreUndefinedProperties: true});

// Import the template builder
import {getThinkingHigherTemplate} from '../frontend/src/shared/templates/thinking_higher';
import {
  ExperimentTemplate,
  StageKind,
  ChatStageConfig,
  createParticipantProfileExtended,
  createChatStagePublicData,
  setProfile,
  generateId,
} from '@deliberation-lab/utils';

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function verifyExperimenterApiKey(): Promise<void> {
  const ref = db.doc(`experimenterData/${EXPERIMENTER_EMAIL}`);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error(
      'No experimenter data. Save Gemini API key at http://localhost:4201',
    );
  }
  const geminiKey = doc.data()!.apiKeys?.geminiApiKey;
  if (!geminiKey || geminiKey.length === 0) {
    throw new Error(
      'No Gemini API key in settings. Save it at http://localhost:4201',
    );
  }
  console.log(`✓ Gemini API key verified (length: ${geminiKey.length})`);
}

// ============================================================================
// Create experiment from template
// ============================================================================

async function createExperimentFromTemplate(
  template: ExperimentTemplate,
): Promise<string> {
  const experiment = template.experiment;
  const experimentId = experiment.id;
  console.log(`Creating experiment: ${experimentId}`);

  // Write experiment config
  await db.doc(`experiments/${experimentId}`).set({
    ...experiment,
    metadata: {
      ...experiment.metadata,
      creator: EXPERIMENTER_EMAIL,
      dateCreated: Timestamp.now(),
      dateModified: Timestamp.now(),
    },
  });

  // Write stage configs
  for (const stage of template.stageConfigs) {
    await db.doc(`experiments/${experimentId}/stages/${stage.id}`).set(stage);
  }

  // Write agent mediator personas + prompts
  for (const mediator of template.agentMediators ?? []) {
    const personaRef = db.doc(
      `experiments/${experimentId}/agentMediators/${mediator.persona.id}`,
    );
    await personaRef.set(mediator.persona);
    // Write each prompt as a subcollection doc
    for (const [, prompt] of Object.entries(mediator.promptMap)) {
      await personaRef.collection('prompts').doc(prompt.id).set(prompt);
    }
  }

  // Write agent participant personas + prompts
  for (const participant of template.agentParticipants ?? []) {
    const personaRef = db.doc(
      `experiments/${experimentId}/agentParticipants/${participant.persona.id}`,
    );
    await personaRef.set(participant.persona);
    for (const [, prompt] of Object.entries(participant.promptMap)) {
      await personaRef.collection('prompts').doc(prompt.id).set(prompt);
    }
  }

  console.log(
    `✓ Experiment created with ${template.stageConfigs.length} stages, ` +
      `${template.agentMediators?.length ?? 0} mediators, ` +
      `${template.agentParticipants?.length ?? 0} agent participants`,
  );
  return experimentId;
}

// ============================================================================
// Create cohort with mediator instances
// ============================================================================

async function createCohortForExperiment(
  experimentId: string,
): Promise<string> {
  const cohortId = `cohort-${Date.now()}`;
  console.log(`Creating cohort: ${cohortId}`);

  const experiment = (
    await db.doc(`experiments/${experimentId}`).get()
  ).data()!;
  const stageIds: string[] = experiment.stageIds;

  // Build stageUnlockMap — unlock ALL stages for in-silico run
  const stageUnlockMap: Record<string, boolean> = {};
  for (const stageId of stageIds) {
    stageUnlockMap[stageId] = true;
  }

  // Write cohort config
  await db.doc(`experiments/${experimentId}/cohorts/${cohortId}`).set({
    id: cohortId,
    metadata: {
      name: 'In Silico Run',
      description: 'Automated agent-only run',
      creator: EXPERIMENTER_EMAIL,
      dateCreated: Timestamp.now(),
      dateModified: Timestamp.now(),
    },
    participantConfig: experiment.defaultCohortConfig ?? {
      minParticipantsPerCohort: 1,
      maxParticipantsPerCohort: 10,
      includeAllParticipantsInCohortCount: false,
    },
    variableMap: {},
    stageUnlockMap,
  });

  // Create publicStageData for stages that need it
  for (const stageId of stageIds) {
    const stageDoc = await db
      .doc(`experiments/${experimentId}/stages/${stageId}`)
      .get();
    const stage = stageDoc.data()!;

    if (stage.kind === StageKind.CHAT) {
      // Chat stages need ChatStagePublicData
      const publicData = createChatStagePublicData(stage as ChatStageConfig);
      await db
        .doc(
          `experiments/${experimentId}/cohorts/${cohortId}/publicStageData/${stageId}`,
        )
        .set(publicData);
    }
    // Private chat stages don't need public data initialization
  }

  // Create mediator instances in the correct collection: experiments/{id}/mediators/
  const mediatorPersonasSnap = await db
    .collection(`experiments/${experimentId}/agentMediators`)
    .get();
  for (const personaDoc of mediatorPersonasSnap.docs) {
    const persona = personaDoc.data();
    if (!persona.isDefaultAddToCohort) continue;

    // Get prompt stage IDs for activeStageMap
    const promptsSnap = await personaDoc.ref.collection('prompts').get();
    const activeStageMap: Record<string, boolean> = {};
    promptsSnap.docs.forEach((doc) => {
      activeStageMap[doc.id] = true;
    });

    const mediatorId = generateId();
    const mediatorProfile = {
      type: 'mediator',
      publicId: mediatorId.substring(0, 8),
      privateId: mediatorId,
      name: persona.defaultProfile?.name ?? persona.name,
      avatar: persona.defaultProfile?.avatar ?? '',
      pronouns: persona.defaultProfile?.pronouns ?? null,
      currentStatus: 'active',
      currentCohortId: cohortId,
      activeStageMap,
      agentConfig: {
        agentId: persona.id,
        promptContext: '',
        modelSettings: persona.defaultModelSettings,
      },
    };

    await db
      .doc(`experiments/${experimentId}/mediators/${mediatorId}`)
      .set(mediatorProfile);
    console.log(
      `  ✓ Mediator: ${mediatorProfile.name} (stages: ${Object.keys(activeStageMap).join(', ')})`,
    );
  }

  console.log(`✓ Cohort created: ${cohortId}`);
  return cohortId;
}

// ============================================================================
// Create agent participant
// ============================================================================

async function createAgentParticipant(
  experimentId: string,
  cohortId: string,
): Promise<{privateId: string; publicId: string}> {
  console.log('Creating agent participant (Junior SDE)...');

  const experiment = (
    await db.doc(`experiments/${experimentId}`).get()
  ).data()!;

  // Find the agent participant persona
  const agentParticipantsSnap = await db
    .collection(`experiments/${experimentId}/agentParticipants`)
    .get();
  let agentPersona: FirebaseFirestore.DocumentData | null = null;
  for (const doc of agentParticipantsSnap.docs) {
    agentPersona = doc.data();
    break;
  }
  if (!agentPersona) throw new Error('No agent participant persona found');

  // Create participant profile
  const participantConfig = createParticipantProfileExtended({
    currentCohortId: cohortId,
  });
  participantConfig.connected = true;
  participantConfig.currentStageId = experiment.stageIds[0];
  participantConfig.agentConfig = {
    agentId: agentPersona.id,
    promptContext: '',
    modelSettings: agentPersona.defaultModelSettings,
  };

  // Set profile (name/avatar)
  const numParticipants = (
    await db
      .collection(`experiments/${experimentId}/participants`)
      .count()
      .get()
  ).data().count;
  setProfile(numParticipants, participantConfig, false);
  participantConfig.name = agentPersona.defaultProfile?.name ?? 'Junior Dev';
  participantConfig.avatar = agentPersona.defaultProfile?.avatar ?? '👩‍💻';

  // Write participant — this triggers onParticipantCreation → startAgentParticipant
  await db
    .doc(
      `experiments/${experimentId}/participants/${participantConfig.privateId}`,
    )
    .set(participantConfig);
  console.log(
    `✓ Agent participant: ${participantConfig.privateId} (public: ${participantConfig.publicId})`,
  );

  // Wait for onParticipantCreation trigger to fire and auto-advance past TOS/profile
  console.log('  Waiting for triggers to auto-advance past TOS/profile...');
  await sleep(8000);

  return {
    privateId: participantConfig.privateId,
    publicId: participantConfig.publicId,
  };
}

// ============================================================================
// Stage monitoring and advancement
// ============================================================================

async function getParticipantState(
  experimentId: string,
  participantId: string,
) {
  const doc = await db
    .doc(`experiments/${experimentId}/participants/${participantId}`)
    .get();
  return doc.data()!;
}

async function getStageConfig(experimentId: string, stageId: string) {
  const doc = await db
    .doc(`experiments/${experimentId}/stages/${stageId}`)
    .get();
  return doc.data()!;
}

async function advanceParticipantToNextStage(
  experimentId: string,
  participantId: string,
) {
  const experiment = (
    await db.doc(`experiments/${experimentId}`).get()
  ).data()!;
  const participant = await getParticipantState(experimentId, participantId);
  const stageIds: string[] = experiment.stageIds;
  const currentIdx = stageIds.indexOf(participant.currentStageId);

  if (currentIdx >= stageIds.length - 1) {
    // Last stage — mark complete
    participant.currentStatus = 'SUCCESS';
    participant.timestamps.endExperiment = Timestamp.now();
  } else {
    // Complete current stage and move to next
    participant.timestamps.completedStages =
      participant.timestamps.completedStages || {};
    participant.timestamps.completedStages[participant.currentStageId] =
      Timestamp.now();
    participant.currentStageId = stageIds[currentIdx + 1];
    participant.timestamps.readyStages =
      participant.timestamps.readyStages || {};
    participant.timestamps.readyStages[participant.currentStageId] =
      Timestamp.now();
  }

  await db
    .doc(`experiments/${experimentId}/participants/${participantId}`)
    .set(participant);
}

async function getGroupChatMessageCount(
  experimentId: string,
  cohortId: string,
  stageId: string,
): Promise<number> {
  const snap = await db
    .collection(
      `experiments/${experimentId}/cohorts/${cohortId}/publicStageData/${stageId}/chats`,
    )
    .get()
    .catch(() => null);
  return snap?.size ?? 0;
}

async function getGroupChatMessages(
  experimentId: string,
  cohortId: string,
  stageId: string,
) {
  const snap = await db
    .collection(
      `experiments/${experimentId}/cohorts/${cohortId}/publicStageData/${stageId}/chats`,
    )
    .get()
    .catch(() => null);
  if (!snap) return [];
  return snap.docs
    .map((d) => d.data())
    .sort(
      (a, b) => (a.timestamp?._seconds ?? 0) - (b.timestamp?._seconds ?? 0),
    );
}

async function getPrivateChatMessages(
  experimentId: string,
  participantPrivateId: string,
  stageId: string,
) {
  const snap = await db
    .collection(
      `experiments/${experimentId}/participants/${participantPrivateId}/stageData/${stageId}/privateChats`,
    )
    .get()
    .catch(() => null);
  if (!snap) return [];
  return snap.docs
    .map((d) => d.data())
    .sort(
      (a, b) => (a.timestamp?._seconds ?? 0) - (b.timestamp?._seconds ?? 0),
    );
}

/** Count only real (non-error) messages */
function countRealMessages(messages: FirebaseFirestore.DocumentData[]): number {
  return messages.filter(
    (m) =>
      !m.isError &&
      m.message !== 'Error fetching response' &&
      m.message !== 'No mediators found',
  ).length;
}

// ============================================================================
// Main orchestration loop
// ============================================================================

async function orchestrateExperiment(
  experimentId: string,
  cohortId: string,
  participantPrivateId: string,
): Promise<boolean> {
  const experiment = (
    await db.doc(`experiments/${experimentId}`).get()
  ).data()!;
  const stageIds: string[] = experiment.stageIds;

  const stageConfigs: Record<string, FirebaseFirestore.DocumentData> = {};
  for (const sid of stageIds) {
    stageConfigs[sid] = await getStageConfig(experimentId, sid);
  }

  const MAX_WAIT = 600000; // 10 minutes total
  const start = Date.now();
  let lastStageLogged = '';

  while (Date.now() - start < MAX_WAIT) {
    const participant = await getParticipantState(
      experimentId,
      participantPrivateId,
    );
    const currentStageId = participant.currentStageId;
    const status = participant.currentStatus;

    if (
      status === 'SUCCESS' ||
      status === 'BOOTED_OUT' ||
      status === 'DELETED'
    ) {
      console.log(`\n✓ Experiment completed with status: ${status}`);
      return status === 'SUCCESS';
    }

    const stage = stageConfigs[currentStageId];
    if (!stage) {
      console.log(`Unknown stage: ${currentStageId}`);
      break;
    }

    if (currentStageId !== lastStageLogged) {
      console.log(
        `\n--- ${stage.name} (${stage.kind}) [${currentStageId}] ---`,
      );
      lastStageLogged = currentStageId;
    }

    // TOS/Profile/Info: triggers should auto-advance
    if (
      stage.kind === 'tos' ||
      stage.kind === 'profile' ||
      stage.kind === 'info'
    ) {
      console.log(`  Waiting for trigger to auto-advance...`);
      await sleep(5000);

      // If still stuck, manually advance
      const check = await getParticipantState(
        experimentId,
        participantPrivateId,
      );
      if (check.currentStageId === currentStageId) {
        console.log(`  Still stuck — manually advancing past ${stage.kind}`);
        await advanceParticipantToNextStage(experimentId, participantPrivateId);
        await sleep(3000);
      }
      continue;
    }

    // Group chat: triggers handle conversation, we just wait and then advance
    if (stage.kind === StageKind.CHAT) {
      const msgCount = await getGroupChatMessageCount(
        experimentId,
        cohortId,
        currentStageId,
      );
      console.log(`  Group chat messages: ${msgCount}`);

      if (msgCount < 3) {
        // Wait for triggers to generate initial messages and agent participant response
        console.log(
          `  Waiting for chat messages (triggers should handle this)...`,
        );
        await sleep(15000);
        continue;
      }

      // Enough messages — print them
      const messages = await getGroupChatMessages(
        experimentId,
        cohortId,
        currentStageId,
      );
      for (const msg of messages) {
        const name = msg.profile?.name ?? 'Unknown';
        const text = (msg.message ?? '').substring(0, 100);
        console.log(`  [${name}]: ${text}${text.length >= 100 ? '...' : ''}`);
      }

      // Advance to next stage
      console.log(`  Advancing past group chat (${messages.length} messages)`);
      await advanceParticipantToNextStage(experimentId, participantPrivateId);
      await sleep(5000); // Wait for trigger to send initial messages for next stage
      continue;
    }

    // Private chat: triggers handle conversation, we wait and advance
    if (stage.kind === StageKind.PRIVATE_CHAT) {
      const messages = await getPrivateChatMessages(
        experimentId,
        participantPrivateId,
        currentStageId,
      );
      const realCount = countRealMessages(messages);
      console.log(
        `  Private chat: ${realCount} real messages (${messages.length} total)`,
      );

      // For assessment, just need 1 evaluator message; for others, want a real conversation
      const targetMessages = currentStageId === 'chat-assessment' ? 1 : 4;

      if (realCount < targetMessages) {
        console.log(
          `  Waiting for chat exchanges (need ${targetMessages} real, have ${realCount})...`,
        );
        await sleep(15000);
        continue;
      }

      // Print real messages only
      const realMessages = messages.filter(
        (m) =>
          !m.isError &&
          m.message !== 'Error fetching response' &&
          m.message !== 'No mediators found',
      );
      for (const msg of realMessages) {
        const name = msg.profile?.name ?? 'Unknown';
        const text = (msg.message ?? '').substring(0, 100);
        console.log(`  [${name}]: ${text}${text.length >= 100 ? '...' : ''}`);
      }

      // Advance to next stage
      console.log(`  Advancing past private chat (${realCount} real messages)`);
      await advanceParticipantToNextStage(experimentId, participantPrivateId);
      await sleep(5000); // Wait for trigger to handle next stage
      continue;
    }

    // Unknown stage kind — wait and advance
    console.log(`  Unknown stage kind: ${stage.kind}. Advancing...`);
    await advanceParticipantToNextStage(experimentId, participantPrivateId);
    await sleep(3000);
  }

  console.log('\nTimeout reached');
  return false;
}

// ============================================================================
// Export transcripts
// ============================================================================

async function exportTranscripts(
  experimentId: string,
  cohortId: string,
  participantPrivateId: string,
): Promise<object> {
  console.log('\nExporting transcripts...');

  const experiment = (
    await db.doc(`experiments/${experimentId}`).get()
  ).data()!;
  const stageIds: string[] = experiment.stageIds;
  const result: Record<string, unknown> = {
    experimentId,
    cohortId,
    experimentName: experiment.metadata?.name,
    exportedAt: new Date().toISOString(),
    stages: {},
  };

  for (const stageId of stageIds) {
    const stage = (
      await db.doc(`experiments/${experimentId}/stages/${stageId}`).get()
    ).data()!;
    const stageResult: Record<string, unknown> = {
      name: stage.name,
      kind: stage.kind,
    };

    if (stage.kind === StageKind.CHAT) {
      // Group chat: experiments/{id}/cohorts/{cohortId}/publicStageData/{stageId}/chats
      const messages = await getGroupChatMessages(
        experimentId,
        cohortId,
        stageId,
      );
      stageResult.messages = messages.map((m) => ({
        name: m.profile?.name ?? 'Unknown',
        message: m.message ?? '',
        type: m.type ?? '',
        timestamp: m.timestamp?.toDate?.()?.toISOString?.() ?? null,
      }));
      stageResult.messageCount = messages.length;
    } else if (stage.kind === StageKind.PRIVATE_CHAT) {
      // Private chat: experiments/{id}/participants/{privateId}/stageData/{stageId}/privateChats
      const messages = await getPrivateChatMessages(
        experimentId,
        participantPrivateId,
        stageId,
      );
      stageResult.messages = messages.map((m) => ({
        name: m.profile?.name ?? 'Unknown',
        message: m.message ?? '',
        type: m.type ?? '',
        timestamp: m.timestamp?.toDate?.()?.toISOString?.() ?? null,
      }));
      stageResult.messageCount = messages.length;
    }

    (result.stages as Record<string, unknown>)[stageId] = stageResult;
  }

  return result;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  try {
    console.log('=== Thinking Higher: In Silico Experiment Run ===\n');

    await verifyExperimenterApiKey();

    const template = getThinkingHigherTemplate();
    const experimentId = await createExperimentFromTemplate(template);
    const cohortId = await createCohortForExperiment(experimentId);
    const {privateId} = await createAgentParticipant(experimentId, cohortId);

    console.log('\n=== Orchestrating Experiment ===');
    const success = await orchestrateExperiment(
      experimentId,
      cohortId,
      privateId,
    );

    console.log('\n=== Exporting Transcripts ===');
    const transcripts = await exportTranscripts(
      experimentId,
      cohortId,
      privateId,
    );

    const fs = await import('fs');
    const outputPath = `scripts/transcripts_${Date.now()}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(transcripts, null, 2));
    console.log(`\nTranscripts saved to: ${outputPath}`);

    if (!success) {
      console.log(
        '\nNote: Experiment may not have fully completed. Check transcripts for partial results.',
      );
    }

    console.log('\n=== Done ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
