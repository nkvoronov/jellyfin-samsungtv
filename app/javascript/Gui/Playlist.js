var Playlist = {
	AlbumData : null,
	selectedItem : 0, //the current row (-1 is the menu row).
	topLeftItem : 0,
	selectedItem2 : 0, //the current column.
	MAXCOLUMNCOUNT : 1,
	MAXROWCOUNT : 12, //Max = 12, causes graphical jump due to large html element, couldn't find issue,
	startParams : [],
	topMenuItems : ["PlayAll","ShuffleAll","Delete"],
	playItems : ["PlayFrom_","Play_","View_","Remove_"]
};

Playlist.getMaxDisplay = function() {
	return this.MAXCOLUMNCOUNT * this.MAXROWCOUNT;
};

//------------------------------------------------------------
//      Episode Functions
//------------------------------------------------------------

Playlist.start = function(title,url,type,playlistId) { //Type is either Audio or Video
	alert("Page Enter : Playlist");
	Helper.setControlButtons(null, null, null, MusicPlayer.Status == "PLAYING" || MusicPlayer.Status == "PAUSED" ? "Music" : null, "Return");

	//Save Start Params
	this.startParams = [title,url,type,playlistId];

	//Reset Vars
	this.topLeftItem = 0;
	this.selectedItem = -1;
	this.selectedItem2 = 0;

	//Load Data
	this.AlbumData = Server.getContent(url);
	if (this.AlbumData == null) { return; }

	if (this.AlbumData.Items.length > 0) {
		//Set PageContent
		document.getElementById("pageContent").className = "";
		document.getElementById("pageContent").style.fontSize="0.9em";
		Support.widgetPutInnerHTML("pageContent", "<div id='playlistTitle' class='playlistTitle'></div> \
			<div id='playlistSubtitle' class='playlistSubtitle'></div> \
			<div id='playlist' class='playlist'> \
			<div id='playlistGlobals' class='playlistGlobals'> \
			<div id='playAll' class='musicGlobal'>Play All</div> \
			<div id='shuffleAll' class='musicGlobal'>Shuffle</div> \
			<div id='delete' class='musicGlobal'>Delete</div></div> \
			<div id='playlistOptions' class='playlistOptions'></div></div>");
		Support.widgetPutInnerHTML("counter", "1/" + this.topMenuItems.length);

		//Set Page Title
		Support.widgetPutInnerHTML("playlistTitle", title);
		Support.widgetPutInnerHTML("playlistSubtitle",type + " Playlist");

		//Get Page Items
		this.updateDisplayedItems();

		//Update Selected Item
		this.updateSelectedItems();

		//Set Focus for Key Events
		document.getElementById("evnPlaylist").focus();
	} else {
		//No items in playlist
		//Set PageContent
		document.getElementById("pageContent").className = "";
		Support.widgetPutInnerHTML("pageContent", "<div id='playlistTitle' class='playlistTitle'></div> \
			<div id='playlistSubtitle' class='playlistSubtitle'></div> \
			<div id='playlist' class='playlist'> \
			<div id='playlistGlobals' class='playlistGlobals'> \
			<div id='playAll' class='usicGlobal'>Play All</div> \
			<div id='shuffleAll' class='musicGlobal'>Shuffle</div> \
			<div id='delete' class='musicGlobal'>Delete</div></div> \
			<div id='playlistOptions' class='playlistOptions'>There are no items in this playlist</div></div>");
		Support.widgetPutInnerHTML("counter", "0/0");

		//Set Page Title
		Support.widgetPutInnerHTML("playlistTitle", title);
		Support.widgetPutInnerHTML("playlistSubtitle", type + " Playlist");

		//Update Selected Item
		this.updateSelectedItems();

		//Set Focus for Key Events
		document.getElementById("evnPlaylist").focus();
	}
};

Playlist.updateDisplayedItems = function() {
	var htmlToAdd = "";
	if (this.startParams[2] == "Audio") {
		htmlToAdd = "<table><th style='width:200px'></th><th style='width:66px'></th><th style='width:72px'></th><th style='width:120px'></th><th style='width:66px'></th><th style='width:500px'></th><th style='width:130px'></th>";
		for (var index = this.topLeftItem; index < Math.min(this.topLeftItem + this.getMaxDisplay(),this.AlbumData.Items.length); index++){
			if (this.AlbumData.Items[index].ParentIndexNumber && this.AlbumData.Items[index].IndexNumber) {
				TrackDetails = this.AlbumData.Items[index].ParentIndexNumber+"." + this.AlbumData.Items[index].IndexNumber;
			} else if (this.AlbumData.Items[index].IndexNumber) {
				TrackDetails = this.AlbumData.Items[index].IndexNumber;
			} else {
				TrackDetails = "?";
			}

			htmlToAdd += "<tr><td id=PlayFrom_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>Play From Here</td><td id=play_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>Play</td><td id=view_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>View</td><td id=remove_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>Remove</td>" +
					"<td class='musicTableTd'>"+TrackDetails+ "</td><td id="+ this.AlbumData.Items[index].Id +" class='musicTableTd'>" + this.AlbumData.Items[index].Name + "</td>" +
							"<td class='musicTableTd'>"+Support.convertTicksToTimeSingle(this.AlbumData.Items[index].RunTimeTicks/10000,true)+"</td></tr>";
		}
	} else {
		htmlToAdd = "<table><th style='width:200px'></th><th style='width:66px'></th><th style='width:72px'></th><th style='width:120px'></th><th style='width:300px'></th><th style='width:100px'></th><th style='width:500px'></th><th style='width:130px'></th>";
		for (var index = this.topLeftItem; index < Math.min(this.topLeftItem + this.getMaxDisplay(),this.AlbumData.Items.length); index++){

			if (this.AlbumData.Items[index].Type == "Episode") {
				var epNo = Support.getNameFormat(null,this.AlbumData.Items[index].ParentIndexNumber,null,this.AlbumData.Items[index].IndexNumber);
				var seriesName = (this.AlbumData.Items[index].SeriesName !== undefined)? this.AlbumData.Items[index].SeriesName : "Unknown";

				htmlToAdd += "<tr><td id=playFrom_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>Play From Here</td><td id=play_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>Play</td><td id=view_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>View</td><td id=remove_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>Remove</td>" +
						"<td id="+ this.AlbumData.Items[index].Id +" class='musicTableTd'>" + seriesName + "</td><td id=epNo_"+ this.AlbumData.Items[index].Id +" class='musicTableTd'>" + epNo + "</td><td id=epName_"+ this.AlbumData.Items[index].Id +" class='musicTableTd'>" + this.AlbumData.Items[index].Name + "</td>" +
								"<td class='musicTableTd'>" + Support.convertTicksToTimeSingle(this.AlbumData.Items[index].RunTimeTicks/10000,true)+"</td></tr>";
			} else {
				htmlToAdd += "<tr><td id=PlayFrom_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>Play From Here</td><td id=play_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>Play</td><td id=view_" + this.AlbumData.Items[index].Id+" class='musicTableTd'>View</td><td id=remove_"+this.AlbumData.Items[index].Id+" class='musicTableTd'>Remove</td>" +
						"<td id="+ this.AlbumData.Items[index].Id +" class='musicTableTd' colspan=3 >" + this.AlbumData.Items[index].Name + "</td>" +
								"<td class='musicTableTd'>"+Support.convertTicksToTimeSingle(this.AlbumData.Items[index].RunTimeTicks/10000,true)+"</td></tr>";
			}
		}
	}
	Support.widgetPutInnerHTML("playlistOptions", htmlToAdd + "</table>");
};

//Function sets CSS Properties so show which user is selected
Playlist.updateSelectedItems = function () {
	if (this.selectedItem == -1) {
		//Highlight the selected global item (PlayAll, Shuffle etc.)
		for (var index = 0; index < this.topMenuItems.length; index++) {
			if (index == this.selectedItem2) {
				document.getElementById(this.topMenuItems[index]).className = "musicGlobal highlight" + Main.highlightColour+"Background";
			} else {
				document.getElementById(this.topMenuItems[index]).className = "musicGlobal";
			}
		}
	} else {
		//Reset the global items.
		for (var index = 0; index < this.topMenuItems.length; index++) {
			document.getElementById(this.topMenuItems[index]).className = "musicGlobal";
		}

		//Highlight the selected list item.
		for (var index = this.topLeftItem; index < Math.min(this.topLeftItem + this.getMaxDisplay(),this.AlbumData.Items.length); index++){
			if (index == this.selectedItem) {
				for (var index2 = 0; index2 < this.playItems.length; index2++) {
					if (index2 == this.selectedItem2) {
						document.getElementById(this.playItems[index2]+this.AlbumData.Items[index].Id).className = "musicTableTd highlight" + Main.highlightColour + "Background";
					} else {
						document.getElementById(this.playItems[index2]+this.AlbumData.Items[index].Id).className = "musicTableTd";
					}
				}
			} else {
				document.getElementById(this.AlbumData.Items[index].Id).className = "musicTableTd";
				for (var index2 = 0; index2 < this.playItems.length; index2++) {
					document.getElementById(this.playItems[index2]+this.AlbumData.Items[index].Id).className = "musicTableTd";
				}
			}
		}
	}

	//Set Counter to be album count or x/3 for top part
	if (this.selectedItem == -1) {
	  Support.widgetPutInnerHTML("counter", (this.selectedItem2 + 1) + "/" + this.topMenuItems.length);
	} else {
	  Support.widgetPutInnerHTML("counter", (this.selectedItem + 1) + "/" + this.AlbumData.Items.length);
	}

};

Playlist.keyDown = function() {
	var keyCode = event.keyCode;
	alert("Key pressed: " + keyCode);

	if (document.getElementById("notifications").style.visibility == "") {
		Notifications.delNotification();
		widgetAPI.blockNavigation(event);
		//Change keycode so it does nothing!
		keyCode = "VOID";
	}

	//Update Screensaver Timer
	Support.screensaver();

	//If screensaver is running
	if (Main.getIsScreensaverRunning()) {
		//Update Main.js isScreensaverRunning - Sets to True
		Main.setIsScreensaverRunning();
		//End Screensaver
		ImagePlayerScreensaver.stopScreensaver();
		//Change keycode so it does nothing!
		keyCode = "VOID";
	}

	switch(keyCode) {
		case tvKey.KEY_LEFT:
			this.processLeftKey();
			break;
		case tvKey.KEY_RIGHT:
			this.processRightKey();
			break;
		case tvKey.KEY_UP:
			if (this.AlbumData.Items.length > 0) {
				this.processUpKey();
			}
		break;
		case tvKey.KEY_DOWN:
			if (this.AlbumData.Items.length > 0) {
				this.processDownKey();
			}
			break;
		case tvKey.KEY_RETURN:
			alert("RETURN");
			widgetAPI.blockNavigation(event);
			Support.processReturnURLHistory();
			break;
		case tvKey.KEY_ENTER:
		case tvKey.KEY_PANEL_ENTER:
			alert("ENTER");
			this.processSelectedItem();
			break;
		case tvKey.KEY_TOOLS:
			widgetAPI.blockNavigation(event);
			this.openMenu();
			break;
		case tvKey.KEY_YELLOW:
			//Favourites - May not be needed on this page
			break;
		case tvKey.KEY_BLUE:
			if (this.selectedItem == -1) {
				MusicPlayer.showMusicPlayer("Playlist", this.topMenuItems[this.selectedItem2],"musicGlobal highlight" + Main.highlightColour + "Background");
			} else {
				MusicPlayer.showMusicPlayer("Playlist", this.playItems[this.selectedItem2]+this.AlbumData.Items[this.selectedItem].Id,"musicTableTd highlight" + Main.highlightColour + "Background");
			}
			break;
		case tvKey.KEY_EXIT:
			alert ("EXIT KEY");
			widgetAPI.sendExitEvent();
			break;
	}
};

Playlist.openMenu = function() {
	Support.updateURLHistory("Playlist", this.startParams[0], this.startParams[1], null, null, this.selectedItem, this.topLeftItem, true);
	if (this.selectedItem == -1) {
		MainMenu.requested("Playlist", this.topMenuItems[this.selectedItem], "musicGlobal green");
	} else {
		MainMenu.requested("Playlist", this.playItems[this.selectedItem2]+this.AlbumData.Items[this.selectedItem].Id, "musicTableTd highlight" + Main.highlightColour + "Background");
	}
};

Playlist.processUpKey = function() {
	this.selectedItem--;
	if (this.selectedItem < -1) { //When would this even happen?
		this.selectedItem = -1;
	} else {
		if (this.selectedItem == -1) {
			this.selectedItem2 = 0; //Always start from Play All so that Delete can only be highlighted by the user.
			document.getElementById(this.AlbumData.Items[0].Id).style.color = "white";
			for (var index = 0; index < this.playItems.length; index++) {
				document.getElementById(this.playItems[index]+this.AlbumData.Items[0].Id).className = "musicTableTd";
			}
		}
		if (this.selectedItem < this.topLeftItem) {
			if (this.topLeftItem - this.MAXCOLUMNCOUNT < 0) {
				this.topLeftItem = 0;
			} else {
				this.topLeftItem = this.topLeftItem - this.MAXCOLUMNCOUNT;
			}
			this.updateDisplayedItems();
		}
		this.updateSelectedItems();
	}
};

Playlist.processDownKey = function() {
	this.selectedItem++;
	if (this.selectedItem == 0) {
		this.selectedItem2 = 0;
	}
	if (this.selectedItem >= this.AlbumData.Items.length) {
		this.selectedItem--;
		if (this.selectedItem >= (this.topLeftItem  + this.getMaxDisplay())) {
			this.topLeftItem = this.topLeftItem + this.getMaxDisplay();
			this.updateDisplayedItems();
		}
	} else {
		if (this.selectedItem >= (this.topLeftItem + this.getMaxDisplay())) {
			this.topLeftItem++;
			this.updateDisplayedItems();
		}
	}
	this.updateSelectedItems();
};

Playlist.processLeftKey = function() {
	this.selectedItem2--;
	if (this.selectedItem2 == -1) {
		this.selectedItem2 = 0;
		this.openMenu();
	} else {
		this.updateSelectedItems();
	}
};

Playlist.processRightKey = function() {
	this.selectedItem2++;
	if (this.selectedItem == -1) {
		if (this.selectedItem2 > this.topMenuItems.length-1) {
			this.selectedItem2--;
		} else {
			this.updateSelectedItems();
		}
	} else {
		if (this.selectedItem2 > this.playItems.length-1) {
			this.selectedItem2--;
		} else {
			this.updateSelectedItems();
		}
	}
};

Playlist.processSelectedItem = function() {
	alert("List item = " + this.selectedItem + " : Menu item = " + this.selectedItem2);
	if (this.selectedItem == -1) {
		//Is Top Menu Bar
		switch (this.selectedItem2) {
		case 0:
			if (this.AlbumData.Items.length > 0) {
				var url = Server.getCustomURL("/Playlists/"+this.startParams[3]+"/Items?userId="+Server.getUserID()+"&SortBy=SortName&SortOrder=Ascending&fields=ParentId,SortName,MediaSources&format=json");
				if (this.startParams[2] == "Video") {
					Support.updateURLHistory("Playlist",this.startParams[0],this.startParams[1],this.startParams[2],this.startParams[3],0,0,null);
					Player.start("PlayAll",url,0,"Playlist");
				} else if (this.startParams[2] == "Audio") {
					MusicPlayer.start("Album", url, "Playlist", false);
				}
			}
			break;
		case 1:
			if (this.AlbumData.Items.length > 0) {
				var url = Server.getCustomURL("/Users/"+Server.getUserID()+"/Items?userId="+Server.getUserID()+"&Fields=MediaSources,Chapters&Limit=100&Filters=IsNotFolder&Recursive=true&SortBy=Random&ParentId="+this.startParams[3]+"&ExcludeLocationTypes=Virtual&format=json");
				if (this.startParams[2] == "Video") {
					Support.updateURLHistory("Playlist",this.startParams[0],this.startParams[1],this.startParams[2],this.startParams[3],0,0,null);
				  Player.start("PlayAll",url,0,"Playlist");
				} else if (this.startParams[2] == "Audio") {
					MusicPlayer.start("Album", url, "Playlist", false);
				}
			}
			break;
		case 2:
			this.deletePlaylist(this.startParams[3]);
			break;
		}
	} else {
		switch (this.selectedItem2) {
		case 0:
			var url = Server.getCustomURL("/Playlists/"+this.startParams[3]+"/Items?userId="+Server.getUserID()+"&StartIndex="+this.selectedItem+"&SortBy=SortName&SortOrder=Ascending&fields=ParentId,SortName,MediaSources&format=json");
			if (this.startParams[2] == "Video") {
				Support.updateURLHistory("Playlist",this.startParams[0],this.startParams[1],this.startParams[2],this.startParams[3],0,0,null);
				Player.start("PlayAll",url,0,"Playlist");
			} else if (this.startParams[2] == "Audio") {
				MusicPlayer.start("Album", url, "Playlist", false);
			}
			break;
		case 1:
			var url = Server.getItemInfoURL(this.AlbumData.Items[this.selectedItem].Id);
			if (this.startParams[2] == "Video") {
				Support.updateURLHistory("Playlist",this.startParams[0],this.startParams[1],this.startParams[2],this.startParams[3],this.selectedItem,this.topLeftItem,null);
			  Player.start("PLAY",url,0,"Playlist");
			} else if (this.startParams[2] == "Audio"){
				MusicPlayer.start("Song", url, "Playlist", false);
			}

			break;
		case 2:
			Support.updateURLHistory("Playlist",this.startParams[0],this.startParams[1],this.startParams[2],this.startParams[3],this.selectedItem,this.topLeftItem,null);
			if (this.startParams[2] == "Video") {
				var url = Server.getItemInfoURL(this.AlbumData.Items[this.selectedItem].Id);
				ItemDetails.start(this.AlbumData.Items[this.selectedItem].Name, url, 0);
			} else if (this.startParams[2] == "Audio"){
				var url = Server.getChildItemsURL(this.AlbumData.Items[this.selectedItem].AlbumId,"&SortBy=SortName&SortOrder=Ascending&IncludeItemTypes=Audio&Recursive=true&CollapseBoxSetItems=false");
				alert (url);
				Music.start(this.AlbumData.Items[this.selectedItem].Name,url, "MusicAlbum");
			}

			break;
		case 3:
			Server.removeFromPlaylist(this.startParams[3],this.AlbumData.Items[this.selectedItem].PlaylistItemId);
			//Timeout required to allow for action on the server!
			setTimeout(function(){
				Playlist.start(Playlist.startParams[0],Playlist.startParams[1],Playlist.startParams[2],Playlist.startParams[3]);
				},250);
			break;
		}
	}
};

Playlist.deletePlaylist = function (playlistId) {
	var ids = "";
	for(var index = 0; index < this.AlbumData.Items.length; index++) {
		alert (this.AlbumData.Items[index].PlaylistItemId);
		ids += this.AlbumData.Items[index].PlaylistItemId + ",";
	}
	ids = ids.substring(0, ids.length-1);

	//Remove latest history to stop issues
	Support.removeLatestURL();

	//Remove all items from playlist
	Server.removeFromPlaylist(playlistId,ids);

	//Give the server half a sec to finish removing the items before we delete the playlist and request an updates list.
	setTimeout(function(){
		Server.deletePlaylist(playlistId);
	}, 250);

	setTimeout(function(){
		var url = Server.getItemTypeURL("SortBy=SortName&SortOrder=Ascending&IncludeItemTypes=Playlist&Recursive=true&Fields=SortName");
		DisplayOneItem.start("Playlists",url,0,0);
	}, 450);
};