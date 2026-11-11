import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

document.documentElement.classList.add('js')
createRoot(document.getElementById('raiz')).render(<App />)
