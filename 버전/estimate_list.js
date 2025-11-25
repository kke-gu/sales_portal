// 견적 목록 로드 및 표시
document.addEventListener('DOMContentLoaded', function() {
    loadEstimateList();
    initAuth();
});

function initAuth() {
    const authSection = document.getElementById('authSection');
    const loginBtn = document.getElementById('loginBtn');
    const userSection = document.getElementById('userSection');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    // 로그인 상태 확인
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (currentUser) {
        loginBtn.style.display = 'none';
        userSection.style.display = 'flex';
        userName.textContent = currentUser.username;
        userName.href = 'profile.html';
    } else {
        loginBtn.style.display = 'inline-block';
        userSection.style.display = 'none';
    }

    // 로그아웃 버튼 이벤트
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
}

function loadEstimateList() {
    const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const tbody = document.getElementById('estimateListBody');
    
    if (!tbody) return;

    if (estimates.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--muted);">
                    저장된 견적서가 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    // 최신순으로 정렬 (등록일자 기준)
    estimates.sort((a, b) => {
        const dateA = new Date(a.registeredDate || a.createdAt);
        const dateB = new Date(b.registeredDate || b.createdAt);
        return dateB - dateA;
    });

    tbody.innerHTML = estimates.map((estimate, index) => {
        // 등록일자 포맷팅
        const registeredDate = estimate.registeredDate || (estimate.createdAt ? estimate.createdAt.split('T')[0] : '-');
        
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

        // 단계 표시
        const statusText = getStatusText(estimate.status || 'review');
        const statusClass = getStatusClass(estimate.status || 'review');

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

        return `
            <tr onclick="viewEstimate('${estimate.id}')" style="cursor: pointer;">
                <td>${index + 1}</td>
                <td>${registeredDate}</td>
                <td>${validDate}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${estimate.customerName || '-'}</td>
                <td>${estimate.quoteName || '-'}</td>
                <td>${purposeText}</td>
                <td style="text-align: right;">${totalAmount}</td>
                <td>${managerText}</td>
            </tr>
        `;
    }).join('');
}

function getStatusText(status) {
    const statusMap = {
        'review': '검토중',
        'draft': '임시저장',
        'approved': '승인',
        'rejected': '반려',
        'completed': '완료'
    };
    return statusMap[status] || '검토중';
}

function getStatusClass(status) {
    const classMap = {
        'review': 'status-review',
        'draft': 'status-draft',
        'approved': 'status-approved',
        'rejected': 'status-rejected',
        'completed': 'status-completed'
    };
    return classMap[status] || 'status-review';
}

function viewEstimate(id) {
    window.location.href = `estimate_view.html?id=${id}`;
}

