// Juego de Preguntas para Parejas
// Funcionalidades:
// - Barajar preguntas sin repetir (hasta agotar)
// - Filtrar por categorías y nivel (ligero, profundo, reflexivo)
// - Historial anterior/siguiente
// - Favoritas con localStorage + exportar/importar
// - Copiar/Compartir
// - Temporizador opcional

;(function(){
	/** Dataset base: puedes ampliar o editar libremente. */
	const baseQuestions = [
		// Conocimiento mutuo
		q('Conocimiento mutuo','ligero','¿Qué fue lo primero que pensaste de mí cuando nos conocimos?'),
		q('Conocimiento mutuo','ligero','¿Qué pequeño detalle de mi día te gustaría conocer más?'),
		q('Conocimiento mutuo','reflexivo','¿Qué aspecto de mi personalidad te sorprendió con el tiempo?'),
		q('Conocimiento mutuo','profundo','¿Qué crees que te enseñé sin querer?'),
		// Momentos y recuerdos
		q('Recuerdos','ligero','¿Cuál es tu recuerdo favorito de nuestra última salida?'),
		q('Recuerdos','reflexivo','¿Qué momento difícil superamos que te hizo confiar más en nosotros?'),
		q('Recuerdos','profundo','¿Qué día cambió nuestra relación para bien?'),
		// Futuro
		q('Futuro','ligero','Si hiciéramos un viaje espontáneo, ¿a dónde iríamos?'),
		q('Futuro','reflexivo','¿Qué hábito te gustaría que construyéramos juntos este año?'),
		q('Futuro','profundo','¿Cómo imaginas que resolveremos conflictos dentro de 5 años?'),
		// Afecto y amor
		q('Afecto','ligero','¿Qué detalle pequeño te hace sentir más querido/a?'),
		q('Afecto','reflexivo','¿Cómo te gusta recibir apoyo cuando estás estresado/a?'),
		q('Afecto','profundo','¿Qué te cuesta expresar y te gustaría que entendiera mejor?'),
		// Valores
		q('Valores','ligero','¿Qué valor compartimos que aprecias?'),
		q('Valores','reflexivo','¿En qué temas te gustaría que aprendiéramos a ceder?'),
		q('Valores','profundo','¿Qué no negociable te sostiene en la relación?'),
		// Diversión
		q('Diversión','ligero','¿Qué juego o actividad te gustaría probar conmigo?'),
		q('Diversión','reflexivo','¿Qué cosa tonta hacemos que te hace feliz cada vez?'),
		q('Diversión','profundo','¿Qué miedo podríamos enfrentar juntos como un reto divertido?'),
		// Comunicación
		q('Comunicación','ligero','¿Qué frase te hace sentir escuchado/a?'),
		q('Comunicación','reflexivo','¿Cómo te gustaría que resolvamos malentendidos?'),
		q('Comunicación','profundo','¿Qué conversación pendiente evitarías y por qué?'),
		// Intimidad
		q('Intimidad','ligero','¿Qué gesto cariñoso te gusta más?'),
		q('Intimidad','reflexivo','¿Qué te ayuda a sentirte seguro/a conmigo?'),
		q('Intimidad','profundo','¿Cómo podemos cuidar nuestra intimidad emocional?'),
		// Planes y finanzas
		q('Planes','ligero','¿Qué micro-plan haríamos esta semana?'),
		q('Planes','reflexivo','¿Qué meta a 6 meses te emociona compartir?'),
		q('Finanzas','ligero','¿Qué pequeño ahorro en pareja propondrías?'),
		q('Finanzas','reflexivo','¿Cómo te gustaría hablar de dinero sin estrés?'),
	]

	// Retos (challenges) — pueden dar puntos extra
	const challenges = [
		{ text:'Di 3 cosas que aprecias de tu pareja ahora mismo.', points:1 },
		{ text:'Envía un mensaje lindo a tu pareja (o dilo en voz alta).', points:1 },
		{ text:'Propón una mini-cita de 10 minutos para hoy.', points:1 },
		{ text:'Recuerden un momento difícil y nombren lo que aprendieron.', points:2 },
		{ text:'Planifiquen una actividad nueva para esta semana.', points:2 },
		{ text:'Compartan un miedo y una forma de apoyarse.', points:2 },
		{ text:'Hagan una promesa pequeña y concreta para mañana.', points:2 },
	]

	function q(category, level, text){
		return { id: cryptoRandomId(), category, level, text }
	}

	// Estado
	let deck = [...baseQuestions]
	let filtered = [...deck]
	let queue = [] // baraja actual (IDs)
	let history = [] // pila de anteriores (IDs)
	let currentId = null
	let favorites = loadFavorites()
	let timer = { seconds:0, left:0, int:null }
	let session = { active:false, players:['',''], turn:0, counts:[0,0], retos:false, lastChallenge:null, namesConfirmed:false }
	// Turn cue timeout handle
	let turnCueTo = null

	// UI refs
	const els = {
		categorySelect: document.getElementById('categorySelect'),
		levelSelect: document.getElementById('levelSelect'),
		noRepeat: document.getElementById('noRepeat'),
		timerSelect: document.getElementById('timerSelect'),
		startTimerBtn: document.getElementById('startTimerBtn'),
		timerDisplay: document.getElementById('timerDisplay'),
		selectAllBtn: document.getElementById('selectAllBtn'),
		clearAllBtn: document.getElementById('clearAllBtn'),
		questionText: document.getElementById('questionText'),
		pillCategory: document.getElementById('pillCategory'),
		pillLevel: document.getElementById('pillLevel'),
		prevBtn: document.getElementById('prevBtn'),
		nextBtn: document.getElementById('nextBtn'),
		favBtn: document.getElementById('favBtn'),
		copyBtn: document.getElementById('copyBtn'),
		shareBtn: document.getElementById('shareBtn'),
		favoritesList: document.getElementById('favoritesList'),
		exportFavsBtn: document.getElementById('exportFavsBtn'),
		importFavsInput: document.getElementById('importFavsInput'),
		clearFavsBtn: document.getElementById('clearFavsBtn'),
		customQuestions: document.getElementById('customQuestions'),
		customCategory: document.getElementById('customCategory'),
		customLevel: document.getElementById('customLevel'),
		addCustomBtn: document.getElementById('addCustomBtn'),
	// sesión
	sessionRibbon: document.getElementById('sessionRibbon'),
	turnName: document.getElementById('turnName'),
	score1: document.getElementById('score1'),
	score2: document.getElementById('score2'),
	player1: document.getElementById('player1'),
	player2: document.getElementById('player2'),
	retosToggle: document.getElementById('retosToggle'),
	startSessionBtn: document.getElementById('startSessionBtn'),
	resetSessionBtn: document.getElementById('resetSessionBtn'),
	randomTurnBtn: document.getElementById('randomTurnBtn'),
	endTurnBtn: document.getElementById('endTurnBtn'),
	// retos UI
	challengeBox: document.getElementById('challengeBox'),
	challengeText: document.getElementById('challengeText'),
	completeChallengeBtn: document.getElementById('completeChallengeBtn'),
	rerollChallengeBtn: document.getElementById('rerollChallengeBtn'),
	// instrucciones
	instructionsOverlay: document.getElementById('instructionsOverlay'),
	instructionsModal: document.getElementById('instructionsModal'),
	closeInstrBtn: document.getElementById('closeInstrBtn'),
	startPlayingBtn: document.getElementById('startPlayingBtn'),
	dontShowAgain: document.getElementById('dontShowAgain'),
	openHelpBtn: document.getElementById('openHelpBtn'),
	// nombres
	namesOverlay: document.getElementById('namesOverlay'),
	namesModal: document.getElementById('namesModal'),
	nameNovia: document.getElementById('nameNovia'),
	nameNovio: document.getElementById('nameNovio'),
	closeNamesBtn: document.getElementById('closeNamesBtn'),
	cancelNamesBtn: document.getElementById('cancelNamesBtn'),
	confirmNamesBtn: document.getElementById('confirmNamesBtn'),
	// turno (modal breve)
	turnOverlay: document.getElementById('turnOverlay'),
	turnModal: document.getElementById('turnModal'),
	turnNameModal: document.getElementById('turnNameModal'),
	}

	// Ocultar modal/overlay de turno inmediatamente (el script está al final del body)
	try{
		if(els.turnModal) els.turnModal.hidden = true
		if(els.turnOverlay) els.turnOverlay.hidden = true
	}catch{}

	// Init
	populateCategories()
	renderFavorites()
	applyFilters()
	refreshPills()
	loadSession()
	renderSession()
	registerPWA()
	initTheme()
	maybeShowInstructions()

	// Listeners
		safeOn(els.selectAllBtn,'click',selectAllCategories)
		safeOn(els.clearAllBtn,'click',clearAllCategories)
		safeOn(els.categorySelect,'change',onFilterChanged)
		safeOn(els.levelSelect,'change',onFilterChanged)
		safeOn(els.noRepeat,'change',onFilterChanged)
		safeOn(els.prevBtn,'click',showPrev)
		safeOn(els.nextBtn,'click',showNext)
		safeOn(els.favBtn,'click',toggleFavorite)
		safeOn(els.copyBtn,'click',copyCurrent)
		safeOn(els.shareBtn,'click',shareCurrent)
		safeOn(els.exportFavsBtn,'click',exportFavorites)
		safeOn(els.importFavsInput,'change',importFavorites)
		safeOn(els.clearFavsBtn,'click',clearAllFavorites)
		safeOn(els.addCustomBtn,'click',addCustomQuestions)
		safeOn(els.startTimerBtn,'click',startTimer)
		safeOn(els.timerSelect,'change',onTimerChanged)
	// sesión
	els.startSessionBtn.addEventListener('click', startSession)
	els.resetSessionBtn.addEventListener('click', resetSession)
	els.randomTurnBtn.addEventListener('click', randomTurn)
	els.endTurnBtn.addEventListener('click', endTurn)
	els.retosToggle.addEventListener('change', toggleRetos)
	els.rerollChallengeBtn.addEventListener('click', rerollChallenge)
	els.completeChallengeBtn.addEventListener('click', completeChallenge)
	// instrucciones
	safeOn(els.openHelpBtn,'click', openInstructions)
	safeOn(els.closeInstrBtn,'click', closeInstructions)
	safeOn(els.instructionsOverlay,'click', closeInstructions)
	safeOn(els.startPlayingBtn,'click', ()=>{ if(els.dontShowAgain?.checked){ localStorage.setItem('qpair:dismissedIntro','1') } closeInstructions(); openNamesModal() })
	// nombres
	safeOn(els.closeNamesBtn,'click', closeNamesModal)
	safeOn(els.cancelNamesBtn,'click', closeNamesModal)
	safeOn(els.namesOverlay,'click', closeNamesModal)
	safeOn(els.confirmNamesBtn,'click', confirmNames)
	// turno cue
	safeOn(els.turnOverlay,'click', hideTurnCue)
	// tema
	safeOn(document.getElementById('themeToggle'),'click', toggleTheme)

	// Navegación con teclado
	document.addEventListener('keydown', (e)=>{
		if(e.key==='ArrowRight') showNext()
		if(e.key==='ArrowLeft') showPrev()
		if(e.key.toLowerCase()==='f') toggleFavorite()
	})

		function safeOn(el, evt, fn){ if(el && el.addEventListener){ el.addEventListener(evt, fn) } }
	function onFilterChanged(){
		applyFilters()
		refreshPills()
	}

	function populateCategories(){
		const cats = Array.from(new Set(deck.map(d=>d.category))).sort()
		els.categorySelect.innerHTML = ''
		for(const c of cats){
			const opt = document.createElement('option')
			opt.value = c
			opt.textContent = c
			opt.selected = true
			els.categorySelect.appendChild(opt)
		}
	}

	function getSelectedCategories(){
		return Array.from(els.categorySelect.selectedOptions).map(o=>o.value)
	}

	function selectAllCategories(){
		if(!els.categorySelect) return
		Array.from(els.categorySelect.options).forEach(o => o.selected = true)
		onFilterChanged()
	}
	function clearAllCategories(){
		if(!els.categorySelect) return
		Array.from(els.categorySelect.options).forEach(o => o.selected = false)
		onFilterChanged()
	}

	function applyFilters(){
		const cats = new Set(getSelectedCategories())
		const level = els.levelSelect.value
		filtered = deck.filter(q=> (cats.size===0 || cats.has(q.category)) && (level==='todas' || q.level===level))
		reseedQueue()
	}

	function reseedQueue(){
		const noRepeat = els.noRepeat.checked
		const remaining = noRepeat ? filtered.filter(q=> !history.includes(q.id) && q.id!==currentId && !queue.includes(q.id)) : filtered
		queue = shuffle(remaining).map(q=>q.id)
	}

	function showNext(){
		if(queue.length===0){
			// Rebarajar si es necesario
			reseedQueue()
			if(queue.length===0){
				toast('No hay más preguntas con los filtros actuales.','warn')
				return
			}
		}
		if(currentId) history.push(currentId)
		currentId = queue.shift()
		renderCurrent()
	if(session.active) advanceTurn()
	maybeOfferChallenge()
	}

	function showPrev(){
	if(history.length===0){ toast('No hay anteriores.','warn') ; return }
		if(currentId){ queue.unshift(currentId) }
		currentId = history.pop()
		renderCurrent()
	}

	function renderCurrent(){
		const q = byId(currentId)
		if(!q){
			els.questionText.textContent = 'Pulsa “Siguiente” para empezar'
			els.pillCategory.textContent = 'Categoría'
			els.pillLevel.textContent = 'Nivel'
			return
		}
		els.questionText.textContent = q.text
		els.pillCategory.textContent = q.category
		els.pillLevel.textContent = capital(q.level)
		updateFavButton()
	}

	function refreshPills(){
		const cats = getSelectedCategories()
		els.pillCategory.textContent = cats.length===0? 'Todas' : cats.length>2? `${cats.length} categorías` : cats.join(' · ')
		els.pillLevel.textContent = capital(els.levelSelect.value)
	}

	function updateFavButton(){
		const f = !!favorites[currentId]
		els.favBtn.textContent = f ? '★ Favorita' : '☆ Favorita'
	}

	// Favoritas
	function toggleFavorite(){
		if(!currentId) return
		if(favorites[currentId]) delete favorites[currentId]
		else favorites[currentId] = byId(currentId)
		saveFavorites()
		updateFavButton()
		renderFavorites()
	}
	function renderFavorites(){
		els.favoritesList.innerHTML = ''
		const items = Object.values(favorites)
		if(items.length===0){
			const li = document.createElement('li')
			li.textContent = 'Aún no tienes preguntas favoritas.'
			els.favoritesList.appendChild(li)
			return
		}
		for(const q of items){
			const li = document.createElement('li')
			const text = document.createElement('div')
			text.innerHTML = `<div>${escapeHtml(q.text)}</div><div class="meta">${q.category} · ${capital(q.level)}</div>`
			const row = document.createElement('div'); row.className='row'
			const goBtn = button('Usar', ()=>{ currentId=q.id; renderCurrent() })
			const delBtn = button('Quitar', ()=>{ delete favorites[q.id]; saveFavorites(); renderFavorites(); updateFavButton() }, 'ghost')
			row.appendChild(goBtn); row.appendChild(delBtn)
			li.appendChild(text); li.appendChild(row)
			els.favoritesList.appendChild(li)
		}
	}
	function exportFavorites(){
		const data = JSON.stringify({ version:1, favorites:Object.values(favorites) }, null, 2)
		const blob = new Blob([data], {type:'application/json'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href=url; a.download = 'favoritas-preguntas.json'
		document.body.appendChild(a); a.click(); a.remove()
		URL.revokeObjectURL(url)
	}
	function importFavorites(e){
		const file = e.target.files?.[0]
		if(!file) return
		const reader = new FileReader()
		reader.onload = ()=>{
			try{
				const obj = JSON.parse(String(reader.result||'{}'))
				if(Array.isArray(obj)){
					// soporte de formato antiguo
					for(const q of obj){ if(q && q.id) favorites[q.id]=q }
				}else if(obj && obj.favorites){
					for(const q of obj.favorites){ if(q && q.id) favorites[q.id]=q }
				}
				saveFavorites(); renderFavorites(); updateFavButton(); toast('Favoritas importadas.','success')
			}catch(err){ toast('Archivo inválido.','error') }
			finally{ e.target.value='' }
		}
		reader.readAsText(file)
	}
	function clearAllFavorites(){
		if(confirm('¿Seguro que deseas vaciar todas las favoritas?')){
			favorites = {}; saveFavorites(); renderFavorites(); updateFavButton()
		}
	}
	function loadFavorites(){
		try{ return JSON.parse(localStorage.getItem('qpair:favorites')||'{}') }catch{ return {} }
	}
	function saveFavorites(){
		localStorage.setItem('qpair:favorites', JSON.stringify(favorites))
	}

	// Copiar / Compartir
	async function copyCurrent(){
		const q = byId(currentId); if(!q) return
		const text = `${q.text} — (${q.category} · ${capital(q.level)})`
	try{ await navigator.clipboard.writeText(text); toast('Copiado al portapapeles.','success') }
		catch{ fallbackCopy(text) }
	}
	async function shareCurrent(){
		const q = byId(currentId); if(!q) return
		const text = `${q.text}\n${q.category} · ${capital(q.level)}`
		if(navigator.share){
			try{ await navigator.share({ text, title:'Pregunta para parejas' }) }catch{}
		}else{ copyCurrent() }
	}

	// Temporizador
	function onTimerChanged(){
		timer.seconds = Number(els.timerSelect.value)||0
		updateTimerDisplay(timer.seconds)
	}
	function startTimer(){
		const secs = Number(els.timerSelect.value)||0
	if(!secs){ toast('Selecciona una duración.','warn'); return }
		if(timer.int) clearInterval(timer.int)
		timer.left = secs
		updateTimerDisplay(timer.left)
		els.startTimerBtn.disabled = true
		timer.int = setInterval(()=>{
			timer.left--
			updateTimerDisplay(timer.left)
			if(timer.left<=0){
				clearInterval(timer.int); timer.int=null; els.startTimerBtn.disabled=false
	beep(); toast('¡Tiempo!','info')
			}
		},1000)
	}
	function updateTimerDisplay(secs){
		const m = Math.max(0, Math.floor(secs/60)).toString().padStart(2,'0')
		const s = Math.max(0, secs%60).toString().padStart(2,'0')
		els.timerDisplay.textContent = `${m}:${s}`
	}
	function beep(){
		try{
			const ctx = new (window.AudioContext||window.webkitAudioContext)()
			const o = ctx.createOscillator(); const g = ctx.createGain()
			o.type='sine'; o.frequency.value=880; o.connect(g); g.connect(ctx.destination)
			g.gain.setValueAtTime(0.001, ctx.currentTime)
			g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime+0.01)
			o.start(); o.stop(ctx.currentTime+0.2)
		}catch{}
	}

	// Personalizar mazo
	function addCustomQuestions(){
		const lines = (els.customQuestions.value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
		const cat = (els.customCategory.value||'Personalizadas').trim()
		const lvl = els.customLevel.value||'ligero'
	if(lines.length===0){ toast('No hay preguntas para añadir.','warn'); return }
		const newQs = lines.map(text=>({ id: cryptoRandomId(), category:cat, level:lvl, text }))
		deck.push(...newQs)
		applyFilters()
		populateCategories() // por si hay nueva categoría
	toast(`Añadidas ${newQs.length} preguntas.`, 'success')
		els.customQuestions.value=''
	}

	// Sesión (turnos y conteos)
	function startSession(){
		session.players[0] = (els.player1.value||'Novia').trim()
		session.players[1] = (els.player2.value||'').trim()
		session.turn = 0
		session.counts = [0,0]
		session.active = true
			// no marcar namesConfirmed aquí; solo via confirmNames
	saveSession(); renderSession(); toast('Sesión iniciada.','success')
	cueTurn()
	if(!currentId){ showNext() }
	}
	function resetSession(){
			session = { active:false, players:['',''], turn:0, counts:[0,0], retos:false, lastChallenge:null, namesConfirmed:false }
	saveSession(); renderSession(); toast('Sesión reiniciada.','info')
	}
	function randomTurn(){
	if(!session.active){ toast('Inicia la sesión primero.','warn'); return }
		session.turn = Math.random()<0.5? 0 : 1
	saveSession(); renderSession();
	cueTurn()
	}
	function endTurn(){
	if(!session.active){ toast('Inicia la sesión primero.','warn'); return }
		session.turn = 1 - session.turn
	saveSession(); renderSession();
	cueTurn()
	}
	function advanceTurn(){
		if(!session.active) return
		session.counts[session.turn] += 1
		session.turn = 1 - session.turn
	saveSession(); renderSession()
	cueTurn()
	}
	function renderSession(){
		els.player1.value = session.players[0]||''
		els.player2.value = session.players[1]||''
			const p0 = (session.players[0]||'').trim()
			const p1 = (session.players[1]||'').trim()
			const rawName = session.active ? (session.players[session.turn]||'').trim() : ''
			const showTurn = session.active && session.namesConfirmed && p0.length>0 && p1.length>0 && rawName.length>0
		els.sessionRibbon.hidden = !showTurn
		els.turnName.textContent = showTurn ? rawName : ''
		els.score1.textContent = `${session.players[0]||'P1'}: ${session.counts[0]}`
		els.score2.textContent = `${session.players[1]||'P2'}: ${session.counts[1]}`
		els.retosToggle.checked = !!session.retos
		// pintar reto si activo
		if(session.retos && session.lastChallenge){
			els.challengeBox.hidden = false
			const ch = session.lastChallenge
			els.challengeText.textContent = `${ch.text} ( +${ch.points} )`
			els.completeChallengeBtn.textContent = `✔ Completar (+${ch.points})`
		}else{
			els.challengeBox.hidden = true
		}
	}
	function saveSession(){ localStorage.setItem('qpair:session', JSON.stringify(session)) }
	function loadSession(){
		try{
			const s = JSON.parse(localStorage.getItem('qpair:session')||'null')
			if(s && typeof s==='object') session = s
		}catch{}
	}

	// PWA (manifest + service worker)
	function registerPWA(){
		if(!('serviceWorker' in navigator)) return
		const swUrl = './sw.js?v=13'
		navigator.serviceWorker.register(swUrl).then(reg => {
			// Intentar actualizar en segundo plano
			try{ reg.update?.() }catch{}
		}).catch(()=>{})
		// Recargar una vez cuando el controlador cambie (nuevo SW activo)
		let refreshed = false
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			if (refreshed) return; refreshed = true; try{ window.location.reload() }catch{}
		})
	}

	// Tema claro/oscuro
	function initTheme(){
		const saved = localStorage.getItem('qpair:theme') || 'dark'
		applyTheme(saved)
	}
	function toggleTheme(){
		const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
		const next = cur === 'light' ? 'dark' : 'light'
		applyTheme(next)
		try{ localStorage.setItem('qpair:theme', next) }catch{}
	}
	function applyTheme(mode){
		if(mode === 'light'){
			document.documentElement.setAttribute('data-theme','light')
			const btn = document.getElementById('themeToggle'); if(btn) btn.textContent = 'Modo oscuro \uD83C\uDF19'
		}else{
			document.documentElement.removeAttribute('data-theme')
			const btn = document.getElementById('themeToggle'); if(btn) btn.textContent = 'Modo claro \u2600\uFE0F'
		}
	}

	// Instrucciones (modal)
	function maybeShowInstructions(){
		const dismissed = localStorage.getItem('qpair:dismissedIntro')==='1'
		if(!dismissed){ openInstructions() }
	}
	function openInstructions(){
		if(!els.instructionsModal || !els.instructionsOverlay) return
		els.instructionsModal.hidden = false
		els.instructionsOverlay.hidden = false
	}
	function closeInstructions(){
		if(!els.instructionsModal || !els.instructionsOverlay) return
		els.instructionsModal.hidden = true
		els.instructionsOverlay.hidden = true
	}

	// Nombres (Novia/Novio)
	function openNamesModal(){
		if(!els.namesModal || !els.namesOverlay) return
	// siempre vacíos al abrir
	if(els.nameNovia) els.nameNovia.value = ''
	if(els.nameNovio) els.nameNovio.value = ''
		els.namesModal.hidden = false
		els.namesOverlay.hidden = false
	// enfoque inicial
	try{ els.nameNovia?.focus() }catch{}
	}
	function closeNamesModal(){
		if(!els.namesModal || !els.namesOverlay) return
		els.namesModal.hidden = true
		els.namesOverlay.hidden = true
	}
	function confirmNames(){
		const novia = (els.nameNovia.value||'').trim()
		const novio = (els.nameNovio.value||'').trim()
		if(!novia){ showNamesValidation('Por favor, ingresa el nombre de la Novia.'); els.nameNovia.focus(); return }
		if(!novio){ showNamesValidation('Por favor, ingresa el nombre del Novio.'); els.nameNovio.focus(); return }
		// Iniciar sesión con estos nombres
		session.players[0] = novia
		session.players[1] = novio
		session.turn = 0
		session.counts = [0,0]
		session.active = true
			session.namesConfirmed = true
		dismissNamesValidation();
		saveSession(); renderSession(); closeNamesModal()
	cueTurn()
		if(!currentId){ showNext() }
	}

	// Turno: modal breve con animación
	function cueTurn(){
		if(!els.turnModal || !els.turnOverlay) return
			if(!session.namesConfirmed) return
		const p0 = (session.players?.[0]||'').trim()
		const p1 = (session.players?.[1]||'').trim()
		if(!p0 || !p1) return
		const curName = (session.players?.[session.turn]||'').trim()
		// No mostrar el modal si el nombre está vacío
		if(!curName) return
	// sonido breve
	turnChime()
		const name = curName
		if(els.turnNameModal) els.turnNameModal.textContent = name
		// Mostrar
		els.turnOverlay.hidden = false
		els.turnModal.hidden = false
        
		// Reiniciar animación del bubble
		try{
			const bubble = els.turnModal.querySelector('.turn-bubble')
			if(bubble){
				bubble.style.animation = 'none'
				// reflow
				void bubble.offsetHeight
				bubble.style.animation = ''
			}
		}catch{}
		// Autocerrar
		if(turnCueTo) clearTimeout(turnCueTo)
		turnCueTo = setTimeout(()=>{ hideTurnCue() }, 950)
	}
	function hideTurnCue(){
		if(turnCueTo){ clearTimeout(turnCueTo); turnCueTo=null }
		if(els.turnModal) els.turnModal.hidden = true
		if(els.turnOverlay) els.turnOverlay.hidden = true
	}

	// Sonido al cambiar de turno (dos notas cortas)
	function turnChime(){
		try{
			const Ctx = window.AudioContext || window.webkitAudioContext; if(!Ctx) return
			const ctx = new Ctx()
			const o = ctx.createOscillator(); const g = ctx.createGain()
			o.type = 'sine'; o.connect(g); g.connect(ctx.destination)
			const t0 = ctx.currentTime
			g.gain.setValueAtTime(0.0001, t0)
			g.gain.exponentialRampToValueAtTime(0.14, t0+0.01)
			o.frequency.setValueAtTime(660, t0)      // E5
			o.start(t0)
			o.frequency.setValueAtTime(880, t0+0.10) // A5
			g.gain.exponentialRampToValueAtTime(0.0001, t0+0.24)
			o.stop(t0+0.26)
		}catch{}
	}

	// Retos
	function toggleRetos(){
		session.retos = !!els.retosToggle.checked
		if(!session.retos){ session.lastChallenge = null }
		saveSession(); renderSession()
	}
	function maybeOfferChallenge(){
		if(!session.active || !session.retos) return
		// 50% de probabilidad de mostrar reto
		if(Math.random() < 0.5){
			rerollChallenge()
		}else{
			session.lastChallenge = null; saveSession(); renderSession()
		}
	}
	function rerollChallenge(){
		if(!session.active || !session.retos) return
		session.lastChallenge = challenges[Math.floor(Math.random()*challenges.length)]
		saveSession(); renderSession()
	}
	function completeChallenge(){
		if(!session.active || !session.retos || !session.lastChallenge) return
		const prev = (1 - session.turn) // quien acaba de responder antes del avance
		session.counts[prev] += session.lastChallenge.points
		session.lastChallenge = null
	saveSession(); renderSession(); beep(); toast('Reto completado. ¡Puntos extra!','success')
	}

	// Utilidades
	function byId(id){ return deck.find(q=>q.id===id) || favorites[id] || null }
	function capital(s){ if(!s) return 'Todas'; return s[0].toUpperCase()+s.slice(1) }
	function shuffle(arr){
		const a = [...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a
	}
	function cryptoRandomId(){
		if(window.crypto?.getRandomValues){ const b=new Uint8Array(8); window.crypto.getRandomValues(b); return [...b].map(x=>x.toString(16).padStart(2,'0')).join('') }
		return Math.random().toString(36).slice(2)
	}
	function button(text, onClick, variant='secondary'){
		const b = document.createElement('button'); b.className=variant; b.textContent=text; b.addEventListener('click', onClick); return b
	}
	function toast(msg, variant='info', ms){
		const t = document.createElement('div')
		t.textContent = msg
		const base = { position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)', padding:'10px 14px', borderRadius:'10px', zIndex:9999, opacity:'0', transition:'opacity .2s ease' }
		let styles
		switch(variant){
			case 'success': styles = { background:'#16a34a', color:'#f0fdf4', border:'1px solid #15803d' }; break
			case 'warn': styles = { background:'#facc15', color:'#111827', border:'1px solid #ca8a04' }; break
			case 'error': styles = { background:'#ef4444', color:'#fff', border:'1px solid #b91c1c' }; break
			default: styles = { background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border)' }
		}
		Object.assign(t.style, base, styles)
		document.body.appendChild(t); requestAnimationFrame(()=>{ t.style.opacity='1' })
		if(ms !== 0){
			const duration = typeof ms==='number' && ms>0
				? ms
				: (variant==='success' ? 1600 : variant==='warn' ? 2400 : variant==='error' ? 2800 : 1800)
			const to = setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),200) }, duration)
			t.addEventListener('click', ()=>{ clearTimeout(to); t.style.opacity='0'; setTimeout(()=>t.remove(),200) })
		} else {
			// persistente: cerrar al hacer click
			t.addEventListener('click', ()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),200) })
		}
		return t
	}

	// Validación persistente para nombres
	const namesValidation = { active:false, el:null, listenersAttached:false }
	function showNamesValidation(message){
		if(namesValidation.el){ namesValidation.el.textContent = message; return }
		namesValidation.el = toast(message, 'warn', 0) // persistente
		namesValidation.active = true
		attachNamesValidationListeners()
	}
	function dismissNamesValidation(){
		if(namesValidation.el){
			const t = namesValidation.el; namesValidation.el=null; namesValidation.active=false
			t.style.opacity='0'; setTimeout(()=>t.remove(),200)
		}
	}
	function attachNamesValidationListeners(){
		if(namesValidation.listenersAttached) return
		const onInput = ()=>{
			const novia = (els.nameNovia.value||'').trim()
			const novio = (els.nameNovio.value||'').trim()
			if(novia && novio){ dismissNamesValidation() }
		}
		safeOn(els.nameNovia,'input',onInput)
		safeOn(els.nameNovio,'input',onInput)
		namesValidation.listenersAttached = true
	}
	function fallbackCopy(text){
		const ta = document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); toast('Copiado.')}catch{} finally{ ta.remove() }
	}
	function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])) }
})()
