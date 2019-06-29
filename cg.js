const cachedRankings = new Map();

function fetchRankings() {
	const active = specializedRanking && yType !== 'all';
	let column = '', filter = '';
	if (active) {
		column = "CODINGPOINTS";
		switch (yType) {
			case "contest":
				filter = "CONTESTS";
				break;
			case "multi":
				filter = "MULTITRAINING";
				break;
			case "golf":
				filter = "CODEGOLF";
				break;
			case "optim":
				filter = "OPTIM";
				break;
			case "clash":
				filter = "CLASH";
				break;
		}
	}
	const options = `[${rankingPage},{'keyword':'','active':${active},'column':'${column}','filter':'${filter}'},null,true,'global']`;
	console.log(options);

	const leaderboard = cachedRankings.get(options);
	if (leaderboard) {
		addJoinDates(0, leaderboard);
		return;
	}

	startSpin();
	const xhr = new XMLHttpRequest();
	const reqURL = 'https://cors-anywhere.herokuapp.com/https://www.codingame.com/services/Leaderboards/getGlobalLeaderboard';
	xhr.open("POST", reqURL);
	xhr.responseType = "json";
	xhr.onreadystatechange = (e) => {
		if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			const res = xhr.response;
			console.log(res);
			cachedRankings.set(options, res);
			addJoinDates(0, res);
		}
	}
	xhr.send(options);
}

function addJoinDates(player, leaderboard) {
	if (player === leaderboard.users.length) {
		console.log(JSON.stringify(joinDates));
		updateRanking(leaderboard);
	} else {
		const user = leaderboard.users[player].codingamer;
		let joinDate = joinDates[user.userId];
		if (joinDate) {
			user.joinDate = joinDate;
			addJoinDates(player + 1, leaderboard);
		} else {
			fetchJoinDate(player, user, leaderboard);
		}
	}
}

function fetchJoinDate(player, user, leaderboard) {
	const xhr = new XMLHttpRequest();
	const reqURL = 'https://cors-anywhere.herokuapp.com/https://www.codingame.com/services/CodinGamer/findCodingamePointsStatsByHandle';
	xhr.open("POST", reqURL);
	xhr.responseType = "json";
	xhr.onreadystatechange = (e) => {
		if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			const res = xhr.response;
			console.log(res);
			const joinDate = res.codingamePointsRankingDto.rankHistorics.dates[0];
			joinDates[user.userId] = joinDate;
			user.joinDate = joinDate;
			addJoinDates(player + 1, leaderboard);
		}
	}
	xhr.send("['" + user.publicHandle + "']");
}

settingsChanged();
