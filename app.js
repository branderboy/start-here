// ============================================================
// PROJECT START FORM - Main Application
// ============================================================

(function () {
  'use strict';

  // ---- Configuration ----
  // Replace with your Formspree form ID (create one at https://formspree.io)
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mkovvjjw';

  // ---- DOM References ----
  const form = document.getElementById('projectForm');
  const sections = Array.from(document.querySelectorAll('.form-section'));
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const progressFill = document.getElementById('progressFill');
  const stepIndicators = document.getElementById('stepIndicators');
  const successScreen = document.getElementById('successScreen');
  const addStepBtn = document.getElementById('addStepBtn');

  const totalSteps = sections.length;
  let currentStep = 0;
  let flowStepCount = 3;

  // ---- Initialize ----
  function init() {
    buildStepDots();
    updateUI();
    bindEvents();
    setDefaultDate();
  }

  function setDefaultDate() {
    const dateInput = document.getElementById('signDate');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  function buildStepDots() {
    stepIndicators.innerHTML = '';
    for (let i = 0; i < totalSteps; i++) {
      const dot = document.createElement('span');
      dot.className = 'step-dot' + (i === 0 ? ' active' : '');
      dot.dataset.step = i;
      dot.addEventListener('click', () => goToStep(i));
      stepIndicators.appendChild(dot);
    }
  }

  // ---- Navigation ----
  function goToStep(step) {
    // Only allow going back or to completed steps via dot click
    if (step > currentStep) {
      if (!validateSection(currentStep)) return;
    }
    currentStep = step;
    updateUI();
  }

  function updateUI() {
    sections.forEach((s, i) => s.classList.toggle('active', i === currentStep));

    // Progress bar
    const pct = ((currentStep + 1) / totalSteps) * 100;
    progressFill.style.width = pct + '%';

    // Step dots
    const dots = stepIndicators.querySelectorAll('.step-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === currentStep);
      d.classList.toggle('completed', i < currentStep);
    });

    // Buttons
    backBtn.disabled = currentStep === 0;
    if (currentStep === totalSteps - 1) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'inline-flex';
    } else {
      nextBtn.style.display = 'inline-flex';
      submitBtn.style.display = 'none';
    }

    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---- Validation ----
  function validateSection(stepIndex) {
    const section = sections[stepIndex];
    const inputs = section.querySelectorAll('[required]');
    let valid = true;

    inputs.forEach(input => {
      if (input.type === 'radio') {
        const name = input.name;
        const group = section.querySelectorAll(`input[name="${name}"]`);
        const checked = Array.from(group).some(r => r.checked);
        if (!checked) {
          valid = false;
          group.forEach(r => r.closest('.radio-card')?.classList.add('invalid-card'));
        } else {
          group.forEach(r => r.closest('.radio-card')?.classList.remove('invalid-card'));
        }
      } else if (input.type === 'checkbox' && input.id === 'consent') {
        if (!input.checked) {
          valid = false;
          input.closest('.consent-box').classList.add('invalid-card');
        } else {
          input.closest('.consent-box').classList.remove('invalid-card');
        }
      } else {
        if (!input.value.trim()) {
          valid = false;
          input.classList.add('invalid');
        } else {
          input.classList.remove('invalid');
        }
        // Email format check
        if (input.type === 'email' && input.value.trim()) {
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(input.value.trim())) {
            valid = false;
            input.classList.add('invalid');
          }
        }
      }
    });

    // Special: at least one scope checkbox on step 2
    if (stepIndex === 1) {
      const scopeChecked = section.querySelectorAll('input[name="scope"]:checked');
      if (scopeChecked.length === 0) {
        valid = false;
        section.querySelector('.checkbox-grid')?.classList.add('invalid-card');
      } else {
        section.querySelector('.checkbox-grid')?.classList.remove('invalid-card');
      }
    }

    // Special: at least one priority checkbox on step 5
    if (stepIndex === 4) {
      const prioChecked = section.querySelectorAll('input[name="priority"]:checked');
      if (prioChecked.length === 0) {
        valid = false;
        section.querySelector('.checkbox-grid.priorities')?.classList.add('invalid-card');
      } else {
        section.querySelector('.checkbox-grid.priorities')?.classList.remove('invalid-card');
      }
    }

    if (!valid) {
      const firstInvalid = section.querySelector('.invalid, .invalid-card');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valid;
  }

  // ---- Data Collection ----
  function collectFormData() {
    const data = {};
    const fd = new FormData(form);

    // Simple fields
    const textFields = [
      'companyName', 'contactName', 'email', 'phone', 'bestContact',
      'oneSentence', 'problem', 'success', 'deadline',
      'scopeOther', 'scopeDescription', 'exclusions',
      'websiteUrl', 'existingContent', 'brandAssets', 'mediaAssets',
      'customerData', 'offerDetails', 'pastMarketing', 'caseStudies',
      'toolAccess', 'folderLink',
      'priorityOther', 'involvement',
      'finalNotes', 'signature', 'signDate'
    ];

    textFields.forEach(f => {
      data[f] = fd.get(f) || '';
    });

    // Checkboxes
    data.scope = fd.getAll('scope');
    data.priority = fd.getAll('priority');

    // Flow steps
    data.flowSteps = [];
    for (let i = 1; i <= flowStepCount; i++) {
      const val = fd.get('flowStep' + i);
      if (val && val.trim()) data.flowSteps.push(val.trim());
    }

    return data;
  }

  // ---- Formspree Submission ----
  async function submitToFormspree(data) {
    const body = {
      _subject: `New Project Submission: ${data.companyName}`,
      'Company Name': data.companyName,
      'Contact Name': data.contactName,
      'Email': data.email,
      'Phone': data.phone,
      'Best Contact Method': data.bestContact,
      'Project Goal': data.oneSentence,
      'Problem': data.problem,
      'Success Criteria': data.success,
      'Deadline': data.deadline,
      'Scope': data.scope.join(', '),
      'Scope Other': data.scopeOther,
      'Scope Description': data.scopeDescription,
      'Exclusions': data.exclusions,
      'Website URL': data.websiteUrl,
      'Existing Content': data.existingContent,
      'Brand Assets': data.brandAssets,
      'Media Assets': data.mediaAssets,
      'Customer Data': data.customerData,
      'Offer Details': data.offerDetails,
      'Past Marketing': data.pastMarketing,
      'Case Studies': data.caseStudies,
      'Tool Access': data.toolAccess,
      'Folder Link': data.folderLink,
      'User Flow': data.flowSteps.join(' -> '),
      'Priorities': data.priority.join(', '),
      'Priority Other': data.priorityOther,
      'Involvement Level': data.involvement,
      'Final Notes': data.finalNotes,
      'Signature': data.signature,
      'Date': data.signDate,
    };

    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    });

    return res.ok;
  }

  // ---- Generate Translation (Internal Brief) ----
  function generateTranslation(data) {
    const brief = {};
    const all = (data.oneSentence + ' ' + data.problem + ' ' + data.success + ' ' + data.scopeDescription).toLowerCase();

    // --- 1. Executive Summary ---
    const summaryParts = [];
    summaryParts.push(data.companyName + ' needs a');
    const scopeNames = data.scope.filter(s => s !== 'Other');
    if (scopeNames.length > 0) {
      summaryParts.push(scopeNames.join(' + ').toLowerCase());
    } else {
      summaryParts.push('custom solution');
    }
    summaryParts.push('that solves: "' + data.problem.split(/[.!?\n]/)[0].trim() + '"');
    if (data.deadline) {
      summaryParts.push('— deadline-driven (' + data.deadline + ')');
    }
    brief.executiveSummary = summaryParts.join(' ') + '.';

    // --- 2. Technical Requirements ---
    const techReqs = [];

    // From scope
    const scopeTechMap = {
      'Website / Landing Page': [
        'Responsive front-end (mobile-first, Core Web Vitals compliant)',
        'SEO infrastructure: meta tags, Open Graph, structured data, sitemap',
        'Form handling with client-side validation and server submission',
        'Analytics integration (GA4/GTM event tracking)'
      ],
      'Automation / Workflow': [
        'Event-driven automation engine (webhook triggers, conditional branching)',
        'API integrations between systems (REST/webhook connectors)',
        'Error handling with retry logic and failure notifications',
        'Execution logging and audit trail'
      ],
      'CRM Setup': [
        'Data model: contacts, companies, deals with custom properties',
        'Pipeline configuration with stage-based automation',
        'Import/migration of existing data (deduplication, field mapping)',
        'API sync with external systems'
      ],
      'Dashboard / Reporting': [
        'Data aggregation layer pulling from connected sources',
        'Chart/widget rendering with date-range filtering',
        'Export functionality (CSV/PDF)',
        'Role-based access to reports'
      ],
      'Lead Generation System': [
        'Multi-step or progressive form with field validation',
        'Spam/bot protection (honeypot, reCAPTCHA)',
        'Lead routing: CRM insert + team notification (email/Slack)',
        'UTM parameter capture for source attribution'
      ],
      'Email Marketing Setup': [
        'ESP integration with list management and segmentation',
        'Template system (responsive, brand-consistent)',
        'Automation sequences: welcome, nurture, re-engagement',
        'Deliverability setup: SPF, DKIM, DMARC'
      ],
      'Internal Tool / App': [
        'Authentication and role-based access control',
        'CRUD interface with data validation',
        'Database persistence (relational or document store)',
        'Deployment pipeline with staging environment'
      ]
    };

    data.scope.forEach(s => {
      if (scopeTechMap[s]) {
        techReqs.push({ category: s, items: scopeTechMap[s] });
      }
    });
    if (data.scopeOther) {
      techReqs.push({ category: data.scopeOther, items: ['Custom implementation — define spec during discovery'] });
    }

    // From functional description
    const funcReqs = [];
    if (data.scopeDescription) funcReqs.push(data.scopeDescription);
    if (data.exclusions) funcReqs.push('EXCLUSIONS: ' + data.exclusions);

    brief.techReqs = techReqs;
    brief.funcReqs = funcReqs;

    // --- 3. Marketing Strategy Brief ---
    const mktBrief = [];

    // Position
    if (/lead|capture|convert|funnel|visitor/.test(all)) {
      mktBrief.push({ label: 'Funnel Type', value: 'Lead acquisition funnel — capture, qualify, nurture, hand off to sales' });
    }
    if (/email|newsletter|drip|campaign|sequence/.test(all)) {
      mktBrief.push({ label: 'Channel', value: 'Email marketing — lifecycle sequences with behavioral triggers' });
    }
    if (/brand|trust|credib|design|look|modern/.test(all)) {
      mktBrief.push({ label: 'Brand Play', value: 'Brand trust and credibility — design-led approach to build authority' });
    }
    if (/automat|effic|save time|manual/.test(all)) {
      mktBrief.push({ label: 'Value Prop', value: 'Operational efficiency — "do more with less" through automation' });
    }
    if (/revenue|sales|roi|profit|money|growth/.test(all)) {
      mktBrief.push({ label: 'KPI Focus', value: 'Revenue attribution — tie every touchpoint back to dollars generated' });
    }
    if (/data|report|dashboard|insight|metric|track/.test(all)) {
      mktBrief.push({ label: 'Intelligence', value: 'Data-driven decision making — real-time visibility into what\'s working' });
    }
    if (/booking|schedule|call|appointment|demo/.test(all)) {
      mktBrief.push({ label: 'Conversion Goal', value: 'Appointment setting — reduce friction from interest to booked call' });
    }

    // Audience / positioning from problem
    if (data.problem) {
      const painPoint = data.problem.split(/[.!?\n]/)[0].trim();
      mktBrief.push({ label: 'Client Pain Point', value: '"' + painPoint + '" — use this as the anchor for all messaging' });
    }
    if (data.success) {
      const winState = data.success.split(/[.!?\n]/)[0].trim();
      mktBrief.push({ label: 'Win State', value: '"' + winState + '" — this is what done looks like in their words' });
    }

    brief.mktBrief = mktBrief;

    // --- 4. Recommended Stack & Tools ---
    const stack = [];

    if (data.scope.includes('Website / Landing Page')) {
      stack.push({ tool: 'Webflow / WordPress / Custom HTML', reason: 'Landing page build — choose based on client\'s technical comfort and update frequency' });
      stack.push({ tool: 'Google Analytics 4 + Tag Manager', reason: 'Event tracking, conversion goals, UTM attribution' });
    }
    if (data.scope.includes('CRM Setup')) {
      stack.push({ tool: 'HubSpot / GoHighLevel / Pipedrive', reason: 'CRM with pipeline management — pick based on budget and feature needs' });
    }
    if (data.scope.includes('Automation / Workflow')) {
      stack.push({ tool: 'Zapier / Make / n8n', reason: 'Cross-platform automation orchestration with conditional logic' });
    }
    if (data.scope.includes('Dashboard / Reporting')) {
      stack.push({ tool: 'Google Looker Studio / Databox / Custom', reason: 'Data visualization and KPI dashboards' });
    }
    if (data.scope.includes('Lead Generation System')) {
      stack.push({ tool: 'Typeform / HubSpot Forms / Custom', reason: 'Lead capture with progressive profiling and validation' });
      stack.push({ tool: 'Calendly / Cal.com', reason: 'Appointment scheduling if lead-to-call flow is needed' });
    }
    if (data.scope.includes('Email Marketing Setup')) {
      stack.push({ tool: 'Mailchimp / ActiveCampaign / ConvertKit', reason: 'Email automation with segmentation and analytics' });
    }
    if (data.scope.includes('Internal Tool / App')) {
      stack.push({ tool: 'Retool / Bubble / Custom (React/Node)', reason: 'Internal app — low-code if speed matters, custom if flexibility matters' });
    }

    // From tool access field
    if (data.toolAccess) {
      stack.push({ tool: data.toolAccess, reason: 'Client-specified — already has access, integrate directly' });
    }

    brief.stack = stack;

    // --- 5. Deliverables Checklist ---
    const deliverables = [];
    data.scope.forEach(s => {
      if (s === 'Other') return;
      const delMap = {
        'Website / Landing Page': ['Live, deployed website/landing page', 'Mobile-responsive across all breakpoints', 'SEO configuration and analytics setup', 'Content populated and reviewed'],
        'Automation / Workflow': ['Documented workflow with trigger/action map', 'Live automations tested end-to-end', 'Error handling and notification setup'],
        'CRM Setup': ['Configured CRM with custom fields and pipeline', 'Data imported and deduplicated', 'Team accounts created with permissions'],
        'Dashboard / Reporting': ['Live dashboard with agreed-upon KPIs', 'Data sources connected and validated', 'Export and sharing configured'],
        'Lead Generation System': ['Lead capture form(s) live and tested', 'CRM integration receiving leads', 'Notification system for sales team', 'Attribution tracking active'],
        'Email Marketing Setup': ['Email templates designed and tested', 'Automation sequences built and active', 'List segmentation configured', 'Deliverability verified (SPF/DKIM)'],
        'Internal Tool / App': ['Deployed application with login', 'User roles and permissions configured', 'Documentation / training guide']
      };
      if (delMap[s]) deliverables.push({ scope: s, items: delMap[s] });
    });
    if (data.scopeOther) {
      deliverables.push({ scope: data.scopeOther, items: ['Deliverables to be defined during discovery'] });
    }
    brief.deliverables = deliverables;

    // --- 6. Complexity Assessment ---
    let complexityScore = 0;
    complexityScore += data.scope.length * 2;
    if (data.scope.includes('Internal Tool / App')) complexityScore += 3;
    if (data.scope.includes('Automation / Workflow')) complexityScore += 2;
    if (data.scope.includes('CRM Setup')) complexityScore += 1;
    if (data.flowSteps.length > 4) complexityScore += 2;
    if (data.toolAccess) complexityScore += 1;
    if (data.deadline) complexityScore += 1;
    if (data.exclusions) complexityScore += 1;

    const reasons = [];
    if (data.scope.length >= 4) reasons.push(data.scope.length + ' scope items means multiple workstreams');
    if (data.scope.includes('Internal Tool / App')) reasons.push('Custom app development adds significant build time');
    if (data.scope.includes('Automation / Workflow') && data.scope.length > 2) reasons.push('Automation across multiple systems requires integration testing');
    if (data.flowSteps.length > 4) reasons.push('Multi-step user flow (' + data.flowSteps.length + ' steps) requires thorough QA');
    if (data.deadline) reasons.push('Hard deadline (' + data.deadline + ') limits flexibility');
    if (data.scope.length <= 2 && !data.scope.includes('Internal Tool / App')) reasons.push('Focused scope keeps this manageable');
    if (data.involvement === 'Minimal involvement') reasons.push('Minimal client involvement speeds up execution');
    if (data.involvement === 'Review every step') reasons.push('Step-by-step review adds feedback cycles to timeline');

    let complexityLevel, complexityColor;
    if (complexityScore <= 5) { complexityLevel = 'Low'; complexityColor = '#10b981'; }
    else if (complexityScore <= 10) { complexityLevel = 'Medium'; complexityColor = '#f59e0b'; }
    else { complexityLevel = 'High'; complexityColor = '#ef4444'; }

    brief.complexity = { level: complexityLevel, color: complexityColor, score: complexityScore, reasons: reasons };

    // --- 7. Red Flags & Risks ---
    const risks = [];
    if (!data.websiteUrl && data.scope.includes('Website / Landing Page')) {
      risks.push({ flag: 'No existing website', note: 'Building from scratch — confirm content, copy, and brand assets are ready or budget for content creation' });
    }
    if (!data.brandAssets && (data.scope.includes('Website / Landing Page') || data.scope.includes('Email Marketing Setup'))) {
      risks.push({ flag: 'No brand assets provided', note: 'Need logo, colors, fonts before design can start — may delay kickoff' });
    }
    if (data.scope.length >= 4) {
      risks.push({ flag: 'Large scope (' + data.scope.length + ' items)', note: 'Consider phasing delivery rather than building everything at once' });
    }
    if (data.deadline && data.scope.length >= 3) {
      risks.push({ flag: 'Tight timeline vs. scope', note: '"' + data.deadline + '" with ' + data.scope.length + ' deliverables — may need to cut or phase' });
    }
    if (data.involvement === 'Review every step' && data.deadline) {
      risks.push({ flag: 'High review cadence + deadline', note: 'Step-by-step reviews slow delivery — set SLAs for feedback turnaround' });
    }
    if (!data.toolAccess && (data.scope.includes('CRM Setup') || data.scope.includes('Automation / Workflow'))) {
      risks.push({ flag: 'No tool access listed', note: 'Will need login credentials for CRM/automation platforms before build starts' });
    }
    if (!data.customerData && data.scope.includes('CRM Setup')) {
      risks.push({ flag: 'No customer data mentioned', note: 'CRM is only useful with data — confirm import source and format' });
    }
    if (data.exclusions) {
      risks.push({ flag: 'Exclusions noted', note: '"' + data.exclusions + '" — make sure team is aligned so this doesn\'t creep back in' });
    }
    if (risks.length === 0) {
      risks.push({ flag: 'None detected', note: 'Straightforward brief — still worth confirming assumptions in kickoff' });
    }

    brief.risks = risks;

    // --- 8. Discovery Questions ---
    const questions = [];
    if (data.scope.includes('Website / Landing Page') && !data.existingContent) {
      questions.push('Who is writing the copy? Do you have approved messaging or do we need to create it?');
    }
    if (data.scope.includes('Lead Generation System')) {
      questions.push('What qualifies a "good" lead? What makes one worth your time vs. not?');
      questions.push('Where is traffic coming from? Paid ads, organic, referrals, social?');
    }
    if (data.scope.includes('Automation / Workflow')) {
      questions.push('Walk me through the current manual process step by step — what exactly are you doing today?');
    }
    if (data.scope.includes('CRM Setup')) {
      questions.push('How many contacts/deals are we importing? What format is the data in?');
      questions.push('Who on your team will use the CRM daily, and what\'s their tech comfort level?');
    }
    if (data.scope.includes('Email Marketing Setup')) {
      questions.push('Do you have an existing email list? How big, and when was it last engaged?');
      questions.push('What\'s the first email someone should get after opting in?');
    }
    if (data.scope.includes('Dashboard / Reporting')) {
      questions.push('What decisions will this dashboard help you make? What action follows the data?');
    }
    if (data.scope.includes('Internal Tool / App')) {
      questions.push('How many users? What are the distinct roles and what can each role do?');
      questions.push('Is there an existing spreadsheet/process this is replacing? Can we see it?');
    }
    if (data.deadline) {
      questions.push('Is the deadline hard (event, launch) or soft (preference)? What happens if we miss it?');
    }
    if (!data.offerDetails && /lead|sales|revenue|convert/.test(all)) {
      questions.push('What\'s the offer? What are you selling, at what price point, to whom?');
    }
    if (questions.length === 0) {
      questions.push('What does your ideal first week after launch look like?');
    }

    brief.questions = questions;

    // --- 9. Upsell / Phase 2 Opportunities ---
    const upsells = [];
    if (data.scope.includes('Website / Landing Page') && !data.scope.includes('Lead Generation System')) {
      upsells.push({ idea: 'Lead Generation System', reason: 'You\'re building a page but not capturing leads — add forms, CTAs, and qualification logic' });
    }
    if (data.scope.includes('Lead Generation System') && !data.scope.includes('Email Marketing Setup')) {
      upsells.push({ idea: 'Email Nurture Sequences', reason: 'Leads without follow-up go cold — automate email sequences to warm them up' });
    }
    if (data.scope.includes('Lead Generation System') && !data.scope.includes('Dashboard / Reporting')) {
      upsells.push({ idea: 'Lead Attribution Dashboard', reason: 'Know which channels produce your best leads — UTM tracking + dashboard' });
    }
    if (data.scope.includes('CRM Setup') && !data.scope.includes('Automation / Workflow')) {
      upsells.push({ idea: 'CRM Automation', reason: 'Automate deal stage updates, task creation, and follow-up reminders' });
    }
    if (data.scope.includes('Email Marketing Setup') && !data.scope.includes('Dashboard / Reporting')) {
      upsells.push({ idea: 'Email Performance Dashboard', reason: 'Track open rates, CTR, revenue per send, and list health over time' });
    }
    if (!data.scope.includes('Automation / Workflow') && data.scope.length >= 2) {
      upsells.push({ idea: 'Cross-System Automation', reason: 'Connect your ' + scopeNames.slice(0, 2).join(' and ') + ' so data flows automatically' });
    }
    if (data.scope.includes('Website / Landing Page') && !data.scope.includes('Internal Tool / App')) {
      upsells.push({ idea: 'A/B Testing Setup', reason: 'Test headlines, CTAs, and layouts to continuously improve conversion rates' });
    }

    brief.upsells = upsells;

    return brief;
  }

  // ---- Generate AI Prompt ----
  function generatePrompt(data) {
    const scopeList = data.scope.map(s => `- ${s}`).join('\n');
    const flowList = data.flowSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    const priorities = data.priority.join(', ');

    return `You are a solutions architect building a project for ${data.companyName}.

CLIENT OVERVIEW:
- Contact: ${data.contactName} (${data.email})
- Preferred contact: ${data.bestContact || 'Not specified'}

PROJECT OBJECTIVE:
${data.oneSentence}

PROBLEM STATEMENT:
${data.problem}

SUCCESS CRITERIA:
${data.success}

DEADLINE: ${data.deadline || 'Flexible'}

SCOPE OF WORK:
${scopeList}${data.scopeOther ? '\n- ' + data.scopeOther : ''}

FUNCTIONAL REQUIREMENTS:
${data.scopeDescription}

EXCLUSIONS:
${data.exclusions || 'None specified'}

EXISTING ASSETS:
- Website: ${data.websiteUrl || 'None'}
- Content: ${data.existingContent || 'None'}
- Brand Assets: ${data.brandAssets || 'None'}
- Media: ${data.mediaAssets || 'None'}
- Customer Data: ${data.customerData || 'None'}
- Offers/Pricing: ${data.offerDetails || 'None'}
- Past Marketing: ${data.pastMarketing || 'None'}
- Case Studies: ${data.caseStudies || 'None'}
- Tool Access: ${data.toolAccess || 'None'}

USER FLOW:
${flowList || 'Not specified'}

PRIORITIES: ${priorities}${data.priorityOther ? ', ' + data.priorityOther : ''}
CLIENT INVOLVEMENT: ${data.involvement}

ADDITIONAL NOTES:
${data.finalNotes || 'None'}

INSTRUCTIONS:
Based on the above brief, create a detailed project plan with:
1. Recommended tech stack and tools
2. Phase-by-phase implementation plan
3. Key milestones and deliverables
4. Potential risks and mitigation strategies
5. Estimated timeline for each phase`;
  }

  // ---- Generate Solution Blueprint ----
  function generateSolution(data) {
    const phases = [];

    // Phase 1: Discovery & Setup
    const phase1Items = [
      'Review all provided source materials and assets',
      `Set up project workspace and communication channel (${data.bestContact || 'email'})`,
    ];
    if (data.websiteUrl) phase1Items.push('Audit existing website: ' + data.websiteUrl);
    if (data.toolAccess) phase1Items.push('Gain access to required platforms: ' + data.toolAccess);
    phases.push({ title: 'Phase 1: Discovery & Setup', items: phase1Items });

    // Phase 2: Architecture & Design
    const phase2Items = [];
    if (data.scope.includes('Website / Landing Page')) {
      phase2Items.push('Design responsive landing page wireframes');
      phase2Items.push('Create visual mockups aligned with brand assets');
    }
    if (data.scope.includes('CRM Setup')) {
      phase2Items.push('Map CRM data model and pipeline stages');
    }
    if (data.scope.includes('Automation / Workflow')) {
      phase2Items.push('Design automation workflow diagrams');
    }
    if (data.scope.includes('Dashboard / Reporting')) {
      phase2Items.push('Define KPIs and dashboard layout');
    }
    if (data.scope.includes('Lead Generation System')) {
      phase2Items.push('Design lead capture funnel and qualification criteria');
    }
    if (data.scope.includes('Email Marketing Setup')) {
      phase2Items.push('Plan email sequences and templates');
    }
    if (data.scope.includes('Internal Tool / App')) {
      phase2Items.push('Define app architecture and user interface specs');
    }
    if (phase2Items.length === 0) phase2Items.push('Define system architecture and design specs');
    phases.push({ title: 'Phase 2: Architecture & Design', items: phase2Items });

    // Phase 3: Build
    const phase3Items = [];
    data.scope.forEach(s => {
      if (s === 'Other') return;
      phase3Items.push('Build: ' + s);
    });
    if (data.scopeOther) phase3Items.push('Build: ' + data.scopeOther);
    phase3Items.push('Implement user flow: ' + (data.flowSteps.join(' -> ') || 'as described'));
    phases.push({ title: 'Phase 3: Build & Implement', items: phase3Items });

    // Phase 4: Test & Launch
    const phase4Items = [
      'QA testing across devices and browsers',
      'Client review and feedback round',
      `Validate success criteria: "${data.success}"`,
      'Go-live deployment',
    ];
    if (data.deadline) phase4Items.push('Target deadline: ' + data.deadline);
    phases.push({ title: 'Phase 4: Test & Launch', items: phase4Items });

    // Phase 5: Handoff
    const phase5Items = [
      'Documentation and training materials',
      'Handoff meeting and walkthrough',
    ];
    if (data.involvement === 'Minimal involvement') {
      phase5Items.push('Provide detailed operating guide for self-service management');
    }
    phases.push({ title: 'Phase 5: Handoff & Support', items: phase5Items });

    return phases;
  }

  // ---- Render Results ----
  function renderSummary(data) {
    const el = document.getElementById('projectSummary');
    const row = (label, value) => value ? `<div class="summary-row"><span class="summary-label">${label}</span><span class="summary-value">${escapeHtml(value)}</span></div>` : '';

    el.innerHTML = `
      <div class="summary-section">
        <h3>Contact Information</h3>
        ${row('Company', data.companyName)}
        ${row('Contact', data.contactName)}
        ${row('Email', data.email)}
        ${row('Phone', data.phone)}
        ${row('Preferred Contact', data.bestContact)}
      </div>
      <div class="summary-section">
        <h3>Project Overview</h3>
        ${row('Objective', data.oneSentence)}
        ${row('Problem', data.problem)}
        ${row('Success Criteria', data.success)}
        ${row('Deadline', data.deadline)}
      </div>
      <div class="summary-section">
        <h3>Scope</h3>
        ${row('Services', data.scope.join(', '))}
        ${data.scopeOther ? row('Other', data.scopeOther) : ''}
        ${row('Description', data.scopeDescription)}
        ${row('Exclusions', data.exclusions)}
      </div>
      <div class="summary-section">
        <h3>User Flow</h3>
        ${data.flowSteps.map((s, i) => row('Step ' + (i + 1), s)).join('')}
      </div>
      <div class="summary-section">
        <h3>Expectations</h3>
        ${row('Priorities', data.priority.join(', ') + (data.priorityOther ? ', ' + data.priorityOther : ''))}
        ${row('Involvement', data.involvement)}
      </div>
      ${data.finalNotes ? `<div class="summary-section"><h3>Notes</h3>${row('Additional Notes', data.finalNotes)}</div>` : ''}
      <div class="summary-section">
        <h3>Confirmation</h3>
        ${row('Signature', data.signature)}
        ${row('Date', data.signDate)}
      </div>
    `;
  }

  function renderPrompt(data) {
    const el = document.getElementById('generatedPrompt');
    el.textContent = generatePrompt(data);
  }

  function renderTranslation(data) {
    const el = document.getElementById('solutionTranslation');
    const brief = generateTranslation(data);

    el.innerHTML = `
      <div class="brief-header">
        <h3>Internal Project Brief</h3>
        <p>What the client actually needs — in terms your team can execute on.</p>
      </div>

      <div class="brief-section">
        <div class="brief-section-head">
          <span class="brief-icon">&#128203;</span>
          <h4>Executive Summary</h4>
        </div>
        <p class="brief-summary-text">${escapeHtml(brief.executiveSummary)}</p>
        <div class="brief-meta-row">
          <span class="brief-badge" style="background:${brief.complexity.color}; color:#fff;">Complexity: ${brief.complexity.level}</span>
          <span class="brief-badge brief-badge-outline">${data.scope.length} deliverable${data.scope.length > 1 ? 's' : ''}</span>
          <span class="brief-badge brief-badge-outline">${data.involvement}</span>
          ${data.deadline ? '<span class="brief-badge brief-badge-outline">Deadline: ' + escapeHtml(data.deadline) + '</span>' : ''}
        </div>
      </div>

      <div class="brief-section">
        <div class="brief-section-head">
          <span class="brief-icon">&#128736;</span>
          <h4>Technical Requirements</h4>
        </div>
        ${brief.techReqs.map(cat => `
          <div class="brief-card">
            <h5>${escapeHtml(cat.category)}</h5>
            <ul>${cat.items.map(i => '<li>' + escapeHtml(i) + '</li>').join('')}</ul>
          </div>
        `).join('')}
        ${brief.funcReqs.length > 0 ? `
          <div class="brief-card brief-card-muted">
            <h5>Client's Functional Description</h5>
            ${brief.funcReqs.map(r => '<p>' + escapeHtml(r) + '</p>').join('')}
          </div>
        ` : ''}
      </div>

      <div class="brief-section">
        <div class="brief-section-head">
          <span class="brief-icon">&#128640;</span>
          <h4>Marketing Strategy Brief</h4>
        </div>
        <div class="brief-kv-grid">
          ${brief.mktBrief.map(m => `
            <div class="brief-kv">
              <span class="brief-kv-label">${escapeHtml(m.label)}</span>
              <span class="brief-kv-value">${escapeHtml(m.value)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      ${brief.stack.length > 0 ? `
        <div class="brief-section">
          <div class="brief-section-head">
            <span class="brief-icon">&#9881;</span>
            <h4>Recommended Stack & Tools</h4>
          </div>
          <div class="brief-stack-grid">
            ${brief.stack.map(s => `
              <div class="brief-stack-item">
                <strong>${escapeHtml(s.tool)}</strong>
                <span>${escapeHtml(s.reason)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="brief-section">
        <div class="brief-section-head">
          <span class="brief-icon">&#9989;</span>
          <h4>Deliverables Checklist</h4>
        </div>
        ${brief.deliverables.map(d => `
          <div class="brief-card">
            <h5>${escapeHtml(d.scope)}</h5>
            <ul class="brief-checklist">${d.items.map(i => '<li>' + escapeHtml(i) + '</li>').join('')}</ul>
          </div>
        `).join('')}
      </div>

      <div class="brief-section">
        <div class="brief-section-head">
          <span class="brief-icon">&#128200;</span>
          <h4>Complexity Assessment</h4>
        </div>
        <div class="brief-complexity">
          <div class="brief-complexity-meter">
            <div class="brief-complexity-bar" style="width:${Math.min(brief.complexity.score * 6, 100)}%; background:${brief.complexity.color};"></div>
          </div>
          <span class="brief-complexity-label" style="color:${brief.complexity.color};">${brief.complexity.level} (score: ${brief.complexity.score})</span>
        </div>
        <ul class="brief-reasons">${brief.complexity.reasons.map(r => '<li>' + escapeHtml(r) + '</li>').join('')}</ul>
      </div>

      <div class="brief-section brief-section-warn">
        <div class="brief-section-head">
          <span class="brief-icon">&#9888;</span>
          <h4>Red Flags & Risks</h4>
        </div>
        ${brief.risks.map(r => `
          <div class="brief-risk">
            <strong>${escapeHtml(r.flag)}</strong>
            <p>${escapeHtml(r.note)}</p>
          </div>
        `).join('')}
      </div>

      <div class="brief-section">
        <div class="brief-section-head">
          <span class="brief-icon">&#10067;</span>
          <h4>Discovery Questions</h4>
          <span class="brief-head-note">Ask these in the kickoff call</span>
        </div>
        <ol class="brief-questions">${brief.questions.map(q => '<li>' + escapeHtml(q) + '</li>').join('')}</ol>
      </div>

      ${brief.upsells.length > 0 ? `
        <div class="brief-section brief-section-upsell">
          <div class="brief-section-head">
            <span class="brief-icon">&#128161;</span>
            <h4>Phase 2 / Upsell Opportunities</h4>
          </div>
          ${brief.upsells.map(u => `
            <div class="brief-upsell-item">
              <strong>${escapeHtml(u.idea)}</strong>
              <p>${escapeHtml(u.reason)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  function renderSolution(data) {
    const el = document.getElementById('solutionBlueprint');
    const phases = generateSolution(data);
    el.innerHTML = phases.map(p => `
      <div class="blueprint-phase">
        <h4>${escapeHtml(p.title)}</h4>
        <ul>${p.items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- PDF Download ----
  function downloadSummary(data) {
    const prompt = generatePrompt(data);
    const phases = generateSolution(data);
    const phasesText = phases.map(p =>
      p.title + '\n' + p.items.map(i => '  - ' + i).join('\n')
    ).join('\n\n');

    const brief = generateTranslation(data);
    const translationText = [
      'EXECUTIVE SUMMARY',
      brief.executiveSummary,
      'Complexity: ' + brief.complexity.level + ' (score: ' + brief.complexity.score + ')',
      '',
      'TECHNICAL REQUIREMENTS',
      ...brief.techReqs.map(c => c.category + ':\n' + c.items.map(i => '  - ' + i).join('\n')),
      '',
      'MARKETING STRATEGY',
      ...brief.mktBrief.map(m => '  ' + m.label + ': ' + m.value),
      '',
      'RECOMMENDED STACK',
      ...brief.stack.map(s => '  ' + s.tool + ' — ' + s.reason),
      '',
      'DELIVERABLES',
      ...brief.deliverables.map(d => d.scope + ':\n' + d.items.map(i => '  [ ] ' + i).join('\n')),
      '',
      'COMPLEXITY FACTORS',
      ...brief.complexity.reasons.map(r => '  - ' + r),
      '',
      'RED FLAGS & RISKS',
      ...brief.risks.map(r => '  ! ' + r.flag + ': ' + r.note),
      '',
      'DISCOVERY QUESTIONS',
      ...brief.questions.map((q, i) => '  ' + (i + 1) + '. ' + q),
      '',
      'PHASE 2 / UPSELL OPPORTUNITIES',
      ...brief.upsells.map(u => '  + ' + u.idea + ': ' + u.reason),
    ].join('\n');

    const text = `PROJECT START FORM - SUBMISSION SUMMARY
========================================
Date: ${data.signDate}
Company: ${data.companyName}
Contact: ${data.contactName} (${data.email})

----------------------------------------
PROJECT OVERVIEW
----------------------------------------
Objective: ${data.oneSentence}
Problem: ${data.problem}
Success: ${data.success}
Deadline: ${data.deadline || 'Flexible'}

Scope: ${data.scope.join(', ')}${data.scopeOther ? ', ' + data.scopeOther : ''}
Description: ${data.scopeDescription}
Exclusions: ${data.exclusions || 'None'}

----------------------------------------
SOURCE MATERIALS
----------------------------------------
Website: ${data.websiteUrl || 'None'}
Content: ${data.existingContent || 'None'}
Brand Assets: ${data.brandAssets || 'None'}
Media: ${data.mediaAssets || 'None'}
Customer Data: ${data.customerData || 'None'}
Offers: ${data.offerDetails || 'None'}
Past Marketing: ${data.pastMarketing || 'None'}
Case Studies: ${data.caseStudies || 'None'}
Tool Access: ${data.toolAccess || 'None'}

----------------------------------------
USER FLOW
----------------------------------------
${data.flowSteps.map((s, i) => (i + 1) + '. ' + s).join('\n')}

----------------------------------------
EXPECTATIONS
----------------------------------------
Priorities: ${data.priority.join(', ')}${data.priorityOther ? ', ' + data.priorityOther : ''}
Involvement: ${data.involvement}
Notes: ${data.finalNotes || 'None'}
Signature: ${data.signature}

========================================
TRANSLATION (Technical & Marketing)
========================================
${translationText}

========================================
AI PROMPT
========================================
${prompt}

========================================
SOLUTION BLUEPRINT
========================================
${phasesText}
`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-start-${data.companyName.replace(/\s+/g, '-').toLowerCase()}-${data.signDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Event Binding ----
  function bindEvents() {
    nextBtn.addEventListener('click', () => {
      if (validateSection(currentStep)) {
        currentStep++;
        updateUI();
      }
    });

    backBtn.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        updateUI();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateSection(currentStep)) return;

      const data = collectFormData();

      // Show loading state
      submitBtn.classList.add('loading');
      submitBtn.textContent = 'Submitting...';

      // Try Formspree
      let emailSent = false;
      try {
        emailSent = await submitToFormspree(data);
      } catch (err) {
        console.warn('Formspree submission failed:', err);
      }

      // Render results regardless
      renderSummary(data);
      renderTranslation(data);
      renderPrompt(data);
      renderSolution(data);

      // Hide form, show success
      form.style.display = 'none';
      document.querySelector('.form-nav').style.display = 'none';
      successScreen.style.display = 'block';

      if (!emailSent) {
        const notice = document.createElement('p');
        notice.style.cssText = 'color: #f59e0b; font-size: 14px; margin-top: 8px;';
        notice.textContent = 'Note: Email delivery could not be confirmed. Please use the download option to save your submission.';
        successScreen.querySelector('.success-icon').after(notice);
      }

      // Reset button
      submitBtn.classList.remove('loading');
      submitBtn.textContent = 'Submit Project';

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Add flow step
    addStepBtn.addEventListener('click', () => {
      flowStepCount++;
      const stepDiv = document.createElement('div');
      stepDiv.className = 'flow-step';
      stepDiv.innerHTML = `
        <span class="step-badge">${flowStepCount}</span>
        <div class="form-group" style="flex:1;">
          <label for="flowStep${flowStepCount}">Step ${flowStepCount}</label>
          <input type="text" id="flowStep${flowStepCount}" name="flowStep${flowStepCount}" placeholder="What happens next?">
        </div>
      `;
      document.getElementById('flowSteps').appendChild(stepDiv);
    });

    // Toggle "Other" fields
    document.querySelectorAll('input[name="scope"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const otherChecked = document.querySelector('input[name="scope"][value="Other"]')?.checked;
        document.getElementById('scopeOtherGroup').style.display = otherChecked ? 'block' : 'none';
      });
    });

    document.querySelectorAll('input[name="priority"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const otherChecked = document.querySelector('input[name="priority"][value="Other"]')?.checked;
        document.getElementById('priorityOtherGroup').style.display = otherChecked ? 'block' : 'none';
      });
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });

    // Copy prompt
    document.getElementById('copyPromptBtn').addEventListener('click', () => {
      const text = document.getElementById('generatedPrompt').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyPromptBtn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Prompt', 2000);
      });
    });

    // Download
    document.getElementById('downloadBtn').addEventListener('click', () => {
      const data = collectFormData();
      downloadSummary(data);
    });

    // New form
    document.getElementById('newFormBtn').addEventListener('click', () => {
      form.reset();
      currentStep = 0;
      flowStepCount = 3;
      // Remove extra flow steps
      const flowContainer = document.getElementById('flowSteps');
      while (flowContainer.children.length > 3) {
        flowContainer.removeChild(flowContainer.lastChild);
      }
      form.style.display = 'block';
      document.querySelector('.form-nav').style.display = 'flex';
      successScreen.style.display = 'none';
      setDefaultDate();
      updateUI();
    });

    // Clear validation on input
    form.addEventListener('input', (e) => {
      if (e.target.classList.contains('invalid')) {
        e.target.classList.remove('invalid');
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !e.target.closest('button')) {
        e.preventDefault();
        if (currentStep < totalSteps - 1) {
          nextBtn.click();
        }
      }
    });
  }

  // ---- Start ----
  init();
})();
