import React, { useState } from 'react'
import Footer from './Footer';
import HeaderAdmin from './HeaderAdmin';
import Pr_Dog from './PrijaviDogadjaj';
import BlokiraniKorisnici from './BlokiraniKorisnici';

function Administrator() {
  const [tab, setTab] = useState('prijave'); // 'prijave' | 'blokirani'

  return (
    <div>
        <HeaderAdmin />
        <div className="container admin-sadrzaj">
          <div className="profil-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'prijave'}
              className={`profil-tab ${tab === 'prijave' ? 'is-active' : ''}`}
              onClick={() => setTab('prijave')}
            >
              <i className="la la-flag" /> Prijavljeni dogadjaji
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'blokirani'}
              className={`profil-tab ${tab === 'blokirani' ? 'is-active' : ''}`}
              onClick={() => setTab('blokirani')}
            >
              <i className="la la-ban" /> Blokirani korisnici
            </button>
          </div>
        </div>
        {/* Lista se montira tek kad je tab otvoren - pa se posle (od)blokiranja ucita sveza */}
        {tab === 'prijave' ? <Pr_Dog /> : <div className="container"><BlokiraniKorisnici /></div>}
        <Footer />
    </div>
  )
}
export default Administrator;
