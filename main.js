import { Button } from './components/Button.js';
import { Header } from './components/Header.js';
import './style.css';

const app = document.getElementById('app');
const header = Header({ text: 'MuseumBuddy' });
const button = Button({
  text: 'Klik mij',
  onClick: () => alert('Welkom in het museum!')
});
app.append(header, button);
