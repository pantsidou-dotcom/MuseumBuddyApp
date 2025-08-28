export function Button({ text, onClick }) {
  const button = document.createElement('button');
  button.className = 'btn';
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}
