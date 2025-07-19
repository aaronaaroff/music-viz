import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MusicVizUpload from './routes/index'
import CreatorSidebarView from './routes/explore'
import './index.css'
import './global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MusicVizUpload />} />
        <Route path="/explore" element={<CreatorSidebarView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
