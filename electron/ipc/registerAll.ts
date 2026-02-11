import type Database from 'better-sqlite3';
import { createTaskRepository } from '../database/taskRepository';
import { createTimerRepository } from '../database/timerRepository';
import { createSoundRepository } from '../database/soundRepository';
import { createMemoRepository } from '../database/memoRepository';
import { createAIRepository } from '../database/aiRepository';
import { createTagRepository } from '../database/tagRepository';
import { createTemplateRepository } from '../database/templateRepository';
import { registerTaskHandlers } from './taskHandlers';
import { registerTimerHandlers } from './timerHandlers';
import { registerSoundHandlers } from './soundHandlers';
import { registerMemoHandlers } from './memoHandlers';
import { registerAIHandlers } from './aiHandlers';
import { registerAppHandlers } from './appHandlers';
import { createCustomSoundRepository } from '../database/customSoundRepository';
import { registerCustomSoundHandlers } from './customSoundHandlers';
import { registerTagHandlers } from './tagHandlers';
import { registerTemplateHandlers } from './templateHandlers';
import { registerDataIOHandlers } from './dataIOHandlers';

export function registerAllHandlers(db: Database.Database): void {
  const tasks = createTaskRepository(db);
  const timer = createTimerRepository(db);
  const sound = createSoundRepository(db);
  const memo = createMemoRepository(db);
  const ai = createAIRepository(db);
  const tags = createTagRepository(db);
  const templates = createTemplateRepository(db);
  ai.migrateDeprecatedModel();

  registerTaskHandlers(tasks);
  registerTimerHandlers(timer);
  registerSoundHandlers(sound);
  registerMemoHandlers(memo);
  registerAIHandlers(ai);
  registerCustomSoundHandlers(createCustomSoundRepository());
  registerTagHandlers(tags);
  registerTemplateHandlers(templates);
  registerAppHandlers({ tasks, timer, sound, memo });
  registerDataIOHandlers(db);
}
