# Estudi

Aplicació privada d'estudi amb tests. Funciona sense núvol: cada dispositiu guarda
les seves dades (IndexedDB) i els canvis es passen amb fitxers.

## Ordres

```powershell
npm install      # instal·la les dependències (només la primera vegada o si canvia package.json)
npm run dev      # servidor de desenvolupament a http://localhost:5173/
npm run build    # compila la versió final a la carpeta dist/
npm run lint     # revisa el codi
```

## Estructura

```
src/
  data/
    types.ts      Tipus de dades (curs, tema, subtema, pregunta, intent, test)
    db.ts         Base de dades local (Dexie sobre IndexedDB)
    hooks.ts      Lectura de dades que s'actualitza sola a la pantalla
    package.ts    Paquets: importar/exportar preguntes, progrés i còpies
    sessions.ts   Guardar un test acabat i els seus intents
    sample.ts     Curs de mostra
  logic/
    select.ts     Selecció de preguntes: Repàs diari, Repàs total, errors, tema
    testState.ts  Regles de navegació dins d'un test
  screens/        Pantalles (inici, tema, test, resultats, gestionar)
  components/     Peces reutilitzables (icones, modal, avisos)
  pwa.ts          Instal·lació i funcionament sense connexió
public/
  sw.js           Service worker (memòria cau per funcionar offline)
  manifest.webmanifest
.github/workflows/deploy.yml   Publicació automàtica a GitHub Pages
```

## Formats de fitxer

- **Paquet de contingut** (`format: "estudi-app/contingut"`): curs, temari opcional i
  preguntes. En importar-lo, substitueix les preguntes del curs dins d'una transacció:
  si el paquet no és vàlid, no es modifica res. L'historial i les corones es conserven.
- **Progrés** (`format: "estudi-app/progres"`): intents, tests i corones. Es fusiona
  amb el que ja hi ha (no es dupliquen intents).
- **Còpia de seguretat** (`format: "estudi-app/copia"`): totes les dades.
