var MusicPlayer = {
	pluginMusic : null,
	pluginAudioMusic : null,
	currentPlayingItem : 0,
	Status : "STOPPED",
	currentTime : 0,
	updateTimeCount : 0,
	videoURL : null,
	selectedItem : 0,
	playedFromPage : null,
	selectedDivId : 0,
	selectedDivClass : "",
	previousImagePlayerOverlay : 0,
	queuedItems : [],
	isThemeMusicPlaying : false,
	showThemeId : null,
};

MusicPlayer.onFocus = function() {
	Helper.setControlButtons(null,null,null,null,"Return");
};

MusicPlayer.init = function() {
	Player.stopOnAppExit();
	this.pluginMusic = document.getElementById("pluginPlayer");
	this.pluginAudioMusic = document.getElementById("pluginObjectAudio");
	//Set up Player
	this.pluginMusic.OnConnectionFailed = 'MusicPlayer.handleConnectionFailed';
	this.pluginMusic.OnAuthenticationFailed = 'MusicPlayer.handleAuthenticationFailed';
	this.pluginMusic.OnNetworkDisconnected = 'MusicPlayer.handleOnNetworkDisconnected';
	this.pluginMusic.OnRenderError = 'MusicPlayer.handleRenderError';
	this.pluginMusic.OnStreamNotFound = 'MusicPlayer.handleStreamNotFound';
	this.pluginMusic.OnRenderingComplete = 'MusicPlayer.handleOnRenderingComplete';
	this.pluginMusic.OnCurrentPlayTime = 'MusicPlayer.setCurrentTime';
	this.pluginMusic.OnStreamInfoReady = 'MusicPlayer.OnStreamInfoReady';
	//Set Display Size to 0
	this.pluginMusic.SetDisplayArea(0, 0, 0, 0);
};

MusicPlayer.showMusicPlayer = function(playedFromPage,selectedDivId,selectedDivClass) {
	if (this.Status != "STOPPED") {
		this.playedFromPage = playedFromPage;
		this.selectedDivId = selectedDivId;
		//Unhighlight the page's selected content
		if (selectedDivId != null) {
			if (selectedDivClass === undefined) {
				this.selectedDivClass = "UNDEFINED";
			} else {
				this.selectedDivClass = selectedDivClass;
			}
			document.getElementById(selectedDivId).className = document.getElementById(selectedDivId).className.replace("settingChanging arrowUpDown", "");
			document.getElementById(selectedDivId).className = document.getElementById(selectedDivId).className.replace("highlight" + Main.highlightColour + "Background", "");
			document.getElementById(selectedDivId).className = document.getElementById(selectedDivId).className.replace("highlight" + Main.highlightColour + "Text", "");
			document.getElementById(selectedDivId).className = document.getElementById(selectedDivId).className.replace("seriesSelected","");
			document.getElementById(selectedDivId).className = document.getElementById(selectedDivId).className.replace("highlight" + Main.highlightColour + "Background", "");
			document.getElementById(selectedDivId).className = document.getElementById(selectedDivId).className.replace("selected", "");
		}
		if (playedFromPage == "ImagePlayer") {
			clearTimeout(ImagePlayer.infoTimer);
			document.getElementById("imagePlayerScreenSaverOverlay").style.visibility="hidden";
			document.getElementById("buttonShade").style.visibility = "";
		}
		document.getElementById("musicPlayerDiv").style.bottom = "-60px";
		document.getElementById("musicPlayerDiv").style.visibility = "";
		$('.musicPlayerDiv').animate({
			bottom: 0
		}, 300, function() {
			//animate complete.
		});
		document.getElementById("counter").style.visibility = "hidden";
		document.getElementById("evnMusicPlayer").focus();
	}
};

MusicPlayer.start = function(title,url,playedFromPage,isQueue,showThemeId,itemId) {
	this.selectedItem = 0;
	//Initiate Player for Music if required.
	//Set to null on end of playlist or stop.
	if (this.pluginMusic == null) {
		this.init();
	}
	if (title == "Theme") {
		//Only play music is no real music is playing!
		if (this.Status == "STOPPED" || this.isThemeMusicPlaying == true) {
			//Check if Theme Playback is enabled
			if (File.getUserProperty("AudioTheme")) {
				//Check if show Id has changed
				if (showThemeId != this.showThemeId) {
					var urlTheme = Server.getThemeMedia(itemId);
					this.ItemData = Server.getContent(urlTheme);
					if (this.ItemData == null) { Support.processReturnURLHistory(); }
					if (this.ItemData.ThemeSongsResult.Items.length > 0) {
						//Play something
						if (this.Status != "STOPPED") {
							this.stopPlayback();
						}
						this.currentPlayingItem = 0;
						this.showThemeId = showThemeId;
						this.isThemeMusicPlaying = true;
						for (var index = 0; index < this.ItemData.ThemeSongsResult.Items.length; index++){
							this.queuedItems.push(this.ItemData.ThemeSongsResult.Items[index]);
						}
						this.videoURL = Server.getServerAddr() + '/Audio/'+this.queuedItems[this.currentPlayingItem].Id+'/Stream.mp3?static=true&MediaSource='+this.queuedItems[this.currentPlayingItem].MediaSources[0].Id + '&api_key=' + Server.getAuthToken();
						this.updateSelectedItem();
						//Start Playback
						this.handlePlayKey();
					} else {
						this.showThemeId = null;
						this.isThemeMusicPlaying = false;
					}
				}
			}
		}
	} else {
		//get info from URL
		this.ItemData = Server.getContent(url);
		if (this.ItemData == null) { Support.processReturnURLHistory(); }
		//See if item is to be added to playlist or not - if not reset playlist
		if (this.Status != "STOPPED" && (this.isThemeMusicPlaying == true || isQueue == false)) {
			this.stopPlayback();
		}
		if (title != "Song") {
			for (var index = 0; index < this.ItemData.Items.length; index++) {
				this.queuedItems.push(this.ItemData.Items[index]);
			}
		} else {
			//Is Individual Song
			this.queuedItems.push(this.ItemData);
		}
		//Only start if not already playing!
		//If reset this will be true, if not it will be added to queued items
		if (this.Status == "STOPPED") {
			this.currentPlayingItem = 0;
			if (this.queuedItems[this.currentPlayingItem].Type == "AudioPodcast") {
				this.videoURL = Server.getCustomURL("/audio/"+this.queuedItems[this.currentPlayingItem].Id+"/stream.mp3?DeviceId="+Server.getDeviceID()+"&MediaSourceId="+this.queuedItems[this.currentPlayingItem].MediaSources[0].Id+"&AudioCodec=mp3&AudioBitrate=192000&MaxAudioChannels=2&CopyTimestamps=false&EnableSubtitlesInManifest=false&api_key=" + Server.getAuthToken());
			} else {
				this.videoURL = Server.getServerAddr() + '/Audio/'+this.queuedItems[this.currentPlayingItem].Id+'/Stream.mp3?static=true&MediaSource='+this.queuedItems[this.currentPlayingItem].MediaSources[0].Id + '&api_key=' + Server.getAuthToken();
			}
			//Update selected Item
			this.updateSelectedItem();
			//Start Playback
			this.handlePlayKey();
			//Show Content
			this.showMusicPlayer(playedFromPage,itemId,"Music seriesSelected");
		}
	}
};

MusicPlayer.updateSelectedItem = function() {
	/*document.getElementById("musicPlayerNowPlaying").style.color = "white";*/
	document.getElementById("musicPlayerScreenOff").style.color = "white";
	switch (this.selectedItem ) {
/*      case 0:
			document.getElementById("musicPlayerNowPlaying").style.color = "#27a436";
			break;*/
		case 0:
			document.getElementById("musicPlayerScreenOff").className = "musicPlayerScreenOff highlight" + Main.highlightColour + "Background";
			break;
		default:
			document.getElementById("musicPlayerNowPlaying").className = "musicPlayerNowPlaying highlight" + Main.highlightColour + "Background";
			break;
		}
};

//--------------------------------------------------------------------------------------------------

MusicPlayer.keyDown = function() {
	var keyCode = event.keyCode;
	alert("Key pressed: " + keyCode);
	//Returning from blank screen
	if (document.getElementById("everything").style.visibility=="hidden") {
		document.getElementById("everything").style.visibility="";
		//Turn On Screensaver
		Support.screensaverOn();
		Support.screensaver();
		//Don't let Return exit the app.
		switch(keyCode) {
		case tvKey.KEY_RETURN:
			widgetAPI.blockNavigation(event);
			break;
		}
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
			this.selectedItem--;
			if (this.selectedItem < 0) {
				this.selectedItem = 0;
			}
			this.updateSelectedItem();
			break;
		case tvKey.KEY_RIGHT:
			this.selectedItem++;
			if (this.selectedItem > 0) {
				this.selectedItem = 0;
			}
			this.updateSelectedItem();
			break;
		case tvKey.KEY_ENTER:
		case tvKey.KEY_PANEL_ENTER:
			alert("ENTER-player");
			switch (this.selectedItem) {
				/*case 0:
					//Hide the music player.
					$('.musicPlayerDiv').animate({
						bottom: -60
					}, 400, function() {
						document.getElementById("musicPlayerDiv").style.visibility = "hidden";
						document.getElementById("musicPlayerDiv").style.bottom = "0";
					});
					//Set Focus for Key Events
					//document.getElementById("Music").focus();
					break;*/
				case 0:
					this.handleScreenKey();
					break;
			}
			break;
		case tvKey.KEY_PLAY:
			this.handlePlayKey();
			break;
		case tvKey.KEY_PAUSE:
			this.handlePauseKey();
			break;
		case tvKey.KEY_STOP:
			this.handleStopKey();
			break;
		case tvKey.KEY_FF:
			this.handleNextKey();
			break;
		case tvKey.KEY_RW:
			this.handlePreviousKey();
			break;
		case tvKey.KEY_UP:
		case tvKey.KEY_DOWN:
		case tvKey.KEY_RETURN:
		case tvKey.KEY_BLUE:
			alert("RETURN");
			widgetAPI.blockNavigation(event);
			if (this.status == "PAUSED") {
				this.handleStopKey();
			} else {
				if (this.playedFromPage == "ImagePlayer") {
					document.getElementById("buttonShade").style.visibility = "hidden";
					document.getElementById("imagePlayerScreenSaverOverlay").style.visibility="";
				}
				//Hide the music player.
				document.getElementById("musicPlayerDiv").style.visibility = "hidden";
				document.getElementById("musicPlayerDiv").style.bottom = "0";
				document.getElementById("counter").style.visibility = "";

				//Hide colour buttons if a slideshow is running.
				if (ImagePlayer.ImageViewer != null){
					Helper.setControlButtons(null,null,null,null,null);
				}

				//Set Page GUI elements Correct & Set Focus
				if (this.selectedDivId != null) {
					if (this.selectedDivClass == "UNDEFINED") {
						document.getElementById(this.selectedDivId).className = document.getElementById(this.selectedDivId).className + " selected";
					} else {
						document.getElementById(this.selectedDivId).className = this.selectedDivClass;
					}
				}
				document.getElementById(this.playedFromPage).focus();
			}
			break;
		case tvKey.KEY_EXIT:
			alert ("EXIT KEY");
			widgetAPI.sendExitEvent();
			break;
	}
};

MusicPlayer.handlePlayKey = function() {
	if (this.Status != "PLAYING") {
		this.pluginAudioMusic.SetUserMute(0);
		if (this.Status == "PAUSED") {
			this.pluginMusic.Resume();
		} else {
			//Clear down any variables
			this.currentTime = 0;
			this.updateTimeCount = 0;

			//Calculate position in seconds
			this.pluginMusic.Play(this.videoURL);
		}
		document.getElementById("musicPlayerPlay").style.backgroundImage="url('images/musicplayer/play-active-29x37.png')";
		document.getElementById("musicPlayerPause").style.backgroundImage="url('images/musicplayer/pause-32x37.png')";
		this.Status = "PLAYING";
	}
};

MusicPlayer.handlePauseKey = function() {
	this.pluginMusic.Pause();
	Server.videoPaused(this.queuedItems[this.currentPlayingItem].Id, this.queuedItems[this.currentPlayingItem].MediaSources[0].Id, this.currentTime, "DirectStream");
	document.getElementById("musicPlayerPlay").style.backgroundImage="url('images/musicplayer/play-29x37.png')";
	document.getElementById("musicPlayerPause").style.backgroundImage="url('images/musicplayer/pause-active-32x37.png')";
	this.Status = "PAUSED";
};

MusicPlayer.stopPlayback = function() {
	//Reset everything
	this.Status = "STOPPED";
	alert (this.currentPlayingItem);
	Server.videoStopped(this.queuedItems[this.currentPlayingItem].Id, this.queuedItems[this.currentPlayingItem].MediaSources[0].Id, this.currentTime, "DirectStream");
	this.showThemeId = null;
	this.isThemeMusicPlaying = false;
	this.currentPlayingItem = 0;
	this.queuedItems.length = 0;
	this.pluginMusic.Stop();
	document.getElementById("musicPlayerPlay").style.backgroundImage="url('images/musicplayer/play-29x37.png')";
	document.getElementById("musicPlayerPause").style.backgroundImage="url('images/musicplayer/pause-32x37.png')";
	document.getElementById("musicPlayerStop").style.backgroundImage="url('images/musicplayer/stop-active-37x37.png')";
	setTimeout(function(){
		document.getElementById("musicPlayerStop").style.backgroundImage="url('images/musicplayer/stop-37x37.png')";
	}, 400);
};

MusicPlayer.handleStopKey = function() {
	alert ("STOPPING PLAYBACK");
	this.stopPlayback();
	Helper.setControlButtons(0,0,0,null,0);
	this.returnToPage();
};

MusicPlayer.returnToPage = function() {
	//Reset NAVI - Works
	NNaviPlugin = document.getElementById("pluginObjectNNavi");
	NNaviPlugin.SetBannerState(PL_NNAVI_STATE_BANNER_NONE);
	pluginAPI.registKey(tvKey.KEY_VOL_UP);
	pluginAPI.registKey(tvKey.KEY_VOL_DOWN);
	pluginAPI.registKey(tvKey.KEY_MUTE);
	//Set queued Items to 0
	this.isThemeMusicPlaying = false;
	this.queuedItems.length = 0;
	if (document.getElementById("musicPlayerDiv").style.visibility == "") {
		document.getElementById("musicPlayerDiv").style.visibility = "hidden";
		document.getElementById("musicPlayerDiv").style.bottom = "0";
	}
	//Set Page GUI elements Correct & Set Focus
	if (this.selectedDivId != null) {
		if (this.selectedDivClass == "UNDEFINED") {
			document.getElementById(this.selectedDivId).className = document.getElementById(this.selectedDivId).className + " Selected";
		} else {
			document.getElementById(this.selectedDivId).className = this.selectedDivClass;
		}
	}
	document.getElementById(this.playedFromPage).focus();
};

MusicPlayer.handleNextKey = function() {
	//Stop Any Playback
	Server.videoStopped(this.queuedItems[this.currentPlayingItem].Id,this.queuedItems[this.currentPlayingItem].MediaSources[0].Id,this.currentTime,"DirectStream");
	this.pluginMusic.Stop();
	this.Status = "STOPPED";
	this.currentPlayingItem++;
	if (this.queuedItems.length <= this.currentPlayingItem) {
		this.returnToPage();
	} else {
		//Play Next Item
		this.videoURL = Server.getServerAddr() + '/Audio/'+this.queuedItems[this.currentPlayingItem].Id+'/Stream.mp3?static=true&MediaSource='+this.queuedItems[this.currentPlayingItem].MediaSources[0].Id + '&api_key=' + Server.getAuthToken();
		alert ("Next " + this.videoURL);
		//Start Playback
		this.handlePlayKey();
	}
	document.getElementById("musicPlayerPlay").style.backgroundImage="url('images/musicplayer/play-29x37.png')";
	document.getElementById("musicPlayerPause").style.backgroundImage="url('images/musicplayer/pause-32x37.png')";
	document.getElementById("musicPlayerNext").style.backgroundImage="url('images/musicplayer/skip-next-active-36x37.png')";
	setTimeout(function(){
		document.getElementById("musicPlayerPlay").style.backgroundImage="url('images/musicplayer/play-active-29x37.png')";
		document.getElementById("musicPlayerNext").style.backgroundImage="url('images/musicplayer/skip-next-36x37.png')";
	}, 300);
};

MusicPlayer.handlePreviousKey = function() {
	//Stop Any Playback
	var timeOfStoppedSong = Math.floor((this.currentTime % 60000) / 1000);
	Server.videoStopped(this.queuedItems[this.currentPlayingItem].Id,this.queuedItems[this.currentPlayingItem].MediaSources[0].Id,this.currentTime,"DirectStream");
	this.pluginMusic.Stop();
	this.Status = "STOPPED";
	//If song over 5 seconds long, previous song returns to start of current song, else go back to previous
	this.currentPlayingItem = (timeOfStoppedSong > 5 ) ? this.currentPlayingItem : this.currentPlayingItem-1;
	alert ("Queue Length : " + this.queuedItems.length);
	alert ("Current Playing ID : " + this.currentPlayingItem);
	if (this.queuedItems.length <= this.currentPlayingItem) {
		this.returnToPage();
	} else {
		//Play Next Item
		this.videoURL = Server.getServerAddr() + '/Audio/'+this.queuedItems[this.currentPlayingItem].Id+'/Stream.mp3?static=true&MediaSource='+this.queuedItems[this.currentPlayingItem].MediaSources[0].Id;
		alert ("Next " + this.videoURL);
		//Start Playback
		this.handlePlayKey();
	}
	document.getElementById("musicPlayerPlay").style.backgroundImage="url('images/musicplayer/play-29x37.png')";
	document.getElementById("musicPlayerPause").style.backgroundImage="url('images/musicplayer/pause-32x37.png')";
	document.getElementById("musicPlayerPrevious").style.backgroundImage="url('images/musicplayer/skip-previous-active-36x37.png')";
	setTimeout(function(){
		document.getElementById("musicPlayerPlay").style.backgroundImage="url('images/musicplayer/play-active-29x37.png')";
		document.getElementById("musicPlayerPrevious").style.backgroundImage="url('images/musicplayer/skip-previous-36x37.png')";
	}, 300);
};
MusicPlayer.handleScreenKey = function() {
	 //Turn off screensaver
	Support.screensaverOff();
	document.getElementById("everything").style.visibility="hidden";
};

MusicPlayer.handlePlaylistKey = function() {
	//Redo another day
	/*
	if (document.getElementById("musicPlayerShowPlaylist").style.visibility == "hidden") {
		document.getElementById("musicPlayerShowPlaylist").style.visibility = "";
	} else {
		document.getElementById("musicPlayerShowPlaylist").style.visibility = "hidden";
	}

	document.getElementById("musicPlayerShowPlaylistContent").innerHTML = "";
	for (var index = 0; index < this.queuedItems.length; index++) {
		document.getElementById("musicPlayerShowPlaylistContent").innerHTML += this.queuedItems[index].Name;
	}
	*/
};

//--------------------------------------------------------------------------------------------------

MusicPlayer.handleOnRenderingComplete = function() {
	alert ("File complete");
	this.handleNextKey();
};

MusicPlayer.handleOnNetworkDisconnected = function() {
	alert ("Network Disconnect");
};

MusicPlayer.handleConnectionFailed = function() {
	alert ("Connection Failed");
};

MusicPlayer.handleAuthenticationFailed = function() {
	alert ("Authentication Failed");
};

MusicPlayer.handleRenderError = function(RenderErrorType) {
	alert ("Render Error");
};

MusicPlayer.handleStreamNotFound = function() {
	alert ("Stream not found");
};

MusicPlayer.setCurrentTime = function(time){
	if (this.Status == "PLAYING") {
		this.currentTime = time;
		this.updateTimeCount++;
		if (this.queuedItems[this.currentPlayingItem].Type == "AudioPodcast") {
			Support.widgetPutInnerHTML("musicPlayerTime", Support.convertTicksToTimeSingle(this.currentTime));
		} else {
			//Update Server every 8 ticks
			if (this.updateTimeCount == 8) {
				this.updateTimeCount = 0;
				//Update Server
				Server.videoPaused(this.queuedItems[this.currentPlayingItem].Id, this.queuedItems[this.currentPlayingItem].MediaSources[0].Id, this.currentTime, "DirectStream");
			}
			Support.widgetPutInnerHTML("musicPlayerTime", Support.convertTicksToTime(this.currentTime, (this.queuedItems[this.currentPlayingItem].RunTimeTicks / 10000)));
		}
	}
};

MusicPlayer.OnStreamInfoReady = function() {
	var playingTitle = "";
	if (this.isThemeMusicPlaying == false) {
		if (this.queuedItems[this.currentPlayingItem].IndexNumber){
			if (this.queuedItems[this.currentPlayingItem].IndexNumber < 10) {
				playingTitle = " - " + "0"+this.queuedItems[this.currentPlayingItem].IndexNumber+" - ";
			} else {
				playingTitle = " - " + this.queuedItems[this.currentPlayingItem].IndexNumber+" - ";
			}
		}
		var title = "";
		if (this.queuedItems[this.currentPlayingItem].Artists) {
			title += this.queuedItems[this.currentPlayingItem].Artists + " ";
		}
		if (playingTitle) {
			title += playingTitle;
		}
		if (this.queuedItems[this.currentPlayingItem].Name) {
			title += this.queuedItems[this.currentPlayingItem].Name;
		}
		//Truncate long title.
		if (title.length > 67){
			title = title.substring(0,65) + "...";
		}
		Support.widgetPutInnerHTML("musicPlayerTitle", title);
	} else {
		Support.widgetPutInnerHTML("musicPlayerTitle", "Theme Music");
	}
	Support.widgetPutInnerHTML("musicPlayerTime", Support.convertTicksToTime(this.currentTime, (this.queuedItems[this.currentPlayingItem].RunTimeTicks / 10000)));
	//Playback Checkin
	Server.videoStarted(this.queuedItems[this.currentPlayingItem].Id,this.queuedItems[this.currentPlayingItem].MediaSources[0].Id,"DirectStream");
	//Volume & Mute Control - Works!
	NNaviPlugin = document.getElementById("pluginObjectNNavi");
	NNaviPlugin.SetBannerState(PL_NNAVI_STATE_BANNER_VOL);
	pluginAPI.unregistKey(tvKey.KEY_VOL_UP);
	pluginAPI.unregistKey(tvKey.KEY_VOL_DOWN);
	pluginAPI.unregistKey(tvKey.KEY_MUTE);
};

MusicPlayer.stopOnAppExit = function() {
	if (this.pluginMusic != null) {
		this.pluginMusic.Stop();
		this.pluginMusic = null;
		this.pluginAudioMusic = null;
	}
};
