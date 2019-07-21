async function initUI() {
	show('all')
}

async function show(kind) {
	const table = document.querySelector('#podium')
	clearElement(table)
	table.innerHTML = '<tr><th>Period</th><th colspan=2>#1</th><th colspan=2>#2</th><th colspan=2>#3</th><th colspan=2>#4</th><th colspan=2>#5</th></tr>'

	if (kind.target)
		kind = kind.target.id

	openTab('kind', kind)

	const docRef = CGDatabase.collection('records').doc(`podium-${kind}`)
	const doc = await docRef.get()
	if (! doc.exists)
		fail("Missing podium")
	let podium = doc.data().podium
	console.log(podium)
	podium.forEach(r => {
		const row = document.createElement('tr')
		let html = ''
		html += `<td>${r.startDate} — ${r.endDate}</td>`
		for (p of r.ranking) {
			const pseudo = `<a target=_blank href="https://www.codingame.com/profile/${p.publicHandle}">${p.pseudo}</a>`
			const avatar = p.avatar
				? `https://static.codingame.com/servlet/fileservlet?id=${p.avatar}&format=navigation_avatar`
				: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973461_960_720.png"
			const avatar_tag = `<img src="${avatar}" height=32 width=32>`
			html += `<td>${avatar_tag}</td><td>${pseudo}</td>`
		}
		row.innerHTML = html
		table.appendChild(row)
	})
}

function openTab(group, tabId) {
	// Declare all variables
	var i, tabcontent, tablinks;

	// Get all elements with class="tablinks" and remove the class "active"
	tablinks = document.getElementsByClassName("tablinks " + group);
	for (i = 0; i < tablinks.length; i++) {
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}

	// Show the current tab, and add an "active" class to the button that opened the tab
	const button = document.getElementById(tabId)
	button.style.display = "block";
	button.className += " active";
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

function clearElement(element) {
	while (element.children.length > 0)
		element.children[0].remove()
}

window.addEventListener('unhandledrejection', event => console.error('Unhandled rejection:', event.promise, event.reason));
window.addEventListener('rejectionhandled',   event => console.error('Handled rejection:', event.promise, event.reason));

CGDatabase.init()

initUI().then(()=>{})

