import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import Avatar from './Avatar';
import AdminSectionHeader from './AdminSectionHeader';

const PRAZNA_FORMA = { ime: '', prezime: '', emailAdresa: '', korisnickoIme: '', lozinka: '', lozinka2: '' };

// Admin: lista administratora, dodavanje novog i brisanje. Server ne dozvoljava brisanje
// sopstvenog naloga ni poslednjeg administratora (dugme se tada i ne nudi).
function AdminAccounts() {
  const { t } = useTranslation();
  const [admini, setAdmini] = useState(null);
  const [greska, setGreska] = useState(false);
  const [formaOtvorena, setFormaOtvorena] = useState(false);
  const [forma, setForma] = useState(PRAZNA_FORMA);
  const [greskaForme, setGreskaForme] = useState('');
  const [salje, setSalje] = useState(false);
  const [brise, setBrise] = useState(null);

  const loadAdmins = useCallback(async () => {
    try {
      setAdmini(await api.get('/api/admins'));
      setGreska(false);
    } catch (error) {
      console.error('Ucitavanje administratora nije uspelo:', error);
      setGreska(true);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const fieldProps = (ime) => ({
    name: ime,
    value: forma[ime],
    onChange: (e) => setForma((f) => ({ ...f, [ime]: e.target.value })),
  });

  const closeForm = () => {
    setFormaOtvorena(false);
    setForma(PRAZNA_FORMA);
    setGreskaForme('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setGreskaForme('');
    if (forma.lozinka.length < 8) {
      setGreskaForme(t('validation.passwordLength'));
      return;
    }
    if (forma.lozinka !== forma.lozinka2) {
      setGreskaForme(t('validation.passwordsMismatch'));
      return;
    }
    setSalje(true);
    try {
      const { ime, prezime, emailAdresa, korisnickoIme, lozinka } = forma; // bez ponovljene lozinke
      const novi = await api.post('/api/admins', { ime, prezime, emailAdresa, korisnickoIme, lozinka });
      setAdmini((prev) => [...(prev ?? []), novi]);
      closeForm();
      toast.success(t('admin.admins.added', { username: novi.korisnicko_ime }));
    } catch (error) {
      // Server vraca razlog (npr. zauzeto korisnicko ime, neispravan email)
      setGreskaForme(error.message || t('admin.admins.addFailed'));
    } finally {
      setSalje(false);
    }
  };

  const handleDelete = async (a) => {
    if (brise || !window.confirm(t('admin.admins.confirmDelete', { username: a.korisnicko_ime }))) return;
    setBrise(a.id);
    try {
      await api.del(`/api/admins/${a.id}`);
      setAdmini((prev) => prev.filter((x) => x.id !== a.id));
      toast.success(t('admin.admins.deleted', { username: a.korisnicko_ime }));
    } catch (error) {
      console.error('Brisanje administratora nije uspelo:', error);
      toast.error(error.message || t('admin.admins.deleteFailed'));
    } finally {
      setBrise(null);
    }
  };

  return (
    <section>
      <AdminSectionHeader
        ikona="la-user-secret"
        naslov={t('admin.admins.title')}
        opis={t('admin.admins.description')}
        broj={admini?.length}
      >
        {!formaOtvorena && (
          <button type="button" className="admin-dodaj" onClick={() => setFormaOtvorena(true)}>
            <i className="la la-user-plus" /> {t('admin.admins.add')}
          </button>
        )}
      </AdminSectionHeader>

      {formaOtvorena && (
        <form className="admin-forma" onSubmit={handleAdd} autoComplete="off">
          <h3>{t('admin.admins.newTitle')}</h3>
          <div className="admin-forma-polja">
            <label>{t('admin.admins.firstName')}<input {...fieldProps('ime')} required maxLength={50} autoFocus /></label>
            <label>{t('admin.admins.lastName')}<input {...fieldProps('prezime')} required maxLength={50} /></label>
            <label>{t('admin.admins.email')}<input type="email" {...fieldProps('emailAdresa')} required maxLength={254} /></label>
            <label>{t('admin.admins.username')}<input {...fieldProps('korisnickoIme')} required minLength={3} maxLength={30} autoComplete="off" /></label>
            <label>{t('admin.admins.password')}<input type="password" {...fieldProps('lozinka')} required minLength={8} autoComplete="new-password" /></label>
            <label>{t('admin.admins.repeatPassword')}<input type="password" {...fieldProps('lozinka2')} required minLength={8} autoComplete="new-password" /></label>
          </div>
          {greskaForme && <p className="admin-forma-greska" role="alert">{greskaForme}</p>}
          <div className="admin-forma-dugmad">
            <button type="button" className="admin-forma-otkazi" onClick={closeForm}>{t('common.cancel')}</button>
            <button type="submit" className="admin-dodaj" disabled={salje}>
              {salje ? t('admin.admins.adding') : t('admin.admins.submit')}
            </button>
          </div>
        </form>
      )}

      {greska && (
        <div className="lista-greska">
          {t('common.loadFailed')}{' '}
          <button type="button" onClick={loadAdmins}>{t('common.retry')}</button>
        </div>
      )}

      <div className="blokirani">
        {admini?.map((a) => (
          <div className="blokirani-red" key={a.id}>
            <Avatar className="blokirani-avatar" ime={a.ime} />
            <div className="blokirani-tekst">
              <strong>
                {a.ime} {a.prezime}
                {a.ja && <span className="admin-status is-aktivan admin-ja">{t('admin.admins.you')}</span>}
              </strong>
              <small>@{a.korisnicko_ime} · {a.email_adresa}</small>
            </div>
            {!a.ja && admini.length > 1 && (
              <button
                type="button"
                className="blokirani-dugme is-danger"
                onClick={() => handleDelete(a)}
                disabled={brise === a.id}
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default AdminAccounts;
