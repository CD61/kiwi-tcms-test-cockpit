# kiwi-tcms-test-cockpit
Extension pour navigateur (Chrome et Edge pour le moment) offrant une interface simplifiée pour l'exécution et le suivi de campagnes de tests.
Il est construit pour se brancher sur le logiciel libre [Kiwi TCMS](https://kiwitcms.org/) via son API.

## Contexte
Dans le cadre du fonctionnement du conseil départemental, la DSII mène des campagnes de recette lors de la livraison de produits.

Ces campagnes de tests ont pour objectif de vérifier que le produit livré répond bien aux prérequis formulés par le service qui l'utilisera.

Les tests sont en grande partie réalisés par les équipes métiers, qui ne sont pas toujours familiarisées avec l'informatique, et encore moins avec la conduite et la gestion de tests.

## Objectifs

L'extension a pour objectif de simplifier et de structurer l'utilisation de Kiwi TCMS pour les utilisateurs métier.

Elle vise notamment à :

- simplifier l'interface de Kiwi TCMS en limitant les options et les informations affichées au strict nécessaire ;

- standardiser et ordonner le parcours de test selon un flux de travail structuré : logiciel concerné → campagne → essai → cas de test → exécution ;

- éviter les allers-retours entre l'onglet ou la fenêtre du logiciel à tester et l'interface de Kiwi TCMS.

## Fonctionnement

  1. L'utilisateur ouvre l'extension en cliquant sur son icône. Un panneau latéral s'ouvre alors à droite de l'écran.
  2. Il indique le serveur Kiwi TCMS auquel il souhaite se connecter.
  3. Il renseigne ses identifiants pour se connecter à Kiwi TCMS.
  4. L'extension affiche la liste des logiciels testables par l'utilisateur. Celui-ci sélectionne le logiciel concerné.
  5. Il sélectionne une campagne de tests existante ou en crée une nouvelle.
  6. Il sélectionne un essai (exécution d'une campagne de tests) existant ou en crée un nouveau.
  7. Il sélectionne un cas de test existant ou en ajoute un nouveau.
  8. Il renseigne les informations relatives au cas de test ou à son exécution, puis passe au suivant.

## Utilisation
À compléter.


## Contexte du dépôt
Ce dépôt contient le code source d'un outil développé en interne pour les besoins de la collectivité territoriale de l'Orne.

Les sources sont partagées dans une démarche de mutualisation et de partage des développements réalisés en interne.

Ce dépôt peut notamment permettre :

- de consulter le fonctionnement de l'outil ;
- de comprendre les choix réalisés lors de son développement ;
- de réutiliser certains éléments du code ;
- de s'inspirer de la solution pour d'autres besoins.

## Maintenance et support
Ce projet est un développement interne et est partagé sans engagement de maintenance, de support ou de mise à jour.

La mise à disposition du code source ne constitue pas un engagement de compatibilité avec les futures versions des navigateurs, dépendances, bibliothèques ou environnements d'exécution.

Les éventuelles évolutions du projet dépendent des besoins internes de la collectivité et des ressources disponibles.

## Licence
Ce projet est distribué sous licence GNU General Public License v3.0 (GPL-3.0).

Voir le fichier LICENSE pour consulter le texte complet de la licence.

## Auteur
Ce projet a été développé en interne par Vincent Bourgmayer pour les besoins de la collectivité territoriale de l'Orne.

Profil GitHub : @vince-bourgmayer
