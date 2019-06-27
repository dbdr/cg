function fetchRankings() {
	const xhr = new XMLHttpRequest();
	const reqURL = 'https://cors-anywhere.herokuapp.com/https://www.codingame.com/services/Leaderboards/getGlobalLeaderboard';
	xhr.open("POST", reqURL);
	xhr.responseType = "json";
	xhr.onreadystatechange = (e) => {
		if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			const res = xhr.response;
			console.log(res);
			updateRanking(res);
		}
	}
	xhr.send("[1,{'keyword':'','active':false,'column':'','filter':''},null,true,'global']");
}

fetchRankings();
