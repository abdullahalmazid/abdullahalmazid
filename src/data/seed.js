/**
 * SEED CONTENT
 * src/data/seed.js
 *
 * Everything the site needs to render with no database at all. It is the
 * bottom layer of the fallback chain (see src/lib/store.js), the content that
 * search engines see on first load, and what "Publish to Firestore" writes on
 * first setup.
 *
 * Source: Abdullah's v6 static portfolio and CV (2026). Item ids are readable
 * slugs because they become public URLs: /projects/autoprompt-sam.
 *
 * Entries marked `review` show an amber "Review" badge to signed-in editors
 * only: placeholder text worth replacing with your own words.
 */

const SITE_URL = (process.env.SITE_URL || 'https://abdullahalmazid.vercel.app').replace(/\/$/, '');
// Your current photos from my-portfolio-app2 (Cloudinary); /img/profile.jpg is the offline fallback.
const PHOTO = 'https://res.cloudinary.com/dlpnufrtn/image/upload/v1777745455/qm4apikxpkugyllcvjb7.jpg';
const ABOUT_PHOTO = 'https://res.cloudinary.com/dlpnufrtn/image/upload/v1777745091/gf49epzy87x23nucqku9.jpg';
const doiLink = (doi) => (doi ? `https://doi.org/${doi}` : '');

/* ------------------------------------------------------------------ */
/* Site configuration                                                  */
/* ------------------------------------------------------------------ */

const config = {
  site: {
    title: 'Abdullah Al Mazid',
    tagline: 'Industrial & Production Engineer',
    description:
      'Abdullah Al Mazid — Industrial & Production Engineering graduate from BUET working across operations research, quality engineering, machine learning, computer vision and IoT for manufacturing.',
    language: 'en',
    url: SITE_URL,
    keywords: ['Industrial Engineering', 'Operations Research', 'Quality Engineering', 'Machine Learning', 'Computer Vision', 'IoT', 'BUET', 'Bangladesh'],
  },
  brand: { name: 'Abdullah Al Mazid', mark: 'AM', showMark: true },
  person: {
    name: 'Abdullah Al Mazid',
    honorific: '',
    position: 'Industrial & Production Engineer',
    affiliation: 'B.Sc. IPE, BUET (Class of 2026)',
    photo: PHOTO,
    // Bolded inside author lists
    citeAs: 'Abdullah Al Mazid',
    location: 'Dhaka, Bangladesh',
    available: 'Open to opportunities',
  },
  contact: {
    email: 'abdullahalmazid.bd@gmail.com',
    phone: '+880 1521-754965',
    address: 'Dhaka, Bangladesh',
    office: '',
    hours: 'Usually replies within a day',
    mapUrl: 'https://www.google.com/maps?q=BUET,+Dhaka&output=embed',
  },
  socials: [
    { label: 'LinkedIn', url: 'https://linkedin.com/in/abdullahalmazid', icon: 'Linkedin' },
    { label: 'GitHub', url: 'https://github.com/abdullahalmazid', icon: 'Github' },
    { label: 'Email', url: 'mailto:abdullahalmazid.bd@gmail.com', icon: 'Mail' },
  ],
  theme: {
    preset: 'blueprint',
    darkPreset: 'blueprint-night',
    // Visitors can switch light/dark from the menu bar. 'system' follows the
    // device setting until they choose.
    visitorToggle: true,
    defaultMode: 'system', // system | light | dark
    custom: null,
    fonts: { heading: 'Space Grotesk', body: 'Inter' },
    radius: 14,
    baseSize: 16,
    container: 1200,
  },
  nav: {
    maxVisible: 8,
    sticky: true,
    align: 'right',
    theme: 'page',
    bgColor: '',
    textColor: '',
    opacity: 82,
    blur: 14,
    topTransparent: false,
    tabStyle: 'pills',
    showIcons: false,
    textSize: 'sm',
    height: 64,
    divider: 'scroll',
    markShape: 'rounded',
    search: true, // ⌘K button in the menu bar
  },
  footer: {
    line: 'Industrial & Production Engineering, BUET · Dhaka, Bangladesh',
    showSocials: true,
    note: 'Built with Next.js and Firebase. Press ⌘K / Ctrl K to search.',
  },
  drawer: { side: 'right', width: 62, itemClick: 'drawer' },
  effects: { cursor: false, cursorStyle: 'comet', scroll: 'rise' },
};

/* ------------------------------------------------------------------ */
/* Content types                                                       */
/* ------------------------------------------------------------------ */
/*
 * Field roles tell layouts what a field means, so one layout can show any
 * collection: title, subtitle, meta, date, group, badge, body, image, link,
 * tags, detail. `route` is the tab whose address prefixes an entry's own page
 * (/projects/<id>); `jsonLd` is the schema.org type used for search engines.
 */

const schema = {
  collections: {
    projects: {
      label: 'Projects',
      singular: 'Project',
      icon: 'Layers',
      route: 'projects',
      jsonLd: 'CreativeWork',
      defaultSort: { field: 'order', dir: 'asc' },
      fields: [
        { key: 'title', label: 'Title', type: 'text', role: 'title' },
        { key: 'summary', label: 'One-line summary', type: 'textarea', role: 'subtitle' },
        {
          key: 'category',
          label: 'Category',
          type: 'select',
          role: 'group',
          options: ['Machine learning', 'Automation & IoT', 'Optimization', 'Product design', 'CAD', 'Web'],
        },
        { key: 'period', label: 'When', type: 'text', role: 'date' },
        { key: 'context', label: 'Context (course, team, lab)', type: 'text', role: 'meta' },
        { key: 'myRole', label: 'My role', type: 'text', role: 'detail' },
        { key: 'metric', label: 'Headline result (badge)', type: 'text', role: 'badge' },
        { key: 'stack', label: 'Tools and stack', type: 'tags', role: 'tags' },
        { key: 'cover', label: 'Cover image', type: 'image', role: 'image' },
        { key: 'gallery', label: 'More images', type: 'gallery', role: 'image' },
        { key: 'body', label: 'Case study', type: 'markdown', role: 'body' },
        { key: 'github', label: 'Code', type: 'url', role: 'link' },
        { key: 'demo', label: 'Live demo', type: 'url', role: 'link' },
        { key: 'video', label: 'Video', type: 'url', role: 'link' },
        { key: 'paper', label: 'Paper / report', type: 'url', role: 'link' },
      ],
    },
    publications: {
      label: 'Publications',
      singular: 'Publication',
      icon: 'BookOpen',
      route: 'publications',
      jsonLd: 'ScholarlyArticle',
      citation: true,
      defaultSort: { field: 'year', dir: 'desc' },
      fields: [
        { key: 'title', label: 'Title', type: 'text', role: 'title' },
        { key: 'authors', label: 'Authors', type: 'text', role: 'meta' },
        { key: 'venue', label: 'Journal / conference', type: 'text', role: 'subtitle' },
        { key: 'details', label: 'Volume, pages, place', type: 'text', role: 'meta' },
        { key: 'year', label: 'Year', type: 'number', role: 'date' },
        { key: 'type', label: 'Type', type: 'select', role: 'group', options: ['Journal', 'Conference', 'Preprint', 'Thesis', 'Book chapter'] },
        { key: 'note', label: 'Badge (e.g. IEEE)', type: 'text', role: 'badge' },
        { key: 'doi', label: 'DOI', type: 'text', role: 'detail' },
        { key: 'link', label: 'Link', type: 'url', role: 'link' },
        { key: 'pdf', label: 'PDF', type: 'url', role: 'link' },
        { key: 'abstract', label: 'Abstract', type: 'markdown', role: 'body' },
        { key: 'tags', label: 'Keywords', type: 'tags', role: 'tags' },
        { key: 'image', label: 'Figure', type: 'image', role: 'image' },
      ],
    },
    posts: {
      label: 'Blog posts',
      singular: 'Post',
      icon: 'PenLine',
      route: 'blog',
      jsonLd: 'BlogPosting',
      article: true, // reading time, table of contents, RSS
      defaultSort: { field: 'date', dir: 'desc' },
      fields: [
        { key: 'title', label: 'Title', type: 'text', role: 'title' },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea', role: 'subtitle' },
        { key: 'date', label: 'Published', type: 'date', role: 'date' },
        { key: 'category', label: 'Category', type: 'select', role: 'group', options: ['Notes', 'Engineering', 'Research', 'Career'] },
        { key: 'cover', label: 'Cover image', type: 'image', role: 'image' },
        { key: 'body', label: 'Post', type: 'markdown', role: 'body' },
        { key: 'tags', label: 'Tags', type: 'tags', role: 'tags' },
      ],
    },
    skills: {
      label: 'Skills',
      singular: 'Skill',
      icon: 'Cpu',
      route: 'about',
      defaultSort: { field: 'order', dir: 'asc' },
      fields: [
        { key: 'name', label: 'Skill', type: 'text', role: 'title' },
        {
          key: 'category',
          label: 'Area',
          type: 'select',
          role: 'group',
          options: ['Optimization & OR', 'Quality & manufacturing', 'Engineering software', 'Programming & data', 'Machine learning & IoT'],
        },
        { key: 'level', label: 'Depth', type: 'number', role: 'detail', help: '1 familiar, 2 applied in a project, 3 core' },
        { key: 'usedIn', label: 'Used in', type: 'text', role: 'subtitle' },
        { key: 'description', label: 'How I have used it', type: 'markdown', role: 'body' },
      ],
    },
    experience: {
      label: 'Experience',
      singular: 'Position',
      icon: 'Briefcase',
      route: 'experience',
      defaultSort: { field: 'order', dir: 'asc' },
      fields: [
        { key: 'role', label: 'Position', type: 'text', role: 'title' },
        { key: 'org', label: 'Organisation', type: 'text', role: 'subtitle' },
        { key: 'period', label: 'Period', type: 'text', role: 'date' },
        { key: 'location', label: 'Location', type: 'text', role: 'meta' },
        { key: 'type', label: 'Type', type: 'select', role: 'group', options: ['Industry', 'Research', 'Teaching', 'Leadership', 'Volunteer'] },
        { key: 'description', label: 'Description', type: 'markdown', role: 'body' },
        { key: 'logo', label: 'Logo', type: 'image', role: 'image' },
        { key: 'skills', label: 'Skills used', type: 'tags', role: 'tags' },
      ],
    },
    education: {
      label: 'Education',
      singular: 'Degree',
      icon: 'GraduationCap',
      route: 'experience',
      defaultSort: { field: 'order', dir: 'asc' },
      fields: [
        { key: 'degree', label: 'Degree', type: 'text', role: 'title' },
        { key: 'institution', label: 'Institution', type: 'text', role: 'subtitle' },
        { key: 'period', label: 'Period', type: 'text', role: 'date' },
        { key: 'grade', label: 'Result', type: 'text', role: 'badge' },
        { key: 'location', label: 'Location', type: 'text', role: 'meta' },
        { key: 'note', label: 'Details', type: 'markdown', role: 'body' },
        { key: 'logo', label: 'Logo', type: 'image', role: 'image' },
      ],
    },
    courses: {
      label: 'Coursework',
      singular: 'Course',
      icon: 'School',
      route: 'about',
      defaultSort: { field: 'order', dir: 'asc' },
      fields: [
        { key: 'title', label: 'Course', type: 'text', role: 'title' },
        { key: 'code', label: 'Code', type: 'text', role: 'badge' },
        { key: 'area', label: 'Area', type: 'select', role: 'group', options: ['Operations', 'Quality', 'Manufacturing', 'Design', 'Analytics'] },
        { key: 'summary', label: 'What it covered', type: 'markdown', role: 'body' },
      ],
    },
    awards: {
      label: 'Achievements',
      singular: 'Achievement',
      icon: 'Award',
      route: 'about',
      defaultSort: { field: 'order', dir: 'asc' },
      fields: [
        { key: 'title', label: 'Title', type: 'text', role: 'title' },
        { key: 'org', label: 'Awarded by', type: 'text', role: 'subtitle' },
        { key: 'year', label: 'Year', type: 'text', role: 'date' },
        { key: 'category', label: 'Category', type: 'select', role: 'group', options: ['Scholarship', 'Research', 'Competition', 'Certification'] },
        { key: 'description', label: 'Description', type: 'markdown', role: 'body' },
        { key: 'image', label: 'Certificate', type: 'image', role: 'image' },
        { key: 'link', label: 'Link', type: 'url', role: 'link' },
      ],
    },
    references: {
      label: 'References',
      singular: 'Referee',
      icon: 'Users',
      // No route: referees are not listed in the sitemap.
      defaultSort: { field: 'order', dir: 'asc' },
      fields: [
        { key: 'name', label: 'Name', type: 'text', role: 'title' },
        { key: 'position', label: 'Position', type: 'text', role: 'subtitle' },
        { key: 'relation', label: 'Relationship', type: 'text', role: 'meta' },
        { key: 'email', label: 'Email', type: 'text', role: 'detail' },
        { key: 'photo', label: 'Photo', type: 'image', role: 'image' },
      ],
    },
    gallery: {
      label: 'Gallery',
      singular: 'Photo',
      icon: 'Images',
      route: 'gallery',
      defaultSort: { field: 'order', dir: 'asc' },
      fields: [
        { key: 'image', label: 'Image', type: 'image', role: 'image' },
        { key: 'caption', label: 'Caption', type: 'text', role: 'title' },
        { key: 'year', label: 'Year', type: 'text', role: 'date' },
        { key: 'description', label: 'Description', type: 'markdown', role: 'body' },
        { key: 'link', label: 'Link', type: 'url', role: 'link' },
      ],
    },
  },
};

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */

const items = [];
/** Entries with readable ids, ordered as listed. */
const add = (collection, list) =>
  list.forEach(({ id, ...data }, i) => items.push({ id, collection, order: (i + 1) * 10, hidden: false, ...data }));

add('projects', [
  {
    id: 'autoprompt-sam',
    title: 'AutoPrompt-SAM: automatic CFRP defect segmentation',
    summary: 'A fully automatic defect-segmentation pipeline for CFRP thermography: YOLOv11 prompts a LoRA-adapted Segment Anything Model, so no human has to click.',
    category: 'Machine learning',
    period: '2025 – 2026',
    context: 'Undergraduate thesis, BUET IPE · Supervisor: Dr. Abdullahil Azeem',
    myRole: 'Sole author: pipeline design, training, evaluation',
    metric: 'IoU / Dice 1.00',
    stack: ['Python', 'PyTorch', 'YOLOv11', 'SAM', 'LoRA', 'NumPy'],
    body: `## The problem
Manual prompting is the main practical barrier to using the Segment Anything Model (SAM) inside an inspection line: someone has to click on every defect. For carbon-fibre-reinforced polymer (CFRP) parts inspected by thermography, that makes SAM unusable at production speed.

## Approach
- **Preprocessing.** TSR + first and second derivative (D1, D2) images computed from the raw thermography sequences make sub-surface defects stand out before detection.
- **Automatic prompts.** A YOLOv11 detector finds candidate defects and turns them into the box prompts SAM needs, removing the human from the loop.
- **Efficient adaptation.** SAM's encoder-decoder is adapted with LoRA, training only about **4.33%** of the parameters instead of fine-tuning the whole model.
- **What I dropped.** An earlier ConvLoRA variant was evaluated and removed from the final pipeline.

## Results
The final pipeline reached **IoU and Dice of 1.0000** on held-out test data, with corrected YOLO recall figures reported in the thesis.

## What I learned
Most of the gain came from the unglamorous parts: the preprocessing, and making the detector's recall honest. A strong segmentation model is only as good as the prompts it receives.`,
  },
  {
    id: 'iot-smart-conveyor',
    title: 'IoT smart conveyor for quality, inventory and process control',
    summary: 'A weight-triggered conveyor with servo item placement, ultrasonic counting and ESP32 telemetry for real-time remote monitoring.',
    category: 'Automation & IoT',
    period: '2025',
    context: 'IPE 419 Computer Integrated Manufacturing · Group B8 · Supervisor: Dr. Nafis Ahmad',
    myRole: 'Team member: hardware integration and monitoring',
    stack: ['ESP32', 'HX711 load cell', 'HC-SR04', 'SG-90 servo', 'L298N', 'Arduino C++'],
    cover: '/img/projects/iot-smart-conveyor/prototype.jpg',
    gallery: ['/img/projects/iot-smart-conveyor/load-sensor-data.jpg', '/img/projects/iot-smart-conveyor/ultrasonic-sensor-data.jpg'],
    video: 'https://youtu.be/_iA_Y-_De4U',
    demo: 'https://ipe20-buet.top/groups/all_groups/b_8.html',
    body: `## How it works
A 5 kg load cell with an HX711 amplifier detects when an item's weight passes a preset threshold (for example 200 g) and starts the conveyor, driven by an L298N motor driver and a 6 V 600 RPM DC gear motor. An SG-90 servo arm places items on the belt, an HC-SR04 ultrasonic sensor counts each passing item with LED feedback, and an ESP32 streams weight, count and status for remote monitoring.

## Key features
- Weight-triggered start and stop logic
- Automated item placement with a servo-driven arm
- Item counting with visual feedback
- ESP32 IoT link for real-time logging and remote monitoring

## Team
Md. Ahabab Ul Haq, Chowdhury Mouinur Rahman, Most. Noshin Ibnat, Md. Muqtadir Fuad and Abdullah Al Mazid.`,
  },
  {
    id: 'shoe-cleaning-machine',
    title: 'Semi-automated shoe cleaning machine',
    summary: 'A full product-design study, from market survey and QFD to Ansys structural validation and break-even analysis.',
    category: 'Product design',
    period: '2024',
    context: 'IPE 318 Product Design-II · Group B14',
    myRole: 'Team member: design analysis and Ansys validation',
    metric: 'QFD → FEA → cost',
    stack: ['SolidWorks', 'ANSYS Mechanical', 'QFD', 'Weighted material selection'],
    cover: '/img/projects/shoe-cleaning-machine/final-design.jpg',
    gallery: ['/img/projects/shoe-cleaning-machine/ansys-analysis.jpg'],
    body: `## Overview
A semi-automated shoe cleaning and polishing machine designed for the Bangladeshi market, combining traditional cleaning methods with simple mechanisms.

## Process
1. Concept generation and proposal selection
2. Customer needs survey
3. Quality Function Deployment (House of Quality)
4. Functional decomposition
5. Material, manufacturing and joining process selection, screened qualitatively and then by weighted average
6. Ansys validation of the base, frame, shaft and worm-gear connector: von Mises stress, deformation, fatigue life and safety factor
7. Cost, break-even and sensitivity analysis

## Team
Md. Muqtadir Fuad, Abdullah Al Mazid, Md. Ashiqur Rahman Noor, Md Sadiqul Haque, Ananya Halder and Yashna Noor; supervised by Dr. Kais Bin Zaman, Zahin Ar Rafi and Abu Taher.`,
  },
  {
    id: 'cafeteria-production-planning',
    title: 'Cafeteria production planning with linear programming',
    summary: 'An LP model that sets production quantities and prices under demand, resource and operational constraints, solved in Gurobi and Excel Solver.',
    category: 'Optimization',
    period: '2024',
    context: 'Operations Research, BUET',
    stack: ['Linear programming', 'Gurobi', 'Excel Solver'],
    body: `## Problem
Decide what a university cafeteria should produce, how much, and at what price, to make the best use of limited resources while meeting demand.

## Approach
- Formulated a linear programming model with demand, resource and operational constraints
- Solved it in **Gurobi** and cross-checked the solution in **Excel Solver**`,
  },
  {
    id: 'iot-monitoring-dashboard',
    title: 'IoT data monitoring dashboard',
    summary: 'A full-stack web dashboard that collects ESP sensor data and shows live readings, trends and system performance.',
    category: 'Web',
    period: '2025',
    context: 'Team project',
    stack: ['ESP32', 'JavaScript', 'REST API', 'Charts'],
    github: 'https://github.com/md-muqtadir-fuad/iot-web-app',
    body: `Sensors on ESP modules send readings to a backend for storage and processing. The web interface shows live data, trends and performance, with dynamic fetching and organised visualisation.

**Skills applied:** frontend and backend development, real-time data fetching and visualisation, connecting hardware to the web.`,
  },
  {
    id: 'shantui-bulldozer',
    title: 'Shantui compact bulldozer, 3D CAD model',
    summary: 'A detailed SolidWorks assembly of a compact bulldozer: blade mechanism, track system, chassis and operator cabin.',
    category: 'CAD',
    period: '2023',
    context: 'SolidWorks training',
    stack: ['SolidWorks', 'Assembly design'],
    body: 'Modelled the blade mechanism, track system, chassis and operator cabin, then assembled them into a complete machine with attention to dimensional accuracy, mechanical alignment and structural realism.',
  },
  {
    id: 'floor-plan-design',
    title: 'Residential floor plan design',
    summary: 'A construction-ready 2D floor plan for a three-bedroom home, drafted in AutoCAD.',
    category: 'CAD',
    period: '2023',
    context: 'Architectural drafting',
    stack: ['AutoCAD'],
    body: 'Dimensioned bedrooms, drawing and dining areas, kitchen, washrooms and verandas with attention to circulation, structural alignment and local building practice.',
  },
]);

add('publications', [
  {
    id: 'egov-lens',
    type: 'Conference',
    title: 'eGov-Lens: A Multi-Dimensional Machine Learning Approach to Aspect-Based Public Feedback Analysis on Bengali e-Government Platforms',
    authors: 'Md. Muqtadir Fuad, Abdullah Al Mazid, Md. Istiak Adnan, Tirthojit Das, Shatabdi Sen Prapti, Nafisa Mahbub',
    venue: '28th International Conference on Computer and Information Technology (ICCIT 2025)',
    details: 'IEEE',
    year: 2025,
    note: 'IEEE',
    doi: '10.1109/ICCIT68739.2025.11491291',
    link: doiLink('10.1109/ICCIT68739.2025.11491291'),
    tags: ['NLP', 'BanglaBERT', 'Aspect-based sentiment', 'TOPSIS', 'e-Government'],
    abstract:
      'Citizens increasingly voice feedback about online government services on social media, but sentiment tools miss the service-level detail policymakers need. eGov-Lens is an aspect-based pipeline built on more than **34,000 annotated Bengali comments** across twelve services, each labelled for overall sentiment, ease of finding the service, responsiveness and accuracy. Bag-of-words, BanglaBERT and mBERT representations were benchmarked with logistic regression, SVC and naïve Bayes. BanglaBERT with an SVC head reached about **93%** on the policy-critical accuracy aspect, BanglaBERT with logistic regression gave the best balance of accuracy and speed, and an entropy-weighted TOPSIS ranking of quality against compute cost favoured the lightweight baseline for resource-constrained government infrastructure.',
  },
  {
    id: 'stochastic-manufacturing',
    type: 'Conference',
    title: 'Stochastic Modeling of Throughput-Quality Dynamics in Labor-Intensive Manufacturing: A Comparative Analysis of Operator Fatigue and Process Instability',
    authors: 'Md. Muqtadir Fuad, Abdullah Al Mazid, Md. Istiak Adnan, Khalid Ammar',
    venue: '8th IEOM Bangladesh International Conference on Industrial Engineering and Operations Management',
    details: 'Dhaka, Dec 20–21',
    year: 2025,
    note: 'IEOM',
    doi: '10.46254/BA08.20250379',
    link: doiLink('10.46254/BA08.20250379'),
    tags: ['Operator fatigue', 'SPC', 'Monte Carlo', 'Time-and-motion'],
    abstract:
      'Manual assembly lines in semi-automated food production struggle with standardisation because human performance varies. This study combines time-and-motion analysis with statistical process control across two manual lines, models how operator fatigue develops with regression, links it to process instability through capability analysis, and uses a Monte Carlo simulation to estimate the resulting loss: about **1.7 million BDT per year** across the two product lines.',
  },
  {
    id: 'pla-fea-validation',
    type: 'Conference',
    title: 'Validation of Temperature Effect on 3D Printed PLA Materials with Finite Element Analysis and Nonlinear Hyperelastic Modeling',
    authors: 'Md Zisanul Haque Bhuiyan, Asif Hasan, Abdullah Al Mazid, Ehasanul Islam Rafi, Shadman Shihab',
    venue: '7th IEOM Bangladesh Conference on Industrial Engineering and Operations Management',
    details: 'Dec 21–22',
    year: 2024,
    note: 'IEOM',
    doi: '10.46254/BA07.20240046',
    link: doiLink('10.46254/BA07.20240046'),
    tags: ['FEA', 'Hyperelastic models', 'Additive manufacturing', 'ANSYS'],
    abstract:
      'Numerically validates the mechanical behaviour of 3D-printed PLA at 20 °C, 30 °C and 40 °C. ASTM D638 dog-bone specimens at 100% infill were simulated in Ansys Mechanical with Neo-Hookean, two-parameter Mooney-Rivlin and third-order Yeoh models. All fit the experimental stress-strain and strain-energy data well; Yeoh matched most closely at higher temperatures. The study also derives an equation for the Neo-Hookean parameter as a function of temperature.',
  },
]);

add('posts', [
  {
    id: 'why-i-rebuilt-this-portfolio',
    title: 'Why I rebuilt this portfolio as an editable system',
    excerpt: 'Seven static versions taught me that a portfolio is a living document. This one is a small content system I can edit from any browser.',
    date: '2026-10-30',
    category: 'Engineering',
    tags: ['Next.js', 'Firebase', 'Systems thinking'],
    review: 'Starter post: rewrite it in your own words or delete it.',
    body: `I have built this site more times than I would like to admit: a plain HTML version, a neumorphic one, a Firebase one with a page per collection. Every rebuild started the same way. I wanted to add one project, and adding it meant editing code.

## The engineering problem
An industrial engineer would call that a process with too much changeover time. The fix is the same as on a production line: standardise the parts that repeat and make the variable part cheap to change.

## What changed
- **Content is data.** Projects, publications, skills and posts are entries in one store. Any list can show any of them, in any layout.
- **Pages are configurable.** Tabs and sections are edited in the browser. Adding a "Talks" list is a form, not a deploy.
- **It degrades gracefully.** The site renders from bundled content first, then a cached copy, then the live database. If Firebase is down, visitors do not notice.
- **Every entry has its own address.** Each project and paper has a shareable page with proper link previews and structured data for search engines.

## What I would measure next
Lead time from "I finished a project" to "it is on my site". Before: an evening. Now: five minutes.`,
  },
]);



const skill = (category, name, level, usedIn, description) => ({ id: `skill-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`, category, name, level, usedIn, description });
add('skills', [
  skill('Optimization & OR', 'Operations research', 3, 'Cafeteria production planning', 'Formulated and solved a production-planning problem: quantity and pricing under demand, resource and operational constraints.'),
  skill('Optimization & OR', 'Linear programming', 3, 'Cafeteria production planning', 'Built and solved an LP model with multiple real-world constraints.'),
  skill('Optimization & OR', 'Gurobi', 2, 'Cafeteria production planning', 'Solved and cross-checked the LP model.'),
  skill('Optimization & OR', 'Excel Solver', 2, 'Cafeteria production planning', 'A second, more accessible solver to validate the LP model.'),
  skill('Optimization & OR', 'Production planning', 2, 'Coursework, cafeteria project', 'What to produce, how much and when, under resource and demand constraints.'),
  skill('Optimization & OR', 'Inventory control', 1, 'Coursework', 'Operations Research and Supply Chain Management coursework at BUET.'),
  skill('Quality & manufacturing', 'Statistical quality control', 2, 'PRAN-RFL, IEOM 2025 paper', 'Studied SQC across beverage, dairy, biscuit and confectionery lines; applied capability analysis in the operator-fatigue study.'),
  skill('Quality & manufacturing', 'Time-and-motion analysis', 2, 'PRAN-RFL, IEOM 2025 paper', 'High-resolution time studies on live manual lines.'),
  skill('Quality & manufacturing', 'Monte Carlo simulation', 2, 'IEOM 2025 paper', 'Estimated the annual cost of process instability.'),
  skill('Quality & manufacturing', 'Manufacturing systems', 1, 'Coursework', 'Manufacturing Processes I & II and Computer Integrated Manufacturing.'),
  skill('Quality & manufacturing', 'Process improvement', 1, 'Coursework, PRAN-RFL', 'Studied in coursework and observed at scale during the industrial attachment.'),
  skill('Engineering software', 'SolidWorks', 2, 'Shoe cleaning machine, bulldozer model', 'Mechanical design and multi-part assemblies.'),
  skill('Engineering software', 'ANSYS Mechanical', 2, 'Shoe cleaning machine, PLA paper', 'Stress, deformation and fatigue analysis; hyperelastic material models.'),
  skill('Engineering software', 'AutoCAD', 1, 'Floor plan design', '2D drafting with precise dimensioning.'),
  skill('Engineering software', 'CATIA', 1, 'Coursework', 'Engineering design coursework.'),
  skill('Engineering software', 'Arena simulation', 1, 'Coursework', 'Discrete-event simulation of production systems.'),
  skill('Engineering software', 'MATLAB', 1, 'Coursework', 'Numerical and engineering coursework.'),
  skill('Programming & data', 'Python', 3, 'AutoPrompt-SAM, eGov-Lens', 'Built the thesis pipeline and most of my analysis work.'),
  skill('Programming & data', 'PyTorch', 3, 'AutoPrompt-SAM', 'Implemented and LoRA-fine-tuned SAM.'),
  skill('Programming & data', 'NumPy', 3, 'AutoPrompt-SAM', 'Numerical handling of thermography sequences.'),
  skill('Programming & data', 'pandas', 3, 'Thesis and projects', 'Data wrangling and analysis.'),
  skill('Programming & data', 'scikit-learn', 2, 'eGov-Lens', 'Logistic regression, SVC and naïve Bayes baselines.'),
  skill('Programming & data', 'Excel', 2, 'Cafeteria project', 'Modelling and analysis.'),
  skill('Programming & data', 'JavaScript / React', 2, 'This site, IoT dashboard', 'Built this portfolio and a live IoT dashboard.'),
  skill('Programming & data', 'Power BI', 1, 'Coursework', 'Dashboards and data visualisation.'),
  skill('Programming & data', 'SQL', 1, 'Coursework', 'Querying structured data.'),
  skill('Machine learning & IoT', 'Computer vision', 3, 'AutoPrompt-SAM', 'Automatic defect segmentation for CFRP thermography.'),
  skill('Machine learning & IoT', 'YOLOv11', 3, 'AutoPrompt-SAM', 'Automatic prompt generator for SAM.'),
  skill('Machine learning & IoT', 'Segment Anything (SAM) + LoRA', 3, 'AutoPrompt-SAM', 'Adapted with ~4.33% trainable parameters; IoU/Dice 1.00 on held-out data.'),
  skill('Machine learning & IoT', 'NLP (BanglaBERT, mBERT)', 2, 'eGov-Lens', 'Aspect-based analysis of Bengali public feedback.'),
  skill('Machine learning & IoT', 'ESP32 / Arduino', 2, 'Smart conveyor, IoT dashboard', 'Sensor integration and telemetry.'),
  skill('Machine learning & IoT', 'Real-time dashboards', 2, 'IoT dashboard', 'Live monitoring of sensor data.'),
]);

add('experience', [
  {
    id: 'pran-rfl',
    role: 'Industrial attachment',
    org: 'PRAN-RFL Group',
    period: 'Nov – Dec 2025',
    location: 'Dhaka, Bangladesh',
    type: 'Industry',
    skills: ['Time-and-motion', 'Production scheduling', 'SQC', 'Inventory'],
    description: `A month-long attachment across beverage, dairy, biscuit and confectionery lines.
- Observed end-to-end production and supply chain operations at FMCG scale
- Studied time-and-motion analysis, production scheduling and statistical quality control in a live plant
- Assessed automation, operational control and inventory management practices`,
  },
  {
    id: 'thesis-research',
    role: 'Undergraduate thesis researcher',
    org: 'Department of IPE, BUET',
    period: '2025 – 2026',
    location: 'Dhaka, Bangladesh',
    type: 'Research',
    skills: ['Computer vision', 'PyTorch', 'LoRA'],
    description: 'Designed AutoPrompt-SAM, an automatic CFRP defect-segmentation pipeline, under Dr. Abdullahil Azeem. See the project page for the full write-up.',
  },
]);

add('education', [
  {
    id: 'buet-ipe',
    degree: 'B.Sc. in Industrial & Production Engineering',
    institution: 'Bangladesh University of Engineering & Technology (BUET)',
    period: '2022 – 2026',
    grade: 'CGPA 3.67 / 4.00',
    location: 'Dhaka',
    note: 'Coursework and projects in operations research, quality systems, manufacturing systems, statistics, machine learning and computer vision. Thesis: AutoPrompt-SAM. Two-time Dean’s List scholarship recipient.',
  },
  {
    id: 'hsc-chattogram',
    degree: 'Higher Secondary Certificate (HSC), Science',
    institution: 'Chattogram Collegiate School and College',
    period: '2018 – 2020',
    grade: 'GPA 5.00 / 5.00',
    location: 'Chattogram',
  },
]);

const course = (id, title, area, summary) => ({ id: `course-${id}`, title, area, summary, review: 'Generic description: add what you actually did in this course.' });
add('courses', [
  course('qcm', 'Quality Control Management', 'Quality', 'Control charts, acceptance sampling, process capability and quality management systems.'),
  course('scm', 'Supply Chain Management', 'Operations', 'Procurement, logistics, demand forecasting and inventory strategy.'),
  course('or', 'Operations Research', 'Operations', 'Linear and integer programming, network models and decision analysis.'),
  course('om', 'Operations Management', 'Operations', 'Process design, capacity planning, scheduling and performance management.'),
  course('pm', 'Project Management', 'Operations', 'Scope, critical path scheduling, resource allocation and risk.'),
  course('stats', 'Probability & Statistics', 'Analytics', 'Distributions, hypothesis testing and regression for engineering data.'),
  course('mp', 'Manufacturing Processes I & II', 'Manufacturing', 'Machining, forming, casting, joining and additive manufacturing.'),
  course('ergo', 'Ergonomics & Safety Management', 'Design', 'Anthropometry, workplace risk assessment and safety systems.'),
  course('cim', 'Computer Integrated Manufacturing', 'Manufacturing', 'CAD/CAM, automation and information flow across the enterprise.'),
  course('im', 'Intelligent Manufacturing', 'Manufacturing', 'IoT monitoring, predictive maintenance and data-driven process control.'),
  course('econ', 'Engineering Economics', 'Analytics', 'Time value of money, cost-benefit, break-even and replacement decisions.'),
  course('pd', 'Product Design I & II', 'Design', 'From requirements and concepts to design for manufacturability.'),
]);

add('awards', [
  { id: 'deans-scholarship', title: 'Dean’s List scholarship (two-time)', org: 'BUET', year: '2023 – 2025', category: 'Scholarship', description: 'Merit-based award for academic excellence, received twice.' },
  { id: 'three-papers', title: 'Three peer-reviewed papers as an undergraduate', org: 'IEEE ICCIT and IEOM', year: '2024 – 2025', category: 'Research', description: 'Conference papers on NLP for e-government, operator fatigue in manufacturing, and FEA of 3D-printed PLA.' },
]);

add('references', [
  { id: 'ref-azeem', name: 'Dr. Abdullahil Azeem', position: 'Professor, Department of IPE, BUET', relation: 'Thesis supervisor', email: 'azeem@ipe.buet.ac.bd' },
  { id: 'ref-mithun', name: 'Dr. Syed Mithun Ali', position: 'Professor, Department of IPE, BUET', relation: 'Course instructor', email: 'mithun@ipe.buet.ac.bd' },
]);

add('gallery', [
  { id: 'gal-conveyor', caption: 'Smart conveyor prototype', year: '2025', image: '/img/projects/iot-smart-conveyor/prototype.jpg' },
  { id: 'gal-shoe', caption: 'Shoe cleaning machine, final design', year: '2024', image: '/img/projects/shoe-cleaning-machine/final-design.jpg' },
  { id: 'gal-ansys', caption: 'Ansys stress analysis', year: '2024', image: '/img/projects/shoe-cleaning-machine/ansys-analysis.jpg' },
  { id: 'gal-load', caption: 'Load cell readings', year: '2025', image: '/img/projects/iot-smart-conveyor/load-sensor-data.jpg' },
  { id: 'gal-ultra', caption: 'Ultrasonic counter readings', year: '2025', image: '/img/projects/iot-smart-conveyor/ultrasonic-sensor-data.jpg' },
]);

/* ------------------------------------------------------------------ */
/* Pages (tabs) and their sections                                     */
/* ------------------------------------------------------------------ */

const BIO = `I like the moment where a messy, real-world process meets a clean, testable model. That has been the thread through my time in Industrial & Production Engineering at BUET: how do you make a system that depends on people, machines, or both behave predictably?

It took its most concrete shape in my thesis, **AutoPrompt-SAM**, where a YOLOv11 detector automatically prompts a LoRA-adapted Segment Anything Model to find defects in CFRP thermography, with no manual clicking. The same question pulled me toward operations research and quality engineering, and sent me to **PRAN-RFL Group** to watch FMCG lines behave on the factory floor rather than in a textbook.

Outside the big projects I keep picking up tools (CAD, IoT, web development) because the fastest way I know to understand a system is to build a small version of it. I am looking for a role in manufacturing, operations or data-driven industrial systems where the problems are real and the fix actually ships.`;

const pages = [
  {
    id: 'home',
    title: 'Home',
    navLabel: 'Home',
    order: 0,
    inNav: true,
    header: { show: false },
    seo: { title: 'Abdullah Al Mazid · Industrial & Production Engineer', description: config.site.description },
    sections: [
      {
        id: 'home-hero',
        kind: 'hero',
        props: {
          eyebrow: 'Dhaka, Bangladesh · Open to opportunities',
          name: 'Abdullah Al Mazid',
          roles: 'Industrial & Production Engineer\nComputer vision for manufacturing quality\nOperations research & optimization\nIoT and intelligent systems',
          typed: true,
          bio: 'BUET IPE graduate (CGPA 3.67) building **data-driven industrial systems**: defect detection, process stability, production planning and the sensors that feed them.',
          image: PHOTO,
          imageAlt: 'Portrait of Abdullah Al Mazid',
          imageShape: 'rounded',
          imageSide: 'right',
          imageWidth: 34,
          keywords: 'Operations research, Quality engineering, Computer vision, Machine learning, IoT, Supply chain analytics',
          showKeywords: false,
          decoration: 'grid',
          height: 82,
          buttons: [
            { label: 'See my work', action: 'page', target: 'projects', style: 'solid', icon: 'ArrowRight' },
            { label: 'My CV', action: 'page', target: 'cv', style: 'outline', icon: 'FileText' },
            { label: 'Get in touch', action: 'drawer', target: 'contact', style: 'link', icon: 'Mail' },
          ],
        },
      },
      {
        id: 'home-stats',
        kind: 'stats',
        heading: { show: false },
        props: {
          align: 'left',
          size: 'lg',
          items: [
            { label: 'CGPA at BUET IPE', value: '3.67', suffix: '/ 4.00' },
            { label: 'Peer-reviewed papers', source: 'publications' },
            { label: 'Engineering projects', source: 'projects' },
            { label: 'Core skills', source: 'skills', filterField: 'level', filterValue: '3' },
          ],
        },
        style: { tone: 'soft', paddingTop: 44, paddingBottom: 44 },
      },
      {
        id: 'home-projects',
        kind: 'collection',
        heading: { eyebrow: 'Selected work', title: 'Projects', subtitle: 'Case studies from thesis research, coursework and side projects.' },
        props: {
          collection: 'projects',
          selection: 'manual',
          ids: ['autoprompt-sam', 'iot-smart-conveyor', 'shoe-cleaning-machine'],
          mode: 'cards',
          columns: 3,
          showBody: false,
          imageAspect: '16/9',
          placeholder: 'avatar',
          hover: 'lift',
          cardStyle: 'outline',
          showLinks: false,
        },
        viewAll: { show: true, label: 'All projects', target: 'projects', mode: 'page' },
      },
      {
        id: 'home-publications',
        kind: 'collection',
        heading: { eyebrow: 'Research', title: 'Publications' },
        props: { collection: 'publications', mode: 'citation', limit: 3, sortField: 'year', sortDir: 'desc' },
        style: { tone: 'soft' },
        viewAll: { show: true, label: 'All publications', target: 'publications', mode: 'page' },
      },
      {
        id: 'home-skills',
        kind: 'collection',
        heading: { eyebrow: 'Toolkit', title: 'Core skills', subtitle: 'The tools at the centre of a thesis or flagship project. Select one to see where it was used.' },
        props: { collection: 'skills', mode: 'skills', selection: 'filter', filterField: 'level', filterValue: '3', groupBy: 'category' },
        viewAll: { show: true, label: 'Every skill', target: 'about', mode: 'drawer' },
      },
      {
        id: 'home-experience',
        kind: 'collection',
        heading: { eyebrow: 'Path', title: 'Experience and education' },
        props: { collection: 'experience', mode: 'timeline', showBody: true, bodyLines: 3 },
        style: { tone: 'soft' },
        viewAll: { show: true, label: 'Full timeline', target: 'experience', mode: 'page' },
      },
      {
        id: 'home-writing',
        kind: 'collection',
        heading: { eyebrow: 'Writing', title: 'Latest posts' },
        props: { collection: 'posts', mode: 'list', limit: 2, sortField: 'date', sortDir: 'desc', showImages: false, bodyLines: 0, showBody: false },
        viewAll: { show: true, label: 'All posts', target: 'blog', mode: 'page' },
      },
      {
        id: 'home-cta',
        kind: 'blocks',
        heading: { show: false },
        props: {
          blocks: [
            { id: 'cta-h', type: 'heading', props: { text: 'Have a process that should behave better?', level: 2, align: 'center' } },
            { id: 'cta-t', type: 'text', props: { markdown: 'I am open to roles and research collaborations in manufacturing, operations, supply chain, quality and process improvement.', align: 'center' } },
            {
              id: 'cta-b',
              type: 'buttons',
              props: {
                align: 'center',
                items: [
                  { label: 'Email me', action: 'email', target: 'abdullahalmazid.bd@gmail.com', style: 'solid', icon: 'Mail' },
                  { label: 'View CV', action: 'page', target: 'cv', style: 'outline', icon: 'FileText' },
                ],
              },
            },
          ],
        },
        style: { tone: 'contrast', paddingTop: 72, paddingBottom: 72, width: 'narrow', contentAlign: 'center' },
      },
    ],
  },
  {
    id: 'about',
    title: 'About',
    navLabel: 'About',
    order: 1,
    inNav: true,
    header: { show: true, title: 'About me', subtitle: 'Engineer by training, systems thinker by habit.' },
    sections: [
      {
        id: 'about-bio',
        kind: 'richtext',
        heading: { show: false },
        props: {
          body: BIO,
          image: ABOUT_PHOTO,
          imageAlt: 'Abdullah Al Mazid',
          imageSide: 'left',
          imageWidth: 32,
          imageShape: 'rounded',
          factsTitle: 'At a glance',
          facts: [
            { label: 'Based in', value: 'Dhaka, Bangladesh' },
            { label: 'Degree', value: 'B.Sc. IPE, BUET (2026)' },
            { label: 'CGPA', value: '3.67 / 4.00' },
            { label: 'Languages', value: 'Bengali (native), English (professional)' },
            { label: 'Email', value: '[abdullahalmazid.bd@gmail.com](mailto:abdullahalmazid.bd@gmail.com)' },
          ],
        },
      },
      {
        id: 'about-skills',
        kind: 'collection',
        heading: { title: 'Skills', subtitle: 'Depth is based on how each skill shows up in real work: ●○○ coursework, ●●○ used in a project, ●●● central to a thesis or flagship project.' },
        props: { collection: 'skills', mode: 'skills', groupBy: 'category', showSearch: true },
        style: { tone: 'soft' },
      },
      {
        id: 'about-courses',
        kind: 'collection',
        heading: { title: 'Relevant coursework' },
        props: { collection: 'courses', mode: 'cards', columns: 3, cardStyle: 'filled', showImages: false, bodyLines: 2, density: 'compact', chipsField: 'area' },
      },
      {
        id: 'about-awards',
        kind: 'collection',
        heading: { title: 'Achievements' },
        props: { collection: 'awards', mode: 'minimal' },
        style: { tone: 'soft' },
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    navLabel: 'Projects',
    order: 2,
    inNav: true,
    header: { show: true, title: 'Projects', subtitle: 'Machine learning, automation, optimization and design. Select a project for the full case study.' },
    seo: { description: 'Engineering projects by Abdullah Al Mazid: computer vision for defect detection, IoT automation, optimization and product design.' },
    sections: [
      {
        id: 'projects-all',
        kind: 'collection',
        heading: { show: false },
        props: { collection: 'projects', mode: 'cards', columns: 3, showBody: false, imageAspect: '16/9', placeholder: 'avatar', hover: 'lift', showSearch: true, chipsField: 'category', showLinks: true },
      },
    ],
  },
  {
    id: 'publications',
    title: 'Publications',
    navLabel: 'Publications',
    order: 3,
    inNav: true,
    header: { show: true, title: 'Publications', subtitle: 'Peer-reviewed papers. Select an entry for the abstract and a citation in BibTeX, APA or IEEE format.' },
    seo: { description: 'Peer-reviewed publications by Abdullah Al Mazid in IEEE ICCIT and IEOM conferences.' },
    sections: [
      {
        id: 'pubs-all',
        kind: 'collection',
        heading: { show: false },
        props: { collection: 'publications', mode: 'citation', sortField: 'year', sortDir: 'desc', groupBy: 'year', showSearch: true, exportBib: true },
      },
    ],
  },
  {
    id: 'experience',
    title: 'Experience',
    navLabel: 'Experience',
    order: 4,
    inNav: true,
    header: { show: true, title: 'Experience and education' },
    sections: [
      { id: 'exp-all', kind: 'collection', heading: { title: 'Experience' }, props: { collection: 'experience', mode: 'timeline' } },
      { id: 'exp-edu', kind: 'collection', heading: { title: 'Education' }, props: { collection: 'education', mode: 'timeline' }, style: { tone: 'soft' } },
    ],
  },
  {
    id: 'blog',
    title: 'Blog',
    navLabel: 'Blog',
    order: 5,
    inNav: true,
    header: { show: true, title: 'Writing', subtitle: 'Notes on engineering, research and building things.' },
    sections: [
      {
        id: 'blog-all',
        kind: 'collection',
        heading: { show: false },
        props: { collection: 'posts', mode: 'list', sortField: 'date', sortDir: 'desc', showSearch: true, chipsField: 'category', bodyLines: 0, showBody: false, rss: true },
      },
    ],
  },
  {
    id: 'gallery',
    title: 'Gallery',
    navLabel: 'Gallery',
    order: 6,
    inNav: false,
    header: { show: true, title: 'Gallery', subtitle: 'Prototypes, analyses and moments from the lab.' },
    sections: [{ id: 'gal-all', kind: 'collection', heading: { show: false }, props: { collection: 'gallery', mode: 'masonry', columns: 3 } }],
  },
  {
    id: 'cv',
    title: 'CV',
    navLabel: 'CV',
    order: 7,
    inNav: true,
    header: { show: false },
    seo: { title: 'CV · Abdullah Al Mazid', description: 'Résumé of Abdullah Al Mazid, generated from the site content.' },
    sections: [{ id: 'cv-main', kind: 'resume', heading: { show: false }, props: {} }],
  },
  {
    id: 'contact',
    title: 'Contact',
    navLabel: 'Contact',
    order: 8,
    inNav: true,
    header: { show: true, title: 'Let’s talk', subtitle: 'Open to entry-level roles and research collaborations in manufacturing, operations, supply chain, quality and process improvement.' },
    sections: [
      { id: 'contact-main', kind: 'contact', heading: { show: false }, props: { showMap: false } },
      {
        id: 'contact-refs',
        kind: 'collection',
        heading: { title: 'References' },
        props: { collection: 'references', mode: 'cards', columns: 2, showImages: false, cardStyle: 'filled', clickable: false, hiddenFields: [] },
        style: { tone: 'soft' },
      },
    ],
  },
];

const seed = { config, schema, pages, items };
export default seed;
