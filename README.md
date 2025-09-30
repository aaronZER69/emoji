
# 🎭 Emoji Code Humeur

## Public ciblé

Tout le monde.



👉 **[Voir l'application](https://aaronzer69.github.io/emoji/index.html)** | � **[Tableau de bord](https://aaronzer69.github.io/emoji/dashboard.html)** | 📚 **[Formation](docs/formation/)** | ⚙️ **[Installation](docs/setup/)** | 📖 **[Documentation](docs/)**

---

## ✨ Qu'est-ce que c'est ?

**Suivi de symptomes** transforme le traditionnel "transforme le traditionnel « Quels sont vos symptômes ? » en une activité interactive. Les patients ou participants décrivent leurs symptômes avec une ligne de code dans une interface simple et moderne.

### 🎯 **L'idée**

```python
# Au lieu de ça...
médecin: "Quels sont vos symptomes ?"
patient: "J'ai mal...." 😶

# Vous obtenez ça ! 
marie = {"mood": "🚀", "lang": "Python", "pref": "Gaming"}
jules = {"mood": "🤔", "lang": "Java", "pref": "Musique"} 
```

**Résultat :** Un patient plus détendu et des informations utiles pour adapter votre diagnostic.

---

## 🎥 Aperçu de l'Interface

### **Pour les patients :**
```
┌─────────────────────────────────────┐
│ 🎭  Suivi de symptomes              │
│ Exprime tes symptomes avec du code  │
├─────────────────────────────────────┤
│ 🅜 Marie 🐍 🎮          2min       │
│ 6 | Tete                            │  
│ humeur = "😷" // angine             │
├─────────────────────────────────────┤
│ 🅹 Jules ☕ 🎵          5min       │
│ 10 | Poitrine                      │
│ String mood = "🤧"; // rhume fort  │
└─────────────────────────────────────┘
```

### **Pour vous, médecin :**
- **Feed temps réel** style Instagram/Twitter
- **Panneau de contrôle** discret (triple-clic)
- **Export des données** CSV/JSON pour analyse
- **Interface responsive** mobile/tablette/desktop

---

## 🚀 Installation Simple

### **Option 1 : Version basique (2 minutes)**
1. Cliquez sur **Fork** 
2. **Settings** → **Pages** → **Source: GitHub Actions**
3. Votre version : `https://votre-nom.github.io/emoji-code-mood`

### **Option 2 : Version collaborative (15 minutes)**
Pour que tous vos étudiants voient les réponses en temps réel :

1. **Créez un compte** [Supabase](https://supabase.com) gratuit
2. **Nouveau projet** + copiez URL et clé API
3. **Dans GitHub :** Settings → Secrets → Ajoutez vos clés Supabase
4. **Push votre code** → Déploiement automatique

**📖 Guide pas à pas :** [Configuration complète](docs/setup/)

---

## 🎓 Formation Pratique (4 heures)

**Public :** Enseignants en programmation, formateurs

### **Programme :**
- **Prise en main** (45min) : Fork, configuration, premier déploiement
- **Interface** (60min) : HTML5, CSS moderne, design responsive  
- **JavaScript** (60min) : ES6+, événements, programmation asynchrone
- **Base de données** (60min) : Supabase, SQL, temps réel
- **Personnalisation** (45min) : Votre version unique

### **Ce que vous repartez avec :**
- Application web fonctionnelle en ligne
- Code source sur votre GitHub
- Compétences techniques modernes
- Outil prêt pour vos cours

**📊 Supports :** [Slides interactifs](https://ggaillard.github.io/emoji-code-mood/docs/formation/Slide-Presentation.html) | [Guides détaillés](docs/formation/)

---

## 💻 Technologies

- **Frontend :** HTML5, CSS3, JavaScript moderne
- **Backend :** Supabase (base de données PostgreSQL cloud)
- **Déploiement :** GitHub Actions + GitHub Pages
- **Temps réel :** WebSocket natif

---

## 🎯 Utilisation

### **Quand l'utiliser :**
- Première consultation (recueillir rapidement les ressentis)
- Début de journée (faire un point sur l’état général)
- Après un traitement ou un repos (suivi de l’évolution)
- Avant un rendez-vous important (évaluer le niveau de confort)

### **Ce que ça vous apporte :**
- Climat rassurant et ludique pour entamer l’échange
- Vue d’ensemble des symptômes en quelques secondes
- Introduction naturelle à l’outil numérique
- Données utiles pour adapter le suivi ou la prise en charge

---

## 🛠️ Fonctionnalités

### Pour vos patients :

- Interface simple et intuitive
- 70+ emojis de symptômes (fièvre, toux, maux de tête…)
12 langages de programmation amusants pour s’exprimer
32 catégories de contexte (sommeil, stress, activité physique…)
Génération automatique de code « symptôme »
Accessible sur mobile et ordinateur

### Pour vous :

- Vue en temps réel de tous les retours
- Tableau de bord discret (triple-clic)
- Export des données (CSV/JSON) pour le suivi
- Aucune installation requise
- Configuration rapide et facile
---

## 📁 Structure du Projet

```
emoji-code-mood/
├── index.html              # Tableau de bord (navigation)
├── index.html              # Application temps réel principale (point d'entrée)
├── app.html                # Copie conservée / version alternative (transition)
├── dashboard.html          # Ancien tableau de bord de navigation
├── main.js                 # Logique applicative  
├── styles.css              # Styles de l'application (feed, formulaires...)
├── css/
│   ├── common.css          # Variables, reset, utilitaires partagés
│   └── dashboard.css       # Styles spécifiques au tableau de bord
├── supabaseClient.js       # Client base de données
├── private-config.js       # Configuration (générée automatiquement)
│
├── docs/                   # Documentation
│   ├── setup/             # Guides d'installation
│   ├── formation/         # Formation complète
│   └── concepts/          # Documentation technique
│
├── .github/workflows/     # Automatisation GitHub
└── test.html              # Page de test
```

### 🧩 Organisation CSS
- `styles.css` : styles historiques de l'application principale (interface temps réel)
- `css/common.css` : variables, reset léger, helpers accessibilité & utilitaires
- `css/dashboard.css` : mise en page et composants du tableau de bord (cartes, grille, animations)

Objectif : séparation claire entre la logique visuelle de navigation (dashboard) et l'application interactive.

---

## 🎨 Personnalisation

Vous pouvez adapter l'outil à votre contexte :
- Couleurs aux couleurs de votre hoptial
- Différentes localisations proposées  
- Messages d'accueil personnalisés

```css
/* Exemple de personnalisation */
:root {
  --primary-color: #your-hospital-color;
  --secondary-color: #your-accent-color;
}
```

---

## 🤝 Contribution

Envie d'améliorer l'outil ? Vous êtes les bienvenus !

1. **Fork** le projet  
2. **Créez** votre branche (`git checkout -b ma-fonctionnalité`)
3. **Commitez** (`git commit -m 'Ajout: ma super fonctionnalité'`)
4. **Poussez** (`git push origin ma-fonctionnalité`)
5. **Ouvrez** une Pull Request

**Besoin d'aide ?** [Issues GitHub](issues) • [Discussions](discussions)

---


## 📄 Licence

Ce projet est sous licence GNU General Public License v3.0
- Utilisation libre pour l'éducation
- Modifications autorisées  
- Code source ouvert

**Créé par :** [aaron zerrouk](https://github.com/aaronZER69)  


---








