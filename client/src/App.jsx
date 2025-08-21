import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API = 'http://localhost:4000/api';

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
                <div className="form-group">
                  <label htmlFor="courierDistrict">Semt:</label>
                  <select id="courierDistrict" ref={courierDistrictRef}>
                    <option value="">Semt seçin...</option>
                    {ALANYA_DISTRICTS.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="courierAddress">Detaylı Adres:</label>
                  <input type="text" id="courierAddress" placeholder="Mahalle, sokak, bina no..." ref={courierAddressRef} />
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
                    
                    const uiUser = { id: me.me._id, name: me.me.name, phone: me.me.phone || '-', location: me.me.addressText || '-', status: 'available' };
                    onAuthenticated('courier', token, me.me, uiUser);
                    notify(`Hoş geldiniz ${me.me.name}!`);
                  } catch (e) { notify(e.message, 'error'); }
                } else {
                  // Kayıt
                  const name = (courierNameRef.current?.value || '').trim();
                  const phone = (courierPhoneRef.current?.value || '').trim();
                  const district = (courierDistrictRef.current?.value || '').trim();
                  const addressText = (courierAddressRef.current?.value || '').trim();
                  
                  if (!name) return notify('İsim zorunludur', 'error');
                  if (!district) return notify('Semt seçimi zorunludur', 'error');
                  if (!addressText) return notify('Adres zorunludur', 'error');
                  
                  const fullAddress = `${addressText}, ${district}`;
                  
                  try {
                    const r = await fetch(`${API}/auth/register/courier`, { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' }, 
                      body: JSON.stringify({ name, email, password, addressText: fullAddress, district, phone }) 
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
                    
                    const uiUser = { id: me.me._id, name: me.me.name, phone, location: me.me.addressText || '-', status: 'available' };
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

function MainApp({ role, currentUser, token, profile, onLogout, notify }) {
  const [couriers, setCouriers] = useState(currentUser?.type === 'courier' ? [currentUser] : []);
  const [orders, setOrders] = useState([]);
  const [activeTime, setActiveTime] = useState(0);
  const [isCourierActive, setIsCourierActive] = useState(currentUser?.status === 'available');
  const [nearbyCouriers, setNearbyCouriers] = useState([]);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([36.5441, 31.9957]); // Alanya merkez
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GPS izni kontrolü ve konum alma
  useEffect(() => {
    if (role === 'courier' && token) {
      const checkLocationPermission = async () => {
        try {
          // GPS izni kontrol et
          if ('geolocation' in navigator) {
            // İzin durumunu kontrol et
            if ('permissions' in navigator) {
              const permission = await navigator.permissions.query({ name: 'geolocation' });
              setLocationPermission(permission.state);
              
              permission.onchange = () => {
                setLocationPermission(permission.state);
              };
            }
            
            // İlk konumu al
            const getCurrentLocation = () => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords;
                  setUserLocation([latitude, longitude]);
                  setMapCenter([latitude, longitude]);
                  
                  // Server'a konum gönder
                  updateLocationOnServer(longitude, latitude);
                },
                (error) => {
                  console.log('GPS hatası:', error.message);
                  if (error.code === 1) {
                    setLocationPermission('denied');
                    notify('GPS izni gerekli. Lütfen tarayıcı ayarlarından konum iznini verin.', 'warning');
                  } else if (error.code === 2) {
                    notify('Konum alınamadı. Lütfen GPS\'in açık olduğundan emin olun.', 'warning');
                  } else if (error.code === 3) {
                    notify('Konum alma zaman aşımına uğradı.', 'warning');
                  }
                },
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0
                }
              );
            };
            
            getCurrentLocation();
            
            // Sürekli konum takibi (kargo firması tarzı)
            const watchId = navigator.geolocation.watchPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation([latitude, longitude]);
                
                // Server'a konum gönder
                updateLocationOnServer(longitude, latitude);
              },
              (error) => {
                console.log('Konum takip hatası:', error.message);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000 // 5 saniye eski konumları kabul et
              }
            );
            
            return () => {
              navigator.geolocation.clearWatch(watchId);
            };
          }
        } catch (error) {
          console.log('GPS izin kontrolü hatası:', error);
        }
      };
      
      checkLocationPermission();
    }
  }, [role, token]);

  // Server'a konum gönderme
  const updateLocationOnServer = useCallback(async (longitude, latitude) => {
    try {
      await fetch(`${API}/couriers/location`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ coords: { lng: longitude, lat: latitude } }) 
      });
    } catch (error) {
      console.log('Server konum güncelleme hatası:', error);
    }
  }, [token]);

  // GPS izni isteme
  const requestLocationPermission = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setLocationPermission('granted');
          notify('GPS izni verildi! Konumunuz takip ediliyor.', 'success');
          
          // Server'a konum gönder
          updateLocationOnServer(longitude, latitude);
        },
        (error) => {
          setLocationPermission('denied');
          notify('GPS izni reddedildi. Konum takibi yapılamıyor.', 'error');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    }
  }, [updateLocationOnServer, notify]);

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
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    const i = setInterval(fetchOrders, 8000);
    return () => clearInterval(i);
  }, [role, token]);

  // Fetch store orders periodically
  useEffect(() => {
    if (role !== 'store' || !token) return;
    const fetchStoreOrders = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchStoreOrders();
    const i = setInterval(fetchStoreOrders, 10000);
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
          const withDistance = (d.couriers || []).map((c) => ({
            id: c._id,
            name: c.name,
            phone: c.phone || '-',
            location: c.addressText || 'Yakın',
            status: 'available',
            coordinates: c.location.coordinates,
            distance: haversineKm(
              profile.location.coordinates[1], 
              profile.location.coordinates[0], 
              c.location.coordinates[1], 
              c.location.coordinates[0]
            ).toFixed(1)
          }));
          setNearbyCouriers(withDistance);
        }
      } catch {}
    };
    fetchNearby();
    const i = setInterval(fetchNearby, 5000); // 5 saniyede bir güncelle
    return () => clearInterval(i);
  }, [role, token, profile]);

  // Fetch nearby shops for courier (her 10 saniyede bir)
  useEffect(() => {
    if (role !== 'courier' || !token || !profile?.location) return;
    const fetchNearbyShops = async () => {
      try {
        const r = await fetch(`${API}/shops/nearby`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
          body: JSON.stringify({ courierLocation: profile.location }) 
        });
        const d = await r.json();
        if (r.ok) {
          const withDistance = (d.shops || []).map((s) => ({
            id: s._id,
            name: s.name,
            address: s.addressText,
            coordinates: s.location.coordinates,
            distance: haversineKm(
              profile.location.coordinates[1], 
              profile.location.coordinates[0], 
              s.location.coordinates[1], 
              s.location.coordinates[0]
            ).toFixed(1)
          }));
          setNearbyShops(withDistance);
        }
      } catch {}
    };
    fetchNearbyShops();
    const i = setInterval(fetchNearbyShops, 10000);
    return () => clearInterval(i);
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
            
            <div style={{ marginTop: 30 }}>
              <div className="map-toggle-container">
                <h3>🏍️ Müsait Kuryeler (Gerçek Zamanlı)</h3>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowMap(!showMap)}
                >
                  {showMap ? '📋 Liste Görünümü' : '🗺️ Canlı Harita'}
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
                          Mesafe: {courier.distance} km<br/>
                          Durum: Müsait<br/>
                          📱 {courier.phone}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                  <div className="map-info">
                    <p>📍 Müsait kuryelerin konumları her 5 saniyede bir güncellenir</p>
                    <p>🏍️ Kurye ikonlarına tıklayarak detayları görün</p>
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
                {/* GPS İzin Durumu */}
                {locationPermission === 'prompt' && (
                  <div className="gps-permission-card">
                    <div className="gps-icon">📍</div>
                    <div className="gps-info">
                      <h3>GPS İzni Gerekli</h3>
                      <p>Gerçek zamanlı konum takibi için GPS iznini verin</p>
                      <button className="btn btn-primary" onClick={requestLocationPermission}>
                        📍 GPS İzni Ver
                      </button>
                    </div>
                  </div>
                )}
                
                {locationPermission === 'denied' && (
                  <div className="gps-permission-card error">
                    <div className="gps-icon">❌</div>
                    <div className="gps-info">
                      <h3>GPS İzni Reddedildi</h3>
                      <p>Konum takibi yapılamıyor. Tarayıcı ayarlarından izin verin.</p>
                      <button className="btn btn-warning" onClick={requestLocationPermission}>
                        🔄 Tekrar Dene
                      </button>
                    </div>
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
              </div>
            </div>

            <div className="courier-panel">
              <div className="panel-header">
                <h2>🏪 Yakın Dükkanlar</h2>
              </div>
              <div className="panel-content">
                <div className="map-toggle-container">
                  <div>
                    <h3>Size yakın dükkanları görüntüleyin</h3>
                    <p>Mesafe bilgileri her 10 saniyede bir güncellenir</p>
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? '📋 Liste Görünümü' : '🗺️ Harita Görünümü'}
                  </button>
                </div>
                
                {showMap ? (
                  <div className="map-container">
                    <MapContainer 
                      center={userLocation || mapCenter} 
                      zoom={13} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {/* Kurye konumu - gerçek zamanlı */}
                      {userLocation && (
                        <Marker 
                          position={userLocation}
                          icon={L.divIcon({
                            className: 'courier-marker',
                            html: '🏍️',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                          })}
                        >
                          <Popup>
                            <strong>🏍️ {currentUser.name}</strong><br/>
                            Sizin konumunuz (GPS)
                          </Popup>
                        </Marker>
                      )}
                      {/* Yakın dükkanlar */}
                      {nearbyShops.map((shop) => (
                        <Marker 
                          key={shop.id} 
                          position={[shop.coordinates[1], shop.coordinates[0]]}
                          icon={L.divIcon({
                            className: 'shop-marker',
                            html: '🏪',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                          })}
                        >
                          <Popup>
                            <strong>🏪 {shop.name}</strong><br/>
                            Mesafe: {shop.distance} km<br/>
                            Adres: {shop.address}
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                    <div className="map-info">
                      <p>📍 Konumunuz GPS ile gerçek zamanlı takip ediliyor</p>
                      <p>🏪 Dükkan konumları her 10 saniyede bir güncellenir</p>
                    </div>
                  </div>
                ) : (
                  <div id="nearbyShops">
                    {nearbyShops.map((shop) => (
                      <div key={shop.id} className="shop-card">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12 }}>
                          <div>
                            <h3 style={{ marginBottom: 8 }}>{shop.name}</h3>
                            <p>
                              <strong>📍 Mesafe:</strong> ~{shop.distance} km
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
                )}
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
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}