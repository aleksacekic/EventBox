import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

// Prebacivanje jezika sajta (EN | SR), u headeru i na strani za prijavu.
// Izbor se pamti u browseru (src/i18n/index.js).
function LanguageSwitcher({ className = '' }) {
  const { t, i18n } = useTranslation();

  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('language.label')}>
      {LANGUAGES.map((l) => {
        const aktivan = i18n.resolvedLanguage === l.code;
        return (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            title={l.name}
            aria-pressed={aktivan}
            className={aktivan ? 'is-active' : ''}
            onClick={() => i18n.changeLanguage(l.code)}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
