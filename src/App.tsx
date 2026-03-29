import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eraser, 
  Paintbrush, 
  Trash2, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Palette,
  CheckCircle2,
  Undo2,
  Layers,
  Plus,
  Eye,
  EyeOff,
  Type as TypeIcon,
  X,
  Cloud,
  Grid,
  Hash,
  Sparkles,
  Square,
  Grid3X3,
  CloudDrizzle,
  Waves,
  Circle,
  Sliders,
  Maximize,
  Minimize,
  MoveRight,
  Target,
  PaintBucket,
  Save,
  FolderOpen
} from 'lucide-react';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

const COLORS = [
  // Rainbow
  "#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF",
  // Neon/Bright
  "#FF1493", "#00FFFF", "#7FFF00", "#FFD700", "#FF4500", "#1E90FF", "#FFFFFF",
  // Pastels
  "#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", "#C7CEEA", "#FF9AA2", "#FFB7E2",
  // Earth/Dark
  "#000000", "#808080", "#A52A2A", "#2F4F4F", "#556B2F", "#483D8B", "#8B4513",
  // Cyber/Neon
  "#08F7FE", "#09FBD3", "#FE53BB", "#F5D300", "#FFACFC", "#F148FB", "#7122FA", "#560A86",
  // Grays
  "#F2F2F2", "#D9D9D9", "#BFBFBF", "#A6A6A6", "#8C8C8C", "#737373", "#595959", "#404040",
  // More Varieties
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#82E0AA"
];

const BRUSH_SIZES = [5, 10, 20, 40];

const FONT_STYLES = [
  { id: 'classic', name: 'Classic', family: "'Permanent Marker', cursive" },
  { id: 'brooklyn', name: 'Brooklyn', family: "'Sedgwick Ave', cursive" },
  { id: 'brooklyn-bold', name: 'B-Bold', family: "'Sedgwick Ave Display', cursive" },
  { id: 'gritty', name: 'Gritty', family: "'Rock Salt', cursive" },
  { id: 'pop', name: 'Pop Art', family: "'Bangers', cursive" },
];

// IndexedDB helper for fonts
const DB_NAME = 'GraffitiFontsDB';
const STORE_NAME = 'fonts';

const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveFontToDB = async (font: { id: string, name: string, data: ArrayBuffer }) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.put(font);
};

const getFontsFromDB = async () => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return new Promise<any[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const BRUSH_EFFECTS = [
  { id: 'none', name: 'Standard', icon: Paintbrush },
  { id: 'glow', name: 'Neon Glow', icon: Palette },
  { id: 'spray', name: 'Spray', icon: Cloud },
  { id: 'dots', name: 'Dots', icon: Grid },
  { id: 'hatch', name: 'Hatch', icon: Hash },
  { id: 'splatter', name: 'Splatter', icon: Sparkles },
  { id: 'brick', name: 'Brick', icon: Square },
  { id: 'checkered', name: 'Checkered', icon: Grid3X3 },
  { id: 'noise', name: 'Noise', icon: CloudDrizzle },
  { id: 'waves', name: 'Waves', icon: Waves },
  { id: 'outline', name: 'Outline', icon: Circle },
  { id: 'shadow', name: 'Shadow', icon: ChevronRight },
];

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  dataUrl: string | null;
}

interface SavedArtwork {
  id: string;
  name: string;
  timestamp: number;
  layers: Layer[];
  brushSettings: {
    color: string;
    brushSize: number;
    brushOpacity: number;
    brushFlow: number;
    brushSoftness: number;
    brushEffect: string;
    effectIntensity: number;
    effectSpread: number;
    effectThickness: number;
  };
  gradientSettings: {
    gradientType: 'linear' | 'radial';
    gradientColor1: string;
    gradientColor2: string;
    gradientAngle: number;
  };
  selectedChar: string | null;
  fontStyle: { id: string; name: string; family: string };
  fontSize: number;
}

export default function App() {
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [isCustomTextModalOpen, setIsCustomTextModalOpen] = useState(false);
  const [customTextInput, setCustomTextInput] = useState("");
  
  const [fonts, setFonts] = useState(FONT_STYLES);
  const [fontStyle, setFontStyle] = useState(fonts[0]);
  const [hoveredFontStyle, setHoveredFontStyle] = useState<typeof FONT_STYLES[0] | null>(null);
  const [fontSize, setFontSize] = useState(300);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(20);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushFlow, setBrushFlow] = useState(1);
  const [brushSoftness, setBrushSoftness] = useState(0);
  const [brushEffect, setBrushEffect] = useState('none');
  const [effectIntensity, setEffectIntensity] = useState(15);
  const [effectSpread, setEffectSpread] = useState(20);
  const [effectThickness, setEffectThickness] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'colors' | 'layers' | 'gradients' | 'projects'>('colors');
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientColor1, setGradientColor1] = useState('#FF6321');
  const [gradientColor2, setGradientColor2] = useState('#141414');
  const [gradientAngle, setGradientAngle] = useState(90);
  
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'layer-1', name: 'Layer 1', visible: true, opacity: 1, dataUrl: null }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedArtworks, setSavedArtworks] = useState<SavedArtwork[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newArtworkName, setNewArtworkName] = useState("");
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const renderAllLayers = React.useCallback(async () => {
    if (!contextRef.current || !canvasRef.current) return;
    const ctx = contextRef.current;
    const canvas = canvasRef.current;

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all visible layers
    for (const layer of layers) {
      if (layer.visible && layer.dataUrl) {
        ctx.globalAlpha = layer.opacity;
        const img = new Image();
        img.src = layer.dataUrl;
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
            resolve(null);
          };
          img.onerror = () => resolve(null);
        });
      }
    }
    ctx.globalAlpha = 1.0;
  }, [layers]);

  useEffect(() => {
    if (selectedChar) {
      renderAllLayers();
    }
  }, [renderAllLayers, selectedChar]);

  // Initialize canvas
  useEffect(() => {
    if (selectedChar && canvasRef.current) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const context = canvas.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.lineCap = "round";
        context.lineJoin = "round";
        contextRef.current = context;
      }
    }
  }, [selectedChar]);

  useEffect(() => {
    const saved = localStorage.getItem('graffiti_artworks');
    if (saved) {
      try {
        setSavedArtworks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved artworks", e);
      }
    }

    const savedColors = localStorage.getItem('graffiti_recent_colors');
    if (savedColors) {
      try {
        setRecentColors(JSON.parse(savedColors));
      } catch (e) {
        console.error("Failed to load recent colors", e);
      }
    }

    // Load custom fonts from IndexedDB
    const loadCustomFonts = async () => {
      try {
        const customFonts = await getFontsFromDB();
        for (const font of customFonts) {
          const fontFace = new FontFace(font.name, font.data);
          const loadedFace = await fontFace.load();
          document.fonts.add(loadedFace);
          
          const newFont = {
            id: font.id,
            name: font.name,
            family: `"${font.name}", sans-serif`
          };
          
          setFonts(prev => {
            if (prev.some(f => f.id === newFont.id)) return prev;
            return [...prev, newFont];
          });
        }
      } catch (err) {
        console.error("Failed to load custom fonts from DB", err);
      }
    };
    loadCustomFonts();
  }, []);

  const saveCurrentArtwork = () => {
    if (!newArtworkName.trim()) return;
    
    // Update current layer with canvas data before saving
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      const updatedLayers = layers.map(l => l.id === activeLayerId ? { ...l, dataUrl } : l);
      
      const newArtwork: SavedArtwork = {
        id: Date.now().toString(),
        name: newArtworkName,
        timestamp: Date.now(),
        layers: updatedLayers,
        brushSettings: {
          color,
          brushSize,
          brushOpacity,
          brushFlow,
          brushSoftness,
          brushEffect,
          effectIntensity,
          effectSpread,
          effectThickness
        },
        gradientSettings: {
          gradientType,
          gradientColor1,
          gradientColor2,
          gradientAngle
        },
        selectedChar,
        fontStyle,
        fontSize
      };
      
      const updatedArtworks = [newArtwork, ...savedArtworks];
      setSavedArtworks(updatedArtworks);
      localStorage.setItem('graffiti_artworks', JSON.stringify(updatedArtworks));
      setIsSaveModalOpen(false);
      setNewArtworkName("");
    }
  };

  const loadSavedArtwork = (artwork: SavedArtwork) => {
    setLayers(artwork.layers);
    setActiveLayerId(artwork.layers[0].id);
    setColor(artwork.brushSettings.color);
    setBrushSize(artwork.brushSettings.brushSize);
    setBrushOpacity(artwork.brushSettings.brushOpacity);
    setBrushFlow(artwork.brushSettings.brushFlow);
    setBrushSoftness(artwork.brushSettings.brushSoftness);
    setBrushEffect(artwork.brushSettings.brushEffect);
    setEffectIntensity(artwork.brushSettings.effectIntensity);
    setEffectSpread(artwork.brushSettings.effectSpread);
    setEffectThickness(artwork.brushSettings.effectThickness);
    setGradientType(artwork.gradientSettings.gradientType);
    setGradientColor1(artwork.gradientSettings.gradientColor1);
    setGradientColor2(artwork.gradientSettings.gradientColor2);
    setGradientAngle(artwork.gradientSettings.gradientAngle);
    setSelectedChar(artwork.selectedChar);
    setFontStyle(artwork.fontStyle);
    setFontSize(artwork.fontSize);
    
    // After setting layers, the useEffect will trigger renderAllLayers
    setActiveTab('layers');
  };

  const deleteSavedArtwork = (id: string) => {
    const updatedArtworks = savedArtworks.filter(a => a.id !== id);
    setSavedArtworks(updatedArtworks);
    localStorage.setItem('graffiti_artworks', JSON.stringify(updatedArtworks));
  };

  const addToRecentColors = (newColor: string) => {
    if (newColor === 'transparent') return;
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== newColor);
      const updated = [newColor, ...filtered].slice(0, 10);
      localStorage.setItem('graffiti_recent_colors', JSON.stringify(updated));
      return updated;
    });
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      const fontName = file.name.split('.')[0];
      const fontId = `custom-${Date.now()}`;
      
      try {
        const fontFace = new FontFace(fontName, arrayBuffer);
        const loadedFace = await fontFace.load();
        document.fonts.add(loadedFace);
        
        const newFont = {
          id: fontId,
          name: fontName,
          family: `"${fontName}", sans-serif`
        };
        
        setFonts(prev => {
          if (prev.some(f => f.name === fontName)) return prev;
          return [...prev, newFont];
        });
        setFontStyle(newFont);
        
        // Save to IndexedDB for persistence
        await saveFontToDB({ id: fontId, name: fontName, data: arrayBuffer });
      } catch (err) {
        console.error("Failed to load font", err);
        alert("Failed to load font file. Please try a different format (.ttf, .otf, .woff).");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const applyBrushEffects = (ctx: CanvasRenderingContext2D) => {
    if (isEraser) {
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      return;
    }

    switch (brushEffect) {
      case 'glow':
        ctx.shadowBlur = effectIntensity;
        ctx.shadowColor = color;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        break;
      case 'shadow':
        ctx.shadowBlur = effectIntensity / 2;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowOffsetX = effectIntensity / 3;
        ctx.shadowOffsetY = effectIntensity / 3;
        break;
      case 'outline':
        ctx.shadowBlur = Math.max(1, effectThickness);
        ctx.shadowColor = '#000000';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        break;
      default:
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!contextRef.current) return;
    
    if (!isEraser) {
      addToRecentColors(color);
    }

    const { x, y } = getCoordinates(e);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const getPattern = (type: string, color: string) => {
    if (!contextRef.current) return color;
    const patternCanvas = document.createElement('canvas');
    const pCtx = patternCanvas.getContext('2d');
    if (!pCtx) return color;

    if (type === 'dots') {
      patternCanvas.width = 12;
      patternCanvas.height = 12;
      pCtx.fillStyle = color;
      pCtx.beginPath();
      pCtx.arc(6, 6, 2, 0, Math.PI * 2);
      pCtx.fill();
    } else if (type === 'hatch') {
      patternCanvas.width = 10;
      patternCanvas.height = 10;
      pCtx.strokeStyle = color;
      pCtx.lineWidth = effectThickness;
      pCtx.beginPath();
      pCtx.moveTo(0, 10);
      pCtx.lineTo(10, 0);
      pCtx.stroke();
    } else if (type === 'brick') {
      patternCanvas.width = 20;
      patternCanvas.height = 20;
      pCtx.strokeStyle = color;
      pCtx.lineWidth = 1;
      pCtx.strokeRect(0, 0, 20, 10);
      pCtx.strokeRect(-10, 10, 20, 10);
      pCtx.strokeRect(10, 10, 20, 10);
    } else if (type === 'checkered') {
      patternCanvas.width = 16;
      patternCanvas.height = 16;
      pCtx.fillStyle = color;
      pCtx.fillRect(0, 0, 8, 8);
      pCtx.fillRect(8, 8, 8, 8);
    } else if (type === 'noise') {
      patternCanvas.width = 4;
      patternCanvas.height = 4;
      pCtx.fillStyle = color;
      for (let i = 0; i < 4; i++) {
        pCtx.fillRect(Math.random() * 4, Math.random() * 4, 1, 1);
      }
    } else if (type === 'waves') {
      patternCanvas.width = 20;
      patternCanvas.height = 10;
      pCtx.strokeStyle = color;
      pCtx.lineWidth = 1.5;
      pCtx.beginPath();
      pCtx.moveTo(0, 5);
      pCtx.bezierCurveTo(5, 0, 15, 10, 20, 5);
      pCtx.stroke();
    }
    
    const pattern = contextRef.current.createPattern(patternCanvas, 'repeat');
    return pattern || color;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !contextRef.current) return;
    
    const { x, y } = getCoordinates(e);
    const ctx = contextRef.current;
    
    if (brushEffect === 'spray' && !isEraser) {
      ctx.fillStyle = color;
      ctx.globalAlpha = brushOpacity * brushFlow;
      for (let i = 0; i < brushSize * 2; i++) {
        const offset = Math.random() * effectSpread;
        const angle = Math.random() * Math.PI * 2;
        const dotX = x + Math.cos(angle) * offset;
        const dotY = y + Math.sin(angle) * offset;
        const dotSize = Math.random() * 2;
        ctx.fillRect(dotX, dotY, dotSize, dotSize);
      }
      return;
    }

    if (brushEffect === 'splatter' && !isEraser) {
      ctx.fillStyle = color;
      ctx.globalAlpha = brushOpacity * brushFlow;
      const splatterCount = Math.floor(brushSize / 2);
      for (let i = 0; i < splatterCount; i++) {
        const offset = Math.random() * effectSpread * 1.5;
        const angle = Math.random() * Math.PI * 2;
        const dotX = x + Math.cos(angle) * offset;
        const dotY = y + Math.sin(angle) * offset;
        const dotSize = Math.random() * (brushSize / 3);
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    ctx.lineTo(x, y);
    
    let finalStrokeStyle: string | CanvasPattern | CanvasGradient = isEraser ? "white" : color;

    if (!isEraser && activeTab === 'gradients') {
      const canvas = canvasRef.current!;
      const width = canvas.width / 2;
      const height = canvas.height / 2;

      if (gradientType === 'linear') {
        const rad = (gradientAngle * Math.PI) / 180;
        const cx = width / 2;
        const cy = height / 2;
        const r = Math.sqrt(cx * cx + cy * cy);
        const x1 = cx - Math.cos(rad) * r;
        const y1 = cy - Math.sin(rad) * r;
        const x2 = cx + Math.cos(rad) * r;
        const y2 = cy + Math.sin(rad) * r;
        
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, gradientColor1);
        grad.addColorStop(1, gradientColor2);
        finalStrokeStyle = grad;
      } else {
        const cx = width / 2;
        const cy = height / 2;
        const r = Math.max(width, height) / 2;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, gradientColor1);
        grad.addColorStop(1, gradientColor2);
        finalStrokeStyle = grad;
      }
    } else if (!isEraser && ['dots', 'hatch', 'brick', 'checkered', 'noise', 'waves'].includes(brushEffect)) {
      finalStrokeStyle = getPattern(brushEffect, color);
    }

    ctx.strokeStyle = finalStrokeStyle;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = isEraser ? 1 : brushOpacity * brushFlow;
    
    if (brushSoftness > 0) {
      ctx.shadowBlur = brushSoftness;
      ctx.shadowColor = isEraser ? "white" : (typeof finalStrokeStyle === 'string' ? finalStrokeStyle : color);
    } else {
      applyBrushEffects(ctx);
    }
    
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    contextRef.current?.closePath();
    
    // Update current layer data
    const dataUrl = canvasRef.current.toDataURL();
    setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, dataUrl } : l));
    
    // Save to history (simplified for layers)
    const newHistory = [...history, dataUrl];
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
  };

  const addLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer: Layer = { id: newId, name: `Layer ${layers.length + 1}`, visible: true, opacity: 1, dataUrl: null };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newId);
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === id);
    if (index === -1) return;
    
    const newLayers = [...layers];
    if (direction === 'up' && index < layers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    } else if (direction === 'down' && index > 0) {
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    }
    setLayers(newLayers);
  };

  const setLayerOpacity = (id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
  };

  const renameLayer = (id: string, newName: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
  };

  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(layers.find(l => l.id !== id)?.id || '');
    }
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, dataUrl: null } : l));
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    const prevState = newHistory[newHistory.length - 1];
    setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, dataUrl: prevState } : l));
    setHistory(newHistory);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw background and all layers
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // We need to draw layers in order
    const drawLayers = async () => {
      for (const layer of layers) {
        if (layer.visible && layer.dataUrl) {
          const img = new Image();
          img.src = layer.dataUrl;
          await new Promise(resolve => {
            img.onload = () => {
              tempCtx.drawImage(img, 0, 0);
              resolve(null);
            };
          });
        }
      }

      // Draw the character outline on top
      tempCtx.scale(2, 2);
      const displayFont = fontStyle.family;
      tempCtx.font = `bold ${fontSize}px ${displayFont}`;
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";
      tempCtx.strokeStyle = "black";
      tempCtx.lineWidth = 8;
      
      // Adjust font size for longer custom text if it exceeds canvas
      let finalFontSize = fontSize;
      if (selectedChar!.length > 1) {
        finalFontSize = Math.min(fontSize, Math.max(100, (300 * 2.5) / (selectedChar!.length * 0.8)));
      }
      tempCtx.font = `bold ${finalFontSize}px ${displayFont}`;
      
      tempCtx.strokeText(selectedChar!, tempCanvas.width / 4, tempCanvas.height / 4);

      const link = document.createElement('a');
      link.download = `graffiti-${selectedChar}.png`;
      link.href = tempCanvas.toDataURL();
      link.click();
    };

    drawLayers();
  };

  const handleCustomTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTextInput.trim()) {
      setSelectedChar(customTextInput.trim());
      setIsCustomTextModalOpen(false);
      setCustomTextInput("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 font-sans select-none">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Paintbrush className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Graffiti <span className="text-orange-500">Color</span></h1>
        </div>
        
        {selectedChar && (
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 bg-zinc-800 p-1 rounded-lg mr-2">
              {fonts.map(style => (
                <button
                  key={style.id}
                  onClick={() => setFontStyle(style)}
                  onMouseEnter={() => setHoveredFontStyle(style)}
                  onMouseLeave={() => setHoveredFontStyle(null)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all relative group ${fontStyle.id === style.id ? 'bg-orange-500 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {style.name}
                  {/* Tooltip Preview */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <div className="bg-zinc-900 border border-zinc-700 p-2 rounded-lg shadow-xl flex items-center justify-center min-w-[60px] min-h-[60px]">
                      <span style={{ fontFamily: style.family }} className="text-2xl text-white">
                        {selectedChar.length > 1 ? selectedChar.substring(0, 1) : selectedChar}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              <label className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-all flex items-center gap-1">
                <Plus size={14} />
                <input 
                  type="file" 
                  accept=".ttf,.otf,.woff,.woff2" 
                  className="hidden" 
                  onChange={handleFontUpload}
                />
              </label>
            </div>
            <button 
              onClick={undo}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              title="Undo"
            >
              <Undo2 size={20} />
            </button>
            <button 
              onClick={clearCanvas}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
              title="Clear"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={() => setIsSaveModalOpen(true)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
              title="Save Project"
            >
              <Save size={20} />
            </button>
            <button 
              onClick={downloadImage}
              className="p-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors text-white shadow-lg shadow-orange-500/20"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              title="Layers & Colors"
            >
              <Layers size={20} />
            </button>
            <button 
              onClick={() => setSelectedChar(null)}
              className="ml-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              Menu
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {!selectedChar ? (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 p-6 overflow-y-auto no-scrollbar"
            >
              <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">Pick a Character</h2>
                  <p className="text-zinc-400">Choose an alphabet or number to start coloring</p>
                  
                  {/* Font Selector in Main Menu */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {fonts.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setFontStyle(style)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${fontStyle.id === style.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
                      >
                        {style.name}
                      </button>
                    ))}
                    <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-900 text-zinc-500 hover:bg-zinc-800 transition-all flex items-center gap-2">
                      <Plus size={14} />
                      Add Font
                      <input 
                        type="file" 
                        accept=".ttf,.otf,.woff,.woff2" 
                        className="hidden" 
                        onChange={handleFontUpload}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCustomTextModalOpen(true)}
                    className="aspect-square bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-1 text-zinc-400 hover:border-orange-500 hover:text-orange-500 transition-all"
                  >
                    <TypeIcon size={32} />
                    <span className="text-[10px] font-bold uppercase">Custom</span>
                  </motion.button>

                  {ALPHABET.map((char) => (
                    <motion.button
                      key={char}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedChar(char)}
                      className="aspect-square bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-4xl text-white hover:border-orange-500 hover:bg-zinc-800 transition-all shadow-lg"
                      style={{ fontFamily: fontStyle.family }}
                    >
                      {char}
                    </motion.button>
                  ))}
                </div>

                {savedArtworks.length > 0 && (
                  <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Recent Projects</h3>
                      <button 
                        onClick={() => {
                          setSelectedChar("A"); // Just to enter editor
                          setActiveTab('projects');
                        }}
                        className="text-orange-500 text-xs font-bold uppercase hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {savedArtworks.slice(0, 4).map(artwork => (
                        <motion.button
                          key={artwork.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => loadSavedArtwork(artwork)}
                          className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-500 transition-all text-left"
                        >
                          <div className="aspect-video bg-zinc-950 relative overflow-hidden">
                            {artwork.layers.find(l => l.dataUrl)?.dataUrl && (
                              <img 
                                src={artwork.layers.find(l => l.dataUrl)?.dataUrl || ""} 
                                alt={artwork.name}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-bold text-white truncate">{artwork.name}</p>
                            <p className="text-[10px] text-zinc-500">{new Date(artwork.timestamp).toLocaleDateString()}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Artwork Modal */}
        <AnimatePresence>
          {isSaveModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Save Artwork</h3>
                  <button onClick={() => setIsSaveModalOpen(false)} className="text-zinc-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <div className="mb-6">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">Project Name</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newArtworkName}
                    onChange={(e) => setNewArtworkName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-orange-500"
                    maxLength={30}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveCurrentArtwork();
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsSaveModalOpen(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveCurrentArtwork}
                    disabled={!newArtworkName.trim()}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                  >
                    Save Project
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Text Modal */}
              <AnimatePresence>
                {isCustomTextModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Enter Your Text</h3>
                        <button onClick={() => setIsCustomTextModalOpen(false)} className="text-zinc-500 hover:text-white">
                          <X size={24} />
                        </button>
                      </div>
                      <form onSubmit={handleCustomTextSubmit}>
                        <div className="mb-6 flex flex-col items-center justify-center bg-zinc-800/50 rounded-2xl p-6 border border-zinc-800 min-h-[120px]">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Font Preview</span>
                          <div className="text-5xl text-white text-center break-all" style={{ fontFamily: fontStyle.family }}>
                            {customTextInput || "Graffiti"}
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1 mb-6">
                          {fonts.map(style => (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setFontStyle(style)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${fontStyle.id === style.id ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
                            >
                              {style.name}
                            </button>
                          ))}
                          <label className="cursor-pointer px-2 py-1 rounded-lg text-[9px] font-bold uppercase bg-zinc-800 text-zinc-500 hover:text-white flex items-center gap-1">
                            <Plus size={10} />
                            <input 
                              type="file" 
                              accept=".ttf,.otf,.woff,.woff2" 
                              className="hidden" 
                              onChange={handleFontUpload}
                            />
                          </label>
                        </div>
                        <input 
                          autoFocus
                          type="text"
                          value={customTextInput}
                          onChange={(e) => setCustomTextInput(e.target.value)}
                          placeholder="Type something..."
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-orange-500 mb-6"
                          style={{ fontFamily: fontStyle.family }}
                          maxLength={15}
                        />
                        <button 
                          type="submit"
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                        >
                          Start Coloring
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="canvas"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 flex flex-col md:flex-row"
            >
              {/* Left Toolbar - Desktop */}
              <div className="hidden md:flex flex-col gap-4 p-4 bg-zinc-900 border-r border-zinc-800 w-24 items-center overflow-y-auto no-scrollbar">
                <div className="flex flex-col gap-2 w-full">
                  <button 
                    onClick={() => setIsEraser(false)}
                    className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${!isEraser ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/50'}`}
                  >
                    <Paintbrush size={20} />
                    <span className="text-[10px] font-bold uppercase">Draw</span>
                  </button>
                  <button 
                    onClick={() => setIsEraser(true)}
                    className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${isEraser ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/50'}`}
                  >
                    <Eraser size={20} />
                    <span className="text-[10px] font-bold uppercase">Eraser</span>
                  </button>
                </div>

                <div className="h-px w-full bg-zinc-800" />

                <div className="flex flex-col gap-3 items-center w-full px-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Preview</span>
                  <div className="w-16 h-16 bg-white rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden relative">
                    <div 
                      className="rounded-full"
                      style={{ 
                        width: brushSize, 
                        height: brushSize, 
                        backgroundColor: isEraser ? '#e5e7eb' : color,
                        opacity: brushOpacity * brushFlow,
                        boxShadow: brushSoftness > 0 ? `0 0 ${brushSoftness}px ${isEraser ? '#e5e7eb' : color}` : 'none',
                        filter: brushSoftness > 0 ? `blur(${brushSoftness / 4}px)` : 'none'
                      }}
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-zinc-800" />
                
                <div className="flex flex-col gap-3 items-center w-full px-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Brush</span>
                  {BRUSH_SIZES.map(size => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`rounded-full transition-all border-2 ${brushSize === size ? 'border-orange-500 scale-110' : 'border-transparent'}`}
                    >
                      <div 
                        className="bg-zinc-400 rounded-full" 
                        style={{ width: Math.max(8, size / 1.5), height: Math.max(8, size / 1.5) }} 
                      />
                    </button>
                  ))}
                </div>

                <div className="h-px w-full bg-zinc-800" />

                <div className="flex flex-col gap-3 items-center w-full px-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Opacity</span>
                  <div className="h-20 flex items-center justify-center">
                    <input 
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={brushOpacity}
                      onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                      className="accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer -rotate-90 w-16"
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-zinc-800" />

                <div className="flex flex-col gap-3 items-center w-full px-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Flow</span>
                  <div className="h-20 flex items-center justify-center">
                    <input 
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={brushFlow}
                      onChange={(e) => setBrushFlow(parseFloat(e.target.value))}
                      className="accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer -rotate-90 w-16"
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-zinc-800" />

                <div className="flex flex-col gap-3 items-center w-full px-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Softness</span>
                  <div className="h-20 flex items-center justify-center">
                    <input 
                      type="range"
                      min="0"
                      max="50"
                      value={brushSoftness}
                      onChange={(e) => setBrushSoftness(parseInt(e.target.value))}
                      className="accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer -rotate-90 w-16"
                    />
                  </div>
                </div>

                {brushEffect !== 'none' && !isEraser && (
                  <>
                    <div className="h-px w-full bg-zinc-800" />
                    <div className="flex flex-col gap-3 items-center w-full px-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">Effect Settings</span>
                      
                      {['glow', 'shadow'].includes(brushEffect) && (
                        <div className="flex flex-col gap-2 items-center w-full">
                          <span className="text-[8px] font-bold text-zinc-600 uppercase">Intensity</span>
                          <div className="h-20 flex items-center justify-center">
                            <input 
                              type="range"
                              min="5"
                              max="50"
                              value={effectIntensity}
                              onChange={(e) => setEffectIntensity(parseInt(e.target.value))}
                              className="accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer -rotate-90 w-16"
                            />
                          </div>
                        </div>
                      )}

                      {['spray', 'splatter'].includes(brushEffect) && (
                        <div className="flex flex-col gap-2 items-center w-full">
                          <span className="text-[8px] font-bold text-zinc-600 uppercase">Spread</span>
                          <div className="h-20 flex items-center justify-center">
                            <input 
                              type="range"
                              min="5"
                              max="100"
                              value={effectSpread}
                              onChange={(e) => setEffectSpread(parseInt(e.target.value))}
                              className="accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer -rotate-90 w-16"
                            />
                          </div>
                        </div>
                      )}

                      {['outline', 'hatch'].includes(brushEffect) && (
                        <div className="flex flex-col gap-2 items-center w-full">
                          <span className="text-[8px] font-bold text-zinc-600 uppercase">Thickness</span>
                          <div className="h-20 flex items-center justify-center">
                            <input 
                              type="range"
                              min="1"
                              max="10"
                              step="0.5"
                              value={effectThickness}
                              onChange={(e) => setEffectThickness(parseFloat(e.target.value))}
                              className="accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer -rotate-90 w-16"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeTab === 'gradients' && gradientType === 'linear' && (
                  <>
                    <div className="h-px w-full bg-zinc-800" />
                    <div className="flex flex-col gap-3 items-center w-full px-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">Gradient Angle</span>
                      <div className="h-20 flex items-center justify-center">
                        <input 
                          type="range"
                          min="0"
                          max="360"
                          value={gradientAngle}
                          onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                          className="accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer -rotate-90 w-16"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="h-px w-full bg-zinc-800" />

                <div className="flex flex-col gap-3 items-center w-full px-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Text Size</span>
                  <div className="h-24 flex items-center justify-center">
                    <input 
                      type="range"
                      min="100"
                      max="600"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer -rotate-90 w-20"
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-zinc-800" />

                <div className="flex flex-col gap-2 w-full">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase text-center">Effects</span>
                  {BRUSH_EFFECTS.map(effect => (
                    <button
                      key={effect.id}
                      onClick={() => {
                        setBrushEffect(effect.id);
                        setIsEraser(false);
                      }}
                      className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 ${brushEffect === effect.id && !isEraser ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/30'}`}
                      title={effect.name}
                    >
                      <effect.icon size={16} />
                      <span className="text-[8px] font-bold uppercase truncate w-full text-center">{effect.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 relative bg-zinc-800 flex items-center justify-center p-4">
                <div className="relative w-full max-w-2xl aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl cursor-crosshair touch-none">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="absolute inset-0 z-0"
                  />
                  {/* Character Outline Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <span 
                      className="select-none text-transparent text-center px-4 leading-none transition-all duration-200"
                      style={{ 
                        WebkitTextStroke: '4px black',
                        fontFamily: hoveredFontStyle ? hoveredFontStyle.family : fontStyle.family,
                        fontSize: selectedChar!.length > 1 
                          ? `${Math.min(fontSize, Math.max(80, (300 * 2.5) / (selectedChar!.length * 0.8)))}px` 
                          : `${fontSize}px`
                      }}
                    >
                      {selectedChar}
                    </span>
                  </div>
                </div>
                
                {/* Mobile Tools Overlay */}
                <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-3 items-center w-full px-6">
                  {/* Intensity Slider - Mobile */}
                  {brushEffect !== 'none' && !isEraser && (
                    <div className="w-full max-w-xs bg-zinc-900/90 backdrop-blur-md p-3 rounded-xl border border-zinc-800 shadow-xl flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase whitespace-nowrap">Intensity</span>
                      <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        value={effectIntensity}
                        onChange={(e) => setEffectIntensity(parseInt(e.target.value))}
                        className="flex-1 accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Mobile Font Selector */}
                  <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-xl overflow-x-auto no-scrollbar max-w-full">
                    {fonts.map(style => (
                      <button
                        key={style.id}
                        onClick={() => setFontStyle(style)}
                        onMouseEnter={() => setHoveredFontStyle(style)}
                        onMouseLeave={() => setHoveredFontStyle(null)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap transition-all ${fontStyle.id === style.id ? 'bg-orange-500 text-white' : 'text-zinc-500'}`}
                      >
                        {style.name}
                      </button>
                    ))}
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap text-zinc-500 hover:text-white flex items-center gap-1">
                      <Plus size={12} />
                      <input 
                        type="file" 
                        accept=".ttf,.otf,.woff,.woff2" 
                        className="hidden" 
                        onChange={handleFontUpload}
                      />
                    </label>
                  </div>

                  {/* Font Size Slider - Mobile */}
                  <div className="w-full max-w-xs bg-zinc-900/90 backdrop-blur-md p-3 rounded-xl border border-zinc-800 shadow-xl flex items-center gap-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase whitespace-nowrap">Font Size</span>
                    <input 
                      type="range" 
                      min="100" 
                      max="600" 
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="flex-1 accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Mobile Brush Settings Overlay */}
                  <div className="flex flex-col gap-2 w-full max-w-full">
                    <div className="flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        <div 
                          className="rounded-full"
                          style={{ 
                            width: brushSize / 2, 
                            height: brushSize / 2, 
                            background: isEraser ? '#e5e7eb' : (activeTab === 'gradients' ? (gradientType === 'linear' ? `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})` : `radial-gradient(circle, ${gradientColor1}, ${gradientColor2})`) : color),
                            opacity: brushOpacity * brushFlow,
                            boxShadow: brushSoftness > 0 ? `0 0 ${brushSoftness / 2}px ${isEraser ? '#e5e7eb' : color}` : 'none',
                            filter: brushSoftness > 0 ? `blur(${brushSoftness / 8}px)` : 'none'
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1 min-w-[80px]">
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Opacity</span>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="1" 
                          step="0.1"
                          value={brushOpacity}
                          onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                          className="accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col gap-1 min-w-[80px]">
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Flow</span>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="1" 
                          step="0.1"
                          value={brushFlow}
                          onChange={(e) => setBrushFlow(parseFloat(e.target.value))}
                          className="accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col gap-1 min-w-[80px]">
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Softness</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="50" 
                          value={brushSoftness}
                          onChange={(e) => setBrushSoftness(parseInt(e.target.value))}
                          className="accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {brushEffect !== 'none' && !isEraser && (
                      <div className="flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        <div className="flex items-center justify-center w-10 h-10 bg-zinc-800 rounded-lg shrink-0">
                          <Sliders size={18} className="text-orange-500" />
                        </div>
                        
                        {['glow', 'shadow'].includes(brushEffect) && (
                          <div className="flex flex-col gap-1 min-w-[100px]">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Intensity</span>
                            <input 
                              type="range" 
                              min="5" 
                              max="50" 
                              value={effectIntensity}
                              onChange={(e) => setEffectIntensity(parseInt(e.target.value))}
                              className="accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}

                        {['spray', 'splatter'].includes(brushEffect) && (
                          <div className="flex flex-col gap-1 min-w-[100px]">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Spread</span>
                            <input 
                              type="range" 
                              min="5" 
                              max="100" 
                              value={effectSpread}
                              onChange={(e) => setEffectSpread(parseInt(e.target.value))}
                              className="accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}

                        {['outline', 'hatch'].includes(brushEffect) && (
                          <div className="flex flex-col gap-1 min-w-[100px]">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Thickness</span>
                            <input 
                              type="range" 
                              min="1" 
                              max="10" 
                              step="0.5"
                              value={effectThickness}
                              onChange={(e) => setEffectThickness(parseFloat(e.target.value))}
                              className="accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}

                        {activeTab === 'gradients' && gradientType === 'linear' && (
                          <div className="flex flex-col gap-1 min-w-[100px]">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Angle</span>
                            <input 
                              type="range" 
                              min="0" 
                              max="360" 
                              value={gradientAngle}
                              onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                              className="accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 shadow-2xl">
                    <button 
                      onClick={() => setIsEraser(false)}
                      className={`p-2 rounded-lg ${!isEraser ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}
                    >
                      <Paintbrush size={20} />
                    </button>
                    <button 
                      onClick={() => setIsEraser(true)}
                      className={`p-2 rounded-lg ${isEraser ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}
                    >
                      <Eraser size={20} />
                    </button>
                    <div className="w-px h-6 bg-zinc-700 mx-1" />
                    
                    {/* Effect Selector Mobile */}
                    <div className="flex gap-1">
                      {BRUSH_EFFECTS.map(effect => (
                        <button
                          key={effect.id}
                          onClick={() => {
                            setBrushEffect(effect.id);
                            setIsEraser(false);
                          }}
                          className={`p-2 rounded-lg transition-all ${brushEffect === effect.id && !isEraser ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500'}`}
                        >
                          <effect.icon size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Sidebar Backdrop */}
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
                  />
                )}
              </AnimatePresence>

              {/* Right Color Palette & Layers */}
              <div className={`
                fixed md:relative inset-y-0 right-0 z-40
                w-72 md:w-64 bg-zinc-900 border-l border-zinc-800 
                flex flex-col h-full overflow-hidden transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
              `}>
                <div className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setActiveTab('colors')}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg transition-all ${activeTab === 'colors' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-400'}`}
                      >
                        Colors
                      </button>
                      <button 
                        onClick={() => setActiveTab('gradients')}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'gradients' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-400'}`}
                      >
                        Gradients
                      </button>
                      <button 
                        onClick={() => setActiveTab('layers')}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'layers' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-400'}`}
                      >
                        Layers <span className="bg-orange-500 text-[8px] px-1.5 py-0.5 rounded-full text-white leading-none">{layers.length}</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('projects')}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'projects' ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-400'}`}
                      >
                        Projects
                      </button>
                    </div>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="md:hidden p-1 text-zinc-500 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {activeTab === 'colors' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {recentColors.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-3 px-1">Recent Colors</h4>
                        <div className="flex flex-wrap gap-2">
                          {recentColors.map((c, idx) => (
                            <button
                              key={`${c}-${idx}`}
                              onClick={() => {
                                setColor(c);
                                setIsEraser(false);
                                addToRecentColors(c);
                              }}
                              className={`w-8 h-8 rounded-lg transition-all relative ${color === c && !isEraser ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110 z-10' : 'hover:scale-105'}`}
                              style={{ backgroundColor: c }}
                            >
                              {color === c && !isEraser && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <CheckCircle2 size={12} className={c === "#FFFFFF" ? "text-black" : "text-white"} />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-3 px-1">Palette</h4>
                    <div className="grid grid-cols-7 md:grid-cols-4 gap-2 overflow-y-auto no-scrollbar mb-6">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => {
                            setColor(c);
                            setIsEraser(false);
                            addToRecentColors(c);
                          }}
                          className={`aspect-square rounded-xl transition-all relative ${color === c && !isEraser ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110 z-10' : 'hover:scale-105'}`}
                          style={{ backgroundColor: c }}
                        >
                          {color === c && !isEraser && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <CheckCircle2 size={16} className={c === "#FFFFFF" ? "text-black" : "text-white"} />
                            </div>
                          )}
                        </button>
                      ))}
                      {/* Custom Color Picker */}
                      <div className="relative aspect-square group">
                        <input 
                          type="color"
                          value={color}
                          onChange={(e) => {
                            setColor(e.target.value);
                            setIsEraser(false);
                          }}
                          onBlur={(e) => addToRecentColors(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                        />
                        <div className="w-full h-full rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 group-hover:border-orange-500 group-hover:text-orange-500 transition-all">
                          <Plus size={16} />
                          <span className="text-[8px] font-bold uppercase mt-1">Custom</span>
                        </div>
                      </div>
                    </div>

                    {/* Intensity Slider - Desktop */}
                    {brushEffect !== 'none' && !isEraser && (
                      <div className="mt-auto p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Effect Intensity</span>
                          <span className="text-[10px] font-mono text-orange-500">{effectIntensity}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="5" 
                          max="50" 
                          value={effectIntensity}
                          onChange={(e) => setEffectIntensity(parseInt(e.target.value))}
                          className="w-full accent-orange-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                  )}

                  {activeTab === 'gradients' && (
                    <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                      <div className="flex flex-col gap-3">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Gradient Type</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setGradientType('linear')}
                            className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${gradientType === 'linear' ? 'bg-orange-500 border-orange-400 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                          >
                            <MoveRight size={20} />
                            <span className="text-[10px] font-bold uppercase">Linear</span>
                          </button>
                          <button 
                            onClick={() => setGradientType('radial')}
                            className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${gradientType === 'radial' ? 'bg-orange-500 border-orange-400 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                          >
                            <Target size={20} />
                            <span className="text-[10px] font-bold uppercase">Radial</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Colors</span>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 flex flex-col gap-2">
                            <span className="text-[8px] font-bold text-zinc-600 uppercase text-center">Start</span>
                            <div className="relative h-10 w-full rounded-lg overflow-hidden border border-zinc-700">
                              <input 
                                type="color" 
                                value={gradientColor1}
                                onChange={(e) => setGradientColor1(e.target.value)}
                                onBlur={(e) => addToRecentColors(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              />
                              <div className="w-full h-full" style={{ backgroundColor: gradientColor1 }} />
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <span className="text-[8px] font-bold text-zinc-600 uppercase text-center">End</span>
                            <div className="relative h-10 w-full rounded-lg overflow-hidden border border-zinc-700">
                              <input 
                                type="color" 
                                value={gradientColor2}
                                onChange={(e) => setGradientColor2(e.target.value)}
                                onBlur={(e) => addToRecentColors(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              />
                              <div className="w-full h-full" style={{ backgroundColor: gradientColor2 }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {gradientType === 'linear' && (
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase">Angle</span>
                            <span className="text-[10px] font-mono text-orange-500">{gradientAngle}°</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="360"
                            value={gradientAngle}
                            onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                            className="accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="mt-auto p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: gradientType === 'linear' ? `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})` : `radial-gradient(circle, ${gradientColor1}, ${gradientColor2})` }} />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white uppercase">Preview</span>
                          <span className="text-[8px] text-zinc-400 uppercase">{gradientType} Gradient</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'projects' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">Saved Artworks</span>
                        <span className="text-[9px] font-mono text-zinc-600">{savedArtworks.length} Total</span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3">
                        {savedArtworks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FolderOpen size={32} className="text-zinc-800 mb-2" />
                            <p className="text-xs text-zinc-600">No projects saved yet.</p>
                          </div>
                        ) : (
                          savedArtworks.map(artwork => (
                            <div 
                              key={artwork.id}
                              className="group bg-zinc-800/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all"
                            >
                              <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                                {artwork.layers.find(l => l.dataUrl)?.dataUrl && (
                                  <img 
                                    src={artwork.layers.find(l => l.dataUrl)?.dataUrl || ""} 
                                    alt={artwork.name}
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => loadSavedArtwork(artwork)}
                                    className="p-2 bg-orange-500 text-white rounded-lg hover:scale-110 transition-transform"
                                    title="Load"
                                  >
                                    <FolderOpen size={16} />
                                  </button>
                                  <button 
                                    onClick={() => deleteSavedArtwork(artwork.id)}
                                    className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="p-2 flex flex-col">
                                <span className="text-[10px] font-bold text-white truncate">{artwork.name}</span>
                                <span className="text-[8px] text-zinc-500">{new Date(artwork.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <button 
                        onClick={() => setIsSaveModalOpen(true)}
                        className="mt-4 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Save Current
                      </button>
                    </div>
                  )}

                  {activeTab === 'layers' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 mb-4">
                      {layers.slice().reverse().map((layer, index) => (
                        <div 
                          key={layer.id}
                          onClick={() => setActiveLayerId(layer.id)}
                          className={`p-3 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${activeLayerId === layer.id ? 'bg-zinc-800 border-orange-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-md overflow-hidden border border-zinc-700 flex items-center justify-center shrink-0">
                                {layer.dataUrl ? (
                                  <img src={layer.dataUrl} alt={layer.name} className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-full h-full bg-zinc-100" />
                                )}
                              </div>
                              <input 
                                type="text"
                                value={layer.name}
                                onChange={(e) => renameLayer(layer.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className={`text-xs font-bold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-orange-500 rounded px-1 w-24 ${activeLayerId === layer.id ? 'text-white' : 'text-zinc-500'}`}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex flex-col gap-1 mr-1">
                                <button 
                                  disabled={index === 0}
                                  onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }}
                                  className={`p-0.5 rounded hover:bg-zinc-700 disabled:opacity-20 ${activeLayerId === layer.id ? 'text-zinc-300' : 'text-zinc-600'}`}
                                >
                                  <ChevronLeft size={14} className="rotate-90" />
                                </button>
                                <button 
                                  disabled={index === layers.length - 1}
                                  onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }}
                                  className={`p-0.5 rounded hover:bg-zinc-700 disabled:opacity-20 ${activeLayerId === layer.id ? 'text-zinc-300' : 'text-zinc-600'}`}
                                >
                                  <ChevronLeft size={14} className="-rotate-90" />
                                </button>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLayerVisibility(layer.id);
                                }}
                                className="p-1.5 text-zinc-500 hover:text-white"
                              >
                                {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                              {layers.length > 1 && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteLayer(layer.id);
                                  }}
                                  className="p-1.5 text-zinc-500 hover:text-red-400"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                          {activeLayerId === layer.id && (
                            <div className="flex items-center gap-2 px-1 pb-1">
                              <span className="text-[8px] font-bold text-zinc-500 uppercase">Opacity</span>
                              <input 
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={layer.opacity}
                                onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 accent-orange-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-[8px] font-mono text-zinc-400 w-6 text-right">{Math.round(layer.opacity * 100)}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={addLayer}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all border border-zinc-700"
                    >
                      <Plus size={18} />
                      Add New Layer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>

      {/* Footer / Navigation */}
      {!selectedChar && (
        <footer className="p-4 text-center text-zinc-500 text-xs border-t border-zinc-900">
          Created with Graffiti Color Master • {ALPHABET.length} Pages Available
        </footer>
      )}
    </div>
  );
}
