// jscript/presets.js

function getFirstChildByTagName(parent, tagName) {
	var nodes = parent.childNodes;
	for(var i = 0; i<nodes.length; i++)
	{
		if ( nodes[i].nodeType == 1 && nodes[i].tagName == tagName )
		{
			return nodes[i];
		}
	}
}
function loadPresets(file_name,callback)
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function(){
		if(xhttp.readyState == 4 && xhttp.status == 200){
			callback(xhttp.responseXML)
        }
	}
	xhttp.open("GET", file_name, true);
	xhttp.setRequestHeader("Cache-Control","no-cache")
	xhttp.send();
	return xhttp.responseXML;
}

/* Runtime */
//xmlDoc = loadXMLFile("games/easy_games.xml");
//var games = xmlDoc.getElementsByTagName("game");
//for(var i =0; i<games.length; i++)
//{
//	var game = games[i];
//	var id 		 = getFirstChildByTagName( game, "id").childNodes[0].nodeValue;
//	var rows 	 = getFirstChildByTagName( game, "rows").childNodes[0].nodeValue;
//	var columns  = getFirstChildByTagName( game, "columns").childNodes[0].nodeValue;
//	var rule_set = getFirstChildByTagName( game, "rules").childNodes[0].nodeValue;
//	var seed_set = getFirstChildByTagName( game, "seeds").childNodes[0].nodeValue;
//	var goal_set = getFirstChildByTagName( game, "goals").childNodes[0].nodeValue;
//
//	GAME_PRESETS.push ( new GameData( id, rows, columns, rule_set, seed_set, goal_set ) );
//}
