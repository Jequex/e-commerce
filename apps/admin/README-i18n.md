# Admin App Internationalization

## Overview

The admin app now supports internationalization (i18n) with three languages:
- English (en) - Default
- French (fr)  
- Spanish (es)

## Features

### ✅ Multi-language Support
- **English**: Default language
- **French**: Complete French translations
- **Spanish**: Complete Spanish translations

### ✅ Localized Routing
- `/en/*` - English routes
- `/fr/*` - French routes  
- `/es/*` - Spanish routes

### ✅ Translated Pages
- **Login Page**: Fully translated with proper form labels and placeholders
- **Dashboard**: All content including stats, service status, and quick actions
- **Navigation**: All menu items and labels

### ✅ Language Switcher
- Dropdown in the top navigation
- Preserves current page when switching languages
- Shows flag and language name

## Usage

### Accessing Different Languages
- Default: `http://localhost:3010` (redirects to `/en`)
- English: `http://localhost:3010/en`
- French: `http://localhost:3010/fr`
- Spanish: `http://localhost:3010/es`

### Adding New Translations

1. **Add new keys to translation files**:
   ```json
   // src/locales/en.json
   {
     "newSection": {
       "newKey": "New English text"
     }
   }
   ```

2. **Update all language files**:
   - `src/locales/en.json`
   - `src/locales/fr.json`
   - `src/locales/es.json`

3. **Use in components**:
   ```tsx
   import { useTranslations } from 'next-intl';
   
   function MyComponent() {
     const t = useTranslations('newSection');
     return <div>{t('newKey')}</div>;
   }
   ```

## File Structure

```
src/
├── i18n/
│   ├── navigation.ts    # Navigation utilities with locale support
│   ├── request.ts       # Request configuration for next-intl
│   └── routing.ts       # Supported locales configuration
├── locales/
│   ├── en.json         # English translations
│   ├── fr.json         # French translations
│   └── es.json         # Spanish translations
├── components/
│   └── LanguageSwitcher.tsx  # Language selection component
└── middleware.ts       # Handles locale routing
```

## Translation Keys

### Common
- `common.loading` - Loading states
- `common.error` - Error messages
- `common.success` - Success messages
- `common.save`, `common.cancel`, etc. - Action buttons

### Authentication
- `auth.login` - Login page title
- `auth.email`, `auth.password` - Form fields
- `auth.signIn` - Submit button

### Dashboard
- `dashboard.title` - Page title
- `dashboard.welcome` - Welcome message
- `dashboard.totalOrders` - Statistics labels
- `dashboard.serviceStatus` - Service status section
- `dashboard.quickActions` - Quick actions section

### Navigation
- `nav.dashboard` - Menu items
- `nav.products`, `nav.orders`, etc. - Navigation links

## Technical Implementation

- **Framework**: Next.js 14+ with App Router
- **Library**: next-intl for internationalization
- **Routing**: Locale-based routing with middleware
- **Components**: Translated using `useTranslations` hook
- **Build**: Supports static generation for all locales

## Development

To run the admin app with translations:

```bash
cd apps/admin
npm run dev -- -p 3010
```

The app will be available at:
- English: http://localhost:3010/en
- French: http://localhost:3010/fr  
- Spanish: http://localhost:3010/es