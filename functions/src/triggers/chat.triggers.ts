import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {
  ChatMessage,
  MediatorProfileExtended,
  ParticipantProfileExtended,
  ParticipantStatus,
  StageKind,
  UserType,
  createParticipantProfileBase,
} from '@deliberation-lab/utils';
import {
  getFirestoreActiveMediators,
  getFirestoreActiveParticipants,
  getFirestoreParticipant,
  getFirestoreStage,
  getFirestoreStagePublicData,
} from '../utils/firestore';
import {createAgentChatMessageFromPrompt} from '../chat/chat.agent';
import {sendErrorPrivateChatMessage} from '../chat/chat.utils';
import {startTimeElapsed} from '../stages/chat.time';
import {app} from '../app';

// ************************************************************************* //
// TRIGGER FUNCTIONS                                                         //
// ************************************************************************* //

/** When a chat message is created under publicStageData */
export const onPublicChatMessageCreated = onDocumentCreated(
  {
    document:
      'experiments/{experimentId}/cohorts/{cohortId}/publicStageData/{stageId}/chats/{chatId}',
    memory: '1GiB',
    timeoutSeconds: 300,
  },
  async (event) => {
    const stage = await getFirestoreStage(
      event.params.experimentId,
      event.params.stageId,
    );
    if (!stage) return;

    const publicStageData = await getFirestoreStagePublicData(
      event.params.experimentId,
      event.params.cohortId,
      event.params.stageId,
    );
    if (!publicStageData) return;

    // Take action for specific stages
    switch (stage.kind) {
      case StageKind.CHAT:
        // Start tracking elapsed time
        startTimeElapsed(
          event.params.experimentId,
          event.params.cohortId,
          publicStageData,
        );
        break;
      case StageKind.SALESPERSON:
        // TODO: Add API calls for salesperson back in
        return; // Don't call any of the usual chat functions
      default:
        break;
    }

    // Get all participants for context
    const allParticipants = await getFirestoreActiveParticipants(
      event.params.experimentId,
      event.params.cohortId,
      stage.id,
      false, // Get all participants, not just agents
    );

    const allParticipantIds = allParticipants.map((p) => p.privateId);

    // Send agent mediator messages
    const mediators = await getFirestoreActiveMediators(
      event.params.experimentId,
      event.params.cohortId,
      stage.id,
      true,
    );

    // Read the triggering message to check for name-based routing
    const chatDoc = await app
      .firestore()
      .collection('experiments')
      .doc(event.params.experimentId)
      .collection('cohorts')
      .doc(event.params.cohortId)
      .collection('publicStageData')
      .doc(event.params.stageId)
      .collection('chats')
      .doc(event.params.chatId)
      .get();
    const triggerMessage = chatDoc.exists
      ? (chatDoc.data() as ChatMessage)
      : null;

    // Name-based routing: if a human message mentions a specific agent by name,
    // only trigger that agent (skip unnecessary LLM calls for the others).
    // This makes conversations like "Hi Marcus" feel natural and fast.
    const mentionedMediators = triggerMessage
      ? filterByNameMention(triggerMessage, mediators)
      : mediators;

    await Promise.all(
      mentionedMediators.map((mediator) =>
        createAgentChatMessageFromPrompt(
          event.params.experimentId,
          event.params.cohortId,
          allParticipantIds, // Provide all participant IDs for full context
          stage.id,
          event.params.chatId,
          mediator,
        ),
      ),
    );

    // Send agent participant messages for agents who are still completing
    // the experiment
    const agentParticipants = allParticipants.filter(
      (p) => p.agentConfig && p.currentStatus === ParticipantStatus.IN_PROGRESS,
    );

    const mentionedParticipants = triggerMessage
      ? filterByNameMention(triggerMessage, agentParticipants)
      : agentParticipants;

    await Promise.all(
      mentionedParticipants.map((participant) =>
        createAgentChatMessageFromPrompt(
          event.params.experimentId,
          event.params.cohortId,
          [participant.privateId], // Pass agent's own ID as array
          stage.id,
          event.params.chatId,
          participant,
        ),
      ),
    );
  },
);

/** When a chat message is created under private participant stageData */
export const onPrivateChatMessageCreated = onDocumentCreated(
  {
    document:
      'experiments/{experimentId}/participants/{participantId}/stageData/{stageId}/privateChats/{chatId}',
    memory: '1GiB',
    timeoutSeconds: 300,
  },
  async (event) => {
    // Ignore if error message
    const message = (
      await app
        .firestore()
        .collection('experiments')
        .doc(event.params.experimentId)
        .collection('participants')
        .doc(event.params.participantId)
        .collection('stageData')
        .doc(event.params.stageId)
        .collection('privateChats')
        .doc(event.params.chatId)
        .get()
    ).data() as ChatMessage;
    if (message.isError) {
      return;
    }

    const stage = await getFirestoreStage(
      event.params.experimentId,
      event.params.stageId,
    );
    if (!stage) return;

    const participant = await getFirestoreParticipant(
      event.params.experimentId,
      event.params.participantId,
    );
    if (!participant) return;

    // Send agent mediator responses to participant messages only.
    // System messages (e.g., "mediator has left") should not trigger
    // mediator responses — they are signals, not conversation turns.
    if (
      message.type !== UserType.MEDIATOR &&
      message.type !== UserType.SYSTEM
    ) {
      const mediators = await getFirestoreActiveMediators(
        event.params.experimentId,
        participant.currentCohortId,
        stage.id,
        true,
      );

      await Promise.all(
        mediators.map(async (mediator) => {
          const result = await createAgentChatMessageFromPrompt(
            event.params.experimentId,
            participant.currentCohortId,
            [participant.privateId],
            stage.id,
            event.params.chatId,
            mediator,
          );

          if (!result) {
            await sendErrorPrivateChatMessage(
              event.params.experimentId,
              participant.privateId,
              stage.id,
              {
                discussionId: message.discussionId,
                message: 'Error fetching response',
                type: mediator.type,
                profile: createParticipantProfileBase(mediator),
                senderId: mediator.publicId,
                agentId: mediator.agentConfig?.agentId ?? '',
              },
            );
          }
        }),
      );

      // If no mediator, return error (otherwise participant may wait
      // indefinitely for a response).
      if (mediators.length === 0) {
        await sendErrorPrivateChatMessage(
          event.params.experimentId,
          participant.privateId,
          stage.id,
          {
            discussionId: message.discussionId,
            message: 'No mediators found',
          },
        );
      }
    }

    // Send agent participant messages (if participant is an agent).
    // Agent responds to mediator messages and system messages (e.g.,
    // "mediator has left the chat") so it can advance stages. (#1011)
    if (participant.agentConfig) {
      if (
        message.type === UserType.MEDIATOR ||
        message.type === UserType.SYSTEM
      ) {
        await createAgentChatMessageFromPrompt(
          event.params.experimentId,
          participant.currentCohortId,
          [participant.privateId],
          stage.id,
          event.params.chatId,
          participant,
        );
      }
    }
  },
);

// ************************************************************************* //
// HELPER FUNCTIONS                                                          //
// ************************************************************************* //

/**
 * Filter agents to only those mentioned by name in the message.
 * If the message mentions specific agent names, only those agents are triggered.
 * If no agent names are mentioned, all agents are triggered (default behavior).
 *
 * This avoids unnecessary LLM calls when a participant addresses a specific
 * person (e.g., "Hi Marcus" or "Marcus, are you free?"), making the
 * conversation feel more natural and responsive.
 */
function filterByNameMention<
  T extends MediatorProfileExtended | ParticipantProfileExtended,
>(message: ChatMessage, agents: T[]): T[] {
  // Only apply routing for human participant messages
  if (message.type !== UserType.PARTICIPANT) return agents;
  // Don't route if there's only one agent
  if (agents.length <= 1) return agents;

  const msgLower = message.message.toLowerCase();

  // Extract the first name (before any parenthetical like "(UX Designer)")
  const getFirstName = (agent: T): string => {
    const name = agent.name ?? '';
    const parenIdx = name.indexOf('(');
    const baseName = parenIdx > 0 ? name.substring(0, parenIdx).trim() : name;
    return baseName.toLowerCase();
  };

  const mentioned = agents.filter((agent) => {
    const firstName = getFirstName(agent);
    return firstName.length > 0 && msgLower.includes(firstName);
  });

  // If specific agents were mentioned, only trigger those.
  // Otherwise, trigger all agents (message was general, like "sounds good").
  return mentioned.length > 0 ? mentioned : agents;
}
