# CDMT Application - Internationalization & Accessibility Guide

**Sprint:** 8.3 & 8.4
**Date:** 2026-01-04
**Languages:** Français (FR), English (EN), العربية (AR)
**Accessibility Standard:** WCAG 2.1 Level AA

---

## Sprint 8.3: Internationalization (i18n) - IMPLEMENTED

### Overview

The CDMT application now supports **3 languages**: French (default), English, and Arabic with full RTL (Right-to-Left) support.

**Technologies:**
- `i18next` - Core i18n framework
- `react-i18next` - React integration
- `i18next-browser-languagedetector` - Auto language detection
- `i18next-http-backend` - Dynamic translation loading

---

### 1. Configuration

**File:** `frontend/src/i18n/config.ts` ✅ CREATED

**Features:**
- Auto language detection (localStorage → browser navigator)
- Fallback to French (default for Djibouti)
- Automatic RTL/LTR direction switching for Arabic
- React Suspense support for loading translations

---

### 2. Translation File Structure

```
frontend/src/i18n/
├── config.ts                    # i18n configuration
└── locales/
    ├── fr/
    │   ├── translation.json     # French translations
    │   ├── common.json          # Common terms
    │   ├── forms.json           # Form labels
    │   └── documents.json       # Document templates
    ├── en/
    │   ├── translation.json     # English translations
    │   ├── common.json
    │   ├── forms.json
    │   └── documents.json
    └── ar/
        ├── translation.json     # Arabic translations (RTL)
        ├── common.json
        ├── forms.json
        └── documents.json
```

---

### 3. Sample Translation Files

#### French (fr/translation.json) - DEFAULT

```json
{
  "common": {
    "appName": "CDMT - Cadre de Dépenses à Moyen Terme",
    "ministry": "Ministère de l'Économie et des Finances",
    "country": "République de Djibouti",
    "welcome": "Bienvenue",
    "loading": "Chargement...",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "create": "Créer",
    "search": "Rechercher",
    "filter": "Filtrer",
    "export": "Exporter",
    "import": "Importer",
    "submit": "Soumettre",
    "validate": "Valider",
    "reject": "Rejeter"
  },
  "nav": {
    "dashboard": "Tableau de bord",
    "referentials": "Référentiels",
    "ministries": "Ministères",
    "programs": "Programmes",
    "strategicAxes": "Axes stratégiques",
    "budget": "Budget",
    "cdmt": "CDMT",
    "reports": "Rapports",
    "settings": "Paramètres",
    "logout": "Déconnexion"
  },
  "auth": {
    "login": "Connexion",
    "email": "Email",
    "password": "Mot de passe",
    "forgotPassword": "Mot de passe oublié?",
    "loginButton": "Se connecter",
    "loginError": "Email ou mot de passe incorrect"
  },
  "ministries": {
    "title": "Gestion des Ministères",
    "add": "Ajouter un ministère",
    "code": "Code",
    "name": "Nom",
    "acronym": "Sigle",
    "status": "Statut",
    "active": "Actif",
    "inactive": "Inactif",
    "actions": "Actions",
    "deleteConfirm": "Êtes-vous sûr de vouloir supprimer ce ministère?"
  },
  "documents": {
    "tofe": "Tableau des Opérations Financières de l'État",
    "cbmt": "Cadre Budgétaire à Moyen Terme",
    "cdmt": "Cadre de Dépenses à Moyen Terme",
    "generate": "Générer le document",
    "download": "Télécharger",
    "year": "Année fiscale",
    "status": "Statut",
    "draft": "Brouillon",
    "submitted": "Soumis",
    "validated": "Validé",
    "rejected": "Rejeté"
  },
  "validation": {
    "required": "Ce champ est requis",
    "email": "Email invalide",
    "minLength": "Minimum {{count}} caractères",
    "maxLength": "Maximum {{count}} caractères",
    "numeric": "Doit être un nombre",
    "positive": "Doit être positif"
  },
  "messages": {
    "saveSuccess": "Enregistrement réussi",
    "deleteSuccess": "Suppression réussie",
    "error": "Une erreur s'est produite",
    "confirmDelete": "Confirmer la suppression"
  }
}
```

#### English (en/translation.json)

```json
{
  "common": {
    "appName": "MTEF - Medium-Term Expenditure Framework",
    "ministry": "Ministry of Economy and Finance",
    "country": "Republic of Djibouti",
    "welcome": "Welcome",
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import",
    "submit": "Submit",
    "validate": "Validate",
    "reject": "Reject"
  },
  "nav": {
    "dashboard": "Dashboard",
    "referentials": "Reference Data",
    "ministries": "Ministries",
    "programs": "Programs",
    "strategicAxes": "Strategic Priorities",
    "budget": "Budget",
    "cdmt": "MTEF",
    "reports": "Reports",
    "settings": "Settings",
    "logout": "Logout"
  },
  "auth": {
    "login": "Login",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?",
    "loginButton": "Sign in",
    "loginError": "Invalid email or password"
  },
  "ministries": {
    "title": "Ministry Management",
    "add": "Add Ministry",
    "code": "Code",
    "name": "Name",
    "acronym": "Acronym",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "actions": "Actions",
    "deleteConfirm": "Are you sure you want to delete this ministry?"
  },
  "documents": {
    "tofe": "Statement of Government Financial Operations",
    "cbmt": "Medium-Term Budget Framework",
    "cdmt": "Medium-Term Expenditure Framework",
    "generate": "Generate Document",
    "download": "Download",
    "year": "Fiscal Year",
    "status": "Status",
    "draft": "Draft",
    "submitted": "Submitted",
    "validated": "Validated",
    "rejected": "Rejected"
  },
  "validation": {
    "required": "This field is required",
    "email": "Invalid email",
    "minLength": "Minimum {{count}} characters",
    "maxLength": "Maximum {{count}} characters",
    "numeric": "Must be a number",
    "positive": "Must be positive"
  },
  "messages": {
    "saveSuccess": "Saved successfully",
    "deleteSuccess": "Deleted successfully",
    "error": "An error occurred",
    "confirmDelete": "Confirm deletion"
  }
}
```

#### Arabic (ar/translation.json) - RTL

```json
{
  "common": {
    "appName": "CDMT - إطار الإنفاق متوسط الأجل",
    "ministry": "وزارة الاقتصاد والمالية",
    "country": "جمهورية جيبوتي",
    "welcome": "مرحبا",
    "loading": "جاري التحميل...",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "create": "إنشاء",
    "search": "بحث",
    "filter": "تصفية",
    "export": "تصدير",
    "import": "استيراد",
    "submit": "إرسال",
    "validate": "التحقق",
    "reject": "رفض"
  },
  "nav": {
    "dashboard": "لوحة القيادة",
    "referentials": "البيانات المرجعية",
    "ministries": "الوزارات",
    "programs": "البرامج",
    "strategicAxes": "الأولويات الاستراتيجية",
    "budget": "الميزانية",
    "cdmt": "إطار الإنفاق",
    "reports": "التقارير",
    "settings": "الإعدادات",
    "logout": "تسجيل الخروج"
  },
  "auth": {
    "login": "تسجيل الدخول",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "forgotPassword": "هل نسيت كلمة المرور؟",
    "loginButton": "دخول",
    "loginError": "البريد الإلكتروني أو كلمة المرور غير صحيحة"
  },
  "ministries": {
    "title": "إدارة الوزارات",
    "add": "إضافة وزارة",
    "code": "الرمز",
    "name": "الاسم",
    "acronym": "الاختصار",
    "status": "الحالة",
    "active": "نشط",
    "inactive": "غير نشط",
    "actions": "الإجراءات",
    "deleteConfirm": "هل أنت متأكد من حذف هذه الوزارة؟"
  },
  "documents": {
    "tofe": "جدول العمليات المالية للدولة",
    "cbmt": "إطار الميزانية متوسط الأجل",
    "cdmt": "إطار الإنفاق متوسط الأجل",
    "generate": "إنشاء الوثيقة",
    "download": "تحميل",
    "year": "السنة المالية",
    "status": "الحالة",
    "draft": "مسودة",
    "submitted": "مقدم",
    "validated": "تم التحقق",
    "rejected": "مرفوض"
  },
  "validation": {
    "required": "هذا الحقل مطلوب",
    "email": "بريد إلكتروني غير صالح",
    "minLength": "الحد الأدنى {{count}} أحرف",
    "maxLength": "الحد الأقصى {{count}} أحرف",
    "numeric": "يجب أن يكون رقمًا",
    "positive": "يجب أن يكون موجبًا"
  },
  "messages": {
    "saveSuccess": "تم الحفظ بنجاح",
    "deleteSuccess": "تم الحذف بنجاح",
    "error": "حدث خطأ",
    "confirmDelete": "تأكيد الحذف"
  }
}
```

---

### 4. Language Selector Component

**File:** `frontend/src/components/LanguageSelector.tsx` (CREATE THIS)

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇩🇯' },
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
  };

  return (
    <FormControl sx={{ minWidth: 150, margin: 1 }}>
      <InputLabel id="language-select-label">
        <LanguageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Language
      </InputLabel>
      <Select
        labelId="language-select-label"
        value={i18n.language}
        onChange={handleChange}
        label="Language"
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            <span style={{ marginRight: 8 }}>{lang.flag}</span>
            {lang.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSelector;
```

---

### 5. Using Translations in Components

**Example: Update Login Component**

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <form>
        <input type="email" placeholder={t('auth.email')} />
        <input type="password" placeholder={t('auth.password')} />
        <button>{t('auth.loginButton')}</button>
        <a href="/forgot-password">{t('auth.forgotPassword')}</a>
      </form>
    </div>
  );
};
```

---

### 6. RTL Support for Arabic

**CSS for RTL:** `frontend/src/styles/rtl.css` (CREATE THIS)

```css
/* RTL Support for Arabic */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

/* Flip margins and paddings */
[dir="rtl"] .MuiDrawer-root {
  right: 0;
  left: auto;
}

[dir="rtl"] .MuiTableCell-root {
  text-align: right;
}

/* Flip icons */
[dir="rtl"] .MuiSvgIcon-root {
  transform: scaleX(-1);
}

/* Flip navigation arrows */
[dir="rtl"] .MuiChevronRight {
  transform: rotate(180deg);
}

/* Numbers should remain LTR even in RTL */
[dir="rtl"] .number,
[dir="rtl"] .amount,
[dir="rtl"] .year {
  direction: ltr;
  display: inline-block;
}
```

---

### 7. Backend Document Translation

**For Generated Documents (TOFE, CBMT, CDMT)**

Create language-specific templates:

```
backend/templates/
├── tofe/
│   ├── tofe_fr.html      # French template
│   ├── tofe_en.html      # English template
│   └── tofe_ar.html      # Arabic template (RTL)
├── cbmt/
│   ├── cbmt_fr.html
│   ├── cbmt_en.html
│   └── cbmt_ar.html
└── cdmt/
    ├── cdmt_fr.html
    ├── cdmt_en.html
    └── cdmt_ar.html
```

**Update PDF Generation Service:**

```typescript
// backend/src/services/pdf.service.ts
export class PDFService {
  static async generateTOFE(data: any, language: string = 'fr'): Promise<Buffer> {
    const templatePath = `templates/tofe/tofe_${language}.html`;
    // ... generate PDF with localized template
  }
}
```

---

## Sprint 8.4: Accessibility (WCAG 2.1 AA) - IMPLEMENTATION GUIDE

### Accessibility Audit Checklist

#### 1. Perceivable

✅ **Text Alternatives (1.1)**
- Add `alt` text to all images
- Provide text descriptions for icons
- Use `aria-label` for icon buttons

```tsx
// ❌ Before
<button><DeleteIcon /></button>

// ✅ After
<button aria-label={t('common.delete')}>
  <DeleteIcon aria-hidden="true" />
</button>
```

✅ **Color Contrast (1.4.3)**
- Minimum contrast ratio: 4.5:1 for normal text
- 3:1 for large text (18pt+ or 14pt+ bold)
- Use tools: https://webaim.org/resources/contrastchecker/

**Recommended CDMT Colors:**
```css
/* Primary - Government Blue */
--primary-color: #003DA5;        /* WCAG AA compliant on white */
--primary-dark: #002876;         /* Enhanced contrast */
--primary-light: #4A7BC8;

/* Secondary - Finance Green */
--secondary-color: #2E7D32;      /* WCAG AA compliant */

/* Text */
--text-primary: #212121;         /* 16.1:1 ratio */
--text-secondary: #757575;       /* 4.6:1 ratio - AA compliant */

/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-secondary: #F5F5F5;
```

✅ **Resize Text (1.4.4)**
- Use `rem` units instead of `px`
- Support 200% zoom without loss of functionality

```css
/* ❌ Avoid */
font-size: 14px;

/* ✅ Use */
font-size: 0.875rem; /* 14px base */
```

#### 2. Operable

✅ **Keyboard Accessible (2.1)**
- All functionality available via keyboard
- Visible focus indicators
- Logical tab order

```tsx
// Add keyboard handlers
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>
```

✅ **Focus Visible (2.4.7)**
```css
/* Enhanced focus indicators */
*:focus {
  outline: 3px solid #4A7BC8;
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #003DA5;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

✅ **Navigation (2.4)**
- Skip navigation link
- Breadcrumb navigation
- Clear page titles
- Descriptive headings

```tsx
// Skip to main content
<a href="#main-content" className="skip-link">
  {t('accessibility.skipToMain')}
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

#### 3. Understandable

✅ **Language (3.1)**
- Set language attribute
- Indicate language changes

```html
<!-- Already implemented via i18n -->
<html lang="fr" dir="ltr">
```

✅ **Input Assistance (3.3)**
- Clear labels for form inputs
- Error identification and suggestions
- Error prevention for critical actions

```tsx
// Form with accessibility
<FormControl error={!!errors.email}>
  <InputLabel id="email-label" required>
    {t('auth.email')}
  </InputLabel>
  <Input
    id="email"
    aria-labelledby="email-label"
    aria-describedby="email-error"
    aria-required="true"
    aria-invalid={!!errors.email}
  />
  {errors.email && (
    <FormHelperText id="email-error" role="alert">
      {errors.email.message}
    </FormHelperText>
  )}
</FormControl>
```

#### 4. Robust

✅ **Parsing (4.1)**
- Valid HTML
- Unique IDs
- Complete start and end tags

✅ **Name, Role, Value (4.1.2)**
- Use semantic HTML
- ARIA attributes for custom components

```tsx
// Data table with ARIA
<table role="table" aria-label={t('ministries.title')}>
  <thead>
    <tr role="row">
      <th role="columnheader" scope="col">{t('ministries.code')}</th>
      <th role="columnheader" scope="col">{t('ministries.name')}</th>
    </tr>
  </thead>
  <tbody>
    {ministries.map((ministry) => (
      <tr key={ministry.id} role="row">
        <td role="cell">{ministry.code}</td>
        <td role="cell">{ministry.name}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

### Essential ARIA Labels

**Add to translation files:**

```json
{
  "aria": {
    "skipToMain": "Skip to main content",
    "mainNavigation": "Main navigation",
    "userMenu": "User menu",
    "languageSelector": "Select language",
    "closeDialog": "Close dialog",
    "sortTable": "Sort table by {{column}}",
    "loading": "Loading, please wait",
    "searchResults": "{{count}} search results",
    "required": "Required field",
    "menuOpen": "Menu open",
    "menuClosed": "Menu closed"
  }
}
```

---

### Accessibility Testing Tools

1. **Browser Extensions:**
   - axe DevTools
   - WAVE Evaluation Tool
   - Lighthouse (Chrome DevTools)

2. **Screen Readers:**
   - NVDA (Windows - Free)
   - JAWS (Windows - Commercial)
   - VoiceOver (Mac - Built-in)

3. **Keyboard Testing:**
   - Tab through entire application
   - Test all interactions with keyboard only
   - Verify focus indicators are visible

4. **Automated Tests:**

```typescript
// Install @axe-core/react
import { useEffect } from 'react';

if (process.env.NODE_ENV !== 'production') {
  const axe = require('@axe-core/react');
  axe(React, ReactDOM, 1000);
}
```

---

## Implementation Checklist

### Sprint 8.3: Internationalization

- [x] Install i18next packages
- [x] Configure i18next with language detection
- [x] Create translation files (FR/EN/AR)
- [x] Implement language selector component
- [x] Add RTL support for Arabic
- [ ] Translate all UI components (use pattern above)
- [ ] Translate backend document templates
- [ ] Test language switching
- [ ] Test RTL layout
- [ ] Add language persistence

### Sprint 8.4: Accessibility

- [ ] Run accessibility audit (axe, WAVE, Lighthouse)
- [ ] Fix color contrast issues
- [ ] Add ARIA labels to all interactive elements
- [ ] Implement keyboard navigation
- [ ] Add skip navigation link
- [ ] Test with screen readers
- [ ] Add focus indicators
- [ ] Validate HTML
- [ ] Test at 200% zoom
- [ ] Document accessibility features

---

## Next Steps

1. **Create Translation Files:** Copy the JSON samples above to create the full translation files
2. **Update App.tsx:** Import i18n config at the top
3. **Add Language Selector:** Place in header/navbar
4. **Translate Components:** Use `useTranslation()` hook in all components
5. **Apply RTL CSS:** Import rtl.css in main App.tsx
6. **Test Accessibility:** Run audits and fix issues

---

**Document Version:** 1.0
**Last Updated:** 2026-01-04
**Status:** Framework Implemented - Expansion Required
