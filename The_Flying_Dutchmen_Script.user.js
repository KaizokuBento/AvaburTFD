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
// @connect      theflyingdutchmenclan.000webhostapp.com
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_xmlhttpRequest
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
			
			lastAnnouncement : "",
			
			checkForUpdateTimer: 6 * 60 * 60 * 1000, // 6 hours
		}

		const TEMPLATES = { // all the new/changed HTML for the userscript
			tfdAnnouncement		: `<div id="generalNotificationWrapperTFD" style="display: block;"><a id="close_general_notificationTFD">×</a><h5 class="border2 center" id="general_notificationTFD">Fri, Feb 15 @ 14:18:40 - Bento is cool.</h5></div>`,
			tfdSettingsMenu		: `<div class="col-md-12" id="tfdsettingsmenuwrapper" style="display: none;"><div class="col-md-6"><h3 class="center nobg">TFD Settings</h3><table id="tfdsettingspage"><tbody><tr><td><label><input type="checkbox" class="tfdsetting" data-key="clan_notifications"/>Clan Announcements</label></td><tr><label><input type="checkbox" class="tfdsetting" data-key="clan_event_window"/>Clan Events</label></tr></tbody></table></div></div>`,
			tfdEventQuestWindow	: `<div class="mt10" id="tfdEventQuestWindow" style="max-height: 100px; font-size: 13px; margin-top: 5px;">
            <div class="ui-element border2" margin-top: 5px;>
              <div id="tfdeqw_header">
                <h5 class="center toprounder">Event Bet!</h5>
              </div>
              <div class="center" id="tfdeqw_reward">Current pot: 20k plat</div>
              <div class="center" id="tfdeqw_info">Participants: <a class="profileLink">Bento</a>, <a class="profileLink">Akias</a>, <a class="profileLink">Zathras</a>, <a class="profileLink">TheMissingLink</a>, <a class="profileLink">Tidsloop</a> & <a class="profileLink">Anderiusik</a></div>
            </div>
          </div>`
		}
		
		//Make the custom event window flash= style="animation: pulsate-inner 0.8s ease 0s infinite alternate none running;"
		
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

#generalNotificationWrapperupdateTFD {
    position: relative;
}

#general_notificationupdateTFD {
    margin-bottom: 10px;
    padding-left: 6%;
    padding-right: 6%;
}
`;

		const OBSERVERS = {
			chat_search: new MutationObserver(function(mutations) {
				mutations.forEach(function(mutation) {
					let chatMessage = mutation.addedNodes[0];
					
					fn.API.testJoinEventBet(chatMessage);
				});
			}),
			
			
			
		}

		const fn = { // all the functions for the script
			helpers: {
				toggleSetting(key, set = false) {
                    if (typeof set === 'boolean') {
                        let element = document.querySelector(`.tfdsetting[data-key="${key}"]`);
                        if (element && element.type === 'checkbox') {
                            element.checked = set;
                        }
                    }
                },
                populateToSettingsTemplate() {
                    for (let key in VARIABLES.userSettings) {
                        if (!VARIABLES.userSettings.hasOwnProperty(key)) {
                            continue;
                        }
                        let value = VARIABLES.userSettings[key];
                        if (typeof value === 'boolean') {
                            fn.helpers.toggleSetting(key, value, false);
                            continue;
                        }

                        if (true === _.isPlainObject(value)) {
                            for (let key2 in value) {
                                if (!value.hasOwnProperty(key2)) {
                                    continue;
                                }
                                let value2 = value[key2];
                                if (typeof value2 === 'boolean') {
                                    fn.helpers.toggleSetting(`${key}-${key2}`, value2, false);
                                }
                            }
                        }
                    }
                },
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
								let updateAnnouncement = '<div id="generalNotificationWrapperupdateTFD" style="display: block;"></a><h5 class="border2 center" id="general_notificationupdateTFD">The Flying Dutchmen Script has been updated to version ' + version + '! <a href=\"https://github.com/KaizokuBento/AvaburTFD/raw/master/The_Flying_Dutchmen_Script.user.js\" target=\"_blank\">Update</a></h5></div>';
								
								document.querySelector("#contentWrapper").insertAdjacentHTML('afterbegin', updateAnnouncement);
                            } else {
                                setTimeout(fn.backwork.checkForUpdate, VARIABLES.checkForUpdateTimer);
                            }
                        });
				},
				
				checkForAnnouncement() {
					GM_xmlhttpRequest ( {
						method: "GET",
						url: "https://theflyingdutchmenclan.000webhostapp.com/clanannouncement.php",
						onload: function (response) {
							if (this.status === 404) {
								console.log('nope');
								return;
							}
							let freshAnnouncement = response.responseText;
							if (VARIABLES.lastAnnouncement != freshAnnouncement) {
								VARIABLES.lastAnnouncement = freshAnnouncement;
							
								$('#generalNotificationWrapperTFD').remove();
								document.querySelector("#contentWrapper").insertAdjacentHTML('afterbegin', '<div id="generalNotificationWrapperTFD" style="display: block;"><a id="close_general_notificationTFD">×</a><h5 class="border2 center" id="general_notificationTFD">'+VARIABLES.lastAnnouncement+'</h5></div>');
							}
						}
					} );
				},
				
				loadSettings() { // initial settings on first run and setting the variable settings key
					let settings = localStorage.getItem(SETTINGS_SAVE_KEY);

                    try {
                        settings = JSON.parse(settings);

                        VARIABLES.userSettings = _.defaultsDeep(settings, DEFAULT_USER_SETTINGS);
                    } catch (e) {
                        log('Failed to parse settings ..');
                    }
                    fn.helpers.populateToSettingsTemplate();
                    fn.backwork.saveSettings();
				},
				saveSettings() { // Save changed settings
					localStorage.setItem(SETTINGS_SAVE_KEY, JSON.stringify(VARIABLES.userSettings));
				},
				processSettingChange(element, ...hierarchy) { // Process the changed settings in the settings menu
                    if (1 === hierarchy.length) {
                        let setting = hierarchy.pop();
                        if (!VARIABLES.userSettings.hasOwnProperty(setting)) {
                            return false;
                        }
                        if (element.type === 'checkbox') {
                            VARIABLES.userSettings[setting] = !!element.checked;
                        }
                    } else if (hierarchy.length === 2) {
                        let [top, sub] = hierarchy;
                        if (!VARIABLES.userSettings.hasOwnProperty(top) || !VARIABLES.userSettings[top].hasOwnProperty(sub)) {
                            return false;
                        }
                        if (element.type === 'checkbox') {
                            VARIABLES.userSettings[top][sub] = !!element.checked;
                        }
                    }
                    fn.backwork.saveSettings();
                },

				setupHTML() { // injects the HTML changes from TEMPLATES into the site
					//TESTmenu
					document.querySelector('#helpSection').insertAdjacentHTML('beforeend', '<li id="testannouncement"><a>Test Announcement</a></li><li id="testeventbet"><a>Test Eventbet</a></li>');
					
					//tfd Clan settings menu link
					document.querySelector("#myClanLinks").insertAdjacentHTML('beforeend', ' · <a id="tfdviewsettingsmenu">TFD Script</a>');
					
					//tfd Clan settings menu
					document.querySelector("#viewedClanWrapper").insertAdjacentHTML('beforeend', TEMPLATES.tfdSettingsMenu);
					
					//tfd Event Window
					document.querySelector('#navWrapper').insertAdjacentHTML('beforeend', TEMPLATES.tfdEventQuestWindow);
				},
				setupCSS() { // All the CSS changes are added here
					GM_addStyle(TFD_STYLES);
				},

				setupObservers() { // all the Observers that needs to run
					OBSERVERS.chat_search.observe(document.querySelector("#chatMessageList"), {
						childList: true,
					});
				},
				
				setupLoops() { // all the loops and timers
					setTimeout(fn.backwork.checkForUpdate, 10 * 1000);
					setTimeout(fn.backwork.checkForAnnouncement, 10 * 1000);
					setInterval(fn.backwork.checkForAnnouncement, 5 * 60 * 1000); // every 5 minutes
				},
				
				startup() { // All the functions that are run to start the script on Pokéfarm
					return {
						'checking for update'	: fn.backwork.checkForUpdate,
						'setting up HTML' 		: fn.backwork.setupHTML,
						'setting up CSS'		: fn.backwork.setupCSS,
						'setting up Observers'	: fn.backwork.setupObservers,
						'loading Settings'		: fn.backwork.loadSettings,
						'starting loops'		: fn.backwork.setupLoops,
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
				testAnnouncement() {
					GM_xmlhttpRequest ( {
						method: "GET",
						url: "https://theflyingdutchmenclan.000webhostapp.com/clanannouncement.php",
						onload: function (response) {
							if (this.status === 404) {
								console.log('nope');
								return;
							}

							$('#generalNotificationWrapperTFD').remove();
							document.querySelector("#contentWrapper").insertAdjacentHTML('afterbegin', '<div id="generalNotificationWrapperTFD" style="display: block;"><a id="close_general_notificationTFD">×</a><h5 class="border2 center" id="general_notificationTFD">'+VARIABLES.lastAnnouncement+'</h5></div>');
						}
					} );
				},
			
			
				openSettingsMenu() { //open the scripts settings menu in the clan hall
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
				closeSettingsMenu(clickedMenuId) { //close the scripts settings menu in the clan hall
					if(clickedMenuId != 'tfdviewsettingsmenu') {
						$('#tfdsettingsmenuwrapper').css({"display":"none"});
					}
				},
				
				changeSetting(setting, element) { //change a script settings in the clan hall
                    fn.backwork.processSettingChange(element, ...setting.split('-'));
                },
				
				closeClanAnnouncement() { //closes the Clan announcement
					$('#generalNotificationWrapperTFD').css({"display":"none"})
				},
				
				testJoinEventBet(chatMessage) {
					let chatMessageChannel = $(chatMessage).children().last().prev().prev().prev().prev().text(); //for clan channel
					let chatMessageChannelTEST = $(chatMessage).children().last().prev().prev().prev().text(); //for test channel
					let chatMessageUsername = $(chatMessage).children().last().prev().text();
					let chatMessageString = $(chatMessage).children().last().text();


					var myData = new FormData();
					myData.append('Username', chatMessageUsername);
					
					if (chatMessageString.indexOf('!in') != -1 && chatMessageString.length == 3 && chatMessageChannelTEST == 'Onepiece') {
						console.log(chatMessageUsername+' Joined the bet!');
						GM_xmlhttpRequest ( {
						method: "post",
						data: myData,
						url: "https://theflyingdutchmenclan.000webhostapp.com/event.php",
						onload: function (response, data) {
							console.log(response);
							console.log(data);
						}
					} );
					}
					
					$('#tfdeqw_info').empty();
					document.querySelector('#tfdeqw_info').insertAdjacentHTML('afterbegin', 'Participants: <a class="profileLink">Bento</a>, <a class="profileLink">Akias</a>'); 
				}
				
			}, // end of API
		}; // end of fn

		fn.backwork.init();

		return fn.API;
	})(); // end of TFD function
	
	$(document).on('click', '#tfdviewsettingsmenu', function () { //Open scripts settings menu
        TFD.openSettingsMenu();
    });
	
	$(document).on('click', '#clanLinksWrapper>span>a, #clanLinksWrapper>a', function () { //Close scripts settings menu
        TFD.closeSettingsMenu(this.id);
    });
	
	$(document).on('change', '.tfdsetting', function () { //Change script settings
        TFD.changeSetting(this.getAttribute('data-key'), this);
    });
	
	$(document).on('click', '#close_general_notificationTFD', function () { //Close clan announcement
        TFD.closeClanAnnouncement();
    });
	
	
	
	$(document).on('click', '#testeventbet', function () { //TEST event bet join
		TFD.testJoinEventBet();
	});
	
	$(document).on('click', '#testannouncement', function () { //TEST Clan announcements
        TFD.testAnnouncement();
    });

})(jQuery);
