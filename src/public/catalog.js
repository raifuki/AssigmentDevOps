const form = document.querySelector('#product-form');
const formTitle = document.querySelector('#form-title');
const submitButton = document.querySelector('#submit-button');
const resetButton = document.querySelector('#reset-button');
const cancelButton = document.querySelector('#cancel-button');
const productIdInput = document.querySelector('#product-id');
const tableBody = document.querySelector('#product-table-body');
const productCount = document.querySelector('#product-count');
const totalValue = document.querySelector('#total-value');
const formMessage = document.querySelector('#form-message');
const emptyStateRow = document.querySelector('#empty-state');

const formatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const state = {
  products: [],
};

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? '#b91c1c' : '#166534';
}

function resetForm() {
  form.reset();
  productIdInput.value = '';
  formTitle.textContent = 'Thêm sản phẩm mới';
  submitButton.textContent = 'Thêm sản phẩm';
  showMessage('');
}

function renderProducts() {
  tableBody.innerHTML = '';

  if (!state.products.length) {
    tableBody.appendChild(emptyStateRow);
    productCount.textContent = '0';
    totalValue.textContent = '0₫';
    return;
  }

  const totalInventoryValue = state.products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);
  totalValue.textContent = formatter.format(totalInventoryValue);
  productCount.textContent = String(state.products.length);

  state.products.forEach((product) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>#${product.id}</td>
      <td>
        <div class="product-name">${product.name}</div>
        <small>${product.description || 'Không có mô tả'}</small>
      </td>
      <td>${product.category || 'Chưa phân loại'}</td>
      <td>${formatter.format(product.price || 0)}</td>
      <td>${product.stock ?? 0}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="small-btn edit-btn" data-id="${product.id}">Sửa</button>
          <button type="button" class="small-btn delete-btn" data-id="${product.id}">Xóa</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

async function fetchProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error('Không thể tải danh sách sản phẩm');
    }

    state.products = await response.json();
    renderProducts();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const payload = {
    name: document.querySelector('#name').value.trim(),
    description: document.querySelector('#description').value.trim(),
    price: Number(document.querySelector('#price').value),
    sku: document.querySelector('#sku').value.trim(),
    category: document.querySelector('#category').value.trim(),
    stock: Number(document.querySelector('#stock').value),
  };

  const productId = productIdInput.value;
  const method = productId ? 'PUT' : 'POST';
  const url = productId ? `/api/products/${productId}` : '/api/products';

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || 'Không thể lưu sản phẩm');
    }

    showMessage(productId ? 'Cập nhật sản phẩm thành công.' : 'Thêm sản phẩm thành công.');
    resetForm();
    await fetchProducts();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function handleDelete(productId) {
  const confirmed = window.confirm('Bạn có chắc muốn xóa sản phẩm này không?');
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || 'Không thể xóa sản phẩm');
    }

    showMessage('Đã xóa sản phẩm.');
    await fetchProducts();
  } catch (error) {
    showMessage(error.message, true);
  }
}

function handleEdit(productId) {
  const product = state.products.find((item) => item.id === Number(productId));
  if (!product) {
    return;
  }

  productIdInput.value = String(product.id);
  document.querySelector('#name').value = product.name;
  document.querySelector('#description').value = product.description || '';
  document.querySelector('#price').value = product.price;
  document.querySelector('#sku').value = product.sku || '';
  document.querySelector('#category').value = product.category || '';
  document.querySelector('#stock').value = product.stock ?? 0;

  formTitle.textContent = 'Cập nhật sản phẩm';
  submitButton.textContent = 'Lưu thay đổi';
  showMessage('Đang chỉnh sửa sản phẩm.');
}

form.addEventListener('submit', handleSubmit);
resetButton.addEventListener('click', resetForm);
cancelButton.addEventListener('click', resetForm);

tableBody.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const productId = target.dataset.id;
  if (!productId) {
    return;
  }

  if (target.classList.contains('edit-btn')) {
    handleEdit(productId);
  }

  if (target.classList.contains('delete-btn')) {
    handleDelete(productId);
  }
});

resetForm();
fetchProducts();
