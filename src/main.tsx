import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthContext'
import MusicVizUpload from './routes/_index'
import CreatorSidebarView from './routes/explore/route'
import SavedPage from './routes/saved/route'
import ProfilePage from './routes/profile/route'
import TestAuthPage from './routes/test-auth/route'
import SignInPage from './routes/auth/signin/route'
import SignUpPage from './routes/auth/signup/route'
import './index.css'
import './global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MusicVizUpload />} />
          <Route path="/explore" element={<CreatorSidebarView />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/test-auth" element={<TestAuthPage />} />
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/signup" element={<SignUpPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
