import React, { useState, useRef } from 'react';
import { 
  ShoppingBag, MessageCircle, Edit3, Trash2, 
  Plus, Image as ImageIcon, Save, X, Settings, 
  Store, Phone, ShieldCheck, Truck, Headphones,
  Star, CheckCircle, CreditCard, Clock, Mail, AtSign,
  Camera, Lock, Info, LogOut
} from 'lucide-react';

export default function App() {
  // --- ESTADOS DE SEGURIDAD Y ADMIN ---
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // Variables para el "Toque Secreto"
  const clickCount = useRef(0);
  const clickTimeout = useRef(null);

  // --- ESTADOS DE LA TIENDA ---
  const [storeInfo, setStoreInfo] = useState({
    name: 'Mi Emprendimiento',
    logo: '',
    phone: '573001234567',
    description: 'Los mejores productos al mejor precio.',
    aboutText: 'En nuestra tienda nos apasiona la tecnología y trabajamos para ofrecerte productos de calidad, atención confiable y una experiencia de compra segura. Brindamos asesoría personalizada para ayudarte a elegir los dispositivos que mejor se adapten a tus necesidades. Además, realizamos envíos a toda Colombia. Tu satisfacción y confianza son nuestra prioridad. 🚀📦',
    aboutImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    instagram: '@mi.emprendimiento',
    email: 'ventas@miemprendimiento.com',
    schedule: 'Lunes a Sábado: 9am - 6pm'
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Audífonos Inalámbricos Pro',
      price: 120000,
      image: 'https://images.unsplash.com/photo-1606220588913-b3aecb4b2075?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      description: 'Cancelación de ruido y batería de 24 horas.'
    },
    {
      id: 2,
      name: 'Smartwatch Serie X',
      price: 250000,
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      description: 'Monitor de ritmo cardíaco y notificaciones.'
    }
  ]);

  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: 'María G.',
      text: 'Excelente atención, el producto llegó rápido y en perfectas condiciones. ¡Súper recomendados!',
      rating: 5
    }
  ]);

  // --- ESTADOS DE MODALES ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({ name: '', price: '', description: '', image: '' });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({ author: '', text: '', rating: 5 });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, message: '' });

  const logoInputRef = useRef(null);
  const productInputRef = useRef(null);
  const aboutImageInputRef = useRef(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const openWhatsApp = (productName = null) => {
    let message = `¡Hola! Vengo de tu catálogo virtual.`;
    if (productName) {
      message = `¡Hola! Me interesa cotizar o comprar el producto: *${productName}*. ¿Me podrías dar más información?`;
    }
    const url = `https://wa.me/${storeInfo.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- LÓGICA DE TOQUE SECRETO ---
  const handleSecretKnock = () => {
    clickCount.current += 1;
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    
    clickTimeout.current = setTimeout(() => {
      clickCount.current = 0;
    }, 1000);

    if (clickCount.current >= 5) {
      clickCount.current = 0;
      setShowLoginModal(true);
      setPin('');
      setLoginError(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (pin === '1234') { 
      setIsAdminMode(true);
      setShowLoginModal(false);
      setPin('');
    } else {
      setLoginError(true);
    }
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...productFormData, id: p.id } : p));
    } else {
      setProducts([...products, { ...productFormData, id: Date.now() }]);
    }
    setIsProductModalOpen(false);
  };

  const requestDeleteProduct = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Eliminar este producto? No se puede deshacer.',
      action: () => {
        setProducts(products.filter(p => p.id !== id));
        setConfirmDialog({ isOpen: false, action: null, message: '' });
      }
    });
  };

  const handleSaveReview = (e) => {
    e.preventDefault();
    setReviews([...reviews, { ...reviewFormData, id: Date.now() }]);
    setIsReviewModalOpen(false);
    setReviewFormData({ author: '', text: '', rating: 5 });
  };

  const ConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <Info className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Acción</h3>
        <p className="text-sm text-gray-500 mb-6">{confirmDialog.message}</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmDialog({ isOpen: false, action: null, message: '' })} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium">Cancelar</button>
          <button onClick={confirmDialog.action} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium shadow-sm">Eliminar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-0 flex flex-col">
      {/* CABECERA */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                {storeInfo.logo ? (
                  <img src={storeInfo.logo} alt="Logo" className="h-14 w-14 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Store size={28} /></div>
                )}
                {isAdminMode && (
                  <div onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Camera size={20} className="text-white" />
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (res) => setStoreInfo({...storeInfo, logo: res}))}/>
                  </div>
                )}
              </div>
              <div className="flex-1">
                {isAdminMode ? (
                  <>
                    <input type="text" value={storeInfo.name} onChange={(e) => setStoreInfo({...storeInfo, name: e.target.value})} className="font-bold text-xl bg-yellow-50 w-full outline-none" />
                    <input type="text" value={storeInfo.description} onChange={(e) => setStoreInfo({...storeInfo, description: e.target.value})} className="text-sm bg-yellow-50 w-full outline-none" />
                  </>
                ) : (
                  <>
                    <h1 className="font-extrabold text-xl text-gray-900">{storeInfo.name}</h1>
                    <p className="text-sm text-gray-500">{storeInfo.description}</p>
                  </>
                )}
              </div>
            </div>
            {isAdminMode && (
               <button onClick={() => setIsAdminMode(false)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                 <LogOut size={16} /> Salir
               </button>
            )}
          </div>
        </div>
      </header>

      {isAdminMode && (
        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 text-center text-sm font-bold flex justify-center gap-2 shadow-inner">
          <Settings size={18} /> ESTÁS EN MODO EDICIÓN
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8 space-y-16">
        
        {/* CATALOGO */}
        <section>
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-3xl font-bold flex items-center gap-3"><ShoppingBag className="text-blue-600" /> Catálogo</h2>
            {isAdminMode && (
              <button onClick={() => { setEditingProduct(null); setProductFormData({name:'', price:'', description:'', image:''}); setIsProductModalOpen(true); }} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold flex gap-2">
                <Plus size={20} /> <span className="hidden sm:inline">Añadir</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
                <div className="relative aspect-square bg-gray-50">
                  {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={48} className="text-gray-300"/></div>}
                  {isAdminMode && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button onClick={() => { setEditingProduct(product); setProductFormData(product); setIsProductModalOpen(true); }} className="p-2 bg-white text-blue-600 rounded-full shadow"><Edit3 size={18}/></button>
                      <button onClick={() => requestDeleteProduct(product.id)} className="p-2 bg-white text-red-600 rounded-full shadow"><Trash2 size={18}/></button>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-xl mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 flex-grow">{product.description}</p>
                  <div className="pt-4 border-t">
                    <span className="font-extrabold text-2xl mb-4 block">{formatPrice(product.price)}</span>
                    {!isAdminMode && (
                      <button onClick={() => openWhatsApp(product.name)} className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl flex justify-center gap-2"><MessageCircle size={22} /> Cotizar</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SOBRE NOSOTROS */}
        <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row">
          <div className="md:w-1/2 relative group">
            <img src={storeInfo.aboutImage} className="w-full h-full object-cover min-h-[300px]" />
            {isAdminMode && (
              <div onClick={() => aboutImageInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer text-white">
                <Camera size={32} /><span>Cambiar Imagen</span>
                <input type="file" ref={aboutImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (res) => setStoreInfo({...storeInfo, aboutImage: res}))}/>
              </div>
            )}
          </div>
          <div className="md:w-1/2 p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">Tu confianza es nuestra prioridad</h2>
            {isAdminMode ? (
              <textarea value={storeInfo.aboutText} onChange={(e) => setStoreInfo({...storeInfo, aboutText: e.target.value})} className="w-full h-48 p-4 bg-yellow-50 rounded-xl outline-none" />
            ) : (
              <p className="text-gray-600 leading-relaxed text-lg">{storeInfo.aboutText}</p>
            )}
          </div>
        </section>
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="bg-gray-900 text-gray-300 pt-16 mt-10 relative">
        <div className="max-w-5xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-gray-800 pb-12">
            <div>
              <h3 className="text-white font-bold text-xl mb-6">Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3"><Phone size={20} /> {isAdminMode ? <input value={storeInfo.phone} onChange={(e) => setStoreInfo({...storeInfo, phone: e.target.value})} className="bg-gray-800 text-white px-2 rounded" /> : <span>+{storeInfo.phone}</span>}</div>
                <div className="flex items-center gap-3"><AtSign size={20} /> {isAdminMode ? <input value={storeInfo.instagram} onChange={(e) => setStoreInfo({...storeInfo, instagram: e.target.value})} className="bg-gray-800 text-white px-2 rounded" /> : <span>{storeInfo.instagram}</span>}</div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-6">Compra Segura</h3>
              <p className="text-sm text-gray-400">Todos nuestros productos cuentan con garantía y acompañamiento postventa.</p>
            </div>
          </div>
          <div className="pt-8 flex justify-between text-sm text-gray-500 relative">
            {/* AREA TOQUE SECRETO (Izquierda) */}
            <div onClick={handleSecretKnock} className="absolute bottom-0 left-0 w-24 h-24 cursor-default z-50 bg-transparent" title="Área Segura" />
            <p>© {new Date().getFullYear()} {storeInfo.name}. Todos los derechos reservados.</p>
            <p>Experiencia de compra protegida.</p>
          </div>
        </div>
      </footer>

      {/* BOTÓN WHATSAPP */}
      {!isAdminMode && (
        <button onClick={() => openWhatsApp()} className="fixed bottom-6 right-6 p-4 bg-[#25D366] text-white rounded-full shadow-2xl z-40"><MessageCircle size={28} /></button>
      )}

      {/* MODAL DE LOGIN ADMIN */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4"><X size={24} /></button>
            <h2 className="text-2xl font-bold text-center mb-6">Acceso Admin</h2>
            <form onSubmit={handleLoginSubmit}>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" className="w-full text-center text-2xl tracking-[0.5em] p-3 border rounded-xl mb-4 outline-none" autoFocus />
              {loginError && <p className="text-red-500 text-center mb-4 text-sm">PIN incorrecto.</p>}
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">Desbloquear</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PRODUCTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingProduct ? 'Editar' : 'Nuevo'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <input required type="text" value={productFormData.name} onChange={(e) => setProductFormData({...productFormData, name: e.target.value})} placeholder="Nombre" className="w-full p-3 border rounded-xl" />
              <input required type="number" value={productFormData.price} onChange={(e) => setProductFormData({...productFormData, price: e.target.value})} placeholder="Precio" className="w-full p-3 border rounded-xl" />
              <textarea value={productFormData.description} onChange={(e) => setProductFormData({...productFormData, description: e.target.value})} placeholder="Descripción" className="w-full p-3 border rounded-xl" />
              <div className="flex gap-2">
                 <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold">Cancelar</button>
                 <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog.isOpen && <ConfirmModal />}
    </div>
  );
}