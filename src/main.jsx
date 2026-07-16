import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installToastAlert } from './lib/toast'

// Mọi alert() trong app hiện thành toast tối đồng bộ theme (bỏ hộp trắng của trình duyệt)
installToastAlert()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
