/**
 * Content lines can be:
 *   "*Smulan schnurrt.*"            → an action (shown in italics)
 *   "Sonne: Endlich. Mein Palast."  → Sonne speaking
 *   "Hej hej!"                      → whoever is talking
 */
export interface Speech {
  speaker?: string;
  text: string;
  action: boolean;
}

export function parseSpeech(raw: string, knownSpeakers: readonly string[]): Speech {
  let text = raw.trim();
  let speaker: string | undefined;
  const m = /^([A-ZÄÖÅÜ][\wäöåüß-]*):\s+(.*)$/s.exec(text);
  if (m && knownSpeakers.includes(m[1]!)) {
    speaker = m[1];
    text = m[2]!;
  }
  const action = text.startsWith('*') && text.endsWith('*') && !text.slice(1, -1).includes('*');
  if (action) text = text.slice(1, -1);
  return { ...(speaker ? { speaker } : {}), text, action };
}
