import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import MainPage from './components/MainPage';
import Dashboard from './components/Dashboard';
import TemplateSelectionPage from './components/TemplateSelectionPage';
import InvitationEditor from './components/InvitationEditor';
import InvitationCreator from './components/InvitationCreator';
import SignupPage from './components/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { getCurrentUser, isLoggedIn as checkLogin, logout as apiLogout, getStoredUser } from './services/api';
import './App.css';

import GoogleCallback from './components/GoogleCallback'; 
import NaverCallback from './components/NaverCallback';

function AppContent() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedInvitationType, setSelectedInvitationType] = useState('결혼식 청첩장');

  // 앱 로드 시 로그인 상태 확인
  useEffect(() => {
    const initAuth = async () => {
      if (checkLogin()) {
        try {
          // 저장된 사용자 정보로 먼저 표시
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsLoggedIn(true);
          }
          
          // 서버에서 최신 정보 가져오기
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('인증 확인 실패:', error);
          setIsLoggedIn(false);
          setUser(null);
        }
      }
    };
    initAuth();
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    apiLogout();
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const handleTemplateSelected = (template, invitationType) => {
    console.log("선택된 템플릿을 받아옴:", template.title);
    console.log("선택된 초대장 타입:", invitationType);
    setSelectedInvitationType(invitationType);
    navigate('/editor');
  };

  const handleSignup = (formData) => {
    console.log("회원가입 데이터:", formData);
    navigate('/');
  };


  return (
    <div className="App">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<MainPage onLogin={handleLogin} onSignupClick={() => navigate('/signup')} />} />
        <Route path="/signup" element={<SignupPage onBack={() => navigate('/')} onSignup={handleSignup} />} />
          <Route 
            path="/auth/google/callback" 
            element={<GoogleCallback />} 
          />
          <Route 
            path="/auth/naver/callback" 
            element={<NaverCallback />} 
          />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard username={user?.name || '게스트'} onLogout={handleLogout} onNewCreationClick={() => navigate('/template')} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/template"
          element={
            <ProtectedRoute>
              <TemplateSelectionPage username={user?.name || '게스트'} onTemplateSelected={handleTemplateSelected} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <InvitationEditor
                username={user?.name || '게스트'}
                invitationType={selectedInvitationType}
                onBack={() => navigate('/template')}
                onNext={() => navigate('/creator')}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creator"
          element={
            <ProtectedRoute>
              <InvitationCreator username={user?.name || '게스트'} onBack={() => navigate('/dashboard')} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
