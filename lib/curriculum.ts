export function splitVocabulary(raw: string) {
  return raw
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, position) => {
      const separator = entry.indexOf("=");
      return {
        term: separator >= 0 ? entry.slice(0, separator).trim() : entry,
        meaning: separator >= 0 ? entry.slice(separator + 1).trim() : null,
        position,
      };
    });
}

