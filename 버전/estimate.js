const TemplateManager = {
    getTemplates: function() {
        const templates = localStorage.getItem('estimate_templates');
        return templates ? JSON.parse(templates) : [];
    },

    saveTemplate: function(name, items) {
        const templates = this.getTemplates();
        const newTemplate = {
            id: Date.now().toString(),
            name: name,
            items: items,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        templates.push(newTemplate);
        localStorage.setItem('estimate_templates', JSON.stringify(templates));
        return newTemplate;
    },

    updateTemplate: function(id, name, items) {
        const templates = this.getTemplates();
        const template = templates.find(t => t.id === id);
        if (template) {
            template.name = name;
            template.items = items;
            template.updatedAt = new Date().toISOString();
            localStorage.setItem('estimate_templates', JSON.stringify(templates));
            return template;
        }
        return null;
    },

    deleteTemplate: function(id) {
        const templates = this.getTemplates();
        const filtered = templates.filter(t => t.id !== id);
        localStorage.setItem('estimate_templates', JSON.stringify(filtered));
    },

    getTemplate: function(id) {
        const templates = this.getTemplates();
        return templates.find(t => t.id === id);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initQuoteForm();
    initAutoResize();
    initTemplateManager();
    initPaymentTextareaResize();
    initFieldValidation();
});

function initAutoResize() {
    // 자동 높이 조절 함수
    function autoResize(textarea) {
        const minHeight = 38; // input과 동일한 높이 (padding 포함)
        textarea.style.height = 'auto';
        const newHeight = Math.max(minHeight, textarea.scrollHeight);
        textarea.style.height = newHeight + 'px';
    }

    // 기존 textarea에 적용
    document.querySelectorAll('.auto-resize').forEach(textarea => {
        textarea.style.height = '38px'; // 초기 높이를 input과 동일하게
        textarea.addEventListener('input', function() {
            autoResize(this);
        });
        autoResize(textarea);
    });

    // 동적으로 추가되는 항목에도 적용
    const quoteItems = document.getElementById('quoteItems');
    if (quoteItems) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        const textareas = node.querySelectorAll ? node.querySelectorAll('.auto-resize') : [];
                        textareas.forEach(textarea => {
                            textarea.style.height = '38px'; // 초기 높이 설정
                            textarea.addEventListener('input', function() {
                                autoResize(this);
                            });
                            autoResize(textarea);
                        });
                    }
                });
            });
        });
        observer.observe(quoteItems, { childList: true, subtree: true });
    }
}

function initTemplateManager() {
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    const loadTemplateBtn = document.getElementById('loadTemplateBtn');
    const templateModal = document.getElementById('templateModal');
    const closeModal = document.getElementById('closeModal');
    const templateList = document.getElementById('templateList');
    const templateForm = document.getElementById('templateForm');
    const templateName = document.getElementById('templateName');
    const confirmTemplateBtn = document.getElementById('confirmTemplateBtn');
    const cancelTemplateBtn = document.getElementById('cancelTemplateBtn');
    const modalTitle = document.getElementById('modalTitle');

    if (!saveTemplateBtn || !loadTemplateBtn || !templateModal) {
        console.error('템플릿 관련 요소를 찾을 수 없습니다.', {
            saveTemplateBtn: !!saveTemplateBtn,
            loadTemplateBtn: !!loadTemplateBtn,
            templateModal: !!templateModal
        });
        return;
    }

    if (!templateList || !templateForm || !templateName || !confirmTemplateBtn || !cancelTemplateBtn || !modalTitle) {
        console.error('템플릿 모달 내부 요소를 찾을 수 없습니다.', {
            templateList: !!templateList,
            templateForm: !!templateForm,
            templateName: !!templateName,
            confirmTemplateBtn: !!confirmTemplateBtn,
            cancelTemplateBtn: !!cancelTemplateBtn,
            modalTitle: !!modalTitle
        });
        return;
    }

    let currentMode = 'load'; // 'load', 'save', or 'edit'
    let editingTemplateId = null;

    saveTemplateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('템플릿 저장 버튼 클릭');
        currentMode = 'save';
        editingTemplateId = null;
        modalTitle.textContent = '템플릿 저장';
        templateForm.style.display = 'block';
        templateList.style.display = 'none';
        templateName.value = '';
        document.getElementById('templateItemsContainer').style.display = 'none';
        const modalContent = templateModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('template-load-modal');
            modalContent.classList.add('template-edit-modal');
        }
        templateModal.style.display = 'flex';
        console.log('모달 표시:', templateModal.style.display);
    });

    loadTemplateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('템플릿 불러오기 버튼 클릭');
        try {
            currentMode = 'load';
            if (modalTitle) modalTitle.textContent = '템플릿 불러오기';
            if (templateForm) templateForm.style.display = 'none';
            if (templateList) templateList.style.display = 'block';
            renderTemplateList();
            if (templateModal) {
                const modalContent = templateModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.classList.add('template-load-modal');
                    modalContent.classList.remove('template-edit-modal');
                }
                templateModal.style.display = 'flex';
                console.log('모달 표시 완료:', templateModal.style.display);
            } else {
                console.error('templateModal이 null입니다.');
            }
        } catch (error) {
            console.error('템플릿 불러오기 오류:', error);
        }
    });

    closeModal.addEventListener('click', function() {
        templateModal.style.display = 'none';
    });

    templateModal.addEventListener('click', function(e) {
        if (e.target === templateModal) {
            templateModal.style.display = 'none';
        }
    });

    confirmTemplateBtn.addEventListener('click', function() {
        const name = templateName.value.trim();
        if (!name) {
            alert('템플릿 이름을 입력해주세요.');
            return;
        }

        let items = [];
        if (currentMode === 'edit' && document.getElementById('templateItemsContainer').style.display === 'block') {
            // 수정 모드에서 모달 내부의 항목 가져오기
            items = getTemplateItems();
        } else {
            // 저장 모드에서 현재 견적 항목 가져오기
            items = getCurrentItems();
        }
        
        if (items.length === 0) {
            alert('저장할 항목이 없습니다.');
            return;
        }

        if (currentMode === 'edit' && editingTemplateId) {
            TemplateManager.updateTemplate(editingTemplateId, name, items);
            alert('템플릿이 수정되었습니다.');
        } else {
            TemplateManager.saveTemplate(name, items);
            alert('템플릿이 저장되었습니다.');
        }
        templateModal.style.display = 'none';
        editingTemplateId = null;
        document.getElementById('templateItemsContainer').style.display = 'none';
    });

    cancelTemplateBtn.addEventListener('click', function() {
        templateModal.style.display = 'none';
        editingTemplateId = null;
        currentMode = 'load';
        document.getElementById('templateItemsContainer').style.display = 'none';
    });
    
    // 템플릿 항목 추가 버튼
    const addTemplateItemBtn = document.getElementById('addTemplateItemBtn');
    if (addTemplateItemBtn) {
        addTemplateItemBtn.addEventListener('click', function() {
            const templateItems = document.getElementById('templateItems');
            const newRow = document.createElement('tr');
            newRow.className = 'template-item-row';
            newRow.draggable = true;
            newRow.innerHTML = `
                <td class="drag-handle" style="cursor: move; text-align: center; width: 30px;">☰</td>
                <td><textarea name="template_category[]" placeholder="구분" rows="1" class="auto-resize"></textarea></td>
                <td><textarea name="template_detail[]" placeholder="세부 항목" rows="1" class="auto-resize"></textarea></td>
                <td class="period-col"><input type="number" name="template_period[]" placeholder="월" min="0" class="period-input" /></td>
                <td><input type="number" name="template_quantity[]" placeholder="수량" min="1" value="1" class="quantity" /></td>
                <td><input type="text" name="template_unitPrice[]" placeholder="단가" class="unit-price" /></td>
                <td><input type="text" name="template_supplyPrice[]" placeholder="공급가액" class="supply-price" /></td>
                <td><textarea name="template_remarks[]" placeholder="비고" rows="2" class="auto-resize"></textarea></td>
                <td><button type="button" class="btn-icon-small remove-template-item">×</button></td>
            `;
            templateItems.appendChild(newRow);
            setupTemplateRowEvents(newRow);
        });
    }
    
    function setupTemplateRowEvents(row) {
        // 자동 높이 조절 이벤트 추가
        const textareas = row.querySelectorAll('.auto-resize');
        textareas.forEach(textarea => {
            textarea.style.height = '38px';
            textarea.addEventListener('input', function() {
                const minHeight = 38;
                textarea.style.height = 'auto';
                const newHeight = Math.max(minHeight, textarea.scrollHeight);
                textarea.style.height = newHeight + 'px';
            });
        });
        
        // 공급가액 자동 계산 이벤트
        const periodInput = row.querySelector('.period-input');
        const quantityInput = row.querySelector('.quantity');
        const unitPriceInput = row.querySelector('.unit-price');
        const supplyPriceInput = row.querySelector('.supply-price');
        
        function calculateTemplateRowTotal() {
            const period = parseFloat(periodInput?.value || 0);
            const quantity = parseFloat(quantityInput?.value || 0);
            const unitPriceValue = unitPriceInput?.value || '';
            const unitPrice = parseFloat(unitPriceValue.replace(/[^0-9.-]/g, ''));
            
            if (supplyPriceInput && !supplyPriceInput.dataset.manualEdit) {
                const periodValue = period > 0 ? period : 1;
                const total = periodValue * quantity * unitPrice;
                
                if (!isNaN(unitPrice) && unitPrice > 0) {
                    supplyPriceInput.value = isNaN(total) || total === 0 ? '' : total;
                }
            }
        }
        
        if (periodInput) periodInput.addEventListener('input', calculateTemplateRowTotal);
        if (quantityInput) quantityInput.addEventListener('input', calculateTemplateRowTotal);
        if (unitPriceInput) unitPriceInput.addEventListener('input', calculateTemplateRowTotal);
        
        // 공급가액 수동 입력 감지
        if (supplyPriceInput) {
            supplyPriceInput.addEventListener('focus', function() {
                this.dataset.manualEdit = 'true';
            });
            
            supplyPriceInput.addEventListener('blur', function() {
                if (!this.value || this.value.trim() === '') {
                    delete this.dataset.manualEdit;
                    calculateTemplateRowTotal();
                }
            });
        }
        
        // 드래그 앤 드롭 이벤트
        const dragHandle = row.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', function(e) {
                row.draggable = true;
            });
        }
        
        row.addEventListener('dragstart', function(e) {
            // 입력 필드에서 드래그가 시작되지 않도록
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') {
                e.preventDefault();
                return false;
            }
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.outerHTML);
            this.classList.add('dragging');
        });
        
        row.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            this.draggable = false;
        });
        
        row.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const dragging = document.querySelector('.dragging');
            if (dragging && dragging !== this) {
                const allRows = Array.from(this.parentNode.querySelectorAll('.template-item-row'));
                const draggingIndex = allRows.indexOf(dragging);
                const currentIndex = allRows.indexOf(this);
                
                if (draggingIndex < currentIndex) {
                    this.parentNode.insertBefore(dragging, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(dragging, this);
                }
            }
        });
        
        row.addEventListener('drop', function(e) {
            e.preventDefault();
        });
        
        // 입력 필드 클릭 시 드래그 방지
        row.querySelectorAll('input, textarea, button').forEach(element => {
            element.addEventListener('mousedown', function(e) {
                e.stopPropagation();
            });
        });
    }
    
    // 템플릿 항목 삭제
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-template-item')) {
            const row = e.target.closest('.template-item-row');
            const templateItems = document.getElementById('templateItems');
            if (row && templateItems && templateItems.children.length > 1) {
                row.remove();
            } else if (row && templateItems && templateItems.children.length === 1) {
                // 마지막 항목이면 내용만 지움
                row.querySelectorAll('input, textarea').forEach(input => {
                    if (input.type !== 'number' || input.name.includes('quantity')) {
                        input.value = '';
                    } else if (input.name.includes('quantity')) {
                        input.value = '1';
                    } else if (input.type === 'number') {
                        input.value = '';
                    }
                });
            }
        }
    });

    function renderTemplateList() {
        if (!templateList) {
            console.error('templateList가 null입니다.');
            return;
        }
        
        const templates = TemplateManager.getTemplates();
        templateList.innerHTML = '';

        if (templates.length === 0) {
            templateList.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 2rem;">저장된 템플릿이 없습니다.</p>';
            return;
        }

        templates.forEach(template => {
            const templateItem = document.createElement('div');
            templateItem.className = 'template-item';
            templateItem.innerHTML = `
                <div class="template-info">
                    <strong>${template.name}</strong>
                    <span class="template-meta">${template.items.length}개 항목 | ${new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="template-actions">
                    <button type="button" class="btn primary small" data-action="load" data-id="${template.id}">불러오기</button>
                    <button type="button" class="btn secondary small" data-action="edit" data-id="${template.id}">수정</button>
                    <button type="button" class="btn secondary small" data-action="delete" data-id="${template.id}">삭제</button>
                </div>
            `;
            templateList.appendChild(templateItem);
        });

        templateList.addEventListener('click', function(e) {
            const action = e.target.dataset.action;
            const id = e.target.dataset.id;

            if (action === 'load') {
                loadTemplate(id);
            } else if (action === 'edit') {
                editTemplate(id);
            } else if (action === 'delete') {
                if (confirm('템플릿을 삭제하시겠습니까?')) {
                    TemplateManager.deleteTemplate(id);
                    renderTemplateList();
                }
            }
        });
    }


    function getTemplateItems() {
        const rows = document.querySelectorAll('#templateItems .template-item-row');
        const items = [];

        rows.forEach(row => {
            const item = {
                category: row.querySelector('textarea[name="template_category[]"]')?.value || '',
                detail: row.querySelector('textarea[name="template_detail[]"]')?.value || '',
                period: row.querySelector('input[name="template_period[]"]')?.value || '',
                quantity: row.querySelector('input[name="template_quantity[]"]')?.value || '1',
                unitPrice: row.querySelector('input[name="template_unitPrice[]"]')?.value || '',
                supplyPrice: row.querySelector('input[name="template_supplyPrice[]"]')?.value || '',
                remarks: row.querySelector('textarea[name="template_remarks[]"]')?.value || ''
            };
            items.push(item);
        });

        return items;
    }

    function loadTemplate(id, closeModal = true) {
        const template = TemplateManager.getTemplate(id);
        if (!template) {
            alert('템플릿을 찾을 수 없습니다.');
            return;
        }

        const quoteItems = document.getElementById('quoteItems');
        quoteItems.innerHTML = '';

        template.items.forEach((item, index) => {
            const newRow = document.createElement('tr');
            newRow.className = 'quote-item-row';
            newRow.draggable = true;
            newRow.innerHTML = `
                <td class="drag-handle" style="cursor: move; text-align: center; width: 30px;">☰</td>
                <td><textarea name="category[]" placeholder="구분" rows="1" class="auto-resize">${escapeHtml(item.category || '')}</textarea></td>
                <td><textarea name="detail[]" placeholder="세부 항목" rows="1" class="auto-resize">${escapeHtml(item.detail || '')}</textarea></td>
                <td class="period-col"><input type="number" name="period[]" placeholder="월" min="0" class="period-input" value="${item.period || ''}" /></td>
                <td><input type="number" name="quantity[]" placeholder="수량" min="1" value="${item.quantity || 1}" class="quantity" /></td>
                <td><input type="text" name="unitPrice[]" placeholder="단가" class="unit-price" value="${escapeHtml(item.unitPrice || '')}" /></td>
                <td><input type="text" name="supplyPrice[]" placeholder="공급가액" class="supply-price" value="${escapeHtml(item.supplyPrice || '')}" /></td>
                <td><textarea name="remarks[]" placeholder="비고" rows="2" class="auto-resize">${escapeHtml(item.remarks || '')}</textarea></td>
                <td><button type="button" class="btn-icon-small remove-item">×</button></td>
            `;
            quoteItems.appendChild(newRow);
            setupQuoteRowDragEvents(newRow);
        });

        // 자동 높이 조절 및 이벤트 리스너 재설정
        setTimeout(() => {
            document.querySelectorAll('.auto-resize').forEach(textarea => {
                textarea.style.height = '38px';
                const minHeight = 38;
                textarea.style.height = 'auto';
                const newHeight = Math.max(minHeight, textarea.scrollHeight);
                textarea.style.height = newHeight + 'px';
            });
            calculateTotal();
        }, 100);

        // 모달 닫기 (closeModal이 true인 경우만)
        if (closeModal) {
            templateModal.style.display = 'none';
            alert('템플릿이 불러와졌습니다.');
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function editTemplate(id) {
        const template = TemplateManager.getTemplate(id);
        if (!template) {
            alert('템플릿을 찾을 수 없습니다.');
            return;
        }

        currentMode = 'edit';
        editingTemplateId = id;
        modalTitle.textContent = '템플릿 수정';
        templateForm.style.display = 'block';
        templateList.style.display = 'none';
        templateName.value = template.name;
        
        // 템플릿 수정 모달은 전체 너비 유지
        const modalContent = templateModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('template-load-modal');
            modalContent.classList.add('template-edit-modal');
        }
        
        // 템플릿 항목을 모달 내부에 표시
        const templateItemsContainer = document.getElementById('templateItemsContainer');
        const templateItems = document.getElementById('templateItems');
        templateItemsContainer.style.display = 'block';
        templateItems.innerHTML = '';
        
        template.items.forEach((item, index) => {
            const newRow = document.createElement('tr');
            newRow.className = 'template-item-row';
            newRow.draggable = true;
            newRow.innerHTML = `
                <td class="drag-handle" style="cursor: move; text-align: center; width: 30px;">☰</td>
                <td><textarea name="template_category[]" placeholder="구분" rows="1" class="auto-resize">${escapeHtml(item.category || '')}</textarea></td>
                <td><textarea name="template_detail[]" placeholder="세부 항목" rows="1" class="auto-resize">${escapeHtml(item.detail || '')}</textarea></td>
                <td class="period-col"><input type="number" name="template_period[]" placeholder="월" min="0" class="period-input" value="${item.period || ''}" /></td>
                <td><input type="number" name="template_quantity[]" placeholder="수량" min="1" value="${item.quantity || 1}" class="quantity" /></td>
                <td><input type="text" name="template_unitPrice[]" placeholder="단가" class="unit-price" value="${escapeHtml(item.unitPrice || '')}" /></td>
                <td><input type="text" name="template_supplyPrice[]" placeholder="공급가액" class="supply-price" value="${escapeHtml(item.supplyPrice || '')}" /></td>
                <td><textarea name="template_remarks[]" placeholder="비고" rows="2" class="auto-resize">${escapeHtml(item.remarks || '')}</textarea></td>
                <td><button type="button" class="btn-icon-small remove-template-item">×</button></td>
            `;
            templateItems.appendChild(newRow);
            setupTemplateRowEvents(newRow);
        });
        
        // 초기 공급가액 계산 (저장된 값이 없거나 자동 계산 가능한 경우)
        setTimeout(() => {
            templateItems.querySelectorAll('.template-item-row').forEach(row => {
                const periodInput = row.querySelector('.period-input');
                const quantityInput = row.querySelector('.quantity');
                const unitPriceInput = row.querySelector('.unit-price');
                const supplyPriceInput = row.querySelector('.supply-price');
                
                // 공급가액이 비어있거나 자동 계산 가능한 경우 계산
                if (supplyPriceInput && (!supplyPriceInput.value || supplyPriceInput.value.trim() === '')) {
                    const period = parseFloat(periodInput?.value || 0);
                    const quantity = parseFloat(quantityInput?.value || 0);
                    const unitPriceValue = unitPriceInput?.value || '';
                    const unitPrice = parseFloat(unitPriceValue.replace(/[^0-9.-]/g, ''));
                    
                    if (!isNaN(unitPrice) && unitPrice > 0) {
                        const periodValue = period > 0 ? period : 1;
                        const total = periodValue * quantity * unitPrice;
                        if (!isNaN(total) && total > 0) {
                            supplyPriceInput.value = total;
                        }
                    }
                }
            });
        }, 100);
        
        templateModal.style.display = 'flex';
    }
}

function setupQuoteRowDragEvents(row) {
    // 드래그 앤 드롭 이벤트
    const dragHandle = row.querySelector('.drag-handle');
    if (dragHandle) {
        dragHandle.addEventListener('mousedown', function(e) {
            row.draggable = true;
        });
    }
    
    row.addEventListener('dragstart', function(e) {
        // 입력 필드에서 드래그가 시작되지 않도록
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') {
            e.preventDefault();
            return false;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.outerHTML);
        this.classList.add('dragging');
    });
    
    row.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        this.draggable = false;
    });
    
    row.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const dragging = document.querySelector('.dragging');
        if (dragging && dragging !== this) {
            const allRows = Array.from(this.parentNode.querySelectorAll('.quote-item-row'));
            const draggingIndex = allRows.indexOf(dragging);
            const currentIndex = allRows.indexOf(this);
            
            if (draggingIndex < currentIndex) {
                this.parentNode.insertBefore(dragging, this.nextSibling);
            } else {
                this.parentNode.insertBefore(dragging, this);
            }
        }
    });
    
    row.addEventListener('drop', function(e) {
        e.preventDefault();
    });
    
    // 입력 필드 클릭 시 드래그 방지
    row.querySelectorAll('input, textarea, button').forEach(element => {
        element.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });
    });
}

function initQuoteForm() {
    const addItemBtn = document.getElementById('addItemBtn');
    const quoteItems = document.getElementById('quoteItems');
    const form = document.getElementById('estimateForm');

    if (addItemBtn) {
        addItemBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            addQuoteItem();
        });
    }

    // 기존 행들에 드래그 이벤트 추가
    if (quoteItems) {
        quoteItems.querySelectorAll('.quote-item-row').forEach(row => {
            row.draggable = true;
            setupQuoteRowDragEvents(row);
        });
    }

    quoteItems.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item')) {
            const row = e.target.closest('.quote-item-row');
            if (row && quoteItems.children.length > 1) {
                row.remove();
                calculateTotal();
            }
        }
    });

    quoteItems.addEventListener('input', function(e) {
        if (e.target.classList.contains('unit-price') || 
            e.target.classList.contains('quantity') || 
            e.target.classList.contains('period-input')) {
            calculateRowTotal(e.target.closest('.quote-item-row'));
        }
        if (e.target.classList.contains('supply-price')) {
            calculateTotal();
        }
        calculateTotal();
    });

    form.addEventListener('input', calculateTotal);
    form.addEventListener('change', calculateTotal);

    // 공급가액 수동 입력 감지
    quoteItems.addEventListener('focus', function(e) {
        if (e.target.classList.contains('supply-price')) {
            e.target.dataset.manualEdit = 'true';
        }
    }, true);

    quoteItems.addEventListener('blur', function(e) {
        if (e.target.classList.contains('supply-price')) {
            // 빈 값이면 자동 계산으로 복귀
            if (!e.target.value || e.target.value.trim() === '') {
                delete e.target.dataset.manualEdit;
                calculateRowTotal(e.target.closest('.quote-item-row'));
            }
        }
    }, true);

    const quoteDate = document.querySelector('input[name="quoteDate"]');
    if (quoteDate && !quoteDate.value) {
        const today = new Date().toISOString().split('T')[0];
        quoteDate.value = today;
    }

    // 견적서 저장 이벤트
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEstimate();
        });
    }

    // 미리보기 버튼 이벤트
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            showPreview();
        });
    }

    // PDF 저장 버튼 이벤트
    const pdfBtn = document.getElementById('pdfBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', function() {
            exportToPDF();
        });
    }
}

// 견적 항목 가져오기 함수 (전역)
function getCurrentItems() {
    const rows = document.querySelectorAll('.quote-item-row');
    const items = [];

    rows.forEach(row => {
        const item = {
            category: row.querySelector('textarea[name="category[]"]')?.value || '',
            detail: row.querySelector('textarea[name="detail[]"]')?.value || '',
            period: row.querySelector('input[name="period[]"]')?.value || '',
            quantity: row.querySelector('input[name="quantity[]"]')?.value || '1',
            unitPrice: row.querySelector('input[name="unitPrice[]"]')?.value || '',
            supplyPrice: row.querySelector('input[name="supplyPrice[]"]')?.value || '',
            remarks: row.querySelector('textarea[name="remarks[]"]')?.value || ''
        };
        items.push(item);
    });

    return items;
}

function initPaymentTextareaResize() {
    const paymentTextareas = document.querySelectorAll('textarea[name="paymentInfo"], textarea[name="depositInfo"], textarea[name="validityPeriod"]');
    
    paymentTextareas.forEach(textarea => {
        // 초기 높이 설정
        textarea.style.height = '2.5rem';
        
        // 입력 시 자동 높이 조절
        function autoResize() {
            textarea.style.height = '2.5rem'; // 최소 높이로 리셋
            const newHeight = Math.max(2.5, textarea.scrollHeight);
            textarea.style.height = newHeight + 'px';
        }
        
        // 이벤트 리스너 추가
        textarea.addEventListener('input', autoResize);
        textarea.addEventListener('paste', function() {
            setTimeout(autoResize, 10);
        });
        
        // 초기 로드 시 높이 조절
        setTimeout(autoResize, 100);
    });
}

// 필수 입력값 검증 함수
function validateRequiredFields() {
    let isValid = true;
    const errors = {};

    // 고객사 정보 필드 검증
    const customerName = document.querySelector('input[name="customerName"]');
    const customerManager = document.querySelector('input[name="customerManager"]');
    const customerContact = document.querySelector('input[name="customerContact"]');
    const customerEmail = document.querySelector('input[name="customerEmail"]');
    
    // 견적서 필드 검증
    const recipient = document.querySelector('input[name="recipient"]');
    const quoteName = document.querySelector('input[name="quoteName"]');

    // 모든 에러 메시지 초기화
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.classList.remove('show');
        msg.textContent = '';
    });

    // 고객사명 검증
    if (!customerName || !customerName.value.trim()) {
        isValid = false;
        const errorMsg = document.getElementById('error-customerName');
        if (errorMsg) {
            errorMsg.textContent = '고객사명을 입력해주세요.';
            errorMsg.classList.add('show');
        }
        if (customerName) customerName.style.borderColor = '#ef4444';
    } else {
        if (customerName) customerName.style.borderColor = '';
    }

    // 담당자명 검증
    if (!customerManager || !customerManager.value.trim()) {
        isValid = false;
        const errorMsg = document.getElementById('error-customerManager');
        if (errorMsg) {
            errorMsg.textContent = '담당자명을 입력해주세요.';
            errorMsg.classList.add('show');
        }
        if (customerManager) customerManager.style.borderColor = '#ef4444';
    } else {
        if (customerManager) customerManager.style.borderColor = '';
    }

    // 연락처 검증
    if (!customerContact || !customerContact.value.trim()) {
        isValid = false;
        const errorMsg = document.getElementById('error-customerContact');
        if (errorMsg) {
            errorMsg.textContent = '연락처를 입력해주세요.';
            errorMsg.classList.add('show');
        }
        if (customerContact) customerContact.style.borderColor = '#ef4444';
    } else {
        if (customerContact) customerContact.style.borderColor = '';
    }

    // 이메일 검증
    if (!customerEmail || !customerEmail.value.trim()) {
        isValid = false;
        const errorMsg = document.getElementById('error-customerEmail');
        if (errorMsg) {
            errorMsg.textContent = '이메일을 입력해주세요.';
            errorMsg.classList.add('show');
        }
        if (customerEmail) customerEmail.style.borderColor = '#ef4444';
    } else {
        // 이메일 형식 검증
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (customerEmail.value.trim() && !emailPattern.test(customerEmail.value.trim())) {
            isValid = false;
            const errorMsg = document.getElementById('error-customerEmail');
            if (errorMsg) {
                errorMsg.textContent = '올바른 이메일 형식을 입력해주세요.';
                errorMsg.classList.add('show');
            }
            if (customerEmail) customerEmail.style.borderColor = '#ef4444';
        } else {
            if (customerEmail) customerEmail.style.borderColor = '';
        }
    }

    // 수신자 검증
    if (!recipient || !recipient.value.trim()) {
        isValid = false;
        const errorMsg = document.getElementById('error-recipient');
        if (errorMsg) {
            errorMsg.textContent = '수신자를 입력해주세요.';
            errorMsg.classList.add('show');
        }
        if (recipient) recipient.style.borderColor = '#ef4444';
    } else {
        if (recipient) recipient.style.borderColor = '';
    }

    // 견적명 검증
    if (!quoteName || !quoteName.value.trim()) {
        isValid = false;
        const errorMsg = document.getElementById('error-quoteName');
        if (errorMsg) {
            errorMsg.textContent = '견적명을 입력해주세요.';
            errorMsg.classList.add('show');
        }
        if (quoteName) quoteName.style.borderColor = '#ef4444';
    } else {
        if (quoteName) quoteName.style.borderColor = '';
    }

    // 첫 번째 에러 필드로 스크롤
    if (!isValid) {
        const firstError = document.querySelector('.error-message.show');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

// 입력 필드 실시간 검증 (저장 버튼 클릭 시에만 검증)
function initFieldValidation() {
    // blur 이벤트 제거 - 저장 버튼 클릭 시에만 검증
}

// 견적서 저장 함수
function saveEstimate() {
    const form = document.getElementById('estimateForm');
    if (!form) return;

    // 필수 입력값 검증
    if (!validateRequiredFields()) {
        return;
    }

    const formData = new FormData(form);
    const customerForm = document.getElementById('customerInfoForm');
    const customerFormData = customerForm ? new FormData(customerForm) : null;
    
    const now = new Date();
    const registeredDate = now.toISOString().split('T')[0]; // 등록일자 (YYYY-MM-DD)
    
    const estimateData = {
        id: Date.now().toString(),
        customerName: customerFormData ? customerFormData.get('customerName') || '' : '',
        customerManager: customerFormData ? customerFormData.get('customerManager') || '' : '',
        customerPosition: customerFormData ? customerFormData.get('customerPosition') || '' : '',
        customerContact: customerFormData ? customerFormData.get('customerContact') || '' : '',
        customerEmail: customerFormData ? customerFormData.get('customerEmail') || '' : '',
        purpose: customerFormData ? customerFormData.getAll('purpose') : [],
        recipient: formData.get('recipient') || '',
        reference: formData.get('reference') || '',
        quoteName: formData.get('quoteName') || '',
        quoteDate: formData.get('quoteDate') || '',
        paymentInfo: formData.get('paymentInfo') || '',
        depositInfo: formData.get('depositInfo') || '',
        managerName: formData.get('managerName') || '',
        managerPosition: formData.get('managerPosition') || '',
        managerContact: formData.get('managerContact') || '',
        managerEmail: formData.get('managerEmail') || '',
        validityPeriod: formData.get('validityPeriod') || '',
        items: getCurrentItems(),
        totalAmount: document.getElementById('itemsTotalAmount')?.textContent || '0원',
        registeredDate: registeredDate, // 등록일자
        status: 'review', // 단계: 검토중
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
    };

    // localStorage에 저장
    let estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    estimates.push(estimateData);
    localStorage.setItem('estimates', JSON.stringify(estimates));

    alert('견적서가 저장되었습니다.');
    window.location.href = 'estimate_list.html';
}

// 미리보기 함수
function showPreview() {
    const previewWindow = window.open('', '_blank', 'width=900,height=1000');
    const form = document.getElementById('estimateForm');
    
    if (!form || !previewWindow) return;

    const formData = new FormData(form);
    const items = getCurrentItems();
    
    // 총액 계산
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
                th:nth-child(1), td:nth-child(1) { width: 13%; } /* 구분 */
                th:nth-child(2), td:nth-child(2) { width: 22%; } /* 세부 항목 */
                th:nth-child(3), td:nth-child(3) { width: 7%; text-align: right; } /* 기본계약 기간 - 우측 정렬, 너비 줄임 */
                th:nth-child(4), td:nth-child(4) { width: 6%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right; } /* 수량 - 1줄, 우측 정렬 */
                th:nth-child(5), td:nth-child(5) { width: 11%; text-align: right; } /* 단가 - 우측 정렬 */
                th:nth-child(6), td:nth-child(6) { width: 11%; text-align: right; } /* 공급가액 - 우측 정렬 */
                th:nth-child(7), td:nth-child(7) { width: 20%; } /* 비고 - 너비 더 늘림 */
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
                <p><strong>수신자:</strong> ${escapeHtml(formData.get('recipient') || '')}</p>
                <p><strong>참조:</strong> ${escapeHtml(formData.get('reference') || '')}</p>

                <h2>견적 기본 정보</h2>
                <p><strong>견적명:</strong> <span class="quote-name">${escapeHtml(formData.get('quoteName') || '')}</span></p>
                <p><strong>견적일자:</strong> ${escapeHtml(formData.get('quoteDate') || '')}</p>
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
                                <td>${escapeHtml(item.category || '')}</td>
                                <td>${escapeHtml(item.detail || '')}</td>
                                <td style="text-align: right;">${escapeHtml(item.period || '')}</td>
                                <td style="text-align: right;">${escapeHtml(item.quantity || '')}</td>
                                <td style="text-align: right;">${escapeHtml(item.unitPrice || '')}</td>
                                <td style="text-align: right;">${escapeHtml(item.supplyPrice || '')}</td>
                                <td>${escapeHtml(item.remarks || '')}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="6" class="text-right">계약 총액</td>
                            <td class="text-right">${totalWithoutVAT.toLocaleString()}원</td>
                        </tr>
                    </tbody>
                </table>

                <h2>결제 및 담당자 안내</h2>
                <p><strong>결제 정보:</strong> ${escapeHtml(formData.get('paymentInfo') || '')}</p>
                <p><strong>입금 관련:</strong> ${escapeHtml(formData.get('depositInfo') || '')}</p>
                <p><strong>견적 담당자:</strong> ${escapeHtml(formData.get('managerName') || '')} (${escapeHtml(formData.get('managerPosition') || '')})</p>
                <p><strong>연락처:</strong> ${escapeHtml(formData.get('managerContact') || '')} | <strong>이메일:</strong> ${escapeHtml(formData.get('managerEmail') || '')}</p>
                <p><strong>유효기간:</strong> ${escapeHtml(formData.get('validityPeriod') || '')}</p>
            </div>
            <div class="preview-actions">
                <button class="btn-pdf" onclick="downloadPDF()">PDF 다운로드</button>
                <button class="btn-print" onclick="window.print()">출력</button>
            </div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            <script>
                const previewFormData = ${JSON.stringify(Object.fromEntries(formData))};
                const previewItems = ${JSON.stringify(items)};
                const previewTotalAmount = ${JSON.stringify(totalAmountDisplay)};
                const previewTotalWithoutVAT = ${totalWithoutVAT};
                const previewTotalWithVAT = ${totalWithVAT};
                
                function downloadPDF() {
                    const pdfContent = document.querySelector('.preview-container').cloneNode(true);
                    pdfContent.style.width = '210mm';
                    pdfContent.style.padding = '20mm';
                    pdfContent.style.fontFamily = "'Nanum Barun Gothic', sans-serif";
                    pdfContent.style.fontSize = '12pt';
                    pdfContent.style.lineHeight = '1.6';
                    
                    const opt = {
                        margin: [10, 10, 10, 10],
                        filename: '견적서_' + (previewFormData.quoteName || '견적서') + '_' + new Date().toISOString().split('T')[0] + '.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };
                    
                    html2pdf().set(opt).from(pdfContent).save();
                }
            </script>
        </body>
        </html>
    `);
    previewWindow.document.close();
}

// PDF 저장 함수
function exportToPDF() {
    // html2pdf 라이브러리 사용을 위해 CDN 추가 필요
    if (typeof html2pdf === 'undefined') {
        // html2pdf.js 라이브러리 로드
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = function() {
            generatePDF();
        };
        document.head.appendChild(script);
    } else {
        generatePDF();
    }
}

function generatePDF() {
    const form = document.getElementById('estimateForm');
    if (!form) return;

    const formData = new FormData(form);
    const items = getCurrentItems();
    
    // 총액 계산
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

    // PDF용 HTML 생성
    const pdfContent = document.createElement('div');
    pdfContent.style.width = '210mm';
    pdfContent.style.maxWidth = '210mm';
    pdfContent.style.padding = '10mm';
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
            <p style="margin: 0.2rem 0;"><strong>수신자:</strong> ${escapeHtml(formData.get('recipient') || '')}</p>
            <p style="margin: 0.2rem 0;"><strong>참조:</strong> ${escapeHtml(formData.get('reference') || '')}</p>
        </div>

        <div style="margin-bottom: 1rem;">
            <h2 style="font-size: 1.1rem; margin-bottom: 0.4rem; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem;">견적 기본 정보</h2>
            <p style="margin: 0.2rem 0;"><strong>견적명:</strong> <span style="font-size: 11pt; font-weight: 700; color: #1f6bff;">${escapeHtml(formData.get('quoteName') || '')}</span></p>
            <p style="margin: 0.2rem 0;"><strong>견적일자:</strong> ${escapeHtml(formData.get('quoteDate') || '')}</p>
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
                            <td style="border: 1px solid #ddd; padding: 0.3rem; word-wrap: break-word;">${escapeHtml(item.category || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; word-wrap: break-word;">${escapeHtml(item.detail || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; text-align: right;">${escapeHtml(item.period || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; text-align: right; white-space: nowrap;">${escapeHtml(item.quantity || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; text-align: right;">${escapeHtml(item.unitPrice || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; text-align: right;">${escapeHtml(item.supplyPrice || '')}</td>
                            <td style="border: 1px solid #ddd; padding: 0.3rem; word-wrap: break-word;">${escapeHtml(item.remarks || '')}</td>
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
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>결제 정보:</strong> ${escapeHtml(formData.get('paymentInfo') || '')}</p>
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>입금 관련:</strong> ${escapeHtml(formData.get('depositInfo') || '')}</p>
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>견적 담당자:</strong> ${escapeHtml(formData.get('managerName') || '')} (${escapeHtml(formData.get('managerPosition') || '')})</p>
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>연락처:</strong> ${escapeHtml(formData.get('managerContact') || '')} | <strong>이메일:</strong> ${escapeHtml(formData.get('managerEmail') || '')}</p>
            <p style="margin: 0.2rem 0; font-size: 9pt;"><strong>유효기간:</strong> ${escapeHtml(formData.get('validityPeriod') || '')}</p>
        </div>
        </div>
    `;

    // DOM에 추가하여 렌더링
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.top = '0';
    document.body.appendChild(pdfContent);

    // 렌더링 대기
    setTimeout(() => {
        const opt = {
            margin: [5, 5, 5, 5],
            filename: `견적서_${formData.get('quoteName') || '견적서'}_${new Date().toISOString().split('T')[0]}.pdf`,
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
            // PDF 생성 후 DOM에서 제거
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addQuoteItem() {
    const quoteItems = document.getElementById('quoteItems');
    const newRow = document.createElement('tr');
    newRow.className = 'quote-item-row';
    newRow.draggable = true;
    newRow.innerHTML = `
        <td class="drag-handle" style="cursor: move; text-align: center; width: 30px;">☰</td>
        <td><textarea name="category[]" placeholder="구분" rows="1" class="auto-resize"></textarea></td>
        <td><textarea name="detail[]" placeholder="세부 항목" rows="1" class="auto-resize"></textarea></td>
        <td class="period-col"><input type="number" name="period[]" placeholder="월" min="0" class="period-input" /></td>
        <td><input type="number" name="quantity[]" placeholder="수량" min="1" value="1" class="quantity" /></td>
        <td><input type="text" name="unitPrice[]" placeholder="단가" class="unit-price" /></td>
        <td><input type="text" name="supplyPrice[]" placeholder="공급가액" class="supply-price" /></td>
        <td><textarea name="remarks[]" placeholder="비고" rows="2" class="auto-resize"></textarea></td>
        <td><button type="button" class="btn-icon-small remove-item">×</button></td>
    `;
    quoteItems.appendChild(newRow);
    setupQuoteRowDragEvents(newRow);
}

function calculateRowTotal(row) {
    const period = parseFloat(row.querySelector('.period-input')?.value || 0);
    const quantity = parseFloat(row.querySelector('.quantity')?.value || 0);
    const unitPrice = parseFloat(row.querySelector('.unit-price')?.value || 0);
    const supplyPriceInput = row.querySelector('.supply-price');
    
    if (supplyPriceInput) {
        // 기본계약 기간이 0이거나 입력되지 않은 경우 1로 처리
        const periodValue = period > 0 ? period : 1;
        const total = periodValue * quantity * unitPrice;
        
        // 공급가액이 수동으로 수정되지 않은 경우에만 자동 계산
        // (사용자가 직접 입력한 경우는 유지)
        if (!supplyPriceInput.dataset.manualEdit) {
            supplyPriceInput.value = isNaN(total) || total === 0 ? '' : total;
        }
    }
}

function calculateTotal() {
    const rows = document.querySelectorAll('.quote-item-row');
    let total = 0;

    rows.forEach(row => {
        const supplyPriceInput = row.querySelector('.supply-price');
        const supplyPriceValue = supplyPriceInput?.value || '';
        
        // 텍스트에서 숫자만 추출하여 계산
        if (supplyPriceValue.trim() !== '') {
            // 숫자, 소수점, 마이너스 기호만 추출
            const numericString = supplyPriceValue.replace(/[^0-9.-]/g, '');
            const numericValue = parseFloat(numericString);
            
            if (!isNaN(numericValue)) {
                total += numericValue;
            }
        }
    });

    const totalWithoutVAT = total;
    const totalWithVAT = Math.floor(total * 1.1);

    document.getElementById('totalWithoutVAT').textContent = totalWithoutVAT.toLocaleString() + '원 (VAT 별도)';
    document.getElementById('totalWithVAT').textContent = totalWithVAT.toLocaleString() + '원 (VAT 포함)';
    
    const itemsTotalElement = document.getElementById('itemsTotalAmount');
    if (itemsTotalElement) {
        itemsTotalElement.textContent = totalWithoutVAT.toLocaleString() + '원';
    }
}
