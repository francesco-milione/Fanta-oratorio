// Unisce le voci di bonus/malus che hanno stesso tipo, stessa descrizione e
// stesso punteggio in un'unica riga, tenendo un contatore delle occorrenze.
// Utile quando la stessa motivazione viene assegnata più volte alla stessa
// persona/squadra nello stesso giorno.
export function mergeBonusMalus(bmList) {
  const map = new Map();
  const order = [];

  (bmList || []).forEach((b) => {
    const key = `${b.tipo}|${b.descrizione}|${b.punti}`;
    if (map.has(key)) {
      map.get(key).count += 1;
    } else {
      const item = { ...b, count: 1 };
      map.set(key, item);
      order.push(key);
    }
  });

  return order.map((k) => map.get(k));
}

// Raggruppa le voci di bonus/malus di un evento (es. "Migliori/Peggiori del
// giorno") che hanno stesso tipo, stessa descrizione e stesso punteggio,
// anche se assegnate a persone diverse, in un'unica riga con l'elenco dei
// nomi coinvolti.
export function groupBonusMalusByEvento(bmList) {
  const map = new Map();
  const order = [];

  (bmList || []).forEach((b) => {
    const key = `${b.tipo}|${b.descrizione}|${b.punti}`;
    if (map.has(key)) {
      map.get(key).ids.push(b.id_personaggio);
    } else {
      const item = { tipo: b.tipo, descrizione: b.descrizione, punti: b.punti, ids: [b.id_personaggio] };
      map.set(key, item);
      order.push(key);
    }
  });

  return order.map((k) => map.get(k));
}
