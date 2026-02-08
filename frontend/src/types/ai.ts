export type AIRequestType = 'breakdown' | 'encouragement' | 'review';

export interface AIAdviceRequest {
  taskTitle: string;
  taskContent?: string;
  requestType: AIRequestType;
}

export interface AIAdviceResponse {
  advice: string;
  requestType: AIRequestType;
}

export interface AISettingsResponse {
  apiKey: string;
  model: string;
  hasApiKey: boolean;
}

export interface AIErrorResponse {
  error: string;
  errorCode: string;
}
