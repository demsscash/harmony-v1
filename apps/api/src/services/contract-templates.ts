// Contract templates based on Mauritanian labor law (Code du Travail)
// Reference: Loi n°2004-017 portant Code du Travail de la République Islamique de Mauritanie

interface ContractArticle {
    title: string;
    content: string;
}

interface ContractTemplate {
    title: string;
    preamble: string;
    articles: ContractArticle[];
    closing: string;
}

// Helper to build template with variable replacement
// Lines where the variable is empty are removed entirely
function replaceVars(text: string, vars: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(vars)) {
        if (value) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        } else {
            // Remove entire lines that only contain this empty variable
            result = result.replace(new RegExp(`^.*{{${key}}}.*$\\n?`, 'gm'), '');
        }
    }
    // Clean up multiple consecutive empty lines
    result = result.replace(/\n{3,}/g, '\n\n');
    return result;
}

export function getCDITemplate(vars: Record<string, string>): ContractTemplate {
    return {
        title: 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)',
        preamble: replaceVars(`Entre les soussignés :

{{COMPANY_NAME}}, ci-après dénommé « l'Employeur », représenté par la Direction Générale,

Et

{{GENDER_PREFIX}} {{EMPLOYEE_NAME}}, ci-après dénommé(e) « le Salarié »,
{{DOB_LINE}}
{{CIN_LINE}}
{{ADDRESS_LINE}}
{{PHONE_LINE}}
{{EMAIL_LINE}}

Il a été convenu et arrêté ce qui suit, conformément aux dispositions du Code du Travail mauritanien (Loi n°2004-017) :`, vars),

        articles: [
            {
                title: 'Article 1 — Engagement et Fonction',
                content: replaceVars(`L'Employeur engage le Salarié, matricule {{MATRICULE}}, en qualité de {{POSITION}}{{DEPARTMENT_LINE}}.
{{ORG_LEVEL_LINE}}
{{MANAGER_LINE}}
{{GRADE_LINE}}

Le Salarié exercera ses fonctions conformément aux instructions et directives de sa hiérarchie, dans le respect du règlement intérieur de l'entreprise. Il pourra être amené à effectuer toute tâche connexe relevant de sa qualification professionnelle.`, vars),
            },
            {
                title: 'Article 2 — Nature et Durée du Contrat',
                content: replaceVars(`Le présent contrat est conclu pour une durée indéterminée conformément aux articles 15 et suivants du Code du Travail mauritanien. Il prend effet à compter du {{START_DATE}}.`, vars),
            },
            {
                title: 'Article 3 — Période d\'Essai',
                content: replaceVars(`Le Salarié est soumis à une période d'essai de trois (3) mois, renouvelable une fois pour une durée égale, conformément à l'article 20 du Code du Travail. Durant cette période, chacune des parties pourra mettre fin au contrat sans préavis ni indemnité, par notification écrite.`, vars),
            },
            {
                title: 'Article 4 — Rémunération',
                content: replaceVars(`En contrepartie de ses services, le Salarié percevra une rémunération mensuelle brute de {{SALARY}} {{CURRENCY}}, payable à terme échu, au plus tard le cinq (5) du mois suivant.

Cette rémunération est soumise aux cotisations sociales (CNSS) et à l'Impôt sur les Traitements et Salaires (ITS) conformément à la législation en vigueur. Les avantages en nature et primes éventuels feront l'objet d'avenants distincts.`, vars),
            },
            {
                title: 'Article 5 — Durée et Horaires de Travail',
                content: replaceVars(`La durée hebdomadaire de travail est fixée à quarante (40) heures, conformément à l'article 49 du Code du Travail. Les horaires de travail sont ceux en vigueur dans l'entreprise. Les heures supplémentaires éventuelles seront rémunérées conformément à la réglementation applicable.`, vars),
            },
            {
                title: 'Article 6 — Congés Payés',
                content: replaceVars(`Le Salarié bénéficiera d'un congé annuel payé de vingt-quatre (24) jours ouvrables par an, conformément à l'article 68 du Code du Travail mauritanien. La date de départ en congé sera fixée d'un commun accord entre les parties, en tenant compte des nécessités du service.`, vars),
            },
            {
                title: 'Article 7 — Obligations du Salarié',
                content: replaceVars(`Le Salarié s'engage à :
— Exécuter son travail avec diligence et professionnalisme ;
— Respecter le règlement intérieur, les consignes de sécurité et les procédures de l'entreprise ;
— Observer une stricte discrétion professionnelle sur toutes les informations dont il aura connaissance dans l'exercice de ses fonctions ;
— Ne pas exercer d'activité concurrente, directement ou indirectement, pendant la durée du contrat.`, vars),
            },
            {
                title: 'Article 8 — Obligations de l\'Employeur',
                content: replaceVars(`L'Employeur s'engage à :
— Fournir au Salarié les moyens nécessaires à l'accomplissement de ses missions ;
— Verser la rémunération convenue aux échéances prévues ;
— Respecter les dispositions légales en matière d'hygiène, de sécurité et de conditions de travail ;
— Affilier le Salarié à la Caisse Nationale de Sécurité Sociale (CNSS).`, vars),
            },
            {
                title: 'Article 9 — Résiliation du Contrat',
                content: replaceVars(`Après la période d'essai, le contrat pourra être résilié par l'une ou l'autre des parties moyennant un préavis dont la durée est fixée conformément à l'article 38 du Code du Travail :
— Un (1) mois pour les employés et ouvriers ;
— Trois (3) mois pour les cadres et agents de maîtrise.

En cas de faute lourde dûment établie, le licenciement pourra intervenir sans préavis ni indemnité, conformément à l'article 36 du Code du Travail.`, vars),
            },
            {
                title: 'Article 10 — Clause de Confidentialité',
                content: replaceVars(`Le Salarié s'engage, tant pendant la durée du contrat qu'après sa cessation, à ne divulguer aucune information confidentielle relative aux activités, procédés, clientèle ou stratégie de l'Employeur. Toute violation de cette clause pourra donner lieu à des poursuites judiciaires et au versement de dommages-intérêts.`, vars),
            },
            {
                title: 'Article 11 — Dispositions Diverses',
                content: replaceVars(`Le présent contrat est régi par les lois et règlements de la République Islamique de Mauritanie. Tout litige relatif à son interprétation ou à son exécution sera soumis aux juridictions compétentes de Nouakchott, après tentative de conciliation.

Le Salarié déclare avoir pris connaissance du règlement intérieur de l'entreprise et s'engage à en respecter les dispositions.`, vars),
            },
        ],
        closing: replaceVars(`Fait en deux (2) exemplaires originaux, à {{CITY}}, le {{TODAY}}.

Chaque partie reconnaît avoir reçu un exemplaire du présent contrat.`, vars),
    };
}

export function getCDDTemplate(vars: Record<string, string>): ContractTemplate {
    return {
        title: 'CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)',
        preamble: replaceVars(`Entre les soussignés :

{{COMPANY_NAME}}, ci-après dénommé « l'Employeur », représenté par la Direction Générale,

Et

{{GENDER_PREFIX}} {{EMPLOYEE_NAME}}, ci-après dénommé(e) « le Salarié »,
{{DOB_LINE}}
{{CIN_LINE}}
{{ADDRESS_LINE}}
{{PHONE_LINE}}
{{EMAIL_LINE}}

Il a été convenu et arrêté ce qui suit, conformément aux dispositions du Code du Travail mauritanien (Loi n°2004-017) et notamment ses articles 16 à 19 relatifs aux contrats à durée déterminée :`, vars),

        articles: [
            {
                title: 'Article 1 — Objet et Motif du Contrat',
                content: replaceVars(`L'Employeur engage le Salarié, matricule {{MATRICULE}}, en qualité de {{POSITION}}{{DEPARTMENT_LINE}}.
{{ORG_LEVEL_LINE}}
{{MANAGER_LINE}}
{{GRADE_LINE}}

Le présent contrat à durée déterminée est conclu pour le motif suivant : {{CDD_REASON}}. Conformément à l'article 16 du Code du Travail, ce contrat est établi par écrit et précise son motif.`, vars),
            },
            {
                title: 'Article 2 — Durée du Contrat',
                content: replaceVars(`Le présent contrat prend effet le {{START_DATE}} et prendra fin le {{END_DATE}}, soit une durée de {{DURATION}}.

Conformément à l'article 17 du Code du Travail, le CDD ne pourra excéder deux (2) ans, renouvellements compris. Au-delà, il sera automatiquement requalifié en contrat à durée indéterminée.`, vars),
            },
            {
                title: 'Article 3 — Période d\'Essai',
                content: replaceVars(`Le Salarié est soumis à une période d'essai de un (1) mois. Durant cette période, chacune des parties pourra mettre fin au contrat sans préavis ni indemnité.`, vars),
            },
            {
                title: 'Article 4 — Rémunération',
                content: replaceVars(`Le Salarié percevra une rémunération mensuelle brute de {{SALARY}} {{CURRENCY}}, payable à terme échu. Cette rémunération est soumise aux cotisations sociales et fiscales en vigueur.

À l'expiration du contrat, le Salarié bénéficiera d'une indemnité de fin de contrat conformément à la législation applicable.`, vars),
            },
            {
                title: 'Article 5 — Durée et Horaires de Travail',
                content: replaceVars(`La durée hebdomadaire de travail est fixée à quarante (40) heures. Les horaires sont ceux en vigueur dans l'entreprise.`, vars),
            },
            {
                title: 'Article 6 — Congés',
                content: replaceVars(`Le Salarié acquiert des droits à congés payés à raison de deux (2) jours ouvrables par mois de travail effectif, conformément au Code du Travail.`, vars),
            },
            {
                title: 'Article 7 — Obligations Réciproques',
                content: replaceVars(`Le Salarié s'engage à exécuter son travail avec professionnalisme, à respecter le règlement intérieur et à observer la confidentialité sur les informations de l'entreprise.

L'Employeur s'engage à fournir les moyens nécessaires au travail et à respecter les dispositions légales en matière de sécurité et de conditions de travail.`, vars),
            },
            {
                title: 'Article 8 — Résiliation Anticipée',
                content: replaceVars(`Le CDD ne peut être résilié avant son terme que dans les cas suivants (article 18 du Code du Travail) :
— Accord des deux parties constaté par écrit ;
— Faute lourde de l'une des parties ;
— Force majeure.

Toute rupture abusive donnera lieu au versement de dommages-intérêts correspondant aux rémunérations dues jusqu'au terme du contrat.`, vars),
            },
            {
                title: 'Article 9 — Renouvellement',
                content: replaceVars(`Le présent contrat pourra être renouvelé une fois pour une durée équivalente, par avenant signé des deux parties avant son expiration. La durée totale, renouvellement compris, ne saurait excéder deux (2) ans.`, vars),
            },
            {
                title: 'Article 10 — Dispositions Finales',
                content: replaceVars(`Le présent contrat est régi par les lois de la République Islamique de Mauritanie. Tout litige sera soumis aux juridictions compétentes après tentative de conciliation.`, vars),
            },
        ],
        closing: replaceVars(`Fait en deux (2) exemplaires originaux, à {{CITY}}, le {{TODAY}}.

Chaque partie reconnaît avoir reçu un exemplaire du présent contrat.`, vars),
    };
}

export function getStageTemplate(vars: Record<string, string>): ContractTemplate {
    return {
        title: 'CONVENTION DE STAGE',
        preamble: replaceVars(`Entre les soussignés :

{{COMPANY_NAME}}, ci-après dénommé « l'Organisme d'Accueil », représenté par la Direction Générale,

Et

{{GENDER_PREFIX}} {{EMPLOYEE_NAME}}, ci-après dénommé(e) « le Stagiaire »,
{{DOB_LINE}}
{{CIN_LINE}}
{{ADDRESS_LINE}}
{{PHONE_LINE}}
{{EMAIL_LINE}}

Il a été convenu ce qui suit :`, vars),

        articles: [
            {
                title: 'Article 1 — Objet du Stage',
                content: replaceVars(`L'Organisme d'Accueil accueille le Stagiaire, matricule {{MATRICULE}}, pour un stage en qualité de {{POSITION}}{{DEPARTMENT_LINE}}.
{{ORG_LEVEL_LINE}}
{{MANAGER_LINE}}

Ce stage a pour objectif de permettre au Stagiaire d'acquérir une expérience pratique et de compléter sa formation théorique par une immersion professionnelle.`, vars),
            },
            {
                title: 'Article 2 — Durée du Stage',
                content: replaceVars(`Le stage débute le {{START_DATE}} et se termine le {{END_DATE}}, soit une durée de {{DURATION}}.

La durée du stage ne saurait excéder six (6) mois, sauf dérogation prévue par la réglementation en vigueur.`, vars),
            },
            {
                title: 'Article 3 — Gratification',
                content: replaceVars(`Le Stagiaire percevra une gratification mensuelle de {{SALARY}} {{CURRENCY}}. Cette gratification ne constitue pas un salaire au sens du Code du Travail et n'est pas soumise aux mêmes charges sociales.

L'Organisme d'Accueil prend en charge les frais de transport et de restauration liés au stage, selon les modalités en vigueur dans l'entreprise.`, vars),
            },
            {
                title: 'Article 4 — Horaires et Conditions de Travail',
                content: replaceVars(`Le Stagiaire se conformera aux horaires et au règlement intérieur de l'Organisme d'Accueil. La durée hebdomadaire ne pourra excéder la durée légale de travail.

Le Stagiaire bénéficiera des mêmes conditions de santé et sécurité que les salariés de l'entreprise.`, vars),
            },
            {
                title: 'Article 5 — Encadrement',
                content: replaceVars(`Le Stagiaire sera placé sous la responsabilité d'un tuteur de stage désigné par l'Organisme d'Accueil. Le tuteur veillera à l'intégration du Stagiaire et au bon déroulement de sa formation pratique.`, vars),
            },
            {
                title: 'Article 6 — Obligations du Stagiaire',
                content: replaceVars(`Le Stagiaire s'engage à :
— Respecter le règlement intérieur et les consignes de sécurité ;
— Faire preuve d'assiduité et de ponctualité ;
— Observer la confidentialité sur toutes les informations relatives à l'entreprise ;
— Rédiger un rapport de stage à l'issue de sa période de formation.`, vars),
            },
            {
                title: 'Article 7 — Propriété Intellectuelle',
                content: replaceVars(`Les travaux, créations et résultats obtenus par le Stagiaire dans le cadre de son stage restent la propriété exclusive de l'Organisme d'Accueil, sauf accord contraire écrit.`, vars),
            },
            {
                title: 'Article 8 — Résiliation',
                content: replaceVars(`La présente convention pourra être résiliée de manière anticipée par l'une ou l'autre des parties, moyennant un préavis de sept (7) jours ouvrables notifié par écrit.`, vars),
            },
            {
                title: 'Article 9 — Attestation de Stage',
                content: replaceVars(`À l'issue du stage, l'Organisme d'Accueil délivrera au Stagiaire une attestation de stage mentionnant la durée, le poste occupé et les missions accomplies.`, vars),
            },
        ],
        closing: replaceVars(`Fait en deux (2) exemplaires originaux, à {{CITY}}, le {{TODAY}}.

Chaque partie reconnaît avoir reçu un exemplaire de la présente convention.`, vars),
    };
}

export function getPrestationTemplate(vars: Record<string, string>): ContractTemplate {
    return {
        title: 'CONTRAT DE PRESTATION DE SERVICES',
        preamble: replaceVars(`Entre les soussignés :

{{COMPANY_NAME}}, ci-après dénommé « le Client », représenté par la Direction Générale,

Et

{{GENDER_PREFIX}} {{EMPLOYEE_NAME}}, ci-après dénommé(e) « le Prestataire »,
{{DOB_LINE}}
{{CIN_LINE}}
{{ADDRESS_LINE}}
{{PHONE_LINE}}
{{EMAIL_LINE}}

Il a été convenu ce qui suit :`, vars),

        articles: [
            {
                title: 'Article 1 — Objet de la Prestation',
                content: replaceVars(`Le Client confie au Prestataire, qui accepte, l'exécution de missions en qualité de {{POSITION}}{{DEPARTMENT_LINE}}.
{{ORG_LEVEL_LINE}}

Les missions détaillées, livrables attendus et indicateurs de performance seront précisés dans des ordres de mission annexés au présent contrat.`, vars),
            },
            {
                title: 'Article 2 — Durée de la Mission',
                content: replaceVars(`La prestation débute le {{START_DATE}} et se termine le {{END_DATE}}, soit une durée de {{DURATION}}.

Le contrat pourra être prolongé par avenant signé des deux parties avant son expiration.`, vars),
            },
            {
                title: 'Article 3 — Rémunération',
                content: replaceVars(`En contrepartie de ses services, le Prestataire percevra des honoraires mensuels de {{SALARY}} {{CURRENCY}}, payables sur présentation de facture et validation des livrables par le Client.

Le Prestataire est responsable de ses propres obligations fiscales et sociales. Il reconnaît ne pas être lié par un contrat de travail et ne bénéficie pas du statut de salarié.`, vars),
            },
            {
                title: 'Article 4 — Modalités d\'Exécution',
                content: replaceVars(`Le Prestataire exécute sa mission en toute indépendance, selon les méthodes et moyens qu'il juge appropriés, dans le respect des objectifs fixés par le Client.

Il pourra intervenir dans les locaux du Client ou à distance, selon les nécessités de la mission. Le Prestataire n'est pas soumis à un lien de subordination.`, vars),
            },
            {
                title: 'Article 5 — Obligations du Prestataire',
                content: replaceVars(`Le Prestataire s'engage à :
— Exécuter la mission avec diligence, compétence et professionnalisme ;
— Respecter les délais convenus pour la livraison des travaux ;
— Informer le Client de toute difficulté susceptible d'affecter l'exécution de la mission ;
— Assurer la confidentialité des informations portées à sa connaissance.`, vars),
            },
            {
                title: 'Article 6 — Obligations du Client',
                content: replaceVars(`Le Client s'engage à :
— Fournir au Prestataire toutes les informations et accès nécessaires à l'exécution de sa mission ;
— Procéder au paiement des honoraires dans les délais convenus ;
— Désigner un interlocuteur pour la coordination de la mission.`, vars),
            },
            {
                title: 'Article 7 — Confidentialité',
                content: replaceVars(`Le Prestataire s'engage à maintenir strictement confidentielle toute information relative au Client, à ses activités, sa clientèle, ses procédés techniques et commerciaux.

Cette obligation de confidentialité s'applique pendant toute la durée du contrat et pendant une période de deux (2) ans après son expiration.`, vars),
            },
            {
                title: 'Article 8 — Propriété Intellectuelle',
                content: replaceVars(`Les livrables, travaux, créations et résultats produits dans le cadre de cette prestation sont la propriété exclusive du Client dès leur réception et paiement complet. Le Prestataire cède au Client l'ensemble des droits de propriété intellectuelle y afférents.`, vars),
            },
            {
                title: 'Article 9 — Résiliation',
                content: replaceVars(`Le contrat pourra être résilié :
— D'un commun accord des parties, constaté par écrit ;
— Par l'une des parties en cas de manquement grave de l'autre, après mise en demeure restée infructueuse pendant quinze (15) jours ;
— Par l'une des parties moyennant un préavis de trente (30) jours notifié par écrit.`, vars),
            },
            {
                title: 'Article 10 — Responsabilité',
                content: replaceVars(`Le Prestataire est responsable des dommages causés au Client dans l'exécution de ses missions, dans la limite du montant total des honoraires perçus au titre du présent contrat.

Le Prestataire déclare être couvert par une assurance responsabilité civile professionnelle.`, vars),
            },
            {
                title: 'Article 11 — Dispositions Finales',
                content: replaceVars(`Le présent contrat est régi par les lois de la République Islamique de Mauritanie. Tout différend sera soumis à une tentative de résolution amiable. À défaut, les juridictions compétentes de Nouakchott seront saisies.

Le présent contrat constitue l'intégralité de l'accord entre les parties et remplace tout accord antérieur portant sur le même objet.`, vars),
            },
        ],
        closing: replaceVars(`Fait en deux (2) exemplaires originaux, à {{CITY}}, le {{TODAY}}.

Chaque partie reconnaît avoir reçu un exemplaire du présent contrat.`, vars),
    };
}

// Helper: get the right template based on contract type
export function getContractTemplate(contractType: string, vars: Record<string, string>): ContractTemplate {
    switch (contractType) {
        case 'CDI': return getCDITemplate(vars);
        case 'CDD': return getCDDTemplate(vars);
        case 'STAGE': return getStageTemplate(vars);
        case 'PRESTATION': return getPrestationTemplate(vars);
        default: return getCDITemplate(vars); // Default to CDI
    }
}
