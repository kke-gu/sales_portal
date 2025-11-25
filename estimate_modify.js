// URL에서 견적서 ID 가져오기
function getEstimateId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// 견적서 데이터 로드 및 폼에 채우기
function loadEstimateForEdit() {
    const estimateId = getEstimateId();
    if (!estimateId) {
        alert('견적서 ID가 없습니다.');
        window.location.href = 'estimate_list.html';
        return;
    }

    const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const estimate = estimates.find(e => e.id === estimateId);

    if (!estimate) {
        alert('견적서를 찾을 수 없습니다.');
        window.location.href = 'estimate_list.html';
        return;
    }

    // 고객사 정보 폼 채우기
    const customerForm = document.getElementById('customerInfoForm');
    if (customerForm) {
        customerForm.querySelector('input[name="customerName"]').value = estimate.customerName || '';
        customerForm.querySelector('input[name="customerManager"]').value = estimate.customerManager || '';
        customerForm.querySelector('input[name="customerPosition"]').value = estimate.customerPosition || '';
        customerForm.querySelector('input[name="customerContact"]').value = estimate.customerContact || '';
        customerForm.querySelector('input[name="customerEmail"]').value = estimate.customerEmail || '';
        
        // 등록일자 표시
        if (estimate.registeredDate) {
            const date = new Date(estimate.registeredDate);
            const registeredDateStr = date.toLocaleString('ko-KR', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\./g, '-').replace(/,/g, '').replace(/\s/g, ' ');
            const registeredDateInput = document.getElementById('registeredDate');
            if (registeredDateInput) {
                registeredDateInput.value = registeredDateStr;
            }
        }
        
        // 단계 선택
        const statusSelect = document.getElementById('statusSelect');
        if (statusSelect) {
            statusSelect.value = estimate.status || 'review';
        }
        
        // 사용 목적 체크박스
        if (estimate.purpose && Array.isArray(estimate.purpose)) {
            estimate.purpose.forEach(purpose => {
                const checkbox = customerForm.querySelector(`input[name="purpose"][value="${purpose}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }

    // 견적서 폼 채우기
    const form = document.getElementById('estimateForm');
    if (form) {
        form.querySelector('input[name="recipient"]').value = estimate.recipient || '';
        form.querySelector('input[name="reference"]').value = estimate.reference || '';
        form.querySelector('input[name="quoteName"]').value = estimate.quoteName || '';
        form.querySelector('input[name="quoteDate"]').value = estimate.quoteDate || '';
        form.querySelector('textarea[name="paymentInfo"]').value = estimate.paymentInfo || '';
        form.querySelector('textarea[name="depositInfo"]').value = estimate.depositInfo || '';
        form.querySelector('input[name="managerName"]').value = estimate.managerName || '';
        form.querySelector('input[name="managerPosition"]').value = estimate.managerPosition || '';
        form.querySelector('input[name="managerContact"]').value = estimate.managerContact || '';
        form.querySelector('input[name="managerEmail"]').value = estimate.managerEmail || '';
        form.querySelector('textarea[name="validityPeriod"]').value = estimate.validityPeriod || '';
    }

    // 견적 항목 로드
    if (estimate.items && estimate.items.length > 0) {
        const tbody = document.getElementById('quoteItems');
        if (tbody) {
            tbody.innerHTML = '';
            estimate.items.forEach(item => {
                addQuoteItemFromData(item);
            });
            
            // 드래그 앤 드롭 이벤트 설정 (각 행에 대해)
            if (typeof setupQuoteRowDragEvents === 'function') {
                const rows = tbody.querySelectorAll('.quote-item-row');
                rows.forEach(row => {
                    setupQuoteRowDragEvents(row);
                });
            }
            
            // 자동 높이 조절 이벤트 설정
            if (typeof initAutoResize === 'function') {
                initAutoResize();
            }
        }
    }

    // 총액 계산
    if (typeof calculateTotal === 'function') {
        calculateTotal();
    }

    // 저장 시 기존 ID 유지하도록 설정
    window.currentEstimateId = estimateId;
    console.log('견적서 로드 완료, currentEstimateId 설정:', estimateId);
}

// 견적 항목을 데이터에서 추가
function addQuoteItemFromData(item) {
    const tbody = document.getElementById('quoteItems');
    if (!tbody) return;

    const row = document.createElement('tr');
    row.className = 'quote-item-row';
    row.draggable = true;
    
    row.innerHTML = `
        <td class="drag-handle" style="cursor: move; text-align: center; width: 30px;">☰</td>
        <td><textarea name="category[]" placeholder="구분" rows="1" class="auto-resize">${escapeHtml(item.category || '')}</textarea></td>
        <td><textarea name="detail[]" placeholder="세부 항목" rows="1" class="auto-resize">${escapeHtml(item.detail || '')}</textarea></td>
        <td class="period-col"><input type="number" name="period[]" placeholder="월" min="0" class="period-input" value="${item.period || ''}" /></td>
        <td><input type="number" name="quantity[]" placeholder="수량" min="1" value="${item.quantity || '1'}" class="quantity" /></td>
        <td><input type="text" name="unitPrice[]" placeholder="단가" class="unit-price" value="${escapeHtml(item.unitPrice || '')}" /></td>
        <td><input type="text" name="supplyPrice[]" placeholder="공급가액" class="supply-price" value="${escapeHtml(item.supplyPrice || '')}" /></td>
        <td><textarea name="remarks[]" placeholder="비고" rows="2" class="auto-resize">${escapeHtml(item.remarks || '')}</textarea></td>
        <td><button type="button" class="btn-icon-small remove-item">×</button></td>
    `;
    
    tbody.appendChild(row);
    
    // 이벤트 리스너 추가
    setupRowEvents(row);
}

// 행 이벤트 설정
function setupRowEvents(row) {
    // 삭제 버튼
    const removeBtn = row.querySelector('.remove-item');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            row.remove();
            if (typeof calculateTotal === 'function') {
                calculateTotal();
            }
        });
    }

    // 계산 이벤트
    const periodInput = row.querySelector('input[name="period[]"]');
    const quantityInput = row.querySelector('input[name="quantity[]"]');
    const unitPriceInput = row.querySelector('input[name="unitPrice[]"]');
    const supplyPriceInput = row.querySelector('input[name="supplyPrice[]"]');

    [periodInput, quantityInput, unitPriceInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                if (typeof calculateRowTotal === 'function') {
                    calculateRowTotal(row);
                }
                if (typeof calculateTotal === 'function') {
                    calculateTotal();
                }
            });
        }
    });

    if (supplyPriceInput) {
        supplyPriceInput.addEventListener('input', function() {
            if (typeof calculateTotal === 'function') {
                calculateTotal();
            }
        });
    }
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 견적서 저장 함수 (estimate_modify 전용)
function saveEstimateForModify() {
    const form = document.getElementById('estimateForm');
    if (!form) return;

    // 필수 입력값 검증
    if (typeof validateRequiredFields === 'function') {
        if (!validateRequiredFields()) {
            return;
        }
    }

    // 최신 총액 계산
    if (typeof calculateTotal === 'function') {
        calculateTotal();
    }

    const customerForm = document.getElementById('customerInfoForm');
    const customerFormData = customerForm ? new FormData(customerForm) : null;
    const formData = new FormData(form);

    // 고객사 정보
    const purpose = [];
    if (customerFormData) {
        customerFormData.getAll('purpose').forEach(val => {
            if (val) purpose.push(val);
        });
    }

    // 견적 항목 가져오기
    const items = [];
    if (typeof getCurrentItems === 'function') {
        items.push(...getCurrentItems());
    }

    // 프로필 정보에서 담당자 정보 가져오기
    const currentUser = Auth.getCurrentUser();
    const profileData = localStorage.getItem(`profile_${currentUser}`);
    let profile = {};
    if (profileData) {
        profile = JSON.parse(profileData);
    }

    const now = new Date();
    const estimateId = window.currentEstimateId;
    
    // ID가 없으면 에러
    if (!estimateId) {
        console.error('견적서 ID가 없습니다. window.currentEstimateId:', window.currentEstimateId);
        alert('견적서 ID를 찾을 수 없습니다. 목록 페이지로 이동합니다.');
        window.location.href = 'estimate_list.html';
        return;
    }

    // 기존 견적서 목록에서 찾기
    const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const existingEstimate = estimates.find(e => e.id === estimateId);
    
    console.log('견적서 수정 시도:', {
        estimateId: estimateId,
        existingEstimate: existingEstimate,
        estimatesCount: estimates.length
    });

    // 총액 계산
    const itemsTotalElement = document.getElementById('itemsTotalAmount');
    const totalAmount = itemsTotalElement ? itemsTotalElement.textContent : '0원';

    const estimateData = {
        id: estimateId,
        customerName: customerFormData ? customerFormData.get('customerName') || '' : '',
        customerManager: customerFormData ? customerFormData.get('customerManager') || '' : '',
        customerPosition: customerFormData ? customerFormData.get('customerPosition') || '' : '',
        customerContact: customerFormData ? customerFormData.get('customerContact') || '' : '',
        customerEmail: customerFormData ? customerFormData.get('customerEmail') || '' : '',
        purpose: purpose,
        recipient: formData.get('recipient') || '',
        reference: formData.get('reference') || '',
        quoteName: formData.get('quoteName') || '',
        quoteDate: formData.get('quoteDate') || '',
        items: items,
        paymentInfo: formData.get('paymentInfo') || '',
        depositInfo: formData.get('depositInfo') || '',
        managerName: formData.get('managerName') || profile.name || currentUser || '',
        managerPosition: formData.get('managerPosition') || profile.position || '',
        managerContact: formData.get('managerContact') || profile.phone || '',
        managerEmail: formData.get('managerEmail') || profile.email || '',
        validityPeriod: formData.get('validityPeriod') || '',
        totalAmount: totalAmount,
        registeredDate: existingEstimate ? existingEstimate.registeredDate : now.toISOString(),
        status: document.getElementById('statusSelect') ? document.getElementById('statusSelect').value : (existingEstimate ? existingEstimate.status : 'review'),
        createdBy: existingEstimate ? existingEstimate.createdBy : (currentUser || ''), // 작성자 유지
        createdAt: existingEstimate ? existingEstimate.createdAt : now.toISOString(),
        updatedAt: now.toISOString()
    };

    // 기존 견적서 목록에서 찾아서 업데이트
    const index = estimates.findIndex(e => e.id === estimateId);
    
    console.log('견적서 찾기 결과:', {
        index: index,
        estimateId: estimateId,
        allIds: estimates.map(e => e.id)
    });
    
    if (index !== -1) {
        // 기존 견적서 업데이트
        estimates[index] = estimateData;
        localStorage.setItem('estimates', JSON.stringify(estimates));
        console.log('견적서 업데이트 완료:', estimateData);
        alert('견적서가 수정되었습니다.');
        window.location.href = 'estimate_list.html';
    } else {
        // ID가 없거나 찾을 수 없는 경우 경고
        console.error('견적서를 찾을 수 없습니다. ID:', estimateId);
        alert('견적서를 찾을 수 없습니다. 목록 페이지로 이동합니다.');
        window.location.href = 'estimate_list.html';
    }
};

// 삭제 버튼 이벤트
function setupDeleteButton() {
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const estimateId = window.currentEstimateId;
            if (!estimateId) {
                alert('견적서 ID가 없습니다.');
                return;
            }
            
            if (confirm('정말로 이 견적서를 삭제하시겠습니까?')) {
                const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
                const filtered = estimates.filter(e => e.id !== estimateId);
                localStorage.setItem('estimates', JSON.stringify(filtered));
                alert('견적서가 삭제되었습니다.');
                window.location.href = 'estimate_list.html';
            }
        });
    }
}

// 페이지 로드 시 견적서 데이터 로드
document.addEventListener('DOMContentLoaded', function() {
    loadEstimateForEdit();
    setupDeleteButton();
    
    // 폼 submit 이벤트 직접 처리 (estimate.js보다 먼저 실행되도록 즉시 실행)
    const form = document.getElementById('estimateForm');
    if (form) {
        // 기존 이벤트 리스너를 제거하기 위해 폼을 새로 생성
        const handleSubmit = function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            saveEstimateForModify();
            return false;
        };
        
        // capture phase에서 먼저 등록
        form.addEventListener('submit', handleSubmit, true);
        
        // 버블링 phase에서도 등록
        form.addEventListener('submit', handleSubmit, false);
    }
    
    // 견적서 수정 버튼에 직접 이벤트 바인딩
    const saveBtn = document.querySelector('button[type="submit"]');
    if (saveBtn) {
        const handleClick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            saveEstimateForModify();
            return false;
        };
        
        // capture phase에서 먼저 등록
        saveBtn.addEventListener('click', handleClick, true);
        
        // 버블링 phase에서도 등록
        saveBtn.addEventListener('click', handleClick, false);
    }
    
    // 기존 saveEstimate 함수 오버라이드 (다른 스크립트에서 호출하는 경우 대비)
    window.saveEstimate = saveEstimateForModify;
});

