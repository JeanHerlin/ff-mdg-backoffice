// Taille max d'une capture de résultat envoyée à l'OCR — doit rester alignée
// avec OCR_MAX_IMAGE_SIZE_KB côté backend (plan gratuit OCR.space : 1 Mo).
// Vérifiée dès la sélection du fichier pour ne jamais lancer d'envoi/analyse
// voué à l'échec.
export const OCR_MAX_IMAGE_SIZE_KB = 1024;
export const OCR_MAX_IMAGE_BYTES = OCR_MAX_IMAGE_SIZE_KB * 1024;

export function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`
    : `${Math.round(bytes / 1024)} Ko`;
}

export const OCR_MAX_IMAGE_LABEL = formatFileSize(OCR_MAX_IMAGE_BYTES);

/** Message affiché quand le serveur refuse une capture trop lourde. */
export const CAPTURE_TOO_LARGE_MESSAGE = `Capture trop lourde : ${OCR_MAX_IMAGE_LABEL} maximum par image pour l'analyse OCR. Compressez-la ou recadrez-la puis réessayez.`;
