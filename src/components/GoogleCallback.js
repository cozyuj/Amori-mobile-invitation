import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; // axios 사용

// ⭐️ API 게이트웨이 주소 (.env 파일로 관리하는 것을 권장)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function GoogleCallback() {
  const location = useLocation(); // URL 쿼리 파라미터(code=...)를 가져오기 위함
  const navigate = useNavigate();   // 페이지 이동을 위함

  useEffect(() => {
    // 1. URL에서 code=... 부분을 가져옵니다 (location.search = "?code=...&state=...")
    const searchParams = location.search;

    if (!searchParams) {
      // 2. code가 없으면 비정상 접근. 로그인 페이지로 보냅니다.
      alert('비정상적인 접근입니다.');
      navigate('/login');
      return;
    }

    // 3. ⭐️ 백엔드의 콜백 API로 code를 그대로 전달
    axios.get(`${API_BASE_URL}/api/oauth/google/callback${searchParams}`)
      .then(response => {
        // 4. ⭐️ 백엔드가 보내준 JSON에서 access_token 추출
        const { access_token } = response.data;

        // 5. ⭐️ 토큰을 localStorage에 저장 (보안을 위해 httpOnly 쿠키가 더 좋지만, 우선)
        localStorage.setItem('access_token', access_token);

        // 6. ⭐️ 프론트엔드 라우터를 이용해 대시보드로 이동
        navigate('/dashboard'); 
        
        // (선택) 페이지 리로드로 대시보드에서 사용자 정보를 다시 불러오게 할 수도 있음
        // window.location.replace('/dashboard'); 
      })
      .catch(error => {
        // 7. 백엔드에서 에러가 발생한 경우
        console.error('구글 로그인 처리 중 오류 발생:', error);
        alert('로그인에 실패하였습니다. 다시 시도해주세요.');
        navigate('/login');
      });

  }, [location, navigate]); // 페이지가 처음 렌더링될 때 1회만 실행

  // 8. 사용자에게 로딩 중임을 표시
  return <div>로그인 처리 중입니다. 잠시만 기다려주세요...</div>;
}

export default GoogleCallback;