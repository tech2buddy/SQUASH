const capitalizePart = (part: string) =>
  part ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}` : part;

export function formatPersonName(value: string) {
  return value.trim().replace(/\s+/g, ' ').split(' ').map((word) =>
    word.split('-').map((part) => part.split("'").map(capitalizePart).join("'")).join('-'),
  ).join(' ');
}

export function formatJobTitle(value: string) {
  return value.trim().replace(/\s+/g, ' ').split(' ').map((word) => {
    if (/^[A-Z0-9&/+.-]{2,6}$/.test(word)) return word;
    if (/[A-Z].*[A-Z]/.test(word) || /^[a-z]+[A-Z]/.test(word)) return word;
    return capitalizePart(word);
  }).join(' ');
}
