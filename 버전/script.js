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
        : `<button class="btn primary full-width disabled" type="button" onclick="alert('준비중입니다');">견적서 작성</button>`;
    
    const adminBtn = product.demoAdminUrl 
        ? `<a class="btn ghost small" href="${product.demoAdminUrl}" target="_blank" rel="noopener noreferrer">관리자</a>`
        : `<button class="btn ghost small disabled" type="button" disabled>관리자</button>`;
    
    const instructorBtn = product.demoInstructorUrl 
        ? `<a class="btn ghost small" href="${product.demoInstructorUrl}" target="_blank" rel="noopener noreferrer">강사</a>`
        : '';
    
    const learnerBtn = product.demoLearnerUrl 
        ? `<a class="btn ghost small" href="${product.demoLearnerUrl}" target="_blank" rel="noopener noreferrer">학습자</a>`
        : `<button class="btn ghost small disabled" type="button" disabled>학습자</button>`;
    
    const clientOptions = product.clients.map(client => 
        `<option value="${client.url}">${client.name}</option>`
    ).join('');
    
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
                <a class="btn ghost" href="${product.pricingUrl}" target="_blank" rel="noopener noreferrer">서비스 요금</a>
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
            <div class="client-select">
                <label>고객사 사례</label>
                <select onchange="handleClientSelect(this)">
                    <option value="">고객사를 선택하세요</option>
                    ${clientOptions}
                </select>
            </div>
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
