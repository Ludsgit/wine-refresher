const wineID = [80062, 80063];
const wineBuff = [70258, 70259];

module.exports = function Wine(mod){
	
	mod.game.initialize(["me.abnormalities", "inventory"])
	
	let me = mod.game.me;
	let inv = mod.game.inventory;
	let refreshing = null;
	let interval = null;
	let amount = 0;
	let last_time = null;
	let using_wine = 0;
	let enabled = true;
	
	mod.command.add("wine", () => {
		enabled = !enabled;
		mod.command.message("Wine refreshing: " + (enabled ? "enabled" : "disabled"));
		if(refreshing){
			mod.clearTimeout(refreshing);
			refreshing = null;
		};
		if(interval){
			mod.clearInterval(interval);
			interval = null;
		};
		return;
	});
	
	me.on("enter_combat", ()=>{
		if(enabled && me.inDungeon && (using_wine || wineBuff.some(r => Object.keys(me.abnormalities).includes(r.toString())))){
			let ind = null;
			if(wineBuff.some(r => Object.keys(me.abnormalities).includes(r.toString()))){
				ind = Object.keys(me.abnormalities).includes(wineBuff[0].toString()) ? 0 : 1;
				using_wine = wineID[ind];
			} else {
				ind = wineID.indexOf(using_wine);
			};
			amount = inv.getTotalAmountInBagOrPockets(using_wine);
			if(amount === 0) {
				return;
			};
			if(refreshing){
				mod.clearTimeout(refreshing);
			};
			refreshing = mod.setTimeout(function(){
				refresh(using_wine, 0);
				if(--amount > 0){
					if(interval){
						mod.clearInterval(interval);
					};
					interval = mod.setInterval(function(){
						refresh(using_wine, 0);
						if(--amount === 0){
							mod.clearInterval(interval);
						};
					}, 245000);
				};
			}, Math.max(Object.keys(me.abnormalities).includes(wineBuff[ind].toString()) ? Number(me.abnormalities[wineBuff[ind].toString()].remaining) - 15000 : 0, 61000 + last_time - Date.now()));
		};
	});
	
	me.on("leave_combat", () => {
		if(refreshing){
			mod.clearTimeout(refreshing);
			refreshing = null;
		};
		if(interval){
			mod.clearInterval(interval);
			interval = null;
		};
	});
	
	me.on("die", () => {
		if(refreshing){
			mod.clearTimeout(refreshing);
			refreshing = null;
		};
		if(interval){
			mod.clearInterval(interval);
			interval = null;
		};
	});
	
	me.on("change_zone", () => {
		mod.setTimeout( () => {
			if(!me.indungeon){
				using_wine = 0;
			} else if (wineBuff.some(r => Object.keys(me.abnormalities).includes(r.toString()))){
				using_wine = wineID[Object.keys(me.abnormalities).includes(wineBuff[0].toString()) ? 0 : 1]
			};
			if(refreshing){
				mod.clearTimeout(refreshing);
				refreshing = null;
			};
			if(interval){
				mod.clearInterval(interval);
				interval = null;
			};
		}, 10000);
	});
	
	mod.hook('C_USE_ITEM', 3, (event) => {
		if(wineID.includes(event.id)){
			last_time = Date.now();
			if(me.inDungeon){
				using_wine = event.id;
			};
		};
	});
	
	function refresh(id, n){
		if(n === 5){
			enabled = false;
			mod.command.message("Too many failed attempts. Mod disabled");
			return;
		};
		mod.toServer('C_USE_ITEM', 3, {
			gameId: me.gameId,
			id: id,
			dbid: 0,
			target: 0,
			amount: 1,
			dest: {x: 0, y: 0, z: 0},
			loc: {x: 0, y: 0, z: 0},
			w: 0, 
			unk1: 0,
			unk2: 0,
			unk3: 0,
			unk4: 1
		});
		last_time = Date.now();
		mod.setTimeout(() => {
			if(!Object.keys(me.abnormalities).includes(wineBuff[wineID.indexOf(id)].toString())){
				mod.command.message(`Failed to refresh wine, remaining tries: ${4 - n}`)
				refresh(id, n + 1);
			} else {
				return;
			};
			return;
		}, 250)
	};
};