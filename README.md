# school-cards

Système de cartes d'élèves — Excel + GitHub Pages + QR Code.
Site : https://rachidwahabi50-png.github.io/school-cards/

## Fichiers du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | Affiche la carte d'un élève (`?id=001`) |
| `print.html` | Grille d'impression, 8 cartes par page A4 (`?print=001,002,003` ou `?print=all`) |
| `style.css` | Mise en page et style de la carte |
| `script.js` | Lit `config.json` et `students.json` et construit la carte |
| `config.json` | Informations de l'école (nom, logo, année scolaire...) |
| `students.json` | Liste des élèves — **c'est le seul fichier à mettre à jour régulièrement** |
| `ELEVES_CARTES.xlsx` | Fichier Excel maître : vous le remplissez, il génère `students.json` |

## Mise à jour après modification dans Excel

1. Dans Excel, onglet **CONFIG** : informations de l'école. Onglet **ELEVES** : une ligne par élève.
2. Onglet **JSON_EXPORT**, cellule A8 : copiez tout le contenu.
3. Sur github.com, ouvrez ce dépôt → cliquez sur `students.json` → icône crayon (Edit) →
   sélectionnez tout, collez le nouveau contenu → **Commit changes**.
4. Si le nom de l'école, le logo, l'année scolaire ou la date d'expiration ont changé,
   faites la même chose avec `config.json` (les valeurs viennent de l'onglet CONFIG).
5. Le site se met à jour automatiquement en 1 à 2 minutes.

Aucune autre modification n'est nécessaire : les liens (`?id=001`) et les QR codes
restent valables tant que l'ID de l'élève ne change pas.

## Pourquoi le QR reste toujours valable

Le QR code n'encode que l'adresse de la page, par exemple :

```
https://rachidwahabi50-png.github.io/school-cards/?id=001
```

Il ne contient jamais le nom, la classe ou la photo directement. Ces informations sont
lues en direct dans `students.json` à chaque scan — donc si vous changez le nom ou la
classe d'un élève dans `students.json`, sa carte se met à jour sans avoir à réimprimer
son QR code.

## Automatisation future (optionnel)

Pour l'instant la mise à jour se fait manuellement (copier-coller sur GitHub), ce qui
reste simple et gratuit. Si vous voulez plus tard un bouton "publier" direct depuis
Excel, cela demande une petite GitHub Action + un jeton d'accès personnel — dites-le
et on pourra l'ajouter, mais ce n'est pas nécessaire pour que le système fonctionne.
