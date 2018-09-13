var express = require('express');
var router = express.Router();
var dirty = require('dirty');

router.get('/', function(req, res, next) {
	var db = dirty('kne_element.db');
	db.on('load', function () {
		loaddata = {kne_element: db.get("kne_element"), workspace: db.get("workspace")}
		let kne_element = db.get("kne_element");
		let workspace = db.get("workspace");
		console.log(workspace);
		let slide_height = 350;
		let slide_num = 0;

		//calculate slide number 
		for(let wi = 0; wi < workspace.length; wi++){
			let sn = Math.floor(workspace[wi][2] / slide_height);
			if(slide_num < sn){
				slide_num = sn;
			} 
		}

		let slide_info = [];
		for(let si = 0; si < slide_num + 1; si++){
			slide_info.push([]);
		}

		for(let wi = 0; wi < workspace.length; wi++){
			let text = "";
			for(let ki = 0; ki < kne_element.length; ki++){
				if(typeof kne_element[ki].id !== "undefined"){
					if(workspace[wi][0] == kne_element[ki].id){
						text = kne_element[ki].text;
					}
				}
			}
			let sn = Math.floor(workspace[wi][2] / slide_height);
			slide_info[sn].push([text, workspace[wi][1] * 2, (workspace[wi][2] - slide_height * sn)*2]);
		}

		console.log(slide_info);
		res.render('presentation', {"slide_info":slide_info});
	});
});

module.exports = router;
