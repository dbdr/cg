async function initUI() {
	const docRef = CGDatabase.collection('records').doc('.game-list')
	const doc = await docRef.get()
	if (! doc.exists)
		fail("Missing game list")
	let gameInfo = doc.data().list
	console.log(gameInfo)
	for (const g of gameInfo) {
		games[g.prettyId] = g
		console.log(g)
		createButton(g)
	}
	showNews()
}

let games = {}

function createButton(game) {
	const tab = document.createElement('button')
	tab.setAttribute('id', game.prettyId)
	tab.classList.add('puzzle', 'tablinks')
	tab.setAttribute('onclick', `selectPuzzle(event.currentTarget, "${game.prettyId}")`)
	tab.textContent = game.title
	document.querySelector("#tabs").appendChild(tab)
}

window.addEventListener('unhandledrejection', event => console.error('Unhandled rejection:', event.promise, event.reason));
window.addEventListener('rejectionhandled',   event => console.error('Handled rejection:', event.promise, event.reason));

CGDatabase.init()

initUI().then(()=>{})

async function selectPuzzle(target, gameId) {
	
	openTab(target, "puzzle", gameId)

	const game = games[gameId]
	console.log(game)

	if (game.level === "codegolf")
		showGolf(game)
	else {
		const langTab = document.querySelector('#langs')
		langTab.hidden = true
		showPuzzle(game.prettyId)
	}
}

function showGolf(game) {
	
	const langTab = document.querySelector('#langs')
	langTab.hidden = false
	langTab.setAttribute('id', 'langs')
	langTab.classList.add('tab')

	while (langTab.children.length > 0)
		langTab.children[0].remove()

	for (const lang of game.langList) {
		const tab = document.createElement('button')
		tab.setAttribute('id', game.prettyId + '+' + lang)
		tab.classList.add('lang', 'tablinks')
		tab.setAttribute('onclick', `selectGolfLang(event.currentTarget, "${game.prettyId}", "${lang}")`)
		tab.textContent = lang
		langTab.appendChild(tab)
	}

	let content = document.querySelector('#content')
	console.log(content)
	while (content.children.length > 0)
		content.children[0].remove()
}

async function selectGolfLang(target, gameId, lang) {
	openTab(target, "lang", gameId + "+" + lang)
	showPuzzle(gameId, lang)
}

async function showPuzzle(gameId, lang) {
	const game = games[gameId]
	let gameRef = CGDatabase.collection('records').doc(game.prettyId)
	if (lang)
		gameRef = gameRef.collection('lang').doc(lang)
	const doc = await gameRef.get()
	if (! doc.exists)
		fail("Missing game: " + gameRef)
	const gameHistory = doc.data()

	showResults(game, lang, gameHistory)
}

function showResults(game, lang, data) {
	let players = Object.values(data)
	players.sort((u1, u2) => (u1.score - u2.score) * game.orderingFactor || u1.date < u2.date)
	console.log(game.prettyId, lang, players)

	let content = document.querySelector('#content')
	while (content.children.length > 0)
		content.children[0].remove()

	const table = document.createElement('table')
	let rank = 0;
	for (const p of players) {
		rank += 1;
		const line = document.createElement('tr')
		const avatar = p.avatar
			? `https://static.codingame.com/servlet/fileservlet?id=${p.avatar}&format=navigation_avatar`
			: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973461_960_720.png"
		const avatar_tag = `<img src="${avatar}" height=32 width=32>`
		line.innerHTML = `<td>${rank}</td><td>${avatar_tag}</td><td>${p.pseudo}</td><td>${p.score}</td><td>${p.date}</td>`
		table.appendChild(line)
	}
	content.appendChild(table)
}

function openTab(button, group, tabId) {
	// Declare all variables
	var i, tabcontent, tablinks;

	// Get all elements with class="tablinks" and remove the class "active"
	tablinks = document.getElementsByClassName("tablinks " + group);
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	// Show the current tab, and add an "active" class to the button that opened the tab
	document.getElementById(tabId).style.display = "block";
	button.className += " active";
}

async function showNews() {
	openTab(document.querySelector('#tabs'), "puzzle", "news")
	const langTab = document.querySelector('#langs')
	langTab.hidden = true

	let allNews = []

	const newsDocs = await CGDatabase.collection('records-store').get();
	const table = document.createElement('table')
	newsDocs.forEach(doc => {
		const date = doc.id.split(' ')[0]
		data = doc.data()
		console.log(date, data)
		for (const news of data.records) {
			news.date = date
			allNews.push(news)
		}
	})

	allNews.sort((n1, n2) => n1.date < n2.date)

	let curDate = ""
	allNews.forEach(news => {
		const row = document.createElement('tr')
		let score = ` → ${news.score}`
		if (news.oldScore)
			score = news.oldScore + score
		let rank
		if (news.newRank) {
			rank = '#';
			if (news.oldRank)
				rank += news.oldRank
			rank += ' → '
			rank += news.newRank.replace('/', ' / ')
		} else {
			rank = ""
		}
		let showDate
		if (news.date === curDate) {
			showDate = '"'
		} else {
			curDate = showDate = news.date
		}
		const avatar = news.avatar ? `<img src="https://static.codingame.com/servlet/fileservlet?id=${news.avatar}&format=navigation_avatar">`: ""
		row.innerHTML = `<td>${showDate}</td><td>${news.game}</td><td>${news.lang||""}</td><td>${avatar}</td><td>${news.pseudo}</td><td>${score}</td><td>${rank}</td>`
		table.appendChild(row)
	})
	
	const content = document.querySelector('#content')
	while (content.children.length > 0)
		content.children[0].remove()
	content.appendChild(table)
}
