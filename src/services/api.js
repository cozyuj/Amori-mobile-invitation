/**
 * API service for backend communication
 * Handles authentication and user data
 */

const API_BASE_URL = process.env.REACT_APP_API_URL ;
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

/**
 * 회원가입 API 호출
 */
export const signup = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    body: formData, // FormData 객체 전달
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '회원가입 실패');
  }

  return response.json();
};

/**
 * 로그인 API 호출
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '로그인 실패');
  }

  const data = await response.json();

  // JWT 토큰 저장
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

/**
 * 현재 사용자 정보 조회
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem('access_token');

  const options = {
    method: 'GET',
  };
  if (token) {
    options.headers = { 'Authorization': `Bearer ${token}` };
  } else {
    options.credentials = 'include';
  }

  // 일반 로그인일 경우 Authorization 헤더 추가
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/user/me`, options);

    if (!response.ok) {
      if (token) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
      throw new Error('[INFO] 인증이 만료되었습니다.');
    }

    const user = await response.json();
    if (token) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
  } catch (error) {
    console.error('[DEBUG] 사용자 정보 조회 실패:', error);
    throw error;
  }
};

/**
 * 로그아웃
 */
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

/**
 * 프로필 이미지 업로드 (임시 비활성화)
 */
// export const uploadProfileImage = async (file) => {
//   const formData = new FormData();
//   formData.append('image', file);
//
//   const response = await fetch(`${API_BASE_URL}/api/auth/upload-image`, {
//     method: 'POST',
//     body: formData,
//   });
//
//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.detail || '이미지 업로드 실패');
//   }
//
//   return response.json();
// };

/**
 * 로컬 스토리지에서 사용자 정보 가져오기
 */
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * 로그인 상태 확인
 */
export const isLoggedIn = () => {
  return !!localStorage.getItem('access_token');
};


/**
 * 카카오 로그인 URL 요청
 */
export const getKakaoLoginUrl = async () => {
  const response = await fetch(`${API_BASE_URL}/api/oauth/kakao/login`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('카카오 로그인 URL을 가져오는데 실패했습니다.');
  }

  // 백엔드가 RedirectResponse를 반환하는 경우 직접 리다이렉트
  if (response.redirected) {
    return response.url;
  }

  // 백엔드가 JSON을 반환하는 경우
  const data = await response.json();
  return data.authUrl || data.url;
};

/**
 * 네이버 로그인 URL 요청
 */
export const getNaverLoginUrl = async () => {
  return `${API_BASE_URL}/api/oauth/nid/login`;
};

/**
 * 구글 로그인 URL 요청
 */
export const getGoogleLoginUrl = async () => {
  return `${API_BASE_URL}/api/oauth/google/login`;
};

// ===== Invitations APIs =====
export const uploadCoverImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/api/invitations/upload-cover`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || '커버 이미지 업로드 실패');
  }

  return response.json();
};

export const createInvitationDraft = async (payload) => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('로그인이 필요합니다.');

  const response = await fetch(`${API_BASE_URL}/api/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || '초대장 저장 실패');
  }

  return response.json();
};

// ===== Places Search API =====
export const searchPlaces = async (query, size = 10) => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API 키가 설정되지 않았습니다.');
  }
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
  url.searchParams.set('language', 'ko');
  url.searchParams.set('region', 'KR');

  const response = await fetch(url.toString(), { method: 'GET' });
  if (!response.ok) {
    throw new Error('장소 검색 실패');
  }

  const data = await response.json();
  if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.error_message || '장소 검색 실패');
  }

  const results = (data.results || []).slice(0, size).map((place) => ({
    id: place.place_id,
    name: place.name,
    address: place.formatted_address || '',
    location: place.geometry?.location || null,
  }));

  return results;
};