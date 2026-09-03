// Les formats du kit d'identité. Cette table fait autorité pour le build local
// (posts/build-kit.mjs) ET pour le gabarit du studio (service/templates.mjs) :
// une seule source, sinon les deux dérivent et le studio rend des tailles fausses.
//
// `width`/`height` = la page CSS ; `scale` = le facteur de rendu ; le produit des deux
// est ce que LinkedIn attend. La couverture de page est en 1050×175 rendu 4× parce que
// la cote 2026 (4200×700) et l'ancienne (1128×191) ont le MÊME ratio 6:1.
export const FORMATS = {
  post45: { width: 1200, height: 1500, scale: 2, cible: 'post portrait 4:5' },
  post11: { width: 1200, height: 1200, scale: 2, cible: 'post carré' },
  og:     { width: 1200, height: 627,  scale: 2, cible: 'aperçu de lien / Open Graph' },
  profil: { width: 1584, height: 396,  scale: 2, cible: 'couverture de profil' },
  page:   { width: 1050, height: 175,  scale: 4, cible: 'couverture de page entreprise' },
  avatar: { width: 400,  height: 400,  scale: 2, cible: 'avatar / logo, affiché en rond' },
};

export const CLES = Object.keys(FORMATS);

/** Ce que le format vaut en pixels livrés, pour l'afficher sans le recalculer partout. */
export const livre = f => `${FORMATS[f].width * FORMATS[f].scale}×${FORMATS[f].height * FORMATS[f].scale}`;
