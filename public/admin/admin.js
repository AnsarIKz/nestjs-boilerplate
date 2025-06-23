// API Configuration
const API_BASE_URL =
  window.location.protocol +
  '//' +
  window.location.hostname +
  ':' +
  (window.location.port || '3000');

// Global state
let authToken = localStorage.getItem('admin_token');
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
  if (!authToken) {
    showLoginModal();
  } else {
    loadDashboard();
  }
});

// Authentication functions
function showLoginModal() {
  const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  loginModal.show();
}

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const phoneNumber = document.getElementById('phoneNumber').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, password }),
    });

    const data = await response.json();

    if (response.ok && data.data) {
      const userData = data.data;

      // Check if user has admin or restaurant owner role
      if (userData.user.role !== 'ADMIN' && userData.user.role !== 'RESTAURANT_OWNER') {
        errorDiv.textContent = 'У вас нет прав доступа к админ панели';
        errorDiv.style.display = 'block';
        return;
      }

      authToken = userData.access_token;
      currentUser = userData.user;
      localStorage.setItem('admin_token', authToken);
      localStorage.setItem('admin_user', JSON.stringify(currentUser));

      // Hide modal and load dashboard
      bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
      loadDashboard();
    } else {
      errorDiv.textContent = data.message || 'Ошибка входа';
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = 'Ошибка соединения с сервером';
    errorDiv.style.display = 'block';
  }
});

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.location.reload();
}

// API call helper
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (response.status === 401) {
      logout();
      return null;
    }

    return { response, data };
  } catch (error) {
    console.error('API call error:', error);
    showAlert('Ошибка соединения с сервером', 'danger');
    return null;
  }
}

// Navigation functions
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach((section) => {
    section.classList.remove('active');
  });

  // Remove active class from nav links
  document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
    link.classList.remove('active');
  });

  // Show selected section
  document.getElementById(sectionName).classList.add('active');

  // Add active class to corresponding nav link
  event.target.classList.add('active');

  // Load data for the section
  switch (sectionName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'users':
      loadUsers();
      break;
    case 'restaurants':
      loadRestaurants();
      break;
    case 'bookings':
      loadBookings();
      break;
    case 'bills':
      loadBills();
      break;
  }
}

// Dashboard functions
async function loadDashboard() {
  try {
    const result = await apiCall('/admin-api/dashboard/stats');
    if (result && result.data && result.data.data) {
      const stats = result.data.data;

      document.getElementById('totalUsers').textContent = stats.totalUsers;
      document.getElementById('totalRestaurants').textContent = stats.totalRestaurants;
      document.getElementById('totalBookings').textContent = stats.totalBookings;
      document.getElementById('totalBills').textContent = stats.totalBills;
      document.getElementById('pendingBookings').textContent = stats.pendingBookings;
      document.getElementById('unpaidBills').textContent = stats.unpaidBills;
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showAlert('Ошибка загрузки статистики', 'danger');
  }
}

// Users functions
async function loadUsers() {
  showLoading('users');

  try {
    const result = await apiCall('/users');
    if (result && result.data && result.data.data) {
      const users = result.data.data.users || result.data.data;
      renderUsersTable(Array.isArray(users) ? users : []);
    }
  } catch (error) {
    console.error('Error loading users:', error);
    showAlert('Ошибка загрузки пользователей', 'danger');
  }

  hideLoading('users');
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  users.forEach((user) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${user.id.substring(0, 8)}...</td>
            <td>${user.phoneNumber}</td>
            <td>${user.firstName || ''} ${user.lastName || ''}</td>
            <td>${user.email || '-'}</td>
            <td><span class="badge bg-${getRoleBadgeColor(user.role)}">${getRoleText(user.role)}</span></td>
            <td>${formatDate(user.createdAt)}</td>
        `;
    tbody.appendChild(row);
  });
}

// Restaurants functions
async function loadRestaurants() {
  showLoading('restaurants');

  try {
    const result = await apiCall('/restaurants');
    if (result && result.data && result.data.data) {
      const restaurants = result.data.data.restaurants || result.data.data;
      renderRestaurantsTable(Array.isArray(restaurants) ? restaurants : []);
    }
  } catch (error) {
    console.error('Error loading restaurants:', error);
    showAlert('Ошибка загрузки ресторанов', 'danger');
  }

  hideLoading('restaurants');
}

function renderRestaurantsTable(restaurants) {
  const tbody = document.getElementById('restaurantsTableBody');
  tbody.innerHTML = '';

  restaurants.forEach((restaurant) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td><strong>${restaurant.name}</strong></td>
            <td>${restaurant.address}</td>
            <td>${restaurant.phoneNumber}</td>
            <td>${restaurant.cuisine ? restaurant.cuisine.join(', ') : '-'}</td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="me-1">${restaurant.rating || 0}</span>
                    <i class="bi bi-star-fill text-warning"></i>
                </div>
            </td>
            <td>
                <span class="badge bg-${restaurant.isActive ? 'success' : 'danger'}">
                    ${restaurant.isActive ? 'Активен' : 'Неактивен'}
                </span>
            </td>
        `;
    tbody.appendChild(row);
  });
}

// Bookings functions
async function loadBookings() {
  showLoading('bookings');

  try {
    const result = await apiCall('/bookings?all=true');
    if (result && result.data && result.data.data) {
      const bookings = result.data.data.bookings || result.data.data;
      renderBookingsTable(Array.isArray(bookings) ? bookings : []);
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
    showAlert('Ошибка загрузки бронирований', 'danger');
  }

  hideLoading('bookings');
}

function renderBookingsTable(bookings) {
  const tbody = document.getElementById('bookingsTableBody');
  tbody.innerHTML = '';

  bookings.forEach((booking) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td><strong>${booking.customerName}</strong></td>
            <td>${booking.customerPhone}</td>
            <td>${formatDate(booking.bookingDate)}</td>
            <td>${booking.bookingTime}</td>
            <td>${booking.guestCount}</td>
            <td><span class="status-badge status-${booking.status.toLowerCase()}">${getStatusText(booking.status)}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm" onclick="viewBooking('${booking.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${
                      booking.status === 'PENDING'
                        ? `
                        <button class="btn btn-outline-success btn-sm" onclick="updateBookingStatus('${booking.id}', 'CONFIRMED')">
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="updateBookingStatus('${booking.id}', 'CANCELLED')">
                            <i class="bi bi-x"></i>
                        </button>
                    `
                        : ''
                    }
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });
}

// Bills functions
async function loadBills() {
  showLoading('bills');

  try {
    const result = await apiCall('/bills');
    if (result && result.data && result.data.data) {
      const bills = result.data.data.bills || result.data.data;
      renderBillsTable(Array.isArray(bills) ? bills : []);
    }
  } catch (error) {
    console.error('Error loading bills:', error);
    showAlert('Ошибка загрузки счетов', 'danger');
  }

  hideLoading('bills');
}

function renderBillsTable(bills) {
  const tbody = document.getElementById('billsTableBody');
  tbody.innerHTML = '';

  bills.forEach((bill) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td><strong>${bill.billNumber}</strong></td>
            <td>${bill.customerName}</td>
            <td>${formatCurrency(bill.totalAmount)}</td>
            <td><span class="status-badge status-${bill.status.toLowerCase()}">${getStatusText(bill.status)}</span></td>
            <td>${getPaymentMethodText(bill.paymentMethod)}</td>
            <td>${formatDate(bill.createdAt)}</td>
        `;
    tbody.appendChild(row);
  });
}

// Booking actions
async function updateBookingStatus(bookingId, status) {
  try {
    const result = await apiCall(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (result && result.data) {
      showAlert(`Статус бронирования обновлен на "${getStatusText(status)}"`, 'success');
      loadBookings(); // Reload bookings
      loadDashboard(); // Update dashboard stats
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    showAlert('Ошибка обновления статуса', 'danger');
  }
}

function viewBooking(bookingId) {
  // TODO: Implement booking details modal
  showAlert('Просмотр деталей бронирования будет добавлен в следующей версии', 'info');
}

// Utility functions
function showLoading(section) {
  document.getElementById(`${section}Loading`).style.display = 'block';
  document.getElementById(`${section}Table`).style.display = 'none';
}

function hideLoading(section) {
  document.getElementById(`${section}Loading`).style.display = 'none';
  document.getElementById(`${section}Table`).style.display = 'block';
}

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  document.body.appendChild(alertDiv);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return (
    date.toLocaleDateString('ru-RU') +
    ' ' +
    date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

function formatCurrency(amount) {
  if (!amount) return '0 ₸';
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';
}

function getRoleBadgeColor(role) {
  switch (role) {
    case 'ADMIN':
      return 'danger';
    case 'RESTAURANT_OWNER':
      return 'warning';
    case 'USER':
      return 'primary';
    default:
      return 'secondary';
  }
}

function getRoleText(role) {
  switch (role) {
    case 'ADMIN':
      return 'Администратор';
    case 'RESTAURANT_OWNER':
      return 'Владелец ресторана';
    case 'USER':
      return 'Пользователь';
    default:
      return role;
  }
}

function getStatusText(status) {
  switch (status) {
    case 'PENDING':
      return 'Ожидает';
    case 'CONFIRMED':
      return 'Подтверждено';
    case 'CANCELLED':
      return 'Отменено';
    case 'COMPLETED':
      return 'Завершено';
    case 'NO_SHOW':
      return 'Не явился';
    case 'PAID':
      return 'Оплачено';
    default:
      return status;
  }
}

function getPaymentMethodText(method) {
  switch (method) {
    case 'CASH':
      return 'Наличные';
    case 'CARD':
      return 'Карта';
    case 'BANK_TRANSFER':
      return 'Перевод';
    case 'MOBILE_PAYMENT':
      return 'Мобильная оплата';
    case 'CRYPTOCURRENCY':
      return 'Криптовалюта';
    default:
      return method;
  }
}
