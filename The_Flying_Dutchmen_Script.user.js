// ==UserScript==
// @name         The Flying Dutchmen Clanscript
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  An userscript for the members of The Flying Dutchmen clan in Avabur with extra announcements and events features!
// @author       Bento
// @match        https://*.avabur.com/game*
// @require      https://rawgit.com/edvordo/roa-qol/master/common.js?rev=180730
// @require      https://rawgit.com/ejci/favico.js/master/favico.js
// @require      https://cdn.rawgit.com/omichelsen/compare-versions/v3.1.0/index.js
// @require      https://raw.githubusercontent.com/lodash/lodash/4.17.4/dist/lodash.min.js
// @require      https://cdn.rawgit.com/markdown-it/markdown-it/8.4.1/dist/markdown-it.min.js
// @require      https://cdn.jsdelivr.net/npm/vue
// @require      https://rawgit.com/ujjwalguptaofficial/JsStore/2.3.1/dist/jsstore.worker.min.js
// @require      https://rawgit.com/ujjwalguptaofficial/JsStore/2.3.1/dist/jsstore.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.8.0/spectrum.min.js
// @updateURL    https://github.com/KaizokuBento/AvaTFD/raw/master/The_Flying_Dutchmen_Script.user.js
// @grant        GM_addStyle
// @grant        GM_info
// @run-at       document-idle
// ==/UserScript==

(function($) {
    'use strict';
	
	let TFD = (function TFD() {
		
		const INTERNAL_UPDATE_URI = 'https://api.github.com/repos/KaizokuBento/AvaburTFD/contents/The_Flying_Dutchmen_Script.user.js';

		const DEFAULT_USER_SETTINGS = { // default settings when the script gets loaded the first time
			clan_notifications : true,
			clan_event_window  : true,
		};

		const SETTINGS_SAVE_KEY = 'TFDSettings';

		const VARIABLES = { // all the variables that are going to be used in fn
			userSettings : DEFAULT_USER_SETTINGS,
			
			checkForUpdateTimer: 6 * 60 * 60 * 1000, // 6 hours
		}

		const TEMPLATES = { // all the new/changed HTML for the userscript
			tfdAnnouncement : `<div id="generalNotificationWrapperTFD" style="display: block;"><a id="close_general_notificationTFD">×</a><h5 class="border2 center" id="general_notificationTFD">Fri, Feb 15 @ 14:18:40 - Bento is cool.</h5></div>`,
			tfdSettingsMenu : `<div class="col-md-12" id="tfdsettingsmenuwrapper" style="display: none;"><div class="mt10"><h3 class="center nobg">Bento</h3><div>is cool</div></div></div>`,
		}
		
		const TFD_STYLES = `
		#close_general_notificationTFD {
    position: absolute;
    top: 2%;
    right: 1%;
    font-size: 20px;
	text-decoration: none!important;
}

#generalNotificationWrapperTFD {
    position: relative;
}

#general_notificationTFD {
    margin-bottom: 10px;
    padding-left: 6%;
    padding-right: 6%;
}
`;

		const OBSERVERS = {
			
		}

		const fn = { // all the functions for the script
			helpers: {
				
			},
			/** background stuff */
			backwork : { // backgrounds stuff
				checkForUpdate() {
					let version = '';

                    fetch(INTERNAL_UPDATE_URI)
                        .then(response => response.json())
                        .then(data => {
                            let match = atob(data.content).match(/\/\/\s+@version\s+([^\n]+)/);
                            version   = match[1];

                            if (compareVersions(GM_info.script.version, version) < 0) {
                                var message = "<li class=\"chat_notification\">The Flying Dutchmen Script has been updated to version " + version + "! <a href=\"https://github.com/KaizokuBento/AvaburTFD/raw/master/The_Flying_Dutchmen_Script.user.js\" target=\"_blank\">Update</a> | <a href=\"https://github.com/KaizokuBento/notifications-of-avabur/commits/master\" target=\"_blank\">Changelog</a></li>";
								// TODO: Handle chat direction like ToA does
								$("#chatMessageList").prepend(message);
                            } else {
                                setTimeout(fn.backwork.checkForUpdate, VARIABLES.checkForUpdateTimer);
                            }
                        });
				},

				loadSettings() { // initial settings on first run and setting the variable settings key
					
				},
				saveSettings() { // Save changed settings
					
				},
				populateSettingsPage() { // checks all settings checkboxes that are true in the settings
                    
                },

				setupHTML() { // injects the HTML changes from TEMPLATES into the site
					//tfd Announcement banner
					document.querySelector("#contentWrapper").insertAdjacentHTML('afterbegin', TEMPLATES.tfdAnnouncement);
					
					//tfd Clan settings menu link
					document.querySelector("#myClanLinks").insertAdjacentHTML('beforeend', ' · <a id="tfdviewsettingsmenu">TFD Script</a>');
					
					//tfd Clan settings menu
					document.querySelector("#viewedClanWrapper").insertAdjacentHTML('beforeend', TEMPLATES.tfdSettingsMenu);
				},
				setupCSS() { // All the CSS changes are added here
					GM_addStyle(TFD_STYLES);
				},

				setupObservers() { // all the Observers that needs to run
					
				},

				startup() { // All the functions that are run to start the script on Pokéfarm
					return {
						'loading Settings'		: fn.backwork.loadSettings,
						'checking for update'	: fn.backwork.checkForUpdate,
						'setting up HTML' 		: fn.backwork.setupHTML,
						'setting up CSS'		: fn.backwork.setupCSS,
						'setting up Observers'	: fn.backwork.setupObservers,
					}
				},
				init() { // Starts all the functions.
					console.log('Starting up TFD');
					let startup = fn.backwork.startup();
					for (let message in startup) {
						if (!startup.hasOwnProperty(message)) {
							continue;
						}
						console.log(message);
						startup[message]();
					}
				},
			}, // end of backwork

			/** public stuff */
			API : { // the actual seeable and interactable part of the userscript
				closeClanAnnouncement() {
					$('#generalNotificationWrapperTFD').css({"display":"none"})
				},
				
				openSettingsMenu() {
					//show the scripts menu
					$('#tfdsettingsmenuwrapper').css({"display":"block"}); 
					
					//hide the other clan menus
					$('#viewedClanProfileWrapper').css({"display":"none"});
					$('#viewedClanMemberWrapper').css({"display":"none"});
					$('#myClanFundsWrapper').css({"display":"none"});
					$('#myClanArmoryWrapper').css({"display":"none"});
					$('#myClanRankWrapper').css({"display":"none"});
					$('#myClanRankEditWrapper').css({"display":"none"});
					$('#myClanBuildingsWrapper').css({"display":"none"});
					$('#myClanDonationWrapper').css({"display":"none"});
					$('#myClanActivityWrapper').css({"display":"none"});
					$('#myClanAdminWrapper').css({"display":"none"});

					//remove the active class from the clan Links
					$('#clanLinksWrapper').children().removeClass('active');
					$('#clanLinksWrapper').children().children().removeClass('active');
					
					//add the active class to the scripts settings menu
					$('#tfdviewsettingsmenu').addClass('active');
				},
				
				closeSettingsMenu(clickedMenuId) {
					if(clickedMenuId != 'tfdviewsettingsmenu') {
						$('#tfdsettingsmenuwrapper').css({"display":"none"});
					}
				},
				
			}, // end of API
		}; // end of fn

		fn.backwork.init();

		return fn.API;
	})(); // end of TFD function
	
	$(document).on('click', '#close_general_notificationTFD', function () { //Close clan announcement
        TFD.closeClanAnnouncement();
    });
	
	$(document).on('click', '#tfdviewsettingsmenu', function () { //Open scripts settings menu
        TFD.openSettingsMenu();
    });
	
	$(document).on('click', '#clanLinksWrapper>span>a, #clanLinksWrapper>a', function () { //Close scripts settings menu
        TFD.closeSettingsMenu(this.id);
    });

})(jQuery);
