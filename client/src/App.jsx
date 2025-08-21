import { useEffect, useMemo, useRef, useState } from 'react';
const API = 'http://localhost:4000/api';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);

  const showNotification = (text, type) => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div>
      {screen === 'login' && (
        <LoginScreen
          onAuthenticated={(r, tok, serverProfile, uiUser) => {
            setRole(r);
            setToken(tok);
            setProfile(serverProfile);
            setCurrentUser(uiUser);
            setScreen('app');
          }}
          notify={showNotification}
        />
      )}
      {screen === 'app' && role && (
        <MainApp
          role={role}
          currentUser={currentUser}
          token={token}
          profile={profile}
          onLogout={() => {
            setScreen('login');
            setRole(null);
            setCurrentUser(null);
            setToken(null);
            setProfile(null);
          }}
          notify={showNotification}
        />
      )}
      {notification && (
        <div
          id="notification"
          className={`notification ${notification.type === 'error' ? 'error' : ''} ${notification.type === 'warning' ? 'warning' : ''}`}
          style={{ display: 'block' }}
        >
          {notification.text}
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onAuthenticated, notify }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const storeNameRef = useRef(null);
  const storeAddressRef = useRef(null);
  const storeEmailRef = useRef(null);
  const storePasswordRef = useRef(null);
  const courierNameRef = useRef(null);
  const courierPhoneRef = useRef(null);
  const courierEmailRef = useRef(null);
  const courierPasswordRef = useRef(null);
  const courierAddressRef = useRef(null);

    return (
    <div id="loginScreen" className="login-container">
      <div className="login-box">
        <h1 className="login-title">🚚 DeliveryPro</h1>
        <p className="login-subtitle">Hızlı ve güvenilir paket teslimat sistemi</p>

        <div className="role-buttons">
          <div className={`role-btn ${selectedRole === 'store' ? 'selected' : ''}`} onClick={() => setSelectedRole('store')}>
            <div className="role-icon">🏪</div>
            <div className="role-name">Dükkan</div>
          </div>
          <div className={`role-btn ${selectedRole === 'courier' ? 'selected' : ''}`} onClick={() => setSelectedRole('courier')}>
            <div className="role-icon">🏍️</div>
            <div className="role-name">Kurye</div>
          </div>
        </div>

        <div id="storeLogin" className={`login-form ${selectedRole === 'store' ? 'active' : ''}`}>
          <div className="form-group">
            <label htmlFor="storeName">Dükkan Adı:</label>
            <input type="text" id="storeName" placeholder="Örn: Mehmet Market" ref={storeNameRef} />
          </div>
          <div className="form-group">
            <label htmlFor="storeAddress">Dükkan Adresi:</label>
            <input type="text" id="storeAddress" placeholder="Tam adres..." ref={storeAddressRef} />
          </div>
          <div className="form-group">
            <label htmlFor="storeEmail">E-posta:</label>
            <input type="email" id="storeEmail" placeholder="ornek@site.com" ref={storeEmailRef} />
          </div>
          <div className="form-group">
            <label htmlFor="storePassword">Şifre:</label>
            <input type="password" id="storePassword" placeholder="••••••••" ref={storePasswordRef} />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <button
              className="btn-primary"
              onClick={async () => {
                const name = (storeNameRef.current?.value || '').trim();
                const addressText = (storeAddressRef.current?.value || '').trim();
                const email = (storeEmailRef.current?.value || '').trim();
                const password = (storePasswordRef.current?.value || '').trim();
                if (!name || !addressText || !email || !password) return notify('Lütfen tüm alanları doldurun!', 'error');
                try {
                  const r = await fetch(`${API}/auth/register/shop`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, addressText }) });
                  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Kayıt başarısız');
                  const token = d.token;
                  const meRes = await fetch(`${API}/shops/me`, { headers: { Authorization: `Bearer ${token}` } });
                  const me = await meRes.json();
                  const uiUser = { name: me.me.name, address: me.me.addressText, type: 'store' };
                  onAuthenticated('store', token, me.me, uiUser);
                  notify(`Hoş geldiniz ${me.me.name}! Sipariş oluşturmaya başlayabilirsiniz.`);
                } catch (e) { notify(e.message, 'error'); }
              }}
            >
              📝 Kayıt Ol
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                const email = (storeEmailRef.current?.value || '').trim();
                const password = (storePasswordRef.current?.value || '').trim();
                if (!email || !password) return notify('E-posta ve şifre gerekli', 'error');
                try {
                  const r = await fetch(`${API}/auth/login/shop`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
                  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Giriş başarısız');
                  const token = d.token;
                  const meRes = await fetch(`${API}/shops/me`, { headers: { Authorization: `Bearer ${token}` } });
                  const me = await meRes.json();
                  const uiUser = { name: me.me.name, address: me.me.addressText, type: 'store' };
                  onAuthenticated('store', token, me.me, uiUser);
                  notify(`Hoş geldiniz ${me.me.name}!`);
                } catch (e) { notify(e.message, 'error'); }
              }}
            >
              🔑 Giriş Yap
            </button>
          </div>
        </div>

        <div id="courierLogin" className={`login-form ${selectedRole === 'courier' ? 'active' : ''}`}>
          <div className="form-group">
            <label htmlFor="courierName">Kurye Adı:</label>
            <input type="text" id="courierName" placeholder="Adınız Soyadınız" ref={courierNameRef} />
          </div>
          <div className="form-group">
            <label htmlFor="courierPhone">Telefon (opsiyonel):</label>
            <input type="tel" id="courierPhone" placeholder="05xx xxx xx xx" ref={courierPhoneRef} />
          </div>
          <div className="form-group">
            <label htmlFor="courierAddress">Adres (opsiyonel):</label>
            <input type="text" id="courierAddress" placeholder="Tam adres" ref={courierAddressRef} />
          </div>
          <div className="form-group">
            <label htmlFor="courierEmail">E-posta:</label>
            <input type="email" id="courierEmail" placeholder="ornek@site.com" ref={courierEmailRef} />
          </div>
          <div className="form-group">
            <label htmlFor="courierPassword">Şifre:</label>
            <input type="password" id="courierPassword" placeholder="••••••••" ref={courierPasswordRef} />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <button
              className="btn-primary"
              onClick={async () => {
                const name = (courierNameRef.current?.value || '').trim();
                const addressText = (courierAddressRef.current?.value || '').trim();
                const email = (courierEmailRef.current?.value || '').trim();
                const password = (courierPasswordRef.current?.value || '').trim();
                const phone = (courierPhoneRef.current?.value || '').trim();
                if (!name || !email || !password) return notify('İsim, e-posta ve şifre gerekli', 'error');
                try {
                  const r = await fetch(`${API}/auth/register/courier`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, addressText }) });
                  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Kayıt başarısız');
                  const token = d.token;
                  const meRes = await fetch(`${API}/couriers/me`, { headers: { Authorization: `Bearer ${token}` } });
                  const me = await meRes.json();
                  const uiUser = { id: me.me._id, name: me.me.name, phone, location: me.me.addressText || '-', status: 'available', rating: (4.5 + Math.random() * 0.5).toFixed(1), deliveries: Math.floor(Math.random() * 200) + 50 };
                  onAuthenticated('courier', token, me.me, uiUser);
                  notify(`Hoş geldiniz ${me.me.name}! Sistem aktif, siparişler gelmeye başlayabilir.`);
                } catch (e) { notify(e.message, 'error'); }
              }}
            >
              📝 Kayıt Ol
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                const email = (courierEmailRef.current?.value || '').trim();
                const password = (courierPasswordRef.current?.value || '').trim();
                const phone = (courierPhoneRef.current?.value || '').trim();
                try {
                  const r = await fetch(`${API}/auth/login/courier`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
                  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Giriş başarısız');
                  const token = d.token;
                  const meRes = await fetch(`${API}/couriers/me`, { headers: { Authorization: `Bearer ${token}` } });
                  const me = await meRes.json();
                  const uiUser = { id: me.me._id, name: me.me.name, phone, location: me.me.addressText || '-', status: me.me.active ? 'available' : 'busy', rating: (4.5 + Math.random() * 0.5).toFixed(1), deliveries: Math.floor(Math.random() * 200) + 50 };
                  onAuthenticated('courier', token, me.me, uiUser);
                  notify(`Hoş geldiniz ${me.me.name}!`);
                } catch (e) { notify(e.message, 'error'); }
              }}
            >
              🔑 Giriş Yap
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  }

const DIST_MATRIX = {
  Konyaaltı: { Konyaaltı: 2, Lara: 25, Muratpaşa: 12, Kepez: 18, Aksu: 30, Döşemealtı: 20 },
  Lara: { Konyaaltı: 25, Lara: 3, Muratpaşa: 15, Kepez: 20, Aksu: 8, Döşemealtı: 25 },
  Muratpaşa: { Konyaaltı: 12, Lara: 15, Muratpaşa: 2, Kepez: 8, Aksu: 18, Döşemealtı: 15 },
  Kepez: { Konyaaltı: 18, Lara: 20, Muratpaşa: 8, Kepez: 2, Aksu: 22, Döşemealtı: 12 },
  Aksu: { Konyaaltı: 30, Lara: 8, Muratpaşa: 18, Kepez: 22, Aksu: 2, Döşemealtı: 28 },
  Döşemealtı: { Konyaaltı: 20, Lara: 25, Muratpaşa: 15, Kepez: 12, Aksu: 28, Döşemealtı: 3 },
};

function MainApp({ role, currentUser, token, profile, onLogout, notify }) {
  const [couriers, setCouriers] = useState(currentUser?.type === 'courier' ? [currentUser] : []);
  const [orders, setOrders] = useState([]);
  const [activeTime, setActiveTime] = useState(0);
  const [isCourierActive, setIsCourierActive] = useState(currentUser?.status === 'available');
  const [nearbyCouriers, setNearbyCouriers] = useState([]);

  useEffect(() => {
    if (role === 'courier') {
      const i = setInterval(() => setActiveTime((t) => t + 1), 60000);
      return () => clearInterval(i);
    }
  }, [role]);

  useEffect(() => {
    if (role === 'courier' && couriers.length === 0) setCouriers([currentUser]);
  }, [role, currentUser, couriers.length]);

  const availableCouriers = useMemo(() => couriers.filter((c) => c.status === 'available'), [couriers]);

  const assignOrderToNearest = (deliveryDistrict) => {
    if (availableCouriers.length === 0) return null;
    let nearest = null as any;
    let shortest = Number.POSITIVE_INFINITY;
    for (const c of availableCouriers) {
      const d = (DIST_MATRIX[c.location] && DIST_MATRIX[c.location][deliveryDistrict]) ?? 20;
      if (d < shortest) {
        shortest = d;
        nearest = { courier: c, distance: d };
      }
    }
    return nearest;
  };

  // Fetch courier orders periodically
  useEffect(() => {
    if (role !== 'courier' || !token) return;
    const fetchOrders = async () => {
      try {
        const r = await fetch(`${API}/orders/mine`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok) setOrders(d.orders || []);
      } catch {}
    };
    fetchOrders();
    const i = setInterval(fetchOrders, 8000);
    return () => clearInterval(i);
  }, [role, token]);

  // Fetch nearby couriers for store
  useEffect(() => {
    if (role !== 'store' || !token || !profile?.location) return;
    const fetchNearby = async () => {
      try {
        const r = await fetch(`${API}/couriers/nearby`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ pickup: profile.location }) });
        const d = await r.json();
        if (r.ok) {
          const withDistance = (d.couriers || []).map((c) => ({
            id: c._id,
            name: c.name,
            phone: '-',
            location: 'Yakın',
            status: 'available',
            distance: haversineKm(profile.location.coordinates[1], profile.location.coordinates[0], c.location.coordinates[1], c.location.coordinates[0]).toFixed(1)
          }));
          setNearbyCouriers(withDistance);
        }
      } catch {}
    };
    fetchNearby();
  }, [role, token, profile]);

  const headerTitle = role === 'store' ? `🏪 ${currentUser.name}` : '🏍️ Kurye Paneli';
  const userInfo = role === 'store' ? `Dükkan: ${currentUser.name}` : `Kurye: ${currentUser.name}`;

  return (
    <div id="mainApp" className="main-app active">
      <div className="header">
        <h1 id="headerTitle">{headerTitle}</h1>
        <div className="user-info">
          <span id="userInfo">{userInfo}</span>
          <button className="logout-btn" onClick={onLogout}>
            Çıkış
          </button>
        </div>
      </div>

      {role === 'store' && (
        <div id="storeInterface" style={{ display: 'block' }}>
          <div className="store-interface">
            <div className="store-header">
              <h2>📦 Yeni Sipariş Oluştur</h2>
              <p>Siparişinizi oluşturun, size en yakın kurye otomatik olarak atanacak</p>
            </div>
            <StoreContent
              onCreate={async (payload) => {
                try {
                  const r = await fetch(`${API}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
                  const d = await r.json();
                  if (!r.ok) throw new Error(d.error || 'Sipariş oluşturulamadı');
                  setOrders((o) => [d.order, ...o]);
                  if (d.assignedCourier) {
                    notify(`Sipariş oluşturuldu. Atanan kurye: ${d.assignedCourier.name}`);
                  } else {
                    notify('Sipariş oluşturuldu. Şu an atama bekliyor.');
                  }
                } catch (e) { notify(e.message, 'error'); }
              }}
              couriers={nearbyCouriers}
            />
          </div>
        </div>
      )}

      {role === 'courier' && (
        <div id="courierInterface" style={{ display: 'block' }}>
          <div className="courier-interface">
            <div className="courier-panel">
              <div className="panel-header">
                <h2>📍 Durumum</h2>
              </div>
              <div className="panel-content">
                <div className="courier-card">
                  <div id="courierStatusBadge" className={`courier-status ${isCourierActive ? 'status-available' : 'status-busy'}`}>
                    {isCourierActive ? 'Müsait' : 'Meşgul'}
                  </div>
                  <div className="courier-info">
                    <div className="courier-details">
                      <h3 id="courierDisplayName">{currentUser.name}</h3>
                      <p>
                        <strong>📍 Konum:</strong> <span id="courierDisplayLocation">{currentUser.location}</span>
                      </p>
                      <p>
                        <strong>📱 Telefon:</strong> <span id="courierDisplayPhone">{currentUser.phone}</span>
                      </p>
                      <p>
                        <strong>⭐ Değerlendirme:</strong> {currentUser.rating || '4.8'}/5 ({currentUser.deliveries || 127} teslimat)
                      </p>
                      <p>
                        <strong>🕐 Aktif Süre:</strong> <span id="activeTime">{activeTime} dakika</span>
                      </p>
                    </div>
                  </div>
                  <button
                    id="statusToggle"
                    className={`btn ${isCourierActive ? 'btn-warning' : 'btn-success'}`}
                    onClick={async () => {
                      try {
                        const newVal = !isCourierActive;
                        const r = await fetch(`${API}/couriers/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: newVal }) });
                        if (!r.ok) throw new Error('Durum güncellenemedi');
                        setIsCourierActive(newVal);
                        setCouriers((cs) => cs.map((c) => (c.id === currentUser.id ? { ...c, status: newVal ? 'available' : 'busy' } : c)));
                        notify(`Durumunuz "${newVal ? 'Müsait' : 'Meşgul'}" olarak güncellendi.`);
                      } catch (e) { notify(e.message, 'error'); }
                    }}
                  >
                    Durumu Değiştir
                  </button>
                </div>
                <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 10, marginTop: 15 }}>
                  <h4>📊 Bugünkü İstatistikler</h4>
                  <p>
                    ✅ Teslim Edilen: <span id="todayDelivered">{orders.filter((o) => o.status === 'delivered' && o.assignedCourier === currentUser.id).length}</span>
                  </p>
                  <p>
                    💰 Kazanılan: <span id="todayEarned">{orders.filter((o) => o.status === 'delivered' && o.assignedCourier === currentUser.id).reduce((s, o) => s + estimateEarning(o.distance), 0)}</span> ₺
                  </p>
                  <p>
                    📏 Kat Edilen Mesafe: <span id="todayDistance">{orders.filter((o) => o.status === 'delivered' && o.assignedCourier === currentUser.id).reduce((s, o) => s + o.distance, 0)}</span> km
                  </p>
                </div>
              </div>
            </div>

            <div className="courier-panel">
              <div className="panel-header">
                <h2>📋 Siparişler</h2>
              </div>
              <div className="panel-content">
                <div id="courierOrders">
                  {orders.filter((o) => o.status !== 'delivered').length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: 20 }}>
                      Henüz sipariş yok. Durumunuzu "Müsait" yapın ve siparişler gelmeye başlasın!
                    </p>
                  ) : (
                    orders
                      .filter((o) => o.status !== 'delivered')
                      .map((o) => (
                        <div key={o._id || o.id} className="order-item">
                          <div className="order-header">
                            <div className="order-id">Sipariş #{String((o._id || o.id) || '').slice(-3)}</div>
                            <span className={`priority-badge priority-${o.priority || 'normal'}`}>{(o.priority || 'normal').toUpperCase()}</span>
                          </div>
                          <div className="order-details">
                            <div>
                              <strong>Müşteri:</strong> {o.customerName || '-'}
                            </div>
                            <div>
                              <strong>Telefon:</strong> {o.customerPhone || '-'}
                            </div>
                            <div>
                              <strong>Adres:</strong> {o.deliveryAddress || '-'}
                            </div>
                            <div>
                              <strong>Durum:</strong> {o.status}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <a
                              className="btn btn-warning"
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.deliveryAddress || '')}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              📍 Haritalarda Aç
                            </a>
                            {o.status === 'assigned' && (
                              <button
                                className="btn btn-success"
                                onClick={async () => {
                                  try {
                                    await fetch(`${API}/orders/${o._id || o.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'picked' }) });
                                    notify('🚚 Sipariş kabul edildi! Teslimat başlatılıyor...');
                                    setOrders((os) => os.map((x) => ((x._id || x.id) === (o._id || o.id) ? { ...x, status: 'picked' } : x)));
                                    setTimeout(async () => {
                                      await fetch(`${API}/orders/${o._id || o.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'delivered' }) });
                                      setOrders((os) => os.map((x) => ((x._id || x.id) === (o._id || o.id) ? { ...x, status: 'delivered' } : x)));
                                      notify('✅ Sipariş başarıyla teslim edildi!');
                                    }, 5000);
                                  } catch (e) { notify('İşlem başarısız', 'error'); }
                                }}
                              >
                                ✅ Kabul Et
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreContent({ onCreate, couriers }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDistrict, setDeliveryDistrict] = useState('');
  const [packageDetails, setPackageDetails] = useState('');
  const [priority, setPriority] = useState('normal');

  return (
    <div className="store-content">
      <form
        id="orderForm"
        onSubmit={(e) => {
          e.preventDefault();
          if (!customerName || !customerPhone || !deliveryAddress || !deliveryDistrict || !packageDetails) return;
          onCreate({ customerName, customerPhone, deliveryAddress, deliveryDistrict, packageDetails, priority });
          setCustomerName('');
          setCustomerPhone('');
          setDeliveryAddress('');
          setDeliveryDistrict('');
          setPackageDetails('');
          setPriority('normal');
        }}
      >
        <div className="form-group">
          <label htmlFor="customerName">Müşteri Adı:</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} type="text" id="customerName" required />
        </div>
        <div className="form-group">
          <label htmlFor="customerPhone">Müşteri Telefon:</label>
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} type="tel" id="customerPhone" required />
        </div>
        <div className="form-group">
          <label htmlFor="deliveryAddress">Teslimat Adresi:</label>
          <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} id="deliveryAddress" rows={3} required />
        </div>
        <div className="form-group">
          <label htmlFor="deliveryDistrict">Teslimat Semti:</label>
          <select id="deliveryDistrict" value={deliveryDistrict} onChange={(e) => setDeliveryDistrict(e.target.value)} required>
            <option value="">Semt seçin...</option>
            <option value="Konyaaltı">Konyaaltı</option>
            <option value="Lara">Lara</option>
            <option value="Muratpaşa">Muratpaşa</option>
            <option value="Kepez">Kepez</option>
            <option value="Aksu">Aksu</option>
            <option value="Döşemealtı">Döşemealtı</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="packageDetails">Paket Detayları:</label>
          <textarea value={packageDetails} onChange={(e) => setPackageDetails(e.target.value)} id="packageDetails" rows={2} required />
          </div>
        <div className="form-group">
          <label htmlFor="priority">Öncelik:</label>
          <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="normal">Normal (2-3 saat)</option>
            <option value="urgent">Acil (1 saat)</option>
            <option value="express">Ekspres (30 dakika)</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">
          📦 Sipariş Oluştur
        </button>
      </form>

      <div style={{ marginTop: 30 }}>
        <h3>🏍️ Müsait Kuryeler</h3>
        <div id="availableCouriers">
          {couriers.map((c) => (
            <div key={c.id} className="courier-card" style={{ background: '#f8f9fa', border: '2px solid #e9ecef' }}>
              <div className="courier-status status-available" style={{ marginBottom: 8 }}>Müsait</div>
              <div className="courier-info" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12 }}>
                <div className="courier-details">
                  <h3 style={{ marginBottom: 8 }}>{c.name}</h3>
                  <p>
                    <strong>📍 Yakınlık:</strong> ~{c.distance} km
                  </p>
                  <p>
                    <strong>📱 Telefon:</strong> {c.phone}
                  </p>
                </div>
                <div className="distance-badge">Müsait</div>
              </div>
          </div>
          ))}
          {couriers.length === 0 && <div style={{ color: '#666' }}>Şu anda listelenecek kurye yok</div>}
        </div>
      </div>
    </div>
  );
}

function estimateEarning(distanceKm) {
  const base = 40;
  const perKm = 5;
  return Math.round(base + distanceKm * perKm);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  function toRad(v) { return (v * Math.PI) / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}