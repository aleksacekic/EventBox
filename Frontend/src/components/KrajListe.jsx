import React from 'react';

// Dno liste koja se ucitava skrolom (vidi useBeskonacnaLista): neprimetan "cuvar" koji
// pokrece ucitavanje sledece strane, loader dok se ucitava i dugme za ponovni pokusaj
// ako zahtev ne uspe.
function KrajListe({ lista }) {
  return (
    <>
      <div ref={lista.cuvarRef} className="lista-cuvar" aria-hidden="true" />
      {lista.ucitava && (
        <div className="lista-loader" role="status">
          <span className="lista-loader-spinner" />
          Ucitavam...
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
