import React from 'react';
import { useTranslation } from 'react-i18next';

// Kraj liste koja se ucitava skrolom (vidi useInfiniteList): neprimetan "cuvar" koji
// pokrece ucitavanje sledece strane, loader dok se ucitava i dugme za ponovni pokusaj
// ako zahtev ne uspe. gore=true: ista stvar na VRHU liste (cet, starije poruke) - loader
// tada lebdi i ne menja visinu liste, da skrol ne "skace" kad stigne nova strana.
function InfiniteScrollFooter({ lista, gore = false }) {
  const { t } = useTranslation();
  return (
    <>
      <div ref={lista.sentinelRef} className={gore ? 'lista-cuvar-gore' : 'lista-cuvar'} aria-hidden="true" />
      {lista.loading && (
        <div className={gore ? 'lista-loader lista-loader-gore' : 'lista-loader'} role="status">
          <span className="lista-loader-sadrzaj">
            <span className="lista-loader-spinner" />
            {t('common.loading')}
          </span>
        </div>
      )}
      {lista.error && (
        <div className="lista-greska">
          {t('common.loadFailed')}{' '}
          <button type="button" onClick={lista.loadMore}>{t('common.retry')}</button>
        </div>
      )}
    </>
  );
}

export default InfiniteScrollFooter;
