class MiniStore {
    constructor() {
        this.products = this.loadProducts();
        this.currentView = 'home';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderProductList();
        this.renderProductCatalog();
        this.updateCategoryFilter();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn, .cta-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                if (view) {
                    this.switchView(view);
                }
            });
        });

        // Product form
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterProducts();
        });

        // Category filter
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterProducts();
        });
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(viewName).classList.add('active');

        this.currentView = viewName;

        // Refresh data when switching to catalog or management
        if (viewName === 'catalog') {
            this.renderProductCatalog();
            this.updateCategoryFilter();
        } else if (viewName === 'management') {
            this.renderProductList();
        }
    }

    loadProducts() {
        const stored = localStorage.getItem('ministore_products');
        return stored ? JSON.parse(stored) : [];
    }

    saveProducts() {
        localStorage.setItem('ministore_products', JSON.stringify(this.products));
    }

    addProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        const product = {
            id: formData.get('productId').trim(),
            name: formData.get('productName').trim(),
            category: formData.get('category'),
            price: parseFloat(formData.get('price'))
        };

        // Validation
        if (!product.id || !product.name || !product.category || !product.price) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        // Check for duplicate ID
        if (this.products.some(p => p.id === product.id)) {
            this.showToast('Product ID already exists! Please use a unique ID.', 'error');
            return;
        }

        // Add product
        this.products.push(product);
        this.saveProducts();
        
        // Clear form
        form.reset();
        
        // Update UI
        this.renderProductList();
        this.showToast('Product added successfully!', 'success');
        
        console.log('Product added:', product);
    }

    removeProduct(productId) {
        if (confirm('Are you sure you want to remove this product?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.renderProductList();
            this.showToast('Product removed successfully!', 'success');
            
            console.log('Product removed:', productId);
        }
    }

    renderProductList() {
        const container = document.getElementById('productList');
        
        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📋</span>
                    <h3>No products yet</h3>
                    <p>Add your first product using the form</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.products.map(product => `
            <div class="product-item">
                <div class="product-info">
                    <h4>${this.escapeHtml(product.name)}</h4>
                    <p><strong>ID:</strong> ${this.escapeHtml(product.id)} | <strong>Category:</strong> ${this.escapeHtml(product.category)} | <strong>Price:</strong> $${product.price.toFixed(2)}</p>
                </div>
                <button class="remove-btn" onclick="store.removeProduct('${product.id}')">
                    Remove
                </button>
            </div>
        `).join('');
    }

    renderProductCatalog() {
        const container = document.getElementById('productGrid');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const selectedCategory = document.getElementById('categoryFilter').value;
        
        let filteredProducts = this.products;
        
        // Apply filters
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
                product.id.toLowerCase().includes(searchTerm)
            );
        }
        
        if (selectedCategory) {
            filteredProducts = filteredProducts.filter(product => 
                product.category === selectedCategory
            );
        }

        if (filteredProducts.length === 0) {
            const message = this.products.length === 0 
                ? 'No products available' 
                : 'No products found matching your criteria';
            const actionText = this.products.length === 0 
                ? 'Add some products to get started!' 
                : 'Try adjusting your search or filter.';
            
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📦</span>
                    <h3>${message}</h3>
                    <p>${actionText}</p>
                    ${this.products.length === 0 ? '<button class="cta-btn" data-view="management">Add Products</button>' : ''}
                </div>
            `;
            
            // Re-attach event listener for the button if it exists
            const addBtn = container.querySelector('[data-view="management"]');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.switchView('management'));
            }
            
            return;
        }

        container.innerHTML = filteredProducts.map(product => `
            <div class="product-card">
                <div class="product-id">ID: ${this.escapeHtml(product.id)}</div>
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-category">${this.escapeHtml(product.category)}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
            </div>
        `).join('');
    }

    filterProducts() {
        this.renderProductCatalog();
    }

    updateCategoryFilter() {
        const select = document.getElementById('categoryFilter');
        const categories = [...new Set(this.products.map(p => p.category))];
        
        // Keep the current selection if possible
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (categories.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        // Trigger reflow to ensure the transition works
        toast.offsetHeight;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const store = new MiniStore();

// Add some sample data if none exists
if (store.products.length === 0) {
    const sampleProducts = [
        {
            id: 'ELEC001',
            name: 'Wireless Bluetooth Headphones',
            category: 'Electronics',
            price: 79.99
        },
        {
            id: 'CLOTH001',
            name: 'Cotton T-Shirt',
            category: 'Clothing',
            price: 24.99
        },
        {
            id: 'WATCH001',
            name: 'Digital Sports Watch',
            category: 'Watches',
            price: 149.99
        },
        {
            id: 'ELEC002',
            name: 'Smartphone Case',
            category: 'Electronics',
            price: 19.99
        },
        {
            id: 'CLOTH002',
            name: 'Denim Jeans',
            category: 'Clothing',
            price: 89.99
        }
    ];
    
    store.products = sampleProducts;
    store.saveProducts();
    store.renderProductList();
    store.renderProductCatalog();
    store.updateCategoryFilter();
    
    console.log('Sample products loaded');
}

console.log('Mini Online Store initialized');
