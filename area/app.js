// App state
let currentPlan = 'pro';
let currentCourse = null;
let currentLesson = null;

const planSelector = document.getElementById('plan-selector');
const planDescription = document.getElementById('plan-description');
const dashboardCourses = document.getElementById('dashboard-courses');
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-link');

// Helpers
function slugify(text) {
  return text.toLowerCase().replace(/[^\w]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function getPlanData(planId) {
  return PLATFORM_DATA.plans.find(p => p.id === planId);
}

function getAllowedCourses(planId) {
  const plan = getPlanData(planId);
  const allowed = [];
  plan.courses.forEach(courseRule => {
    const course = PLATFORM_DATA.courses.find(c => c.id === courseRule.course_id);
    if (!course) return;
    const filteredModules = course.modules.filter(m => {
      if (courseRule.allowed_modules.length === 0) return true;
      return courseRule.allowed_modules.includes(m.id);
    });
    if (filteredModules.length > 0) {
      allowed.push({
        ...course,
        modules: filteredModules
      });
    }
  });
  return allowed;
}

function getLessonCount(course) {
  return course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
}

function getCourseDescription(name) {
  const descriptions = {
    'Curso Marketplace (completo)': 'Venda em Shopee, Shein, TikTok Shop, Kwai e Temu com método passo a passo.',
    'Ponto de Coleta': 'Estratégia de logística reversa e retirada presencial para reduzir custos.',
    'Afiliado Express': 'Ganhe comissões vendendo produtos de outros sem estoque e sem CNPJ.'
  };
  return descriptions[name] || 'Conteúdo exclusivo do plano.';
}

// Dashboard
function renderDashboard() {
  const courses = getAllowedCourses(currentPlan);
  const plan = getPlanData(currentPlan);
  
  planDescription.textContent = `Conteúdo do plano ${plan.name} — ${plan.subtitle}`;
  dashboardCourses.innerHTML = '';
  
  courses.forEach(course => {
    const card = createCourseCard(course);
    dashboardCourses.appendChild(card);
  });
}

function createCourseCard(course) {
  const totalLessons = getLessonCount(course);
  const card = document.createElement('div');
  card.className = 'course-card';
  card.innerHTML = `
    <div class="course-thumbnail">
      <span class="course-thumbnail-text">${course.name.substring(0, 2).toUpperCase()}</span>
      <div class="play-overlay"><span>▶</span></div>
    </div>
    <div class="course-info">
      <h3>${course.name}</h3>
      <p>${getCourseDescription(course.name)}</p>
      <div class="course-meta">
        <span>${course.modules.length} módulos</span>
        <span>${totalLessons} aulas</span>
      </div>
    </div>
  `;
  card.addEventListener('click', () => openCourse(course.id));
  return card;
}

// Course View
function openCourse(courseId, moduleId = null, lessonIndex = null) {
  const allowedCourses = getAllowedCourses(currentPlan);
  currentCourse = allowedCourses.find(c => c.id === courseId);
  if (!currentCourse) return;
  
  switchView('course-view');
  document.getElementById('course-sidebar-title').textContent = currentCourse.name;
  
  const modulesList = document.getElementById('modules-list');
  modulesList.innerHTML = '';
  
  currentCourse.modules.forEach((module, mi) => {
    const moduleItem = document.createElement('div');
    moduleItem.className = 'module-item' + (mi === 0 ? ' expanded' : '');
    moduleItem.innerHTML = `
      <div class="module-header">
        <span>${module.name}</span>
        <span class="module-toggle">▼</span>
      </div>
      <div class="module-lessons"></div>
    `;
    
    const lessonsContainer = moduleItem.querySelector('.module-lessons');
    module.lessons.forEach((lesson, li) => {
      const lessonEl = document.createElement('div');
      lessonEl.className = 'lesson-item';
      lessonEl.innerHTML = `
        <span class="lesson-number">${li + 1}</span>
        <span class="lesson-title">${lesson.title}</span>
      `;
      lessonEl.addEventListener('click', () => loadLesson(module, lesson, lessonEl));
      lessonsContainer.appendChild(lessonEl);
    });
    
    moduleItem.querySelector('.module-header').addEventListener('click', () => {
      moduleItem.classList.toggle('expanded');
    });
    
    modulesList.appendChild(moduleItem);
  });
  
  if (moduleId && lessonIndex !== null) {
    const module = currentCourse.modules.find(m => m.id === moduleId);
    if (module && module.lessons[lessonIndex]) {
      const moduleItem = modulesList.children[currentCourse.modules.indexOf(module)];
      const lessonEl = moduleItem.querySelectorAll('.lesson-item')[lessonIndex];
      loadLesson(module, module.lessons[lessonIndex], lessonEl);
    }
  } else if (currentCourse.modules[0] && currentCourse.modules[0].lessons[0]) {
    const firstLessonEl = modulesList.querySelector('.lesson-item');
    loadLesson(currentCourse.modules[0], currentCourse.modules[0].lessons[0], firstLessonEl);
  }
}

function loadLesson(module, lesson, element) {
  document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');
  
  currentLesson = lesson;
  
  const video = document.getElementById('lesson-video');
  const placeholder = document.getElementById('video-placeholder');
  const title = document.getElementById('lesson-title');
  const desc = document.getElementById('lesson-description');
  const moduleMeta = document.getElementById('lesson-module');
  const orderMeta = document.getElementById('lesson-order');
  
  title.textContent = lesson.title;
  desc.textContent = 'Aula prática do método Destravando as Vendas. Acompanhe o passo a passo e aplique imediatamente no seu negócio.';
  moduleMeta.textContent = module.name;
  orderMeta.textContent = `Aula ${lesson.order}`;
  
  const src = lesson.local_video || lesson.video_url;
  if (src) {
    placeholder.classList.add('hidden');
    video.src = src;
    video.load();
    video.play().catch(() => {});
  } else {
    placeholder.classList.remove('hidden');
    video.src = '';
  }
}

// Navigation
function switchView(viewId) {
  views.forEach(v => v.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  window.scrollTo(0, 0);
}

document.getElementById('back-dashboard').addEventListener('click', () => {
  switchView('dashboard-view');
});

planSelector.addEventListener('change', (e) => {
  currentPlan = e.target.value;
  renderDashboard();
  if (document.getElementById('course-view').classList.contains('active')) {
    switchView('dashboard-view');
  }
});

// Initialize
renderDashboard();
