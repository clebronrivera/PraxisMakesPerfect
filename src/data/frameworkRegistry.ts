/**
 * Framework Registry — laws, case law, regulations, and professional standards
 * that appear on the ETS Praxis 5403 School Psychology examination.
 *
 * PURPOSE: Descriptive lookup only. This file is NEVER imported by scoring,
 * mastery, selection, or diagnostic code. It is read by UI components (study
 * guide, module pages) that want to surface a plain-language summary of the
 * operative rule a test item turns on.
 *
 * SCHEMA: locked 2026-06-09 in docs/PHASE2_REVIEW_BACKLOG.md (Call 3).
 *
 * ADDING ENTRIES: Use a stable kebab-case id prefixed "FW-". Tag every entry
 * to the canonical progress-skill IDs it governs (skillIds) and to the ⊆
 * subset of ETS objective codes those skills own (etsTopicIds). Do not add
 * new skill IDs here — add them to skillIdMap.ts and re-run derivations first.
 *
 * Engineering note: a parity/validation test should be added to
 * tests/frameworkRegistry.test.ts to verify id uniqueness, that every
 * skillId is in the canonical 45, and that every etsTopicId exists in
 * skillObjectiveMap. TODO: add that test.
 */

export interface FrameworkEntry {
  id: string;
  name: string;
  citation: string;
  summary: string;
  keyHolding: string;
  applicability: string;
  guardedMisconception: string;
  skillIds: string[];
  etsTopicIds: string[];
}

export const frameworkRegistry: FrameworkEntry[] = [

  // ── Named priority seeds (SAF-03, ACA-09) ─────────────────────────────────

  {
    id: 'FW-tarasoff',
    name: 'Tarasoff v. Regents of the University of California',
    citation: 'Tarasoff v. Regents, 17 Cal. 3d 425 (Cal. 1976)',
    summary:
      'Mental health professionals have a duty to protect identifiable third parties from credible threats made by their clients. Confidentiality must yield when a client poses a serious and foreseeable danger to a known victim.',
    keyHolding:
      'The protective privilege ends where the public peril begins; a therapist who determines that a patient presents a serious danger to another person bears a duty to exercise reasonable care to protect the intended victim.',
    applicability:
      'Applies in school psychology when a student makes a credible, specific threat against an identifiable person. The school psychologist must take action (warn the target, notify law enforcement, consult administration) rather than remain silent behind confidentiality.',
    guardedMisconception:
      'Confidentiality is absolute and must be maintained even when a student threatens to harm a specific person.',
    skillIds: ['SAF-03', 'LEG-04'],
    etsTopicIds: ['III.B.1.c', 'IV.C.2.b'],
  },

  {
    id: 'FW-504-rehabilitation-act',
    name: 'Section 504 of the Rehabilitation Act of 1973',
    citation: 'Rehabilitation Act of 1973, § 504, 29 U.S.C. § 794',
    summary:
      'Prohibits discrimination against individuals with disabilities in programs receiving federal financial assistance. Schools must provide reasonable accommodations to any student whose disability substantially limits a major life activity, even if the student does not qualify for special education under IDEA.',
    keyHolding:
      'A student is eligible for a 504 plan when a physical or mental impairment substantially limits one or more major life activities (including learning). Eligibility is broader than IDEA and does not require specialized instruction.',
    applicability:
      'Applied when a student has a documented health condition (e.g., ADHD, Type 1 diabetes, anxiety) that limits learning or another major life activity but who does not need special education services. The school psychologist evaluates eligibility and recommends accommodations.',
    guardedMisconception:
      'A student must qualify for special education (IDEA) before receiving a 504 plan; 504 is a lesser version of an IEP.',
    skillIds: ['LEG-03', 'ACA-09', 'DIV-05', 'ACA-02'],
    etsTopicIds: ['IV.C.2.a', 'II.B.1.c', 'IV.A.1.e', 'II.A.1.b'],
  },

  // ── Case Law ───────────────────────────────────────────────────────────────

  {
    id: 'FW-rowley',
    name: 'Board of Education v. Rowley',
    citation: 'Board of Education v. Rowley, 458 U.S. 176 (1982)',
    summary:
      'The first Supreme Court case interpreting IDEA. Established that FAPE means an education reasonably calculated to confer educational benefit — not the best possible education or an education that maximizes potential.',
    keyHolding:
      'FAPE requires: (1) compliance with IDEA\'s procedural requirements, and (2) an IEP reasonably calculated to enable the child to receive educational benefits. Schools are not required to maximize achievement.',
    applicability:
      'Cited when families argue that a school\'s IEP is inadequate. Rowley establishes the floor, not the ceiling. School psychologists use this standard when designing IEP goals and justifying service intensity.',
    guardedMisconception:
      'IDEA requires schools to provide the best possible education that maximizes each student\'s potential.',
    skillIds: ['LEG-02', 'LEG-04'],
    etsTopicIds: ['IV.C.2.a', 'IV.C.2.b'],
  },

  {
    id: 'FW-endrew-f',
    name: 'Endrew F. v. Douglas County School District',
    citation: 'Endrew F. v. Douglas County School Dist. RE-1, 580 U.S. 386 (2017)',
    summary:
      'Clarified and raised the Rowley FAPE standard. Schools must offer an IEP reasonably calculated to enable a child to make progress appropriate in light of the child\'s circumstances — more than merely "more than de minimis."',
    keyHolding:
      'A child with more severe impairments may have different (but equally demanding) FAPE expectations. The IEP must be sufficiently ambitious; token progress does not satisfy FAPE.',
    applicability:
      'Used when evaluating whether an IEP offers sufficient challenge. School psychologists should set measurable, ambitious goals that reflect the student\'s capacity for growth.',
    guardedMisconception:
      'Any minimal measurable progress (even trivial) satisfies FAPE under IDEA.',
    skillIds: ['LEG-02', 'LEG-04'],
    etsTopicIds: ['IV.C.2.a', 'IV.C.2.b'],
  },

  {
    id: 'FW-larry-p',
    name: 'Larry P. v. Riles',
    citation: 'Larry P. v. Riles, 793 F.2d 969 (9th Cir. 1984)',
    summary:
      'Held that using standardized IQ tests to place Black students in Educable Mentally Retarded (EMR) classes in California violated Title VI and the Equal Protection Clause because tests were culturally biased and resulted in racially discriminatory placements.',
    keyHolding:
      'California schools are prohibited from using standardized intelligence tests on Black students for identification or placement in special education classes without court approval, because such tests have not been validated for that population.',
    applicability:
      'Informs CLD (culturally and linguistically diverse) assessment practice: school psychologists must use multiple measures, consider cultural factors, and avoid over-reliance on standardized IQ tests with populations for whom normative validity is in question.',
    guardedMisconception:
      'Standardized IQ tests are culturally neutral and can be used as the sole basis for special education placement with any student population.',
    skillIds: ['PSY-04', 'LEG-04', 'DIV-03'],
    etsTopicIds: ['I.A.4.b', 'IV.C.2.b', 'IV.A.1.c'],
  },

  {
    id: 'FW-diana',
    name: 'Diana v. State Board of Education',
    citation: 'Diana v. State Board of Education, C-70 37 RFP (N.D. Cal. 1970, consent decree)',
    summary:
      'Landmark consent decree requiring that Spanish-speaking and Chinese-speaking children in California be tested in their primary language before being placed in special education, and that IQ tests be normed on children of similar backgrounds.',
    keyHolding:
      'Placement of ELL students in special education based solely on English-language IQ tests is discriminatory. Assessments must be conducted in the student\'s dominant language and include non-verbal measures.',
    applicability:
      'Foundational authority for conducting bilingual and non-verbal assessments with ELL students. School psychologists must assess in the child\'s dominant language and supplement with non-verbal cognitive measures.',
    guardedMisconception:
      'ELL students can be accurately assessed and placed using only English-language standardized tests.',
    skillIds: ['PSY-04', 'LEG-04', 'DIV-03'],
    etsTopicIds: ['I.A.4.b', 'IV.C.2.b', 'IV.A.1.d'],
  },

  {
    id: 'FW-honig',
    name: 'Honig v. Doe',
    citation: 'Honig v. Doe, 484 U.S. 305 (1988)',
    summary:
      'Schools cannot unilaterally expel students with disabilities for behavior that is a manifestation of their disability. The IDEA "stay-put" provision requires keeping the student in their current educational placement during dispute proceedings.',
    keyHolding:
      'The stay-put provision is an absolute prohibition on unilateral exclusion of disabled students for disability-related misconduct. Schools must pursue dispute-resolution procedures rather than expulsion for such behavior.',
    applicability:
      'Governs manifestation determination reviews (MDRs). School psychologists participate in MDRs to determine whether behavior leading to discipline is a manifestation of the student\'s disability.',
    guardedMisconception:
      'Schools can suspend or expel a student with a disability for more than 10 days without a manifestation determination review.',
    skillIds: ['LEG-02', 'LEG-04', 'SAF-03'],
    etsTopicIds: ['IV.C.2.a', 'IV.C.2.b', 'III.B.1.c'],
  },

  {
    id: 'FW-parc',
    name: 'Pennsylvania Association for Retarded Children (PARC) v. Commonwealth of Pennsylvania',
    citation: 'PARC v. Pennsylvania, 334 F. Supp. 1257 (E.D. Pa. 1971)',
    summary:
      'Established that children with intellectual disabilities have a constitutional right to a free public education. Schools cannot exclude students with intellectual disabilities from public schooling.',
    keyHolding:
      'Equal protection and due process require that children with intellectual disabilities be provided access to a free public education appropriate to their learning capacities.',
    applicability:
      'Historical foundation for IDEA\'s zero-reject principle. All students, regardless of disability severity, are entitled to public education.',
    guardedMisconception:
      'Students with severe intellectual disabilities can be excluded from public schools because they are unable to benefit from education.',
    skillIds: ['LEG-02', 'LEG-04'],
    etsTopicIds: ['IV.C.2.a', 'IV.C.2.b'],
  },

  {
    id: 'FW-florence-county',
    name: 'Florence County School District v. Carter',
    citation: 'Florence County School Dist. Four v. Carter, 510 U.S. 7 (1993)',
    summary:
      'Parents who unilaterally place their child in a private school after a school district fails to provide FAPE may be reimbursed for the private school costs, even if the private school does not meet all IDEA requirements.',
    keyHolding:
      'Reimbursement is available when the district\'s IEP was inappropriate (denied FAPE) and the private placement was appropriate for the child, even if the private school was not state-approved.',
    applicability:
      'School psychologists play a role in documenting whether district services constitute FAPE. Inadequate IEPs may expose the district to private-school reimbursement liability.',
    guardedMisconception:
      'Parents can only receive reimbursement for private placements in state-approved private schools that meet all IDEA criteria.',
    skillIds: ['LEG-02', 'LEG-04'],
    etsTopicIds: ['IV.C.2.a', 'IV.C.2.b'],
  },

  // ── Statutes and Regulations ───────────────────────────────────────────────

  {
    id: 'FW-idea-fape',
    name: 'IDEA — Free Appropriate Public Education (FAPE)',
    citation: 'Individuals with Disabilities Education Act, 20 U.S.C. § 1401(9)',
    summary:
      'IDEA guarantees every eligible student with a disability a free appropriate public education — at no cost to the family — in conformity with an individualized education program (IEP).',
    keyHolding:
      'FAPE includes special education and related services that meet the child\'s unique needs and are provided at public expense, under public supervision, and in conformity with an IEP.',
    applicability:
      'Central to every eligibility determination and IEP the school psychologist participates in. The IEP must be reasonably calculated to provide FAPE (see Rowley, Endrew F.).',
    guardedMisconception:
      'Families must pay for any additional services their child receives under an IEP.',
    skillIds: ['LEG-02', 'DIV-05'],
    etsTopicIds: ['IV.C.2.a', 'IV.A.1.e'],
  },

  {
    id: 'FW-idea-lre',
    name: 'IDEA — Least Restrictive Environment (LRE)',
    citation: 'Individuals with Disabilities Education Act, 20 U.S.C. § 1412(a)(5)',
    summary:
      'Students with disabilities must be educated with non-disabled peers to the maximum extent appropriate. Removal to special classes or settings occurs only when the nature or severity of the disability prevents satisfactory education in general education with supplementary aids and services.',
    keyHolding:
      'Schools must provide a continuum of alternative placements and presume general education as the starting point. Restrictive placements require documented justification.',
    applicability:
      'School psychologists consider LRE when recommending placement. A more restrictive setting requires evidence that general education with supports is insufficient.',
    guardedMisconception:
      'The general education classroom is always the LRE for every student with a disability regardless of need.',
    skillIds: ['LEG-02', 'DIV-05'],
    etsTopicIds: ['IV.C.2.a', 'IV.A.1.e'],
  },

  {
    id: 'FW-idea-iep',
    name: 'IDEA — IEP Required Components',
    citation: 'Individuals with Disabilities Education Act, 20 U.S.C. § 1414(d)',
    summary:
      'IDEA specifies the required components of every Individualized Education Program: present levels of academic and functional performance, measurable annual goals, special education and related services, accommodations, participation in general education, transition services (age 16+), and progress reporting.',
    keyHolding:
      'An IEP that omits a required component or contains unmeasurable goals may constitute a denial of FAPE. The IEP team — including the school psychologist — is responsible for all components.',
    applicability:
      'School psychologists contribute assessment data to "present levels," help draft measurable goals, and document the basis for service recommendations.',
    guardedMisconception:
      'Transition planning is only required in the final year of high school.',
    skillIds: ['LEG-02'],
    etsTopicIds: ['IV.C.2.a'],
  },

  {
    id: 'FW-idea-evaluation',
    name: 'IDEA — Evaluation and Re-evaluation Standards',
    citation: 'Individuals with Disabilities Education Act, 20 U.S.C. § 1414(a)–(c)',
    summary:
      'IDEA requires initial evaluations to be comprehensive, non-discriminatory, and conducted by a multidisciplinary team using a variety of assessment tools. Re-evaluations are required at least every 3 years (triennial) or sooner if needed.',
    keyHolding:
      'No single measure may be used as the sole criterion for eligibility. Evaluations must assess all areas of suspected disability and use technically sound instruments.',
    applicability:
      'Governs how school psychologists design and conduct evaluations. Using only one test or test in only one language violates IDEA evaluation standards.',
    guardedMisconception:
      'A single IQ test is sufficient to determine special education eligibility under IDEA.',
    skillIds: ['LEG-02', 'PSY-04', 'DBD-03'],
    etsTopicIds: ['IV.C.2.a', 'I.A.4.b', 'I.A.2.a'],
  },

  {
    id: 'FW-ferpa',
    name: 'Family Educational Rights and Privacy Act (FERPA)',
    citation: 'Family Educational Rights and Privacy Act of 1974, 20 U.S.C. § 1232g; 34 C.F.R. Part 99',
    summary:
      'Federal law protecting the privacy of student education records. Parents of students under 18 (and eligible students 18 and older) have the right to inspect, review, and request amendments to education records. Schools may not disclose records without consent except in specified circumstances.',
    keyHolding:
      'Schools must obtain written consent before disclosing personally identifiable information from education records. Exceptions include school officials with legitimate educational interest, health and safety emergencies, and judicial orders.',
    applicability:
      'School psychologists must comply with FERPA when sharing psychological reports, test protocols, or case notes. FERPA records are distinct from HIPAA-governed medical records.',
    guardedMisconception:
      'A school can share a student\'s psychological evaluation report with any outside agency or healthcare provider without written parent consent.',
    skillIds: ['LEG-01', 'FAM-03', 'ETH-02', 'DBD-10'],
    etsTopicIds: ['IV.C.2.c', 'III.C.1.c', 'IV.C.2.d', 'I.A.1.b'],
  },

  {
    id: 'FW-hipaa-ferpa',
    name: 'HIPAA vs. FERPA — Information Sharing Boundary',
    citation:
      'HIPAA: Health Insurance Portability and Accountability Act, 45 C.F.R. Parts 160 & 164; FERPA: 20 U.S.C. § 1232g',
    summary:
      'FERPA governs education records held by schools; HIPAA governs protected health information held by covered healthcare entities. A school\'s psychological evaluation report is a FERPA record; a hospital discharge summary is a HIPAA record. Sharing between the two systems requires specific releases.',
    keyHolding:
      'Schools are generally not HIPAA covered entities for their education records. Sharing a student\'s school records with a healthcare provider — and receiving medical records from that provider — requires separate FERPA and HIPAA-compliant releases.',
    applicability:
      'Relevant when coordinating with community mental health, pediatricians, or hospitals. School psychologists need a FERPA release to share school records and should ensure the provider has HIPAA authorization to share medical records back.',
    guardedMisconception:
      'Schools and healthcare providers are covered by the same privacy law and can freely share student records once one consent is obtained.',
    skillIds: ['FAM-03', 'LEG-01'],
    etsTopicIds: ['III.C.1.c', 'IV.C.2.c'],
  },

  {
    id: 'FW-ada-title-ii',
    name: 'Americans with Disabilities Act (ADA) — Title II',
    citation: 'Americans with Disabilities Act of 1990, Title II, 42 U.S.C. § 12132',
    summary:
      'Prohibits public entities (including public schools) from discriminating against individuals with disabilities in services, programs, and activities. Works alongside Section 504; ADA\'s definition of disability was broadened by the ADA Amendments Act of 2008.',
    keyHolding:
      'Public schools must provide equal access and reasonable modifications so that students with disabilities can participate in and benefit from all school programs and activities. The 2008 ADAAA substantially broadened the definition of "disability."',
    applicability:
      'Relevant alongside 504 for students whose condition does not qualify them for IDEA but who need modifications (e.g., physical accessibility, program participation). The 2008 Amendments lowered the eligibility bar for both 504 and ADA.',
    guardedMisconception:
      'ADA Amendments Act 2008 (ADAAA) narrowed the definition of disability, making fewer students eligible for 504 plans.',
    skillIds: ['LEG-03', 'ACA-09'],
    etsTopicIds: ['IV.C.2.a', 'II.B.1.c'],
  },

  {
    id: 'FW-mckinney-vento',
    name: 'McKinney-Vento Homeless Assistance Act',
    citation:
      'McKinney-Vento Homeless Assistance Act, 42 U.S.C. §§ 11431–11435 (Education for Homeless Children and Youth provisions, reauthorized under ESSA 2015)',
    summary:
      'Ensures that children and youth experiencing homelessness have equal access to the same free, appropriate public education as other children. Schools must immediately enroll homeless students even without records and must resolve disputes in the student\'s favor.',
    keyHolding:
      'Homeless students have the right to immediate enrollment, transportation to their school of origin, and access to the same programs available to housed students. A district liaison must assist families in navigating these rights.',
    applicability:
      'School psychologists may identify students experiencing homelessness during assessment. IDEA evaluations for homeless students may have expedited timelines, and records unavailability cannot delay enrollment or services.',
    guardedMisconception:
      'A homeless student can be denied enrollment until complete academic and immunization records are obtained.',
    skillIds: ['FAM-02', 'FAM-03'],
    etsTopicIds: ['III.C.1.b', 'III.C.1.c'],
  },

  {
    id: 'FW-essa',
    name: 'Every Student Succeeds Act (ESSA)',
    citation: 'Every Student Succeeds Act, Pub. L. 114-95 (2015), amending ESEA, 20 U.S.C. § 6301 et seq.',
    summary:
      'Replaced No Child Left Behind. Gives states more authority over accountability systems, teacher evaluations, and intervention strategies. Emphasizes evidence-based interventions and requires states to identify and support low-performing schools.',
    keyHolding:
      'States must adopt challenging academic standards, measure student achievement through annual assessments, identify lowest-performing schools, and implement evidence-based improvement strategies. Evidence tiers (I–IV) determine what interventions qualify.',
    applicability:
      'School psychologists contribute to systems-level services and evidence-based practice (EBP) implementation. ESSA\'s evidence tiers directly inform which interventions can be adopted for school-wide improvement.',
    guardedMisconception:
      'ESSA uses a single federal accountability formula that all states must follow identically.',
    skillIds: ['SWP-02', 'SWP-03', 'RES-02'],
    etsTopicIds: ['III.A.1.b', 'III.A.1.c', 'IV.B.1.b'],
  },

  // ── Professional Ethics Standards ─────────────────────────────────────────

  {
    id: 'FW-nasp-ethics-confidentiality',
    name: 'NASP Ethics — Confidentiality and Its Limits',
    citation:
      'NASP Principles for Professional Ethics (2020), Standard II.3 (Responsibility to Clients); Standard IV.3.4 (Reporting)',
    summary:
      'School psychologists maintain confidentiality of student information but must break confidentiality when there is a clear and immediate danger to the client or others, or when required by law (e.g., mandated reporting).',
    keyHolding:
      'Confidentiality protects clients; it does not override legal mandates or imminent-danger obligations. School psychologists must inform students at the outset about the limits of confidentiality.',
    applicability:
      'Applied when a student discloses suicidal ideation, abuse, or a threat to harm others. The psychologist must act to prevent harm, which may include notifying parents, administrators, or law enforcement.',
    guardedMisconception:
      'Once a student is told their sessions are confidential, the school psychologist can never disclose anything the student says.',
    skillIds: ['ETH-01', 'SAF-03', 'ETH-02'],
    etsTopicIds: ['IV.C.1.a', 'III.B.1.c', 'IV.C.2.d'],
  },

  {
    id: 'FW-nasp-ethics-informed-consent',
    name: 'NASP Ethics — Informed Consent and Assent',
    citation:
      'NASP Principles for Professional Ethics (2020), Standard II.1 (Informed Consent/Assent)',
    summary:
      'School psychologists obtain informed consent from parents or guardians before conducting evaluations or providing services. They also seek the assent of students at a developmentally appropriate level. Consent must be informed, voluntary, and documented.',
    keyHolding:
      'Informed consent requires disclosure of the purpose, procedures, likely outcomes, and alternatives; confirmation that the decision is voluntary; and verification that the person has decision-making capacity.',
    applicability:
      'Required before every evaluation (also mandated by IDEA). School psychologists must explain what assessment will entail, how results will be used, and who will have access.',
    guardedMisconception:
      'Signing a form is sufficient for informed consent regardless of whether the parent understood what was explained.',
    skillIds: ['ETH-01', 'LEG-02'],
    etsTopicIds: ['IV.C.1.b', 'IV.C.2.a'],
  },

  {
    id: 'FW-nasp-ethics-dual-relationships',
    name: 'NASP Ethics — Avoiding Dual Relationships',
    citation:
      'NASP Principles for Professional Ethics (2020), Standard II.3.4 (Multiple Relationships)',
    summary:
      'School psychologists avoid relationships that could impair objectivity or create conflicts of interest — for example, providing therapy to a family member or conducting a formal evaluation of a student they are tutoring privately.',
    keyHolding:
      'Multiple relationships that would reasonably be expected to impair objectivity, competence, or effectiveness, or risk exploitation of clients, should be avoided. When unavoidable, they must be managed with transparency.',
    applicability:
      'Relevant in rural districts where the psychologist may know families personally, or in situations where a practitioner is asked to evaluate a student with whom they already have a therapeutic relationship.',
    guardedMisconception:
      'As long as a school psychologist acts professionally, having a prior personal relationship with a student\'s family does not pose any ethical problem.',
    skillIds: ['ETH-02', 'ETH-01'],
    etsTopicIds: ['IV.C.2.d', 'IV.C.1.a'],
  },

  {
    id: 'FW-mandated-reporting',
    name: 'Mandated Reporting Laws (Child Abuse and Neglect)',
    citation:
      'Child Abuse Prevention and Treatment Act (CAPTA), 42 U.S.C. § 5101 et seq.; state-level mandated reporter statutes',
    summary:
      'School psychologists are mandated reporters: they are legally required to report known or suspected child abuse or neglect to the appropriate child protective services agency. The reporting obligation exists when there is reasonable suspicion — certainty is not required.',
    keyHolding:
      'The duty to report is non-delegable: the psychologist must personally report (not rely on an administrator to do so). Failure to report is a criminal misdemeanor in most states. Good-faith reports are protected from liability.',
    applicability:
      'Applies whenever a student discloses abuse, exhibits physical signs of abuse, or makes statements that raise reasonable suspicion. The school psychologist does not investigate — they report.',
    guardedMisconception:
      'A school psychologist can defer to the principal to decide whether to file a mandated report, or may wait for certainty before reporting suspected abuse.',
    skillIds: ['SAF-04', 'ETH-02'],
    etsTopicIds: ['III.B.1.d', 'IV.C.2.d'],
  },

  // ── Practice Frameworks ────────────────────────────────────────────────────

  {
    id: 'FW-mtss',
    name: 'Multi-Tiered System of Supports (MTSS) / Response to Intervention (RTI)',
    citation:
      'IDEA 2004, 34 C.F.R. § 300.307(a)(2) (RTI as SLD identification method); ESSA 2015 (systems-level MTSS requirements)',
    summary:
      'MTSS is a school-wide prevention framework using tiered supports (universal/Tier 1, targeted/Tier 2, intensive/Tier 3). RTI, a component of MTSS, allows schools to use a child\'s response to evidence-based instruction as part of the SLD identification process.',
    keyHolding:
      'IDEA 2004 explicitly permits (and ESSA encourages) the use of RTI data in SLD identification as an alternative to the IQ–achievement discrepancy model. Schools must use scientific, research-based interventions at each tier.',
    applicability:
      'School psychologists design universal screening, progress monitoring, and data-review processes across tiers. They also lead problem-solving teams and interpret RTI data for eligibility decisions.',
    guardedMisconception:
      'RTI/MTSS is only relevant for reading disabilities, and IDEA still requires IQ–achievement discrepancy for all SLD identification.',
    skillIds: ['PSY-03', 'SWP-04', 'DBD-08'],
    etsTopicIds: ['I.A.3.a', 'III.A.1.d', 'I.A.2.g'],
  },

  {
    id: 'FW-pbis',
    name: 'Positive Behavioral Interventions and Supports (PBIS)',
    citation:
      'IDEA 1997 and 2004, 20 U.S.C. § 1414(d)(3)(B)(i) (IEP "special factors" — consider PBIS when behavior impedes learning); ESSA 2015 (school climate provisions)',
    summary:
      'PBIS is an evidence-based, tiered framework for improving school climate and reducing problem behavior through systematic teaching of prosocial behaviors, clear expectations, and data-driven decision-making.',
    keyHolding:
      'IDEA requires that, when a student\'s behavior impedes learning, the IEP team consider the use of positive behavioral interventions and supports. PBIS operationalizes this requirement at the school-wide, classroom, and individual levels.',
    applicability:
      'School psychologists lead or consult on PBIS implementation, coach teachers on proactive management, and interpret office discipline referral data to evaluate school-wide program effectiveness.',
    guardedMisconception:
      'PBIS is only for students with behavioral disabilities and does not apply to students without IEPs.',
    skillIds: ['SAF-01', 'SWP-04'],
    etsTopicIds: ['III.B.1.a', 'III.A.1.d'],
  },

  {
    id: 'FW-fba-idea',
    name: 'IDEA — Functional Behavioral Assessment (FBA) Requirement',
    citation: 'Individuals with Disabilities Education Act, 20 U.S.C. § 1415(k)(1)(D)–(F)',
    summary:
      'IDEA requires a Functional Behavioral Assessment for any student with a disability who is removed from school for more than 10 consecutive school days or whose behavior is determined to be a manifestation of their disability.',
    keyHolding:
      'The IEP team must conduct an FBA and develop or revise a Behavioral Intervention Plan (BIP) when disciplinary action would constitute a change of placement for a student whose behavior is manifestation-linked.',
    applicability:
      'School psychologists typically lead or co-lead FBAs. The process must identify the function of behavior (attention, escape, tangibles, sensory) and inform function-matched interventions in the BIP.',
    guardedMisconception:
      'An FBA is optional and only conducted when the school chooses to do so, not when required by IDEA during disciplinary proceedings.',
    skillIds: ['DBD-07', 'LEG-02', 'DBD-06'],
    etsTopicIds: ['I.A.2.e', 'IV.C.2.a', 'I.A.2.d'],
  },

  {
    id: 'FW-nasp-practice-model',
    name: 'NASP Practice Model — 10 Domains',
    citation:
      'National Association of School Psychologists, A Model for Comprehensive and Integrated School Psychological Services (2010, updated 2020)',
    summary:
      'The NASP Practice Model organizes school psychological services into 10 interconnected domains across data-based decision-making, student-level services, systems-level services, and foundations. It defines what school psychologists do across prevention, assessment, intervention, and consultation roles.',
    keyHolding:
      'Competency in all 10 domains (including research, ethics, diversity, consultation, and assessment) is required for entry-level practice. No single domain stands alone; the model is integrative.',
    applicability:
      'The NASP model is the conceptual framework behind the PRAXIS 5403 blueprint. Test items draw from all 10 domains. The school psychologist is expected to function as a data-based problem solver across individual and systems levels.',
    guardedMisconception:
      'School psychology is primarily an assessment and eligibility-determination role; counseling, consultation, and prevention are secondary functions.',
    skillIds: ['CON-01', 'SWP-03', 'ETH-03'],
    etsTopicIds: ['I.B.1.b', 'III.A.1.c', 'IV.C.3.b'],
  },

  {
    id: 'FW-child-find',
    name: 'IDEA — Child Find Obligation',
    citation: 'Individuals with Disabilities Education Act, 20 U.S.C. § 1412(a)(3)',
    summary:
      'All states must have policies and procedures to identify, locate, and evaluate all children with disabilities within the state who need special education and related services, regardless of the severity of their disability.',
    keyHolding:
      'Child Find applies to children in private schools, homeless children, children who are highly mobile, and children suspected of having a disability even if they are advancing from grade to grade. Schools cannot wait for a parent referral.',
    applicability:
      'School psychologists are part of the Child Find system: they may identify students during universal screening, teacher consultation, or review of attendance/discipline data who warrant evaluation.',
    guardedMisconception:
      'Schools only have to evaluate students after a formal written request by a parent; schools have no independent obligation to identify students who may need special education.',
    skillIds: ['LEG-02', 'PSY-03'],
    etsTopicIds: ['IV.C.2.a', 'I.A.3.a'],
  },

  {
    id: 'FW-nasp-ethics-records',
    name: 'NASP Ethics — Records, Reports, and Data Security',
    citation:
      'NASP Principles for Professional Ethics (2020), Standard II.4 (Records and Data); also FERPA, 20 U.S.C. § 1232g',
    summary:
      'School psychologists maintain secure records, limit access to authorized individuals, and retain records according to professional and legal standards. Psychological test protocols are education records under FERPA and must be protected accordingly.',
    keyHolding:
      'Test protocols and raw data belong to the school, but the school psychologist is responsible for their security and appropriate disclosure. FERPA governs parent access; professional ethics govern practitioner retention and sharing.',
    applicability:
      'Informs how long to keep records, who may access test protocols, and what to do with records at the end of a student\'s enrollment or the psychologist\'s employment.',
    guardedMisconception:
      'Test protocols are personal property of the school psychologist and can be discarded or shared at the psychologist\'s discretion.',
    skillIds: ['ETH-02', 'LEG-01'],
    etsTopicIds: ['IV.C.2.d', 'IV.C.2.c'],
  },

  {
    id: 'FW-section504-vs-idea',
    name: 'Section 504 vs. IDEA — Eligibility Distinction',
    citation:
      '29 U.S.C. § 794 (Section 504); 20 U.S.C. § 1401 (IDEA definitions)',
    summary:
      'IDEA covers 13 specific disability categories and requires specialized instruction. Section 504 covers any physical or mental impairment that substantially limits a major life activity — a broader standard — but only requires reasonable accommodations (not specialized instruction).',
    keyHolding:
      'A student who does not meet IDEA eligibility may still be eligible for a 504 plan. IDEA eligibility also satisfies 504 eligibility, but not vice versa. The correct tool depends on whether the student needs specially designed instruction (IDEA) or accommodations only (504).',
    applicability:
      'School psychologists must know which framework applies when evaluating a student with a health condition, chronic illness, or mental health diagnosis. Misclassifying or denying services because a student "doesn\'t qualify for an IEP" when they qualify for 504 is a civil rights violation.',
    guardedMisconception:
      'If a student does not qualify for an IEP under IDEA, the school has no further legal obligation to provide any disability services.',
    skillIds: ['LEG-03', 'LEG-02', 'ACA-09', 'DIV-05'],
    etsTopicIds: ['IV.C.2.a', 'II.B.1.c', 'IV.A.1.e'],
  },

  {
    id: 'FW-nasp-ethics-beneficence',
    name: 'NASP Ethics — Beneficence and Non-Maleficence',
    citation:
      'NASP Principles for Professional Ethics (2020), Standard I.1 (Respecting the Dignity and Rights of All Persons)',
    summary:
      'School psychologists act to benefit those they serve and protect them from harm. Competing ethical principles (beneficence, non-maleficence, autonomy, justice, fidelity) must be balanced using a systematic ethical decision-making process when they conflict.',
    keyHolding:
      'When ethical principles conflict (e.g., confidentiality vs. preventing harm), school psychologists should consult the NASP Ethical Decision-Making Model, which weighs the welfare of the client against potential harms of disclosure or inaction.',
    applicability:
      'Central to any ethical dilemma in practice — a student disclosing self-harm, competing obligations to parent and child, or pressure from administration to under-refer. The psychologist must reason through competing principles, not simply defer to authority.',
    guardedMisconception:
      'Following a supervisor\'s directive always resolves an ethical dilemma; school psychologists do not need to apply independent ethical reasoning.',
    skillIds: ['ETH-01', 'ETH-02', 'ETH-03'],
    etsTopicIds: ['IV.C.1.a', 'IV.C.2.d', 'IV.C.3.b'],
  },

  {
    id: 'FW-ebd-eligibility',
    name: 'IDEA — Emotional Disturbance (ED) Eligibility Criteria',
    citation:
      'Individuals with Disabilities Education Act, 20 U.S.C. § 1401(3); 34 C.F.R. § 300.8(c)(4)',
    summary:
      'IDEA defines Emotional Disturbance as a condition exhibiting one or more of five characteristics over a long period of time and to a marked degree that adversely affects educational performance: inability to learn, relationship problems, inappropriate behavior, pervasive unhappiness, and physical symptoms/fears associated with school.',
    keyHolding:
      'The definition explicitly excludes students who are "socially maladjusted" unless they also have emotional disturbance. Social maladjustment alone (e.g., conduct problems without underlying emotional disorder) does not qualify under IDEA\'s ED category.',
    applicability:
      'School psychologists use this definition when determining eligibility for students with internalizing or externalizing disorders. The social maladjustment exclusion is a common test item because it is frequently misunderstood in practice.',
    guardedMisconception:
      'Any student with chronic conduct problems or defiance automatically qualifies as Emotionally Disturbed under IDEA.',
    skillIds: ['MBH-04', 'LEG-02', 'DBD-06'],
    etsTopicIds: ['II.B.3.a', 'IV.C.2.a', 'I.A.2.d'],
  },

  {
    id: 'FW-special-ed-placement-continuum',
    name: 'IDEA — Continuum of Alternative Placements',
    citation: 'Individuals with Disabilities Education Act, 34 C.F.R. § 300.115',
    summary:
      'IDEA requires schools to maintain a continuum of alternative placements — from general education with supports, to resource room, to self-contained classroom, to special day school, to residential placement, to homebound/hospital instruction.',
    keyHolding:
      'Schools must make available the full range of settings. Placement decisions are individualized and must be based on the child\'s IEP needs, not administrative convenience or the availability of existing programs.',
    applicability:
      'School psychologists recommend placements and document the rationale. They must consider the least restrictive option that still meets the student\'s needs and document why less restrictive settings were insufficient.',
    guardedMisconception:
      'Schools can limit placement options to what is currently available in the district rather than providing whatever the student\'s IEP requires.',
    skillIds: ['DIV-05', 'LEG-02'],
    etsTopicIds: ['IV.A.1.e', 'IV.C.2.a'],
  },
];

/**
 * Look up a framework entry by its stable id.
 * Returns undefined if not found.
 */
export function getFramework(id: string): FrameworkEntry | undefined {
  return frameworkRegistry.find(f => f.id === id);
}

/**
 * Return all framework entries that govern a given canonical skill ID.
 */
export function getFrameworksBySkill(skillId: string): FrameworkEntry[] {
  return frameworkRegistry.filter(f => f.skillIds.includes(skillId));
}
