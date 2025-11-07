import React, { useState } from 'react';
import { DatePicker, TimePicker, Input, Button } from 'antd';
import dayjs from 'dayjs';
import { uploadCoverImage, createInvitationDraft, searchPlaces } from '../services/api';

// 5개의 화면(단계)을 각각의 컴포넌트로 분리합니다.
// CSS 슬라이드를 위해 모든 스텝을 항상 렌더링합니다.

// =======================
// 결혼식 청첩장 단계들
// =======================

// 단계 1: 결혼식 청첩장 선택 (예식 날짜 및 시간)
const Step1 = ({ username, value, onChange, onNext }) => {
  const handleDateChange = (date) => {
    if (date) {
      onChange({
        ...value,
        year: date.year(),
        month: date.month() + 1,
        day: date.date(),
      });
    }
  };

  const handleTimeChange = (time) => {
    if (time) {
      onChange({
        ...value,
        hour: time.hour(),
        minute: time.minute(),
      });
    }
  };

  const dateValue = dayjs(`${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`);
  const timeValue = dayjs().hour(value.hour).minute(value.minute).second(0);

  return (
    <div className="wizard-step">
      <h2 className="wizard-title">{username}님, <br />결혼식 청첩장을 선택하셨어요.</h2>
      <p className="wizard-subtitle">예식 날짜와 시간을 선택해주세요. <br />나중에 변경할 수 있어요.</p>
      <div className="wizard-input-group">
        <label>예식 날짜</label>
        <DatePicker
          value={dateValue}
          onChange={handleDateChange}
          format="YYYY년 MM월 DD일"
          style={{ width: '100%' }}
          size="large"
        />
        <label style={{ marginTop: '16px' }}>예식 시간</label>
        <TimePicker
          value={timeValue}
          onChange={handleTimeChange}
          format="HH시 mm분"
          style={{ width: '100%' }}
          size="large"
          minuteStep={10}
        />
      </div>
      <button className="wizard-btn-primary" onClick={onNext}>
        다음
      </button>
    </div>
  );
};

// 단계 2: 예식 장소 입력 (검색 입력 + 버튼 + 결과 리스트 → 선택 시 채움)
const Step2 = ({ username, address, venueName, onChange, onNext }) => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    if (!searchText.trim()) return;
    try {
      setLoading(true);
      const data = await searchPlaces(searchText.trim());
      setResults(data);
    } catch (e) {
      alert(e.message || '검색 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    onChange({ address: item.address || '', venueName: item.name || '' });
    setSearchText(item.name || '');
    setResults([]);
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-title">{username}님, <br />예식 장소를 입력해주세요.</h2>
      <div className="wizard-input-group">
        <label>예식장 이름을 검색해주세요</label>
        <div style={{ position: 'relative', width: '100%' }}>
          <Input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={doSearch}
            size="large"
            style={{ paddingRight: '80px' }}
          />
          <Button
            type="primary"
            onClick={doSearch}
            disabled={loading}
            loading={loading}
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '67px',
              height: 'calc(100% - 8px)',
            }}
          >
            {loading ? '검색중' : '검색'}
          </Button>
        </div>

        {/* 검색 결과 리스트 */}
        {results.length > 0 && (
          <div style={{ marginTop: '12px', border: '1px solid #e5e5e5', borderRadius: 6, maxHeight: 220, overflowY: 'auto' }}>
            {results.map((item, idx) => (
              <div
                key={item.id || `${item.name}-${idx}`}
                style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f2f2f2' }}
                onClick={() => handleSelect(item)}
              >
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ color: '#666', fontSize: 12 }}>{item.address}</div>
              </div>
            ))}
          </div>
        )}

        <label style={{ marginTop: '16px' }}>예식장 이름</label>
        <Input type="text" value={venueName} onChange={(e) => onChange({ address, venueName: e.target.value })} size="large" />
        <label>주소</label>
        <Input type="text" value={address} onChange={(e) => onChange({ address: e.target.value, venueName })} size="large" />
      </div>
      <button className="wizard-btn-primary" onClick={onNext}>
        다음
      </button>
    </div>
  );
};

// 단계 3: 신랑/신부 성함
const Step3 = ({ username, groomName, brideName, onChange, onNext }) => (
  <div className="wizard-step">
    <h2 className="wizard-title">{username}님, <br />신랑, 신부님 성함을 입력해주세요.</h2>
    <p className="wizard-subtitle">중복 입력 없이 쉽게 도와드릴게요. <br />나중에 변경할 수 있어요.</p>
    <div className="wizard-input-group">
      <label>신랑님 성함</label>
      <Input type="text" value={groomName} onChange={(e) => onChange({ groomName: e.target.value, brideName })} size="large" />
      <label>신부님 성함</label>
      <Input type="text" value={brideName} onChange={(e) => onChange({ groomName, brideName: e.target.value })} size="large" />
    </div>
    <button className="wizard-btn-primary" onClick={onNext}>
      다음
    </button>
  </div>
);

// 단계 4: 청첩장 메인 커버사진
const Step4 = ({ username, coverPreview, onFileSelected, onNext }) => {
  return (
    <div className="wizard-step">
      <h2 className="wizard-title">{username}님, <br />청첩장 메인 커버사진을 골라주세요.</h2>
      <p className="wizard-subtitle">나중에 변경할 수 있어요.</p>
      <label htmlFor="cover-image-upload" className="wizard-image-placeholder large upload-box" style={{ cursor: 'pointer' }}>
        {coverPreview ? (
          <img src={coverPreview} alt="커버 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '80px', color: '#ccc' }}>×</span>
        )}
      </label>
      <input
        id="cover-image-upload"
        type="file"
        accept="image/*"
        onChange={onFileSelected}
        style={{ display: 'none' }}
      />
      <button className="wizard-btn-primary" onClick={onNext}>
        다음
      </button>
    </div>
  );
};

// 단계 5: 결혼 축하 (메인 사진)
const Step5 = ({ username, onNext }) => (
  <div className="wizard-step">
    <h2 className="wizard-title">{username}님, <br />결혼 축하드려요.</h2>
    <div className="wizard-image-placeholder large">
      <img 
        src="https://i.imgur.com/gS4kXcp.png" 
        alt="Wedding sample" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
    </div>
    <button className="wizard-btn-primary" onClick={onNext}>
      청첩장 생성하러 가기
    </button>
  </div>
);

// =======================
// 돌잔치 초대장 단계들
// =======================

// 돌쟔치 단계 1: 돌쟔치 선택 확인
const DolStep1 = ({ username, onNext }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(14);
  const [minute, setMinute] = useState(0);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 10, 20, 30, 40, 50];

  return (
    <div className="wizard-step">
      <h2 className="wizard-title">{username}님, <br />돌잔치 초대장을 선택하셨어요.</h2>
      <p className="wizard-subtitle">돌잔치 날짜와 시간을 선택해주세요. <br />나중에 변경할 수 있어요.</p>
      <div className="wizard-input-group">
        <label>행사 날짜</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ flex: 1, padding: '10px' }}>
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ flex: 1, padding: '10px' }}>
            {months.map(m => <option key={m} value={m}>{m}월</option>)}
          </select>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} style={{ flex: 1, padding: '10px' }}>
            {days.map(d => <option key={d} value={d}>{d}일</option>)}
          </select>
        </div>
        <label>행사 시간</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={hour} onChange={(e) => setHour(Number(e.target.value))} style={{ flex: 1, padding: '10px' }}>
            {hours.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}시</option>)}
          </select>
          <select value={minute} onChange={(e) => setMinute(Number(e.target.value))} style={{ flex: 1, padding: '10px' }}>
            {minutes.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}분</option>)}
          </select>
        </div>
      </div>
      <button className="wizard-btn-primary" onClick={onNext}>
        다음
      </button>
    </div>
  );
};

// 돌잔치 단계 2: 행사 장소 입력
const DolStep2 = ({ username, onNext }) => (
  <div className="wizard-step">
    <h2 className="wizard-title">{username}님, <br />행사 장소를 입력해주세요.</h2>
    <p className="wizard-subtitle">행사 장소를 등록해 주세요.</p>
    <div className="wizard-input-group">
      <button className="wizard-btn-address-search">주소 검색</button>
      <label>주소</label>
      <input type="text" placeholder="경기도 성남시 분당구 판교로 228번길 16" />
      <label>행사장 이름</label>
      <input type="text" placeholder="W스퀘어컨벤션" />
    </div>
    <button className="wizard-btn-primary" onClick={onNext}>
      다음
    </button>
  </div>
);

// 돌잔치 단계 3: 아기 이름 입력
const DolStep3 = ({ username, onNext }) => {
  const [childCount, setChildCount] = useState(1);

  const addChild = () => {
    if (childCount < 3) {
      setChildCount(childCount + 1);
    }
  };

  const renderChildInputs = () => {
    const inputs = [];
    for (let i = 1; i <= childCount; i++) {
      inputs.push(
        <div key={i}>
          <label>아기 이름 {i}</label>
          <input type="text" placeholder={`(아기이름 ${i})`} />
        </div>
      );
    }
    return inputs;
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-title">{username}님, <br />아기 이름을 입력해주세요.</h2>
      <p className="wizard-subtitle">중복 입력 없이 쉬게 도와드릴게요. <br />나중에 변경할 수 있어요.</p>
      <div className="wizard-input-group">
        {renderChildInputs()}
        {childCount < 3 && (
          <button className="wizard-btn-secondary" onClick={addChild} style={{ marginTop: '10px' }}>
            + 아기 추가
          </button>
        )}
      </div>
      <button className="wizard-btn-primary" onClick={onNext}>
        다음
      </button>
    </div>
  );
};

// 돌잔치 단계 4: 메인 커버 사진 업로드 (돌상)
const DolStep4 = ({ username, onNext }) => {
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-title">{username}님, <br />메인 커버 사진을 골라주세요.</h2>
      <p className="wizard-subtitle">행복한 커버사진으로 사용돼요. <br />나중에 변경할 수 있어요.</p>
      <label htmlFor="dol-cover-image-upload" className="wizard-image-placeholder large upload-box" style={{ cursor: 'pointer' }}>
        {uploadedImage ? (
          <img src={uploadedImage} alt="커버 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '80px', color: '#ccc' }}>×</span>
        )}
      </label>
      <input
        id="dol-cover-image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <button className="wizard-btn-primary" onClick={onNext}>
        다음
      </button>
    </div>
  );
};

// 돌잔치 단계 5: 아기가 너무 예뻐요. 축하드려요. (메인 사진)
const DolStep5 = ({ username, onNext }) => (
  <div className="wizard-step">
    <h2 className="wizard-title">{username}님, <br />아기가 너무 예뻐요. 축하드려요.</h2>
    <p className="wizard-subtitle">행복한 모습 사진으로 사용할게요. <br />나중에 변경할 수 있어요.</p>
    <div className="wizard-image-placeholder large">
      {/* 돌잔치 데모 이미지 */}
      <img 
        src="https://i.imgur.com/sample-dol.png" 
        alt="Dol sample" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
    </div>
    <button className="wizard-btn-primary" onClick={onNext}>
      초대장 생성하러 가기
    </button>
  </div>
);


// --- 메인 컴포넌트 ---
function InvitationEditor({ username, invitationType, onBack, onNext }) {
  const [currentStep, setCurrentStep] = useState(0); // 0부터 4까지 (총 5단계)
  const totalSteps = 5;
  
  // 초대장 타입에 따라 다른 단계 표시
  const isDol = invitationType === '돌잔치 초대장';

  // 수집할 값들 상태
  const [dateTime, setDateTime] = useState({ year: new Date().getFullYear(), month: 1, day: 1, hour: 14, minute: 0 });
  const [address, setAddress] = useState('');
  const [venueName, setVenueName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // 마지막 단계에서 저장 처리
    try {
      setSaving(true);

      let uploadResult = null;
      if (coverFile) {
        uploadResult = await uploadCoverImage(coverFile);
      }

      const weddingDate = new Date(dateTime.year, dateTime.month - 1, dateTime.day);
      const weddingTime = `${String(dateTime.hour).padStart(2, '0')}:${String(dateTime.minute).padStart(2, '0')}:00`;

      await createInvitationDraft({
        template_id: 1, // 자체제작 기본 템플릿 ID 가정
        wedding_date: `${weddingDate.getFullYear()}-${String(dateTime.month).padStart(2, '0')}-${String(dateTime.day).padStart(2, '0')}`,
        wedding_time: weddingTime,
        venue_address: address,
        venue_name: venueName,
        groom_name: groomName,
        bride_name: brideName,
        cover_photo_key: uploadResult?.key || null,
      });

      if (onNext) onNext();
    } catch (e) {
      alert(e.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack(); 
    }
  };

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <main className="wizard-container">
      <div className="wizard-navigation">
        <button onClick={handlePrev} className="wizard-nav-btn">〈</button>
        <div className="wizard-progress-bar">
          <div 
            className="wizard-progress-fill" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <button onClick={handleNext} className="wizard-nav-btn" disabled={saving}>{saving ? '저장중' : '〉'}</button>
      </div>

      <div className="wizard-slider-viewport">
        <div 
          className="wizard-slider-container"
          style={{ 
            transform: `translateX(-${currentStep * 20}%)`
          }}
        >
          {isDol ? (
            <>
              <DolStep1 username={username} onNext={handleNext} />
              <DolStep2 username={username} onNext={handleNext} />
              <DolStep3 username={username} onNext={handleNext} />
              <DolStep4 username={username} onNext={handleNext} />
              <DolStep5 username={username} onNext={handleNext} />
            </>
          ) : (
            <>
              <Step1 username={username} value={dateTime} onChange={setDateTime} onNext={() => setCurrentStep(1)} />
              <Step2 username={username} address={address} venueName={venueName} onChange={({ address: a, venueName: v }) => { setAddress(a); setVenueName(v); }} onNext={() => setCurrentStep(2)} />
              <Step3 username={username} groomName={groomName} brideName={brideName} onChange={({ groomName: g, brideName: b }) => { setGroomName(g); setBrideName(b); }} onNext={() => setCurrentStep(3)} />
              <Step4 username={username} coverPreview={coverPreview} onFileSelected={handleFileSelected} onNext={() => setCurrentStep(4)} />
              <Step5 username={username} onNext={handleNext} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default InvitationEditor;