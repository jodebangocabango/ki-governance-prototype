/**
 * G1: Practice examples per criterion at Level 2 and Level 3.
 * Gives concrete, realistic examples so users understand what each level looks like.
 */

export interface PracticeExample {
  level2: { de: string; en: string; fr: string }
  level3: { de: string; en: string; fr: string }
}

export const PRACTICE_EXAMPLES: Record<string, PracticeExample> = {
  // D1: Risikomanagement
  'D1.1': {
    level2: {
      de: 'Ein Finanzdienstleister führt eine informelle Liste bekannter KI-Risiken, die vom Projektleiter gepflegt wird. Risiken werden bei Bedarf besprochen, aber nicht systematisch erfasst.',
      en: 'A financial services firm maintains an informal list of known AI risks, managed by the project lead. Risks are discussed as needed but not systematically captured.',
      fr: 'Un prestataire financier maintient une liste informelle des risques IA connus, gérée par le chef de projet. Les risques sont discutés au besoin mais pas systématiquement capturés.',
    },
    level3: {
      de: 'Die Bank führt ein zentrales Risikoregister mit 30+ identifizierten KI-Risiken, kategorisiert nach Eintrittswahrscheinlichkeit und Schwere. Jedes Risiko hat einen zugewiesenen Risk Owner und wird quartalsweise reviewed.',
      en: 'The bank maintains a central risk register with 30+ identified AI risks, categorized by likelihood and severity. Each risk has an assigned risk owner and is reviewed quarterly.',
      fr: 'La banque maintient un registre central des risques avec 30+ risques IA identifiés, catégorisés par probabilité et sévérité. Chaque risque a un responsable et est revu trimestriellement.',
    },
  },
  'D1.2': {
    level2: {
      de: 'Die Risikobewertung erfolgt durch den Entwickler selbst, basierend auf Erfahrung. Es gibt keine formale Bewertungsmethodik oder standardisierte Kriterien.',
      en: 'Risk assessment is performed by the developer based on experience. There is no formal assessment methodology or standardized criteria.',
      fr: 'L\'évaluation des risques est effectuée par le développeur sur la base de son expérience. Il n\'existe pas de méthodologie formelle.',
    },
    level3: {
      de: 'Ein Versicherungsunternehmen nutzt eine dokumentierte Risikobewertungsmethodik (Wahrscheinlichkeit x Auswirkung) mit 5-Stufen-Skala. Die Methodik ist vom Vorstand freigegeben und wird konsistent angewendet.',
      en: 'An insurance company uses a documented risk assessment methodology (likelihood x impact) with a 5-level scale. The methodology is board-approved and consistently applied.',
      fr: 'Une compagnie d\'assurance utilise une méthodologie documentée (probabilité x impact) avec une échelle à 5 niveaux, approuvée par la direction.',
    },
  },
  'D1.3': {
    level2: {
      de: 'Risikomaßnahmen werden ad-hoc umgesetzt, wenn Probleme auftreten. Es gibt keine vordefinierte Strategie zur Risikominderung.',
      en: 'Risk mitigation measures are implemented ad-hoc when problems arise. There is no predefined risk mitigation strategy.',
      fr: 'Les mesures d\'atténuation sont mises en œuvre de manière ad-hoc lorsque des problèmes surviennent.',
    },
    level3: {
      de: 'Für jedes identifizierte Risiko existiert ein dokumentierter Maßnahmenplan mit Verantwortlichen, Zeitrahmen und Erfolgskriterien. Maßnahmen werden monatlich nachverfolgt.',
      en: 'For each identified risk, a documented action plan exists with responsible parties, timelines, and success criteria. Actions are tracked monthly.',
      fr: 'Pour chaque risque identifié, un plan d\'action documenté existe avec des responsables, des délais et des critères de succès.',
    },
  },
  'D1.4': {
    level2: {
      de: 'Risiken werden bei der Entwicklung betrachtet, aber nach dem Deployment nicht mehr systematisch überwacht.',
      en: 'Risks are considered during development but not systematically monitored after deployment.',
      fr: 'Les risques sont considérés pendant le développement mais pas surveillés après le déploiement.',
    },
    level3: {
      de: 'Ein Telekommunikationsunternehmen hat einen definierten Lebenszyklus-Risikoprozess: Identifikation (Design), Bewertung (Pre-Deploy), Monitoring (Produktion), Review (quartalsweise).',
      en: 'A telecom company has a defined lifecycle risk process: identification (design), assessment (pre-deploy), monitoring (production), review (quarterly).',
      fr: 'Une entreprise de télécom a un processus défini: identification (conception), évaluation (pré-déploiement), surveillance (production), revue (trimestrielle).',
    },
  },
  'D1.5': {
    level2: {
      de: 'Drittanbieter-KI-Komponenten werden genutzt, aber deren Risiken werden nicht separat bewertet oder überwacht.',
      en: 'Third-party AI components are used, but their risks are not separately assessed or monitored.',
      fr: 'Les composants IA tiers sont utilisés mais leurs risques ne sont pas évalués séparément.',
    },
    level3: {
      de: 'Ein E-Commerce-Unternehmen hat eine Third-Party-Risk-Policy: Jeder KI-Drittanbieter wird vor Integration bewertet, vertragliche SLAs definiert und jährlich auditiert.',
      en: 'An e-commerce company has a third-party risk policy: each AI vendor is assessed before integration, contractual SLAs defined, and audited annually.',
      fr: 'Une entreprise e-commerce a une politique de risque tiers: chaque fournisseur IA est évalué avant intégration avec des SLA contractuels.',
    },
  },
  'D1.6': {
    level2: {
      de: 'Risikoberichte werden sporadisch erstellt und per E-Mail an die Geschäftsführung gesendet. Kein standardisiertes Reporting-Format.',
      en: 'Risk reports are sporadically created and emailed to management. No standardized reporting format.',
      fr: 'Les rapports de risques sont créés sporadiquement et envoyés par e-mail. Pas de format standardisé.',
    },
    level3: {
      de: 'Monatlicher KI-Risikobericht an den Vorstand mit standardisiertem Dashboard: Top-10-Risiken, Trends, offene Maßnahmen, Eskalationen. Vorstandsfreigabe der Risikoappetit-Erklärung.',
      en: 'Monthly AI risk report to the board with standardized dashboard: top-10 risks, trends, open actions, escalations. Board-approved risk appetite statement.',
      fr: 'Rapport mensuel au conseil avec tableau de bord standardisé: top-10 risques, tendances, actions ouvertes, escalades.',
    },
  },

  // D2: Data Governance
  'D2.1': {
    level2: {
      de: 'Datenqualitätschecks erfolgen manuell vor dem Training. Keine automatisierten Pipelines oder dokumentierten Qualitätskriterien.',
      en: 'Data quality checks are performed manually before training. No automated pipelines or documented quality criteria.',
      fr: 'Les contrôles de qualité des données sont effectués manuellement. Pas de pipelines automatisées.',
    },
    level3: {
      de: 'Ein Gesundheitsunternehmen hat automatisierte Datenvalidierungspipelines mit definierten Qualitätsschwellen (Vollständigkeit >95%, Konsistenz >98%). Abweichungen lösen automatische Alerts aus.',
      en: 'A healthcare company has automated data validation pipelines with defined quality thresholds (completeness >95%, consistency >98%). Deviations trigger automatic alerts.',
      fr: 'Une entreprise de santé a des pipelines automatisées avec des seuils définis (complétude >95%, cohérence >98%).',
    },
  },
  'D2.2': {
    level2: {
      de: 'Bias wird informell beim Review der Modellergebnisse bemerkt, aber nicht systematisch getestet oder dokumentiert.',
      en: 'Bias is informally noticed when reviewing model results, but not systematically tested or documented.',
      fr: 'Les biais sont remarqués de manière informelle lors de la revue des résultats, pas testés systématiquement.',
    },
    level3: {
      de: 'Ein HR-Tech-Unternehmen testet systematisch auf demografische Fairness (Geschlecht, Alter, Herkunft) mit definierten Fairness-Metriken (Disparate Impact Ratio, Equal Opportunity).',
      en: 'An HR tech company systematically tests for demographic fairness (gender, age, origin) with defined fairness metrics (disparate impact ratio, equal opportunity).',
      fr: 'Une entreprise RH-tech teste systématiquement l\'équité démographique avec des métriques définies.',
    },
  },
  'D2.3': {
    level2: {
      de: 'Daten werden in lokalen Ordnern gespeichert. Es gibt eine grobe Vorstellung, woher die Daten stammen.',
      en: 'Data is stored in local folders. There is a rough idea of where the data comes from.',
      fr: 'Les données sont stockées localement. On a une idée approximative de leur provenance.',
    },
    level3: {
      de: 'Ein Automobilhersteller dokumentiert die vollständige Datenherkunft (Lineage) für alle Trainingsdaten: Quelle, Verarbeitungsschritte, Versionierung, Zugriffsrechte.',
      en: 'An automotive manufacturer documents complete data lineage for all training data: source, processing steps, versioning, access rights.',
      fr: 'Un constructeur automobile documente la lignée complète des données d\'entraînement.',
    },
  },
  'D2.4': {
    level2: {
      de: 'DSGVO-Anforderungen werden beachtet, aber die Verarbeitung personenbezogener Daten im KI-Kontext ist nicht separat geregelt.',
      en: 'GDPR requirements are observed, but processing of personal data in the AI context is not separately regulated.',
      fr: 'Les exigences RGPD sont respectées mais le traitement des données personnelles dans le contexte IA n\'est pas réglé séparément.',
    },
    level3: {
      de: 'Ein Finanzinstitut hat eine spezifische KI-Datenschutz-Policy: Datenanonymisierung, Zweckbindung, DSFA für alle KI-Systeme, automatisierte Löschroutinen.',
      en: 'A financial institution has a specific AI data protection policy: data anonymization, purpose limitation, DPIA for all AI systems, automated deletion routines.',
      fr: 'Un institut financier a une politique spécifique de protection des données IA avec anonymisation et AIPD pour tous les systèmes IA.',
    },
  },
  'D2.5': {
    level2: {
      de: 'Trainingsdaten werden in einem Shared Drive gespeichert. Keine Versionskontrolle oder reproduzierbare Datensätze.',
      en: 'Training data is stored on a shared drive. No version control or reproducible datasets.',
      fr: 'Les données d\'entraînement sont sur un lecteur partagé. Pas de contrôle de version.',
    },
    level3: {
      de: 'DVC (Data Version Control) wird für alle Trainingsdatensätze eingesetzt. Jedes Experiment ist mit exaktem Datensatz-Hash reproduzierbar.',
      en: 'DVC (Data Version Control) is used for all training datasets. Each experiment is reproducible with exact dataset hashes.',
      fr: 'DVC est utilisé pour tous les jeux de données. Chaque expérience est reproductible avec des hachages exacts.',
    },
  },

  // D3: Technische Dokumentation
  'D3.1': {
    level2: {
      de: 'Grundlegende README-Dateien existieren. Systemarchitektur ist im Kopf der Entwickler, aber nicht dokumentiert.',
      en: 'Basic README files exist. System architecture is in developers\' heads but not documented.',
      fr: 'Des fichiers README basiques existent. L\'architecture est dans la tête des développeurs.',
    },
    level3: {
      de: 'Vollständige technische Dokumentation im Wiki: Systemarchitektur, Datenflussdiagramme, API-Spezifikationen, Deployment-Guide. Wird bei jedem Release aktualisiert.',
      en: 'Complete technical documentation in wiki: system architecture, data flow diagrams, API specifications, deployment guide. Updated with each release.',
      fr: 'Documentation technique complète dans le wiki: architecture, diagrammes, spécifications API, guide de déploiement.',
    },
  },
  'D3.2': {
    level2: {
      de: 'Modellleistung wird in Notebooks dokumentiert. Keine standardisierte Berichterstattung oder Validierungsmetriken.',
      en: 'Model performance is documented in notebooks. No standardized reporting or validation metrics.',
      fr: 'La performance du modèle est documentée dans des notebooks. Pas de métriques standardisées.',
    },
    level3: {
      de: 'Für jedes Modell existiert eine Model Card: Zweck, Trainingsdaten, Leistungsmetriken (Accuracy, Precision, Recall, F1), bekannte Limitationen, Fairness-Metriken.',
      en: 'For each model, a Model Card exists: purpose, training data, performance metrics (accuracy, precision, recall, F1), known limitations, fairness metrics.',
      fr: 'Pour chaque modèle, une Model Card existe: objectif, données, métriques de performance, limitations connues.',
    },
  },
  'D3.3': {
    level2: {
      de: 'Änderungen werden in Git-Commits erfasst, aber ohne klare Konventionen oder Change-Log.',
      en: 'Changes are captured in git commits, but without clear conventions or changelog.',
      fr: 'Les changements sont capturés dans les commits git, mais sans conventions claires.',
    },
    level3: {
      de: 'Formalisiertes Change-Management: Jede Änderung hat einen Ticket-Bezug, Impact-Assessment, Genehmigung, und wird in einem auditierbaren Change-Log dokumentiert.',
      en: 'Formalized change management: each change has a ticket reference, impact assessment, approval, and is documented in an auditable changelog.',
      fr: 'Gestion formalisée des changements: chaque modification a une référence ticket, évaluation d\'impact et approbation.',
    },
  },
  'D3.4': {
    level2: {
      de: 'Es gibt eine Richtlinie zur Aufbewahrung, aber Logs und Aufzeichnungen werden nicht systematisch archiviert.',
      en: 'There is a retention policy, but logs and records are not systematically archived.',
      fr: 'Il existe une politique de conservation, mais les journaux ne sont pas systématiquement archivés.',
    },
    level3: {
      de: 'Alle KI-relevanten Aufzeichnungen (Trainingslogs, Entscheidungsprotokolle, Audit-Trails) werden mindestens 5 Jahre revisionssicher archiviert.',
      en: 'All AI-relevant records (training logs, decision protocols, audit trails) are archived in a tamper-proof manner for at least 5 years.',
      fr: 'Tous les enregistrements IA sont archivés de manière inviolable pendant au moins 5 ans.',
    },
  },
  'D3.5': {
    level2: {
      de: 'Konformitätsunterlagen werden bei Bedarf erstellt, aber es gibt kein zentrales Register oder standardisiertes Format.',
      en: 'Conformity documentation is created as needed, but there is no central register or standardized format.',
      fr: 'La documentation de conformité est créée au besoin, mais sans registre central ni format standardisé.',
    },
    level3: {
      de: 'Ein zentrales Konformitäts-Repository mit allen erforderlichen Nachweisen gem. EU AI Act Art. 11: technische Dokumentation, Risikobewertung, Testberichte, Konformitätserklärung.',
      en: 'A central conformity repository with all required evidence per EU AI Act Art. 11: technical documentation, risk assessment, test reports, declaration of conformity.',
      fr: 'Un référentiel central de conformité avec toutes les preuves requises selon l\'Art. 11.',
    },
  },

  // D4: Transparenz & Erklärbarkeit
  'D4.1': {
    level2: {
      de: 'Grundlegende Informationen sind verfügbar, aber Nutzer werden nicht aktiv über den KI-Einsatz informiert.',
      en: 'Basic information is available, but users are not actively informed about AI use.',
      fr: 'Des informations basiques sont disponibles, mais les utilisateurs ne sont pas informés activement.',
    },
    level3: {
      de: 'Klare Kennzeichnung: "Dieses Ergebnis wurde durch ein KI-System generiert." Nutzer erhalten verständliche Erklärungen zu Zweck, Funktionsweise und Grenzen des Systems.',
      en: 'Clear labeling: "This result was generated by an AI system." Users receive understandable explanations of purpose, functionality, and limitations.',
      fr: 'Étiquetage clair: "Ce résultat a été généré par un système IA." Les utilisateurs reçoivent des explications compréhensibles.',
    },
  },
  'D4.2': {
    level2: {
      de: 'Entwickler können bei Nachfrage erklären, warum das Modell eine Entscheidung getroffen hat. Keine standardisierten Erklärungsverfahren.',
      en: 'Developers can explain why the model made a decision when asked. No standardized explanation procedures.',
      fr: 'Les développeurs peuvent expliquer les décisions sur demande. Pas de procédures standardisées.',
    },
    level3: {
      de: 'SHAP-Values werden für jede Modellentscheidung berechnet. Nutzer sehen: "Die wichtigsten Einflussfaktoren waren: Einkommen (35%), Beschäftigungsdauer (25%), Kredithistorie (20%)."',
      en: 'SHAP values are calculated for each model decision. Users see: "The most important factors were: income (35%), employment duration (25%), credit history (20%)."',
      fr: 'Les valeurs SHAP sont calculées pour chaque décision. Les utilisateurs voient les facteurs les plus importants.',
    },
  },
  'D4.3': {
    level2: {
      de: 'Die Dokumentation ist technisch korrekt, aber nur für Entwickler verständlich. Keine nutzerzentrierte Kommunikation.',
      en: 'Documentation is technically correct but only understandable for developers. No user-centric communication.',
      fr: 'La documentation est correcte mais compréhensible uniquement pour les développeurs.',
    },
    level3: {
      de: 'Dreistufige Kommunikation: Technischer Bericht (für Auditoren), Management-Summary (für Vorstand), Nutzererklärung (für Betroffene). Alle in verständlicher Sprache.',
      en: 'Three-tier communication: technical report (for auditors), management summary (for board), user explanation (for affected persons). All in understandable language.',
      fr: 'Communication à trois niveaux: rapport technique, résumé pour la direction, explication utilisateur.',
    },
  },
  'D4.4': {
    level2: {
      de: 'KI-generierte Inhalte werden teilweise als solche gekennzeichnet, aber nicht konsequent.',
      en: 'AI-generated content is partially labeled as such, but not consistently.',
      fr: 'Le contenu généré par l\'IA est partiellement étiqueté, mais pas de manière cohérente.',
    },
    level3: {
      de: 'Alle KI-generierten Inhalte (Texte, Bilder, Entscheidungen) sind klar und maschinenlesbar gekennzeichnet. Wasserzeichen und Metadaten werden automatisch eingefügt.',
      en: 'All AI-generated content (text, images, decisions) is clearly and machine-readably labeled. Watermarks and metadata are automatically inserted.',
      fr: 'Tout le contenu généré par l\'IA est clairement étiqueté avec filigranes et métadonnées automatiques.',
    },
  },
  'D4.5': {
    level2: {
      de: 'Betroffene Personen können sich per E-Mail beschweren. Keine formale Beschwerdestruktur oder Rechtsmittelbelehrung.',
      en: 'Affected persons can complain via email. No formal complaint structure or legal remedy notice.',
      fr: 'Les personnes concernées peuvent se plaindre par e-mail. Pas de structure formelle.',
    },
    level3: {
      de: 'Formales Anfechtungsverfahren: Online-Formular, definierte Bearbeitungszeit (14 Tage), Eskalationspfad, menschliche Überprüfung jeder angefochtenen Entscheidung.',
      en: 'Formal appeal process: online form, defined processing time (14 days), escalation path, human review of every contested decision.',
      fr: 'Processus formel de contestation: formulaire en ligne, délai défini (14 jours), escalade, examen humain.',
    },
  },

  // D5: Menschliche Aufsicht
  'D5.1': {
    level2: {
      de: 'Es gibt einen Verantwortlichen, der das System betreut, aber keine klare Aufsichtsstruktur oder definierte Rollen.',
      en: 'There is a person responsible for the system, but no clear oversight structure or defined roles.',
      fr: 'Il y a un responsable du système, mais pas de structure de surveillance claire.',
    },
    level3: {
      de: 'Mehrstufige Aufsicht: Operatives Team (tägliches Monitoring), Governance Board (monatliche Reviews), Vorstand (quartalsweises Reporting). Klare RACI-Matrix.',
      en: 'Multi-level oversight: operations team (daily monitoring), governance board (monthly reviews), executive board (quarterly reporting). Clear RACI matrix.',
      fr: 'Surveillance à plusieurs niveaux: équipe opérationnelle, conseil de gouvernance, conseil d\'administration.',
    },
  },
  'D5.2': {
    level2: {
      de: 'Der Betreiber kann das System im Notfall herunterfahren. Kein definierter Prozess für reguläre Eingriffe.',
      en: 'The operator can shut down the system in an emergency. No defined process for regular interventions.',
      fr: 'L\'opérateur peut arrêter le système en urgence. Pas de processus défini pour les interventions régulières.',
    },
    level3: {
      de: 'Definierte Interventionsstufen: (1) Automatischer Alert bei Anomalie, (2) Human Review bei kritischen Entscheidungen, (3) Override-Möglichkeit in Echtzeit, (4) Notfall-Abschaltung mit dokumentiertem Prozess.',
      en: 'Defined intervention levels: (1) automatic alert on anomaly, (2) human review for critical decisions, (3) real-time override capability, (4) emergency shutdown with documented process.',
      fr: 'Niveaux d\'intervention définis: alerte automatique, revue humaine, capacité de contournement, arrêt d\'urgence.',
    },
  },
  'D5.3': {
    level2: {
      de: 'Mitarbeiter erhalten eine Einweisung beim Onboarding. Keine speziellen KI-Schulungen oder laufende Fortbildung.',
      en: 'Employees receive onboarding briefing. No special AI training or ongoing education.',
      fr: 'Les employés reçoivent un briefing d\'intégration. Pas de formation IA spécifique.',
    },
    level3: {
      de: 'Jährliches KI-Governance-Schulungsprogramm: Awareness (alle MA), Spezialisierung (Fachbereich), Zertifizierung (KI-Team). Schulung zu Automation Bias und kritischem Denken.',
      en: 'Annual AI governance training program: awareness (all employees), specialization (departments), certification (AI team). Training on automation bias and critical thinking.',
      fr: 'Programme annuel de formation à la gouvernance IA: sensibilisation, spécialisation, certification.',
    },
  },
  'D5.4': {
    level2: {
      de: 'Nutzer können in Ausnahmefällen die KI-Entscheidung übersteuern, aber der Prozess ist nicht dokumentiert.',
      en: 'Users can override AI decisions in exceptional cases, but the process is not documented.',
      fr: 'Les utilisateurs peuvent contourner les décisions IA dans des cas exceptionnels, mais le processus n\'est pas documenté.',
    },
    level3: {
      de: 'Definierter Override-Prozess: Jede Überstimmung wird dokumentiert (Grund, Entscheider, Zeitpunkt). Überstimmungs-Statistiken werden monatlich analysiert.',
      en: 'Defined override process: each override is documented (reason, decision-maker, timestamp). Override statistics are analyzed monthly.',
      fr: 'Processus de contournement défini: chaque décision est documentée et les statistiques sont analysées mensuellement.',
    },
  },
  'D5.5': {
    level2: {
      de: 'Maßnahmen gegen übertriebenes Vertrauen in die KI sind bekannt, aber nicht formalisiert.',
      en: 'Measures against over-reliance on AI are known but not formalized.',
      fr: 'Les mesures contre la sur-confiance en l\'IA sont connues mais pas formalisées.',
    },
    level3: {
      de: 'Anti-Automation-Bias-Programm: Regelmäßige "Challenge Sessions", bei denen Mitarbeiter KI-Entscheidungen hinterfragen müssen. Stichprobenartige manuelle Nachprüfung von 5% aller Entscheidungen.',
      en: 'Anti-automation bias program: regular "challenge sessions" where employees must question AI decisions. Random manual review of 5% of all decisions.',
      fr: 'Programme anti-biais d\'automatisation: sessions régulières de remise en question des décisions IA.',
    },
  },

  // D6: Technische Robustheit & Sicherheit
  'D6.1': {
    level2: {
      de: 'Unit-Tests für kritische Komponenten existieren. Kein systematisches KI-spezifisches Testing (Robustheit, Fairness).',
      en: 'Unit tests for critical components exist. No systematic AI-specific testing (robustness, fairness).',
      fr: 'Des tests unitaires existent pour les composants critiques. Pas de tests spécifiques IA.',
    },
    level3: {
      de: 'Mehrstufige Test-Suite: Unit-Tests, Integrationstests, Modell-Validierungstests (Robustheit, Fairness, Edge Cases), Penetrationstests, A/B-Tests vor jedem Deployment.',
      en: 'Multi-level test suite: unit tests, integration tests, model validation tests (robustness, fairness, edge cases), penetration tests, A/B tests before each deployment.',
      fr: 'Suite de tests à plusieurs niveaux: tests unitaires, d\'intégration, de validation du modèle, de pénétration et A/B.',
    },
  },
  'D6.2': {
    level2: {
      de: 'Grundlegende IT-Sicherheitsmaßnahmen (Firewall, Zugangskontrolle) sind implementiert. Keine KI-spezifischen Sicherheitsbedrohungen adressiert.',
      en: 'Basic IT security measures (firewall, access control) are implemented. No AI-specific security threats addressed.',
      fr: 'Les mesures de sécurité IT basiques sont en place. Pas de menaces spécifiques IA adressées.',
    },
    level3: {
      de: 'KI-spezifisches Security-Programm: Adversarial Robustness Tests, Model Extraction Prevention, Data Poisoning Detection, regelmäßige Red-Team-Übungen.',
      en: 'AI-specific security program: adversarial robustness tests, model extraction prevention, data poisoning detection, regular red team exercises.',
      fr: 'Programme de sécurité spécifique IA: tests de robustesse adversariale, prévention de l\'extraction de modèle.',
    },
  },
  'D6.3': {
    level2: {
      de: 'Daten werden verschlüsselt gespeichert. Zugriffsrechte sind definiert, aber nicht regelmäßig überprüft.',
      en: 'Data is stored encrypted. Access rights are defined but not regularly reviewed.',
      fr: 'Les données sont stockées chiffrées. Les droits d\'accès sont définis mais pas régulièrement révisés.',
    },
    level3: {
      de: 'Umfassendes Datensicherheitskonzept: End-to-End-Verschlüsselung, Role-Based Access Control, Privacy-Preserving ML (Differential Privacy, Federated Learning), regelmäßige Audits.',
      en: 'Comprehensive data security concept: end-to-end encryption, role-based access control, privacy-preserving ML (differential privacy, federated learning), regular audits.',
      fr: 'Concept complet de sécurité: chiffrement de bout en bout, contrôle d\'accès basé sur les rôles, ML préservant la vie privée.',
    },
  },
  'D6.4': {
    level2: {
      de: 'Modellleistung wird gelegentlich manuell überprüft. Keine automatisierten Monitoring-Systeme.',
      en: 'Model performance is occasionally reviewed manually. No automated monitoring systems.',
      fr: 'La performance du modèle est occasionnellement vérifiée manuellement. Pas de surveillance automatisée.',
    },
    level3: {
      de: 'Automatisiertes MLOps-Monitoring: Echtzeit-Dashboard mit Drift-Erkennung (Daten + Konzept), Performance-Alerts bei Schwellenwert-Verletzung, automatisches Retraining-Triggering.',
      en: 'Automated MLOps monitoring: real-time dashboard with drift detection (data + concept), performance alerts on threshold violations, automatic retraining triggering.',
      fr: 'Surveillance MLOps automatisée: tableau de bord en temps réel avec détection de dérive et alertes.',
    },
  },
  'D6.5': {
    level2: {
      de: 'Bei Systemausfall wird der Prozess manuell übernommen. Kein definierter Fallback-Plan.',
      en: 'On system failure, the process is taken over manually. No defined fallback plan.',
      fr: 'En cas de panne, le processus est repris manuellement. Pas de plan de repli défini.',
    },
    level3: {
      de: 'Dokumentierter Business Continuity Plan für KI-Systeme: Automatischer Fallback auf regelbasierte Systeme, definierte RTO/RPO, regelmäßige Failover-Tests, Kommunikationsplan.',
      en: 'Documented business continuity plan for AI systems: automatic fallback to rule-based systems, defined RTO/RPO, regular failover tests, communication plan.',
      fr: 'Plan de continuité documenté: repli automatique sur des systèmes à règles, RTO/RPO définis, tests réguliers.',
    },
  },
}
