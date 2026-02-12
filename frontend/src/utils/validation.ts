const MAX_TAG_NAME_LENGTH = 50;
const MAX_TASK_TITLE_LENGTH = 255;
const MAX_NOTE_TITLE_LENGTH = 255;

export function validateTagName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'タグ名を入力してください' };
  if (trimmed.length > MAX_TAG_NAME_LENGTH) return { valid: false, error: `タグ名は${MAX_TAG_NAME_LENGTH}文字以内で入力してください` };
  return { valid: true };
}

export function validateTaskTitle(title: string): { valid: boolean; error?: string } {
  if (title.length > MAX_TASK_TITLE_LENGTH) return { valid: false, error: `タスク名は${MAX_TASK_TITLE_LENGTH}文字以内で入力してください` };
  return { valid: true };
}

export function validateNoteTitle(title: string): { valid: boolean; error?: string } {
  if (title.length > MAX_NOTE_TITLE_LENGTH) return { valid: false, error: `ノートタイトルは${MAX_NOTE_TITLE_LENGTH}文字以内で入力してください` };
  return { valid: true };
}

export { MAX_TAG_NAME_LENGTH, MAX_TASK_TITLE_LENGTH, MAX_NOTE_TITLE_LENGTH };
