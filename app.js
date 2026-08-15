
/* Sistema Web Inteligente para la Gestión Académica
   JavaScript ES6+ puro. Sin frameworks, sin Bootstrap, sin jQuery.
*/
const DB = {
  users: "sga_users_v1",
  students: "sga_students_v1",
  courses: "sga_courses_v1",
  history: "sga_history_v1",
  prefs: "sga_prefs_v1"
};

const SESSION = {
  start: "sga_session_start_v1",
  pages: "sga_session_pages_v1",
  actions: "sga_session_actions_v1"
};

class Persona {
  constructor(nombre, correo, fechaNacimiento) {
    this.nombre = nombre;
    this.correo = correo;
    this.fechaNacimiento = fechaNacimiento;
  }
  calcularEdad() {
    if (!this.fechaNacimiento) return 0;
    const nacimiento = new Date(this.fechaNacimiento + "T00:00:00");
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return Math.max(0, edad);
  }
  mostrarInformacion() {
    return `${this.nombre} · ${this.correo} · ${this.calcularEdad()} años`;
  }
}

class Estudiante extends Persona {
  constructor(data) {
    super(data.nombre, data.correo, data.fechaNacimiento);
    this.carnet = data.carnet;
    this.carrera = data.carrera;
    this.cursosInscritos = Array.isArray(data.cursosInscritos) ? data.cursosInscritos : [];
    this.activo = data.activo !== false;
  }
  inscribirCurso(codigo) {
    if (!this.cursosInscritos.includes(codigo)) this.cursosInscritos.push(codigo);
    return this.cursosInscritos;
  }
  calcularPromedio(courses = []) {
    const notas = this.cursosInscritos
      .map(c => courses.find(x => x.codigo === c))
      .filter(Boolean)
      .flatMap(c => c.calificaciones || []);
    if (!notas.length) return 0;
    return redondear(notas.reduce((a,b)=>a+b,0) / notas.length);
  }
}

class Curso {
  constructor(data) {
    this.codigo = data.codigo;
    this.nombre = data.nombre;
    this.creditos = Number(data.creditos) || 0;
    this.calificaciones = Array.isArray(data.calificaciones) ? data.calificaciones : [];
    this.activo = data.activo !== false;
  }
  agregarCalificacion(nota) {
    const n = Number(nota);
    if (Number.isFinite(n) && n >= 0 && n <= 100) this.calificaciones.push(n);
    return this.calificaciones;
  }
  obtenerPromedioCurso() {
    if (!this.calificaciones.length) return 0;
    return redondear(this.calificaciones.reduce((a,b)=>a+b,0) / this.calificaciones.length);
  }
}

class Administrador {
  constructor(nombre, correo) {
    this.nombre = nombre;
    this.correo = correo;
  }
  registrarEstudiante(data, students) {
    students.push(new Estudiante(data));
    return students;
  }
  eliminarEstudiante(carnet, students) {
    const i = students.findIndex(s => s.carnet === carnet);
    if (i >= 0) students.splice(i, 1);
    return students;
  }
  generarReporte(students, courses) {
    return students.map(s => ({
      carnet: s.carnet, nombre: s.nombre, carrera: s.carrera,
      promedio: s.calcularPromedio(courses)
    }));
  }
}

/* Prototipo adicional: evidencia explícita del uso de prototipos. */
Persona.prototype.esAdulto = function() { return this.calcularEdad() >= 18; };

/* Función con argumentos variables (rest parameters). */
function promedioVariable(...notas) {
  const validas = notas.map(Number).filter(n => Number.isFinite(n));
  return validas.length ? redondear(validas.reduce((a,b)=>a+b,0)/validas.length) : 0;
}

function redondear(valor) {
  return Math.round(Number(valor) * 100) / 100;
}

const RE = {
  nombre: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+){1,5}$/,
  correo: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  usuario: /^[A-Za-z0-9._-]{4,20}$/,
  carnet: /^[A-Za-z0-9-]{4,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,32}$/,
  carrera: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,&'-]{3,80}$/
};

function validate(field, value) {
  const v = String(value || "").trim();
  if (field === "nombre") return RE.nombre.test(v);
  if (field === "correo") return RE.correo.test(v);
  if (field === "usuario") return RE.usuario.test(v);
  if (field === "carnet") return RE.carnet.test(v);
  if (field === "password") return RE.password.test(v);
  if (field === "carrera") return RE.carrera.test(v);
  return true;
}

function passwordStrength(value) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value)) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

const Storage = {
  get(key, fallback=[]) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); },
  exportAll() {
    return {
      exportedAt: new Date().toISOString(),
      users: this.get(DB.users, []),
      students: this.get(DB.students, []),
      courses: this.get(DB.courses, []),
      history: this.get(DB.history, []),
      preferences: this.get(DB.prefs, {})
    };
  },
  importAll(data) {
    if (!data || typeof data !== "object") throw new Error("JSON inválido.");
    if (Array.isArray(data.users)) this.set(DB.users, data.users);
    if (Array.isArray(data.students)) this.set(DB.students, data.students);
    if (Array.isArray(data.courses)) this.set(DB.courses, data.courses);
    if (Array.isArray(data.history)) this.set(DB.history, data.history);
    if (data.preferences && typeof data.preferences === "object") this.set(DB.prefs, data.preferences);
  }
};

const Cookies = {
  set(name, value, days=30) {
    const expires = new Date(Date.now() + days*864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },
  get(name) {
    const target = encodeURIComponent(name) + "=";
    return document.cookie.split("; ").find(x=>x.startsWith(target))?.slice(target.length) ? decodeURIComponent(document.cookie.split("; ").find(x=>x.startsWith(target)).slice(target.length)) : null;
  },
  remove(name) { document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; path=/; SameSite=Lax`; },
  all() {
    return document.cookie ? Object.fromEntries(document.cookie.split("; ").map(p => {
      const i = p.indexOf("="); return [decodeURIComponent(p.slice(0,i)), decodeURIComponent(p.slice(i+1))];
    })) : {};
  }
};

function sessionInit() {
  if (!sessionStorage.getItem(SESSION.start)) sessionStorage.setItem(SESSION.start, Date.now());
  if (!sessionStorage.getItem(SESSION.pages)) sessionStorage.setItem(SESSION.pages, JSON.stringify([]));
  if (!sessionStorage.getItem(SESSION.actions)) sessionStorage.setItem(SESSION.actions, JSON.stringify([]));
}
function sessionPage(page) {
  sessionInit();
  const pages = JSON.parse(sessionStorage.getItem(SESSION.pages) || "[]");
  pages.push({page, at: new Date().toISOString()});
  sessionStorage.setItem(SESSION.pages, JSON.stringify(pages.slice(-100)));
}
function sessionAction(action) {
  sessionInit();
  const actions = JSON.parse(sessionStorage.getItem(SESSION.actions) || "[]");
  actions.push({action, at: new Date().toISOString()});
  sessionStorage.setItem(SESSION.actions, JSON.stringify(actions.slice(-100)));
}
function sessionStayMinutes() {
  return Math.max(0, Math.floor((Date.now() - Number(sessionStorage.getItem(SESSION.start) || Date.now()))/60000));
}

function seedData() {
  if (!localStorage.getItem(DB.users)) {
    Storage.set(DB.users, [{
      nombre:"Administrador Demo", correo:"admin@universidad.edu", usuario:"admin",
      password:"Admin123!", rol:"Administrador"
    }]);
  }
  if (!localStorage.getItem(DB.students)) {
    Storage.set(DB.students, [
      {nombre:"Ana Martínez",correo:"ana@universidad.edu",fechaNacimiento:"2003-04-15",carnet:"EST-001",carrera:"Ingeniería de Sistemas",cursosInscritos:["WEB101","MAT201"],activo:true},
      {nombre:"Carlos López",correo:"carlos@universidad.edu",fechaNacimiento:"2002-09-21",carnet:"EST-002",carrera:"Ingeniería de Sistemas",cursosInscritos:["WEB101","BD202"],activo:true},
      {nombre:"Sofía Hernández",correo:"sofia@universidad.edu",fechaNacimiento:"2004-01-08",carnet:"EST-003",carrera:"Diseño Digital",cursosInscritos:["WEB101"],activo:true}
    ]);
  }
  if (!localStorage.getItem(DB.courses)) {
    Storage.set(DB.courses, [
      {codigo:"WEB101",nombre:"Programación Web",creditos:4,calificaciones:[92,88,95],activo:true},
      {codigo:"MAT201",nombre:"Matemática Aplicada",creditos:3,calificaciones:[78,85,81],activo:true},
      {codigo:"BD202",nombre:"Bases de Datos",creditos:4,calificaciones:[68,72,75],activo:true}
    ]);
  }
  if (!localStorage.getItem(DB.history)) Storage.set(DB.history, []);
}

function getSessionUsername() {
  // Cookies son el mecanismo principal; sessionStorage actúa como respaldo
  // cuando el proyecto se abre directamente desde file:// en algunos navegadores.
  return Cookies.get("sga_usuario") || sessionStorage.getItem("sga_usuario") || "";
}

function currentUser() {
  const username = getSessionUsername();
  return Storage.get(DB.users, []).find(u => u.usuario === username) || null;
}
function logHistory(action, detail="") {
  const history = Storage.get(DB.history, []);
  history.unshift({id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), action, detail, at:new Date().toISOString(), user:Cookies.get("sga_usuario")||"anónimo"});
  Storage.set(DB.history, history.slice(0,200));
  sessionAction(action);
}

function requireAuth() {
  if (!getSessionUsername()) location.href = "login.html";
}
function logout() {
  Cookies.remove("sga_usuario");
  sessionStorage.removeItem("sga_usuario");
  sessionAction("Cierre de sesión");
  location.href = "login.html";
}

function calcStats() {
  const students = Storage.get(DB.students, []).map(s=>new Estudiante(s));
  const courses = Storage.get(DB.courses, []).map(c=>new Curso(c));
  const rows = new Administrador("","").generarReporte(students,courses);
  const averages = rows.map(r=>r.promedio).filter(n=>n>0);
  const avg = averages.length ? redondear(averages.reduce((a,b)=>a+b,0)/averages.length) : 0;
  return {
    students, courses, rows, avg,
    approved: rows.filter(r=>r.promedio>=61).length,
    failed: rows.filter(r=>r.promedio>0 && r.promedio<61).length,
    highest: rows.length ? rows.reduce((a,b)=>a.promedio>b.promedio?a:b) : null,
    lowest: rows.length ? rows.reduce((a,b)=>a.promedio<b.promedio?a:b) : null
  };
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
}

function showToast(message, type="info") {
  const box = document.getElementById("toast");
  if (!box) return;
  box.textContent = message; box.dataset.type = type; box.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>box.classList.remove("show"), 3000);
}

function qs(s, root=document) { return root.querySelector(s); }
function qsa(s, root=document) { return [...root.querySelectorAll(s)]; }

function setActiveNav(id) {
  qsa("[data-section]").forEach(b=>b.classList.toggle("active", b.dataset.section===id));
  qsa(".app-section").forEach(s=>s.classList.toggle("active", s.id===id));
  sessionPage(id);
}

function setupDashboard() {
  requireAuth(); sessionInit(); seedData();
  const user = currentUser();
  if (qs("#userName")) qs("#userName").textContent = user?.nombre || "Usuario";
  if (qs("#userRole")) qs("#userRole").textContent = user?.rol || "Docente";
  Cookies.set("sga_ultimo_acceso", new Date().toISOString(), 30);
  renderDashboard();

  qsa("[data-section]").forEach(btn=>btn.addEventListener("click",()=>{
    setActiveNav(btn.dataset.section);
    if (window.innerWidth < 900) qs("#sidebar")?.classList.remove("open");
    if (btn.dataset.section === "dashboard") renderDashboard();
    if (btn.dataset.section === "students") renderStudents();
    if (btn.dataset.section === "courses") renderCourses();
    if (btn.dataset.section === "reports") renderReports();
    if (btn.dataset.section === "storage") renderStorage();
    if (btn.dataset.section === "cookies") renderCookies();
    if (btn.dataset.section === "history") renderHistory();
    if (btn.dataset.section === "contact") renderContact();
  }));
  qs("#menuToggle")?.addEventListener("click",()=>qs("#sidebar")?.classList.toggle("open"));
  qs("#logoutBtn")?.addEventListener("click",logout);

  setupStudentForm();
  setupCourseForm();
  setupSearch();
  setupStorageActions();
  setupCookieActions();
  setupContact();
  renderStudents(); renderCourses(); renderReports(); renderStorage(); renderCookies(); renderHistory(); renderContact();
}

function renderDashboard() {
  const s=calcStats();
  const set=(id,v)=>{if(qs(id))qs(id).textContent=v};
  set("#totalStudents",s.students.length); set("#activeCourses",s.courses.filter(c=>c.activo).length);
  set("#institutionAvg",s.avg.toFixed(2)); set("#approved",s.approved); set("#failed",s.failed);
  set("#highestStudent",s.highest ? `${s.highest.nombre} · ${s.highest.promedio}` : "—");
  set("#lowestStudent",s.lowest ? `${s.lowest.nombre} · ${s.lowest.promedio}` : "—");
  set("#stayTime",`${sessionStayMinutes()} min`);
  const body=qs("#dashboardTable");
  if(body) body.innerHTML=s.rows.map(r=>`<tr><td>${esc(r.carnet)}</td><td>${esc(r.nombre)}</td><td>${esc(r.carrera)}</td><td><strong>${r.promedio.toFixed(2)}</strong></td></tr>`).join("");
}

function setupStudentForm() {
  const form=qs("#studentForm"); if(!form)return;
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    const invalid=["nombre","correo","carnet","carrera"].filter(k=>!validate(k,data[k]));
    if(invalid.length || !data.fechaNacimiento){ showToast("Corrige los campos marcados.","error"); return; }
    const students=Storage.get(DB.students,[]);
    if(students.some(s=>s.carnet===data.carnet)){showToast("El carnet ya existe.","error");return;}
    const est=new Estudiante({...data,cursosInscritos:[],activo:true});
    const admin=new Administrador(currentUser()?.nombre||"Administrador",currentUser()?.correo||"");
    admin.registrarEstudiante(est,students);
    Storage.set(DB.students,students); logHistory("Registro de estudiante",data.carnet);
    form.reset(); renderStudents(); renderDashboard(); showToast("Estudiante registrado.","success");
  });
  qsa("#studentForm input").forEach(i=>i.addEventListener("input",()=>i.classList.toggle("invalid", i.name && !validate(i.name,i.value) && i.value)));
}

function renderStudents() {
  const body=qs("#studentsTable"); if(!body)return;
  const students=Storage.get(DB.students,[]), courses=Storage.get(DB.courses,[]).map(c=>new Curso(c));
  const filter=(qs("#studentSearch")?.value||"").toLowerCase();
  body.innerHTML=students.filter(s=>[s.nombre,s.carnet,s.carrera].join(" ").toLowerCase().includes(filter)).map(s=>{
    const e=new Estudiante(s), avg=e.calcularPromedio(courses);
    return `<tr><td>${esc(s.carnet)}</td><td>${esc(s.nombre)}</td><td>${esc(s.carrera)}</td><td>${e.calcularEdad()}</td><td>${avg.toFixed(2)}</td><td><span class="status ${s.activo?'ok':'off'}">${s.activo?'Activo':'Inactivo'}</span></td><td><button class="table-btn danger" data-delete="${esc(s.carnet)}">Eliminar</button></td></tr>`;
  }).join("") || `<tr><td colspan="7" class="empty">No hay estudiantes.</td></tr>`;
  qsa("[data-delete]",body).forEach(b=>b.addEventListener("click",()=>{
    if(!confirm("¿Eliminar este estudiante?"))return;
    const students=Storage.get(DB.students,[]); new Administrador("","").eliminarEstudiante(b.dataset.delete,students);
    Storage.set(DB.students,students); logHistory("Eliminación de estudiante",b.dataset.delete); renderStudents(); renderDashboard(); showToast("Estudiante eliminado.","success");
  }));
}

function setupSearch(){ qs("#studentSearch")?.addEventListener("input",renderStudents); qs("#courseSearch")?.addEventListener("input",renderCourses); }

function setupCourseForm() {
  const form=qs("#courseForm"); if(!form)return;
  form.addEventListener("submit",e=>{
    e.preventDefault(); const data=Object.fromEntries(new FormData(form).entries());
    if(!/^[A-Z0-9-]{3,12}$/.test(data.codigo) || data.nombre.trim().length<3 || Number(data.creditos)<1){showToast("Datos del curso inválidos.","error");return;}
    const courses=Storage.get(DB.courses,[]);
    if(courses.some(c=>c.codigo===data.codigo)){showToast("El código ya existe.","error");return;}
    courses.push(new Curso({...data,calificaciones:[],activo:true}));
    Storage.set(DB.courses,courses); logHistory("Registro de curso",data.codigo); form.reset(); renderCourses(); renderDashboard(); showToast("Curso registrado.","success");
  });
}
function renderCourses() {
  const body=qs("#coursesTable"); if(!body)return;
  const filter=(qs("#courseSearch")?.value||"").toLowerCase();
  const courses=Storage.get(DB.courses,[]);
  body.innerHTML=courses.filter(c=>(c.codigo+" "+c.nombre).toLowerCase().includes(filter)).map(c=>{
    const curso=new Curso(c);
    return `<tr><td>${esc(c.codigo)}</td><td>${esc(c.nombre)}</td><td>${c.creditos}</td><td>${curso.calificaciones.length}</td><td>${curso.obtenerPromedioCurso().toFixed(2)}</td><td><span class="status ${c.activo?'ok':'off'}">${c.activo?'Activo':'Inactivo'}</span></td></tr>`;
  }).join("") || `<tr><td colspan="6" class="empty">No hay cursos.</td></tr>`;
}

function renderReports() {
  const s=calcStats(), body=qs("#reportsTable"); if(!body)return;
  body.innerHTML=s.rows.map(r=>`<tr><td>${esc(r.carnet)}</td><td>${esc(r.nombre)}</td><td>${esc(r.carrera)}</td><td>${r.promedio.toFixed(2)}</td><td><span class="status ${r.promedio>=61?'ok':'bad'}">${r.promedio>=61?'Aprobado':'Reprobado'}</span></td></tr>`).join("");
  if(qs("#reportSummary")) qs("#reportSummary").textContent=`Promedio institucional: ${s.avg.toFixed(2)} · Mayor: ${s.highest?.nombre||"—"} · Menor: ${s.lowest?.nombre||"—"}`;
}
function renderStorage() {
  if(!qs("#storagePreview"))return;
  const d=Storage.exportAll();
  qs("#storagePreview").textContent=JSON.stringify(d,null,2);
}
function setupStorageActions(){
  qs("#exportBtn")?.addEventListener("click",()=>{downloadJSON(`respaldo-academico-${Date.now()}.json`,Storage.exportAll());logHistory("Exportación JSON");showToast("Respaldo exportado.","success")});
  qs("#importFile")?.addEventListener("change",async e=>{
    const file=e.target.files?.[0]; if(!file)return;
    try{const d=JSON.parse(await file.text());Storage.importAll(d);logHistory("Importación JSON",file.name);showToast("Respaldo importado correctamente.","success");renderDashboard();renderStudents();renderCourses();renderReports();renderStorage();}
    catch(err){showToast("No se pudo importar el JSON.","error")}
    e.target.value="";
  });
}
function renderCookies(){
  const c=Cookies.all(), body=qs("#cookieTable"); if(!body)return;
  body.innerHTML=Object.entries(c).map(([k,v])=>`<tr><td>${esc(k)}</td><td><input class="cookie-value" data-cookie="${esc(k)}" value="${esc(v)}"></td><td><button class="table-btn" data-save-cookie="${esc(k)}">Guardar</button><button class="table-btn danger" data-remove-cookie="${esc(k)}">Eliminar</button></td></tr>`).join("")||`<tr><td colspan="3" class="empty">No hay cookies.</td></tr>`;
  qsa("[data-save-cookie]",body).forEach(b=>b.addEventListener("click",()=>{const i=body.querySelector(`[data-cookie="${CSS.escape(b.dataset.saveCookie)}"]`);Cookies.set(b.dataset.saveCookie,i.value,30);logHistory("Modificación de cookie",b.dataset.saveCookie);renderCookies();showToast("Cookie actualizada.","success")}));
  qsa("[data-remove-cookie]",body).forEach(b=>b.addEventListener("click",()=>{Cookies.remove(b.dataset.removeCookie);logHistory("Eliminación de cookie",b.dataset.removeCookie);renderCookies();showToast("Cookie eliminada.","success")}));
}
function setupCookieActions(){ qs("#clearCookiesBtn")?.addEventListener("click",()=>{Object.keys(Cookies.all()).forEach(k=>Cookies.remove(k));logHistory("Eliminación de todas las cookies");renderCookies();showToast("Cookies eliminadas.","success")});}
function renderHistory(){
  const body=qs("#historyTable"); if(!body)return;
  const h=Storage.get(DB.history,[]);
  body.innerHTML=h.map(x=>`<tr><td>${new Date(x.at).toLocaleString()}</td><td>${esc(x.user)}</td><td>${esc(x.action)}</td><td>${esc(x.detail)}</td></tr>`).join("")||`<tr><td colspan="4" class="empty">Sin actividades registradas.</td></tr>`;
}
function setupContact(){
  const form=qs("#contactForm"); if(!form)return;
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(form).entries());
    if(!RE.correo.test(String(d.correo||"").trim()) || String(d.mensaje||"").trim().length<10){
      showToast("Completa el contacto correctamente.","error");
      return;
    }
    logHistory("Formulario de contacto",d.asunto);
    form.reset();
    showToast("Mensaje registrado localmente. ¡Gracias!","success");
  });
}

function renderContact(){
  // El evento se registra una sola vez en setupContact().
  // Esta función se mantiene para poder refrescar la sección desde la navegación.
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

document.addEventListener("DOMContentLoaded",()=>{
  seedData();
  if(document.body.dataset.page==="login") setupLogin();
  if(document.body.dataset.page==="dashboard") setupDashboard();
  if(document.body.dataset.page==="home"){
    qs("#goLogin")?.addEventListener("click",()=>location.href="login.html");
    qs("#homeDemo")?.addEventListener("click",()=>location.href="login.html");
  }
});

function setupLogin(){
  sessionInit();
  const form=qs("#loginForm"), reg=qs("#registerForm");
  qs("#showRegister")?.addEventListener("click",()=>{qs("#loginPanel").hidden=true;qs("#registerPanel").hidden=false});
  qs("#showLogin")?.addEventListener("click",()=>{qs("#loginPanel").hidden=false;qs("#registerPanel").hidden=true});
  qs("#password")?.addEventListener("input",e=>{
    const n=passwordStrength(e.target.value), el=qs("#strength");
    if(el){el.textContent=["Muy débil","Débil","Media","Buena","Fuerte","Excelente"][n];el.dataset.level=n}
  });
  form?.addEventListener("submit",e=>{
    e.preventDefault();const d=Object.fromEntries(new FormData(form).entries());
    const user=Storage.get(DB.users,[]).find(u=>u.usuario===d.usuario && u.password===d.password);
    if(!user){qs("#loginError").textContent="Usuario o contraseña incorrectos.";return;}
    Cookies.set("sga_usuario",user.usuario,30);
    sessionStorage.setItem("sga_usuario",user.usuario);
    Cookies.set("sga_ultimo_acceso",new Date().toISOString(),30);
    Cookies.set("sga_preferencias",JSON.stringify({tema:document.documentElement.dataset.theme||"default"}),30);
    logHistory("Inicio de sesión",user.usuario);
    location.href="dashboard.html";
  });
  reg?.addEventListener("submit",e=>{
    e.preventDefault();const d=Object.fromEntries(new FormData(reg).entries());
    const invalid=["nombre","correo","usuario","password","carnet"].filter(k=>!validate(k,d[k]));
    if(invalid.length||d.password!==d.confirmPassword){qs("#registerError").textContent="Revisa los datos y confirma la contraseña.";return;}
    const users=Storage.get(DB.users,[]);
    if(users.some(u=>u.usuario===d.usuario||u.correo===d.correo)){qs("#registerError").textContent="El usuario o correo ya existe.";return;}
    users.push({nombre:d.nombre,correo:d.correo,usuario:d.usuario,password:d.password,rol:d.rol});
    Storage.set(DB.users,users);logHistory("Registro de usuario",d.usuario);
    reg.reset();qs("#registerError").textContent="Registro exitoso. Ya puedes iniciar sesión.";qs("#loginPanel").hidden=false;qs("#registerPanel").hidden=true;
  });
}

// Evidencia ejecutable de los 10 métodos de arrays solicitados por la especificación.
function ejecutarOperacionesArrays() {
  let cola = ["A","B","C"];
  cola.push("D");          // push
  const ultimo = cola.pop(); // pop
  const primero = cola.shift(); // shift
  cola.unshift(primero);   // unshift
  cola.splice(1,0,"X");    // splice
  const segmento = cola.slice(0,3); // slice
  const combinada = cola.concat(["E","F"]); // concat
  const texto = combinada.join(" · "); // join
  cola.reverse();          // reverse
  cola.sort();             // sort
  return {cola, ultimo, primero, segmento, combinada, texto};
}
