import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');

  if (code) {
    axios
      .get(`/api/oauth/naver/callback${location.search}`)
      .then(response => {
        const { token } = response.data;
        if (token) {
          localStorage.setItem('token', token);
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      })
      .catch(error => {
        console.error('로그인 처리 중 오류 발생:', error);
        navigate('/');
      });
  }
}, [location, navigate]);

// function Callback() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   useEffect(() => {
//     const code = new URLSearchParams(location.search).get('code');
//     if (code) {
//       // 1. 백엔드에 'code'를 보내 JWT 토큰을 요청
//       axios.get(`/api/oauth/naver/callback${location.search}`) // 기존 백엔드 API 주소 (프록시 설정 가정)
//         .then(response => {
//           // 2. 응답받은 JSON에서 토큰을 추출
//           const { token } = response.data;
//           // 3. 토큰을 localStorage나 cookie 등에 저장
//           localStorage.setItem('token', token);
//           // 4. 프론트엔드(React Router)가 직접 대시보드로 이동
//           navigate('/dashboard');
//         })
//         .catch(error => {
//           console.error('로그인 처리 중 오류 발생:', error);
//           navigate('/login'); // 실패 시 로그인 페이지로
//         });
//     }
//   }, [location, navigate]);
//   return <div>로그인 처리 중...</div>; // 로딩 중 화면
// }