import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import { Button, Card, Spin, Dropdown } from 'antd';
import './Dashboard.css';

function Dashboard({ username: initialUsername = '사용자', onLogout, onNewCreationClick }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState(initialUsername);
  const [selectedCategory, setSelectedCategory] = useState('청첩장');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // URL 토큰(OAuth) 처리: localStorage에 저장 후 URL 정리
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
          localStorage.setItem('access_token', token);
          window.history.replaceState({}, '', '/dashboard');
        }
        
        // 서버에서 최신 사용자 정보 가져오기
        const user = await getCurrentUser();
        setUsername(user?.name || initialUsername);
      } catch (e) {
        // 인증 실패 시 로그인 페이지로 이동
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [navigate, initialUsername]);

  const categories = ['청첩장', '돌잔치', '감사장'];
  
  const cards = [
    { id: 1, title: '김철수 & 이영희 청첩장', createAt: '2024.01.15' },
    { id: 2, title: '박민수 & 정수진 청첩장', createAt: '2024.01.10' },
    { id: 3, title: '최동현 & 한미영 청첩장', createAt: '2024.01.08' },
    { id: 4, title: '이준호 & 김지은 청첩장', createAt: '2024.01.05' },
    { id: 5, title: '강태현 & 박소영 청첩장', createAt: '2024.01.03' },
  ];

  const menuItems = [
    { key: '1', label: '보기' },
    { key: '2', label: '수정하기' },
    { key: '3', label: '참석의사 응답보기' },
    { key: '4', label: '카카오톡 공유하기' },
    { key: '5', label: '링크 복사하기' },
    { key: '6', label: '삭제하기', danger: true }
  ];

  if (isLoading) {
    return <Spin style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} />;
  }

  return (
    <main className="dashboard-content">
      <div className="welcome-section">
        <h2 className="welcome-text">{username}님, 반갑습니다.</h2>
      </div>

      <div className="category-tabs">
        {categories.map((category) => (
          <Button
            key={category}
            type={selectedCategory === category ? 'primary' : 'text'}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="cards-grid">
        {cards.map((card) => (
          <Dropdown
            key={card.id}
            menu={{ items: menuItems }}
            trigger={['contextMenu']}
          >
            <Card
              className="card"
              hoverable
            >
              <div className="card-content">
                <div className="card-title">{card.title}</div>
                <div className="card-date">{card.createAt}</div>
              </div>
            </Card>
          </Dropdown>
        ))}
        
        <Card
          className="card new-card"
          hoverable
          onClick={onNewCreationClick}
        >
          <div className="new-card-content">
            <div className="plus-icon">+</div>
            <div className="new-card-text">새로 제작하기</div>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default Dashboard;