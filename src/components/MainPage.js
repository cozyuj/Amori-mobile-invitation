import React, { useState, useEffect} from 'react';
import { login, getGoogleLoginUrl, getNaverLoginUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Form, Spin } from 'antd';
import './MainPage.css';

function MainPage({ onLogin, onSignupClick }) {
  const navigate = useNavigate();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [stats, setStats] = useState({ users: 0, rating: 4.8, reviews: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // 통계 데이터 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 여기에 백엔드 API 호출 추가 (현재는 더미 데이터)
        // const response = await fetch('/api/stats');
        // const data = await response.json();
        // setStats(data);
        
        // 임시: 1초 후 숫자 증가하며 표시
        setIsLoadingStats(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setStats({ users: 1234, rating: 4.8, reviews: 1234 });
        setIsLoadingStats(false);
      } catch (error) {
        console.error('통계 로드 실패:', error);
        setStats({ users: 1234, rating: 4.8, reviews: 1234 });
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await login(email, password);
      alert(`환영합니다, ${response.user.name}님!`);
      setShowLoginForm(false);

      if (onLogin) {
        onLogin(response.user);
      }
    } catch (error) {
      alert(error.message);
      console.error('로그인 실패:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const authUrl = await getGoogleLoginUrl();
      window.location.href = authUrl;
      navigate('/dashboard');
    } catch (error) {
      alert('구글 로그인에 실패했습니다.');
      console.error('구글 로그인 오류:', error);
    }
  };

  const handleNaverLogin = async () => {
    try {
      const authUrl = await getNaverLoginUrl();
      window.location.href = authUrl;
      navigate('/dashboard');
    } catch (error) {
      alert('네이버 로그인에 실패했습니다.');
      console.error('네이버 로그인 오류:', error);
    }
  };

  

  return (
    <main className="main-content">
      {isLoadingStats ? (
        <Spin size="large" style={{ marginTop: '50px' }} />
      ) : (
        <>
          <div className="content-text">
            <h2 className="main-title">지금 바로 만들어보세요</h2>
            <p className="subtitle">
              <span className="highlight">{stats.users.toLocaleString()}</span>명이 먼저 만들었어요
            </p>
            <p className="rating-text">
              스마트스토어 평점 <span className="highlight">{stats.rating}</span>점, 리뷰 <span className="highlight">{stats.reviews.toLocaleString()}</span>건
            </p>
          </div>

          <div className="button-section">
            <Button className="yellow-button"  disabled={isLoggingIn}>
              <img src="/kakao-logo-36x36.png" alt="카카오 로고" />
              카카오 로그인
            </Button>
            <Button className="green-button" onClick={handleNaverLogin} disabled={isLoggingIn}>
              <img src="/naver-logo-16x16.png" alt="네이버 로고" />
              네이버 로그인
            </Button>

            <Button className="white-button" onClick={handleGoogleLogin} disabled={isLoggingIn}>
              <img src="/google-logo-18x18.png" alt="구글 로고" />
              구글 로그인
            </Button>
            <Button className="white-button" disabled={isLoggingIn}>
              <img src="/apple-logo-24x24.png" alt="애플 로고" />
              애플 로그인
            </Button>
          </div>

          <div className="login-section">
            <Button
              type="text"
              className="email-login-btn"
              onClick={() => setShowLoginForm(!showLoginForm)}
              disabled={isLoggingIn}
            >
              이메일로 로그인하기
            </Button>

            {showLoginForm && (
              <Form className="login-form">
                <Input
                  type="email"
                  placeholder="이메일을 입력해주세요"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  disabled={isLoggingIn}
                />
                <Input.Password
                  placeholder="비밀번호를 입력해주세요"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  disabled={isLoggingIn}
                />
                <Button className="purple-login-btn" onClick={handleLogin} loading={isLoggingIn} disabled={isLoggingIn}>
                  로그인
                </Button>
                <div className="signup-footer">
                  <span className="signup-link-text">계정이 없으신가요? </span>
                  <Button type="text" className="signup-link" onClick={onSignupClick} disabled={isLoggingIn}>
                    회원가입하기
                  </Button>
                </div>
              </Form>
            )}
          </div>
        </>
      )}
    </main>
  );
}

export default MainPage;
