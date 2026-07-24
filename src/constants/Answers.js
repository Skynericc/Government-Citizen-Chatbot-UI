/* ------------------------------------------------------------------ */
/* Canned demo answer content per language (stand-in for a real LLM/   */
/* MCP backend). Replace with a live streaming source in production.   */
/* ------------------------------------------------------------------ */

export const ANSWERS = {
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