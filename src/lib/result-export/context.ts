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

// Format portrait 1080×1350 : les renderers "une colonne" lisent ces valeurs
// pour fixer leur largeur et agrandir/réduire la hauteur des lignes (rowDelta)
// afin que l'image remplisse la hauteur cible.
export const PORTRAIT = {
  on: false,
  width: 1080,
  height: 1350,
  rowDelta: 0,
};

export const PHOTO: { img: CanvasImageSource | null } = { img: null };

// Bannière du thème "SGS Neon Sunset" — chargée à la demande par le moteur
// (jamais au chargement du module : ce fichier est aussi évalué côté serveur).
export const SGS_BANNER: { img: HTMLImageElement | null } = { img: null };

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
