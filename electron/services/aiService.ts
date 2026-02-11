import type { AIAdviceRequest, AIAdviceResponse } from '../types';

const MAX_TASK_CONTENT_LENGTH = 500;

const BREAKDOWN_PROMPT = `あなたはタスク管理のコーチです。
ユーザーが取り組もうとしているタスクを、具体的で実行しやすい小さなステップに分解してください。

ルール:
- 3〜7個のステップに分解する
- 各ステップは15分以内で完了できる粒度にする
- 番号付きリストで出力する
- 最初のステップは特に簡単で着手しやすいものにする
- 簡潔に、余計な前置きなしで回答する`;

const ENCOURAGEMENT_PROMPT = `あなたはポジティブで温かいタスク管理コーチです。
ユーザーが今取り組んでいるタスクについて、励ましとモチベーションを高めるアドバイスをしてください。

ルール:
- 2〜3文で簡潔に励ます
- 具体的なタスク内容に触れて共感を示す
- 「できる」という前向きなメッセージを含める
- 余計な前置きなしで回答する`;

const REVIEW_PROMPT = `あなたはタスク管理のコーチです。
ユーザーがタスクを完了したことに対して、短いフィードバックと次のアクションの提案をしてください。

ルール:
- まず完了を称える（1文）
- 次にやると良さそうなことを1つ提案する
- 簡潔に、余計な前置きなしで回答する`;

function buildPrompt(request: AIAdviceRequest): string {
  let systemInstruction: string;
  switch (request.requestType) {
    case 'breakdown':
      systemInstruction = BREAKDOWN_PROMPT;
      break;
    case 'encouragement':
      systemInstruction = ENCOURAGEMENT_PROMPT;
      break;
    case 'review':
      systemInstruction = REVIEW_PROMPT;
      break;
    default:
      throw new Error(`Unknown request type: ${request.requestType}`);
  }

  let prompt = systemInstruction + '\n\nタスク名: ' + request.taskTitle;
  if (request.taskContent && request.taskContent.trim()) {
    let content = request.taskContent;
    if (content.length > MAX_TASK_CONTENT_LENGTH) {
      content = content.substring(0, MAX_TASK_CONTENT_LENGTH) + '...（省略）';
    }
    prompt += '\nタスクの詳細メモ:\n' + content;
  }
  return prompt;
}

interface GeminiError {
  error?: { message?: string };
}

function extractGeminiError(body: unknown): string {
  try {
    const obj = body as GeminiError;
    if (obj?.error?.message) {
      return ' [詳細: ' + obj.error.message + ']';
    }
  } catch { /* ignore */ }
  return '';
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function extractText(response: GeminiResponse): string {
  if (!response) {
    throw new Error('AIサービスから空のレスポンスが返されました');
  }
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('AIサービスから有効な回答が得られませんでした');
  }
  const text = candidates[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('AIサービスから有効な回答が得られませんでした');
  }
  return text;
}

export async function getAdvice(
  request: AIAdviceRequest,
  apiKey: string,
  model: string,
): Promise<AIAdviceResponse> {
  const prompt = buildPrompt(request);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 1024 },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw { error: 'AIサービスに接続できませんでした', errorCode: 'NETWORK_ERROR' };
  }

  if (!res.ok) {
    const status = res.status;
    let errorBody: unknown;
    try { errorBody = await res.json(); } catch { errorBody = null; }
    const detail = extractGeminiError(errorBody);

    if (status === 429) {
      throw { error: 'APIのレート制限に達しました。しばらく待ってから再試行してください。' + detail, errorCode: 'RATE_LIMITED' };
    } else if (status === 401 || status === 403) {
      throw { error: 'APIキーが無効です。Settingsで正しいキーを設定してください。' + detail, errorCode: 'INVALID_API_KEY' };
    } else {
      throw { error: 'AIサービスでエラーが発生しました（' + status + '）' + detail, errorCode: 'API_ERROR' };
    }
  }

  const responseJson = await res.json() as GeminiResponse;
  const advice = extractText(responseJson);
  return { advice, requestType: request.requestType };
}
