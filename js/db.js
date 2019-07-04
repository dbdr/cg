// Your web app's Firebase configuration
var firebaseConfig = {
	apiKey: "AIzaSyAuXxHGWFIJEWeTCtwU9fiUnIesNJg47_M",
	authDomain: "cg-leadergraph.firebaseapp.com",
	databaseURL: "https://cg-leadergraph.firebaseio.com",
	projectId: "cg-leadergraph",
	storageBucket: "",
	messagingSenderId: "566498242217",
	appId: "1:566498242217:web:af60ec7206e2bd90"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

function db_get(key, http_request, max_age, callback) {
	db.doc(key).get().then(doc => {
		const now = Math.floor(new Date().getTime() / 1000);
		if (doc.exists) {
			const data = doc.data();
			if (data.cacheTime && now - data.cacheTime < max_age)
				return callback(data);
		}
		console.log('CG call for ' + key);
		http_request.subscribe(res => {
			res.cacheTime = now;
			db.doc(key).set(res);
			callback(res);
		});
	});
}
