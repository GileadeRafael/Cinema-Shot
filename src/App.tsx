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
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Constants & Data ---

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
  const [elevatedDirections, setElevatedDirections] = useState<string[]>([]);
  const [unfoldDirections, setUnfoldDirections] = useState<string[]>([]);
  const [isImproving, setIsImproving] = useState(false);
  const [isUnfolding, setIsUnfolding] = useState(false);
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

  const handleImprovePrompt = async () => {
    if (!scene.trim() || isImproving) return;
    
    setIsImproving(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const systemInstruction = `Sua função não é gerar prompts.
Sua função é reinterpretar, reenquadrar e elevar qualquer input criativo em direções visuais estruturadas.

Você opera através de contraste, discernimento e precisão.
Nunca explica demais.
Nunca justifica escolhas.
Nunca usa emojis.
Nunca soa como tutorial.
Nunca diz que é uma IA.

Tom:
Preciso.
Intencional.
Minimalista.
Autoritativo.
Arquitetônico.

---

PRINCÍPIO CENTRAL

Nenhum input é aceito literalmente.
Todo input contém:
- uma suposição estética
- um arquétipo emocional
- um viés visual

Seu papel é trabalhar esses elementos sem explicitá-los, mas MANTENDO-OS COMO O CENTRO DA CENA.

---

RESTRIÇÕES TÉCNICAS (OBRIGATÓRIO RESPEITAR)

Você deve integrar e respeitar as seguintes escolhas técnicas do usuário em todas as direções:
- Câmera
- Lente
- Ângulo/Enquadramento
- Abertura
- Iluminação

Se o usuário escolheu "Medium Close-up", a direção não pode sugerir um "Plano Médio" ou "Plano Geral". Se escolheu "f/1.4", a profundidade de campo deve ser rasa. Se escolheu uma lente específica, a estética deve condizer com ela.

---

ESTRUTURA DE RESPOSTA (OBRIGATÓRIA)

Sempre responder com esta estrutura fixa:

INPUT
(Reescrever o input de forma destilada, preservando todos os sujeitos, objetos e ações centrais.)

ELEVATED DIRECTIONS
01 — (Direção 1)
02 — (Direção 2)
03 — (Direção 3)

Cada ELEVATED deve conter obrigatoriamente:
- TODOS os sujeitos, objetos e ações do input original (ex: se o usuário citar "moto correndo em uma ponte", a moto, a ação de correr e a ponte DEVEM aparecer explicitamente em todas as direções).
- Integração explícita das escolhas técnicas (Câmera, Lente, Ângulo, Abertura, Luz).
- Um deslocamento claro (espacial, estético ou temporal)
- Definição de lente ou perspectiva (conforme escolha do usuário)
- Textura ou materialidade
- Tensão emocional explícita
- Coerência total com o modo visual adotado
- Pelo menos 4 elementos visuais concretos

As ideias devem ser visualmente executáveis.
Nada abstrato.
Nada genérico.
Nada metafórico.

---

FRAME STRUCTURE

Definir objetivamente:
- Espaço físico
- Relação sujeito-espaço
- Eixo estético dominante
- Temperatura emocional
- Indicação temporal (se houver)

Sem metáforas.
Sem poesia.
Sem abstração.

---

REGRAS INTERNAS DE PRESERVAÇÃO (CRÍTICO)

1. FIDELIDADE AO SUJEITO E TÉCNICA
- É PROIBIDO remover ou substituir o sujeito principal.
- É PROIBIDO contrariar as escolhas técnicas do usuário (Câmera, Lente, Ângulo, Abertura, Luz).
- É PROIBIDO remover o cenário principal.
- É PROIBIDO remover a ação.

2. VISUAL MODE DETECTION
Antes de gerar qualquer direção, analisar o input e determinar o modo dominante:

1. STILL AUTHORITY (fotográfico)
   Composição fixa.
   Força de quadro.
   Momento congelado.

2. SCENE TENSION (cinematográfico)
   Movimento implícito ou explícito.
   Continuidade temporal.
   Atmosfera narrativa.

3. EDITORIAL / CONCEPTUAL
   Direção de arte dominante.
   Styling forte.
   Artificialidade intencional.

4. DOCUMENTAL REALISM
   Naturalista.
   Observacional.
   Imperfeição controlada.

Escolher apenas um modo por resposta.
Nunca misturar linguagens.
Nunca anunciar o modo.

---

Regras:
- Nunca acusar repetição.
- Nunca soar corretivo.
- Nunca explicar demais.
- A expansão deve soar como abertura estratégica.`;

      const technicalContext = `
CONTEXTO TÉCNICO ATUAL:
- Câmera: ${camera || 'Não especificada'}
- Lente: ${lens || 'Não especificada'}
- Ângulo: ${angle || 'Não especificada'}
- Abertura: ${aperture || 'Não especificada'}
- Luz: ${lighting || 'Não especificada'}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `INPUT DO USUÁRIO: ${scene}\n${technicalContext}`,
        config: { systemInstruction }
      });
      
      const text = response.text || "";
      const directions: string[] = [];
      
      // Extract directions using regex
      const matches = text.match(/0[123] — (.*?)(?=\n0[123] —|$)/gs);
      if (matches) {
        matches.forEach(m => {
          directions.push(m.replace(/0[123] — /, "").trim());
        });
      }
      
      setElevatedDirections(directions.slice(0, 3));
    } catch (error) {
      console.error("Error improving prompt:", error);
    } finally {
      setIsImproving(false);
    }
  };

  const handleGenerate = async () => {
    if (!scene.trim()) return;
    setState('loading');
    
    let styleReference = "balanced cinematic tones, modern digital clarity, natural saturation";
    
    if (referenceImage) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

  const handleUnfold = async () => {
    if (isUnfolding) return;
    setIsUnfolding(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const systemInstruction = `Você é um diretor de cinema visionário.
Sua tarefa é analisar o prompt cinematográfico atual e imaginar três sequências lógicas e visualmente impactantes que poderiam seguir essa cena.

Regras:
- Mantenha a consistência de tom, estilo e color grading.
- Cada sequência deve ser uma progressão narrativa ou visual clara.
- Seja técnico e descritivo.
- Retorne exatamente três opções.

Formato de resposta:
01 — [Descrição da sequência 1]
02 — [Descrição da sequência 2]
03 — [Descrição da sequência 3]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `PROMPT ATUAL:\n${generatedPrompt}`,
        config: { systemInstruction }
      });

      const text = response.text || "";
      const directions: string[] = [];
      const matches = text.match(/0[123] — (.*?)(?=\n0[123] —|$)/gs);
      if (matches) {
        matches.forEach(m => {
          directions.push(m.replace(/0[123] — /, "").trim());
        });
      }
      setUnfoldDirections(directions.slice(0, 3));
    } catch (error) {
      console.error("Error unfolding:", error);
    } finally {
      setIsUnfolding(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    setIsSending(true);
    setState('loading');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
                        onClick={handleImprovePrompt}
                        disabled={!scene.trim() || isImproving}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-bold text-zinc-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles size={12} className={isImproving ? "animate-spin" : ""} />
                        {isImproving ? "Melhorando..." : "Melhorar Prompt"}
                      </button>
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

                {/* Elevated Directions */}
                <AnimatePresence>
                  {elevatedDirections.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Elevated Directions</span>
                        <button 
                          onClick={() => setElevatedDirections([])}
                          className="text-[9px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest"
                        >
                          Limpar
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {elevatedDirections.map((dir, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setScene(dir);
                              setElevatedDirections([]);
                            }}
                            className="text-left p-4 rounded-2xl bg-[#1c1f24] border border-white/5 hover:border-white/10 transition-all text-[11px] text-zinc-400 hover:text-zinc-200 leading-relaxed group"
                          >
                            <span className="text-zinc-600 font-bold mr-2">0{idx + 1} —</span>
                            {dir}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                      onClick={handleUnfold}
                      disabled={isUnfolding}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 hover:bg-white hover:text-black transition-all duration-300 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                      <Layers size={12} className={isUnfolding ? "animate-spin" : ""} />
                      {isUnfolding ? "Desdobrando..." : "Desdobrar Imagem"}
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

              {/* Unfold Directions */}
              <AnimatePresence>
                {unfoldDirections.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Sequências Sugeridas</span>
                      <button 
                        onClick={() => setUnfoldDirections([])}
                        className="text-[9px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest"
                      >
                        Limpar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {unfoldDirections.map((dir, idx) => (
                        <button
                          key={idx}
                          onClick={async () => {
                            setChatInput(`Gere a sequência: ${dir}`);
                            setUnfoldDirections([]);
                            // We trigger the generation immediately
                            setState('loading');
                            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                            const response = await ai.models.generateContent({
                              model: "gemini-3-flash-preview",
                              contents: `PROMPT ANTERIOR:\n${generatedPrompt}\n\nGERAR SEQUÊNCIA PRÓXIMA: ${dir}\n\nMantenha consistência total de estilo, color grading e especificações técnicas.`,
                              config: { systemInstruction: "Você é um diretor de cinema. Gere o prompt técnico para a próxima sequência da cena anterior." }
                            });
                            if (response.text) {
                              setGeneratedPrompt(response.text.trim());
                              setState('chat');
                              setChatInput('');
                            }
                          }}
                          className="text-left p-4 rounded-2xl bg-[#1c1f24] border border-white/5 hover:border-white/10 transition-all text-[11px] text-zinc-400 hover:text-zinc-200 leading-relaxed group"
                        >
                          <span className="text-zinc-600 font-bold mr-2">0{idx + 1} —</span>
                          {dir}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
