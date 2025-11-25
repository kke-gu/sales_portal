// 견적 목록 로드 및 표시
document.addEventListener('DOMContentLoaded', function() {
    // 견적서명이 없는 데이터 삭제
    deleteEstimatesWithoutQuoteName();
    
    initAuth();
    initFilters();
    loadEstimateList();
});

// 견적서명이 없는 데이터 삭제 함수
function deleteEstimatesWithoutQuoteName() {
    let estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const originalLength = estimates.length;
    
    estimates = estimates.filter(estimate => {
        return estimate.quoteName && estimate.quoteName.trim() !== '';
    });
    
    if (estimates.length !== originalLength) {
        localStorage.setItem('estimates', JSON.stringify(estimates));
        console.log(`${originalLength - estimates.length}개의 견적서명이 없는 데이터가 삭제되었습니다.`);
    }
}

let allEstimates = [];
let currentPage = 1;
const itemsPerPage = 10;

function initFilters() {
    const purposeFilter = document.getElementById('purposeFilter');
    const managerFilter = document.getElementById('managerFilter');
    const textSearch = document.getElementById('textSearch');
    const myEstimatesOnly = document.getElementById('myEstimatesOnly');

    // 견적 담당자 드롭다운 초기화
    updateManagerFilter();

    // 필터 이벤트 리스너
    if (purposeFilter) {
        purposeFilter.addEventListener('change', applyFilters);
    }
    if (managerFilter) {
        managerFilter.addEventListener('change', applyFilters);
    }
    // 검색 버튼 클릭 이벤트
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }
    
    // 검색 입력창 엔터 키 이벤트
    if (textSearch) {
        textSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
    if (myEstimatesOnly) {
        myEstimatesOnly.addEventListener('change', applyFilters);
    }

    // 현황 탭 이벤트 리스너
    const statusTabs = document.querySelectorAll('.status-tab');
    statusTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 모든 탭에서 active 클래스 제거
            statusTabs.forEach(t => t.classList.remove('active'));
            // 클릭한 탭에 active 클래스 추가
            this.classList.add('active');
            // 필터 적용
            applyFilters();
        });
    });
}

function updateManagerFilter() {
    const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const managers = new Set();
    
    estimates.forEach(estimate => {
        if (estimate.managerName) {
            managers.add(estimate.managerName);
        }
    });

    const managerFilter = document.getElementById('managerFilter');
    if (!managerFilter) return;

    // 기존 옵션 유지 (전체 옵션)
    const currentValue = managerFilter.value;
    managerFilter.innerHTML = '<option value="">전체 견적 담당자</option>';
    
    Array.from(managers).sort().forEach(manager => {
        const option = document.createElement('option');
        option.value = manager;
        option.textContent = manager;
        managerFilter.appendChild(option);
    });

    // 이전 선택값 복원
    if (currentValue) {
        managerFilter.value = currentValue;
    }
}

function applyFilters() {
    currentPage = 1; // 필터 변경 시 첫 페이지로 리셋
    loadEstimateList();
}

function initAuth() {
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const userName = document.getElementById('userName');

    // 로그인 상태 확인
    if (Auth.isAuthenticated()) {
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) {
            // 프로필 정보에서 이름 가져오기
            const profileData = localStorage.getItem(`profile_${Auth.getCurrentUser()}`);
            if (profileData) {
                const profile = JSON.parse(profileData);
                userName.textContent = (profile.name || Auth.getCurrentUser()) + '님';
            } else {
                userName.textContent = Auth.getCurrentUser() + '님';
            }
        }
        if (loginBtn) loginBtn.style.display = 'none';
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-flex';
    }
}

function loadEstimateList() {
    allEstimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const tbody = document.getElementById('estimateListBody');
    
    if (!tbody) return;

    // 필터 적용
    let filteredEstimates = [...allEstimates];

    // 사용 목적 필터
    const purposeFilter = document.getElementById('purposeFilter');
    if (purposeFilter && purposeFilter.value) {
        filteredEstimates = filteredEstimates.filter(estimate => {
            if (!estimate.purpose || !Array.isArray(estimate.purpose)) return false;
            return estimate.purpose.includes(purposeFilter.value);
        });
    }

    // 견적 담당자 필터
    const managerFilter = document.getElementById('managerFilter');
    if (managerFilter && managerFilter.value) {
        filteredEstimates = filteredEstimates.filter(estimate => {
            return estimate.managerName === managerFilter.value;
        });
    }

    // 텍스트 검색
    const textSearch = document.getElementById('textSearch');
    if (textSearch && textSearch.value.trim()) {
        const searchTerm = textSearch.value.trim().toLowerCase();
        filteredEstimates = filteredEstimates.filter(estimate => {
            const customerName = (estimate.customerName || '').toLowerCase();
            const quoteName = (estimate.quoteName || '').toLowerCase();
            return customerName.includes(searchTerm) || quoteName.includes(searchTerm);
        });
    }

    // 내 견적서만 보기
    const myEstimatesOnly = document.getElementById('myEstimatesOnly');
    if (myEstimatesOnly && myEstimatesOnly.checked) {
        const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
        if (currentUser) {
            filteredEstimates = filteredEstimates.filter(estimate => {
                // createdBy 필드와 현재 사용자 비교
                return estimate.createdBy === currentUser;
            });
        }
    }

    // 현황 탭 필터
    const activeTab = document.querySelector('.status-tab.active');
    if (activeTab) {
        const statusValue = activeTab.getAttribute('data-status');
        if (statusValue) {
            filteredEstimates = filteredEstimates.filter(estimate => {
                return estimate.status === statusValue;
            });
        }
    }

    // 최신순으로 정렬 (등록일자 기준)
    filteredEstimates.sort((a, b) => {
        const dateA = new Date(a.registeredDate || a.createdAt);
        const dateB = new Date(b.registeredDate || b.createdAt);
        return dateB - dateA;
    });

    // 전체 개수 저장 (순번 계산용)
    const totalCount = filteredEstimates.length;
    
    if (totalCount === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--muted);">
                    조건에 맞는 견적서가 없습니다.
                </td>
            </tr>
        `;
        renderPagination(0, 0);
        return;
    }
    
    // 페이징 처리
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEstimates = filteredEstimates.slice(startIndex, endIndex);

    if (paginatedEstimates.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--muted);">
                    조건에 맞는 견적서가 없습니다.
                </td>
            </tr>
        `;
        renderPagination(totalPages, totalCount);
        return;
    }

    tbody.innerHTML = paginatedEstimates.map((estimate, index) => {
        // 역순 순번 계산 (전체 개수에서 역순으로)
        const cumulativeIndex = startIndex + index;
        const reverseIndex = totalCount - cumulativeIndex;
        // 등록일자 포맷팅 (시간 포함)
        let registeredDate = '-';
        if (estimate.registeredDate) {
            const date = new Date(estimate.registeredDate);
            registeredDate = date.toLocaleString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' ');
        } else if (estimate.createdAt) {
            const date = new Date(estimate.createdAt);
            registeredDate = date.toLocaleString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' ');
        }
        
        // 견적 유효일자 계산 (견적일자 + 7일 또는 validityPeriod에서 추출)
        let validDate = '-';
        if (estimate.quoteDate) {
            const quoteDate = new Date(estimate.quoteDate);
            quoteDate.setDate(quoteDate.getDate() + 7);
            validDate = quoteDate.toISOString().split('T')[0];
        } else if (estimate.validityPeriod) {
            // validityPeriod에서 날짜 추출 시도
            const dateMatch = estimate.validityPeriod.match(/(\d{4}[-.\/]\d{1,2}[-.\/]\d{1,2})/);
            if (dateMatch) {
                validDate = dateMatch[1].replace(/[.\/]/g, '-');
            }
        }

        // 현황 표시
        const statusText = getStatusText(estimate.status || 'draft');
        const statusClass = getStatusClass(estimate.status || 'draft');

        // 사용 목적 표시
        const purposeText = Array.isArray(estimate.purpose) && estimate.purpose.length > 0 
            ? estimate.purpose.join(', ') 
            : '-';

        // 계약 총액 (VAT 별도)
        let totalAmount = '-';
        if (estimate.totalAmount) {
            totalAmount = estimate.totalAmount;
        } else if (estimate.items && estimate.items.length > 0) {
            let total = 0;
            estimate.items.forEach(item => {
                const supplyPriceValue = item.supplyPrice || '';
                if (supplyPriceValue.trim() !== '') {
                    const numericString = supplyPriceValue.replace(/[^0-9.-]/g, '');
                    const numericValue = parseFloat(numericString);
                    if (!isNaN(numericValue)) {
                        total += numericValue;
                    }
                }
            });
            totalAmount = total.toLocaleString() + '원';
        }

        // 견적 담당자
        const managerName = estimate.managerName || '-';
        const managerPosition = estimate.managerPosition ? `(${estimate.managerPosition})` : '';
        const managerText = managerName !== '-' ? `${managerName} ${managerPosition}` : '-';

        const quoteNameDisplay = estimate.quoteName || '-';
        const quoteNameLink = quoteNameDisplay !== '-' 
            ? `<a href="estimate_view.html?id=${estimate.id}" style="color: var(--primary); text-decoration: none; font-weight: 500;" onclick="event.stopPropagation();">${quoteNameDisplay}</a>`
            : quoteNameDisplay;

        return `
            <tr>
                <td>${reverseIndex}</td>
                <td>${registeredDate}</td>
                <td>${validDate}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${estimate.customerName || '-'}</td>
                <td>${quoteNameLink}</td>
                <td>${purposeText}</td>
                <td style="text-align: right;">${totalAmount}</td>
                <td>${managerText}</td>
            </tr>
        `;
    }).join('');
    
    // 페이징 UI 렌더링
    renderPagination(totalPages, totalCount);
}

function renderPagination(totalPages, totalCount) {
    let paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationContainer';
        paginationContainer.className = 'pagination-container';
        const listContainer = document.querySelector('.estimate-list-container');
        if (listContainer) {
            listContainer.appendChild(paginationContainer);
        }
    }

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination">';
    
    // 이전 버튼
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})">이전</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>이전</button>`;
    }

    // 페이지 번호
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" onclick="goToPage(${i})">${i}</button>`;
        }
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // 다음 버튼
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})">다음</button>`;
    } else {
        paginationHTML += `<button class="pagination-btn" disabled>다음</button>`;
    }

    paginationHTML += '</div>';
    paginationHTML += `<div class="pagination-info">전체 ${totalCount}건 중 ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalCount)}건 표시</div>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

function goToPage(page) {
    currentPage = page;
    loadEstimateList();
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getStatusText(status) {
    const statusMap = {
        'draft': '임시 저장',
        'received': '접수',
        'writing': '작성중',
        'sent': '발송 완료',
        'negotiating': '협의 중',
        'confirmed': '계약 확정',
        'completed': '계약완료'
    };
    return statusMap[status] || '임시 저장';
}

function getStatusClass(status) {
    const classMap = {
        'draft': 'status-draft',
        'received': 'status-received',
        'writing': 'status-writing',
        'sent': 'status-sent',
        'negotiating': 'status-negotiating',
        'confirmed': 'status-confirmed',
        'completed': 'status-completed'
    };
    return classMap[status] || 'status-draft';
}

function viewEstimate(id) {
    window.location.href = `estimate_view.html?id=${id}`;
}

