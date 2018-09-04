var express = require('express');
var router = express.Router();
var dirty = require('dirty');

router.get('/', function(req, res, next) {
	var db = dirty('kne_element.db');
	db.on('load', function () {
		res.render('element_input', { "initial_value": ["",""] , "kne_element":db.get("kne_element")});
	});
});

/* GET home page. */
router.post('/', function (req, res, next) {
	var db = dirty('kne_element.db');
	db.on('load', function () {
		var pe = db.get('kne_element');
		if (!Array.isArray(pe)) {
			pe = [];
		}
		pe.push({ "id": pe.length + 1, "mode": req.body.mode, "author_id": req.body.author_id, "text": req.body.kne_element });
		console.log(pe)

		db.set('kne_element', pe, function () {
			console.log('saved')
		});

		//render form 
		res.render('element_input', { "initial_value": [req.body.mode, req.body.author_id]  , "kne_element":db.get("kne_element")});
	});

});

module.exports = router;
