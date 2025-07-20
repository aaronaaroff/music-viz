import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MusicVizUpload from './routes/_index'
import CreatorSidebarView from './routes/explore/route'
import ProfilePage from './routes/profile/route'
import './index.css'
import './global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MusicVizUpload />} />
        <Route path="/explore" element={<CreatorSidebarView />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
