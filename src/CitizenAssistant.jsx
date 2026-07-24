import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, Square, X, Check, Copy, Volume2, ThumbsUp, ThumbsDown,
  Flag, Share2, Settings, ChevronDown, ChevronUp, Loader2, ShieldCheck,
  CheckCircle2, Circle, Landmark
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Copy / strings                                                      */
/* ------------------------------------------------------------------ */

const STRINGS = {
  fr: {
    dir: "ltr",
    subtitle: "Assistant officiel d'information citoyenne",
    welcomeTitle: "Comment puis-je vous aider aujourd'hui ?",
    welcomeMessage:
      "Posez votre question en langage courant. Je m'appuie uniquement sur des sources officielles.",
    suggested: [
      "Comment renouveler ma CNIE (carte d'identité) ?",
      "Quels documents pour une demande de passeport biométrique ?",
      "Comment obtenir un extrait d'acte de naissance ?",
      "Comment obtenir un certificat de résidence ?",
      "Comment immatriculer un véhicule (carte grise) ?",
    ],
    placeholder: "Écrivez votre question…",
    send: "Envoyer",
    stop: "Arrêter la génération",
    recording: "Enregistrement en cours",
    cancel: "Annuler",
    sendRecording: "Envoyer l'enregistrement",
    listen: "Écouter",
    stopListening: "Arrêter l'écoute",
    copy: "Copier",
    copied: "Copié",
    helpful: "Utile",
    notHelpful: "Pas utile",
    report: "Signaler un problème",
    share: "Partager",
    citizenMode: "Mode citoyen",
    detailedMode: "Mode détaillé",
    displayMode: "Affichage du traitement",
    disclaimer:
      "Assistant automatisé. Les réponses peuvent contenir des erreurs — vérifiez les informations essentielles auprès des services concernés.",
    settingsTitle: "Paramètres d'affichage",
    institutionLabel: "Nom de l'institution",
    subtitleLabel: "Sous-titre de l'assistant",
    colorLabel: "Couleur principale",
    languageLabel: "Langue",
    close: "Fermer",
    seeMore: "En savoir plus",
    seeLess: "Réduire",
    toolPanelTitle: "Détail du traitement",
    inputsOutputs: "Entrées / Sorties",
    status: { running: "en cours", done: "terminé" },
    steps: [
      { label: "Recherche dans les sources officielles…", name: "recherche_sources_officielles", summary: "3 documents pertinents trouvés sur service-public.fr" },
      { label: "Vérification de la réglementation en vigueur…", name: "verification_reglementation", summary: "Réglementation 2026 confirmée, aucune mise à jour récente" },
      { label: "Préparation de votre réponse…", name: "preparation_reponse", summary: "Synthèse rédigée à partir de 3 sources vérifiées" },
    ],
  },
  en: {
    dir: "ltr",
    subtitle: "Official citizen information assistant",
    welcomeTitle: "How can I help you today?",
    welcomeMessage:
      "Ask your question in plain language. I rely only on official sources.",
    suggested: [
      "How do I renew my national ID card (CNIE)?",
      "What documents are needed for a biometric passport?",
      "How do I get a birth certificate extract?",
      "How do I get a certificate of residence?",
      "How do I register a vehicle (carte grise)?",
    ],
    placeholder: "Type your question…",
    send: "Send",
    stop: "Stop generating",
    recording: "Recording",
    cancel: "Cancel",
    sendRecording: "Send recording",
    listen: "Listen",
    stopListening: "Stop listening",
    copy: "Copy",
    copied: "Copied",
    helpful: "Helpful",
    notHelpful: "Not helpful",
    report: "Report an issue",
    share: "Share",
    citizenMode: "Citizen mode",
    detailedMode: "Detailed mode",
    displayMode: "Processing display",
    disclaimer:
      "Automated assistant. Answers may contain errors — please verify essential information with the relevant department.",
    settingsTitle: "Display settings",
    institutionLabel: "Institution name",
    subtitleLabel: "Assistant subtitle",
    colorLabel: "Primary colour",
    languageLabel: "Language",
    close: "Close",
    seeMore: "Learn more",
    seeLess: "Show less",
    toolPanelTitle: "Processing details",
    inputsOutputs: "Inputs / Outputs",
    status: { running: "running", done: "done" },
    steps: [
      { label: "Searching official sources…", name: "official_sources_search", summary: "3 relevant documents found on the official portal" },
      { label: "Checking current regulations…", name: "regulation_check", summary: "2026 regulation confirmed, no recent update" },
      { label: "Preparing your answer…", name: "answer_preparation", summary: "Summary drafted from 3 verified sources" },
    ],
  },
  ar: {
    dir: "rtl",
    subtitle: "المساعد الرسمي لمعلومات المواطنين",
    welcomeTitle: "كيف يمكنني مساعدتك اليوم؟",
    welcomeMessage: "اطرح سؤالك بلغة بسيطة. أعتمد فقط على مصادر رسمية.",
    suggested: [
      "كيف أجدد بطاقتي الوطنية للتعريف الإلكترونية (CNIE)؟",
      "ما هي الوثائق المطلوبة لجواز السفر البيومتري؟",
      "كيف أحصل على نسخة من عقد الازدياد؟",
      "كيف أحصل على شهادة السكنى؟",
      "كيف أسجل سيارة (البطاقة الرمادية)؟",
    ],
    placeholder: "اكتب سؤالك…",
    send: "إرسال",
    stop: "إيقاف التوليد",
    recording: "جارٍ التسجيل",
    cancel: "إلغاء",
    sendRecording: "إرسال التسجيل",
    listen: "استماع",
    stopListening: "إيقاف الاستماع",
    copy: "نسخ",
    copied: "تم النسخ",
    helpful: "مفيد",
    notHelpful: "غير مفيد",
    report: "الإبلاغ عن مشكلة",
    share: "مشاركة",
    citizenMode: "وضع المواطن",
    detailedMode: "الوضع التفصيلي",
    displayMode: "عرض المعالجة",
    disclaimer:
      "مساعد آلي. قد تحتوي الإجابات على أخطاء — يرجى التحقق من المعلومات الأساسية لدى الجهة المعنية.",
    settingsTitle: "إعدادات العرض",
    institutionLabel: "اسم المؤسسة",
    subtitleLabel: "العنوان الفرعي للمساعد",
    colorLabel: "اللون الأساسي",
    languageLabel: "اللغة",
    close: "إغلاق",
    seeMore: "معرفة المزيد",
    seeLess: "عرض أقل",
    toolPanelTitle: "تفاصيل المعالجة",
    inputsOutputs: "المدخلات / المخرجات",
    status: { running: "قيد التنفيذ", done: "منتهي" },
    steps: [
      { label: "البحث في المصادر الرسمية…", name: "بحث_المصادر_الرسمية", summary: "تم العثور على 3 وثائق ذات صلة في البوابة الرسمية" },
      { label: "التحقق من التنظيم الساري…", name: "التحقق_من_التنظيم", summary: "تم تأكيد تنظيم 2026، لا يوجد تحديث حديث" },
      { label: "تحضير إجابتك…", name: "تحضير_الإجابة", summary: "تم إعداد ملخص من 3 مصادر موثقة" },
    ],
  },
};

/* Canned answer content per language, keyed to match any question (demo) */
const ANSWERS = {
  fr: {
    text:
`Voici la procédure pour **renouveler votre CNIE (carte nationale d'identité électronique)** :

1. Remplissez la pré-demande en ligne sur le portail national des titres sécurisés.
2. Prenez rendez-vous auprès de l'arrondissement, du poste de police, ou de la gendarmerie royale (en zone rurale) dont vous dépendez.
3. Présentez-vous au rendez-vous avec les pièces justificatives originales pour la prise d'empreintes et de photo biométrique.
4. Retirez votre nouvelle carte une fois prête (une notification vous est envoyée).

**Documents à préparer :**

| Situation | Documents requis |
|---|---|
| Renouvellement (carte expirée) | Ancienne CNIE, extrait d'acte de naissance de moins de 3 mois (ou livret de famille), certificat de résidence, 2 photos |
| Perte ou vol | Déclaration de perte auprès de la police ou de la gendarmerie, extrait d'acte de naissance, certificat de résidence, 2 photos |
| Première demande (dès 16 ans) | Extrait d'acte de naissance, livret de famille, certificat de résidence, 2 photos |

- Le délai moyen de délivrance est de 2 à 3 semaines selon la commune.
- La CNIE est obligatoire pour tout citoyen marocain à partir de 16 ans.
- Le certificat de résidence est délivré par la police (zones urbaines), la gendarmerie royale (zones rurales), ou l'autorité administrative locale en leur absence.

Vous pouvez [accéder au portail de pré-demande](https://www.dgsn.gov.ma) sur le site officiel de la Direction Générale de la Sûreté Nationale.`,
    expandableTitle: "En savoir plus sur les délais et sanctions",
    expandableBody:
`Certains arrondissements proposent un créneau prioritaire pour les personnes ayant un déplacement imminent justifié (billet d'avion, convocation administrative). Le fait de ne pas détenir de CNIE valide peut entraîner une amende. Les mineurs doivent être accompagnés d'un représentant légal muni d'une pièce d'identité et du livret de famille.`,
  },
  en: {
    text:
`Here is the procedure to **renew your CNIE (electronic national ID card)**:

1. Fill in the pre-application online on the national secure documents portal.
2. Book an appointment at the arrondissement, police station, or Royal Gendarmerie (in rural areas) covering your address.
3. Attend the appointment with the original supporting documents for fingerprinting and a biometric photo.
4. Collect your new card once ready (you'll receive a notification).

**Documents to prepare:**

| Situation | Required documents |
|---|---|
| Renewal (expired card) | Old CNIE, birth certificate extract less than 3 months old (or family record book), certificate of residence, 2 photos |
| Loss or theft | Loss declaration from the police or gendarmerie, birth certificate extract, certificate of residence, 2 photos |
| First application (from age 16) | Birth certificate extract, family record book, certificate of residence, 2 photos |

- Average issuance time is 2 to 3 weeks depending on the municipality.
- The CNIE is mandatory for every Moroccan citizen from age 16.
- The certificate of residence is issued by the police (urban areas), the Royal Gendarmerie (rural areas), or the local administrative authority where these are unavailable.

You can [access the pre-application portal](https://www.dgsn.gov.ma) on the official website of the Direction Générale de la Sûreté Nationale.`,
    expandableTitle: "Learn more about processing times and penalties",
    expandableBody:
`Some arrondissements offer a priority slot for people with a justified imminent trip (plane ticket, official summons). Not holding a valid CNIE can result in a fine. Minors must be accompanied by a legal guardian holding valid ID and the family record book.`,
  },
  ar: {
    text:
`فيما يلي إجراءات **تجديد البطاقة الوطنية للتعريف الإلكترونية (CNIE)**:

1. املأ الطلب المسبق عبر الإنترنت على البوابة الوطنية للوثائق المؤمّنة.
2. احجز موعدًا لدى الدائرة أو مركز الشرطة، أو الدرك الملكي (بالمناطق القروية) التابع لعنوان سكناك.
3. احضر إلى الموعد مصحوبًا بالوثائق الأصلية لأخذ البصمات والصورة البيومترية.
4. استلم بطاقتك الجديدة بمجرد جهوزيتها (ستصلك إشعار بذلك).

**الوثائق الواجب تحضيرها:**

| الحالة | الوثائق المطلوبة |
|---|---|
| تجديد (بطاقة منتهية الصلاحية) | البطاقة القديمة، نسخة من عقد الازدياد لا يتجاوز عمرها 3 أشهر (أو دفتر العائلة)، شهادة السكنى، صورتان شمسيتان |
| فقدان أو سرقة | تصريح بالفقدان لدى الشرطة أو الدرك، نسخة من عقد الازدياد، شهادة السكنى، صورتان شمسيتان |
| طلب أول (ابتداءً من 16 سنة) | نسخة من عقد الازدياد، دفتر العائلة، شهادة السكنى، صورتان شمسيتان |

- المدة المتوسطة للتسليم تتراوح بين 2 و3 أسابيع حسب الجماعة.
- بطاقة CNIE إلزامية لكل مواطن مغربي ابتداءً من سن 16 سنة.
- تُسلَّم شهادة السكنى من طرف الشرطة (بالمناطق الحضرية)، أو الدرك الملكي (بالمناطق القروية)، أو السلطة المحلية في حال غياب هذه الجهات.

يمكنك [الولوج إلى بوابة الطلب المسبق](https://www.dgsn.gov.ma) على الموقع الرسمي للمديرية العامة للأمن الوطني.`,
    expandableTitle: "معرفة المزيد حول الآجال والعقوبات",
    expandableBody:
`تقترح بعض الدوائر موعدًا ذا أولوية للأشخاص الذين لديهم سفر وشيك مبرر (تذكرة طيران، استدعاء إداري). قد يترتب عن عدم التوفر على بطاقة CNIE سارية المفعول غرامة مالية. يجب أن يكون القاصرون مرفوقين بممثل قانوني حامل لبطاقة تعريف سارية المفعول ودفتر العائلة.`,
  },
};

/* ------------------------------------------------------------------ */
/* Minimal markdown renderer (headers, bold, lists, links, tables)     */
/* ------------------------------------------------------------------ */

function renderInline(text, keyBase) {
  const parts = [];
  const regex = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0, m, i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) {
      parts.push(<strong key={`${keyBase}-b-${i++}`}>{m[2]}</strong>);
    } else if (m[3]) {
      parts.push(
        <a key={`${keyBase}-a-${i++}`} href={m[5]} target="_blank" rel="noreferrer" className="msg-link">
          {m[4]}
        </a>
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function parseMarkdown(md) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    // table
    if (line.includes("|") && lines[i + 1] && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1].replace(/\|/g, "|"))) {
      const headerCells = line.split("|").map(c => c.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(lines[i].split("|").map(c => c.trim()).filter(Boolean));
        i++;
      }
      blocks.push(
        <div className="msg-table-wrap" key={`t-${key++}`}>
          <table className="msg-table">
            <thead>
              <tr>{headerCells.map((c, ci) => <th key={ci}>{renderInline(c, `th-${key}-${ci}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci}>{renderInline(c, `td-${key}-${ri}-${ci}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // headers
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#{1,3}\s/, "");
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      blocks.push(<Tag className="msg-heading" key={`h-${key++}`}>{renderInline(content, `h-${key}`)}</Tag>);
      i++;
      continue;
    }

    // numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push(
        <ol className="msg-list" key={`ol-${key++}`}>
          {items.map((it, ii) => <li key={ii}>{renderInline(it, `oli-${key}-${ii}`)}</li>)}
        </ol>
      );
      continue;
    }

    // bullet list
    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      blocks.push(
        <ul className="msg-list" key={`ul-${key++}`}>
          {items.map((it, ii) => <li key={ii}>{renderInline(it, `uli-${key}-${ii}`)}</li>)}
        </ul>
      );
      continue;
    }

    // paragraph
    blocks.push(<p className="msg-paragraph" key={`p-${key++}`}>{renderInline(line, `p-${key}`)}</p>);
    i++;
  }

  return blocks;
}

/* ------------------------------------------------------------------ */
/* Tool progress panel                                                 */
/* ------------------------------------------------------------------ */

function ToolPanel({ steps, activeIndex, detailed, t }) {
  const [expanded, setExpanded] = useState(false);

  if (!detailed) {
    const current = steps[Math.min(activeIndex, steps.length - 1)];
    const finished = activeIndex >= steps.length;
    if (finished) return null;
    return (
      <div className="tool-citizen">
        <Loader2 size={14} className="spin" />
        <span>{current.label}</span>
      </div>
    );
  }

  return (
    <div className="tool-detailed">
      <button className="tool-detailed-toggle" onClick={() => setExpanded(e => !e)}>
        <span>{t.toolPanelTitle}</span>
        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {expanded && (
        <div className="tool-detailed-list">
          {steps.map((s, idx) => {
            const state = idx < activeIndex ? "done" : idx === activeIndex ? "running" : "pending";
            if (state === "pending") return null;
            return (
              <div className="tool-row" key={s.name}>
                <div className="tool-row-head">
                  {state === "done" ? (
                    <CheckCircle2 size={14} className="tool-icon-done" />
                  ) : (
                    <Loader2 size={14} className="spin tool-icon-running" />
                  )}
                  <span className="tool-name">{s.name}</span>
                  <span className={`tool-status tool-status-${state}`}>{t.status[state] || t.status.running}</span>
                  {state === "done" && <span className="tool-time">0.{4 + idx}s</span>}
                </div>
                {state === "done" && (
                  <div className="tool-row-summary">{s.summary}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Message actions                                                     */
/* ------------------------------------------------------------------ */

function MessageActions({ t, text, feedback, onFeedback }) {
  const [copied, setCopied] = useState(false);
  const [listening, setListening] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="msg-actions">
      <button className="icon-btn" title={listening ? t.stopListening : t.listen} onClick={() => setListening(l => !l)}>
        <Volume2 size={15} color={listening ? "var(--primary)" : undefined} />
      </button>
      <button className="icon-btn" title={copied ? t.copied : t.copy} onClick={handleCopy}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <button
        className="icon-btn"
        title={t.helpful}
        onClick={() => onFeedback(feedback === "up" ? null : "up")}
      >
        <ThumbsUp size={15} fill={feedback === "up" ? "var(--primary)" : "none"} color={feedback === "up" ? "var(--primary)" : undefined} />
      </button>
      <button
        className="icon-btn"
        title={t.notHelpful}
        onClick={() => onFeedback(feedback === "down" ? null : "down")}
      >
        <ThumbsDown size={15} fill={feedback === "down" ? "var(--danger)" : "none"} color={feedback === "down" ? "var(--danger)" : undefined} />
      </button>
      <button className="icon-btn" title={t.report}>
        <Flag size={15} />
      </button>
      <button className="icon-btn" title={t.share}>
        <Share2 size={15} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Expandable section                                                  */
/* ------------------------------------------------------------------ */

function Expandable({ title, body, seeMore, seeLess }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="expandable">
      <button className="expandable-toggle" onClick={() => setOpen(o => !o)}>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        <span>{open ? seeLess : seeMore}</span>
      </button>
      {open && <div className="expandable-body">{body}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function CitizenAssistant() {
  const [language, setLanguage] = useState("fr");
  const [primaryColor, setPrimaryColor] = useState("#1B4F72");
  const [institutionName, setInstitutionName] = useState("Royaume du Maroc — Portail Citoyen");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [detailedMode, setDetailedMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const scrollRef = useRef(null);
  const recordTimerRef = useRef(null);
  const genTimeoutsRef = useRef([]);
  const textareaRef = useRef(null);

  const t = STRINGS[language];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      clearInterval(recordTimerRef.current);
      genTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const clearGenTimeouts = () => {
    genTimeoutsRef.current.forEach(clearTimeout);
    genTimeoutsRef.current = [];
  };

  const startGeneration = useCallback((assistantId) => {
    const steps = t.steps;
    const answer = ANSWERS[language];

    // advance tool step index
    let stepIdx = 0;
    setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, toolStepIndex: 0, phase: "tools" } : m));

    steps.forEach((_, idx) => {
      const to = setTimeout(() => {
        stepIdx = idx + 1;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, toolStepIndex: stepIdx } : m));
        if (stepIdx === steps.length) {
          // start streaming text
          const full = answer.text;
          let pos = 0;
          const chunkSize = 4;
          const streamInterval = setInterval(() => {
            pos += chunkSize;
            const slice = full.slice(0, pos);
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: slice, phase: "streaming" } : m));
            if (pos >= full.length) {
              clearInterval(streamInterval);
              setMessages(prev => prev.map(m => m.id === assistantId ? {
                ...m, content: full, phase: "done", expandable: {
                  title: answer.expandableTitle, body: answer.expandableBody,
                }
              } : m));
              setIsGenerating(false);
            }
          }, 18);
          genTimeoutsRef.current.push(streamInterval);
        }
      }, 650 * (idx + 1));
      genTimeoutsRef.current.push(to);
    });
  }, [language, t]);

  const sendMessage = (rawText) => {
    const text = rawText.trim();
    if (!text || isGenerating) return;
    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now() + 1}`;

    setMessages(prev => [
      ...prev,
      { id: userId, role: "user", content: text },
      { id: assistantId, role: "assistant", content: "", phase: "tools", toolStepIndex: 0, feedback: null },
    ]);
    setInput("");
    setIsGenerating(true);
    startGeneration(assistantId);
  };

  const stopGeneration = () => {
    clearGenTimeouts();
    setIsGenerating(false);
    setMessages(prev => prev.map(m =>
      m.phase && m.phase !== "done" ? { ...m, phase: "done" } : m
    ));
  };

  const handleFeedback = (id, value) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: value } : m));
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
  };
  const cancelRecording = () => {
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };
  const sendRecording = () => {
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    const mm = String(Math.floor(recordingSeconds / 60)).padStart(2, "0");
    const ss = String(recordingSeconds % 60).padStart(2, "0");
    setRecordingSeconds(0);
    sendMessage(language === "ar" ? `رسالة صوتية (${mm}:${ss})` : `Message vocal (${mm}:${ss})`);
  };

  const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const onTextareaKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const displaySubtitle = customSubtitle || t.subtitle;
  const hasStarted = messages.length > 0;

  return (
    <div
      className="app-root"
      dir={t.dir}
      style={{ "--primary": primaryColor }}
    >
      <style>{CSS}</style>

      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-logo">
              <ShieldCheck size={20} />
            </div>
            <div className="brand-text">
              <div className="brand-name">{institutionName}</div>
              <div className="brand-subtitle">{displaySubtitle}</div>
            </div>
          </div>
          <button className="settings-btn" onClick={() => setShowSettings(s => !s)} title={t.settingsTitle}>
            <Settings size={18} />
          </button>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-title">{t.settingsTitle}</div>

            <label className="settings-field">
              <span>{t.institutionLabel}</span>
              <input value={institutionName} onChange={e => setInstitutionName(e.target.value)} />
            </label>

            <label className="settings-field">
              <span>{t.subtitleLabel}</span>
              <input value={customSubtitle} placeholder={t.subtitle} onChange={e => setCustomSubtitle(e.target.value)} />
            </label>

            <label className="settings-field settings-field-row">
              <span>{t.colorLabel}</span>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
            </label>

            <label className="settings-field settings-field-row">
              <span>{t.languageLabel}</span>
              <select value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </label>

            <div className="settings-field settings-field-row">
              <span>{t.displayMode}</span>
              <div className="mode-toggle">
                <button
                  className={`mode-toggle-btn ${!detailedMode ? "active" : ""}`}
                  onClick={() => setDetailedMode(false)}
                >
                  {t.citizenMode}
                </button>
                <button
                  className={`mode-toggle-btn ${detailedMode ? "active" : ""}`}
                  onClick={() => setDetailedMode(true)}
                >
                  {t.detailedMode}
                </button>
              </div>
            </div>

            <button className="settings-close" onClick={() => setShowSettings(false)}>{t.close}</button>
          </div>
        )}
      </header>

      <main className="app-main" ref={scrollRef}>
        <div className="app-main-inner">
          {!hasStarted && (
            <div className="welcome">
              <div className="welcome-logo">
                <ShieldCheck size={34} />
              </div>
              <h1 className="welcome-title">{t.welcomeTitle}</h1>
              <p className="welcome-message">{t.welcomeMessage}</p>
              <div className="suggested-grid">
                {t.suggested.map((q, idx) => (
                  <button key={idx} className="suggested-chip" onClick={() => sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasStarted && (
            <div className="messages">
              {messages.map((m) => {
                if (m.role === "user") {
                  return (
                    <div className="msg-row msg-row-user" key={m.id}>
                      <div className="msg-bubble msg-bubble-user">{m.content}</div>
                    </div>
                  );
                }
                const showTools = m.phase === "tools";
                return (
                  <div className="msg-row msg-row-assistant" key={m.id}>
                    <div className="assistant-avatar">
                      <Landmark size={14} />
                    </div>
                    <div className="assistant-col">
                      {showTools && (
                        <ToolPanel
                          steps={t.steps}
                          activeIndex={m.toolStepIndex}
                          detailed={detailedMode}
                          t={t}
                        />
                      )}
                      {m.phase !== "tools" && (
                        <div className="msg-bubble msg-bubble-assistant">
                          {parseMarkdown(m.content)}
                          {m.phase === "streaming" && <span className="caret" />}
                          {m.phase === "done" && m.expandable && (
                            <Expandable
                              title={m.expandable.title}
                              body={m.expandable.body}
                              seeMore={t.seeMore}
                              seeLess={t.seeLess}
                            />
                          )}
                        </div>
                      )}
                      {m.phase === "done" && (
                        <MessageActions
                          t={t}
                          text={m.content}
                          feedback={m.feedback}
                          onFeedback={(v) => handleFeedback(m.id, v)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          {isRecording ? (
            <div className="recorder-bar">
              <div className="recorder-indicator">
                <span className="recorder-dot" />
                <span>{t.recording}</span>
              </div>
              <div className="recorder-timer">{formatTimer(recordingSeconds)}</div>
              <div className="recorder-actions">
                <button className="icon-btn icon-btn-ghost" title={t.cancel} onClick={cancelRecording}>
                  <X size={17} />
                </button>
                <button className="icon-btn icon-btn-primary" title={t.sendRecording} onClick={sendRecording}>
                  <Check size={17} />
                </button>
              </div>
            </div>
          ) : (
            <div className="composer">
              <textarea
                ref={textareaRef}
                className="composer-input"
                placeholder={t.placeholder}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onTextareaKeyDown}
              />
              <div className="composer-actions">
                <button className="icon-btn" title="Mic" onClick={startRecording} disabled={isGenerating}>
                  <Mic size={18} />
                </button>
                {isGenerating ? (
                  <button className="send-btn send-btn-stop" title={t.stop} onClick={stopGeneration}>
                    <Square size={15} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    className="send-btn"
                    title={t.send}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="disclaimer">{t.disclaimer}</div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                               */
/* ------------------------------------------------------------------ */

const CSS = `
:root {
  --ink: #1A1D23;
  --muted: #5B6472;
  --border: #E3E6EA;
  --bg: #FFFFFF;
  --surface: #F7F8FA;
  --success: #1E7B45;
  --danger: #B3261E;
}

* { box-sizing: border-box; }

.app-root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--ink);
  background: var(--bg);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ---------- Header ---------- */
.app-header {
  border-bottom: 1px solid var(--border);
  position: relative;
  flex-shrink: 0;
}
.app-header::before {
  content: "";
  display: block;
  height: 3px;
  background: var(--primary);
}
.app-header-inner {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand-logo {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.brand-name { font-size: 15px; font-weight: 600; line-height: 1.3; }
.brand-subtitle { font-size: 12.5px; color: var(--muted); margin-top: 1px; }
.settings-btn {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 8px;
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  color: var(--muted);
  cursor: pointer;
}
.settings-btn:hover { color: var(--ink); border-color: #C7CCD3; }

.settings-panel {
  max-width: 380px;
  margin: 0 auto 14px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.settings-title { font-size: 13px; font-weight: 600; color: var(--ink); }
.settings-field { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; color: var(--muted); }
.settings-field input, .settings-field select {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 7px 9px;
  font-size: 13px;
  color: var(--ink);
  background: #fff;
}
.settings-field-row { flex-direction: row; align-items: center; justify-content: space-between; }
.settings-field-row input[type="color"] { width: 44px; height: 28px; padding: 2px; }
.mode-toggle { display: flex; border: 1px solid var(--border); border-radius: 7px; overflow: hidden; }
.mode-toggle-btn { border: none; background: #fff; padding: 6px 10px; font-size: 12px; cursor: pointer; color: var(--muted); }
.mode-toggle-btn.active { background: var(--primary); color: #fff; }
.settings-close {
  align-self: flex-start;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  cursor: pointer;
  color: var(--ink);
}

/* ---------- Main / welcome ---------- */
.app-main { flex: 1; overflow-y: auto; }
.app-main-inner { max-width: 860px; margin: 0 auto; padding: 24px 20px 12px; }

.welcome { text-align: center; padding: 48px 12px 12px; }
.welcome-logo {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
}
.welcome-title { font-size: 21px; font-weight: 650; margin: 0 0 8px; }
.welcome-message { font-size: 14px; color: var(--muted); margin: 0 0 26px; max-width: 480px; margin-left: auto; margin-right: auto; }
.suggested-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  max-width: 640px;
  margin: 0 auto;
}
.suggested-chip {
  text-align: start;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13.5px;
  color: var(--ink);
  cursor: pointer;
  transition: border-color .12s ease, background .12s ease;
}
.suggested-chip:hover { border-color: var(--primary); background: var(--surface); }

/* ---------- Messages ---------- */
.messages { display: flex; flex-direction: column; gap: 18px; padding-bottom: 12px; }
.msg-row { display: flex; gap: 10px; }
.msg-row-user { justify-content: flex-end; }
.msg-row-assistant { justify-content: flex-start; align-items: flex-start; }

.assistant-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--surface); border: 1px solid var(--border);
  color: var(--primary);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.assistant-col { max-width: 82%; display: flex; flex-direction: column; gap: 6px; }

.msg-bubble { font-size: 14.5px; line-height: 1.6; }
.msg-bubble-user {
  background: #EEF3F8;
  border-radius: 12px;
  padding: 10px 14px;
  max-width: 72%;
}
.msg-bubble-assistant { padding: 2px 0; }

.msg-heading { font-size: 15.5px; font-weight: 650; margin: 10px 0 4px; }
.msg-paragraph { margin: 0 0 8px; }
.msg-list { margin: 0 0 10px; padding-inline-start: 20px; }
.msg-list li { margin-bottom: 4px; }
.msg-link { color: var(--primary); text-decoration: underline; }

.msg-table-wrap { overflow-x: auto; margin: 6px 0 12px; }
.msg-table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
.msg-table th, .msg-table td {
  border: 1px solid var(--border);
  padding: 8px 10px;
  text-align: start;
}
.msg-table th { background: var(--surface); font-weight: 600; }

.caret {
  display: inline-block;
  width: 2px; height: 15px;
  background: var(--ink);
  margin-inline-start: 2px;
  animation: blink 1s step-start infinite;
  vertical-align: text-bottom;
}
@keyframes blink { 50% { opacity: 0; } }

/* ---------- Tool panels ---------- */
.tool-citizen {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--muted);
  padding: 4px 0;
}
.tool-detailed {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  font-size: 12.5px;
  overflow: hidden;
}
.tool-detailed-toggle {
  width: 100%;
  display: flex; align-items: center; justify-content: space-between;
  border: none; background: transparent;
  padding: 8px 10px;
  font-size: 12.5px; font-weight: 600; color: var(--muted);
  cursor: pointer;
}
.tool-detailed-list { border-top: 1px solid var(--border); padding: 6px 10px 8px; display: flex; flex-direction: column; gap: 8px; }
.tool-row-head { display: flex; align-items: center; gap: 7px; }
.tool-icon-done { color: var(--success); }
.tool-icon-running { color: var(--primary); }
.tool-name { font-weight: 600; color: var(--ink); }
.tool-status { margin-inline-start: auto; padding: 1px 7px; border-radius: 20px; font-size: 11px; }
.tool-status-done { background: #E6F4EA; color: var(--success); }
.tool-status-running { background: #E9F0F7; color: var(--primary); }
.tool-time { color: var(--muted); font-size: 11px; }
.tool-row-summary { color: var(--muted); padding-inline-start: 21px; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---------- Expandable ---------- */
.expandable { margin-top: 4px; }
.expandable-toggle {
  display: flex; align-items: center; gap: 6px;
  border: none; background: transparent;
  color: var(--primary); font-size: 13px; font-weight: 600;
  cursor: pointer; padding: 2px 0;
}
.expandable-body {
  margin-top: 6px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.6;
}

/* ---------- Message actions ---------- */
.msg-actions { display: flex; gap: 2px; }
.icon-btn {
  border: none; background: transparent;
  color: var(--muted);
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; cursor: pointer;
}
.icon-btn:hover { background: var(--surface); color: var(--ink); }
.icon-btn:disabled { opacity: .4; cursor: not-allowed; }
.icon-btn-ghost { color: var(--muted); }
.icon-btn-primary { background: var(--primary); color: #fff; border-radius: 50%; }
.icon-btn-primary:hover { background: var(--primary); opacity: .9; }

/* ---------- Footer / composer ---------- */
.app-footer { border-top: 1px solid var(--border); background: #fff; flex-shrink: 0; }
.app-footer-inner { max-width: 860px; margin: 0 auto; padding: 12px 20px 14px; }

.composer {
  display: flex; align-items: flex-end; gap: 8px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 8px 8px 8px 14px;
  background: #fff;
}
.composer:focus-within { border-color: var(--primary); }
.composer-input {
  flex: 1;
  border: none; outline: none; resize: none;
  font-size: 14.5px;
  font-family: inherit;
  max-height: 140px;
  padding: 6px 0;
  background: transparent;
  color: var(--ink);
}
.composer-actions { display: flex; align-items: center; gap: 4px; }
.send-btn {
  border: none;
  background: var(--primary);
  color: #fff;
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.send-btn:disabled { opacity: .35; cursor: not-allowed; }
.send-btn-stop { background: var(--ink); }

.recorder-bar {
  display: flex; align-items: center; gap: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 8px 14px;
}
.recorder-indicator { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ink); }
.recorder-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--danger);
  animation: pulse 1.1s ease-in-out infinite;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
.recorder-timer { font-variant-numeric: tabular-nums; color: var(--muted); font-size: 13px; }
.recorder-actions { display: flex; gap: 6px; margin-inline-start: auto; }

.disclaimer { text-align: center; font-size: 11.5px; color: var(--muted); margin-top: 9px; }

@media (max-width: 640px) {
  .assistant-col { max-width: 92%; }
  .msg-bubble-user { max-width: 88%; }
  .welcome { padding-top: 28px; }
}
`;
