import '../../pair-components/icon_button';
import '../../pair-components/tooltip';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';

import '@material/web/textfield/filled-text-field.js';

import {core} from '../../core/core';
import {AuthService} from '../../services/auth.service';
import {ExperimentManager} from '../../services/experiment.manager';
import {ExperimentService} from '../../services/experiment.service';

import {styles} from './experimenter_data_editor.scss';
import {
  ApiKeyType,
  ExperimenterData,
  createClaudeServerConfig,
  createOpenAIServerConfig,
  ModelResponseStatus,
} from '@deliberation-lab/utils';

enum CheckApiKeyStatus {
  NONE = 0,
  PENDING = 1,
  SUCCESS = 2,
  FAILURE = 3,
}

interface CheckApiKeyResult {
  status: number;
  errorMessage?: string;
}

/**
 * Quick-setup presets for OpenAI-compatible providers.
 * These auto-fill the base URL so experimenters only need an API key.
 */
interface ProviderPreset {
  name: string;
  baseUrl: string;
  description: string;
  signupUrl: string;
  freeTier: string;
}

const OPENAI_COMPATIBLE_PRESETS: ProviderPreset[] = [
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    description: 'Ultra-fast inference on custom LPU hardware',
    signupUrl: 'https://console.groq.com',
    freeTier: 'Free: 1,000 requests/day',
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    description: 'Unified gateway to many model providers',
    signupUrl: 'https://openrouter.ai',
    freeTier: 'Free: 50 requests/day on select models',
  },
  {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    description: 'Fast open-source model hosting',
    signupUrl: 'https://www.together.ai',
    freeTier: 'Free credits on signup',
  },
  {
    name: 'HuggingFace',
    baseUrl: 'https://router.huggingface.co/v1',
    description: 'Routes to fastest provider for any HF model',
    signupUrl: 'https://huggingface.co/settings/tokens',
    freeTier: 'Free: rate-limited inference',
  },
  {
    name: 'OpenAI',
    baseUrl: '',
    description: 'OpenAI GPT models (paid)',
    signupUrl: 'https://platform.openai.com/api-keys',
    freeTier: '',
  },
];

/** Editor for adjusting experimenter data */
@customElement('experimenter-data-editor')
export class ExperimenterDataEditor extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  private readonly authService = core.getService(AuthService);
  private readonly experimentManager = core.getService(ExperimentManager);
  private readonly experimentService = core.getService(ExperimentService);

  @state() apiKeyResults = new Map<ApiKeyType, CheckApiKeyResult>();
  @state() showAdvancedProviders = false;

  /** Update a result and trigger a reactive re-render. */
  private setApiKeyResult(apiType: ApiKeyType, result: CheckApiKeyResult) {
    const updated = new Map(this.apiKeyResults);
    updated.set(apiType, result);
    this.apiKeyResults = updated;
  }

  override render() {
    const experiment = this.experimentService.experiment;
    if (
      experiment &&
      experiment.metadata.creator !== this.authService.userEmail
    ) {
      return html`
        <div>
          This experiment uses API keys provided by the creator of the
          experiment: ${experiment.metadata.creator}
        </div>
      `;
    }

    return html`
      <div class="banner">
        API keys are shared across all of your experiments. If your admin has
        configured default keys, you can skip this section.
      </div>
      ${this.renderOpenAISettings()}
      <div class="divider"></div>
      ${this.showAdvancedProviders
        ? html`
            ${this.renderGeminiKey()}
            <div class="divider"></div>
            ${this.renderVertexAISettings()}
            <div class="divider"></div>
            ${this.renderClaudeSettings()}
            <div class="divider"></div>
            ${this.renderOllamaSettings()}
          `
        : html`
            <div
              class="toggle-link"
              @click=${() => {
                this.showAdvancedProviders = true;
              }}
            >
              Show additional providers (Gemini, Vertex AI, Claude, Ollama)
            </div>
          `}
    `;
  }

  private renderCheckApiKey(apiType: ApiKeyType) {
    const testEndpoint = async () => {
      this.setApiKeyResult(apiType, {status: CheckApiKeyStatus.PENDING});

      const response = await this.experimentManager.testApiKey(apiType);
      this.setApiKeyResult(apiType, {
        status:
          response.status === ModelResponseStatus.OK
            ? CheckApiKeyStatus.SUCCESS
            : CheckApiKeyStatus.FAILURE,
        errorMessage: `Error: ${response.status}: ${response.errorMessage}`,
      });
    };

    const renderResult = (result: CheckApiKeyResult) => {
      switch (result.status) {
        case CheckApiKeyStatus.NONE:
          return '';
        case CheckApiKeyStatus.PENDING:
          return html`<div class="banner">Sending test message...</div>`;
        case CheckApiKeyStatus.SUCCESS:
          return html`<div class="banner success">Valid API key</div>`;
        case CheckApiKeyStatus.FAILURE:
        default:
          return html`<div class="banner error">${result.errorMessage}</div>`;
      }
    };

    const result = this.apiKeyResults.get(apiType) ?? {
      status: CheckApiKeyStatus.NONE,
    };
    return html`
      <div class="api-check">
        <pr-tooltip text="Test API key">
          <pr-icon-button
            icon="key"
            color="neutral"
            variant="default"
            @click=${testEndpoint}
          >
          </pr-icon-button>
        </pr-tooltip>
        ${renderResult(result)}
      </div>
    `;
  }

  // ============ OpenAI-compatible (primary section) ============
  private renderOpenAISettings() {
    const updateOpenAISettings = (
      e: InputEvent,
      field: 'apiKey' | 'baseUrl',
    ) => {
      const oldData = this.authService.experimenterData;
      if (!oldData) return;

      const value = (e.target as HTMLInputElement).value;
      this.setApiKeyResult(ApiKeyType.OPENAI_API_KEY, {
        status: CheckApiKeyStatus.NONE,
      });
      let newData;

      switch (field) {
        case 'apiKey':
          newData = updateExperimenterData(oldData, {
            apiKeys: {
              ...oldData.apiKeys,
              openAIApiKey: {
                ...(oldData.apiKeys?.openAIApiKey ??
                  createOpenAIServerConfig()),
                apiKey: value,
              },
            },
          });
          break;

        case 'baseUrl':
          newData = updateExperimenterData(oldData, {
            apiKeys: {
              ...oldData.apiKeys,
              openAIApiKey: {
                ...(oldData.apiKeys?.openAIApiKey ??
                  createOpenAIServerConfig()),
                baseUrl: value,
              },
            },
          });
          break;
        default:
          console.error('Error: field type not found: ', field);
          return;
      }

      this.authService.writeExperimenterData(newData);
    };

    const applyPreset = (preset: ProviderPreset) => {
      const oldData = this.authService.experimenterData;
      if (!oldData) return;

      this.setApiKeyResult(ApiKeyType.OPENAI_API_KEY, {
        status: CheckApiKeyStatus.NONE,
      });

      const newData = updateExperimenterData(oldData, {
        apiKeys: {
          ...oldData.apiKeys,
          openAIApiKey: {
            ...(oldData.apiKeys?.openAIApiKey ?? createOpenAIServerConfig()),
            baseUrl: preset.baseUrl,
          },
        },
      });

      this.authService.writeExperimenterData(newData);
    };

    const data = this.authService.experimenterData;
    const currentBaseUrl = data?.apiKeys.openAIApiKey?.baseUrl ?? '';

    return html`
      <div class="section">
        <h3>OpenAI-compatible API</h3>
        <p class="description">
          Works with OpenAI, Groq, OpenRouter, Together AI, HuggingFace, and any
          OpenAI-compatible endpoint. Select a provider below to auto-fill the
          base URL.
        </p>

        <div class="preset-grid">
          ${OPENAI_COMPATIBLE_PRESETS.map((preset) => {
            const isActive = preset.baseUrl === currentBaseUrl;
            return html`
              <div
                class="preset-card ${isActive ? 'active' : ''}"
                @click=${() => applyPreset(preset)}
              >
                <div class="preset-name">${preset.name}</div>
                <div class="preset-description">${preset.description}</div>
                ${preset.freeTier
                  ? html`<div class="preset-free">${preset.freeTier}</div>`
                  : nothing}
              </div>
            `;
          })}
        </div>

        <md-filled-text-field
          label="API key"
          placeholder="Enter your API key"
          .value=${data?.apiKeys.openAIApiKey?.apiKey ?? ''}
          @input=${(e: InputEvent) => updateOpenAISettings(e, 'apiKey')}
        ></md-filled-text-field>

        <md-filled-text-field
          label="Base URL (blank = OpenAI default)"
          placeholder="https://api.groq.com/openai/v1"
          variant="outlined"
          .value=${currentBaseUrl}
          @input=${(e: InputEvent) => updateOpenAISettings(e, 'baseUrl')}
        ></md-filled-text-field>

        ${currentBaseUrl
          ? html`<div class="banner">
              Using custom endpoint: ${currentBaseUrl}
            </div>`
          : nothing}
        ${this.renderCheckApiKey(ApiKeyType.OPENAI_API_KEY)}
      </div>
    `;
  }

  // ============ Gemini ============
  private renderGeminiKey() {
    const updateKey = (e: InputEvent) => {
      const oldData = this.authService.experimenterData;
      if (!oldData) return;

      const geminiKey = (e.target as HTMLTextAreaElement).value;
      this.setApiKeyResult(ApiKeyType.GEMINI_API_KEY, {
        status: CheckApiKeyStatus.NONE,
      });
      const newData = updateExperimenterData(oldData, {
        apiKeys: {...oldData.apiKeys, geminiApiKey: geminiKey},
      });

      this.authService.writeExperimenterData(newData);
    };

    return html`
      <div class="section">
        <h3>Gemini API settings</h3>
        <md-filled-text-field
          label="Gemini API key"
          placeholder="Add Gemini API key"
          .value=${this.authService.experimenterData?.apiKeys.geminiApiKey ??
          ''}
          @input=${updateKey}
        ></md-filled-text-field>
        ${this.renderCheckApiKey(ApiKeyType.GEMINI_API_KEY)}
      </div>
    `;
  }

  // ============ Vertex AI ============
  private renderVertexAISettings() {
    const updateVertexAISettings = (
      e: InputEvent,
      field: 'apiKey' | 'project' | 'location' | 'serviceAccountJson',
    ) => {
      const oldData = this.authService.experimenterData;
      if (!oldData) return;

      const value = (e.target as HTMLInputElement).value;
      this.setApiKeyResult(ApiKeyType.VERTEX_AI_API_KEY, {
        status: CheckApiKeyStatus.NONE,
      });

      const newData = updateExperimenterData(oldData, {
        apiKeys: {
          ...oldData.apiKeys,
          vertexAIConfig: {
            ...(oldData.apiKeys?.vertexAIConfig ?? {}),
            [field]: value,
          },
        },
      });

      this.authService.writeExperimenterData(newData);
    };

    const data = this.authService.experimenterData;
    const config = data?.apiKeys.vertexAIConfig;
    return html`
      <div class="section">
        <h3>Vertex AI API settings</h3>
        <p>
          Use either an API key (express mode) or service account credentials.
        </p>
        <md-filled-text-field
          label="API key (express mode)"
          placeholder="Add Vertex AI API key"
          .value=${config?.apiKey ?? ''}
          @input=${(e: InputEvent) => updateVertexAISettings(e, 'apiKey')}
        ></md-filled-text-field>
        <p>Or use a service account:</p>
        <md-filled-text-field
          type="textarea"
          label="Service account JSON"
          placeholder="Paste the full JSON key file contents"
          .value=${config?.serviceAccountJson ?? ''}
          @input=${(e: InputEvent) =>
            updateVertexAISettings(e, 'serviceAccountJson')}
        ></md-filled-text-field>
        <md-filled-text-field
          label="Location (optional, defaults to us-central1)"
          placeholder="us-central1"
          .value=${config?.location ?? ''}
          @input=${(e: InputEvent) => updateVertexAISettings(e, 'location')}
        ></md-filled-text-field>
        ${this.renderCheckApiKey(ApiKeyType.VERTEX_AI_API_KEY)}
      </div>
    `;
  }

  // ============ Claude ============

  private renderClaudeSettings() {
    const updateClaudeSettings = (
      e: InputEvent,
      field: 'apiKey' | 'baseUrl',
    ) => {
      const oldData = this.authService.experimenterData;
      if (!oldData) return;

      const value = (e.target as HTMLInputElement).value;
      this.setApiKeyResult(ApiKeyType.CLAUDE_API_KEY, {
        status: CheckApiKeyStatus.NONE,
      });

      const newData = updateExperimenterData(oldData, {
        apiKeys: {
          ...oldData.apiKeys,
          claudeApiKey: {
            ...(oldData.apiKeys?.claudeApiKey ?? createClaudeServerConfig()),
            [field]: value,
          },
        },
      });

      this.authService.writeExperimenterData(newData);
    };

    const data = this.authService.experimenterData;
    return html`
      <div class="section">
        <h3>Claude API settings</h3>
        <md-filled-text-field
          label="Claude API key"
          placeholder="Add Claude API key"
          .value=${data?.apiKeys.claudeApiKey?.apiKey ?? ''}
          @input=${(e: InputEvent) => updateClaudeSettings(e, 'apiKey')}
        ></md-filled-text-field>

        <md-filled-text-field
          label="Base URL (optional)"
          placeholder="https://api.anthropic.com"
          .value=${data?.apiKeys.claudeApiKey?.baseUrl ?? ''}
          @input=${(e: InputEvent) => updateClaudeSettings(e, 'baseUrl')}
        ></md-filled-text-field>

        ${this.renderCheckApiKey(ApiKeyType.CLAUDE_API_KEY)}
      </div>
    `;
  }
  // ============ Local Ollama server ============
  private renderOllamaSettings() {
    const updateServerSettings = (e: InputEvent, field: 'url') => {
      const oldData = this.authService.experimenterData;
      if (!oldData) return;

      const value = (e.target as HTMLInputElement).value;
      this.setApiKeyResult(ApiKeyType.OLLAMA_CUSTOM_URL, {
        status: CheckApiKeyStatus.NONE,
      });
      let newData;

      switch (field) {
        case 'url':
          newData = updateExperimenterData(oldData, {
            apiKeys: {
              ...oldData.apiKeys,
              ollamaApiKey: {
                ...oldData.apiKeys.ollamaApiKey,
                url: value,
              },
            },
          });
          break;
        default:
          console.error('Error: field type not found: ', field);
          return;
      }

      this.authService.writeExperimenterData(newData);
    };

    const data = this.authService.experimenterData;
    return html`
      <div class="section">
        <h3>Ollama API settings</h3>
        <p class="description">
          Run open-source models locally. Requires Ollama running on your
          machine or network.
        </p>
        <md-filled-text-field
          label="Server URL (please ensure URL is valid!)"
          placeholder="http://localhost:11434"
          .value=${data?.apiKeys.ollamaApiKey?.url ?? ''}
          @input=${(e: InputEvent) => updateServerSettings(e, 'url')}
        ></md-filled-text-field>
        ${this.renderCheckApiKey(ApiKeyType.OLLAMA_CUSTOM_URL)}
      </div>
    `;
  }
}

// Utility function to create updated ExperimenterData
function updateExperimenterData(
  oldData: ExperimenterData,
  updatedFields: Partial<ExperimenterData>,
): ExperimenterData {
  return {
    ...oldData,
    ...updatedFields,
    apiKeys: {
      ...oldData.apiKeys,
      ...updatedFields.apiKeys,
      ollamaApiKey: {
        ...oldData.apiKeys.ollamaApiKey,
        ...(updatedFields.apiKeys?.ollamaApiKey || {}),
      },
    },
  };
}
