var HomeOneItem = {
	selectedBannerItem : -1,
	ItemData : null,
	ItemIndexData : null,
	menuItems : [],
	selectedItem : 0,
	topLeftItem : 0,
	MAXCOLUMNCOUNT : 3,
	MAXROWCOUNT : 2,
	indexSeekPos : -1,
	isResume : false,
	isLatest : false,
	startParams : [],
	backdropTimeout : null
};

HomeOneItem.getMaxDisplay = function() {
	return this.MAXCOLUMNCOUNT * this.MAXROWCOUNT;
};

HomeOneItem.onFocus = function() {
	Helper.setControlButtons(Main.messages.LabButtonFavourite, Main.messages.LabButtonWatched, Main.messages.LabButtonHelp, MusicPlayer.Status == "PLAYING" || MusicPlayer.Status == "PAUSED" ? Main.messages.LabButtonMusic : null, Main.messages.LabButtonExit);
};

HomeOneItem.start = function(title, url, selectedItem, topLeftItem) {
	alert("Page Enter : HomeOneItem");
	Support.loading(1250);

	//Save Start Params
	this.startParams = [title, url];

	//Reset Values
	this.indexSeekPos = -1;
	this.selectedItem = selectedItem;
	this.topLeftItem = topLeftItem;

	//Load Data
	this.ItemData = Server.getContent(url);
	if (this.ItemData == null) { Support.processReturnURLHistory(); }

	if (title == "Latest TV" || title == "Latest Movies") {
		this.isLatest = true;
		this.ItemData.Items = this.ItemData;
	}
	
	//If all user selected homepages are blank try media items
	if (this.ItemData.Items.length == 0) {
		title = Main.messages.LabMediaFolders;
		var newURL = Server.getItemTypeURL("&SortBy=SortName&SortOrder=Ascending&CollapseBoxSetItems=false&fields=SortName");
		this.ItemData = Server.getContent(newURL);
		if (this.ItemData == null) { Support.processReturnURLHistory(); }
	}
	
	if (this.ItemData.Items.length > 0) {		
		//Latest Page Fix
		this.isLatest = false;

		//If array like MoviesRecommended alter
		if (title == "Suggested For You") {
			if (this.ItemData[0] === undefined){
				this.ItemData[0] = {"Items":[]}; //Create empty Items array and continue
			}
			this.ItemData = this.ItemData[0];
		}

		//Set page content
		Support.widgetPutInnerHTML("pageContent", "<div id=bannerSelection class='bannerMenu'></div><div id=center class='homeOneCenter'>" +
		"<p id='title' style='position:relative;font-size:1.4em;z-index:5;'>" + title + "</p><div id=content></div></div>");

		//Set isResume based on title - used in UpdateDisplayedItems
		this.isResume = (title == "Resume" ||  title == "Continue Watching" ) ? true : false;

		//If to determine positioning of content
		document.getElementById("center").style.top = (this.ItemData.Items.length <= this.MAXCOLUMNCOUNT) ? "180px" : "200px";
		document.getElementById("center").style.left = "170px";
		document.getElementById("center").style.width = "1620px";

		//Generate Banner Items - Mreove Home Page
		this.menuItems = MainMenu.menuItemsHomePages;
		
		//Generate Banner display		
		var bannerSelection = "";
		for (var index = 0; index < this.menuItems.length; index++) {
			if (index != this.menuItems.length - 1) {
				bannerSelection += "<div id='bannerItem" + index + "' class='bannerItemHome bannerItemPadding'>" + Support.getLocalizationName(this.menuItems[index]) + "</div>";
			} else {
				bannerSelection += "<div id='bannerItem" + index + "' class='bannerItemHome'>" + Support.getLocalizationName(this.menuItems[index]) + "</div>";
			}
		}
		Support.widgetPutInnerHTML("bannerSelection", bannerSelection);

		//Display first XX series
		this.updateDisplayedItems();
		
		//Update Selected Collection CSS
		this.updateSelectedItems();
		this.updateSelectedBannerItems();
		
		//Function to generate random backdrop
		this.backdropTimeout = setTimeout(function(){
			var randomImageURL = Server.getItemTypeURL("&SortBy=Random&IncludeItemTypes=Series,Movie&Recursive=true&CollapseBoxSetItems=false&Limit=20&EnableTotalRecordCount=false");
			var randomImageData = Server.getContent(randomImageURL);
			if (randomImageData == null) { return; }

			for (var index = 0; index < randomImageData.Items.length; index++) {
				if (randomImageData.Items[index ].BackdropImageTags.length > 0) {
					var imgsrc = Server.getBackgroundImageURL(randomImageData.Items[index ].Id, "Backdrop", Main.backdropWidth,Main.backdropHeight, 0, false, 0, randomImageData.Items[index].BackdropImageTags.length);
					Support.fadeImage(imgsrc);
					break;
				}
			}
		}, 500);

		//Set Focus for Key Events
		document.getElementById("evnHomeOneItem").focus();

	} else {
		//Set message to user
		Support.widgetPutInnerHTML("pageContent", "<p id='title' class=pageTitle>" + title + "</p><div id=content></div></div>");
		Support.widgetPutInnerHTML("counter", "");
		Support.widgetPutInnerHTML("title", "Sorry");
		Support.widgetPutInnerHTML("content", "Huh.. Looks like I have no content to show you in this view I'm afraid");

		//As no content focus on menu bar and null null means user can't return off the menu bar
		MainMenu.requested(null, null);
	}
};

HomeOneItem.updateDisplayedItems = function() {
	Support.updateDisplayedItems(this.ItemData.Items,this.selectedItem,this.topLeftItem, Math.min(this.topLeftItem + this.getMaxDisplay(),this.ItemData.Items.length), "content", "", this.isResume, null, true);
};

//Function sets CSS Properties so show which user is selected
HomeOneItem.updateSelectedItems = function (bypassCounter) {
	Support.updateSelectedNEW(this.ItemData.Items, this.selectedItem, this.topLeftItem,
			Math.min(this.topLeftItem + this.getMaxDisplay(), this.ItemData.Items.length), "homePagePoster collection selected highlight" + Main.highlightColour + "Background", "homePagePoster collection", "", bypassCounter);
};

HomeOneItem.updateSelectedBannerItems = function() {
	for (var index = 0; index < this.menuItems.length; index++) {
		if (index == this.selectedBannerItem && this.selectedItem == -1) {
			if (index != this.menuItems.length-1) {
				document.getElementById("bannerItem" + index).className = "bannerItemHome bannerItemPadding highlight" + Main.highlightColour + "Text";
			} else {
				document.getElementById("bannerItem" + index).className = "bannerItemHome highlight" + Main.highlightColour + "Text";
			}
		} else {
			if (index != this.menuItems.length - 1) {
				document.getElementById("bannerItem" + index).className = "bannerItemHome bannerItemPadding offWhite";
			} else {
				document.getElementById("bannerItem" + index).className = "bannerItemHome offWhite";
			}
		}
	}
};

HomeOneItem.keyDown = function() {
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
		//Need Logout Key
		case tvKey.KEY_LEFT:
			alert("LEFT");
			this.processLeftKey();
			break;
		case tvKey.KEY_RIGHT:
			alert("RIGHT");
			this.processRightKey();
			break;
		case tvKey.KEY_UP:
			alert("UP");
			this.processUpKey();
			break;
		case tvKey.KEY_DOWN:
			alert("DOWN");
			this.processDownKey();
			break;
		case tvKey.KEY_PANEL_CH_UP:
		case tvKey.KEY_CH_UP:
			this.processChannelUpKey();
			break;
		case tvKey.KEY_PANEL_CH_DOWN:
		case tvKey.KEY_CH_DOWN:
			this.processChannelDownKey();
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
			Helper.toggleHelp("HomeOneItem");
			break;
		case tvKey.KEY_GREEN:
			if (this.ItemData.Items[this.selectedItem].MediaType == "Video") {
				if (this.ItemData.Items[this.selectedItem].UserData.Played == true) {
					Server.deleteWatchedStatus(this.ItemData.Items[this.selectedItem].Id);
					this.ItemData.Items[this.selectedItem].UserData.Played = false;
				} else {
					Server.setWatchedStatus(this.ItemData.Items[this.selectedItem].Id);
					this.ItemData.Items[this.selectedItem].UserData.Played = true;
				}
				setTimeout(function(){
					HomeOneItem.updateDisplayedItems();
					HomeOneItem.updateSelectedItems();
				}, 200);
			}
			break;
		case tvKey.KEY_RED:
			if (this.selectedItem > -1) {
				if (this.ItemData.Items[this.selectedItem].UserData.IsFavorite == true) {
					Server.deleteFavourite(this.ItemData.Items[this.selectedItem].Id);
					this.ItemData.Items[this.selectedItem].UserData.IsFavorite = false;
				} else {
					Server.setFavourite(this.ItemData.Items[this.selectedItem].Id);
					this.ItemData.Items[this.selectedItem].UserData.IsFavorite = true;
				}
				setTimeout(function(){
					HomeOneItem.updateDisplayedItems();
					HomeOneItem.updateSelectedItems();
				}, 200);
			}
			break;
		case tvKey.KEY_BLUE:
			if (this.selectedItem == -1) {
				if (this.selectedBannerItem == this.menuItems.length - 1) {
					MusicPlayer.showMusicPlayer("HomeOneItem", "bannerItem" + this.selectedBannerItem, "bannerItemHome highlight" + Main.highlightColour + "Text");
				} else {
					MusicPlayer.showMusicPlayer("HomeOneItem", "bannerItem" + this.selectedBannerItem, "bannerItemHome bannerItemPadding highlight" + Main.highlightColour + "Text");
				}
			} else {
				MusicPlayer.showMusicPlayer("HomeOneItem", this.ItemData.Items[this.selectedItem].Id, document.getElementById(this.ItemData.Items[this.selectedItem].Id).className);
			}
			break;
		case tvKey.KEY_TOOLS:
			widgetAPI.blockNavigation(event);
			this.openMenu();
			break;
		case tvKey.KEY_EXIT:
			alert ("EXIT KEY");
			widgetAPI.sendExitEvent();
			break;
	}
};

HomeOneItem.processSelectedItem = function() {
	clearTimeout(this.backdropTimeout);
	if (this.selectedItem == -1) {
		Support.updateURLHistory("HomeOneItem", this.startParams[0], this.startParams[1], this.startParams[2], this.startParams[3], 0, 0, true);
		Support.processHomePageMenu(this.menuItems[this.selectedBannerItem]);
	} else {
		Support.processSelectedItem("HomeOneItem", this.ItemData, this.startParams, this.selectedItem, this.topLeftItem, null, null, this.isLatest);
	}
};

HomeOneItem.playSelectedItem = function () {
	Support.playSelectedItem("HomeOneItem", this.ItemData, this.startParams, this.selectedItem, this.topLeftItem,null);
};

HomeOneItem.openMenu = function() {
	if (this.selectedItem == -1) {
		Support.updateURLHistory("HomeOneItem", this.startParams[0],this.startParams[1], null, null, this.selectedItem,this.topLeftItem, null);
		if (this.selectedBannerItem == this.menuItems.length - 1) {
			MainMenu.requested("HomeOneItem", "bannerItem" + this.selectedBannerItem,"bannerItemHome highlight" + Main.highlightColour + "Text");
		} else {
			MainMenu.requested("HomeOneItem", "bannerItem" + this.selectedBannerItem, "bannerItemHome bannerItemPadding highlight" + Main.highlightColour + "Text");
		}
	} else {
		Support.updateURLHistory("HomeOneItem", this.startParams[0],this.startParams[1], null, null, this.selectedItem,this.topLeftItem, null);
		MainMenu.requested("HomeOneItem", this.ItemData.Items[this.selectedItem].Id);
	}
};

HomeOneItem.processLeftKey = function() {
	if (this.selectedItem == -1) {
		this.selectedBannerItem--;
		if (this.selectedBannerItem == -1) {
			this.selectedBannerItem = 0;
			this.openMenu(); //Going left from the end of the banner menu.
		} else {
			this.updateSelectedBannerItems();
		}
	} else if (this.selectedItem % this.MAXCOLUMNCOUNT == 0){
			this.openMenu(); //Going left from anywhere in the first column.
	} else {
		this.selectedItem--;
		if (this.selectedItem == -1) {
			this.selectedItem = 0;
		} else {
			if (this.selectedItem < this.topLeftItem) {
				this.topLeftItem = this.selectedItem - (this.getMaxDisplay() - 1);
				if (this.topLeftItem < 0) {
					this.topLeftItem = 0;
				}
				this.updateDisplayedItems();
			}
		}
		this.updateSelectedItems();
	}
};

HomeOneItem.processRightKey = function() {
	if (this.selectedItem == -1) {
		this.selectedBannerItem++;
		if (this.selectedBannerItem >= this.menuItems.length) {
			this.selectedBannerItem--;
		}
		this.updateSelectedBannerItems();
	} else {
		this.selectedItem++;
		if (this.selectedItem >= this.ItemData.Items.length) {
			this.selectedItem--;
		} else {
			if (this.selectedItem >= this.topLeftItem+this.getMaxDisplay() ) {
				this.topLeftItem = this.selectedItem;
				this.updateDisplayedItems();
			}
		}
		this.updateSelectedItems();
	}
};

HomeOneItem.processUpKey = function() {
	this.selectedItem = this.selectedItem - this.MAXCOLUMNCOUNT;
	if (this.selectedItem < 0) {
		this.selectedBannerItem = 0;
		this.selectedItem = -1;
		//Hide red
		this.updateSelectedItems(true);
		//update selected banner item
		this.updateSelectedBannerItems();
	} else {
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

HomeOneItem.processDownKey = function() {
	if (this.selectedItem == -1) {
		this.selectedItem = 0;
		this.selectedBannerItem = -1;
		this.updateSelectedBannerItems();
	} else {
		this.selectedItem = this.selectedItem + this.MAXCOLUMNCOUNT;
		if (this.selectedItem >= this.ItemData.Items.length) {
			this.selectedItem = (this.ItemData.Items.length-1);
			if (this.selectedItem >= (this.topLeftItem  + this.getMaxDisplay())) {
				this.topLeftItem = this.topLeftItem + this.getMaxDisplay();
				this.updateDisplayedItems();
			}
		} else {
			if (this.selectedItem >= (this.topLeftItem + this.getMaxDisplay())) {
				this.topLeftItem = this.topLeftItem + this.MAXCOLUMNCOUNT;
				this.updateDisplayedItems();
			}
		}
	}
	this.updateSelectedItems();
};

HomeOneItem.processChannelUpKey = function() {
	this.selectedItem = this.selectedItem - this.getMaxDisplay();
	if (this.selectedItem < 0) {
		this.selectedItem = 0;
		this.topLeftItem = 0;
		this.updateDisplayedItems();
	} else {
		if (this.topLeftItem - this.getMaxDisplay() < 0) {
			this.topLeftItem = 0;
		} else {
			this.topLeftItem = this.topLeftItem - this.getMaxDisplay();
		}
		this.updateDisplayedItems();
	}
	this.updateSelectedItems();
};

HomeOneItem.processChannelDownKey = function() {
	this.selectedItem = this.selectedItem + this.getMaxDisplay();
	if (this.selectedItem >= this.ItemData.Items.length) {
		this.selectedItem = (this.ItemData.Items.length-1);
		if (this.selectedItem >= this.topLeftItem + this.getMaxDisplay()) {
			this.topLeftItem = this.topLeftItem + this.getMaxDisplay();
		}
		this.updateDisplayedItems();
	} else {
		this.topLeftItem = this.topLeftItem + this.getMaxDisplay();
		this.updateDisplayedItems();
	}
	this.updateSelectedItems();
};

HomeOneItem.returnFromMusicPlayer = function() {
	this.selectedItem = 0;
	this.updateDisplayedItems();
	this.updateSelectedItems();
};