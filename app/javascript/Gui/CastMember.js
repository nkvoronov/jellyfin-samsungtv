var CastMember = {
	CastData : null,
	ItemData : null,
	selectedItem : 0,
	topLeftItem : 0,
	MAXCOLUMNCOUNT : 9,
	MAXROWCOUNT : 1,
};

CastMember.getMaxDisplay = function() {
	return this.MAXCOLUMNCOUNT * this.MAXROWCOUNT;
};

CastMember.start = function(title, url, selectedItem, topLeftItem) {
	alert("Page Enter : CastMember");
	Helper.setControlButtons(null, null, null, MusicPlayer.Status == "PLAYING" || MusicPlayer.Status == "PAUSED" ? "Music" : null, "Return");

	//Save Start Params
	this.startParams = [title,url];

	//Reset Values
	this.selectedItem = selectedItem;
	this.topLeftItem = topLeftItem;

	//Load Data
	this.CastData = Server.getContent(url);
	if (this.CastData == null) { return; }
	var Itemurl = Server.getItemTypeURL("&SortBy=SortName&SortOrder=Ascending&Recursive=true&Limit=100&ExcludeLocationTypes=Virtual&fields=ParentId&Person=" + this.CastData.Name.replace(/ /g, '+'));
	this.ItemData = Server.getContent(Itemurl);
	if (this.ItemData == null) { Support.processReturnURLHistory(); }

	document.getElementById("pageContent").className = "";
	Support.widgetPutInnerHTML("pageContent", "<div id='castMemberName' class='castMemberName'></div> \
		<div id='castMemberDetails' class='castMemberDetails'></div> \
		<div id='castMemberPoster' class='castMemberPoster'></div> \
		<div id='castMemberBio' class='castMemberBio'></div> \
		<div id='castMemberList' class='castMemberList'></div>");
	Support.widgetPutInnerHTML("counter", "1/1");

	//Add cast member name and image.
	Support.widgetPutInnerHTML("castMemberName", this.CastData.Name);
	var imgsrc = Server.getImageURL(this.CastData.Id, "Primary", 350, 480, 0, false, 0);
	document.getElementById("castMemberPoster").style.backgroundImage = "url(" + imgsrc +")";

	var detailsHtml = "";
	if (this.CastData.PremiereDate && Main.getModelYear() != "D"){
		var birthday = new Date(this.CastData.PremiereDate);
		detailsHtml += "Born: "+birthday.toDateString() + "</br></br>";
	}
	if (this.CastData.ProductionLocations){
		var birthPlace = this.CastData.ProductionLocations;
		if (birthPlace != ""){
			detailsHtml += "Born in "+this.CastData.ProductionLocations + "</br></br>";
		}
	}
	if (this.CastData.EndDate && Main.getModelYear() != "D"){
		var deathday = new Date(this.CastData.EndDate);
		detailsHtml += "Died: "+deathday.toDateString() + "</br></br>";
	}
	Support.widgetPutInnerHTML("castMemberDetails", detailsHtml);

	//Person bio
	var bio = "";
	if (this.CastData.Overview){
		bio += this.CastData.Overview;
	}
	Support.widgetPutInnerHTML("castMemberBio", bio);

	//Set Overview Scroller
	Support.scrollingText("castMemberBio");

	if (this.ItemData.Items.length > 0) {
		//Display first 12 series
		this.updateDisplayedItems();

		//Update Selected Collection CSS
		this.updateSelectedItems();

		//Set Focus for Key Events
		document.getElementById("evnCastMember").focus();
	} else {
		//Cannot happen as link can only be generated from a Cast member - thus at minimum it will return 1 result (itself)
		document.getElementById("evnCastMember").focus();
	}
};

CastMember.updateDisplayedItems = function() {
	var htmlToAdd = "";
	for (var index = this.topLeftItem;index < Math.min(this.topLeftItem + this.getMaxDisplay(),this.ItemData.Items.length); index++) {
		var imgsrc = "images/menu/Play-46x37.png";
		if (this.ItemData.Items[index].Type == "Episode"){
			if (this.ItemData.Items[index].ImageTags.Primary) {
				imgsrc = Server.getImageURL(this.ItemData.Items[index].Id,"Primary",180,100,null,null,null,index);
			}
		} else {
			if (this.ItemData.Items[index].ImageTags.Thumb) {
				imgsrc = Server.getImageURL(this.ItemData.Items[index].Id,"Thumb",180,100,null,null,null,index);
			} else if (this.ItemData.Items[index].ImageTags.Primary) {
				imgsrc = Server.getImageURL(this.ItemData.Items[index].Id,"Primary",180,100,null,null,null,index);
			}
		}
		htmlToAdd += "<div id=" + this.ItemData.Items[index].Id + " class='castMemberListSingle'><div class='castMemberListSingleImage' style=background-image:url(" + imgsrc + ")></div><div class='castMemberListSingleTitle'>" + this.ItemData.Items[index].Name + "</div></div>";
	}
	Support.widgetPutInnerHTML("castMemberList", htmlToAdd);
};

//Function sets CSS Properties so show which user is selected
CastMember.updateSelectedItems = function () {
	for (var index = this.topLeftItem; index < Math.min(this.topLeftItem + this.getMaxDisplay(),this.ItemData.Items.length); index++){
		if (index == this.selectedItem) {
			document.getElementById(this.ItemData.Items[index].Id).className = "castMemberListSingle highlight" + Main.highlightColour + "Background";
			//Set Background based on Type:
			switch (this.ItemData.Items[index].Type) {
			case "Episode":
				if (this.ItemData.Items[index].ParentBackdropItemId) {
					var imgsrc = Server.getBackgroundImageURL(this.ItemData.Items[index].ParentBackdropItemId,"Backdrop",Main.backdropWidth,Main.backdropHeight,0,false,0,this.ItemData.Items[index].ParentBackdropImageTags.length);
					Support.fadeImage(imgsrc);
				}
				break;
			case "Movie":
			case "Series":
				if (this.ItemData.Items[index].BackdropImageTags.length > 0) {
					var imgsrc = Server.getBackgroundImageURL(this.ItemData.Items[index].Id,"Backdrop",Main.backdropWidth,Main.backdropHeight,0,false,0,this.ItemData.Items[index].BackdropImageTags.length);
					Support.fadeImage(imgsrc);
				}
				break;
			case "Photo":
				if (this.ItemData.Items[index].ImageTags.Primary.length > 0) {
					var imgsrc = Server.getImageURL(this.ItemData.Items[index].Id,"Primary",Main.backdropWidth,Main.backdropHeight,0,false,0);
					Support.fadeImage(imgsrc);
				}
				break;
			default:
				break;
			}

		} else {
			document.getElementById(this.ItemData.Items[index].Id).className = "castMemberListSingle";
		}
	}
	Support.widgetPutInnerHTML("counter", (this.selectedItem + 1) + "/" + this.ItemData.Items.length);
};

CastMember.keyDown = function() {
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
		GuiImagePlayerScreensaver.stopScreensaver();

		//Change keycode so it does nothing!
		keyCode = "VOID";
	}
	switch(keyCode)
	{
		case tvKey.KEY_LEFT:
			alert("LEFT");
			this.openMenu();
			break;
		case tvKey.KEY_UP:
			alert("UP");
			this.processUpKey();
			break;
		case tvKey.KEY_DOWN:
			alert("RIGHT");
			this.processDownKey();
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
		case tvKey.KEY_PLAY:
			this.playSelectedItem();
			break;
		case tvKey.KEY_YELLOW:
			//Favourites
			break;
		case tvKey.KEY_BLUE:
			MusicPlayer.showMusicPlayer("CastMember", this.ItemData.Items[this.selectedItem].Id,document.getElementById(this.ItemData.Items[this.selectedItem].Id).className);
			break;
		case tvKey.KEY_TOOLS:
			widgetAPI.blockNavigation(event);
			Support.updateURLHistory("CastMember", this.startParams[0],this.startParams[1],null,null,this.selectedItem,this.topLeftItem,null);
			document.getElementById(this.ItemData.Items[this.selectedItem].Id).className = "SeasonTitle";
			MainMenu.requested("CastMember", this.ItemData.Items[this.selectedItem].Id,"EpisodeListSingle highlight" + Main.highlightColour + "Background");
			break;
		case tvKey.KEY_EXIT:
			alert ("EXIT KEY");
			widgetAPI.sendExitEvent();
			break;
	}
};

CastMember.openMenu = function() {
	Support.updateURLHistory("CastMember",null,null,null,null,null,null,null);
	MainMenu.requested("CastMember",null);
};

CastMember.processSelectedItem = function() {
	Support.processSelectedItem("CastMember", this.ItemData,this.startParams,this.selectedItem,this.topLeftItem,null,null);
};

CastMember.playSelectedItem = function () {
	if (this.ItemData.Items[this.selectedItem].MediaType == "Video") {
		Support.updateURLHistory("CastMember",this.startParams[0],this.startParams[1],null,null,this.selectedItem,this.topLeftItem,null);
		var url = Server.getItemInfoURL(this.ItemData.Items[this.selectedItem].Id);
		GuiPlayer.start("PLAY",url,this.ItemData.Items[this.selectedItem].UserData.PlaybackPositionTicks / 10000);
	}
};

CastMember.processUpKey = function() {
	this.selectedItem--;
	if (this.selectedItem < 0) {
		this.selectedItem = 0;
	} else {
		if (this.selectedItem < this.topLeftItem) {
			this.topLeftItem = this.selectedItem;
			if (this.topLeftItem < 0) {
				this.topLeftItem = 0;
			}
			this.updateDisplayedItems();
		}
		this.updateSelectedItems();
	}

};

CastMember.processDownKey = function() {
	this.selectedItem++;
	if (this.selectedItem >= this.ItemData.Items.length) {
		this.selectedItem--;
	} else {
		if (this.selectedItem >= this.topLeftItem+this.getMaxDisplay() ) {
			this.topLeftItem++;
			this.updateDisplayedItems();
		}
	}
	this.updateSelectedItems();
};

CastMember.returnFromMusicPlayer = function() {
	this.selectedItem = 0;
	this.updateDisplayedItems();
	this.updateSelectedItems();
};