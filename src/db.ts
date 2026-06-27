import Dexie, { type Table } from 'dexie';

export interface TranslationRecord {
  id?: number;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  isStarred?: boolean;
}

class TranslationDatabase extends Dexie {
  translations!: Table<TranslationRecord>;

  constructor() {
    super('TransifyDB');
    this.version(1).stores({
      // Index on composite key for cache lookup + timestamp for history ordering
      translations: '++id, [sourceText+sourceLang+targetLang], timestamp',
    });
    this.version(2).stores({
      translations: '++id, [sourceText+sourceLang+targetLang], timestamp, isStarred',
    });
  }
}

export const db = new TranslationDatabase();

/** Check local cache before making a network request */
export async function getCachedTranslation(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
): Promise<TranslationRecord | undefined> {
  return db.translations
    .where('[sourceText+sourceLang+targetLang]')
    .equals([sourceText, sourceLang, targetLang])
    .first();
}

/** Persist a successful translation */
export async function saveTranslation(record: Omit<TranslationRecord, 'id'>): Promise<void> {
  // Upsert: remove stale entry then insert fresh one
  await db.translations
    .where('[sourceText+sourceLang+targetLang]')
    .equals([record.sourceText, record.sourceLang, record.targetLang])
    .delete();
  await db.translations.add(record);
}

/** Fetch the N most-recent history entries */
export async function getHistory(limit = 30): Promise<TranslationRecord[]> {
  return db.translations.orderBy('timestamp').reverse().limit(limit).toArray();
}

/** Clear all history */
export async function clearHistory(): Promise<void> {
  await db.translations.clear();
}

/** Toggle the starred status of a translation */
export async function toggleTranslationStar(id: number, isStarred: boolean): Promise<void> {
  await db.translations.update(id, { isStarred });
}

/** Delete a single translation by id */
export async function deleteTranslation(id: number): Promise<void> {
  await db.translations.delete(id);
}

/** Fetch all starred history entries */
export async function getStarredHistory(): Promise<TranslationRecord[]> {
  const all = await db.translations.orderBy('timestamp').reverse().toArray();
  return all.filter(r => r.isStarred);
}
