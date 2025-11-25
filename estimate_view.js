// URL에서 견적서 ID 가져오기
function getEstimateId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// 견적서 데이터 로드 및 표시
function loadEstimate() {
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

    // 고객사 정보 표시
    document.getElementById('viewCustomerName').textContent = estimate.customerName || '-';
    document.getElementById('viewCustomerManager').textContent = estimate.customerManager || '-';
    document.getElementById('viewCustomerPosition').textContent = estimate.customerPosition || '-';
    document.getElementById('viewCustomerContact').textContent = estimate.customerContact || '-';
    document.getElementById('viewCustomerEmail').textContent = estimate.customerEmail || '-';
    
    // 사용 목적 표시
    const purposeText = Array.isArray(estimate.purpose) && estimate.purpose.length > 0 
        ? estimate.purpose.join(', ') 
        : '-';
    document.getElementById('viewPurpose').textContent = purposeText;

    // 등록일자 표시 (시간 포함)
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
    document.getElementById('viewRegisteredDate').textContent = registeredDate;

    // 단계 표시 및 선택 가능하도록
    const statusSelect = document.getElementById('viewStatus');
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    if (statusSelect) {
        const currentStatus = estimate.status || 'review';
        statusSelect.value = currentStatus;
        
        // 변경 버튼 클릭 시에만 반영
        if (updateStatusBtn) {
            updateStatusBtn.addEventListener('click', function() {
                const newStatus = statusSelect.value;
                if (newStatus !== currentStatus) {
                    if (updateEstimateStatus(estimate.id, newStatus)) {
                        alert('단계가 변경되었습니다.');
                        // 페이지 새로고침하여 변경사항 반영
                        location.reload();
                    } else {
                        alert('단계 변경에 실패했습니다.');
                    }
                } else {
                    alert('변경된 내용이 없습니다.');
                }
            });
        }
    }

    // 수신 정보 표시
    document.getElementById('viewRecipient').textContent = estimate.recipient || '-';
    document.getElementById('viewReference').textContent = estimate.reference || '-';

    // 견적 기본 정보 표시
    document.getElementById('viewQuoteName').textContent = estimate.quoteName || '-';
    document.getElementById('viewQuoteDate').textContent = estimate.quoteDate || '-';

    // 견적 항목 표시
    displayQuoteItems(estimate.items || []);

    // 총액 계산 및 표시
    calculateAndDisplayTotal(estimate.items || []);

    // 결제 및 담당자 안내 표시
    document.getElementById('viewPaymentInfo').value = estimate.paymentInfo || '';
    document.getElementById('viewDepositInfo').value = estimate.depositInfo || '';
    document.getElementById('viewManagerName').value = estimate.managerName || '';
    document.getElementById('viewManagerPosition').value = estimate.managerPosition || '';
    document.getElementById('viewManagerContact').value = estimate.managerContact || '';
    document.getElementById('viewManagerEmail').value = estimate.managerEmail || '';
    document.getElementById('viewValidityPeriod').value = estimate.validityPeriod || '';

    // 미리보기 및 PDF 버튼 이벤트
    setupPreviewButtons(estimate);
    
    // 수정/삭제 버튼 표시 여부 확인 (본인이 작성한 경우에만 표시)
    checkEditDeletePermission(estimate);
}

function displayQuoteItems(items) {
    const tbody = document.getElementById('viewQuoteItems');
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--muted);">
                    견적 항목이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => {
        return `
            <tr>
                <td></td>
                <td style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.category || '')}</td>
                <td style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.detail || '')}</td>
                <td style="text-align: right;">${escapeHtml(item.period || '')}</td>
                <td style="text-align: right;">${escapeHtml(item.quantity || '')}</td>
                <td style="text-align: right;">${escapeHtml(item.unitPrice || '')}</td>
                <td style="text-align: right;">${escapeHtml(item.supplyPrice || '')}</td>
                <td style="text-align: left; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.remarks || '')}</td>
            </tr>
        `;
    }).join('');
}

function calculateAndDisplayTotal(items) {
    let total = 0;
    items.forEach(item => {
        const supplyPriceValue = item.supplyPrice || '';
        if (supplyPriceValue.trim() !== '') {
            const numericString = supplyPriceValue.replace(/[^0-9.-]/g, '');
            const numericValue = parseFloat(numericString);
            if (!isNaN(numericValue)) {
                total += numericValue;
            }
        }
    });

    const totalWithoutVAT = total;
    const totalWithVAT = Math.floor(total * 1.1);

    document.getElementById('viewTotalWithoutVAT').textContent = totalWithoutVAT.toLocaleString() + '원 (VAT 별도)';
    document.getElementById('viewTotalWithVAT').textContent = totalWithVAT.toLocaleString() + '원 (VAT 포함)';
    
    // 테이블 하단 계약 총액 표시
    const tableTotal = document.getElementById('viewTableTotal');
    if (tableTotal) {
        tableTotal.textContent = totalWithoutVAT.toLocaleString() + '원';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupPreviewButtons(estimate) {
    const previewBtn = document.getElementById('previewBtn');
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            showPreview(estimate);
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', function() {
            window.location.href = `estimate_modify.html?id=${estimate.id}`;
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (confirm('정말로 이 견적서를 삭제하시겠습니까?')) {
                deleteEstimate(estimate.id);
            }
        });
    }
}

// 미리보기 함수 (estimate.js의 showPreview와 유사)
function showPreview(estimate) {
    const previewWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!previewWindow) return;

    const items = estimate.items || [];
    let total = 0;
    items.forEach(item => {
        const supplyPriceValue = item.supplyPrice || '';
        if (supplyPriceValue.trim() !== '') {
            const numericString = supplyPriceValue.replace(/[^0-9.-]/g, '');
            const numericValue = parseFloat(numericString);
            if (!isNaN(numericValue)) {
                total += numericValue;
            }
        }
    });
    const totalWithoutVAT = total;
    const totalWithVAT = Math.floor(total * 1.1);
    const totalAmountDisplay = totalWithoutVAT.toLocaleString() + '원 (VAT 미포함) / ' + totalWithVAT.toLocaleString() + '원 (VAT 포함)';

    previewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>견적서 미리보기</title>
            <link href="https://fonts.googleapis.com/css2?family=Nanum+Barun+Gothic:wght@400;700&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Nanum Barun Gothic', sans-serif; padding: 1rem 1rem 5rem 1rem; background: #f5f5f5; font-size: 12px; }
                .preview-container { max-width: 210mm; margin: 0 auto; background: white; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .preview-actions { position: fixed; bottom: 0; left: 0; right: 0; max-width: 210mm; margin: 0 auto; padding: 1rem; display: flex; gap: 0.5rem; justify-content: center; background: white; box-shadow: 0 -2px 8px rgba(0,0,0,0.1); z-index: 1000; }
                .preview-actions button { padding: 0.75rem 1.5rem; font-size: 14px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white; }
                .preview-actions button:hover { background: #f5f5f5; }
                .preview-actions .btn-pdf { background: #1f6bff; color: white; border-color: #1f6bff; }
                .preview-actions .btn-pdf:hover { background: #1a5ae6; }
                .preview-actions .btn-print { background: #10b981; color: white; border-color: #10b981; }
                .preview-actions .btn-print:hover { background: #0d9668; }
                .quote-header { margin-bottom: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.75rem; }
                .quote-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
                .quote-logo { display: flex; align-items: center; gap: 0.75rem; }
                .quote-company-info { font-size: 11px; color: #666; line-height: 1.5; }
                h1 { font-size: 1.5rem; margin: 0; }
                h2 { font-size: 1rem; margin: 1rem 0 0.5rem 0; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
                p { font-size: 12px; margin: 0.25rem 0; line-height: 1.5; }
                .quote-name { font-size: 14px; font-weight: 700; color: #1f6bff; }
                table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 11px; table-layout: fixed; }
                th, td { border: 1px solid #ddd; padding: 0.4rem; text-align: left; word-wrap: break-word; }
                th { background: #f5f5f5; font-weight: 600; font-size: 11px; }
                td { font-size: 11px; }
                td:nth-child(1), td:nth-child(2), td:nth-child(7) { white-space: pre-wrap; }
                th:nth-child(1), td:nth-child(1) { width: 13%; }
                th:nth-child(2), td:nth-child(2) { width: 22%; }
                th:nth-child(3), td:nth-child(3) { width: 7%; text-align: right; }
                th:nth-child(4), td:nth-child(4) { width: 6%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right; }
                th:nth-child(5), td:nth-child(5) { width: 11%; text-align: right; }
                th:nth-child(6), td:nth-child(6) { width: 11%; text-align: right; }
                th:nth-child(7), td:nth-child(7) { width: 20%; }
                .quote-items-note { font-size: 11px; color: #666; margin-bottom: 0.5rem; }
                .text-right { text-align: right; }
                .total-row { font-weight: 700; font-size: 12px; }
                @media print {
                    body { background: white; padding: 0; }
                    .preview-container { box-shadow: none; }
                    .preview-actions { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="preview-container">
                <div class="quote-header">
                    <div class="quote-header-top">
                        <div class="quote-logo">
                            <span style="width: 40px; height: 40px; border-radius: 50%; background: #0F91D0; display: inline-flex; align-items: center; justify-content: center; font-family: 'Nanum Barun Gothic', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; position: relative; line-height: 1; margin-right: 0.05rem; flex-shrink: 0;">
                                <span style="font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; transform: scaleY(1.3); display: inline-block;">m</span>
                                <span style="position: absolute; top: 8px; right: 7px; font-size: 0.45rem; font-weight: 400; line-height: 1;">®</span>
                            </span>
                            <div>
                                <p style="font-size: 13px; font-weight: 700; margin: 0;">맑은소프트</p>
                                <p style="font-size: 11px; color: #666; margin: 0;">보통 사람들이 만드는 위대한 기업</p>
                            </div>
                        </div>
                        <h1>견적서</h1>
                    </div>
                    <div class="quote-company-info">
                        <p>서울특별시 구로구 디지털로 288</p>
                        <p>tel. 02-857-5445 | fax. 02-6442-7010</p>
                        <p>업태/종목_ 서비스/소프트웨어·원격교육컨텐츠개발및공급</p>
                        <p>사업자등록번호_ 119-86-39050 | 상호_ ㈜맑은소프트</p>
                        <p>대표자_ 하근호</p>
                    </div>
                </div>

                <h2>수신</h2>
                <p><strong>수신자:</strong> ${escapeHtml(estimate.recipient || '')}</p>
                <p><strong>참조:</strong> ${escapeHtml(estimate.reference || '')}</p>

                <h2>견적 기본 정보</h2>
                <p><strong>견적명:</strong> <span class="quote-name">${escapeHtml(estimate.quoteName || '')}</span></p>
                <p><strong>견적일자:</strong> ${escapeHtml(estimate.quoteDate || '')}</p>
                <p><strong>계약 총액:</strong> ${totalAmountDisplay}</p>

                <h2>견적 항목</h2>
                <p class="quote-items-note">(단위 : 원, VAT 별도)</p>
                <table>
                    <thead>
                        <tr>
                            <th>구분</th>
                            <th>세부 항목</th>
                            <th>기본계약 기간(월)</th>
                            <th>수량</th>
                            <th>단가</th>
                            <th>공급가액</th>
                            <th>비고</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.category || '')}</td>
                                <td style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.detail || '')}</td>
                                <td style="text-align: right;">${escapeHtml(item.period || '')}</td>
                                <td style="text-align: right;">${escapeHtml(item.quantity || '')}</td>
                                <td style="text-align: right;">${escapeHtml(item.unitPrice || '')}</td>
                                <td style="text-align: right;">${escapeHtml(item.supplyPrice || '')}</td>
                                <td style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.remarks || '')}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="6" class="text-right">계약 총액</td>
                            <td class="text-right">${totalWithoutVAT.toLocaleString()}원</td>
                        </tr>
                    </tbody>
                </table>

                <h2>결제 및 담당자 안내</h2>
                <p><strong>결제 정보:</strong> ${escapeHtml(estimate.paymentInfo || '')}</p>
                <p><strong>입금 관련:</strong> ${escapeHtml(estimate.depositInfo || '')}</p>
                <p><strong>견적 담당자:</strong> ${escapeHtml(estimate.managerName || '')} (${escapeHtml(estimate.managerPosition || '')})</p>
                <p><strong>연락처:</strong> ${escapeHtml(estimate.managerContact || '')} | <strong>이메일:</strong> ${escapeHtml(estimate.managerEmail || '')}</p>
                <p><strong>유효기간:</strong> ${escapeHtml(estimate.validityPeriod || '')}</p>
            </div>
            <div class="preview-actions">
                <button class="btn-pdf" onclick="window.parent.exportToPDFFromPreview()">PDF 다운로드</button>
                <button class="btn-print" onclick="window.print()">출력</button>
            </div>
            <script>
                function exportToPDFFromPreview() {
                    window.parent.postMessage({ action: 'exportPDF' }, '*');
                }
            </script>
        </body>
        </html>
    `);
    previewWindow.document.close();
}

// PDF 저장 함수
function exportToPDF(estimate) {
    if (typeof html2pdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = function() {
            generatePDF(estimate);
        };
        document.head.appendChild(script);
    } else {
        generatePDF(estimate);
    }
}

function generatePDF(estimate) {
    const items = estimate.items || [];
    let total = 0;
    items.forEach(item => {
        const supplyPriceValue = item.supplyPrice || '';
        if (supplyPriceValue.trim() !== '') {
            const numericString = supplyPriceValue.replace(/[^0-9.-]/g, '');
            const numericValue = parseFloat(numericString);
            if (!isNaN(numericValue)) {
                total += numericValue;
            }
        }
    });
    const totalWithoutVAT = total;
    const totalWithVAT = Math.floor(total * 1.1);
    const totalAmountDisplay = totalWithoutVAT.toLocaleString() + '원 (VAT 미포함) / ' + totalWithVAT.toLocaleString() + '원 (VAT 포함)';

    const pdfContent = document.createElement('div');
    pdfContent.style.width = '210mm';
    pdfContent.style.maxWidth = '210mm';
    pdfContent.style.padding = '5mm';
    pdfContent.style.margin = '0';
    pdfContent.style.fontFamily = "'Nanum Barun Gothic', sans-serif";
    pdfContent.style.fontSize = '10pt';
    pdfContent.style.lineHeight = '1.5';
    pdfContent.style.backgroundColor = 'white';
    pdfContent.style.boxSizing = 'border-box';
    pdfContent.style.display = 'block';
    pdfContent.style.position = 'relative';
    pdfContent.innerHTML = `
        <div style="width: 100%; box-sizing: border-box;">
        <div style="margin-bottom: 1rem; border-bottom: 2px solid #333; padding-bottom: 0.8rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="width: 46px; height: 46px; border-radius: 50%; background: #0F91D0; display: inline-flex; align-items: center; justify-content: center; font-family: 'Nanum Barun Gothic', sans-serif; font-weight: 700; font-size: 1.1rem; color: #fff; position: relative; line-height: 1;">
                        <span style="font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; transform: scaleY(1.3); display: inline-block;">m</span>
                        <span style="position: absolute; top: 10px; right: 8px; font-size: 0.5rem; font-weight: 400; line-height: 1;">®</span>
                    </span>
                    <div>
                        <p style="font-size: 12pt; font-weight: 700; margin: 0;">맑은소프트</p>
                        <p style="font-size: 9pt; color: #666; margin: 0;">보통 사람들이 만드는 위대한 기업</p>
                    </div>
                </div>
                <h1 style="font-size: 18pt; margin: 0;">견적서</h1>
            </div>
            <div style="font-size: 8pt; color: #666; line-height: 1.4;">
                <p style="margin: 0.1rem 0;">서울특별시 구로구 디지털로 288</p>
                <p style="margin: 0.1rem 0;">tel. 02-857-5445 | fax. 02-6442-7010</p>
                <p style="margin: 0.1rem 0;">업태/종목_ 서비스/소프트웨어·원격교육컨텐츠개발및공급</p>
                <p style="margin: 0.1rem 0;">사업자등록번호_ 119-86-39050 | 상호_ ㈜맑은소프트</p>
                <p style="margin: 0.1rem 0;">대표자_ 하근호</p>
            </div>
        </div>

        <div style="margin-bottom: 1rem;">
            <h2 style="font-size: 1.1rem; margin-bottom: 0.4rem; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem;">수신</h2>
            <p style="margin: 0.2rem 0;"><strong>수신자:</strong> ${escapeHtml(estimate.recipient || '')}</p>
            <p style="margin: 0.2rem 0;"><strong>참조:</strong> ${escapeHtml(estimate.reference || '')}</p>
        </div>

        <div style="margin-bottom: 1rem;">
            <h2 style="font-size: 1.1rem; margin-bottom: 0.4rem; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem;">견적 기본 정보</h2>
            <p style="margin: 0.2rem 0;"><strong>견적명:</strong> <span style="font-size: 11pt; font-weight: 700; color: #1f6bff;">${escapeHtml(estimate.quoteName || '')}</span></p>
            <p style="margin: 0.2rem 0;"><strong>견적일자:</strong> ${escapeHtml(estimate.quoteDate || '')}</p>
            <p style="margin: 0.2rem 0;"><strong>계약 총액:</strong> ${totalAmountDisplay}</p>
        </div>

        <div style="margin-bottom: 1rem;">
            <h2 style="font-size: 1.1rem; margin-bottom: 0.3rem; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem;">견적 항목</h2>
            <p style="font-size: 9pt; color: #666; margin-bottom: 0.3rem;">(단위 : 원, VAT 별도)</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 0.3rem; font-size: 9pt; table-layout: fixed;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="border: 1px solid #ddd; padding: 0.3rem; text-align: left; width: 13%;">구분</th>
                        <th style="border: 1px solid #ddd; padding: 0.3rem; text-align: left; width: 22%;">세부 항목</th>
                        <th style="border: 1px solid #ddd; padding: 0.3rem; text-align: right; width: 7%;">기본계약 기간(월)</th>
                        <th style="border: 1px solid #ddd; padding: 0.3rem; text-align: right; width: 6%;">수량</th>
                        <th style="border: 1px solid #ddd; padding: 0.3rem; text-align: right; width: 11%;">단가</th>
                        <th style="border: 1px solid #ddd; padding: 0.3rem; text-align: right; width: 11%;">공급가액</th>
                        <th style="border: 1px solid #ddd; padding: 0.3rem; text-align: left; width: 20%;">비고</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.category || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.detail || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; text-align: right;">${escapeHtml(item.period || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; text-align: right; white-space: nowrap;">${escapeHtml(item.quantity || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; text-align: right;">${escapeHtml(item.unitPrice || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; text-align: right;">${escapeHtml(item.supplyPrice || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(item.remarks || '')}</td>
                        </tr>
                    `).join('')}
                    <tr style="font-weight: 700; font-size: 10pt;">
                        <td colspan="6" style="border: 1px solid #ddd; padding: 0.3rem; text-align: right;">계약 총액</td>
                        <td style="border: 1px solid #ddd; padding: 0.3rem; text-align: right;">${totalWithoutVAT.toLocaleString()}원</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style="margin-top: 1rem;">
            <h2 style="font-size: 1.1rem; margin-bottom: 0.4rem; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem;">결제 및 담당자 안내</h2>
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>결제 정보:</strong> ${escapeHtml(estimate.paymentInfo || '')}</p>
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>입금 관련:</strong> ${escapeHtml(estimate.depositInfo || '')}</p>
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>견적 담당자:</strong> ${escapeHtml(estimate.managerName || '')} (${escapeHtml(estimate.managerPosition || '')})</p>
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>연락처:</strong> ${escapeHtml(estimate.managerContact || '')} | <strong>이메일:</strong> ${escapeHtml(estimate.managerEmail || '')}</p>
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>유효기간:</strong> ${escapeHtml(estimate.validityPeriod || '')}</p>
        </div>
        </div>
    `;

    document.body.appendChild(pdfContent);

    setTimeout(() => {
        const opt = {
            margin: [5, 5, 5, 5],
            filename: `견적서_${estimate.quoteName || '견적서'}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                x: 0,
                y: 0
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(pdfContent).save().then(() => {
            if (document.body.contains(pdfContent)) {
                document.body.removeChild(pdfContent);
            }
        }).catch(err => {
            console.error('PDF 생성 오류:', err);
            if (document.body.contains(pdfContent)) {
                document.body.removeChild(pdfContent);
            }
        });
    }, 200);
}

function updateEstimateStatus(estimateId, newStatus) {
    const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const estimate = estimates.find(e => e.id === estimateId);
    
    if (estimate) {
        estimate.status = newStatus;
        estimate.updatedAt = new Date().toISOString();
        localStorage.setItem('estimates', JSON.stringify(estimates));
        return true;
    }
    return false;
}

function deleteEstimate(estimateId) {
    const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const filtered = estimates.filter(e => e.id !== estimateId);
    localStorage.setItem('estimates', JSON.stringify(filtered));
    alert('견적서가 삭제되었습니다.');
    window.location.href = 'estimate_list.html';
}

// 수정/삭제 버튼 표시 여부 확인
function checkEditDeletePermission(estimate) {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : '';
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    
    // 작성자가 없거나 현재 사용자와 일치하지 않으면 버튼 숨김
    // createdBy가 없는 경우 (기존 데이터)는 managerName으로 확인
    let isOwner = false;
    if (estimate.createdBy) {
        isOwner = estimate.createdBy === currentUser;
    } else if (estimate.managerName && currentUser) {
        // 기존 데이터의 경우 managerName과 현재 사용자 프로필 이름 비교
        const profileData = localStorage.getItem(`profile_${currentUser}`);
        if (profileData) {
            const profile = JSON.parse(profileData);
            isOwner = estimate.managerName === profile.name || estimate.managerName === currentUser;
        } else {
            // 프로필이 없으면 managerName과 currentUser 비교
            isOwner = estimate.managerName === currentUser;
        }
    }
    
    if (editBtn) {
        editBtn.style.display = isOwner ? 'inline-flex' : 'none';
    }
    
    if (deleteBtn) {
        deleteBtn.style.display = isOwner ? 'inline-flex' : 'none';
    }
}

// 페이지 로드 시 견적서 데이터 로드
document.addEventListener('DOMContentLoaded', function() {
    loadEstimate();
});

