export function Header({ text }) {
  const header = document.createElement('h1');
  header.className = 'header';
  header.textContent = text;
  return header;
}
