/* ------------------------------------------------------------------ */
/* Canned demo answer content per topic and language (stand-in for a   */
/* real LLM/MCP backend). Replace with a live streaming source in      */
/* production.                                                          */
/*                                                                       */
/* Each topic key below maps 1:1 (by array index) to STRINGS[lang]     */
/* .suggested in constants/Strings.js — see TOPIC_ORDER in              */
/* CitizenAssistant.jsx. The `default` topic is used whenever a typed  */
/* question doesn't match one of the suggested prompts.                */
/*                                                                       */
/* `citations` are referenced inline in `text` via `[[n]]` tokens,     */
/* rendered by utils/Markdown.jsx + components/Citations.jsx.          */
/* ------------------------------------------------------------------ */

export const ANSWERS = {
  cnie: {
    fr: {
      text:
`Voici la procédure pour **renouveler votre CNIE (carte nationale d'identité électronique)** :

1. Remplissez la pré-demande en ligne sur le portail national des titres sécurisés. [[1]]
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
- Le certificat de résidence est délivré par la police (zones urbaines), la gendarmerie royale (zones rurales), ou l'autorité administrative locale en leur absence. [[2]]

Vous pouvez [accéder au portail de pré-demande](https://www.watiqa.ma) sur le site officiel de la Direction Générale de la Sûreté Nationale.`,
      expandableTitle: "En savoir plus sur les délais et sanctions",
      expandableBody:
`Certains arrondissements proposent un créneau prioritaire pour les personnes ayant un déplacement imminent justifié (billet d'avion, convocation administrative). Le fait de ne pas détenir de CNIE valide peut entraîner une amende. Les mineurs doivent être accompagnés d'un représentant légal muni d'une pièce d'identité et du livret de famille.`,
      citations: [
        { id: 1, url: "https://www.watiqa.ma", label: "Portail national des titres sécurisés — Watiqa" },
        { id: 2, url: "https://www.epolice.ma", label: "Direction Générale de la Sûreté Nationale" },
      ],
    },
    en: {
      text:
`Here is the procedure to **renew your CNIE (electronic national ID card)**:

1. Fill in the pre-application online on the national secure documents portal. [[1]]
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
- The certificate of residence is issued by the police (urban areas), the Royal Gendarmerie (rural areas), or the local administrative authority where these are unavailable. [[2]]

You can [access the pre-application portal](https://www.watiqa.ma) on the official website of the Direction Générale de la Sûreté Nationale.`,
      expandableTitle: "Learn more about processing times and penalties",
      expandableBody:
`Some arrondissements offer a priority slot for people with a justified imminent trip (plane ticket, official summons). Not holding a valid CNIE can result in a fine. Minors must be accompanied by a legal guardian holding valid ID and the family record book.`,
      citations: [
        { id: 1, url: "https://www.watiqa.ma", label: "National Secure Documents Portal — Watiqa" },
        { id: 2, url: "https://www.epolice.ma", label: "Direction Générale de la Sûreté Nationale" },
      ],
    },
    ar: {
      text:
`فيما يلي إجراءات **تجديد البطاقة الوطنية للتعريف الإلكترونية (CNIE)**:

1. املأ الطلب المسبق عبر الإنترنت على البوابة الوطنية للوثائق المؤمّنة. [[1]]
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
- تُسلَّم شهادة السكنى من طرف الشرطة (بالمناطق الحضرية)، أو الدرك الملكي (بالمناطق القروية)، أو السلطة المحلية في حال غياب هذه الجهات. [[2]]

يمكنك [الولوج إلى بوابة الطلب المسبق](https://www.watiqa.ma) على الموقع الرسمي للمديرية العامة للأمن الوطني.`,
      expandableTitle: "معرفة المزيد حول الآجال والعقوبات",
      expandableBody:
`تقترح بعض الدوائر موعدًا ذا أولوية للأشخاص الذين لديهم سفر وشيك مبرر (تذكرة طيران، استدعاء إداري). قد يترتب عن عدم التوفر على بطاقة CNIE سارية المفعول غرامة مالية. يجب أن يكون القاصرون مرفوقين بممثل قانوني حامل لبطاقة تعريف سارية المفعول ودفتر العائلة.`,
      citations: [
        { id: 1, url: "https://www.watiqa.ma", label: "البوابة الوطنية للوثائق المؤمّنة — وثيقة" },
        { id: 2, url: "https://www.epolice.ma", label: "المديرية العامة للأمن الوطني" },
      ],
    },
  },

  passport: {
    fr: {
      text:
`Voici la procédure pour **demander un passeport biométrique** :

1. Remplissez la pré-demande en ligne sur le portail national des titres sécurisés. [[1]]
2. Prenez rendez-vous auprès de l'arrondissement, du commissariat de police, ou de la gendarmerie royale (en zone rurale) dont vous dépendez.
3. Présentez-vous avec les pièces justificatives originales pour la prise d'empreintes et de la photo biométrique.
4. Retirez votre passeport une fois prêt, ou optez pour la livraison à domicile si disponible dans votre ville.

**Documents à préparer :**

| Situation | Documents requis |
|---|---|
| Première demande | CNIE en cours de validité, extrait d'acte de naissance de moins de 3 mois, certificat de résidence, 2 photos |
| Renouvellement (expiré ou pages saturées) | Ancien passeport, CNIE en cours de validité, certificat de résidence |
| Perte ou vol | Déclaration de perte, CNIE, extrait d'acte de naissance, certificat de résidence |

- Le délai moyen de délivrance est de 1 à 3 semaines. [[2]]
- Le passeport biométrique est valable 5 ans pour les mineurs et 10 ans pour les majeurs.
- Les mineurs doivent être accompagnés d'un représentant légal muni d'une pièce d'identité.

Vous pouvez [accéder au portail de pré-demande](https://www.watiqa.ma) sur le site officiel du portail national des titres sécurisés.`,
      expandableTitle: "En savoir plus sur les frais et la livraison à domicile",
      expandableBody:
`Le passeport biométrique est soumis à des droits de timbre payables lors du dépôt du dossier. Certaines villes proposent une livraison à domicile moyennant des frais supplémentaires. En cas de déplacement urgent justifié, une procédure accélérée peut être demandée sur place.`,
      citations: [
        { id: 1, url: "https://www.watiqa.ma", label: "Portail national des titres sécurisés — Watiqa" },
        { id: 2, url: "https://www.epolice.ma", label: "Direction Générale de la Sûreté Nationale" },
      ],
    },
    en: {
      text:
`Here is the procedure to **apply for a biometric passport**:

1. Fill in the pre-application online on the national secure documents portal. [[1]]
2. Book an appointment at the arrondissement, police station, or Royal Gendarmerie (in rural areas) covering your address.
3. Attend the appointment with the original supporting documents for fingerprinting and a biometric photo.
4. Collect your passport once ready, or choose home delivery if available in your city.

**Documents to prepare:**

| Situation | Required documents |
|---|---|
| First application | Valid CNIE, birth certificate extract less than 3 months old, certificate of residence, 2 photos |
| Renewal (expired or pages full) | Old passport, valid CNIE, certificate of residence |
| Loss or theft | Loss declaration, CNIE, birth certificate extract, certificate of residence |

- Average issuance time is 1 to 3 weeks. [[2]]
- The biometric passport is valid for 5 years for minors and 10 years for adults.
- Minors must be accompanied by a legal guardian holding valid ID.

You can [access the pre-application portal](https://www.watiqa.ma) on the official website of the national secure documents portal.`,
      expandableTitle: "Learn more about fees and home delivery",
      expandableBody:
`The biometric passport is subject to stamp duty payable when the application is filed. Some cities offer home delivery for an extra fee. For a justified urgent trip, an expedited procedure can be requested on site.`,
      citations: [
        { id: 1, url: "https://www.watiqa.ma", label: "National Secure Documents Portal — Watiqa" },
        { id: 2, url: "https://www.epolice.ma", label: "Direction Générale de la Sûreté Nationale" },
      ],
    },
    ar: {
      text:
`فيما يلي إجراءات **طلب جواز سفر بيومتري**:

1. املأ الطلب المسبق عبر الإنترنت على البوابة الوطنية للوثائق المؤمّنة. [[1]]
2. احجز موعدًا لدى الدائرة أو مركز الشرطة، أو الدرك الملكي (بالمناطق القروية) التابع لعنوان سكناك.
3. احضر إلى الموعد مصحوبًا بالوثائق الأصلية لأخذ البصمات والصورة البيومترية.
4. استلم جواز سفرك بمجرد جهوزيته، أو اختر التوصيل إلى المنزل إذا كانت الخدمة متوفرة في مدينتك.

**الوثائق الواجب تحضيرها:**

| الحالة | الوثائق المطلوبة |
|---|---|
| طلب أول | بطاقة وطنية سارية الصلاحية، نسخة من عقد الازدياد لا يتجاوز عمرها 3 أشهر، شهادة السكنى، صورتان شمسيتان |
| تجديد (منتهي الصلاحية أو ممتلئ) | جواز السفر القديم، بطاقة وطنية سارية الصلاحية، شهادة السكنى |
| فقدان أو سرقة | تصريح بالفقدان، البطاقة الوطنية، نسخة من عقد الازدياد، شهادة السكنى |

- المدة المتوسطة للتسليم تتراوح بين أسبوع و3 أسابيع. [[2]]
- جواز السفر البيومتري صالح لمدة 5 سنوات للقاصرين و10 سنوات للبالغين.
- يجب أن يكون القاصرون مرفوقين بممثل قانوني حامل لبطاقة تعريف سارية المفعول.

يمكنك [الولوج إلى بوابة الطلب المسبق](https://www.watiqa.ma) على الموقع الرسمي للبوابة الوطنية للوثائق المؤمّنة.`,
      expandableTitle: "معرفة المزيد حول الرسوم والتوصيل إلى المنزل",
      expandableBody:
`يخضع جواز السفر البيومتري لواجبات الطابع تُؤدى عند إيداع الملف. تقترح بعض المدن خدمة التوصيل إلى المنزل مقابل رسوم إضافية. في حالة سفر عاجل مبرر، يمكن طلب مسطرة معجّلة في عين المكان.`,
      citations: [
        { id: 1, url: "https://www.watiqa.ma", label: "البوابة الوطنية للوثائق المؤمّنة — وثيقة" },
        { id: 2, url: "https://www.epolice.ma", label: "المديرية العامة للأمن الوطني" },
      ],
    },
  },

  birthCertificate: {
    fr: {
      text:
`Voici comment **obtenir un extrait d'acte de naissance** :

1. Adressez votre demande à l'arrondissement ou à la commune du lieu de naissance, en personne ou via le portail national des collectivités territoriales. [[1]]
2. Précisez le numéro d'acte et l'année de naissance si vous les connaissez, afin d'accélérer la recherche.
3. Retirez l'extrait au guichet, ou recevez-le par voie électronique si le service en ligne est disponible dans votre commune. [[2]]

**Documents à préparer :**

| Situation | Documents requis |
|---|---|
| Demande pour soi-même | CNIE, numéro d'acte si connu |
| Demande pour un enfant mineur | CNIE du parent, livret de famille |
| Demande par un tiers mandaté | Procuration, CNIE du mandataire |

- L'extrait d'acte de naissance est généralement délivré le jour même ou sous 48 heures.
- Il est valable 3 mois pour la plupart des démarches administratives.
- Le service est gratuit dans la majorité des communes.

Vous pouvez consulter [la liste des communes proposant le service en ligne](https://www.collectivites-territoriales.gov.ma) sur le portail national des collectivités territoriales.`,
      expandableTitle: "En savoir plus sur les actes anciens ou hors commune de résidence",
      expandableBody:
`Si l'acte de naissance a été établi dans une autre commune que celle où vous résidez actuellement, la demande peut être adressée par courrier ou via le portail en ligne lorsque celui-ci est disponible. Les actes très anciens (avant informatisation) peuvent nécessiter un délai supplémentaire de recherche dans les registres papier.`,
      citations: [
        { id: 1, url: "https://www.collectivites-territoriales.gov.ma", label: "Portail national des collectivités territoriales" },
        { id: 2, url: "https://idarati.ma", label: "Portail National des Règles et Procédures Administratives" },
      ],
    },
    en: {
      text:
`Here is how to **get a birth certificate extract**:

1. Submit your request to the arrondissement or commune of the place of birth, in person or via the national territorial authorities portal. [[1]]
2. State the certificate number and year of birth if known, to speed up the search.
3. Collect the extract at the counter, or receive it electronically if the online service is available in your commune. [[2]]

**Documents to prepare:**

| Situation | Required documents |
|---|---|
| Request for yourself | CNIE, certificate number if known |
| Request for a minor child | Parent's CNIE, family record book |
| Request by an authorized third party | Power of attorney, representative's CNIE |

- The birth certificate extract is usually issued the same day or within 48 hours.
- It is valid for 3 months for most administrative procedures.
- The service is free in most communes.

You can check [the list of communes offering the online service](https://www.collectivites-territoriales.gov.ma) on the national territorial authorities portal.`,
      expandableTitle: "Learn more about old records or records outside your commune",
      expandableBody:
`If the birth certificate was issued in a different commune from the one you currently live in, the request can be sent by mail or through the online portal where available. Very old records (before digitization) may require extra time to search paper registers.`,
      citations: [
        { id: 1, url: "https://www.collectivites-territoriales.gov.ma", label: "National Territorial Authorities Portal" },
        { id: 2, url: "https://idarati.ma", label: "National Administrative Rules and Procedures Portal" },
      ],
    },
    ar: {
      text:
`فيما يلي كيفية **الحصول على نسخة من عقد الازدياد**:

1. توجه بطلبك إلى الدائرة أو الجماعة التابع لها مكان الازدياد، إما شخصيًا أو عبر البوابة الوطنية للجماعات الترابية. [[1]]
2. حدد رقم العقد وسنة الازدياد إن كانت معروفة لديك، لتسريع عملية البحث.
3. استلم النسخة من الشباك، أو احصل عليها إلكترونيًا إذا كانت الخدمة عبر الإنترنت متوفرة في جماعتك. [[2]]

**الوثائق الواجب تحضيرها:**

| الحالة | الوثائق المطلوبة |
|---|---|
| طلب لفائدة الشخص نفسه | البطاقة الوطنية، رقم العقد إن كان معروفًا |
| طلب لفائدة طفل قاصر | البطاقة الوطنية لأحد الوالدين، دفتر العائلة |
| طلب من طرف وكيل مفوَّض | وكالة، البطاقة الوطنية للوكيل |

- تُسلَّم نسخة عقد الازدياد عادةً في نفس اليوم أو خلال 48 ساعة.
- صالحة لمدة 3 أشهر بالنسبة لمعظم الإجراءات الإدارية.
- الخدمة مجانية في غالبية الجماعات.

يمكنك الاطلاع على [لائحة الجماعات التي تقترح الخدمة عبر الإنترنت](https://www.collectivites-territoriales.gov.ma) على البوابة الوطنية للجماعات الترابية.`,
      expandableTitle: "معرفة المزيد حول العقود القديمة أو خارج جماعة السكنى",
      expandableBody:
`إذا كان عقد الازدياد قد حُرِّر في جماعة أخرى غير التي تقيم بها حاليًا، يمكن توجيه الطلب بالبريد أو عبر البوابة الإلكترونية عند توفرها. قد تتطلب العقود القديمة جدًا (قبل المعلوماتية) وقتًا إضافيًا للبحث في السجلات الورقية.`,
      citations: [
        { id: 1, url: "https://www.collectivites-territoriales.gov.ma", label: "البوابة الوطنية للجماعات الترابية" },
        { id: 2, url: "https://idarati.ma", label: "البوابة الوطنية للمساطر والإجراءات الإدارية" },
      ],
    },
  },

  residenceCertificate: {
    fr: {
      text:
`Voici comment **obtenir un certificat de résidence** :

1. Rendez-vous au commissariat de police de votre quartier (zone urbaine) ou à la brigade de la gendarmerie royale (zone rurale). [[1]]
2. Présentez une pièce d'identité et un justificatif de domicile récent (facture d'eau, d'électricité, ou contrat de bail).
3. Le certificat est généralement délivré sur place après vérification.

**Documents à préparer :**

| Situation | Documents requis |
|---|---|
| Résident propriétaire | CNIE, facture récente (eau, électricité) |
| Résident locataire | CNIE, contrat de bail, facture récente |
| Hébergé chez un tiers | CNIE, attestation d'hébergement, CNIE de l'hébergeant |

- Le certificat de résidence est valable pour la plupart des démarches administratives pendant 3 à 6 mois selon l'organisme demandeur.
- En l'absence de commissariat ou de gendarmerie à proximité, l'autorité administrative locale (caïdat) peut délivrer ce certificat. [[2]]
- Le service est gratuit.

Pour toute question, vous pouvez contacter [le commissariat de police le plus proche](https://www.epolice.ma) via le site officiel de la DGSN.`,
      expandableTitle: "En savoir plus sur les justificatifs de domicile acceptés",
      expandableBody:
`Lorsque les factures sont établies au nom d'un tiers (parent, conjoint), une attestation d'hébergement signée par l'hébergeant, accompagnée de sa pièce d'identité, est généralement acceptée en complément. Certains commissariats acceptent également un contrat de bail non enregistré, à confirmer localement.`,
      citations: [
        { id: 1, url: "https://www.epolice.ma", label: "Direction Générale de la Sûreté Nationale" },
        { id: 2, url: "https://idarati.ma", label: "Portail National des Règles et Procédures Administratives" },
      ],
    },
    en: {
      text:
`Here is how to **get a certificate of residence**:

1. Go to the police station covering your neighbourhood (urban areas) or the Royal Gendarmerie brigade (rural areas). [[1]]
2. Bring an ID document and a recent proof of address (water bill, electricity bill, or lease agreement).
3. The certificate is usually issued on the spot after verification.

**Documents to prepare:**

| Situation | Required documents |
|---|---|
| Resident owner | CNIE, recent bill (water, electricity) |
| Resident tenant | CNIE, lease agreement, recent bill |
| Hosted by a third party | CNIE, hosting attestation, host's CNIE |

- The certificate of residence is generally valid for 3 to 6 months depending on the requesting body.
- Where no police station or gendarmerie is nearby, the local administrative authority (caïdat) can issue this certificate. [[2]]
- The service is free.

For any question, you can contact [your nearest police station](https://www.epolice.ma) via the official DGSN website.`,
      expandableTitle: "Learn more about accepted proof of address",
      expandableBody:
`When bills are in a third party's name (parent, spouse), a hosting attestation signed by the host, along with their ID, is generally accepted as a supporting document. Some police stations also accept an unregistered lease agreement — check locally.`,
      citations: [
        { id: 1, url: "https://www.epolice.ma", label: "Direction Générale de la Sûreté Nationale" },
        { id: 2, url: "https://idarati.ma", label: "National Administrative Rules and Procedures Portal" },
      ],
    },
    ar: {
      text:
`فيما يلي كيفية **الحصول على شهادة السكنى**:

1. توجه إلى مركز الشرطة التابع لحيك (بالمناطق الحضرية) أو إلى فرقة الدرك الملكي (بالمناطق القروية). [[1]]
2. أحضر بطاقة تعريف وإثبات سكن حديث (فاتورة ماء أو كهرباء، أو عقد كراء).
3. تُسلَّم الشهادة عادةً في عين المكان بعد التحقق.

**الوثائق الواجب تحضيرها:**

| الحالة | الوثائق المطلوبة |
|---|---|
| مقيم مالك | البطاقة الوطنية، فاتورة حديثة (ماء، كهرباء) |
| مقيم مكتري | البطاقة الوطنية، عقد الكراء، فاتورة حديثة |
| مستضاف لدى الغير | البطاقة الوطنية، شهادة الإيواء، البطاقة الوطنية للمُضيف |

- تكون شهادة السكنى صالحة عمومًا لمدة تتراوح بين 3 و6 أشهر حسب الجهة الطالبة.
- في حالة عدم وجود مركز شرطة أو درك بالقرب من السكن، يمكن للسلطة المحلية (القيادة) تسليم هذه الشهادة. [[2]]
- الخدمة مجانية.

لأي استفسار، يمكنك الاتصال بـ[أقرب مركز شرطة](https://www.epolice.ma) عبر الموقع الرسمي للمديرية العامة للأمن الوطني.`,
      expandableTitle: "معرفة المزيد حول إثباتات السكن المقبولة",
      expandableBody:
`عندما تكون الفواتير باسم شخص آخر (أحد الوالدين، الزوج/الزوجة)، تُقبل عادةً شهادة إيواء موقعة من طرف المُضيف مرفقة ببطاقة تعريفه كوثيقة داعمة. تقبل بعض مراكز الشرطة أيضًا عقد كراء غير مسجل — يُستحسن التأكد محليًا.`,
      citations: [
        { id: 1, url: "https://www.epolice.ma", label: "المديرية العامة للأمن الوطني" },
        { id: 2, url: "https://idarati.ma", label: "البوابة الوطنية للمساطر والإجراءات الإدارية" },
      ],
    },
  },

  vehicleRegistration: {
    fr: {
      text:
`Voici la procédure pour **immatriculer un véhicule (carte grise)** :

1. Effectuez la pré-demande en ligne sur le portail khadamatnarsa. [[1]]
2. Faites viser le certificat de cession (véhicule d'occasion) ou la facture (véhicule neuf) par les autorités compétentes.
3. Déposez le dossier complet auprès de l'Agence Nationale de la Sécurité Routière ou de la représentation habilitée. [[2]]
4. Récupérez votre carte grise une fois le dossier validé.

**Documents à préparer :**

| Situation | Documents requis |
|---|---|
| Véhicule neuf | Facture d'achat, certificat de conformité, CNIE, attestation d'assurance |
| Véhicule d'occasion | Certificat de cession visé, ancienne carte grise, CNIE, attestation d'assurance |
| Changement d'adresse | Ancienne carte grise, CNIE, certificat de résidence |

- Le délai moyen de délivrance est de 1 à 2 semaines.
- L'immatriculation est obligatoire avant toute circulation sur la voie publique.
- Une taxe de la vignette automobile doit être réglée annuellement.

Vous pouvez [accéder au portail officiel de l'Agence National de la Sécurité Routière(NARSA)](https://khadamatnarsa.ma) sur le site officiel de l'Agance National de la Sécurité Routière.`,
      expandableTitle: "En savoir plus sur le changement de propriétaire et la vignette",
      expandableBody:
`Lors d'une vente entre particuliers, le certificat de cession doit être visé par l'autorité administrative locale ou notarié dans certains cas, dans un délai de 15 jours suivant la transaction. Le défaut de paiement de la vignette automobile expose le propriétaire à une amende et à l'immobilisation du véhicule lors d'un contrôle.`,
      citations: [
        { id: 1, url: "https://khadamatnarsa.ma", label: "Portail officiel de l'Agence National de la Sécurité Routière - NARSA" },
        { id: 2, url: "https://www.epolice.ma", label: "Direction Générale de la Sûreté Nationale" },
      ],
    },
    en: {
      text:
`Here is the procedure to **register a vehicle (carte grise)**:

1. Submit the pre-application online on the khadamatnarsa portal. [[1]]
2. Have the transfer certificate (used vehicle) or invoice (new vehicle) endorsed by the competent authorities.
3. File the complete application with the NAtional Road Safety Agency or an authorized representative office. [[2]]
4. Collect your registration certificate once the file is approved.

**Documents to prepare:**

| Situation | Required documents |
|---|---|
| New vehicle | Purchase invoice, certificate of conformity, CNIE, proof of insurance |
| Used vehicle | Endorsed transfer certificate, old registration certificate, CNIE, proof of insurance |
| Change of address | Old registration certificate, CNIE, certificate of residence |

- Average issuance time is 1 to 2 weeks.
- Registration is mandatory before driving on public roads.
- An annual road tax (vignette) must be paid.

You can [access the NARSA portal](https://khadamatnarsa.ma) on the official website of the National Road Safety Agency.`,
      expandableTitle: "Learn more about change of ownership and the road tax",
      expandableBody:
`For a private sale, the transfer certificate must be endorsed by the local administrative authority or notarized in some cases, within 15 days of the transaction. Failure to pay the road tax can result in a fine and the vehicle being impounded during a roadside check.`,
      citations: [
        { id: 1, url: "https://khadamatnarsa.ma/", label: "Narsa Services Portal - National Road Safety Agency" },
        { id: 2, url: "https://www.epolice.ma", label: "Direction Générale de la Sûreté Nationale" },
      ],
    },
    ar: {
      text:
`فيما يلي إجراءات **تسجيل سيارة (البطاقة الرمادية)**:

1. قم بالطلب المسبق عبر الإنترنت على بوابة التسجيل الإلكتروني. [[1]]
2. قم بتأشير شهادة التفويت (بالنسبة للسيارة المستعملة) أو الفاتورة (بالنسبة للسيارة الجديدة) من طرف الجهات المختصة.
3. أودع الملف الكامل لدى الوكالة الوطنية للسلامة الطرقية أو لدى ممثلية مؤهلة. [[2]]
4. استلم بطاقتك الرمادية بمجرد المصادقة على الملف.

**الوثائق الواجب تحضيرها:**

| الحالة | الوثائق المطلوبة |
|---|---|
| سيارة جديدة | فاتورة الشراء، شهادة المطابقة، البطاقة الوطنية، شهادة التأمين |
| سيارة مستعملة | شهادة التفويت المؤشرة، البطاقة الرمادية القديمة، البطاقة الوطنية، شهادة التأمين |
| تغيير العنوان | البطاقة الرمادية القديمة، البطاقة الوطنية، شهادة السكنى |

- المدة المتوسطة للتسليم تتراوح بين أسبوع وأسبوعين.
- التسجيل إلزامي قبل السير على الطريق العمومي.
- يجب أداء الضريبة السنوية على السيارات (الوينيت).

يمكنك [الولوج إلى بوابة التسجيل الإلكتروني](https://khadamatnarsa.ma) على الموقع الرسمي للوكالة الوطنية للسلامة الطرقية.`,
      expandableTitle: "معرفة المزيد حول تغيير المالك والوينيت",
      expandableBody:
`في حالة البيع بين الخواص، يجب تأشير شهادة التفويت من طرف السلطة المحلية أو توثيقها لدى العدول في بعض الحالات، داخل أجل 15 يومًا من تاريخ المعاملة. يعرض عدم أداء الوينيت مالك السيارة لغرامة مالية ولتوقيف السيارة أثناء المراقبة الطرقية.`,
      citations: [
        { id: 1, url: "https://khadamatnarsa.ma", label: "بوابة التسجيل الإلكتروني — الوكالة الوطنية للسلامة الطرقية" },
        { id: 2, url: "https://www.epolice.ma", label: "المديرية العامة للأمن الوطني" },
      ],
    },
  },

  default: {
    fr: {
      text:
`Je m'appuie uniquement sur des sources officielles et je n'ai pas encore d'information vérifiée pour cette demande précise.

Voici ce que vous pouvez faire :
- Reformulez votre question en précisant la démarche souhaitée (CNIE, passeport, acte de naissance, certificat de résidence, carte grise…).
- Consultez le [portail national des règles et procédures administratives](https://idarati.ma) pour une recherche par démarche. [[1]]
- Contactez le numéro vert du Ministère de l'Intérieur pour une orientation personnalisée.

N'hésitez pas à reformuler votre question ou à choisir l'une des démarches suggérées ci-dessus.`,
      expandableTitle: "Pourquoi cette réponse est limitée",
      expandableBody:
`Cette démonstration ne couvre que cinq démarches administratives à titre d'exemple. Dans une version connectée à un backend réel, l'assistant interrogerait les sources officielles pertinentes pour répondre à toute question citoyenne.`,
      citations: [
        { id: 1, url: "https://idarati.ma", label: "Portail national des règles et procédures administratives" },
      ],
    },
    en: {
      text:
`I only rely on official sources, and I don't yet have verified information for this specific request.

Here's what you can do:
- Rephrase your question with the procedure you need (ID card, passport, birth certificate, certificate of residence, vehicle registration…).
- Check the [national administrative rules and procedures portal](https://idarati.ma) to search by procedure. [[1]]
- Call the Ministry of Interior's helpline for personal guidance.

Feel free to rephrase your question or pick one of the suggested topics above.`,
      expandableTitle: "Why this answer is limited",
      expandableBody:
`This demo only covers five administrative procedures as examples. In a version connected to a real backend, the assistant would query the relevant official sources to answer any citizen question.`,
      citations: [
        { id: 1, url: "https://idarati.ma", label: "National Administrative Rules and Procedures Portal" },
      ],
    },
    ar: {
      text:
`أعتمد فقط على المصادر الرسمية، ولا تتوفر لدي بعد معلومات موثقة بخصوص هذا الطلب تحديدًا.

إليك ما يمكنك القيام به:
- أعد صياغة سؤالك مع تحديد الإجراء المطلوب (البطاقة الوطنية، جواز السفر، عقد الازدياد، شهادة السكنى، البطاقة الرمادية...).
- تصفح [البوابة الوطنية للمساطر والإجراءات الإدارية](https://idarati.ma) للبحث حسب الإجراء. [[1]]
- اتصل بالرقم الأخضر لوزارة الداخلية للحصول على توجيه شخصي.

لا تتردد في إعادة صياغة سؤالك أو اختيار أحد الأسئلة المقترحة أعلاه.`,
      expandableTitle: "لماذا هذه الإجابة محدودة",
      expandableBody:
`يغطي هذا العرض التوضيحي خمسة إجراءات إدارية فقط على سبيل المثال. في نسخة متصلة بخلفية حقيقية، سيقوم المساعد بالاستعلام من المصادر الرسمية ذات الصلة للإجابة عن أي سؤال يطرحه المواطن.`,
      citations: [
        { id: 1, url: "https://idarati.ma", label: "البوابة الوطنية للمساطر والإجراءات الإدارية" },
      ],
    },
  },
};

/* Index-aligned with STRINGS[lang].suggested in constants/Strings.js. */
export const TOPIC_ORDER = [
  "cnie",
  "passport",
  "birthCertificate",
  "residenceCertificate",
  "vehicleRegistration",
];
