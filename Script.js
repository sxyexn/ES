// 전역 변수
let currentProfile = null;
let profiles = [];
let selectedIcon = '😊';

// 로컬 스토리지 키
const STORAGE_KEYS = {
    PROFILES: 'english_study_profiles',
    CURRENT_PROFILE: 'english_study_current_profile'
};

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadProfiles();
    
    // 기본 프로필이 없으면 생성
    if (profiles.length === 0) {
        profiles = [{
            id: generateId(),
            name: '나',
            icon: '😊',
            contents: []
        }];
        saveProfiles();
    }
    
    renderProfiles();
    
    // 이전에 선택된 프로필이 있으면 자동 로그인
    const lastProfileId = localStorage.getItem(STORAGE_KEYS.CURRENT_PROFILE);
    if (lastProfileId) {
        const profile = profiles.find(p => p.id === lastProfileId);
        if (profile) {
            selectProfile(lastProfileId);
            return;
        }
    }
    
    // 첫 화면은 프로필 선택
    showProfileScreen();
});

// ID 생성
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 프로필 관리
function loadProfiles() {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (data) {
        profiles = JSON.parse(data);
    }
}

function saveProfiles() {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

function renderProfiles() {
    const container = document.getElementById('profile-list');
    container.innerHTML = '';
    
    profiles.forEach(profile => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.onclick = () => selectProfile(profile.id);
        
        card.innerHTML = `
            <div class="profile-icon">${profile.icon}</div>
            <div class="profile-name">${profile.name}</div>
            ${profiles.length > 1 ? `<button class="profile-delete" onclick="event.stopPropagation(); deleteProfile('${profile.id}')">×</button>` : ''}
        `;
        
        container.appendChild(card);
    });
}

function selectProfile(profileId) {
    currentProfile = profiles.find(p => p.id === profileId);
    if (!currentProfile) return;
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROFILE, profileId);
    
    document.getElementById('current-profile-name').textContent = currentProfile.name;
    document.getElementById('profile-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    
    renderContents();
}

function showProfileScreen() {
    currentProfile = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROFILE);
    
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('profile-screen').classList.add('active');
}

function showAddProfile() {
    document.getElementById('profile-name').value = '';
    selectedIcon = '😊';
    updateIconSelection();
    document.getElementById('profile-modal').classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.remove('active');
}

function selectIcon(icon) {
    selectedIcon = icon;
    updateIconSelection();
}

function updateIconSelection() {
    document.querySelectorAll('.icon-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.icon === selectedIcon) {
            btn.classList.add('selected');
        }
    });
}

function saveProfile() {
    const name = document.getElementById('profile-name').value.trim();
    
    if (!name) {
        alert('프로필 이름을 입력해주세요.');
        return;
    }
    
    const newProfile = {
        id: generateId(),
        name: name,
        icon: selectedIcon,
        contents: []
    };
    
    profiles.push(newProfile);
    saveProfiles();
    renderProfiles();
    closeProfileModal();
}

function deleteProfile(profileId) {
    if (profiles.length === 1) {
        alert('최소 1개의 프로필은 필요합니다.');
        return;
    }
    
    if (confirm('이 프로필을 삭제하시겠습니까? 모든 학습 기록이 삭제됩니다.')) {
        profiles = profiles.filter(p => p.id !== profileId);
        saveProfiles();
        renderProfiles();
    }
}

// 콘텐츠 관리
function renderContents() {
    const container = document.getElementById('content-list');
    const emptyState = document.getElementById('empty-state');
    
    container.innerHTML = '';
    
    if (!currentProfile.contents || currentProfile.contents.length === 0) {
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    currentProfile.contents.forEach(content => {
        const card = createContentCard(content);
        container.appendChild(card);
    });
}

function createContentCard(content) {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    const completedRounds = content.rounds ? content.rounds.length : 0;
    const targetRounds = content.targetRounds || 5;
    const progress = (completedRounds / targetRounds) * 100;
    
    const avgComprehension = content.rounds && content.rounds.length > 0
        ? Math.round(content.rounds.reduce((sum, r) => sum + (r.comprehension || 0), 0) / content.rounds.length)
        : 0;
    
    const lastRound = content.rounds && content.rounds.length > 0
        ? content.rounds[content.rounds.length - 1]
        : null;
    
    card.innerHTML = `
        <div class="content-header">
            <div class="content-type">${content.type}</div>
            <div class="content-title">${content.title}</div>
        </div>
        <div class="content-body">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
            </div>
            <div class="progress-text">
                <span>진행률</span>
                <span><strong>${completedRounds}</strong> / ${targetRounds} 회독</span>
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${avgComprehension}%</div>
                    <div class="stat-label">평균 이해도</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${lastRound ? lastRound.comprehension : 0}%</div>
                    <div class="stat-label">최근 이해도</div>
                </div>
            </div>
            <div class="content-actions">
                <button class="btn-success" onclick="openRoundModal('${content.id}')">회독 기록</button>
                <button class="btn-secondary" onclick="editContent('${content.id}')">수정</button>
                <button class="btn-danger" onclick="deleteContent('${content.id}')">삭제</button>
            </div>
        </div>
    `;
    
    return card;
}

function showAddContent() {
    document.getElementById('modal-title').textContent = '새 콘텐츠 추가';
    document.getElementById('content-id').value = '';
    document.getElementById('content-title').value = '';
    document.getElementById('content-type').value = '드라마';
    document.getElementById('target-rounds').value = '5';
    document.getElementById('content-modal').classList.add('active');
}

function editContent(contentId) {
    const content = currentProfile.contents.find(c => c.id === contentId);
    if (!content) return;
    
    document.getElementById('modal-title').textContent = '콘텐츠 수정';
    document.getElementById('content-id').value = content.id;
    document.getElementById('content-title').value = content.title;
    document.getElementById('content-type').value = content.type;
    document.getElementById('target-rounds').value = content.targetRounds || 5;
    document.getElementById('content-modal').classList.add('active');
}

function saveContent() {
    const id = document.getElementById('content-id').value;
    const title = document.getElementById('content-title').value.trim();
    const type = document.getElementById('content-type').value;
    const targetRounds = parseInt(document.getElementById('target-rounds').value);
    
    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }
    
    if (id) {
        // 수정
        const content = currentProfile.contents.find(c => c.id === id);
        if (content) {
            content.title = title;
            content.type = type;
            content.targetRounds = targetRounds;
        }
    } else {
        // 새로 추가
        const newContent = {
            id: generateId(),
            title: title,
            type: type,
            targetRounds: targetRounds,
            rounds: [],
            createdAt: new Date().toISOString()
        };
        currentProfile.contents.push(newContent);
    }
    
    saveProfiles();
    renderContents();
    closeModal();
}

function deleteContent(contentId) {
    if (confirm('이 콘텐츠를 삭제하시겠습니까? 모든 회독 기록이 삭제됩니다.')) {
        currentProfile.contents = currentProfile.contents.filter(c => c.id !== contentId);
        saveProfiles();
        renderContents();
    }
}

function closeModal() {
    document.getElementById('content-modal').classList.remove('active');
}

// 회독 기록 관리
function openRoundModal(contentId) {
    const content = currentProfile.contents.find(c => c.id === contentId);
    if (!content) return;
    
    document.getElementById('round-modal-title').textContent = `${content.title} - 회독 기록`;
    document.getElementById('round-content-id').value = contentId;
    
    renderRounds(content);
    
    document.getElementById('round-modal').classList.add('active');
}

function renderRounds(content) {
    const container = document.getElementById('rounds-list');
    container.innerHTML = '';
    
    if (!content.rounds || content.rounds.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">아직 회독 기록이 없습니다.</p>';
        return;
    }
    
    content.rounds.forEach((round, index) => {
        const item = document.createElement('div');
        item.className = 'round-item';
        item.onclick = () => editRound(content.id, index);
        
        const keywords = round.keywords ? round.keywords.split(',').map(k => k.trim()).filter(k => k) : [];
        
        item.innerHTML = `
            <div class="round-header">
                <div class="round-number">${index + 1}회독</div>
                <div class="round-date">${formatDate(round.date)}</div>
            </div>
            <div class="round-progress">
                <div class="round-progress-bar">
                    <div class="round-progress-fill" style="width: ${round.comprehension}%"></div>
                </div>
                <div class="round-progress-text">${round.comprehension}%</div>
            </div>
            ${round.notes ? `<div class="round-notes-preview">${round.notes}</div>` : ''}
            ${keywords.length > 0 ? `
                <div class="round-keywords">
                    ${keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
                </div>
            ` : ''}
        `;
        
        container.appendChild(item);
    });
}

function addNewRound() {
    const contentId = document.getElementById('round-content-id').value;
    const content = currentProfile.contents.find(c => c.id === contentId);
    if (!content) return;
    
    const roundIndex = content.rounds.length;
    
    document.getElementById('round-detail-title').textContent = `${roundIndex + 1}회독 기록`;
    document.getElementById('round-detail-content-id').value = contentId;
    document.getElementById('round-detail-index').value = roundIndex;
    document.getElementById('round-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('round-comprehension').value = '50';
    document.getElementById('comprehension-value').textContent = '50';
    document.getElementById('round-notes').value = '';
    document.getElementById('round-keywords').value = '';
    document.getElementById('delete-round-btn').style.display = 'none';
    
    document.getElementById('round-modal').classList.remove('active');
    document.getElementById('round-detail-modal').classList.add('active');
}

function editRound(contentId, roundIndex) {
    const content = currentProfile.contents.find(c => c.id === contentId);
    if (!content || !content.rounds[roundIndex]) return;
    
    const round = content.rounds[roundIndex];
    
    document.getElementById('round-detail-title').textContent = `${roundIndex + 1}회독 기록`;
    document.getElementById('round-detail-content-id').value = contentId;
    document.getElementById('round-detail-index').value = roundIndex;
    document.getElementById('round-date').value = round.date || new Date().toISOString().split('T')[0];
    document.getElementById('round-comprehension').value = round.comprehension || 50;
    document.getElementById('comprehension-value').textContent = round.comprehension || 50;
    document.getElementById('round-notes').value = round.notes || '';
    document.getElementById('round-keywords').value = round.keywords || '';
    document.getElementById('delete-round-btn').style.display = 'block';
    
    document.getElementById('round-modal').classList.remove('active');
    document.getElementById('round-detail-modal').classList.add('active');
}

function saveRoundDetail() {
    const contentId = document.getElementById('round-detail-content-id').value;
    const roundIndex = parseInt(document.getElementById('round-detail-index').value);
    const date = document.getElementById('round-date').value;
    const comprehension = parseInt(document.getElementById('round-comprehension').value);
    const notes = document.getElementById('round-notes').value.trim();
    const keywords = document.getElementById('round-keywords').value.trim();
    
    const content = currentProfile.contents.find(c => c.id === contentId);
    if (!content) return;
    
    const round = {
        date: date,
        comprehension: comprehension,
        notes: notes,
        keywords: keywords
    };
    
    if (roundIndex < content.rounds.length) {
        // 수정
        content.rounds[roundIndex] = round;
    } else {
        // 새로 추가
        content.rounds.push(round);
    }
    
    saveProfiles();
    closeRoundDetailModal();
    openRoundModal(contentId);
    renderContents();
}

function deleteRound() {
    if (!confirm('이 회독 기록을 삭제하시겠습니까?')) return;
    
    const contentId = document.getElementById('round-detail-content-id').value;
    const roundIndex = parseInt(document.getElementById('round-detail-index').value);
    
    const content = currentProfile.contents.find(c => c.id === contentId);
    if (!content) return;
    
    content.rounds.splice(roundIndex, 1);
    saveProfiles();
    closeRoundDetailModal();
    openRoundModal(contentId);
    renderContents();
}

function updateComprehensionValue(value) {
    document.getElementById('comprehension-value').textContent = value;
}

function closeRoundModal() {
    document.getElementById('round-modal').classList.remove('active');
}

function closeRoundDetailModal() {
    document.getElementById('round-detail-modal').classList.remove('active');
}

// 유틸리티 함수
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}.${month}.${day}`;
}