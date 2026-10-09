"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api-client";

export interface FfPlayer {
  uid: string;
  pseudo: string;
  region: string | null;
  platform: string | null;
}

const UID_PATTERN = /^\d{3,20}$/;

/**
 * Interroge GET /ff-lookup/:uid (API externe Free Fire, via le backend) avec
 * un debounce de 500 ms. Purement indicatif : un échec ou un ID inconnu donne
 * `player: null`, jamais une erreur bloquante.
 */
export function useFfLookup(rawUid: string, onFound?: (player: FfPlayer) => void) {
  const uid = rawUid.trim();
  const valid = UID_PATTERN.test(uid);
  const [result, setResult] = useState<{ uid: string; player: FfPlayer | null } | null>(null);
  const onFoundRef = useRef(onFound);

  useEffect(() => {
    onFoundRef.current = onFound;
  });

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      apiRequest<{ player: FfPlayer | null }>(`/ff-lookup/${uid}`)
        .then((data) => {
          if (cancelled) return;
          const player = data?.player ?? null;
          setResult({ uid, player });
          if (player) onFoundRef.current?.(player);
        })
        .catch(() => {
          if (!cancelled) setResult({ uid, player: null });
        });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [uid, valid]);

  const settled = valid && result?.uid === uid;
  return {
    checking: valid && !settled,
    player: settled ? result!.player : null,
    notFound: settled && !result!.player,
  };
}
