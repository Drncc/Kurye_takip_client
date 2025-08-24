import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet marker icon fix - CDN yerine local assets kullan
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API = 'https://kurye-takip-backend.onrender.com/api';

// Alanya semtleri - sadece ana semtler
const ALANYA_DISTRICTS = [
  'Mahmutlar',
  'Kleopatra', 
  'Oba',
  'Tosmur',
  'Kestel',
  'Gullerpinari',
  'Hacet',
  'Kale'
];

export default function App() {
  const [screen, setScreen] = useState('login');
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);

  // Session persistence - sayfa yenilendiğinde kullanıcı bilgilerini geri yükle
  useEffect(() => {
    const savedToken = localStorage.getItem('deliveryPro_token');
    const savedRole = localStorage.getItem('deliveryPro_role');
    const savedUser = localStorage.getItem('deliveryPro_user');
    const savedProfile = localStorage.getItem('deliveryPro_profile');

    if (savedToken && savedRole && savedUser && savedProfile) {
      try {
        setToken(savedToken);
        setRole(savedRole);
        setCurrentUser(JSON.parse(savedUser));
        setProfile(JSON.parse(savedProfile));
        setScreen('app');
      } catch (error) {
        console.error('Session restore error:', error);
        // Hatalı session'ı temizle
        localStorage.removeItem('deliveryPro_token');
        localStorage.removeItem('deliveryPro_role');
        localStorage.removeItem('deliveryPro_user');
        localStorage.removeItem('deliveryPro_profile');
      }
    }
  }, []);

  const showNotification = (text, type) => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAuthenticated = (r, tok, serverProfile, uiUser) => {
    // Session'ı localStorage'a kaydet
    localStorage.setItem('deliveryPro_token', tok);
    localStorage.setItem('deliveryPro_role', r);
    localStorage.setItem('deliveryPro_user', JSON.stringify(uiUser));
    localStorage.setItem('deliveryPro_profile', JSON.stringify(serverProfile));
    
            setRole(r);
            setToken(tok);
            setProfile(serverProfile);
            setCurrentUser(uiUser);
            setScreen('app');
  };

  const handleLogout = () => {
    // Session'ı temizle
    localStorage.removeItem('deliveryPro_token');
    localStorage.removeItem('deliveryPro_role');
    localStorage.removeItem('deliveryPro_user');
    localStorage.removeItem('deliveryPro_profile');
    
    setScreen('login');
    setRole(null);
    setCurrentUser(null);
    setToken(null);
    setProfile(null);
  };

  const goToAdmin = () => {
    setScreen('admin');
  };

  return (
    <div>
      {screen === 'login' && (
        <LoginScreen
          onAuthenticated={handleAuthenticated}
          onAdminAccess={goToAdmin}
          notify={showNotification}
        />
      )}
      {screen === 'admin' && (
        <AdminPanel
          onLogout={handleLogout}
          notify={showNotification}
        />
      )}
      {screen === 'app' && role && (
        <MainApp
          role={role}
          currentUser={currentUser}
          token={token}
          profile={profile}
          onLogout={handleLogout}
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

function LoginScreen({ onAuthenticated, onAdminAccess, notify }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const storeNameRef = useRef(null);
  const storeAddressRef = useRef(null);
  const storeDistrictRef = useRef(null);
  const storeEmailRef = useRef(null);
  const storePasswordRef = useRef(null);
  const courierNameRef = useRef(null);
  const courierPhoneRef = useRef(null);
  const courierEmailRef = useRef(null);
  const courierPasswordRef = useRef(null);
  const courierAddressRef = useRef(null);
  const courierDistrictRef = useRef(null);

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

        {/* Admin Panel Erişimi */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            className="admin-access-btn"
            onClick={onAdminAccess}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔐 Yönetici Paneli
          </button>
          </div>

        {selectedRole && (
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${isLoginMode ? 'active' : ''}`}
              onClick={() => setIsLoginMode(true)}
            >
              🔑 Giriş Yap
            </button>
            <button 
              className={`mode-btn ${!isLoginMode ? 'active' : ''}`}
              onClick={() => setIsLoginMode(false)}
            >
              📝 Kayıt Ol
            </button>
          </div>
        )}

        {selectedRole === 'store' && (
          <div id="storeLogin" className="login-form active">
          <div className="form-group">
            <label htmlFor="storeEmail">E-posta:</label>
            <input type="email" id="storeEmail" placeholder="ornek@site.com" ref={storeEmailRef} />
          </div>
          <div className="form-group">
            <label htmlFor="storePassword">Şifre:</label>
            <input type="password" id="storePassword" placeholder="••••••••" ref={storePasswordRef} />
          </div>
            
            {!isLoginMode && (
              <>
                <div className="form-group">
                  <label htmlFor="storeName">Dükkan Adı:</label>
                  <input type="text" id="storeName" placeholder="Örn: Mehmet Market" ref={storeNameRef} />
                </div>
                <div className="form-group">
                  <label htmlFor="storeDistrict">Semt:</label>
                  <select id="storeDistrict" ref={storeDistrictRef}>
                    <option value="">Semt seçin...</option>
                    {ALANYA_DISTRICTS.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="storeAddress">Detaylı Adres:</label>
                  <input type="text" id="storeAddress" placeholder="Mahalle, sokak, bina no..." ref={storeAddressRef} />
                </div>
              </>
            )}

            <button
              className="btn-primary"
              onClick={async () => {
                const email = (storeEmailRef.current?.value || '').trim();
                const password = (storePasswordRef.current?.value || '').trim();
                
                if (!email) return notify('E-posta zorunludur', 'error');
                if (!password) return notify('Şifre zorunludur', 'error');
                
                if (isLoginMode) {
                  // Giriş
                  try {
                    const r = await fetch(`${API}/auth/login/shop`, { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' }, 
                      body: JSON.stringify({ email, password }) 
                    });
                    const d = await r.json(); 
                    if (!r.ok) throw new Error(d.error || 'Giriş başarısız');
                    
                  const token = d.token;
                  const meRes = await fetch(`${API}/shops/me`, { headers: { Authorization: `Bearer ${token}` } });
                  const me = await meRes.json();
                  
                  if (!me.me) {
                    throw new Error('Dükkan bilgileri alınamadı');
                  }
                  
                  const uiUser = { name: me.me.name, address: me.me.addressText, type: 'store' };
                  onAuthenticated('store', token, me.me, uiUser);
                    notify(`Hoş geldiniz ${me.me.name}!`);
                  } catch (e) { 
                    notify(e.message, 'error'); 
                  }
                } else {
                  // Kayıt
                  const name = (storeNameRef.current?.value || '').trim();
                  const district = (storeDistrictRef.current?.value || '').trim();
                  const addressText = (storeAddressRef.current?.value || '').trim();
                  
                  if (!name) return notify('Dükkan adı zorunludur', 'error');
                  if (!district) return notify('Semt seçimi zorunludur', 'error');
                  if (!addressText) return notify('Adres zorunludur', 'error');
                  
                  const fullAddress = `${addressText}, ${district}`;
                  
                  try {
                    const r = await fetch(`${API}/auth/register/shop`, { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' }, 
                      body: JSON.stringify({ name, email, password, addressText: fullAddress, district }) 
                    });
                    const d = await r.json(); 
                    if (!r.ok) throw new Error(d.error || 'Kayıt başarısız');
                    
                  const token = d.token;
                  const meRes = await fetch(`${API}/shops/me`, { headers: { Authorization: `Bearer ${token}` } });
                  const me = await meRes.json();
                  
                  if (!me.me) {
                    throw new Error('Dükkan bilgileri alınamadı');
                  }
                  
                  const uiUser = { name: me.me.name, address: me.me.addressText, type: 'store' };
                  onAuthenticated('store', token, me.me, uiUser);
                    notify(`Hoş geldiniz ${me.me.name}! Sipariş oluşturmaya başlayabilirsiniz.`);
                  } catch (e) { 
                    notify(e.message, 'error'); 
                  }
                }
              }}
            >
              {isLoginMode ? '🔑 Giriş Yap' : '📝 Kayıt Ol'}
            </button>
          </div>
        )}

        {selectedRole === 'courier' && (
          <div id="courierLogin" className="login-form active">
            <div className="form-group">
              <label htmlFor="courierEmail">E-posta:</label>
              <input type="email" id="courierEmail" placeholder="ornek@site.com" ref={courierEmailRef} />
            </div>
            <div className="form-group">
              <label htmlFor="courierPassword">Şifre:</label>
              <input type="password" id="courierPassword" placeholder="••••••••" ref={courierPasswordRef} />
        </div>

            {!isLoginMode && (
              <>
          <div className="form-group">
            <label htmlFor="courierName">Kurye Adı:</label>
            <input type="text" id="courierName" placeholder="Adınız Soyadınız" ref={courierNameRef} />
          </div>
          <div className="form-group">
                  <label htmlFor="courierPhone">Telefon:</label>
            <input type="tel" id="courierPhone" placeholder="05xx xxx xx xx" ref={courierPhoneRef} />
          </div>
               </>
            )}

            <button
              className="btn-primary"
              onClick={async () => {
                const email = (courierEmailRef.current?.value || '').trim();
                const password = (courierPasswordRef.current?.value || '').trim();
                
                if (!email) return notify('E-posta zorunludur', 'error');
                if (!password) return notify('Şifre zorunludur', 'error');
                
                if (isLoginMode) {
                  // Giriş
                  try {
                    const r = await fetch(`${API}/auth/login/courier`, { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' }, 
                      body: JSON.stringify({ email, password }) 
                    });
                    const d = await r.json(); 
                    if (!r.ok) throw new Error(d.error || 'Giriş başarısız');
                    
                  const token = d.token;
                  const meRes = await fetch(`${API}/couriers/me`, { headers: { Authorization: `Bearer ${token}` } });
                  const me = await meRes.json();
                    
                  if (!me.me) {
                    throw new Error('Kurye bilgileri alınamadı');
                  }
                    
                  // GPS izni varsa konumu gönder ve aktif yap
                  try {
                    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition((p) => res(p), () => res(null), { enableHighAccuracy: true, timeout: 5000 }));
                    if (pos) {
                        await fetch(`${API}/couriers/location`, { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                          body: JSON.stringify({ coords: { lng: pos.coords.longitude, lat: pos.coords.latitude } }) 
                        });
                    }
                  } catch {}
                    
                                         await fetch(`${API}/couriers/status`, { 
                       method: 'POST', 
                       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                       body: JSON.stringify({ active: true }) 
                     });
                     
                     const uiUser = { id: me.me._id, name: me.me.name, phone: me.me.phone || '-', location: 'GPS ile takip ediliyor', status: 'available' };
                     onAuthenticated('courier', token, me.me, uiUser);
                     notify(`Hoş geldiniz ${me.me.name}! Sistem aktif, siparişler gelmeye başlayabilir.`);
                 } catch (e) { notify(e.message, 'error'); }
                } else {
                  // Kayıt
                  const name = (courierNameRef.current?.value || '').trim();
                  const phone = (courierPhoneRef.current?.value || '').trim();
                  
                  if (!name) return notify('İsim zorunludur', 'error');
                  if (!phone) return notify('Telefon zorunludur', 'error');
                  
                  try {
                    const r = await fetch(`${API}/auth/register/courier`, { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' }, 
                      body: JSON.stringify({ name, email, password, phone }) 
                    });
                    const d = await r.json(); 
                    if (!r.ok) throw new Error(d.error || 'Kayıt başarısız');
                    
                    const token = d.token;
                    const meRes = await fetch(`${API}/couriers/me`, { headers: { Authorization: `Bearer ${token}` } });
                    const me = await meRes.json();
                    
                    // GPS izni varsa konumu gönder ve aktif yap
                    try {
                      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition((p) => res(p), () => res(null), { enableHighAccuracy: true, timeout: 5000 }));
                      if (pos) {
                        await fetch(`${API}/couriers/location`, { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                          body: JSON.stringify({ coords: { lng: pos.coords.longitude, lat: pos.coords.latitude } }) 
                        });
                      }
                    } catch {}
                    
                    await fetch(`${API}/couriers/status`, { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                      body: JSON.stringify({ active: true }) 
                    });
                    
                    const uiUser = { id: me.me._id, name: me.me.name, phone, location: 'GPS ile takip ediliyor', status: 'available' };
                    onAuthenticated('courier', token, me.me, uiUser);
                    notify(`Hoş geldiniz ${me.me.name}! Sistem aktif, siparişler gelmeye başlayabilir.`);
                  } catch (e) { notify(e.message, 'error'); }
                }
              }}
            >
              {isLoginMode ? '🔑 Giriş Yap' : '📝 Kayıt Ol'}
            </button>
          </div>
        )}
        </div>
      </div>
    );
  }

function AdminPanel({ onLogout, notify }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [couriers, setCouriers] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);

  const ADMIN_PASSWORD = 'admin123'; // Bu şifreyi değiştirin

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      notify('🔐 Yönetici paneline hoş geldiniz!', 'success');
      fetchData();
    } else {
      notify('❌ Yanlış şifre!', 'error');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Kuryeleri getir
      const courierRes = await fetch('https://kurye-takip-backend.onrender.com/api/couriers/all');
      const courierData = await courierRes.json();
      if (courierRes.ok) setCouriers(courierData.couriers || []);

      // Dükkanları getir
              const shopRes = await fetch('https://kurye-takip-backend.onrender.com/api/shops/all');
      const shopData = await shopRes.json();
      if (shopRes.ok) setShops(shopData.shops || []);
    } catch (error) {
      notify('Veri yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCourier = async (id) => {
    if (!confirm('Bu kuryeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
              const res = await fetch(`https://kurye-takip-backend.onrender.com/api/couriers/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        notify('✅ Kurye silindi', 'success');
        setCouriers(couriers.filter(c => c._id !== id));
      } else {
        notify('❌ Kurye silinemedi', 'error');
      }
    } catch (error) {
      notify('Silme işlemi başarısız', 'error');
    }
  };

  const deleteShop = async (id) => {
    if (!confirm('Bu dükkanı silmek istediğinizden emin misiniz?')) return;
    
    try {
              const res = await fetch(`https://kurye-takip-backend.onrender.com/api/shops/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        notify('✅ Dükkan silindi', 'success');
        setShops(shops.filter(s => s._id !== id));
      } else {
        notify('❌ Dükkan silinemedi', 'error');
      }
    } catch (error) {
      notify('Silme işlemi başarısız', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h1>🔐 Yönetici Paneli</h1>
          <p>Erişim için şifre girin</p>
          <div className="admin-form">
            <input
              type="password"
              placeholder="Yönetici şifresi"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <button onClick={handleAdminLogin} className="btn-primary">
              🔑 Giriş Yap
            </button>
          </div>
          <button onClick={onLogout} className="btn-secondary">
            ← Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🔐 Yönetici Paneli</h1>
        <div className="admin-actions">
          <button onClick={fetchData} className="btn btn-secondary">
            🔄 Yenile
          </button>
          <button onClick={onLogout} className="btn btn-danger">
            Çıkış
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Yükleniyor...</p>
          </div>
        </div>
      )}

      <div className="admin-content">
        {/* Kurye Yönetimi */}
        <div className="admin-section">
          <h2>🏍️ Kurye Yönetimi ({couriers.length})</h2>
          <div className="admin-grid">
            {couriers.map(courier => (
              <div key={courier._id} className="admin-card">
                <div className="admin-card-header">
                  <h3>{courier.name}</h3>
                  <span className={`status-badge ${courier.active ? 'status-available' : 'status-busy'}`}>
                    {courier.active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="admin-card-content">
                  <p><strong>E-posta:</strong> {courier.email}</p>
                  <p><strong>Telefon:</strong> {courier.phone || '-'}</p>
                  <p><strong>Semt:</strong> {courier.district}</p>
                  <p><strong>Adres:</strong> {courier.addressText}</p>
                  <p><strong>Kayıt:</strong> {new Date(courier.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="admin-card-actions">
                  <button
                    onClick={() => deleteCourier(courier._id)}
                    className="btn btn-danger"
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dükkan Yönetimi */}
        <div className="admin-section">
          <h2>🏪 Dükkan Yönetimi ({shops.length})</h2>
          <div className="admin-grid">
            {shops.map(shop => (
              <div key={shop._id} className="admin-card">
                <div className="admin-card-header">
                  <h3>{shop.name}</h3>
                </div>
                <div className="admin-card-content">
                  <p><strong>E-posta:</strong> {shop.email}</p>
                  <p><strong>Semt:</strong> {shop.district}</p>
                  <p><strong>Adres:</strong> {shop.addressText}</p>
                  <p><strong>Kayıt:</strong> {new Date(shop.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="admin-card-actions">
                  <button
                    onClick={() => deleteShop(shop._id)}
                    className="btn btn-danger"
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp({ role, currentUser, token, profile, onLogout, notify }) {
  const [couriers, setCouriers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTime, setActiveTime] = useState(0);
  const [isCourierActive, setIsCourierActive] = useState(false);
  const [nearbyCouriers, setNearbyCouriers] = useState([]);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([36.5441, 31.9957]); // Alanya merkez
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Kurye durumunu initialize et
  useEffect(() => {
    if (role === 'courier' && currentUser) {
      setIsCourierActive(currentUser.status === 'available');
      // Kurye aktifse otomatik olarak müsait yap
      if (currentUser.status === 'available') {
        setIsCourierActive(true);
      }
    }
  }, [role, currentUser]);

  // GPS izni kontrolü ve konum alma
  const requestLocationPermission = useCallback(async () => {
    try {
      setLocationPermission('requesting');
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (error) => reject(error),
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 60000 
          }
        );
      });
      
      const coords = [position.coords.longitude, position.coords.latitude];
      setUserLocation(coords);
      setLocationPermission('granted');
      
      // Konumu server'a gönder
      if (role === 'courier' && token) {
        await updateLocationOnServer(coords);
        // İlk konum gönderildikten sonra sürekli güncelleme başlar
      }
      
      notify('📍 GPS konumu başarıyla alındı!', 'success');
      return coords;
    } catch (error) {
      console.error('GPS konum hatası:', error);
      let errorMessage = 'Konum bilgisi alınamadı';
      
      if (error.code === 1) {
        errorMessage = '📍 GPS izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini verin.';
        setLocationPermission('denied');
      } else if (error.code === 2) {
        errorMessage = '📍 Konum bilgisi bulunamadı. Lütfen GPS\'i açın.';
        setLocationPermission('unavailable');
      } else if (error.code === 3) {
        errorMessage = '📍 Konum alımı zaman aşımına uğradı. Lütfen tekrar deneyin.';
        setLocationPermission('timeout');
      }
      
      notify(errorMessage, 'error');
      setLocationPermission('error');
      return null;
    }
  }, [role, token]);

  // Server'a konum gönderme
  const updateLocationOnServer = useCallback(async (coords) => {
    try {
      await fetch(`${API}/couriers/location`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ coords: { lng: coords[0], lat: coords[1] } }) 
      });
    } catch (error) {
      console.log('Server konum güncelleme hatası:', error);
    }
  }, [token]);

  // Sürekli konum güncelleme (her 10 saniyede bir)
  useEffect(() => {
    if (role !== 'courier' || !token || !userLocation) return;
    
    const locationUpdateInterval = setInterval(() => {
      updateLocationOnServer(userLocation);
    }, 10000); // 10 saniyede bir

    return () => clearInterval(locationUpdateInterval);
  }, [role, token, userLocation, updateLocationOnServer]);

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

  // Fetch courier orders periodically
  useEffect(() => {
    if (role !== 'courier' || !token) return;
    const fetchOrders = async () => {
      try {
        const r = await fetch(`${API}/orders/mine`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok) {
          setOrders(d.orders || []);
          setError(null);
        } else {
          setError(d.error || 'Siparişler alınamadı');
        }
      } catch (error) {
        setError('Siparişler yüklenirken hata oluştu');
        console.error('Sipariş fetch hatası:', error);
      }
    };
    fetchOrders();
    const i = setInterval(fetchOrders, 3000); // 3 saniyede bir güncelle - daha hızlı
    return () => clearInterval(i);
  }, [role, token]);

  // Fetch store orders periodically
  useEffect(() => {
    if (role !== 'store' || !token) return;
    const fetchStoreOrders = async () => {
      try {
        const r = await fetch(`${API}/orders/store`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok) {
          setOrders(d.orders || []);
          setError(null);
        } else {
          setError(d.error || 'Siparişler alınamadı');
        }
      } catch (error) {
        setError('Siparişler yüklenirken hata oluştu');
        console.error('Dükkan sipariş fetch hatası:', error);
      }
    };
    fetchStoreOrders();
    const i = setInterval(fetchStoreOrders, 5000); // 5 saniyede bir güncelle - daha hızlı
    return () => clearInterval(i);
  }, [role, token]);

  // Fetch nearby couriers for store (her 5 saniyede bir - gerçek zamanlı)
  useEffect(() => {
    if (role !== 'store' || !token || !profile?.location) return;
    const fetchNearby = async () => {
      try {
        const r = await fetch(`${API}/couriers/nearby`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
          body: JSON.stringify({ pickup: profile.location }) 
        });
        const d = await r.json();
        if (r.ok) {
          const withDistance = (d.couriers || []).map((c) => {
            // Mesafe hesaplama
            let distance = null;
            if (c.location?.coordinates && profile.location?.coordinates) {
              try {
                distance = haversineKm(
                  profile.location.coordinates[1], // lat
                  profile.location.coordinates[0], // lng
                  c.location.coordinates[1],      // lat
                  c.location.coordinates[0]       // lng
                );
              } catch (error) {
                console.error('Mesafe hesaplama hatası:', error);
                distance = null;
              }
            }
            
            return {
              id: c._id,
              name: c.name,
              phone: c.phone || '-',
              location: 'GPS ile takip ediliyor',
              status: 'available',
              coordinates: c.location?.coordinates || [31.9957, 36.5441],
              distance: distance ? `${distance.toFixed(1)} km` : 'Konum bilgisi alınamadı'
            };
          });
          setNearbyCouriers(withDistance);
        }
      } catch (error) {
        console.error('Nearby couriers fetch error:', error);
      }
    };
    fetchNearby();
    const i = setInterval(fetchNearby, 5000); // 5 saniyede bir güncelle
    return () => clearInterval(i);
  }, [role, token, profile]);

  // Fetch nearby shops for courier (her 5 saniyede bir - daha sık güncelleme)
  useEffect(() => {
    if (role !== 'courier' || !token || !userLocation) return;
    const fetchNearbyShops = async () => {
      try {
        const r = await fetch(`${API}/shops/nearby`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
          body: JSON.stringify({ courierLocation: { type: 'Point', coordinates: userLocation } }) 
        });
        const d = await r.json();
        if (r.ok) {
          const withDistance = (d.shops || []).map((s) => {
            // Mesafe hesaplama
            let distance = null;
            if (s.location?.coordinates && userLocation) {
              try {
                distance = haversineKm(
                  userLocation[1], // lat
                  userLocation[0], // lng
                  s.location.coordinates[1], // lat
                  s.location.coordinates[0]  // lng
                );
              } catch (error) {
                console.error('Mesafe hesaplama hatası:', error);
                distance = null;
              }
            }
            
            return {
              id: s._id,
              name: s.name,
              address: s.addressText,
              coordinates: s.location?.coordinates || [31.9957, 36.5441],
              distance: distance ? `${distance.toFixed(1)} km` : 'Konum bilgisi alınamadı'
            };
          });
          setNearbyShops(withDistance);
        }
      } catch (error) {
        console.error('Nearby shops fetch error:', error);
      }
    };
    fetchNearbyShops();
    const i = setInterval(fetchNearbyShops, 5000); // 5 saniyede bir güncelle
    return () => clearInterval(i);
  }, [role, token, userLocation]);

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

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Yükleniyor...</p>
          </div>
        </div>
      )}

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
                  const r = await fetch(`${API}/orders`, { 
                    method: 'POST', 
                    headers: { 
                      'Content-Type': 'application/json', 
                      Authorization: `Bearer ${token}` 
                    }, 
                    body: JSON.stringify(payload) 
                  });
                  const d = await r.json();
                  if (!r.ok) throw new Error(d.error || 'Sipariş oluşturulamadı');
                  
                  // Yeni siparişi listeye ekle
                  setOrders((prevOrders) => [d.order, ...prevOrders]);
                  
                  if (d.assignedCourier) {
                    notify(`✅ Sipariş oluşturuldu. Atanan kurye: ${d.assignedCourier.name}`);
                  } else {
                    notify('✅ Sipariş oluşturuldu. Şu an atama bekliyor.');
                  }
                } catch (e) { 
                  notify(e.message, 'error'); 
                }
              }}
              couriers={nearbyCouriers}
            />
            
            <div style={{ marginTop: 30 }}>
              {/* Harita/Liste Toggle */}
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${!showMap ? 'active' : ''}`}
                  onClick={() => setShowMap(false)}
                >
                  📋 Liste Görünümü
                </button>
                <button
                  className={`toggle-btn ${showMap ? 'active' : ''}`}
                  onClick={() => setShowMap(true)}
                >
                  🗺️ Harita Görünümü
                </button>
              </div>
              
              {showMap ? (
                <div className="map-container">
                  <MapContainer 
                    center={mapCenter} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {/* Dükkan konumu */}
                    {profile?.location?.coordinates && (
                      <Marker position={[profile.location.coordinates[1], profile.location.coordinates[0]]}>
                        <Popup>
                          <strong>🏪 {currentUser.name}</strong><br/>
                          Sizin konumunuz
                        </Popup>
                      </Marker>
                    )}
                                         {/* Müsait kuryeler - gerçek zamanlı */}
                     {nearbyCouriers.map((courier) => (
                       <Marker 
                         key={courier.id} 
                         position={[courier.coordinates[1], courier.coordinates[0]]}
                         icon={L.divIcon({
                           className: 'courier-marker',
                           html: '🏍️',
                           iconSize: [30, 30],
                           iconAnchor: [15, 15]
                         })}
                       >
                         <Popup>
                           <strong>🏍️ {courier.name}</strong><br/>
                           Mesafe: {courier.distance}<br/>
                           Durum: Müsait<br/>
                           📱 {courier.phone}
                         </Popup>
                       </Marker>
                     ))}
                     {/* Sipariş teslimat noktaları */}
                     {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map((order) => {
                       try {
                         // Sipariş adresinden koordinat hesaplama (yaklaşık)
                         const orderLat = 36.5441 + (Math.random() - 0.5) * 0.1; // Alanya merkez ± yaklaşık
                         const orderLng = 31.9957 + (Math.random() - 0.5) * 0.1;
                         return (
                           <Marker 
                             key={order._id || order.id} 
                             position={[orderLat, orderLng]}
                             icon={L.divIcon({
                               className: 'order-marker',
                               html: '📦',
                               iconSize: [25, 25],
                               iconAnchor: [12, 12]
                             })}
                           >
                             <Popup>
                               <strong>📦 Sipariş #{String((order._id || order.id) || '').slice(-3)}</strong><br/>
                               Müşteri: {order.customerName || '-'}<br/>
                               Adres: {order.deliveryAddress || '-'}<br/>
                               Durum: {order.status === 'pending' ? '⏳ Bekliyor' : 
                                      order.status === 'assigned' ? '🏍️ Kuryeye Atandı' : 
                                      order.status === 'picked' ? '🚚 Paket Alındı' : 'Bilinmiyor'}
                             </Popup>
                           </Marker>
                         );
                       } catch (error) {
                         return null;
                       }
                     })}
                   </MapContainer>
                                     <div className="map-info">
                     <p>📍 Müsait kuryelerin konumları her 5 saniyede bir güncellenir</p>
                     <p>🏍️ Kurye ikonlarına tıklayarak detayları görün</p>
                     <p>📦 Sipariş teslimat noktaları haritada gösterilir</p>
                   </div>
                </div>
              ) : (
                <div id="availableCouriers">
                  {nearbyCouriers.map((c) => (
                    <div key={c.id} className="courier-card">
                      <div className="courier-status status-available">Müsait</div>
                      <div className="courier-info">
                        <div className="courier-details">
                          <h3>{c.name}</h3>
                          <p>
                            <strong>📍 Yakınlık:</strong> ~{c.distance} km
                          </p>
                          <p>
                            <strong>📱 Telefon:</strong> {c.phone}
                          </p>
                        </div>
                        <div className="distance-badge">{c.distance} km</div>
                      </div>
                    </div>
                  ))}
                  {nearbyCouriers.length === 0 && <div style={{ color: '#666' }}>Şu anda listelenecek kurye yok</div>}
                </div>
              )}
            </div>

            {/* Dükkan Sipariş Geçmişi */}
            <div style={{ marginTop: 30 }}>
              <div className="panel-header">
                <h3>📋 Sipariş Geçmişi</h3>
                <p>Tüm siparişlerinizi takip edin</p>
              </div>
              <div className="panel-content">
                <div id="storeOrders">
                  {orders.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: 20 }}>
                      Henüz sipariş yok. Yukarıdan yeni sipariş oluşturmaya başlayın!
                    </p>
                  ) : (
                    orders.map((o) => (
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
                            <strong>Paket:</strong> {o.packageDetails || '-'}
                          </div>
                          <div>
                            <strong>Durum:</strong> 
                            <span className={`status-badge status-${o.status}`}>
                              {o.status === 'pending' && '⏳ Bekliyor'}
                              {o.status === 'assigned' && '🏍️ Kuryeye Atandı'}
                              {o.status === 'picked' && '🚚 Paket Alındı'}
                              {o.status === 'delivered' && '✅ Teslim Edildi'}
                              {o.status === 'cancelled' && '❌ İptal Edildi'}
                            </span>
                          </div>
                          {o.assignedCourier && (
                            <div>
                              <strong>Kurye:</strong> {o.assignedCourier.name} ({o.assignedCourier.phone || '-'})
                            </div>
                          )}
                                                     <div>
                             <strong>Oluşturulma:</strong> {new Date(o.createdAt || Date.now()).toLocaleString('tr-TR')}
                           </div>
                           {/* Mesafe Bilgileri */}
                           {o.store && o.store.location && o.deliveryAddress && (
                             <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                               <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>📍 Mesafe Bilgileri</h4>
                               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.9rem' }}>
                                 <div>
                                   <strong>🏪 Dükkana uzaklık:</strong> 
                                   {(() => {
                                     try {
                                       // Sipariş adresinden koordinat hesaplama (yaklaşık)
                                       const orderLat = 36.5441 + (Math.random() - 0.5) * 0.1; // Alanya merkez ± yaklaşık
                                       const orderLng = 31.9957 + (Math.random() - 0.5) * 0.1;
                                       const distance = haversineKm(
                                         o.store.location.coordinates[1], // lat
                                         o.store.location.coordinates[0], // lng
                                         orderLat,
                                         orderLng
                                       );
                                       return ` ~${distance.toFixed(1)} km`;
                                     } catch (error) {
                                       return ' Hesaplanamadı';
                                     }
                                   })()}
                                 </div>
                                 <div>
                                   <strong>📦 Teslimat mesafesi:</strong> 
                                   {(() => {
                                     try {
                                       // Sipariş adresinden koordinat hesaplama (yaklaşık)
                                       const orderLat = 36.5441 + (Math.random() - 0.5) * 0.1; // Alanya merkez ± yaklaşık
                                       const orderLng = 31.9957 + (Math.random() - 0.5) * 0.1;
                                       const distance = haversineKm(
                                         o.store.location.coordinates[1], // lat
                                         o.store.location.coordinates[0], // lng
                                         orderLat,
                                         orderLng
                                       );
                                       return ` ~${distance.toFixed(1)} km`;
                                     } catch (error) {
                                       return ' Hesaplanamadı';
                                     }
                                   })()}
                                 </div>
                               </div>
                             </div>
                           )}
                         </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <a
                            className="btn btn-warning"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.deliveryAddress || '')}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            📍 Haritalarda Aç
                          </a>
                          {o.status === 'pending' && (
                            <button
                              className="btn btn-danger"
                              onClick={async () => {
                                try {
                                  await fetch(`${API}/orders/${o._id || o.id}/status`, { 
                                    method: 'POST', 
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                                    body: JSON.stringify({ status: 'cancelled' }) 
                                  });
                                  setOrders((os) => os.map((x) => ((x._id || x.id) === (o._id || o.id) ? { ...x, status: 'cancelled' } : x)));
                                  notify('❌ Sipariş iptal edildi.');
                                } catch (e) { notify('İşlem başarısız', 'error'); }
                              }}
                            >
                              ❌ İptal Et
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

      

      {role === 'courier' && (
        <div id="courierInterface" style={{ display: 'block' }}>
          <div className="courier-interface">
            <div className="courier-panel">
              <div className="panel-header">
                <h2>📍 Durumum & GPS</h2>
              </div>
              <div className="panel-content">
                {/* GPS İzin Kartı */}
                {role === 'courier' && locationPermission !== 'granted' && (
                  <div className="gps-permission-card">
                    <h3>📍 GPS Konum İzni Gerekli</h3>
                    <p>
                      {locationPermission === 'denied' && 'GPS izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini verin.'}
                      {locationPermission === 'unavailable' && 'GPS konumu bulunamadı. Lütfen GPS\'i açın.'}
                      {locationPermission === 'timeout' && 'Konum alımı zaman aşımına uğradı. Lütfen tekrar deneyin.'}
                      {locationPermission === 'error' && 'Konum bilgisi alınamadı. Lütfen GPS iznini verin.'}
                      {locationPermission === 'prompt' && 'Kurye olarak çalışmak için GPS konum izni gereklidir.'}
                    </p>
                    <button 
                      className="btn btn-primary"
                      onClick={requestLocationPermission}
                      disabled={locationPermission === 'requesting'}
                    >
                      {locationPermission === 'requesting' ? '📍 Konum Alınıyor...' : '📍 GPS İzni Ver'}
                    </button>
                  </div>
                )}
                
                {locationPermission === 'granted' && userLocation && (
                  <div className="gps-status-card success">
                    <div className="gps-icon">✅</div>
                    <div className="gps-info">
                      <h3>GPS Aktif</h3>
                      <p>Konumunuz gerçek zamanlı takip ediliyor</p>
                      <small>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</small>
                    </div>
                  </div>
                )}

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
                        <strong>🕐 Aktif Süre:</strong> <span id="activeTime">{activeTime} dakika</span>
                      </p>
                      {locationPermission === 'granted' && (
                        <p style={{ fontSize: '0.9rem', color: '#28a745', fontStyle: 'italic' }}>
                          📍 GPS aktif - Konumunuz her 5 saniyede bir güncelleniyor
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    id="statusToggle"
                    className={`btn ${isCourierActive ? 'btn-warning' : 'btn-success'}`}
                    onClick={async () => {
                      try {
                        const newVal = !isCourierActive;
                        const r = await fetch(`${API}/couriers/status`, { 
                          method: 'POST', 
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                          body: JSON.stringify({ active: newVal }) 
                        });
                        if (!r.ok) throw new Error('Durum güncellenemedi');
                        setIsCourierActive(newVal);
                        
                                                 // Durum güncellendikten sonra siparişleri yeniden fetch et
                         if (newVal) {
                           // Hemen siparişleri fetch et
                           const ordersRes = await fetch(`${API}/orders/mine`, { 
                             headers: { Authorization: `Bearer ${token}` } 
                           });
                           if (ordersRes.ok) {
                             const ordersData = await ordersRes.json();
                             setOrders(ordersData.orders || []);
                             notify('🔄 Siparişler yenilendi!', 'success');
                           }
                         } else {
                           // Meşgul yapıldığında siparişleri temizle
                           setOrders([]);
                         }
                        
                        notify(`Durumunuz "${newVal ? 'Müsait' : 'Meşgul'}" olarak güncellendi.`);
                      } catch (e) { 
                        notify(e.message, 'error'); 
                      }
                    }}
                  >
                    {isCourierActive ? 'Meşgul Yap' : 'Müsait Yap'}
                  </button>
                </div>
              </div>
            </div>

                         <div className="courier-panel">
               <div className="panel-header">
                 <h2>🏪 Yakın Dükkanlar</h2>
               </div>
               <div className="panel-content">
                 <div id="nearbyShops">
                   {nearbyShops.map((shop) => (
                     <div key={shop.id} className="shop-card">
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12 }}>
                         <div>
                           <h3 style={{ marginBottom: 8 }}>{shop.name}</h3>
                           <p>
                             <strong>📍 Kuryenin dükkana uzaklığı:</strong> ~{shop.distance} km
                           </p>
                           <p>
                             <strong>🏠 Adres:</strong> {shop.address}
                           </p>
                         </div>
                         <div className="distance-badge">{shop.distance} km</div>
                       </div>
                     </div>
                   ))}
                   {nearbyShops.length === 0 && <div style={{ color: '#666' }}>Şu anda listelenecek dükkan yok</div>}
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
                               <strong>Durum:</strong> 
                               <span className={`status-badge status-${o.status}`}>
                                 {o.status === 'assigned' && '📋 Atandı'}
                                 {o.status === 'picked' && '🚚 Paket Alındı'}
                                 {o.status === 'delivered' && '✅ Teslim Edildi'}
                                 {o.status === 'pending' && '⏳ Bekliyor'}
                               </span>
                             </div>
                             {/* Mesafe Bilgileri */}
                             {o.store && o.store.location && userLocation && (
                               <div style={{ marginTop: 10, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                                 <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>📍 Mesafe Bilgileri</h4>
                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.9rem' }}>
                                   <div>
                                     <strong>🏪 Dükkana uzaklık:</strong> 
                                     {(() => {
                                       try {
                                         const distance = haversineKm(
                                           userLocation[1], // lat
                                           userLocation[0], // lng
                                           o.store.location.coordinates[1], // lat
                                           o.store.location.coordinates[0]  // lng
                                         );
                                         return ` ~${distance.toFixed(1)} km`;
                                       } catch (error) {
                                         return ' Hesaplanamadı';
                                       }
                                     })()}
                                   </div>
                                   <div>
                                     <strong>📦 Siparişe uzaklık:</strong> 
                                     {(() => {
                                       try {
                                         // Sipariş adresinden koordinat hesaplama (yaklaşık)
                                         const orderLat = 36.5441 + (Math.random() - 0.5) * 0.1; // Alanya merkez ± yaklaşık
                                         const orderLng = 31.9957 + (Math.random() - 0.5) * 0.1;
                                         const distance = haversineKm(
                                           userLocation[1], // lat
                                           userLocation[0], // lng
                                           orderLat,
                                           orderLng
                                         );
                                         return ` ~${distance.toFixed(1)} km`;
                                       } catch (error) {
                                         return ' Hesaplanamadı';
                                       }
                                     })()}
                                   </div>
                                 </div>
                               </div>
                             )}
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
                                    await fetch(`${API}/orders/${o._id || o.id}/status`, { 
                                      method: 'POST', 
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                                      body: JSON.stringify({ status: 'picked' }) 
                                    });
                                    notify('🚚 Sipariş kabul edildi! Paket alındı, teslimat başlatılıyor...');
                                    setOrders((os) => os.map((x) => ((x._id || x.id) === (o._id || o.id) ? { ...x, status: 'picked' } : x)));
                                  } catch (e) { notify('İşlem başarısız', 'error'); }
                                }}
                              >
                                ✅ Paket Alındı
                              </button>
                            )}
                            
                            {o.status === 'picked' && (
                              <button
                                className="btn btn-primary"
                                onClick={async () => {
                                  try {
                                    await fetch(`${API}/orders/${o._id || o.id}/status`, { 
                                      method: 'POST', 
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                                      body: JSON.stringify({ status: 'delivered' }) 
                                    });
                                      setOrders((os) => os.map((x) => ((x._id || x.id) === (o._id || o.id) ? { ...x, status: 'delivered' } : x)));
                                      notify('✅ Sipariş başarıyla teslim edildi!');
                                  } catch (e) { notify('İşlem başarısız', 'error'); }
                                }}
                              >
                                🎯 Teslim Edildi
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
          const fullDeliveryAddress = `${deliveryAddress}, ${deliveryDistrict}`;
          onCreate({ customerName, customerPhone, deliveryAddress: fullDeliveryAddress, deliveryDistrict, packageDetails, priority });
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
          <label htmlFor="deliveryDistrict">Teslimat Semti:</label>
          <select id="deliveryDistrict" value={deliveryDistrict} onChange={(e) => setDeliveryDistrict(e.target.value)} required>
            <option value="">Semt seçin...</option>
            {ALANYA_DISTRICTS.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="deliveryAddress">Detaylı Teslimat Adresi:</label>
          <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} id="deliveryAddress" rows={3} placeholder="Mahalle, sokak, bina no, kat..." required />
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
    </div>
  );
}

function haversineKm(lat1, lon1, lat2, lon2) {
  function toRad(v) { return (v * Math.PI) / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}