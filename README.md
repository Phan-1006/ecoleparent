# ParentEcole

Suivi scolaire entre l'école et les parents.

- **App Android des parents** (`apps/parent`) : présence du jour, frais et dates de renvoi, reçus, devoirs, conduite, communiqués, agenda.
- **Site web de l'école** (`apps/ecole`) : direction, surveillants, professeurs, caissiers, et super-administrateur de la plateforme.
- **Une seule base de données** (Firebase Firestore) : ce que l'école saisit apparaît aussitôt chez les parents, et l'app reste lisible sans réseau.

## Ce que fait chaque profil

| Profil | Où | Ce qu'il fait |
| --- | --- | --- |
| Parent | App Android | Lie ses enfants (code élève + son téléphone), suit présences, frais, devoirs, conduite ; justifie une absence ; marque un devoir « vu » ; partage un reçu |
| Direction | Site école | Classes, élèves (fiche d'accès avec QR code), personnel, grille des frais et tranches, communiqués, agenda, tableau de bord |
| Surveillant | Site école (aussi sur téléphone) | Appel express (on coche seulement les absents et retards), justifications, conduite |
| Professeur | Site école | Appel et devoirs de ses classes, conduite |
| Caissier | Site école | Encaissement avec reçu imprimable, historique, liste de recouvrement exportable |
| Super-administrateur | Site école | Crée les écoles et leur directeur, peut ouvrir n'importe quelle école |

## Organisation du code

```
packages/shared/   Types, logique des frais et des présences, accès Firestore, composants d'interface
apps/parent/       App des parents (React + Capacitor) ; android/ = projet Android
apps/ecole/        Site de l'école (React)
functions/         Notifications push (facultatif, plan Blaze)
firestore.rules    Règles de sécurité (qui peut lire et écrire quoi)
tests/             Tests des règles contre l'émulateur Firestore
```

## Mise en route

### 1. Créer le projet Firebase (gratuit)

1. Sur <https://console.firebase.google.com>, **Ajouter un projet** (par exemple `parentecole`). Google Analytics n'est pas nécessaire.
2. **Build › Firestore Database › Créer une base de données** : mode production, emplacement `europe-west1`.
3. **Build › Authentication › Commencer**, puis activez **Adresse e-mail/Mot de passe** et **Google**.
4. **Paramètres du projet › Vos applications › Web (`</>`)** : enregistrez une application. Copiez les valeurs de `firebaseConfig` dans un fichier `.env` à la racine (modèle : `.env.example`).
5. **Authentication › Paramètres › Domaines autorisés** : ajoutez le domaine du site de l'école une fois en ligne.
6. Publiez les règles et les index : copiez `firestore.rules` dans **Firestore › Règles**, ou utilisez le déploiement automatique (voir plus bas).
7. Créez le premier super-administrateur : **Firestore › Démarrer une collection** `superadmins`, avec comme ID de document votre e-mail en minuscules (aucun champ requis).

### 2. Lancer en local

```bash
npm install
npm run dev:ecole     # site école : http://localhost:5174
npm run dev:parent    # app parents dans le navigateur : http://localhost:5173
```

Premier parcours :

1. Connectez-vous au site école avec le compte super-administrateur.
2. Créez une école et son directeur.
3. Connectez-vous avec le compte du directeur, puis créez les classes, la grille des frais et les élèves.
4. Imprimez la fiche d'un élève et suivez-la dans l'app parents.

### 3. L'APK Android

L'APK est construit par GitHub Actions : rien à installer sur l'ordinateur.

1. Sur GitHub, ouvrez **Settings › Secrets and variables › Actions › Variables** et ajoutez `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, et facultativement `VITE_ECOLE_URL`.
2. Dans l'onglet **Actions**, lancez **APK Android (parents)** (bouton *Run workflow*). L'APK est téléchargeable dans les *Artifacts* du build.
3. Un tag `v1.0.0` poussé sur GitHub publie l'APK dans une *Release*, avec un lien public à envoyer aux parents.

Sans clé de signature, l'APK est signé en mode « debug ». Il s'installe sur les téléphones, mais pas sur le Play Store. Pour une version signée, ajoutez les secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` et `ANDROID_KEY_PASSWORD`.

Pour construire en local (Android Studio ou SDK installé) : `npm run android:sync`, puis ouvrez `apps/parent/android`.

### 4. Mettre le site de l'école en ligne

Le site est servi gratuitement par Firebase Hosting. Le workflow **Déploiement Firebase** publie le site, les règles et les index à chaque push sur `main`, une fois le secret `FIREBASE_SERVICE_ACCOUNT` ajouté. Pour obtenir ce secret : console Google Cloud › IAM › Comptes de service › clé JSON, avec le rôle *Firebase Admin*.

## Sécurité

- **Pas de mot de passe dans le code.** Les comptes sont gérés par Firebase Authentication. Les droits sont vérifiés par le serveur (`firestore.rules`), pas par le téléphone.
- **Personnel.** Une personne a des droits seulement si son e-mail (vérifié) figure dans `members/{email}` avec un rôle. Un professeur n'agit que sur ses classes.
- **Parents.** Pour lier un enfant, il faut son code élève **et** un numéro de téléphone enregistré par l'école pour cet élève. Les matricules ne peuvent pas être listés.
- **Contrôle.** `npm run test:rules` vérifie ces règles contre l'émulateur (Java requis). La CI le fait à chaque push.

## Notifications push (facultatif)

Elles exigent le **plan Blaze** de Firebase (paiement à l'usage, gratuit dans les limites habituelles d'une école).

1. Dans la console Firebase, ajoutez une application **Android** avec l'identifiant `cd.parentecole.app`, puis téléchargez `google-services.json`.
2. Ajoutez-le en secret GitHub `GOOGLE_SERVICES_JSON`, encodé en base64 (`base64 -w0 google-services.json`). L'APK active alors les notifications.
3. Déployez les fonctions : `npm --prefix functions install && npx firebase-tools deploy --only functions`.

Sont notifiés : absence ou retard, paiement reçu, note de conduite, nouveau devoir, nouveau communiqué.

Sans push, l'app affiche ces mêmes nouveautés sous la cloche de l'accueil.

## Commandes utiles

| Commande | Effet |
| --- | --- |
| `npm test` | Tests de la logique (frais, codes, appel) |
| `npm run test:rules` | Tests des règles de sécurité (émulateur Firestore) |
| `npm run typecheck` | Vérification des types |
| `npm run build` | Compilation des deux applications |
