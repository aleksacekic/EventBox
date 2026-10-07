import React from 'react';

// Kraj liste koja se ucitava skrolom (vidi useBeskonacnaLista): neprimetan "cuvar" koji
// pokrece ucitavanje sledece strane, loader dok se ucitava i dugme za ponovni pokusaj
// ako zahtev ne uspe. gore=true: ista stvar na VRHU liste (cet, starije poruke) - loader
// tada lebdi i ne menja visinu liste, da skrol ne "skace" kad stigne nova strana.
function KrajListe({ lista, gore = false }) {
  return (
    <>
      <div ref={lista.cuvarRef} className={gore ? 'lista-cuvar-gore' : 'lista-cuvar'} aria-hidden="true" />
      {lista.ucitava && (
        <div className={gore ? 'lista-loader lista-loader-gore' : 'lista-loader'} role="status">
          <span className="lista-loader-sadrzaj">
            <span className="lista-loader-spinner" />
            Ucitavam...
          </span>
        </div>
      )}
      {lista.greska && (
        <div className="lista-greska">
          Ucitavanje nije uspelo.{' '}
          <button type="button" onClick={lista.ucitajJos}>Pokusaj ponovo</button>
        </div>
      )}
    </>
  );
}

export default KrajListe;
