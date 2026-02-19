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

    // Special: at least one scope checkbox on step 3
    if (stepIndex === 2) {
      const scopeChecked = section.querySelectorAll('input[name="scope"]:checked');
      if (scopeChecked.length === 0) {
        valid = false;
        section.querySelector('.checkbox-grid')?.classList.add('invalid-card');
      } else {
        section.querySelector('.checkbox-grid')?.classList.remove('invalid-card');
      }
    }

    // Special: at least one priority checkbox on step 6
    if (stepIndex === 5) {
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

  // ---- Generate Translation (Technical & Marketing Terms) ----
  function generateTranslation(data) {
    const sections = [];

    // --- Translate the project objective ---
    const objective = data.oneSentence.toLowerCase();
    const techGoals = [];
    const marketingGoals = [];

    // Keyword-based mapping for objectives
    if (/lead|capture|convert|visitor|form/.test(objective)) {
      techGoals.push('Conversion-optimized lead capture funnel with form validation and CRM integration');
      marketingGoals.push('Top-of-funnel acquisition asset with lead magnet and nurture sequence');
    }
    if (/automat|workflow|trigger|sequence/.test(objective)) {
      techGoals.push('Event-driven automation pipeline with conditional branching and webhook triggers');
      marketingGoals.push('Lifecycle marketing automation with behavioral triggers and drip campaigns');
    }
    if (/dashboard|report|metric|analytic|track/.test(objective)) {
      techGoals.push('Real-time data visualization layer with aggregation queries and KPI widgets');
      marketingGoals.push('Performance reporting dashboard with attribution modeling and ROI tracking');
    }
    if (/website|landing|page|site/.test(objective)) {
      techGoals.push('Responsive, SEO-optimized web application with server-side rendering');
      marketingGoals.push('High-converting landing experience with A/B test-ready layout and CTA strategy');
    }
    if (/email|newsletter|campaign|drip/.test(objective)) {
      techGoals.push('Transactional and marketing email system with template engine and send scheduling');
      marketingGoals.push('Email marketing program with segmentation, personalization, and engagement scoring');
    }
    if (/crm|pipeline|sales|deal/.test(objective)) {
      techGoals.push('CRM data model with pipeline stages, contact records, and activity logging');
      marketingGoals.push('Sales enablement platform with lead scoring and pipeline velocity optimization');
    }
    if (/app|tool|internal|system/.test(objective)) {
      techGoals.push('Custom web application with role-based access control and CRUD operations');
      marketingGoals.push('Internal productivity tool to streamline operations and reduce manual overhead');
    }
    if (/booking|schedule|call|appointment/.test(objective)) {
      techGoals.push('Calendar integration with availability sync, booking API, and confirmation webhooks');
      marketingGoals.push('Appointment funnel with friction-reduction UX and automated follow-up');
    }
    if (techGoals.length === 0) {
      techGoals.push('Custom digital solution with API integrations and data persistence');
      marketingGoals.push('Strategic digital asset aligned with business growth objectives');
    }

    sections.push({
      title: 'Project Objective',
      clientSaid: data.oneSentence,
      technical: techGoals.join('. '),
      marketing: marketingGoals.join('. ')
    });

    // --- Translate the problem statement ---
    const problem = data.problem.toLowerCase();
    const techProblem = [];
    const mktProblem = [];

    if (/manual|time|slow|tedious|repetitive/.test(problem)) {
      techProblem.push('Manual processes lacking automation, causing operational bottlenecks');
      mktProblem.push('Revenue leakage from inefficient workflows and delayed response times');
    }
    if (/lead|miss|losing|follow.?up|no.?system/.test(problem)) {
      techProblem.push('No structured data pipeline for lead intake, routing, and status tracking');
      mktProblem.push('Broken acquisition funnel with high drop-off and no attribution visibility');
    }
    if (/data|track|measure|report|insight|visib/.test(problem)) {
      techProblem.push('Fragmented data sources with no unified query layer or reporting interface');
      mktProblem.push('Lack of actionable performance insights, preventing data-driven optimization');
    }
    if (/design|look|brand|outdated|ugly|trust/.test(problem)) {
      techProblem.push('Front-end UI/UX does not meet modern responsive design standards');
      mktProblem.push('Brand perception gap eroding trust and lowering conversion rates');
    }
    if (/scale|grow|volume|capacity/.test(problem)) {
      techProblem.push('Current architecture has scalability constraints under increased load');
      mktProblem.push('Growth ceiling caused by infrastructure that can\'t support demand');
    }
    if (techProblem.length === 0) {
      techProblem.push('Existing systems do not meet current operational requirements');
      mktProblem.push('Business performance constrained by tooling gaps');
    }

    sections.push({
      title: 'Problem Statement',
      clientSaid: data.problem,
      technical: techProblem.join('. '),
      marketing: mktProblem.join('. ')
    });

    // --- Translate success criteria ---
    const success = data.success.toLowerCase();
    const techSuccess = [];
    const mktSuccess = [];

    if (/lead|qualified|booked|call|demo/.test(success)) {
      techSuccess.push('Measurable lead conversion rate with form-to-CRM pipeline completion');
      mktSuccess.push('Qualified lead volume target with cost-per-acquisition benchmarks');
    }
    if (/automat|save time|hands.?off|run itself/.test(success)) {
      techSuccess.push('Zero-touch execution of defined workflows with error handling and logging');
      mktSuccess.push('Operational efficiency gains measured in hours saved per week');
    }
    if (/revenue|sales|roi|money|profit/.test(success)) {
      techSuccess.push('Conversion tracking with revenue attribution across touchpoints');
      mktSuccess.push('Positive ROI with measurable revenue lift tied to campaign performance');
    }
    if (/email|open|click|engag|subscriber/.test(success)) {
      techSuccess.push('Email delivery and engagement metrics (open rate, CTR, bounce rate)');
      mktSuccess.push('Email program KPIs: list growth, engagement rate, and revenue per send');
    }
    if (techSuccess.length === 0) {
      techSuccess.push('Defined acceptance criteria met with measurable performance benchmarks');
      mktSuccess.push('Clear business outcomes with trackable success metrics');
    }

    sections.push({
      title: 'Success Criteria',
      clientSaid: data.success,
      technical: techSuccess.join('. '),
      marketing: mktSuccess.join('. ')
    });

    // --- Translate scope items ---
    const scopeMap = {
      'Website / Landing Page': {
        technical: 'Responsive front-end application (HTML/CSS/JS or framework-based) with SEO metadata, structured data, and performance optimization (Core Web Vitals)',
        marketing: 'Conversion-focused landing experience with persuasive copy hierarchy, social proof placement, and CTA optimization'
      },
      'Automation / Workflow': {
        technical: 'Event-driven automation engine with conditional logic, API integrations, webhook listeners, and error retry mechanisms',
        marketing: 'Marketing and sales automation reducing manual touchpoints and accelerating speed-to-lead'
      },
      'CRM Setup': {
        technical: 'Relational data model with contact/company/deal entities, custom fields, pipeline stages, and API sync',
        marketing: 'Customer relationship management platform enabling segmentation, lead scoring, and lifecycle tracking'
      },
      'Dashboard / Reporting': {
        technical: 'Data visualization layer with aggregation queries, chart rendering, date-range filtering, and export capabilities',
        marketing: 'Executive-level performance dashboard with KPIs, trend analysis, and ROI attribution'
      },
      'Lead Generation System': {
        technical: 'Multi-step form with progressive profiling, spam filtering, validation, and CRM/notification integration',
        marketing: 'Full-funnel lead gen engine: traffic capture, qualification, nurture sequence, and sales handoff'
      },
      'Email Marketing Setup': {
        technical: 'Email service provider integration with template system, list management, segmentation rules, and send scheduling',
        marketing: 'Email marketing program with welcome series, re-engagement campaigns, and revenue-per-subscriber optimization'
      },
      'Internal Tool / App': {
        technical: 'Custom CRUD application with authentication, role-based access control, and database persistence',
        marketing: 'Internal productivity tool reducing operational friction and enabling team-wide efficiency gains'
      }
    };

    const scopeTech = [];
    const scopeMkt = [];
    data.scope.forEach(s => {
      if (scopeMap[s]) {
        scopeTech.push(s + ': ' + scopeMap[s].technical);
        scopeMkt.push(s + ': ' + scopeMap[s].marketing);
      }
    });
    if (data.scopeOther) {
      scopeTech.push(data.scopeOther + ': Custom implementation per requirements');
      scopeMkt.push(data.scopeOther + ': Tailored solution addressing specific business need');
    }

    sections.push({
      title: 'Scope of Work',
      clientSaid: data.scope.join(', ') + (data.scopeOther ? ', ' + data.scopeOther : ''),
      technical: scopeTech.join('\n'),
      marketing: scopeMkt.join('\n')
    });

    // --- Translate priorities ---
    const prioMap = {
      'Speed': {
        technical: 'Optimized load times (sub-2s TTFB), lazy loading, CDN delivery, and rapid deployment pipeline',
        marketing: 'Fast time-to-market with agile delivery sprints and accelerated launch timeline'
      },
      'Clean Design': {
        technical: 'Component-based UI architecture with design system tokens, accessibility (WCAG 2.1), and responsive breakpoints',
        marketing: 'Premium brand experience with modern aesthetics that builds trust and drives engagement'
      },
      'Automation Efficiency': {
        technical: 'Optimized workflow execution with minimal latency, parallel processing, and idempotent operations',
        marketing: 'Maximum operational leverage — do more with less through intelligent automation'
      },
      'Scalability': {
        technical: 'Horizontally scalable architecture with stateless services, caching layers, and load balancing',
        marketing: 'Growth-ready infrastructure that scales with demand without rebuilding from scratch'
      },
      'Lead Quality': {
        technical: 'Multi-field qualification logic, lead scoring algorithms, and spam/bot filtering',
        marketing: 'Higher-intent pipeline with qualification gates that filter out tire-kickers before sales engagement'
      }
    };

    const prioTech = [];
    const prioMkt = [];
    data.priority.forEach(p => {
      if (prioMap[p]) {
        prioTech.push(p + ': ' + prioMap[p].technical);
        prioMkt.push(p + ': ' + prioMap[p].marketing);
      }
    });
    if (data.priorityOther) {
      prioTech.push(data.priorityOther + ': Custom priority — will define technical spec during discovery');
      prioMkt.push(data.priorityOther + ': Strategic priority aligned to core business KPIs');
    }

    sections.push({
      title: 'Priorities',
      clientSaid: data.priority.join(', ') + (data.priorityOther ? ', ' + data.priorityOther : ''),
      technical: prioTech.join('\n'),
      marketing: prioMkt.join('\n')
    });

    // --- Translate involvement level ---
    const involvementMap = {
      'Review every step': {
        technical: 'Iterative development with per-feature staging deployments and sign-off gates',
        marketing: 'Collaborative build process with full client visibility at every milestone'
      },
      'Review major milestones': {
        technical: 'Sprint-based delivery with demo checkpoints at phase boundaries',
        marketing: 'Streamlined approval workflow — you review key deliverables, we handle the details'
      },
      'Minimal involvement': {
        technical: 'Autonomous delivery with async status updates and final UAT review',
        marketing: 'Done-for-you execution — hands-off until the finished product is ready for sign-off'
      }
    };

    const invMap = involvementMap[data.involvement] || {
      technical: 'Collaboration model to be defined during kickoff',
      marketing: 'Flexible engagement model tailored to your availability'
    };

    sections.push({
      title: 'Involvement Level',
      clientSaid: data.involvement,
      technical: invMap.technical,
      marketing: invMap.marketing
    });

    return sections;
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
    const sections = generateTranslation(data);
    el.innerHTML = `
      <div class="translation-intro">
        <p><strong>What they said vs. what they actually need.</strong> Use this to scope the project, write proposals, and brief your team.</p>
      </div>
      ${sections.map(s => `
        <div class="translation-block">
          <h4>${escapeHtml(s.title)}</h4>
          <div class="translation-row">
            <div class="translation-col client-col">
              <span class="translation-tag">Client Said</span>
              <p>${escapeHtml(s.clientSaid)}</p>
            </div>
            <div class="translation-col tech-col">
              <span class="translation-tag">Technical Translation</span>
              <p>${escapeHtml(s.technical).replace(/\n/g, '<br>')}</p>
            </div>
            <div class="translation-col mkt-col">
              <span class="translation-tag">Marketing Translation</span>
              <p>${escapeHtml(s.marketing).replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        </div>
      `).join('')}
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

    const translationSections = generateTranslation(data);
    const translationText = translationSections.map(s =>
      s.title + '\n  Client Said: ' + s.clientSaid + '\n  Technical: ' + s.technical + '\n  Marketing: ' + s.marketing
    ).join('\n\n');

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
