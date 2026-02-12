import { validateTagName, validateTaskTitle, validateNoteTitle, MAX_TAG_NAME_LENGTH, MAX_TASK_TITLE_LENGTH, MAX_NOTE_TITLE_LENGTH } from './validation';

describe('validateTagName', () => {
  it('accepts valid tag names', () => {
    expect(validateTagName('Work')).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    const result = validateTagName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects whitespace-only', () => {
    const result = validateTagName('   ');
    expect(result.valid).toBe(false);
  });

  it('rejects names exceeding max length', () => {
    const longName = 'a'.repeat(MAX_TAG_NAME_LENGTH + 1);
    const result = validateTagName(longName);
    expect(result.valid).toBe(false);
  });

  it('accepts names at exactly max length', () => {
    const name = 'a'.repeat(MAX_TAG_NAME_LENGTH);
    expect(validateTagName(name)).toEqual({ valid: true });
  });
});

describe('validateTaskTitle', () => {
  it('accepts valid titles', () => {
    expect(validateTaskTitle('My Task')).toEqual({ valid: true });
  });

  it('accepts empty titles (optional)', () => {
    expect(validateTaskTitle('')).toEqual({ valid: true });
  });

  it('rejects titles exceeding max length', () => {
    const longTitle = 'a'.repeat(MAX_TASK_TITLE_LENGTH + 1);
    const result = validateTaskTitle(longTitle);
    expect(result.valid).toBe(false);
  });
});

describe('validateNoteTitle', () => {
  it('accepts valid titles', () => {
    expect(validateNoteTitle('My Note')).toEqual({ valid: true });
  });

  it('rejects titles exceeding max length', () => {
    const longTitle = 'a'.repeat(MAX_NOTE_TITLE_LENGTH + 1);
    const result = validateNoteTitle(longTitle);
    expect(result.valid).toBe(false);
  });
});
