// État partagé lu par les renderers canvas portés depuis le projet PHP
// (voir ./legacy). Là-bas tout passait par l'objet global `state.settings` ;
// ici le moteur (./index.ts) remplit ces objets juste avant chaque rendu,
// puis les remet à zéro — un seul export tourne à la fois.

export const EXPORT_TEXT = {
  title: "",
  subtitle: "",
  slogan: "",
  date: "",
  matchCount: 0,
};

// Format portrait — même principe que l'affiche "FF MDG Officiel" : largeur
// fixe (1000px), une seule colonne, hauteur qui grandit avec le nombre
// d'équipes (toutes sur une seule image). Lu par les renderers "une colonne".
export const PORTRAIT = {
  on: false,
  width: 1000,
};

export const PHOTO: { img: CanvasImageSource | null } = { img: null };

export const CHAMPION_RUSH = {
  on: false,
  threshold: 80,
  championIds: new Set<string>(),
};

export function champRushThreshold() {
  return CHAMPION_RUSH.threshold;
}

/** Équipe "en course" pour le Champion Rush (seuil atteint) — halo seulement. */
export function isChampionTeam(points: number) {
  return CHAMPION_RUSH.on && Number(points || 0) >= CHAMPION_RUSH.threshold;
}

/** Vraie championne (seuil franchi puis Booyah) — la seule avec couronne/trophée. */
export function isActualChampion(teamId: string) {
  return CHAMPION_RUSH.on && CHAMPION_RUSH.championIds.has(teamId);
}
