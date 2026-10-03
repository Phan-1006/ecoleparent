# ParentEcole Mobile - Code Flutter & Construction APK

Ce dossier contient l'implémentation mobile native Flutter officielle de **ParentEcole**.

## 📱 Fonctionnalités Mobiles Embarquées

1. **Responsive Mobile au Prime** :
   - Navigation ergonomique par `BottomNavigationBar` (Finances, Présences, Devoirs, Discipline).
   - Accès Parent direct sans mot de passe avec matricule unique de l'enfant.
   - Barre de recherche instantanée pour le **Caissier** avec sélection rapide parmi des centaines d'élèves.
   - Design Material 3 tactile optimisé pour tous les smartphones Android et tablettes.

## 🚀 Comment générer l'APK Android (Release APK)

### Prérequis
- Flutter SDK (v3.0.0+)
- Android Studio ou Android SDK command-line tools

### Étapes de Compilation

1. **Installer les dépendances** :
   ```bash
   cd flutter
   flutter pub get
   ```

2. **Tester sur émulateur ou téléphone connecté** :
   ```bash
   flutter run
   ```

3. **Générer le fichier APK final** :
   ```bash
   flutter build apk --release
   ```
   Le fichier APK généré se trouvera dans :
   `build/app/outputs/flutter-apk/app-release.apk`

4. **Installer directement sur votre téléphone Android** :
   Transférez `app-release.apk` sur votre téléphone ou exécutez :
   ```bash
   flutter install
   ```
