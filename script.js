const state = {
    products: [],
    estimates: [],
};

async function loadInitialData() {
    try {
        const [productRes, estimateRes] = await Promise.all([
            fetch('product.json').catch(() => null),
            fetch('estimate.json').catch(() => null),
        ]);
        
        if (productRes) {
            state.products = await productRes.json();
            renderProductCards();
        }
        
        if (estimateRes) {
            state.estimates = await estimateRes.json();
            renderEstimates();
        }
    } catch (error) {
        console.error('데이터 로드 실패', error);
    }
}

function renderProductCards() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.innerHTML = state.products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const isFirstProduct = product.id === '001';
    const estimateAction = isFirstProduct 
        ? `<a class="btn primary full-width" href="estimate.html">견적서 작성</a>`
        : `<a class="btn primary full-width" href="estimate.html">견적서 작성</a>`;
    
    // 위캔디오 특별 처리
    if (product.id === '007') {
        const videoBtn = product.videoUrl 
            ? `<a class="btn ghost" href="${product.videoUrl}" target="_blank" rel="noopener noreferrer">비디오</a>`
            : '';
        const liveBtn = product.liveUrl 
            ? `<a class="btn ghost" href="${product.liveUrl}" target="_blank" rel="noopener noreferrer">라이브</a>`
            : '';
        const encodingBtn = product.encodingUrl 
            ? `<a class="btn ghost" href="${product.encodingUrl}" target="_blank" rel="noopener noreferrer">인코딩</a>`
            : '';
        
        // 위캔디오 고객사 사례 (바로가기 옵션 포함)
        const clientOptions = product.clientCaseUrl 
            ? `<option value="${product.clientCaseUrl}">바로가기</option>`
            : '';
        const clientCaseSection = product.clientCaseUrl 
            ? `<div class="client-select">
                <label>고객사 사례</label>
                <select onchange="handleClientSelect(this)">
                    <option value="">고객사를 선택하세요</option>
                    ${clientOptions}
                </select>
            </div>`
            : '';
        
        return `
            <article class="product-card">
                <div class="card-top">
                    <div>
                        <p class="eyebrow">${product.id}</p>
                        <h2>${product.name}</h2>
                    </div>
                    <a class="icon-btn" href="assets/proposals/${product.proposalFile}" download aria-label="${product.name} 제안서 다운로드">⬇</a>
                </div>
                <div class="cta-row">
                    ${videoBtn}
                    ${liveBtn}
                    ${encodingBtn}
                </div>
                <div class="cta-row" style="margin-top: 0.5rem;">
                    <a class="btn ghost" href="${product.pricingUrl}" target="_blank" rel="noopener noreferrer">서비스 요금</a>
                    ${estimateAction.replace('full-width', '')}
                </div>
                ${clientCaseSection}
            </article>
        `;
    }
    
    // 일반 상품 처리
    const adminBtn = product.demoAdminUrl 
        ? `<a class="btn ghost small" href="${product.demoAdminUrl}" target="_blank" rel="noopener noreferrer">관리자</a>`
        : `<button class="btn ghost small disabled" type="button" disabled>관리자</button>`;
    
    // OTT 클라우드의 경우 "사용자" 버튼, 혼합 LMS의 경우 "튜터" 버튼
    let instructorBtn = '';
    if (product.id === '005') {
        // OTT 클라우드: 사용자 버튼
        instructorBtn = product.demoLearnerUrl 
            ? `<a class="btn ghost small" href="${product.demoLearnerUrl}" target="_blank" rel="noopener noreferrer">사용자</a>`
            : '';
    } else if (product.id === '006') {
        // 혼합 LMS: 튜터 버튼
        instructorBtn = product.demoInstructorUrl 
            ? `<a class="btn ghost small" href="${product.demoInstructorUrl}" target="_blank" rel="noopener noreferrer">튜터</a>`
            : '';
    } else {
        // 일반: 강사 버튼
        instructorBtn = product.demoInstructorUrl 
            ? `<a class="btn ghost small" href="${product.demoInstructorUrl}" target="_blank" rel="noopener noreferrer">강사</a>`
            : '';
    }
    
    // OTT 클라우드는 학습자 버튼 표시 안 함
    const learnerBtn = (product.id === '005') 
        ? ''
        : (product.demoLearnerUrl 
            ? `<a class="btn ghost small" href="${product.demoLearnerUrl}" target="_blank" rel="noopener noreferrer">학습자</a>`
            : `<button class="btn ghost small disabled" type="button" disabled>학습자</button>`);
    
    const clientOptions = product.clients.map(client => 
        `<option value="${client.url}">${client.name}</option>`
    ).join('');
    
    // OTT 클라우드와 위캔디오가 아닌 경우에만 고객사 사례 표시 (clients가 있는 경우)
    // OTT 클라우드는 항상 고객사 사례 영역 표시 (빈 select)
    const clientSelectSection = (product.id === '005' || product.clients.length > 0)
        ? `<div class="client-select">
            <label>고객사 사례</label>
            <select onchange="handleClientSelect(this)">
                <option value="">고객사를 선택하세요</option>
                ${clientOptions}
            </select>
        </div>`
        : '';
    
    return `
        <article class="product-card">
            <div class="card-top">
                <div>
                    <p class="eyebrow">${product.id}</p>
                    <h2>${product.name}</h2>
                </div>
                <a class="icon-btn" href="assets/proposals/${product.proposalFile}" download aria-label="${product.name} 제안서 다운로드">⬇</a>
            </div>
            <div class="cta-row">
                <a class="btn ghost" href="${product.homepageUrl}" target="_blank" rel="noopener noreferrer">홈페이지</a>
                ${product.pricingUrl ? `<a class="btn ghost" href="${product.pricingUrl}" target="_blank" rel="noopener noreferrer">서비스 요금</a>` : ''}
                ${estimateAction.replace('full-width', '')}
            </div>
            <div class="demo-section">
                <label>데모 체험</label>
                <div class="action-row">
                    ${adminBtn}
                    ${instructorBtn}
                    ${learnerBtn}
                </div>
            </div>
            ${clientSelectSection}
        </article>
    `;
}

function handleClientSelect(select) {
    const url = select.value;
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        select.value = '';
    }
}

function renderEstimates() {
    const list = document.getElementById('estimateList');
    if (!list) return;
    list.innerHTML = state.estimates
        .map(
            (item) => `
            <tr>
                <td>${item.clientName}</td>
                <td>${item.productName}</td>
                <td>${item.amount.toLocaleString()}원</td>
                <td>${item.status}</td>
                <td>${item.updatedAt}</td>
                <td><a href="estimate_view.html?id=${item.id}">상세</a></td>
            </tr>
        `
        )
        .join('');
}

document.addEventListener('DOMContentLoaded', loadInitialData);
