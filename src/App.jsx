import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, doc, onSnapshot, setDoc, collection, 
  updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  ShoppingBag, MessageCircle, Edit3, Trash2, 
  Plus, Image as ImageIcon, Save, X, Settings, 
  Store, Phone, ShieldCheck, Truck, Headphones,
  Star, CheckCircle, Clock, Mail, AtSign,
  Camera, Lock, Info, LogOut, Palette, Type, Upload, WifiOff,
  Maximize2
} from 'lucide-react';

// --- CONFIGURACIÓN DE TU FIREBASE PROPORCIONADA ---
const firebaseConfig = {
  apiKey: "AIzaSyCtLQYM2aPNWMCgEks8GUD_GvS5HNTLcZU",
  authDomain: "catalogo-profesional.firebaseapp.com",
  projectId: "catalogo-profesional",
  storageBucket: "catalogo-profesional.firebasestorage.app",
  messagingSenderId: "908682908485",
  appId: "1:908682908485:web:105d8f07910e726d3fa42c"
};

// Inicialización segura de Firebase
let app;
let db;
let firebaseDisponible = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  firebaseDisponible = true;
} catch (error) {
  console.warn("Firebase no se pudo inicializar. Usando base de datos local de respaldo.", error);
}

// Estados iniciales elegantes con tus datos reales de TechMode
const DEFAULT_STORE_INFO = {
  name: 'TechMode',
  description: 'Los mejores dispositivos y accesorios de audio.',
  logo: '',
  phone: '573242744430',
  instagram: '@techmode_plus',
  email: 'techmodeplus18@gmail.com',
  schedule: 'Lunes a Sábado: 8am - 6pm',
  bannerTitle: 'Lleva tu música a otro nivel',
  bannerSubtitle: 'Descubre nuestra línea exclusiva de audífonos y accesorios premium con garantía.',
  bannerImage: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  aboutText: 'En nuestra tienda nos apasiona la tecnología y trabajamos para ofrecerte productos de calidad, atención confiable y una experiencia de compra segura. Brindamos asesoría personalizada para ayudarte a elegir los audífonos y dispositivos que mejor se adapten a tus necesidades. Además, realizamos envíos a toda Colombia, llevando tecnología hasta tu puerta de forma rápida y segura. Tu satisfacción y confianza son nuestra prioridad. 🚀📦',
  aboutImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  primaryColor: '#3b82f6', 
  secondaryColor: '#ec4899', 
  fontFamily: 'font-sans',
  bannerAlign: 'object-center',
  bannerOverlayOpacity: 0.5
};

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Audífonos Inalámbricos Pro',
    price: 120000,
    images: [
      'https://images.unsplash.com/photo-1606220588913-b3aecb4b2075?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Cancelación de ruido activa, sonido de alta fidelidad y batería de 24 horas.'
  },
  {
    id: 'prod-2',
    name: 'Smartwatch Serie X',
    price: 250000,
    images: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517502884422-41eaaced0168?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Monitor de ritmo cardíaco, notificaciones inteligentes y resistencia al agua IP68.'
  }
];

const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    author: 'María G.',
    text: 'Excelente atención, el producto llegó rápido a Medellín y en perfectas condiciones. ¡Súper recomendados!',
    rating: 5
  },
  {
    id: 'rev-2',
    author: 'Carlos T.',
    text: 'Me asesoraron muy bien antes de comprar por WhatsApp. Los audífonos suenan espectacular.',
    rating: 5
  }
];

export default function App() {
  const [storeInfo, setStoreInfo] = useState(() => {
    const local = localStorage.getItem('local_store_info');
    return local ? JSON.parse(local) : DEFAULT_STORE_INFO;
  });
  
  const [products, setProducts] = useState(() => {
    const local = localStorage.getItem('local_products');
    return local ? JSON.parse(local) : DEFAULT_PRODUCTS;
  });

  const [reviews, setReviews] = useState(() => {
    const local = localStorage.getItem('local_reviews');
    return local ? JSON.parse(local) : DEFAULT_REVIEWS;
  });

  const [loading, setLoading] = useState(true);
  const [usandoLocal, setUsandoLocal] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Estado para controlar la apertura de las políticas de privacidad y garantías
  const [activePolicyModal, setActivePolicyModal] = useState(null); // 'privacy' | 'warranty' | null

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({ name: '', price: '', description: '', images: [] });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({ author: '', text: '', rating: 5, image: '' });

  // Detalle del producto e índice de imagen activa en el carrusel
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Ampliación de imagen en pantalla completa
  const [zoomImage, setZoomImage] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, message: '' });
  const [compressing, setCompressing] = useState(false);

  const clickCount = useRef(0);
  const clickTimeout = useRef(null);

  const logoInputRef = useRef(null);
  const productInputRef = useRef(null);
  const aboutImageInputRef = useRef(null);
  const bannerImageInputRef = useRef(null);

  useEffect(() => {
    let unsubs = [];
    
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        console.warn("Firebase demoró demasiado en responder. Activando respaldo LocalStorage.");
        setUsandoLocal(true);
        setLoading(false);
      }
    }, 3500);

    if (firebaseDisponible && db) {
      try {
        // 1. Escuchar Configuración de Tienda
        const unsubStore = onSnapshot(doc(db, "config", "store"), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStoreInfo(data);
            localStorage.setItem('local_store_info', JSON.stringify(data));
          } else {
            setDoc(doc(db, "config", "store"), DEFAULT_STORE_INFO);
          }
          setUsandoLocal(false);
        }, (error) => {
          console.error("Error en Firestore (Config):", error);
          manejarErrorFirebase(error);
        });

        // 2. Escuchar Productos
        const unsubProducts = onSnapshot(collection(db, "products"), (querySnap) => {
          const prodList = [];
          querySnap.forEach((doc) => {
            prodList.push({ id: doc.id, ...doc.data() });
          });
          setProducts(prodList);
          localStorage.setItem('local_products', JSON.stringify(prodList));
          setUsandoLocal(false);
        }, (error) => {
          console.error("Error en Firestore (Productos):", error);
          manejarErrorFirebase(error);
        });

        // 3. Escuchar Reseñas
        const unsubReviews = onSnapshot(collection(db, "reviews"), (querySnap) => {
          const reviewList = [];
          querySnap.forEach((doc) => {
            reviewList.push({ id: doc.id, ...doc.data() });
          });
          setReviews(reviewList);
          localStorage.setItem('local_reviews', JSON.stringify(reviewList));
          setUsandoLocal(false);
          setLoading(false);
          clearTimeout(fallbackTimer);
        }, (error) => {
          console.error("Error en Firestore (Reseñas):", error);
          manejarErrorFirebase(error);
        });

        unsubs = [unsubStore, unsubProducts, unsubReviews];

      } catch (err) {
        console.error("Error de conexión Firebase:", err);
        setUsandoLocal(true);
        setLoading(false);
        clearTimeout(fallbackTimer);
      }
    } else {
      setUsandoLocal(true);
      setLoading(false);
      clearTimeout(fallbackTimer);
    }

    return () => {
      unsubs.forEach(unsub => unsub());
      clearTimeout(fallbackTimer);
    };
  }, []);

  const manejarErrorFirebase = (error) => {
    setUsandoLocal(true);
    setLoading(false);
    if (error.code === 'permission-denied') {
      setFirebaseError("Permisos denegados en Firebase. Ve a la consola de Firebase > Firestore Database > Reglas (Rules) y configúralas en modo lectura/escritura pública.");
    } else {
      setFirebaseError(`Error de Firebase: ${error.message}. Usando base de datos local de respaldo.`);
    }
  };

  const guardarConfiguracion = async (nuevosDatos) => {
    const configActualizada = { ...storeInfo, ...nuevosDatos };
    setStoreInfo(configActualizada);
    localStorage.setItem('local_store_info', JSON.stringify(configActualizada));

    if (firebaseDisponible && !usandoLocal) {
      try {
        await setDoc(doc(db, "config", "store"), configActualizada, { merge: true });
      } catch (e) {
        console.error("No se pudo sincronizar configuración con Firebase:", e);
      }
    }
  };

  const compressAndConvertImage = (file, maxWidth = 500, maxHeight = 500, quality = 0.6) => {
    return new Promise((resolve, reject) => {
      setCompressing(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          setCompressing(false);
          resolve(compressedBase64);
        };
        img.onerror = (err) => {
          setCompressing(false);
          reject(err);
        };
      };
      reader.onerror = (err) => {
        setCompressing(false);
        reject(err);
      };
    });
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressAndConvertImage(file, 200, 200, 0.7);
        await guardarConfiguracion({ logo: compressedBase64 });
      } catch (err) {
        console.error("Error comprimiendo logo:", err);
      }
    }
  };

  const handleBannerImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressAndConvertImage(file, 800, 450, 0.5);
        await guardarConfiguracion({ bannerImage: compressedBase64 });
      } catch (err) {
        console.error("Error comprimiendo banner:", err);
      }
    }
  };

  const handleAboutImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await compressAndConvertImage(file, 600, 600, 0.5);
        await guardarConfiguracion({ aboutImage: compressedBase64 });
      } catch (err) {
        console.error("Error comprimiendo imagen corporativa:", err);
      }
    }
  };

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
    if (pin === '9876') { 
      setIsAdminMode(true);
      setShowLoginModal(false);
      setPin('');
    } else {
      setLoginError(true);
    }
  };

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      // Garantizar que use images (arreglo) para la edición
      const initialImages = product.images || (product.image ? [product.image] : []);
      setProductFormData({ ...product, images: initialImages });
    } else {
      setEditingProduct(null);
      setProductFormData({ name: '', price: '', description: '', images: [] });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const idTemp = editingProduct ? editingProduct.id : `prod-${Date.now()}`;
    const nuevoProducto = { ...productFormData, id: idTemp };

    let productosActualizados;
    if (editingProduct) {
      productosActualizados = products.map(p => p.id === idTemp ? nuevoProducto : p);
    } else {
      productosActualizados = [...products, nuevoProducto];
    }
    setProducts(productosActualizados);
    localStorage.setItem('local_products', JSON.stringify(productosActualizados));

    if (firebaseDisponible && !usandoLocal) {
      try {
        if (editingProduct) {
          await updateDoc(doc(db, "products", idTemp), productFormData);
        } else {
          await setDoc(doc(db, "products", idTemp), productFormData);
        }
      } catch (err) {
        console.error("Error subiendo producto a Firebase:", err);
      }
    }
    setIsProductModalOpen(false);
  };

  const requestDeleteProduct = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de eliminar este producto del catálogo?',
      action: async () => {
        const productosActualizados = products.filter(p => p.id !== id);
        setProducts(productosActualizados);
        localStorage.setItem('local_products', JSON.stringify(productosActualizados));

        if (firebaseDisponible && !usandoLocal) {
          try {
            await deleteDoc(doc(db, "products", id));
          } catch (e) {
            console.error("Error eliminando de Firebase:", e);
          }
        }
        setConfirmDialog({ isOpen: false, action: null, message: '' });
      }
    });
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    const idTemp = `rev-${Date.now()}`;
    const nuevaReview = { ...reviewFormData, id: idTemp, date: Date.now() };

    const reviewsActualizadas = [...reviews, nuevaReview];
    setReviews(reviewsActualizadas);
    localStorage.setItem('local_reviews', JSON.stringify(reviewsActualizadas));

    if (firebaseDisponible && !usandoLocal) {
      try {
        await setDoc(doc(db, "reviews", idTemp), {
          author: reviewFormData.author,
          text: reviewFormData.text,
          rating: reviewFormData.rating,
          image: reviewFormData.image || '',
          date: Date.now()
        });
      } catch (err) {
        console.error(err);
      }
    }
    setIsReviewModalOpen(false);
    setReviewFormData({ author: '', text: '', rating: 5, image: '' });
  };

  const requestDeleteReview = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Eliminar esta opinión de cliente de la página?',
      action: async () => {
        const reviewsActualizadas = reviews.filter(r => r.id !== id);
        setReviews(reviewsActualizadas);
        localStorage.setItem('local_reviews', JSON.stringify(reviewsActualizadas));

        if (firebaseDisponible && !usandoLocal) {
          try {
            await deleteDoc(doc(db, "reviews", id));
          } catch (e) {
            console.error(e);
          }
        }
        setConfirmDialog({ isOpen: false, action: null, message: '' });
      }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const openWhatsApp = (productName = null) => {
    let message = `¡Hola! Vengo de tu catálogo virtual.`;
    if (productName) {
      message = `¡Hola! Me interesa cotizar o comprar el producto: *${productName}*. ¿Me podrías dar más información?`;
      
      if (window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: productName,
          status: 'Click WhatsApp Producto'
        });
      }
    } else {
      if (window.fbq) {
        window.fbq('track', 'Contact', {
          status: 'Click WhatsApp General'
        });
      }
    }
    const url = `https://wa.me/${storeInfo.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const COLOR_PALETTES = [
    { primary: '#3b82f6', secondary: '#10b981', label: 'Tech Clásico (Azul/Esmeralda)' },
    { primary: '#8b5cf6', secondary: '#ec4899', label: 'Neón Premium (Violeta/Rosa)' },
    { primary: '#10b981', secondary: '#f59e0b', label: 'Ecológico (Verde/Ámbar)' },
    { primary: '#f43f5e', secondary: '#4f46e5', label: 'Enérgico (Rosa/Indigo)' },
    { primary: '#111827', secondary: '#6b7280', label: 'Minimalista (Oscuro/Gris)' }
  ];

  const FONT_OPTIONS = [
    { id: 'font-sans', label: 'Moderna (Sans-serif)' },
    { id: 'font-serif', label: 'Elegante (Serif)' },
    { id: 'font-mono', label: 'Futurista (Monospace)' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Sincronizando con Google Firebase...</p>
          <p className="text-xs text-gray-400 mt-2">Si es tu primera vez cargando, activaremos el modo local de respaldo en unos segundos.</p>
        </div>
      </div>
    );
  }

  // Helper para extraer la foto de portada del producto
  const getProductCoverImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || '';
  };

  // Helper para extraer la galería de imágenes del producto
  const getProductImageGallery = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return product.image ? [product.image] : [];
  };

  return (
    <div className={`min-h-screen bg-gray-50/50 flex flex-col ${storeInfo.fontFamily || 'font-sans'} selection:bg-blue-200`}>
      
      {firebaseError && (
        <div className="bg-amber-500 text-amber-950 p-3 text-center text-xs sm:text-sm font-semibold relative z-50 flex items-center justify-center gap-2 shadow-md">
          <WifiOff size={18} /> {firebaseError}
        </div>
      )}

      {usandoLocal && !firebaseError && (
        <div className="bg-blue-600 text-white p-2.5 text-center text-xs sm:text-sm font-medium relative z-50 flex items-center justify-center gap-2 shadow">
          <span>📲 Catálogo Funcionando en <b>Modo Respaldo Local</b>. Tus cambios se guardarán en tu navegador.</span>
        </div>
      )}

      {/* CABECERA */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex justify-between items-center gap-4">
            
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative group shrink-0">
                {storeInfo.logo ? (
                  <img src={storeInfo.logo} alt="Logo" className="h-14 w-14 rounded-full object-cover border border-gray-200 shadow-sm" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                    <Store size={28} />
                  </div>
                )}
                {isAdminMode && (
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    <Camera size={18} className="text-white" />
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoChange}/>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {isAdminMode ? (
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      value={storeInfo.name}
                      onChange={async (e) => await guardarConfiguracion({ name: e.target.value })}
                      className="font-bold text-lg bg-yellow-50 border border-yellow-300 rounded px-2 w-full focus:outline-none"
                    />
                    <input 
                      type="text" 
                      value={storeInfo.description}
                      onChange={async (e) => await guardarConfiguracion({ description: e.target.value })}
                      className="text-xs text-gray-500 bg-yellow-50 border border-yellow-300 rounded px-2 w-full focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="font-extrabold text-xl md:text-2xl text-gray-900 truncate">{storeInfo.name}</h1>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{storeInfo.description}</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdminMode && (
                <>
                  <button 
                    onClick={() => setShowThemeModal(true)}
                    className="p-2 bg-indigo-50 text-indigo-700 rounded-xl flex items-center gap-2 font-semibold text-sm hover:bg-indigo-100 transition-colors"
                  >
                    <Palette size={18} /> <span className="hidden sm:inline">Tema</span>
                  </button>
                  <button 
                    onClick={() => setIsAdminMode(false)}
                    className="p-2 bg-gray-900 text-white rounded-xl flex items-center gap-2 font-semibold text-sm hover:bg-gray-800 transition-colors"
                  >
                    <LogOut size={18} /> <span className="hidden sm:inline">Cerrar</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {isAdminMode && (
        <div className="bg-yellow-400 text-yellow-950 py-2.5 px-4 text-center text-xs sm:text-sm font-bold flex justify-center items-center gap-2 shadow-inner">
          <Settings size={16} /> MODO EDICIÓN ACTIVO: Cualquier cambio se guarda permanentemente.
        </div>
      )}

      {/* BANNER PRINCIPAL (HERO) */}
      <section className="relative bg-gray-900 text-white overflow-hidden min-h-[300px] flex items-center">
        {storeInfo.bannerImage && (
          <img 
            src={storeInfo.bannerImage} 
            className={`absolute inset-0 w-full h-full object-cover transition-all ${storeInfo.bannerAlign || 'object-center'}`} 
            style={{ opacity: 1 - (storeInfo.bannerOverlayOpacity !== undefined ? storeInfo.bannerOverlayOpacity : 0.6) }}
            alt="Banner background" 
          />
        )}
        <div 
          className="absolute inset-0 bg-black transition-all" 
          style={{ opacity: storeInfo.bannerOverlayOpacity !== undefined ? storeInfo.bannerOverlayOpacity : 0.6 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent" />
        
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 w-full z-10">
          <div className="max-w-2xl">
            {isAdminMode ? (
              <div className="space-y-4 bg-black/50 p-4 rounded-2xl border border-white/10 text-sm">
                <span className="text-yellow-400 font-bold text-xs uppercase block">Editar Hero Banner:</span>
                <input 
                  type="text" 
                  value={storeInfo.bannerTitle}
                  onChange={async (e) => await guardarConfiguracion({ bannerTitle: e.target.value })}
                  className="text-2xl font-bold bg-white/10 border border-white/20 rounded px-2 w-full text-white focus:outline-none"
                />
                <textarea 
                  value={storeInfo.bannerSubtitle}
                  onChange={async (e) => await guardarConfiguracion({ bannerSubtitle: e.target.value })}
                  className="text-xs bg-white/10 border border-white/20 rounded p-2 w-full text-white focus:outline-none h-20"
                />
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">Ángulo de Imagen (Alineación):</label>
                    <select 
                      value={storeInfo.bannerAlign || 'object-center'}
                      onChange={async (e) => await guardarConfiguracion({ bannerAlign: e.target.value })}
                      className="bg-gray-800 border border-white/10 text-white rounded p-1 w-full outline-none"
                    >
                      <option value="object-top">Arriba</option>
                      <option value="object-center">Centro</option>
                      <option value="object-bottom">Abajo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Opacidad de Filtro Oscuro:</label>
                    <select 
                      value={storeInfo.bannerOverlayOpacity !== undefined ? storeInfo.bannerOverlayOpacity : 0.6}
                      onChange={async (e) => await guardarConfiguracion({ bannerOverlayOpacity: parseFloat(e.target.value) })}
                      className="bg-gray-800 border border-white/10 text-white rounded p-1 w-full outline-none"
                    >
                      <option value="0.2">Claro (20% oscuridad)</option>
                      <option value="0.4">Sutil (40% oscuridad)</option>
                      <option value="0.6">Medio (60% oscuridad)</option>
                      <option value="0.8">Oscuro (80% oscuridad)</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => bannerImageInputRef.current?.click()}
                  className="py-1.5 px-3 bg-white/20 hover:bg-white/30 text-xs rounded-lg flex items-center gap-2 transition-all font-semibold"
                >
                  <Camera size={14} /> Cambiar Imagen de Fondo
                </button>
                <input type="file" ref={bannerImageInputRef} className="hidden" accept="image/*" onChange={handleBannerImageChange}/>
              </div>
            ) : (
              <>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                  {storeInfo.bannerTitle}
                </h2>
                <p className="text-base md:text-lg text-gray-300 mb-6">
                  {storeInfo.bannerSubtitle}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12 sm:px-6 lg:px-8 space-y-20">
        
        {/* SECCIÓN DEL CATÁLOGO */}
        <section id="catalogo">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-gray-200 pb-4 gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-3">
                <ShoppingBag style={{ color: storeInfo.primaryColor }} className="h-8 w-8" />
                Catálogo Disponible
              </h2>
              <p className="text-sm text-gray-500 mt-1">Presiona "Cotizar por WhatsApp" para resolver dudas de inmediato.</p>
            </div>
            {isAdminMode && (
              <button 
                onClick={() => handleOpenProductModal()}
                className="w-full sm:w-auto text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:brightness-110"
                style={{ backgroundColor: storeInfo.primaryColor }}
              >
                <Plus size={20} /> Añadir Producto
              </button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <ShoppingBag size={56} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No hay productos cargados</h3>
              <p className="text-gray-500 mt-1">
                {isAdminMode ? 'Comienza a cargar tu inventario presionando el botón "Añadir Producto"' : 'Pronto subiremos nuestras novedades.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(product => {
                const coverImage = getProductCoverImage(product);
                return (
                  <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full group relative">
                    
                    <div 
                      onClick={() => { if (!isAdminMode) { setSelectedProduct(product); setActiveImageIndex(0); } }}
                      className={`relative aspect-square bg-gray-50 overflow-hidden ${!isAdminMode ? 'cursor-pointer' : ''}`}
                    >
                      {coverImage ? (
                        <img src={coverImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                          <ImageIcon size={48} className="mb-2" />
                          <span className="text-xs font-semibold">Sin imagen</span>
                        </div>
                      )}
                      
                      {isAdminMode && (
                        <div className="absolute top-3 right-3 flex gap-2 z-10">
                          <button onClick={() => handleOpenProductModal(product)} className="p-2.5 bg-white/90 backdrop-blur text-blue-600 rounded-full shadow hover:bg-white transition-all">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => requestDeleteProduct(product.id)} className="p-2.5 bg-white/90 backdrop-blur text-red-600 rounded-full shadow hover:bg-white transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div 
                        onClick={() => { if (!isAdminMode) { setSelectedProduct(product); setActiveImageIndex(0); } }}
                        className={!isAdminMode ? 'cursor-pointer' : ''}
                      >
                        <h3 className="font-bold text-gray-900 text-xl mb-2 line-clamp-1 leading-tight group-hover:text-blue-600 transition-colors">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-5 flex-grow line-clamp-2 leading-relaxed">{product.description}</p>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <div className="mb-4 flex flex-col">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Precio de Lanzamiento</span>
                           <span className="font-extrabold text-2xl text-gray-900 tracking-tight">
                            {formatPrice(product.price)}
                          </span>
                        </div>

                        {!isAdminMode && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => openWhatsApp(product.name)}
                              className="flex-1 py-3.5 text-white text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
                              style={{ backgroundColor: storeInfo.secondaryColor }}
                            >
                              <MessageCircle size={22} />
                              Cotizar
                            </button>
                            <button 
                              onClick={() => { setSelectedProduct(product); setActiveImageIndex(0); }}
                              className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-2xl transition-all"
                            >
                              Detalles
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECCIÓN SOBRE NOSOTROS */}
        <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch">
          <div className="md:w-1/2 relative group min-h-[350px]">
            {storeInfo.aboutImage ? (
              <img src={storeInfo.aboutImage} alt="Sobre Nosotros" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-50 flex items-center justify-center"><ImageIcon className="text-blue-200" size={64}/></div>
            )}
            {isAdminMode && (
              <div 
                onClick={() => aboutImageInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              >
                <Camera size={32} className="mb-2" />
                <span className="font-bold text-sm">Cambiar Imagen Corporativa</span>
                <input type="file" ref={aboutImageInputRef} className="hidden" accept="image/*" onChange={handleAboutImageChange}/>
              </div>
            )}
          </div>
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Tu confianza es nuestra prioridad</h2>
            {isAdminMode ? (
              <textarea 
                value={storeInfo.aboutText}
                onChange={async (e) => await guardarConfiguracion({ aboutText: e.target.value })}
                className="w-full h-64 p-4 bg-yellow-50 border border-yellow-300 rounded-2xl text-gray-700 leading-relaxed focus:outline-none resize-none"
              />
            ) : (
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {storeInfo.aboutText}
              </p>
            )}
          </div>
        </section>

        {/* SECCIÓN SEGUROS Y GARANTÍA (TRUST BADGES) */}
        <section className="py-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">¿Por qué comprar con nosotros?</h2>
            <p className="text-gray-500 mt-2">Hacemos que adquirir tecnología de punta sea un proceso transparente y agradable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Garantía Real</h3>
              <p className="text-gray-600 text-sm">Todos nuestros productos cuentan con garantía directa para cubrir fallas técnicas.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                <Truck size={32} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Envíos Asegurados</h3>
              <p className="text-gray-600 text-sm">Enviamos a toda Colombia de manera segura con números de guía rastreables.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <Headphones size={32} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Acompañamiento Postventa</h3>
              <p className="text-gray-600 text-sm">¿Dudas de conexión? Escríbenos por WhatsApp para soporte inmediato.</p>
            </div>
          </div>
        </section>

        {/* SECCIÓN RESEÑAS DE CLIENTES */}
        <section className="py-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Opiniones de Compradores</h2>
              <p className="text-gray-500 mt-1">Nuestra reputación se construye con clientes felices.</p>
            </div>
            {isAdminMode && (
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
              >
                <Plus size={18} /> Añadir Reseña
              </button>
            )}
          </div>
          
          {}
          {reviews.length === 0 ? (
            <p className="text-center py-8 text-gray-500 italic">No hay opiniones publicadas todavía.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group flex flex-col justify-between">
                  <div>
                    <div className="flex text-yellow-400 mb-3">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                    </div>
                    <p className="text-gray-700 italic mb-4">"{review.text}"</p>
                    <p className="font-bold text-gray-900 mb-4">- {review.author}</p>
                    
                    {review.image && (
                      <div className="mt-3 mb-2 relative rounded-xl overflow-hidden border border-gray-100 max-w-[140px] aspect-[9/16] bg-gray-50 group/screenshot cursor-zoom-in">
                        <img 
                          src={review.image} 
                          alt="Evidencia WhatsApp" 
                          className="w-full h-full object-cover"
                        />
                        <div 
                          onClick={() => setZoomImage(review.image)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover/screenshot:opacity-100 flex items-center justify-center transition-all"
                        >
                          <Maximize2 size={20} className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isAdminMode && (
                    <button 
                      onClick={() => requestDeleteReview(review.id)}
                      className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* PIE DE PÁGINA */}
      <footer className="bg-gray-900 text-gray-300 pt-16 mt-16 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-gray-800 pb-12">
            
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-2">Contacto de la Tienda</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-500 shrink-0" />
                  {isAdminMode ? (
                    <input 
                      type="text" 
                      value={storeInfo.phone} 
                      onChange={async (e) => await guardarConfiguracion({ phone: e.target.value })} 
                      className="bg-gray-800 text-white px-2 py-1 rounded text-sm w-full" 
                    />
                  ) : <span className="text-sm">+{storeInfo.phone}</span>}
                </div>
                
                <div className="flex items-center gap-3">
                  <AtSign size={18} className="text-gray-500 shrink-0" />
                  {isAdminMode ? (
                    <input 
                      type="text" 
                      value={storeInfo.instagram} 
                      onChange={async (e) => await guardarConfiguracion({ instagram: e.target.value })} 
                      className="bg-gray-800 text-white px-2 py-1 rounded text-sm w-full" 
                    />
                  ) : <span className="text-sm">{storeInfo.instagram}</span>}
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-500 shrink-0" />
                  {isAdminMode ? (
                    <input 
                      type="text" 
                      value={storeInfo.email} 
                      onChange={async (e) => await guardarConfiguracion({ email: e.target.value })} 
                      className="bg-gray-800 text-white px-2 py-1 rounded text-sm w-full" 
                    />
                  ) : <span className="text-sm">{storeInfo.email}</span>}
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gray-500 shrink-0" />
                  {isAdminMode ? (
                    <input 
                      type="text" 
                      value={storeInfo.schedule} 
                      onChange={async (e) => await guardarConfiguracion({ schedule: e.target.value })} 
                      className="bg-gray-800 text-white px-2 py-1 rounded text-sm w-full" 
                    />
                  ) : <span className="text-sm">{storeInfo.schedule}</span>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-2">Medios de Pago</h3>
              <p className="text-sm text-gray-400">Selecciona el método de tu preferencia al momento de cotizar:</p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> Nequi</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> Daviplata</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> Transferencia Bancaria</li>
                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> Contraentrega (Nacional)</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg mb-2">Compra Protegida</h3>
              <div className="flex items-start gap-3">
                <ShieldCheck size={28} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-400">Sitio 100% Seguro. Todos los datos de contacto y productos cargados son auténticos de nuestra tienda oficial.</p>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4 relative">
            <p>© {new Date().getFullYear()} {storeInfo.name}. Todos los derechos reservados.</p>
            
            <div className="flex gap-4 z-10">
              <button 
                onClick={() => setActivePolicyModal('privacy')} 
                className="hover:text-white hover:underline transition-all"
              >
                Política de Privacidad
              </button>
              <span>|</span>
              <button 
                onClick={() => setActivePolicyModal('warranty')} 
                className="hover:text-white hover:underline transition-all"
              >
                Garantías y Envíos
              </button>
            </div>

            <p>Plataforma autogestionable.</p>
            
            {/* TOQUE SECRETO EN EL EXTREMO INFERIOR IZQUIERDO */}
            <div 
              onClick={handleSecretKnock}
              className="absolute bottom-0 left-0 w-24 h-24 cursor-default z-50 bg-transparent"
              title="Acceso de Seguridad"
            />
          </div>

        </div>
      </footer>

      {/* BOTÓN WHATSAPP FLOTANTE */}
      {!isAdminMode && (
        <button
          onClick={() => openWhatsApp()}
          className="fixed bottom-6 right-6 p-4 text-white rounded-full shadow-2xl hover:brightness-110 hover:-translate-y-1 transition-all z-40 flex items-center gap-2 group"
          style={{ backgroundColor: storeInfo.secondaryColor }}
        >
          <MessageCircle size={28} />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-bold text-sm">
            Chat Directo
          </span>
        </button>
      )}

      {/* SPIN INDICADOR DE COMPRESIÓN */}
      {compressing && (
        <div className="fixed bottom-6 left-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-xl flex items-center gap-3 z-50 animate-pulse">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-xs font-bold text-gray-700">Comprimiendo imagen localmente...</span>
        </div>
      )}

      {/* VENTANA FLOTANTE DE DETALLES DE PRODUCTO (CON GALERÍA Y ZOOM INTERACTIVO) */}
      {selectedProduct && (() => {
        const productImages = getProductImageGallery(selectedProduct);
        const activeImageUrl = productImages[activeImageIndex] || '';

        return (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">
              
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-white/90 backdrop-blur rounded-full p-2 shadow-md z-10"
              >
                <X size={20} />
              </button>

              {/* Lado de Imagen con Carrusel y Botón de Lupa */}
              <div className="w-full md:w-1/2 bg-black relative flex flex-col justify-between p-4 min-h-[300px]">
                
                {/* Visualizador de imagen principal */}
                <div className="relative flex-grow flex items-center justify-center overflow-hidden rounded-2xl group/image min-h-[200px]">
                  {activeImageUrl ? (
                    <>
                      {/* Fondo espejo difuminado */}
                      <img 
                        src={activeImageUrl} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-45 scale-125" 
                      />
                      {/* Imagen nítida real */}
                      <img 
                        src={activeImageUrl} 
                        alt={selectedProduct.name} 
                        className="relative z-10 max-w-full max-h-[220px] md:max-h-[300px] object-contain p-2 cursor-zoom-in" 
                        onClick={() => setZoomImage(activeImageUrl)}
                      />
                      {/* Botón de lupa superpuesto */}
                      <button 
                        onClick={() => setZoomImage(activeImageUrl)}
                        className="absolute bottom-2 right-2 bg-black/55 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm z-20 opacity-0 group-hover/image:opacity-100 transition-opacity"
                        title="Ampliar Imagen"
                      >
                        <Maximize2 size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <ImageIcon size={64} />
                      <span className="text-sm font-semibold mt-2">Sin imagen</span>
                    </div>
                  )}
                </div>

                {/* Miniaturas de la Galería */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto mt-3 pb-1 justify-center scrollbar-thin">
                    {productImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeImageIndex === i ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lado de Información */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Detalles del Producto</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1 mb-3">{selectedProduct.name}</h2>
                  
                  <div className="mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Precio de Lanzamiento</span>
                    <span className="text-3xl font-black text-gray-900 tracking-tight">
                      {formatPrice(selectedProduct.price)}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-6">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Descripción</span>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line max-h-[120px] overflow-y-auto pr-1">
                      {selectedProduct.description || "Este espectacular artículo no cuenta con descripción adicional, pero puedes cotizarlo o resolver tus dudas de inmediato."}
                    </p>
                  </div>

                  {/* Beneficios de confianza destacados */}
                  <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-50 mb-6">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-3">Beneficios con tu compra:</span>
                    <ul className="space-y-2 text-xs text-gray-700">
                      <li className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-green-600 shrink-0" />
                        <span><b>Garantía Oficial:</b> Cobertura ante fallas de fábrica.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Truck size={16} className="text-green-600 shrink-0" />
                        <span><b>Envío Seguro:</b> Cobertura a toda Colombia.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    openWhatsApp(selectedProduct.name);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-4 text-white text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg hover:brightness-110"
                  style={{ backgroundColor: storeInfo.secondaryColor }}
                >
                  <MessageCircle size={24} />
                  Comprar por WhatsApp
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* LIGHTBOX DE PANTALLA COMPLETA (ZOOM PREMIUM) */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-md animate-fade-in"
        >
          <button 
            onClick={() => setZoomImage(null)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 bg-white/10 rounded-full p-2 backdrop-blur"
          >
            <X size={28} />
          </button>
          <img 
            src={zoomImage} 
            alt="Ampliación" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl select-none shadow-2xl pointer-events-none" 
          />
        </div>
      )}

      {/* MODAL DE PERSONALIZACIÓN DE TEMA */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <button onClick={() => setShowThemeModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-1">
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Palette className="text-blue-600" />
              Diseño de la Tienda
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Type size={16} /> Tipografía General
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {FONT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={async () => await guardarConfiguracion({ fontFamily: opt.id })}
                      className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${storeInfo.fontFamily === opt.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Palette size={16} /> Paletas Sugeridas
                </label>
                <div className="space-y-2">
                  {COLOR_PALETTES.map((pal, idx) => (
                    <button
                      key={idx}
                      onClick={async () => await guardarConfiguracion({ primaryColor: pal.primary, secondaryColor: pal.secondary })}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                      <div className="flex gap-1 shrink-0">
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: pal.primary }} />
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: pal.secondary }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{pal.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LOGIN DE SEGURIDAD */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X size={24} />
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Acceso de Seguridad</h2>
              <p className="text-gray-500 text-sm mt-1">Inserta el PIN del dueño de la tienda para realizar cambios.</p>
            </div>
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-4">
                <input 
                  type="password" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors font-mono"
                  autoFocus
                />
                {loginError && <p className="text-red-500 text-sm text-center mt-2">PIN incorrecto. Intenta nuevamente.</p>}
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md">
                Desbloquear Consola
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE AGREGAR/EDITAR PRODUCTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsProductModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-950 bg-gray-100 rounded-full p-1">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-5">
              
              {/* Fotos Múltiples (Máximo 4) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Fotos del producto (Máximo 4)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {(productFormData.images || []).map((imgBase64, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={imgBase64} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedImages = productFormData.images.filter((_, i) => i !== idx);
                          setProductFormData({ ...productFormData, images: updatedImages });
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow-sm"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {(!productFormData.images || productFormData.images.length < 4) && (
                    <div 
                      onClick={() => productInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 h-full min-h-[70px] aspect-square"
                    >
                      <Plus size={18} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={productInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const base64 = await compressAndConvertImage(file, 500, 500, 0.6);
                        const currentImages = productFormData.images || [];
                        setProductFormData({ ...productFormData, images: [...currentImages, base64] });
                      } catch (err) {
                        console.error(err);
                      }
                    }
                    e.target.value = ''; 
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                <input required type="text" value={productFormData.name} onChange={(e) => setProductFormData({...productFormData, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Precio (COP)</label>
                <input required type="number" value={productFormData.price} onChange={(e) => setProductFormData({...productFormData, price: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea rows="3" value={productFormData.description} onChange={(e) => setProductFormData({...productFormData, description: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all text-sm" />
              </div>

              <div className="flex gap-2 pt-2">
                 <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-700">Cancelar</button>
                 <button type="submit" className="flex-1 py-3 text-white rounded-xl font-bold text-sm shadow-md" style={{ backgroundColor: storeInfo.primaryColor }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR RESEÑAS */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-1">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Añadir Reseña de Cliente</h2>
            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                <input required type="text" value={reviewFormData.author} onChange={(e) => setReviewFormData({...reviewFormData, author: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm" placeholder="Ej: Juan P." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Calificación (Estrellas)</label>
                <select value={reviewFormData.rating} onChange={(e) => setReviewFormData({...reviewFormData, rating: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-xl text-sm">
                  <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ (4/5)</option>
                  <option value="3">⭐⭐⭐ (3/5)</option>
                </select>
              </div>

              {}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Captura de WhatsApp (Opcional)</label>
                <div className="flex items-center gap-3">
                  {reviewFormData.image ? (
                    <div className="relative w-16 h-28 rounded-lg overflow-hidden border border-gray-200">
                      <img src={reviewFormData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setReviewFormData({...reviewFormData, image: ''})}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow-sm"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.onchange = async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              // Las capturas de WhatsApp móviles son largas verticales
                              const base64 = await compressAndConvertImage(file, 360, 640, 0.6);
                              setReviewFormData({...reviewFormData, image: base64});
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        };
                        fileInput.click();
                      }}
                      className="border border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 flex-1 min-h-[80px]"
                    >
                      <Camera size={24} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 font-semibold">Cargar Captura de Chat</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Opinión</label>
                <textarea required rows="3" value={reviewFormData.text} onChange={(e) => setReviewFormData({...reviewFormData, text: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm resize-none" placeholder="Lo que dijo el cliente..." />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md">Publicar Opinión</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Info className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Acción</h3>
            <p className="text-sm text-gray-500 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog({ isOpen: false, action: null, message: '' })} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium">Cancelar</button>
              <button onClick={confirmDialog.action} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium shadow-sm">Proceder</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELEGANTE DE POLÍTICAS (HABEAS DATA Y GARANTÍAS) */}
      {activePolicyModal && (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative max-h-[85vh] flex flex-col">
            
            <button 
              onClick={() => setActivePolicyModal(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-2"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto pr-2 space-y-5">
              {activePolicyModal === 'privacy' ? (
                <>
                  <div className="flex items-center gap-3 text-blue-600 mb-2">
                    <ShieldCheck size={32} />
                    <h2 className="text-2xl font-bold text-gray-950">Política de Privacidad</h2>
                  </div>
                  <p className="text-xs text-gray-400">Última actualización: {new Date().toLocaleDateString('es-CO')}</p>
                  
                  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                    <p>
                      En <b>{storeInfo.name}</b>, valoramos y respetamos tu privacidad. Esta política detalla cómo tratamos tu información en cumplimiento de la <b>Ley 1581 de 2012 (Habeas Data de Colombia)</b>.
                    </p>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">1. Recolección de Datos</h4>
                      <p>
                        Únicamente recopilamos los datos que voluntariamente nos proporcionas al momento de iniciar una cotización o entablar contacto vía WhatsApp, tales como: nombre, número de teléfono y producto de interés.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">2. Uso de la Información</h4>
                      <p>
                        La información se utiliza con la única finalidad de brindarte asesoría personalizada, coordinar la entrega de tus pedidos y resolver soporte técnico de los productos adquiridos. No compartimos tus datos con terceros bajo ninguna circunstancia.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">3. Meta Pixel (Seguimiento)</h4>
                      <p>
                        Este sitio web utiliza la tecnología de rastreo de <b>Meta Pixel</b> para medir el rendimiento de nuestros anuncios en Facebook e Instagram y optimizar nuestro catálogo. Meta puede procesar datos de navegación generales para personalizar tu experiencia publicitaria de forma anónima.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">4. Tus Derechos</h4>
                      <p>
                        Tienes derecho a conocer, actualizar y rectificar tus datos personales en cualquier momento. Si deseas que eliminemos tu registro de contacto, puedes solicitarlo de forma gratuita escribiéndonos directamente a <b>{storeInfo.email}</b>.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-pink-600 mb-2">
                    <Truck size={32} />
                    <h2 className="text-2xl font-bold text-gray-950">Envíos y Garantías</h2>
                  </div>
                  <p className="text-xs text-gray-400">Tu tranquilidad es nuestra prioridad</p>
                  
                  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">🚚 Políticas de Envío Nacional</h4>
                      <p>
                        Realizamos despachos diarios a nivel nacional en Colombia utilizando transportadoras de confianza (Servientrega, Interrapidisimo, Envía).
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><b>Tiempos de Entrega:</b> Ciudades principales de 1 a 3 días hábiles. Regiones apartadas de 3 a 5 días hábiles.</li>
                        <li><b>Número de Guía:</b> Te proporcionaremos el número de guía inmediatamente después del despacho para que rastrees tu paquete en tiempo real.</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">🛡️ Términos de Garantía de Tecnología</h4>
                      <p>
                        Todos nuestros dispositivos cuentan con garantía oficial para brindarte seguridad completa con tu inversión:
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>La garantía cubre estrictamente <b>defectos de fábrica</b> (problemas de encendido, fallas en la batería o problemas del software nativo).</li>
                        <li>No cubre daños causados por mal uso, golpes, humedad o manipulación por personal no autorizado.</li>
                        <li>Para hacer efectiva una garantía, escríbenos a nuestro WhatsApp principal (<b>+{storeInfo.phone}</b>) presentando tu comprobante de compra.</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setActivePolicyModal(null)}
              className="mt-6 w-full py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-colors shadow-md shrink-0"
            >
              Entendido, Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}