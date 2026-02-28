/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Focus, 
  Maximize, 
  Aperture, 
  Sun,
  Send,
  Image as ImageIcon,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  Film,
  Edit2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Constants & Data ---

const ANGLE_DESCRIPTIONS: Record<string, string> = {
  "Close-Up": "Enquadramento fechado no rosto ou em um objeto específico, enfatizando detalhes e emoções.",
  "Medium Close-Up": "Enquadramento do peito para cima, equilibrando o sujeito com um pouco do ambiente.",
  "Medium Shot": "Enquadramento da cintura para cima, ideal para diálogos e interação com o cenário.",
  "Full Shot": "Mostra o sujeito por inteiro, da cabeça aos pés, focando na sua relação com o espaço.",
  "Wide Shot": "Plano aberto que prioriza o cenário, estabelecendo a localização e a escala da cena.",
  "Over-the-Shoulder": "Filmado por cima do ombro de um personagem, focando no outro, criando profundidade em diálogos.",
  "POV": "Ponto de vista subjetivo, simulando o que o personagem está vendo diretamente.",
  "Ground-level": "Câmera posicionada ao nível do chão, criando uma perspectiva baixa e imersiva.",
  "Bird's-eye / Top-down": "Visão vertical de cima para baixo, oferecendo uma perspectiva de mapa ou divina.",
  "Dutch Tilt": "Câmera inclinada lateralmente, gerando uma sensação de desorientação, tensão ou instabilidade.",
  "Side Profile Shot": "Captura o sujeito de perfil lateral, destacando contornos e silhuetas.",
  "Three-Quarter Shot": "Sujeito posicionado em um ângulo de 45 graus, criando profundidade e volume.",
  "Front-on / Head-on": "Câmera diretamente em frente ao sujeito, criando uma conexão direta e frontal.",
  "Reverse Angle": "Inversão da perspectiva anterior, geralmente usada para mostrar a reação ou o outro lado.",
  "Overhead Top-down": "Similar ao Bird's-eye, mas focado em uma visão técnica e geométrica superior.",
  "Low Angle": "Câmera posicionada abaixo do nível dos olhos, fazendo o sujeito parecer poderoso ou heroico.",
  "High Angle": "Câmera posicionada acima do nível dos olhos, fazendo o sujeito parecer vulnerável ou pequeno.",
  "Shoulder-level Eye Line": "Câmera na altura dos ombros, mantendo uma perspectiva natural de observador.",
  "Knee-level / Hip-level": "Câmera na altura dos joelhos ou quadril, enfatizando movimento ou ação corporal."
};

const CAMERA_SPECS: Record<string, string> = {
  "ARRI ALEXA 35": "body, native ISO 800, shutter angle 180°, aspect ratio 1.33:1",
  "IMAX MK IV 65mm": "body, native ISO 250, shutter angle 180°, aspect ratio 1.43:1",
  "ARRI ALEXA Mini LF": "body, native ISO 800, shutter angle 180°, aspect ratio 1.44:1",
  "ARRI ALEXA 65": "body, native ISO 800, shutter angle 180°, aspect ratio 2.11:1",
  "Sony VENICE": "body, native ISO 500/2500, shutter angle 180°, aspect ratio 1.50:1",
  "RED V-RAPTOR (VV/Full Frame)": "body, native ISO 800, shutter angle 180°, aspect ratio 1.90:1",
  "RED KOMODO 6K": "body, native ISO 800, shutter angle 180°, aspect ratio 1.89:1",
  "Canon C500 Mark II": "body, native ISO 800, shutter angle 180°, aspect ratio 1.89:1",
  "Blackmagic URSA Mini Pro 12K": "body, native ISO 800, shutter angle 180°, aspect ratio 1.89:1",
  "Phantom Flex4K": "body, native ISO 1000, shutter angle 180°, aspect ratio 1.78:1",
  "ARRICAM ST (35mm film)": "body, Kodak Vision3 500T, shutter angle 180°, aspect ratio 1.85:1",
  "Panavision Panaflex Platinum (35mm film)": "body, Kodak Vision3 250D, shutter angle 180°, aspect ratio 2.39:1"
};

const LENS_SPECS: Record<string, string> = {
  "Canon K35 (rehoused)": "focal length 50mm, T1.4. Sensor height: approximately 52mm",
  "Cooke Speed Panchro (vintage)": "focal length 40mm, T2.3. Sensor height: approximately 52mm",
  "Cooke Panchro/i Classic FF": "focal length 32mm, T2.2. Sensor height: approximately 52mm",
  "Panavision C Series (anamorphic)": "focal length 50mm, T2.8, 2x squeeze. Sensor height: approximately 52mm",
  "Panavision E Series (anamorphic)": "focal length 75mm, T2.0, 2x squeeze. Sensor height: approximately 52mm",
  "ZEISS Supreme Prime Radiance": "focal length 35mm, T1.5. Sensor height: approximately 52mm",
  "ARRI Signature Primes": "focal length 47mm, T1.8. Sensor height: approximately 52mm",
  "Leica Thalia": "focal length 24mm, T3.6. Sensor height: approximately 52mm",
  "Helios 44-2 58mm (vintage)": "focal length 58mm, f/2.0. Sensor height: approximately 52mm",
  "LOMO Anamorphic (vintage)": "focal length 35mm, T2.5, 2x squeeze. Sensor height: approximately 52mm"
};

const CAMERAS = Object.keys(CAMERA_SPECS);
const LENSES = Object.keys(LENS_SPECS);

const ANGLES = [
  "Close-Up",
  "Medium Close-Up",
  "Medium Shot",
  "Full Shot",
  "Wide Shot",
  "Over-the-Shoulder",
  "POV",
  "Ground-level",
  "Bird's-eye / Top-down",
  "Dutch Tilt",
  "Side Profile Shot",
  "Three-Quarter Shot",
  "Front-on / Head-on",
  "Reverse Angle",
  "Overhead Top-down",
  "Low Angle",
  "High Angle",
  "Shoulder-level Eye Line",
  "Knee-level / Hip-level"
];

const APERTURES = ["f/1.4", "f/2.8", "f/4", "f/16"];

const LIGHTING = [
  "Low Key",
  "High Key",
  "Luz Difusa",
  "Luz Dura",
  "Contraluz",
  "Luz Natural",
  "Chiaroscuro",
  "Luz de Amanhecer",
  "Golden Hour",
  "Blue Hour"
];

// --- Components ---

const ParameterBox = ({ label, icon: Icon, value, options, onChange }: {
  label: string,
  icon: any,
  value: string,
  options: string[],
  onChange: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">{label}</span>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            value ? 'bg-zinc-800/50 border border-zinc-700/50' : 'bg-zinc-900/40 border border-zinc-800/50'
          } hover:bg-zinc-800/80 hover:border-zinc-600 group`}
        >
          <Icon size={28} className={`transition-colors duration-300 ${value ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute z-[110] top-full mt-4 left-1/2 -translate-x-1/2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
              >
                <div className="p-1">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs rounded-xl transition-all duration-200 ${
                        value === opt ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[10px] text-zinc-600 hover:text-white transition-colors truncate max-w-[100px]"
      >
        {value || 'Selecionar'}
      </button>
    </div>
  );
};

type AppState = 'config' | 'loading' | 'chat';

const LOGO_URL = "https://i.imgur.com/QhrFEkZ.png";

export default function App() {
  const [state, setState] = useState<AppState>('config');
  const [camera, setCamera] = useState('');
  const [lens, setLens] = useState('');
  const [angle, setAngle] = useState('');
  const [aperture, setAperture] = useState('');
  const [lighting, setLighting] = useState('');
  const [scene, setScene] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [referenceImage, setReferenceImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const bottomInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const data = base64.split(',')[1];
        setReferenceImage({ data, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!scene.trim()) return;
    setState('loading');
    
    let styleReference = "balanced cinematic tones, modern digital clarity, natural saturation";
    
    if (referenceImage) {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
          console.warn("GEMINI_API_KEY não encontrada. Pulando análise de imagem.");
        } else {
          const ai = new GoogleGenAI({ apiKey });
          const analysisResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { inlineData: { data: referenceImage.data, mimeType: referenceImage.mimeType } },
                { text: "Analyze the visual style of this image for a cinematic prompt. Focus on: 1) Color grading and palette, 2) Film grain and texture, 3) Saturation levels, 4) Historical era or aesthetic period (e.g., 1910s, 70s, modern), 5) Overall visual atmosphere. Provide a concise technical description (max 50 words) that can be applied to a DIFFERENT subject." }
              ]
            }
          });
          styleReference = analysisResponse.text?.trim() || styleReference;
        }
      } catch (error) {
        console.error("Error analyzing image:", error);
      }
    }

    setTimeout(() => {
      const camSpec = CAMERA_SPECS[camera] || "body, native ISO 800, shutter angle 180°, aspect ratio 1.78:1";
      const lensSpec = LENS_SPECS[lens] || "focal length 50mm, T2.0. Sensor height: approximately 52mm";
      
      const prompt = `## Abordagem

Capturar a essência de ${scene}, utilizando a câmera ${camera} para uma escala cinematográfica superior. A lente ${lens} proporciona uma estética visual única, enquanto a abertura ${aperture} e a iluminação ${lighting} definem o clima e o destaque do sujeito.

---

## Prompt Final

EXT. SCENE - DAY - CINEMATIC SHOT

CAMERA: ${camera} ${camSpec}. LENS: ${lens} ${lensSpec}. Camera position: optimized for ${angle}. Camera-to-subject distance: variable based on framing. Focus plane: critical focus on main subject, ${aperture} rendering background with intentional depth and professional bokeh.

LIGHT: ${lighting} setup. Kelvin temperature: balanced for scene mood (approx 5600K for daylight, 3200K for tungsten). Key light positioned at 45 degrees to create depth, subtle fill to maintain shadow detail. Rim light to separate subject from background. Highlight protection optimized for digital/film sensor at 80 IRE.

SUBJECT: ${scene}. Focus is critical on the eyes/main detail, creating professional depth of field. Body position: dynamic and natural, conveying the intended emotion of the scene. Surface physics: realistic light interaction with skin/textures, subsurface scattering where applicable.

FOREGROUND: Relevant environmental details and textures. Texture: high fidelity, detailed surfaces with visible wear/age. Colors: muted tones to guide the eye towards the midground. Depth: out of focus to create layering.

MIDGROUND: Main subject, sharply focused. Colors: optimized for cinematic contrast, utilizing a complementary color scheme. Textures: rich and tactile, reflecting the lighting setup accurately.

BACKGROUND: Environment context, artistically blurred due to ${aperture} and movement. Atmospheric perspective: slight haze reducing detail in the distance, creating a sense of scale and depth. Colors: desaturated to provide depth and focus on the subject.

WARDROBE TONAL BEHAVIOR: Contrast optimized for ${lighting}. Textures and surfaces reflecting ambient light according to material properties (leather, cotton, metal). Color Role Mapping — W3C Palette Anchors: Primary Subject Color (#...); Accent Color (#...).

POST BEHAVIOR: Style Reference: ${styleReference}. Visible ${camera} grain structure influenced by the reference aesthetic. Slight halation on specular highlights. Restrained contrast curve with a soft roll-off in the highlights. Saturation and color balance matching the reference style. No sharpening pass. Native optical resolution only.

COLOR ROLE MAPPING — W3C PALETTE ANCHORS:
Primary Subject: Optimized for ${lighting}
Environment Style: ${styleReference}
Accents: Subtle specular highlights

COMPOSITIONAL GEOMETRY: Subject positioned according to ${angle} perspective, following the rule of thirds. Horizon line positioned at the lower third. Visual weight balanced by environmental elements in the background. Leading lines guiding the viewer's eye towards the subject.

Inspired by high-end cinematic visuals and the technical characteristics of the ${camera} and ${lens}. However, no direct copying of composition or aesthetic.

NO TEXT. NO WATERMARK. NO LOGO. CORRECT ANATOMY. NO EXTRA DIGITS. NO PLASTIC HDR. NO OVERSHARPEN. NO DIGITAL FILL.`;
      
      setGeneratedPrompt(prompt);
      setState('chat');
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    setIsSending(true);
    setState('loading');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        alert("Erro: GEMINI_API_KEY não configurada. Se você estiver no Vercel, adicione esta variável de ambiente nas configurações do projeto.");
        setState('chat');
        setIsSending(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `Você é um assistente técnico de roteiro e direção.
O usuário quer alterar um prompt cinematográfico existente.
Sua tarefa é reescrever o prompt incorporando as alterações solicitadas, mantendo a estrutura técnica rigorosa e a consistência visual.

Mantenha as seções: CAMERA, LENS, LIGHT, SUBJECT, FOREGROUND, MIDGROUND, BACKGROUND, WARDROBE, POST BEHAVIOR, COLOR ROLE MAPPING, COMPOSITIONAL GEOMETRY.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `PROMPT ORIGINAL:\n${generatedPrompt}\n\nALTERAÇÃO SOLICITADA: ${chatInput}`,
        config: { systemInstruction }
      });

      if (response.text) {
        setGeneratedPrompt(response.text.trim());
        setChatInput('');
        setState('chat');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setState('chat');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#121417] text-zinc-300 font-sans selection:bg-white selection:text-black flex flex-col items-center">
      {/* Header Bar */}
      <header className="w-full max-w-6xl px-6 pt-8">
        <div className="bg-[#1c1f24] rounded-full px-8 py-4 flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setState('config')}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Cinema Shot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">/Zion Academy™</span>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-4xl px-6 flex flex-col items-center justify-center py-20">
        <AnimatePresence mode="wait">
          {state === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">Cinema Shot</h1>
                <p className="text-zinc-500 text-xs font-medium">Configure os parâmetros técnicos e descreva a cena.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-10 w-full max-w-xl">
                <ParameterBox label="CÂMERA" icon={Camera} value={camera} options={CAMERAS} onChange={setCamera} />
                <ParameterBox label="LENTE" icon={Focus} value={lens} options={LENSES} onChange={setLens} />
                <ParameterBox label="ÂNGULO" icon={Maximize} value={angle} options={ANGLES} onChange={setAngle} />
                <ParameterBox label="ABERTURA" icon={Aperture} value={aperture} options={APERTURES} onChange={setAperture} />
                <ParameterBox label="LUZ" icon={Sun} value={lighting} options={LIGHTING} onChange={setLighting} />
              </div>

              <div className="w-full max-w-2xl">
                <div className="bg-[#1c1f24] border border-white/5 rounded-[1.5rem] p-5 shadow-2xl transition-all focus-within:border-white/10 focus-within:ring-4 focus-within:ring-white/5">
                  <textarea
                    value={scene}
                    onChange={(e) => setScene(e.target.value)}
                    placeholder="Descreva a cena que você quer transformar em prompt cinematográfico..."
                    className="w-full bg-transparent border-none outline-none text-zinc-300 placeholder:text-zinc-700 min-h-[80px] resize-none text-xs font-normal leading-relaxed"
                  />
                  {referenceImage && (
                    <div className="mt-2 relative inline-block">
                      <img 
                        src={`data:${referenceImage.mimeType};base64,${referenceImage.data}`} 
                        alt="Reference" 
                        className="h-12 w-12 object-cover rounded-lg border border-white/10"
                      />
                      <button 
                        onClick={() => setReferenceImage(null)}
                        className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 text-zinc-400 hover:text-white"
                      >
                        <RefreshCw size={10} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <input 
                        type="file" 
                        id="image-upload" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                      />
                      <label 
                        htmlFor="image-upload"
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors text-zinc-600 cursor-pointer"
                      >
                        <ImageIcon size={18} />
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleGenerate}
                        disabled={!scene.trim()}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black transition-all duration-300"
                        title="Gerar Prompt"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-zinc-800 border-t-white animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full p-4">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain animate-spin-slow" referrerPolicy="no-referrer" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                  <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                  <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                </div>
                <p className="text-zinc-500 text-sm font-medium mt-4">Gerando prompt cinematográfico...</p>
              </div>
            </motion.div>
          )}

          {state === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-4xl space-y-8"
            >
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-[#1c1f24] border border-white/5 rounded-[2rem] p-6 max-w-[80%] shadow-xl">
                  <p className="text-zinc-200 text-sm mb-4 leading-relaxed">{scene}</p>
                  <div className="flex flex-wrap gap-2">
                    {[camera, lens, angle, aperture, lighting].filter(Boolean).map((tag, i) => (
                      <span key={i} className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bot Message */}
              <div className="flex justify-start">
                <div className="bg-[#1c1f24] border border-white/5 rounded-[2rem] p-8 w-full shadow-2xl relative overflow-hidden">
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-400 leading-relaxed bg-transparent p-0 m-0 border-none">
                      {generatedPrompt}
                    </pre>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/5">
                    <button
                      onClick={() => bottomInputRef.current?.focus()}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 hover:bg-white hover:text-black transition-all duration-300 text-[10px] font-bold uppercase tracking-widest"
                    >
                      <Edit2 size={12} />
                      Editar Prompt
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-[10px] font-bold uppercase tracking-widest ${
                        isCopied ? 'bg-white text-black' : 'bg-zinc-800/50 hover:bg-white hover:text-black'
                      }`}
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      {isCopied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Input Bar at bottom */}
              <div className="pt-8">
                <div className="bg-[#1c1f24] border border-white/5 rounded-[2rem] p-4 flex items-center gap-4 shadow-2xl focus-within:border-white/10 transition-all">
                  <input 
                    ref={bottomInputRef}
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Peça uma alteração no prompt ou escreva algo..." 
                    className="flex-grow bg-transparent border-none outline-none text-zinc-200 placeholder:text-zinc-700 text-sm ml-4"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isSending}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      chatInput.trim() ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-800 text-zinc-600'
                    }`}
                  >
                    <Send size={18} className={isSending ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full py-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-zinc-600 tracking-tight">
            Cinema Shot · All rights reserved © 2026 Zion Academy
          </p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        body {
          background-color: #121417;
        }
      `}} />
    </div>
  );
}
