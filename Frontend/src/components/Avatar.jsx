import React from "react";
import { API_BASE } from "../api";
import { useTranslation } from "react-i18next";

// Profilna slika korisnika, a bez nje krug sa pocetnim slovom imena (kao u cetu).
// className daje velicinu i oblik (isti kao za <img>), avatar-inicijal samo izgled slova.
function Avatar({ slika, ime, className = "", alt = "" }) {
  const { t } = useTranslation();
  if (slika) {
    return (
      <img
        className={className}
        src={`${API_BASE}/resources/${slika}`}
        alt={alt}
      />
    );
  }
  const slovo =
    (ime || "?").trim().replace(/^@/, "").charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`${className} avatar-inicijal`}
      role="img"
      aria-label={alt || ime || t('common.user')}
    >
      {slovo}
    </span>
  );
}

export default Avatar;
