var monkeyui =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	__webpack_require__(11);


	// if (!window.chatUI) 
	//     var chatUI = new ChatUI();

	// Variable to store the file to send
	var fileCaptured = {}; // save files

	// Variable to store the audio to send
	var audioCaptured = {};

	// Variable to record audio 
	// mic
	var micActivated = false;

	// vars to start the recording audio
	var mediaRecorder;
	var mediaConstraints = {
	    audio: true
	};

	// vars to handle the mp3 converter
	var ffmpegWorker;
	var ffmpegRunning = false;

	// vars to handle the timer in Record Area
	var minutesLabel;
	var secondsLabel;
	var refreshIntervalId;

	var $bubblePlayer;
	var audiobuble;
	var playIntervalBubble;
	var minutesBubbleLabel;
	var secondsBubbleLabel;
	var totalSeconds = 0;

	var audioMessageOldId;

	var globalAudioPreview;

	var timestampPrev;

	var inputConf = {}

	var chatUI = new function(){
	    this.wrapperOut = '.wrapper-out';
	    this.wrapperIn = '.wrapper-in';
	    this.contentConnection = '#content-connection';
	    this.contentApp = '#content-app';
	    this.contentConversationList = '#conversation-list';
	    this.contentConversationWindow = '#conversation-window';
	    this.contentIntroApp = '#app-intro';
	    this.user;

	    var FULLSIZE = 'fullsize';

	    this.isConversationList = true;
	    this.input = {};
	    this.input.isAttachButton = true;
	    this.input.isAudioButton = true;
	    this.input.isSendButton = true;
	    this.input.isEphemeralButton = true;
	    this.screen = {};
	    this.screen.mode = FULLSIZE;
	    this.screen.width = undefined;
	    this.screen.height = undefined;

	    this.setChat = function(conf){

	        this.isConversationList = conf.showConversationList == undefined ? true : conf.showConversationList;
	        this.input.isAttachButton = conf.input.showAttachButton == undefined ? true : conf.input.showAttachButton;
	        this.input.isAudioButton = conf.input.showAudioButton == undefined ? true : conf.input.showAudioButton;
	        this.input.isSendButton = conf.input.showSendButton == undefined ? true : conf.input.showSendButton;
	        this.input.isEphemeralButton = conf.input.showEphemeralButton == undefined ? true : conf.input.showEphemeralButton;
	        this.screen.mode = conf.screen.mode == undefined ? FULLSIZE : conf.screen.mode;
	        this.screen.width = conf.screen.width;
	        this.screen.height = conf.screen.height;
	    }

	    this.drawScene = function(content){
	        if( $('.wrapper-out').length <= 0 ){
	            if(this.screen.width != undefined && this.screen.height != undefined){
	                _scene = '<div class="wrapper-out '+this.screen.mode+'" style="width: '+this.screen.width+'; height:'+this.screen.height+';">'+
	                            '<div class="content-options">'+
	                                '<a id="w-preview"><span><i class="fa fa-sort-down"></i></span></a>'+
	                                '<a><span><i class="fa fa-times"></i></span></a>'+
	                            '</div>';
	            }else{
	                _scene = '<div class="wrapper-out '+this.screen.mode+'">';
	            }
	            _scene += '<div class="wrapper-in">'+
	                    '<div id="content-connection"></div>'+
	                    '<div id="content-app" class="disappear">';
	            if(this.isConversationList){
	                _scene += '<aside>'+
	                            '<ul id="conversation-list" class=""></ul>'+ 
	                        '</aside>';
	            }
	            var _class = this.isConversationList ? 'conversation-with' : 'conversation-only';
	                _scene += '<section id="conversation-window" class="'+_class+'">'+
	                        '</section>'+
	                    '</div>'+  
	                '</div>'+
	            '</div>';
	            $(content).append(_scene);
	            drawLoading(this.contentConnection);
	        }else{
	            $('.wrapper-out').addClass(this.screen.mode);
	        }
	        initScreenFunctionality(this.screen.height);
	        drawHeaderUserSession(this.contentApp + ' aside');
	        drawContentConversation(this.contentConversationWindow);
	        drawInput(this.contentConversationWindow, this.input);
	    }

	    function initScreenFunctionality(height){
	        $("#w-preview").click(function(){
	            //$(".wrapper-in").toggle(1000);
	            if($(this).find('.fa-sort-down').length > 0){
	                $('.wrapper-in').addClass('disappear');
	                $('.wrapper-out').css('height','25px');
	                $('#w-preview i').removeClass('fa-sort-down');
	                $('#w-preview i').addClass('fa-sort-up');
	            }else{
	                $('.wrapper-in').removeClass('disappear');
	                $('.wrapper-out').css('height',height);
	                $('#w-preview i').removeClass('fa-sort-up');
	                $('#w-preview i').addClass('fa-sort-down');
	            }
	        });
	    }

	    function drawLoading(contentConnection){
	        var _html = '<div class="spinner">'+
	            '<div class="bounce1"></div>'+
	            '<div class="bounce2"></div>'+
	            '<div class="bounce3"></div>'+
	        '</div>';
	        $(contentConnection).prepend(_html);
	    }

	    function drawHeaderUserSession(content){
	        var _html = '<header id="session-header">'+
	            '<div id="session-image">'+
	                '<img src="">'+
	            '</div>'+
	            '<div id="session-description">'+
	                '<span id="session-name"></span>'+
	            '</div>'+
	        '</header>';
	        $(content).prepend(_html);
	    }

	    function drawContentConversation(content){
	        var _html = '<div id="app-intro"><div></div></div>'+
	            '<header id="conversation-selected-header">'+
	                '<div id="conversation-selected-image">'+
	                    '<img src="">'+
	                '</div>'+
	                '<div id="conversation-selected-description">'+
	                    '<span id="conversation-selected-name"></span>'+
	                    '<span id="conversation-selected-status"></span>'+
	                '</div>'+
	            '</header>'+
	            '<div id="chat-timeline"></div>';
	        $(content).append(_html);
	    }

	    this.stopLoading = function(){
	        // to check
	        /*
	        $('.drop-login-loading').hide();
	        $('.secure-conextion-drop').show();
	        $('.secure-conextion-drop').hide();
	        */
	        $(this.contentConnection).removeClass('appear');
	        $(this.contentConnection).addClass('disappear');
	    }

	    this.startLoading = function(){
	        $(this.contentConnection).removeClass('disappear');
	        $(this.contentConnection).addClass('appear');
	    }

	    this.loadDataScreen = function(user){
	        this.user = user;
	        detectFuntionality();

	        // set contentApp
	        $(this.contentApp).removeClass('disappear');

	        // set user info
	        $("#session-name").html(this.user.name);
	        $('#session-image img').attr('src',this.user.urlAvatar);
	    }

	    function detectFuntionality(){
	        if (window.location.protocol != "https:"){
	            //disabledAudioButton(true);
	        }
	    }

	    /***********************************************/
	    /********************* INPUT *******************/
	    /***********************************************/

	    function drawInput(content, input){

	        var _html = '<div id="chat-input">'+
	            '<div id="divider-chat-input"></div>';
	            if (input.isAttachButton) {
	                _html = _html + '<div class="button-input">'+
	                                    '<button id="button-attach-file" class="button-icon"></button>'+
	                                    '<input type="file" name="attach" id="attach-file" style="display:none" accept=".pdf,.xls,.xlsx,.doc,.docx,.ppt,.pptx, image/*">'+
	                                '</div>';
	            }
	            
	            if (input.isAudioButton) {
	                _html = _html + '<div class="button-input">'+
	                                    '<button id="button-cancel-audio" class="button-icon"></button>'+
	                                '</div>';
	            }
	            
	            _html = _html + '<textarea id="message-text-input" class="textarea-input" placeholder="Write a secure message"></textarea>';
	            
	            if (input.isAudioButton) {
	                _html = _html + '<div id="record-area" class="disappear">'+
	                                    '<div class="record-preview-area">'+
	                                        '<div id="button-action-record">'+
	                                            '<button id="button-start-record"></button>'+
	                                        '</div>'+
	                                        '<div id="time-recorder"><span id="minutes">00</span><span>:</span><span id="seconds">00</span></div>'+
	                                    '</div>'+
	                                '</div>';
	            }

	            if (input.isSendButton) {
	                _html = _html + '<div class="button-input">'+
	                                    '<button id="button-send-message" class="button-icon"></button>'+
	                                '</div>';
	            }
	            
	            if (input.isAudioButton) {
	                _html = _html + '<div class="button-input">'+
	                                    '<button id="button-record-audio" class="button-icon"></button>'+
	                                '</div>';
	            } 

	            if (input.isEphemeralButton) {
	                _html = _html + '<div class="button-input">'+
	                                    '<button id="button-send-ephemeral" class="button-icon timer_icon"></button>'+
	                                '</div>';
	            }
	            
	        _html = _html + '</div>';
	        $(content).append(_html);
	        initInputFunctionality();
	    }

	    this.showChatInput = function(){
	        $('#button-action-record button').hide();
	        $('#button-action-record button').attr('onclick','');
	        $('#button-start-record').show();
	        $('#record-area').removeClass("appear");
	        $('#record-area').addClass("disappear");
	        $('#button-attach-file').parent().removeClass("disappear");
	        $('#button-cancel-audio').parent().addClass("disappear");
	        $('#button-record-audio').parent().removeClass("disappear");
	        $('#button-send-message').parent().addClass("disappear");
	        $('#button-record-audio').parent().removeClass("disappear");
	        $('#button-send-ephemeral').removeClass('enable_timer');
	        $("#minutes").html('00');
	        $("#seconds").html('00');
	        $("#message-text-input").removeClass("disappear");
	        clearAudioRecordTimer();
	        typeMessageToSend = 1;
	    }

	    function clearAudioRecordTimer() {
	        totalSeconds = 0; //encera el timer
	        clearInterval(refreshIntervalId);
	        minutesLabel.innerHTML = '00';
	        secondsLabel.innerHTML = '00';
	    }

	    function initInputFunctionality(){
	        minutesLabel = document.getElementById("minutes");
	        secondsLabel = document.getElementById("seconds");

	        // mp3 converter
	        ffmpegWorker = getFFMPEGWorker();

	        inputEvent();
	    }

	    function inputEvent(){
	        $('#message-text-input').keydown(function(event) {
	            var charCode = (window.event) ? event.which : event.keyCode;

	            if( charCode == 8 || charCode == 46 ){
	                if($('#button-send-message').is(':visible') && $(this).val().trim().length <= 1  ){
	                    $('#button-record-audio').parent().removeClass("disappear");
	                    $('#button-send-message').parent().addClass("disappear");
	                    $('#button-send-ephemeral').removeClass('enable_timer');
	                }
	            }else if(charCode == 13){
	                if (event.shiftKey === true){
	                    return true;
	                }else{
	                    var _messageText = $('#message-text-input').val().trim();
	                    $(chatUI).trigger('textMessage', _messageText);
	                    $('#message-text-input').val("");
	                    chatUI.showChatInput();
	                    return false;
	                }
	            }else{
	                if(!$('#button-send-message').is(':visible')){
	                    $('#button-record-audio').parent().addClass("disappear");
	                    $('#button-send-message').parent().removeClass("disappear");
	                    $('#button-send-ephemeral').addClass('enable_timer');
	                    typeMessageToSend = 1;
	                }
	            } 
	        });
	        
	        $('#button-send-message').click(function () {
	            switch(typeMessageToSend){
	                case 1:
	                    var _messageText = $('#message-text-input').val().trim();
	                    $(chatUI).trigger('textMessage', _messageText);
	                    $('#message-text-input').val("");
	                    chatUI.showChatInput();
	                    break;
	                case 2:
	                    $('#attach-file').val('');
	                    $('#preview-image').remove();
	                    hideChatInputFile();
	                    $(chatUI).trigger('fileMessage', fileCaptured);
	                    
	                    break;
	                case 3:
	                    if (mediaRecorder != null) {
	                        mediaRecorder.stop(); //detiene la grabacion del audio
	                    }
	                    audioCaptured.duration = totalSeconds;
	                    chatUI.showChatInput();
	                    buildAudio();
	                    mediaRecorder = null;
	                    break;
	                default:
	                    break;
	            }
	        });

	        $("#button-attach-file").click(function () {
	            $("#attach-file").trigger('click'); 
	        });

	        $('#attach-file').on('change', function (e) {
	            showChatInputFile();
	            
	            fileCaptured.file = e.target.files[0];
	            fileCaptured.ext = getExtention(fileCaptured.file);

	            var _fileType = checkExtention(fileCaptured.file);
	            if ((_fileType >= 1) && (_fileType <= 4)) {
	                fileCaptured.monkeyFileType = 4;
	            }else if ((_fileType == 6)) {
	                fileCaptured.monkeyFileType = 3;
	                showPreviewImage();
	                return ;
	            }else{
	                return false;
	            }
	        });

	        $('#button-record-audio').click(function () {
	            showChatInputRecord();
	            startRecordAudio();
	        });

	        $('#button-cancel-audio').click(function(){
	            chatUI.showChatInput();

	            var audio = document.getElementById('audio_'+timestampPrev);
	            if (audio != null)
	                audio.pause();
	        });
	    }

	    function showChatInputFile(){
	        typeMessageToSend = 2;
	        $("#chat-input").addClass('chat-input-file');
	        $('#button-attach-file').parent().addClass("disappear");
	        $('#button-record-audio').parent().addClass("disappear");
	        $('#button-send-message').parent().removeClass("disappear");
	        $('#button-send-ephemeral').addClass('enable_timer');
	    }

	    function hideChatInputFile(){
	        typeMessageToSend = 0;
	        $("#chat-input").removeClass('chat-input-file');
	        $('#button-attach-file').parent().removeClass("disappear");
	        $('#button-record-audio').parent().removeClass("disappear");
	        $('#button-send-message').parent().addClass("disappear");
	        $('#button-send-ephemeral').removeClass('enable_timer');
	    }

	    function showChatInputRecord(){
	        $('#record-area').removeClass("disappear");
	        $('#record-area').addClass("appear");
	        $('#button-cancel-audio').parent().removeClass("disappear");
	        $('#button-attach-file').parent().addClass("disappear");
	        $('#button-send-message').parent().removeClass("disappear");
	        $('#button-record-audio').parent().addClass("disappear");
	        $("#message-text-input").addClass("disappear");
	        minutesLabel = document.getElementById("minutes");
	        secondsLabel = document.getElementById("seconds");
	    }

	    function disabledAudioButton(bool){
	        $('#button-record-audio').disabled = bool;
	        if(bool){
	            $('#button-record-audio').parent().addClass("disabled");
	        }else{
	            $('#button-record-audio').parent().removeClass("disabled");
	        }
	    }
	    /***********************************************/
	    /*************** DRAW CONVERSATION *************/
	    /***********************************************/

	    this.drawConversation = function(conversation, isHidden){
	        var _conversationIdHandling = getConversationIdHandling(conversation.id);
	    
	        // set app intro
	        if(!isHidden && $(this.contentIntroApp).length >= 0){
	            $(this.contentIntroApp).remove();
	        }

	        if(!isHidden){
	            // set conversation window
	            $(this.contentConversationWindow).addClass('disabled');

	            // set header conversation
	            //var conversationPhoto = isConversationGroup(this.id) ? _conversationIdHandling : users[this.id].id;
	            $('#conversation-selected-image img').attr('src',conversation.urlAvatar);
	            var conversationName = conversation.name ? conversation.name : 'undefined';
	            $('#conversation-selected-name').html(conversationName);
	            //$('#conversation-selected-members').html('');

	            // set conversation item
	            if(this.isConversationList){
	                $(this.contentConversationList+' li').removeClass('conversation-selected');
	                $(this.contentConversationList+' li').addClass('conversation-unselected');
	                $('#conversation-'+_conversationIdHandling).removeClass('conversation-unselected');
	                $('#conversation-'+_conversationIdHandling).addClass('conversation-selected');
	                // (badge)
	                $('#conversation-'+_conversationIdHandling).find('.conversation-notification').remove();
	                removeNotification(_conversationIdHandling);
	            }

	            // set chat timeline
	            $('.chat-timeline-conversation').removeClass('appear');
	            $('.chat-timeline-conversation').addClass('disappear');
	            if ($('#chat-timeline-conversation-'+_conversationIdHandling).length > 0) {
	                $('#chat-timeline-conversation-'+_conversationIdHandling).removeClass('disappear');
	                $('#chat-timeline-conversation-'+_conversationIdHandling).addClass('appear');
	                scrollToDown();
	            }else{
	                drawConversationWindow(conversation.id, isHidden);
	                if(this.isConversationList){
	                    drawConversationItem(this.contentConversationList, conversation);
	                }
	            }

	            // set input
	            this.showChatInput();

	            // set conversation window, start to chat
	            $(this.contentConversationWindow).removeClass('disabled');
	        }else{
	            // set chat timeline
	            if ($('#chat-timeline-conversation-'+_conversationIdHandling).length <= 0) {
	                drawConversationWindow(conversation.id, isHidden);
	                if(this.isConversationList){
	                    drawConversationItem(this.contentConversationList, conversation);
	                }
	            }
	        }
	    }

	    function drawConversationWindow(conversationId, isHidden){
	        var _class = isHidden ? 'disappear' : 'appear';
	        $('#chat-timeline').append('<div class="chat-timeline-conversation '+_class+'" id="chat-timeline-conversation-'+conversationId+'"></div>');
	    }

	    function drawConversationItem(contentConversationList, conversation){

	        var _li = '<li id="conversation-'+conversation.id+'" class="conversation-unselected" onclick="openConversation(\''+conversation.id+'\')">'+
	                    '<div class="conversation-image">'+
	                        '<img src="'+conversation.urlAvatar+'" onerror="imgError(this);">';
	        var _conversationName = conversation.name ? conversation.name : 'undefined';
	        _li +=      '</div>'+
	                    '<div class="conversation-description"><div class="conversation-name"><span class="ellipsify">'+_conversationName+'</span></div><div class="conversation-state"><span class="ellipsify">Click to open conversation</span></div></div>'+
	                '</li>';
	        $(contentConversationList).append(_li);
	    }

	    this.updateDrawConversation = function(conversation){
	        var _conversationLi = $('#conversation-'+conversation.id);
	        _conversationLi.find('img').attr('src',conversation.urlAvatar);
	        _conversationLi.find('.conversation-name span').html(conversation.name);
	    }

	    this.updateOnlineStatus = function(lastOpenApp, online){
	        if (online == 0) {
	            currentConversationOnlineState = defineTime(lastOpenApp);
	            $('#conversation-selected-status').html('Last seen '+defineTime(lastOpenApp));
	        }else{
	            currentConversationOnlineState = 'Online';
	            $('#conversation-selected-status').html('Online');
	        }
	    }

	    /***********************************************/
	    /************** STATE CONVERSATION *************/
	    /***********************************************/

	    function updateNotification(text, conversationId){
	        var liConversation =  $("#conversation-"+conversationId);

	        if(text.length >= 20){
	            text = text.substr(0,20);
	        }

	        liConversation.find('.conversation-state span').html(text);
	        setNotification(conversationId);

	        if (currentConversationId != conversationId) {
	            // counting notification existing badges 

	            if (liConversation.find('.conversation-notification').length > 0) {
	                var num = parseInt( liConversation.find('.conversation-notification').first().find('.notification-amount').html() );
	                    num = num + 1;
	                    liConversation.find('.conversation-notification').first().find('.notification-amount').html(num);
	            }else{
	                liConversation.prepend('<div class="conversation-notification"><div class="notification-amount">1</div></div>');
	            }        
	        }else{
	            removeNotification(conversationId);
	        }
	    }

	    function setNotification (conversationId) {
	        var liConversation =  $("#conversation-"+conversationId);
	        liConversation.find('.conversation-description span').addClass('bold-text');
	    }

	    function removeNotification (conversationId) {
	        var liConversation =  $("conversation-"+conversationId);
	        liConversation.find('.conversation-description span').removeClass('bold-text');
	    }

	    /***********************************************/
	    /****************** DRAW BUBBLES ***************/
	    /***********************************************/

	    function defineMessageStatus(status){
	        switch(status){
	            case 0:
	                return 'status-load';
	                break;
	            case 50:
	                return 'status-sent';
	                break;
	            case 51:
	                return 'status-sent';
	                break;
	            case 52:
	                return 'status-read';
	                break;
	            default:
	                return undefined;
	                break;
	        }
	    }

	    function baseBubble(message, isOutgoing, withName, status){
	        var _bubble = '';
	        var _classBubble = isOutgoing ? 'bubble-out' : 'bubble-in';
	        var _classStatus = defineMessageStatus(status);

	        _bubble = '<div class="message-line">'+
	                    '<div id="'+message.id+'" class="bubble '+_classBubble+'">'+
	                        '<div class="message-detail">';
	        if(withName){
	            var _senderName = message.senderName ? message.senderName : 'Unknown';
	            var _classUnknown = message.senderName == undefined ? 'user-unknown' : '';
	            _bubble += '<span class="message-user-name '+_classUnknown+'" style="color: #'+message.senderColor+'">'+_senderName+'</span>';
	        }
	        _bubble += '<span class="message-hour">'+defineTime(message.timestamp*1000)+'</span>';
	        if(isOutgoing){
	            _bubble += '<div class="message-status '+_classStatus+'">';
	            if(status != 0){
	                _bubble += '<i class="fa fa-check"></i>';
	            }
	        }
	        _bubble += '</div>'+
	                '</div>'+
	            '</div>';

	        return _bubble;
	    }

	    
	    this.drawTextMessageBubble = function(message, conversationId, isGroupChat, status){
	        var _isOutgoing = message.senderId == this.user.monkeyId ? 1 : 0;
	        var _conversationIdHandling = getConversationIdHandling(conversationId);
	        var _messageText = findLinks(message.text);

	        $('#chat-timeline-conversation-'+_conversationIdHandling).append(baseBubble(message, _isOutgoing, isGroupChat, status));
	        var _classTypeBubble = _isOutgoing ? 'bubble-text-out' : 'bubble-text-in';
	        var _messagePoint = $('#'+message.id);
	        _messagePoint.addClass('bubble-text');
	        _messagePoint.addClass(_classTypeBubble);

	        var _content = '<span class="message-text">'+_messageText+'</span>';
	        _messagePoint.append(_content);
	        scrollToDown();

	        if(message.eph == 1){
	            updateNotification("Private Message",_conversationIdHandling);
	        }else{
	            updateNotification(message.text,_conversationIdHandling);
	        }
	    }

	    this.drawImageMessageBubble = function(message, conversationId, isGroupChat, status){
	        var _isOutgoing = message.senderId == this.user.monkeyId ? 1 : 0;
	        var _conversationIdHandling = getConversationIdHandling(conversationId);
	        var _fileName = message.text;
	        var _dataSource = message.dataSource != undefined ? message.dataSource : 'images/ukn.png';

	        $('#chat-timeline-conversation-'+_conversationIdHandling).append(baseBubble(message, _isOutgoing, isGroupChat, status));
	        var _classTypeBubble = _isOutgoing ? 'bubble-image-out' : 'bubble-image-in';
	        var _messagePoint = $('#'+message.id);
	        _messagePoint.addClass('bubble-image');
	        _messagePoint.addClass(_classTypeBubble);

	        var _content = '<div class="content-image" onclick="chatUI.showViewer(\''+message.id+'\',\''+_fileName+'\')">'+
	                            '<img src='+_dataSource+'>'+
	                        '</div>';
	        _messagePoint.append(_content);
	        scrollToDown();

	        if(message.eph == 1){
	            updateNotification("Private Image",_conversationIdHandling);
	        }else{
	            updateNotification("Image",_conversationIdHandling);
	        }
	    }

	    this.drawAudioMessageBubble = function(message, conversationId, isGroupChat, status, audioOldId){
	        var _isOutgoing = message.senderId == this.user.monkeyId ? 1 : 0;
	        var _conversationIdHandling = getConversationIdHandling(conversationId);
	        var _dataSource = message.dataSource;

	        var _messagePoint = $('#'+audioOldId);
	        if(_messagePoint.length > 0){
	            _messagePoint.attr('id',message.id);
	            _messagePoint.find('.content-audio-loading').remove();
	            _messagePoint = $('#'+message.id);
	        }else{
	            $('#chat-timeline-conversation-'+_conversationIdHandling).append(baseBubble(message, _isOutgoing, isGroupChat, status));
	            var _classTypeBubble = _isOutgoing ? 'bubble-audio-out' : 'bubble-audio-in';
	            _messagePoint = $('#'+message.id);
	            _messagePoint.addClass('bubble-audio');
	            _messagePoint.addClass(_classTypeBubble);
	        }
	        var _content = '<div class="content-audio disabled">'+
	                            '<img id="playAudioBubbleImg'+message.id+'" style="display:block;" onclick="chatUI.playAudioBubble('+message.id+');" class="bubble-audio-button bubble-audio-button'+message.id+' playBubbleControl" src="../images/PlayBubble.png">'+
	                            '<img id="pauseAudioBubbleImg'+message.id+'" onclick="chatUI.pauseAudioBubble('+message.id+');" class="bubble-audio-button bubble-audio-button'+message.id+'" src="../images/PauseBubble.png">'+
	                            '<input id="play-player_'+message.id+'" class="knob second" data-width="100" data-displayPrevious=true value="0">'+
	                            '<div class="bubble-audio-timer"><span id="minutesBubble'+message.id+'">00</span><span>:</span><span id="secondsBubble'+message.id+'">00</span></div>'+
	                        '</div>'+
	                        '<audio id="audio_'+message.id+'" preload="auto" style="display:none;" controls="" src="'+_dataSource+'"></audio>';
	        _messagePoint.append(_content);

	        createAudiohandlerBubble(message.id,Math.round(message.length));
	        audiobuble = document.getElementById("audio_"+message.id);
	        audiobuble.oncanplay = function() {
	            createAudiohandlerBubble(message.id,Math.round(audiobuble.duration));
	            setDurationTime(message.id);
	            $('#'+message.id+' .content-audio').removeClass('disabled');
	        };

	        scrollToDown();

	        if(message.eph == 1){
	            updateNotification("Private Audio",_conversationIdHandling);
	        }else{
	            updateNotification("Audio",_conversationIdHandling);
	        } 
	    }





	    this.drawTextMessageBubble_ = function(message, conversationId, status){
	        var _isOutgoing = message.senderId == this.user.monkeyId ? 1 : 0;
	        var _conversationIdHandling = getConversationIdHandling(conversationId);

	        var _messageText = findLinks(message.text);
	        var _bubble = '';
	        
	        if (_isOutgoing == 0) { // incoming
	            if (message.eph == 0) {
	                _bubble = '<div class="message-line">'+
	                                    '<div id="'+message.id+'" class="bubble bubble-text bubble-text-in bubble-in">'+
	                                        '<div class="message-detail">';
	                if(conversationId.indexOf("G:") >= 0){
	                    var _senderName = message.senderName ? message.senderName : 'Unknown';
	                    var _classUnknown = message.senderName == undefined ? 'user-unknown' : '';
	                    _bubble += '<span class="message-user-name '+_classUnknown+'" style="color: #'+message.senderColor+'">'+_senderName+'</span>';
	                }          
	                            _bubble += '<span class="message-hour">'+defineTime(message.timestamp*1000)+'</span>'+
	                                        '</div>'+
	                                        '<span class="message-text">'+_messageText+'</span>'+
	                                    '</div>'+
	                                '</div>';             
	            }else{
	                var _duration = Math.round(message.length * 0.07);
	                if(_duration < 15){
	                    _duration = 15;
	                }
	                _bubble = '<div class="message-line">'+
	                                    '<div id="'+message.id+'" class="bubble bubble-text bubble-text-in bubble-in bubble-private" onclick="showPrivateTextMessage(\''+message.id+'\',\''+message.senderId+'\',\''+_duration+'\')">'+
	                                        '<div class="message-detail">';
	                if(conversationId.indexOf("G:") >= 0){
	                    var _senderName = message.senderName ? message.senderName : 'Unknown';
	                    var _classUnknown = message.senderName == undefined ? 'user-unknown' : '';
	                    _bubble += '<span class="message-user-name '+_classUnknown+'" style="color: #'+message.senderColor+'">'+_senderName+'</span>';
	                }
	                            _bubble += '<div class="message-content-timer">'+
	                                                '<i class="fa fa-clock-o"></i>'+
	                                                '<span class="message-timer"> '+defineTimer(_duration)+'</span>'+
	                                            '</div>'+
	                                        '</div>'+
	                                        '<span class="message-text">Click to read</span>'+
	                                        '<div class="message-code">'+message.encryptedText+'</div>'+
	                                    '</div>'+
	                                '</div>';              
	            }
	        } else if (_isOutgoing == 1){ // outgoing
	            if (message.eph == 0){
	                var _status;
	                switch(status){
	                    case 0:
	                        _status = 'status-load';
	                        break;
	                    case 51:
	                        _status = 'status-sent';
	                        break;
	                    case 52:
	                        _status = 'status-read';
	                        break;
	                    default:
	                        break;
	                }

	                _bubble='<div class="message-line">'+
	                            '<div id="'+message.id+'" class="bubble bubble-text bubble-text-out bubble-out'+(status == 0 ? 'sending' : '')+'">'+
	                                '<div class="message-detail">'+
	                                    '<span class="message-hour">'+defineTime(message.timestamp)+'</span>'+
	                                    '<div class="message-status '+_status+'">';
	                                    if(status != 0){
	                                        _bubble += '<i class="fa fa-check"></i>';
	                                    }
	                                _bubble += '<div class="message-time" style="display: none;">'+message.timestamp+'</div>'+
	                                    '</div>'+
	                                '</div>'+
	                                '<div class="button-message-unsend" onclick="unsendMessage(\''+message.id+'\',\''+conversationId+'\')">x</div>'+
	                                '<span class="message-text">'+_messageText+'</span>'+
	                            '</div>'+
	                        '</div>';
	            }else{
	                _bubble='<div class="message-line">'+
	                                '<div id="'+message.id+'" class="bubble bubble-text bubble-text-out bubble-out'+(status == 0 ? 'sending' : '')+'">'+
	                                    '<div class="message-detail">'+
	                                        '<span class="message-hour">'+defineTime(message.timestamp)+'</span>'+
	                                        '<div class="message-status '+_status+'">';
	                                        if(status != 0){
	                                            _bubble += '<i class="fa fa-check"></i>';
	                                        }
	                                    _bubble += '<div class="message-time" style="display: none;">'+message.timestamp+'</div>'+
	                                        '</div>'+
	                                    '</div>'+
	                                    '<div class="button-message-unsend" onclick="unsendMessage(\''+message.id+'\',\''+conversationId+'\')">x</div>'+
	                                    '<span class="message-text">Private Message</span>'+
	                                '</div>'+
	                            '</div>';
	            }
	        }
	        $('#chat-timeline-conversation-'+_conversationIdHandling).append(_bubble);
	        
	        scrollToDown();

	        if(message.eph == 1){
	            updateNotification("Private Message",_conversationIdHandling);
	        }else{
	            updateNotification(message.text,_conversationIdHandling);
	        }
	    }

	    this.drawImageMessageBubble_ = function(message, conversationId, status){
	        var _isOutgoing = message.senderId == this.user.monkeyId ? 1 : 0;
	        var _conversationIdHandling = getConversationIdHandling(conversationId);

	        var _fileName = message.text;
	        var _dataSource = message.dataSource != undefined ? message.dataSource : 'images/ukn.png';
	        var _bubble = '';

	        if (_isOutgoing == 0) { // incoming
	            if (message.eph == 0) {
	                _bubble = '<div class="message-line">'+
	                                '<div id="'+message.id+'" class="bubble-image-in bubble-in">'+
	                                    '<div class="message-detail">';
	                if(conversationId.indexOf("G:") >= 0){
	                    var _senderName = message.senderName ? message.senderName : 'Unknown';
	                    var _classUnknown = message.senderName == undefined ? 'user-unknown' : '';
	                    _bubble += '<span class="message-user-name '+_classUnknown+'" style="color: #'+message.senderColor+'">'+_senderName+'</span>';
	                }
	                        _bubble += '<span class="message-hour">'+defineTime(message.timestamp*1000)+'</span>'+
	                                    '</div>'+
	                                    '<div class="content-image" onclick="chatUI.showViewer(\''+message.id+'\',\''+_fileName+'\')">'+
	                                      '<img src='+_dataSource+'>'+
	                                    '</div>'+
	                                '</div>'+
	                            '</div>';
	            }else{
	                var _duration = 15;

	                _bubble = '<div class="message-line">'+
	                                    '<div id="'+message.id+'" class="bubble-image-private-in bubble-in bubble-private" onclick="showPrivateViewer(\''+message.id+'\',\''+message.senderId+'\',\''+_duration+'\',\''+message.cmpr+'\',\''+message.encr+'\')">'+
	                                        '<div class="message-detail">';
	                if(conversationId.indexOf("G\\:") >= 0){
	                    var _conversation = conversations[message.recipientId];
	                    var _classUnknown = users[message.senderId].id == undefined ? 'user-unknown' : '';
	                    _bubble += '<span class="message-user-name '+_classUnknown+'" style="color: #'+colorUsers[_conversation.members.indexOf(message.senderId)]+'">'+users[message.senderId].name+'</span>';
	                }
	                                    _bubble += '<div class="message-content-timer">'+
	                                                '<i class="fa fa-clock-o"></i>'+
	                                                '<span class="message-timer"> '+defineTimer(_duration)+'</span>'+
	                                            '</div>'+
	                                        '</div>'+
	                                        '<div class="message-icon-define icon-image"></div>'+
	                                        '<span class="message-text">Click to view</span>'+
	                                        '<div class="message-code">'+message.encryptedText+'</div>'+
	                                    '</div>'+
	                                '</div>';
	            }
	        } else if (_isOutgoing == 1){ // outgoing
	            if(message.eph == 0){
	                _bubble = '<div class="message-line">'+
	                                    '<div id="'+message.id+'" class="bubble-image-out bubble-out">'+
	                                        '<div class="message-detail">'+
	                                            '<span class="message-hour">'+defineTime(message.timestamp)+'</span>'+
	                                            '<div class="message-status status-load">'+
	                                                '<div class="message-time" style="display: none;">'+message.timestamp+'</div>'+
	                                            '</div>'+
	                                        '</div>'+
	                                        '<div class="button-message-unsend" onclick="unsendMessage(\''+message.id+'\',\''+conversationId+'\')">x</div>'+
	                                        '<div class="content-image" onclick="chatUI.showViewer(\''+message.id+'\',\''+_fileName+'\')">'+
	                                            '<img src="'+_dataSource+'">'+
	                                        '</div>'+
	                                    '</div>'+
	                                '</div>';
	            }else{
	                _bubble='<div class="message-line">'+
	                                '<div id="'+message.id+'" class="bubble-text-out bubble-out sending">'+
	                                    '<div class="message-detail">'+
	                                        '<span class="message-hour">'+defineTime(message.timestamp)+'</span>'+
	                                        '<div class="message-status status-load">'+
	                                            '<div class="message-time" style="display: none;">'+message.timestamp+'</div>'+
	                                        '</div>'+
	                                    '</div>'+
	                                    '<div class="button-message-unsend" onclick="unsendMessage(\''+message.id+'\',\''+conversationId+'\')">x</div>'+
	                                    '<span class="message-text">Private Image</span>'+
	                                '</div>'+
	                            '</div>';
	            }
	        }
	        $('#chat-timeline-conversation-'+_conversationIdHandling).append(_bubble);
	        scrollToDown();

	        if(message.eph == 1){
	            updateNotification("Private Image",_conversationIdHandling);
	        }else{
	            updateNotification("Image",_conversationIdHandling);
	        }
	    }

	    this.drawAudioMessageBubble_ = function(message, conversationId, status, messageOldId){
	        var _isOutgoing = message.senderId == this.user.monkeyId ? 1 : 0;
	        var _conversationIdHandling = getConversationIdHandling(conversationId);

	        var _dataSource = message.dataSource;
	        var _bubble='';
	        if (_isOutgoing == 0) { // incoming
	            if (message.eph == 0) {
	                
	                _bubble = '<div class="message-line">'+
	                                '<div id="'+message.id+'" class="bubble-audio-in bubble-in">'+
	                                    '<div class="message-detail">';
	                if(conversationId.indexOf("G:") >= 0){
	                    var _senderName = message.senderName ? message.senderName : 'Unknown';
	                    var _classUnknown = message.senderName == undefined ? 'user-unknown' : '';
	                    _bubble += '<span class="message-user-name '+_classUnknown+'" style="color: #'+message.senderColor+'">'+_senderName+'</span>';
	                }
	                        _bubble += '<span class="message-hour">'+defineTime(message.timestamp*1000)+'</span>'+
	                                    '</div>'+
	                                    '<div class="content-audio">'+
	                                        '<img id="playAudioBubbleImg'+message.id+'" style="display:block;" onclick="chatUI.playAudioBubble('+message.id+');" class="bubble-audio-button bubble-audio-button'+message.id+' playBubbleControl" src="../images/PlayBubble.png">'+
	                                        '<img id="pauseAudioBubbleImg'+message.id+'" onclick="chatUI.pauseAudioBubble('+message.id+');" class="bubble-audio-button bubble-audio-button'+message.id+'" src="../images/PauseBubble.png">'+
	                                        '<input id="play-player_'+message.id+'" class="knob second" data-width="100" data-displayPrevious=true value="0">'+
	                                        '<div class="bubble-audio-timer"><span id="minutesBubble'+message.id+'">'+("0" + parseInt(message.length/60)).slice(-2)+'</span><span>:</span><span id="secondsBubble'+message.id+'">'+("0" + message.length%60).slice(-2)+'</span></div>'+
	                                    '</div>';
	                        var _dataSource = message.dataSource != undefined ? message.dataSource : '';    
	                        _bubble += '<audio id="audio_'+message.id+'" preload="auto" style="display:none;" controls="" src="'+_dataSource+'"></audio>'+
	                                '</div>'+                            
	                            '</div>';
	            }else{
	                var _duration = Math.round(message.length + (message.length * 0.25));
	                if(_duration < 15){
	                    _duration = 15;
	                }

	                _bubble = '<div class="message-line">'+
	                                '<div id="'+message.id+'" class="bubble-audio-private-in bubble-in bubble-private" onclick="showPrivateAudioMessage(\''+message.id+'\',\''+message.senderId+'\',\''+_duration+'\',\''+message.cmpr+'\',\''+message.encr+'\')">'+
	                                    '<div class="message-detail">';
	                if(conversationId.indexOf("G\\:") >= 0){
	                    var _conversation = conversations[message.recipientId];
	                    var _classUnknown = users[message.senderId].id == undefined ? 'user-unknown' : '';
	                    _bubble += '<span class="message-user-name '+_classUnknown+'" style="color: #'+colorUsers[_conversation.members.indexOf(message.senderId)]+'">'+users[message.senderId].name+'</span>';
	                }
	                        _bubble += '<div class="message-content-timer">'+
	                                            '<i class="fa fa-clock-o"></i>'+
	                                            '<span class="message-timer"> '+defineTimer(_duration)+'</span>'+
	                                        '</div>'+
	                                    '</div>'+
	                                    '<div class="message-icon-define icon-audio"></div>'+
	                                    '<span class="message-text">Click to listen</span>'+
	                                    '<div class="message-code">'+message.encryptedText+'</div>'+
	                                '</div>'+
	                            '</div>';
	            }
	        }else if (_isOutgoing == 1){ // outgoing
	            if(message.eph == 0){
	                if(messageOldId == undefined){
	                    _bubble += '<div class="message-line">';
	                }
	                    _bubble +=  '<div id="'+message.id+'" class="bubble-audio-out bubble-out">'+
	                                    '<div class="message-detail">'+
	                                        '<span class="message-hour">'+defineTime(message.timestamp)+'</span>'+
	                                        '<div class="message-status status-load">'+
	                                            '<div class="message-time" style="display: none;">'+message.timestamp+'</div>'+
	                                        '</div>'+
	                                    '</div>'+
	                                    '<div class="button-message-unsend" onclick="unsendMessage(\''+message.id+'\',\''+conversationId+'\')">x</div>'+
	                                    '<div class="content-audio">'+
	                                        '<img id="playAudioBubbleImg'+message.id+'" style="display:block;" onclick="chatUI.playAudioBubble('+message.id+');" class="bubble-audio-button bubble-audio-button'+message.id+' playBubbleControl" src="../images/PlayBubble.png">'+
	                                        '<img id="pauseAudioBubbleImg'+message.id+'" onclick="chatUI.pauseAudioBubble('+message.id+');" class="bubble-audio-button bubble-audio-button'+message.id+'" src="../images/PauseBubble.png">'+
	                                        '<input id="play-player_'+message.id+'" class="knob second" data-width="100" data-displayPrevious=true value="0">'+
	                                        '<div class="bubble-audio-timer"><span id="minutesBubble'+message.id+'">00</span><span>:</span><span id="secondsBubble'+message.id+'">00</span></div>'+
	                                    '</div>'+
	                                    '<audio id="audio_'+message.id+'" preload="auto" style="display:none;" controls="" src="'+_dataSource+'"></audio>'+
	                                '</div>';
	                if(messageOldId == undefined){
	                    _bubble += '</div>';
	                }
	            }else{
	                _bubble='<div class="message-line">'+
	                            '<div id="'+message.id+'" class="bubble-text-out bubble-out sending">'+
	                                '<div class="message-detail">'+
	                                    '<span class="message-hour">'+defineTime(message.timestamp)+'</span>'+
	                                    '<div class="message-status status-load">'+
	                                        '<div class="message-time" style="display: none;">'+message.timestamp+'</div>'+
	                                    '</div>'+
	                                '</div>'+
	                                '<div class="button-message-unsend" onclick="unsendMessage(\''+message.id+'\',\''+conversationId+'\')">x</div>'+
	                                '<span class="message-text">Private audio</span>'+
	                            '</div>'+
	                        '</div>';
	            }
	        }

	        if(messageOldId != undefined){
	            $('#'+messageOldId).parent().html(_bubble);
	        }else{
	            $('#chat-timeline-conversation-'+_conversationIdHandling).append(_bubble);
	        } 
	        scrollToDown();
	        
	        if(message.eph == 1){
	            updateNotification("Private Audio",_conversationIdHandling);
	        }else{
	            updateNotification("Audio",_conversationIdHandling);
	        }  

	        createAudiohandlerBubble(message.id,Math.round(message.length));

	        if(message.eph == 0){
	            console.log("audio_"+message.id);
	            audiobuble = document.getElementById("audio_"+message.id);
	            audiobuble.oncanplay = function() {
	                createAudiohandlerBubble(message.id,Math.round(audiobuble.duration));
	                setDurationTime(message.id);
	                $('#'+messageId+' .content-audio').removeClass('disabled');
	            };
	        }
	    }

	    function drawAudioMessageBubbleTemporal(dataSource, message, duration){
	        $('#chat-timeline').find('.appear').append(baseBubble(message, 1, false, 0));
	        var _classTypeBubble = 'bubble-audio-out';
	        _messagePoint = $('#'+message.id);
	        _messagePoint.addClass('bubble-audio');
	        _messagePoint.addClass(_classTypeBubble);

	        var _content = '<div class="content-audio-loading">'+
	                            '<div class="double-bounce1"></div>'+
	                            '<div class="double-bounce2"></div>'+
	                        '</div>';
	        _messagePoint.append(_content);
	        scrollToDown();
	    }

	    this.getMessageUnknown = function(){
	        return $('.user-unknown');
	    }

	    this.updateDataMessageBubble = function(messageId, data){
	        var messagePoint = $('#'+messageId);
	        if(messagePoint.find('.content-image').length > 0){
	            messagePoint.find('img').attr('src',data);
	        }else if(messagePoint.find('audio').length > 0){
	            messagePoint.find('audio').attr('src',data);
	        }
	    }

	    /***********************************************/
	    /***************** STATE BUBBLE ****************/
	    /***********************************************/

	    this.updateStatusSentMessageBubble = function(messageOldId, messageNewId, status) {

	        var messagePoint = $('#'+messageOldId);

	        if(messageOldId != messageNewId && messagePoint.length > 0){
	            messagePoint.attr('id',messageNewId);
	            // var _contentOnClick = messagePoint.find('.button-message-unsend').attr('onclick');
	            // var _conversationId = _contentOnClick.slice(29,_contentOnClick.length - 2);
	            // messagePoint.find('.button-message-unsend').attr({
	            //   onclick: "unsendMessage('"+messageNewId+"','"+_conversationId+"')"
	            // });
	        }
	        messagePoint = $('#'+messageNewId);
	        
	        if (messagePoint.find('.content-image').length > 0) { // image message
	            var _onClickAttribute = messagePoint.find('.content-image').attr('onclick');
	            _onClickAttribute = _onClickAttribute+"";
	            var params = _onClickAttribute.split(',');
	            var _fileName = params[1].substr(1,params[1].length-3);
	            messagePoint.find('.content-image').attr({
	              onclick: "chatUI.showViewer('"+messageNewId+"','"+_fileName+"')"
	            });
	        }
	        
	        messagePoint.find('.message-status').removeClass('status-load');
	        messagePoint.find('.message-status').removeClass('status-sent');

	        if (status == 52) {
	            messagePoint.find('.message-status').addClass('status-read');
	        }else if (status == 50 || status == 51){
	            messagePoint.find('.message-status').addClass('status-sent');
	        }
	        
	        if(messagePoint.find('.fa').length <= 0){
	            messagePoint.find('.message-status').prepend('<i class="fa fa-check"></i>');
	        }   
	    }

	    /***********************************************/
	    /***************** AUDIO PLAYER ****************/
	    /***********************************************/

	    // define duration of bubble audio player
	    function createAudiohandlerBubble(timestamp, duration) {
	        $("#play-player_"+timestamp).knob({
	            'min':0,
	            'max': duration,
	            'angleOffset':-133,
	            'angleArc': 265,
	            'width':100,
	            'height': 90,
	            'displayInput':false,
	            'skin':'tron',
	            change : function (value) {
	                audiobuble.currentTime=value;
	            }
	        });
	    }

	    this.playAudioBubble = function(timestamp) {
	        pauseAllAudio (timestamp);
	        $bubblePlayer = $("#play-player_"+timestamp); //handles the cricle
	        $('.bubble-audio-button'+timestamp).hide();
	        $('#pauseAudioBubbleImg'+timestamp).css('display', 'block');
	        minutesBubbleLabel = document.getElementById("minutesBubble"+timestamp);
	        secondsBubbleLabel = document.getElementById("secondsBubble"+timestamp);
	        audiobuble = document.getElementById("audio_"+timestamp);
	        audiobuble.play();
	        playIntervalBubble = setInterval("chatUI.updateAnimationBuble()",1000);
	        audiobuble.addEventListener("ended",function() {
	            setDurationTime(timestamp);
	            //this.load();
	            $bubblePlayer.val(0).trigger("change");
	            $('#playAudioBubbleImg'+timestamp).css('display', 'block');
	            $('#pauseAudioBubbleImg'+timestamp).css('display', 'none');
	            clearInterval(playIntervalBubble);
	        });
	    }

	    this.updateAnimationBuble = function() {
	        var currentTime = Math.round(audiobuble.currentTime);
	        $bubblePlayer.val(currentTime).trigger("change");
	        secondsBubbleLabel.innerHTML = ("0" + currentTime%60).slice(-2);
	        minutesBubbleLabel.innerHTML = ("0" + parseInt(currentTime/60)).slice(-2);
	    }

	    this.pauseAudioBubble = function(timestamp) {
	        $('.bubble-audio-button'+timestamp).hide();
	        $('#playAudioBubbleImg'+timestamp).toggle();
	        audiobuble.pause();
	        clearInterval(playIntervalBubble);
	    }

	    function pauseAllAudio (timestamp) {
	        document.addEventListener('play', function(e){
	            var audios = document.getElementsByTagName('audio');
	            for(var i = 0, len = audios.length; i < len;i++){
	                if(audios[i] != e.target){
	                    //console.log(audios[i].id);
	                    audios[i].pause();
	                    $('.bubble-audio-button').hide();
	                    $('.playBubbleControl').show();
	                    $('#playAudioBubbleImg'+timestamp).hide();
	                    $('#pauseAudioBubbleImg'+timestamp).show();
	                }   
	            }
	        }, true);
	    }

	    function setDurationTime (timestamp) {
	        audiobuble = document.getElementById("audio_"+timestamp);
	        var durationTime= Math.round(audiobuble.duration);
	        minutesBubbleLabel = document.getElementById("minutesBubble"+timestamp);
	        secondsBubbleLabel = document.getElementById("secondsBubble"+timestamp);
	        secondsBubbleLabel.innerHTML = ("0" + durationTime%60).slice(-2);
	        minutesBubbleLabel.innerHTML = ("0" + parseInt(durationTime/60)).slice(-2);
	    }

	    /***********************************************/
	    /******************** VIEWER *******************/
	    /***********************************************/

	    this.addLoginForm = function(html){
	        $(this.wrapperIn).append(html);
	    }

	    this.showViewer = function(messageId, fileName){
	        var _messagePoint = $('#'+messageId);
	        var _file = _messagePoint.find('.content-image img').attr('src');

	        var _html = '<div class="viewer-content">'+
	            '<div class="viewer-toolbar">'+
	                '<button id="button-exit" onclick="chatUI.exitViewer()"> X </button>'+
	                '<a href="'+_file+'" download="'+fileName+'" >'+
	                    '<button class="button-download" title="Download">Download</button>'+
	                '</a>'+
	                // '<a href="'+_file+'" >'+
	                    '<button class="button-download" title="Download" onclick="chatUI.printFile()" >Print</button>'+
	                // '</a>'+
	            '</div>'+
	            '<div id="file_viewer_image" class="viewer-image">'+
	                '<img  src="'+_file+'">'+
	            '</div>'+
	            '<div class="brand-app"></div>'+
	        '</div>';

	        $('.wrapper-out').append(_html);
	    }

	    this.printFile = function(){
	        Popup($('#file_viewer_image').html());
	    }

	    function Popup(data) {
	        var mywindow = window.open('', 'my div', 'height=400,width=600');
	        mywindow.document.write('<html><head><title>my div</title>');
	        /*optional stylesheet*/ //mywindow.document.write('<link rel="stylesheet" href="main.css" type="text/css" />');
	        mywindow.document.write('</head><body >');
	        mywindow.document.write(data);
	        mywindow.document.write('</body></html>');

	        mywindow.document.close(); // necessary for IE >= 10
	        mywindow.focus(); // necessary for IE >= 10

	        mywindow.print();
	        mywindow.close();

	        return true;
	    }

	    this.exitViewer = function(){
	        $('.viewer-content').remove();
	    }

	    function showPreviewImage () {
	        var image_data = '';

	        FileAPI.readAsDataURL(fileCaptured.file, function (evt){
	            if( evt.type == 'load' ){
	                fileCaptured.src = evt.result;
	                
	                var html = '<div id="preview-image">'+
	                      '<div class="preview-head">'+
	                        '<div class="preview-title">Preview</div> '+
	                        '<div id="close-preview-image" class="preview-close" onclick="chatUI.closeImagePreview(this)">X</div>'+
	                      '</div>'+
	                      '<div class="preview-container">'+
	                        '<img id="image_preview" src="'+fileCaptured.src+'">'+
	                      '</div>'+
	                    '</div>';

	                $('#chat-timeline').before(html);
	            }
	        });
	    }

	    this.closeImagePreview = function(obj) {
	        hideChatInputFile();
	        $(obj).parent().parent().remove();
	        $('#attach-file').val('');
	    }

	    function scrollToDown(container){  
	        $('#chat-timeline').animate({ scrollTop:100000000 }, 400); 
	    }
	    /***********************************************/
	    /***************** RECORD AUDIO ****************/
	    /***********************************************/

	    // starts the library to record audio
	    function startRecordAudio(){
	        if (mediaRecorder == null) {
	            $('#button-send-ephemeral').addClass('enable_timer');
	            if (!micActivated) {
	                navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
	                micActivated=!micActivated;
	            }else{
	                onMediaSuccess(mediaConstraints);
	                pauseAllAudio ('');
	            }
	        }
	    }

	    //if the browser can not record.. 
	    function onMediaError(e) {
	        console.error('media error', e);
	    }
	    
	    // if the browser can record, this is executed
	    function onMediaSuccess(stream) {
	        //default settings to record
	        typeMessageToSend = 3;
	        mediaRecorder = new MediaStreamRecorder(stream);
	        mediaRecorder.mimeType = 'audio/wav';
	        mediaRecorder.audioChannels = 1;
	        // createJqueryMeter(30000);

	        mediaRecorder.ondataavailable = function (blob) {
	            // $('#jqmeter-audio').remove();
	            //clearAudioRecordTimer();
	            var timestamp = new Date().getTime();
	            audioCaptured.blob = blob; //need to save the raw data
	            audioCaptured.src = URL.createObjectURL(blob); // need to save de URLdata
	        };

	        refreshIntervalId = setInterval(setTime, 1000);//start recording timer
	        mediaRecorder.start(99999999999);//starts recording
	    }

	    function setTime(){
	        console.log(totalSeconds);
	        ++totalSeconds;
	        secondsLabel.innerHTML = ("0" + totalSeconds%60).slice(-2);
	        minutesLabel.innerHTML = ("0" + parseInt(totalSeconds/60)).slice(-2);
	    }

	    // pause audio
	    function pauseAudioPrev() {
	        globalAudioPreview.pause();
	        clearInterval(refreshIntervalAudio);
	    }

	    function buildAudio(){
	        if (globalAudioPreview != null)
	            pauseAudioPrev();

	        audioMessageOldId = Math.round((new Date().getTime()/1000)*-1);
	        drawAudioMessageBubbleTemporal(audioCaptured.src, {id: audioMessageOldId, timestamp: Math.round(new Date().getTime()/1000)}, audioCaptured.duration);
	        disabledAudioButton(true);
	        FileAPI.readAsArrayBuffer(audioCaptured.blob, function (evt){
	            if( evt.type == 'load' ){
	                buildMP3('audio_.wav',evt.result);
	            } else if( evt.type =='progress' ){
	                var pr = evt.loaded/evt.total * 100;
	            } else {  /* Error*/  }
	        });
	    }

	    function buildMP3(fileName, fileBuffer){
	        if (ffmpegRunning) {
	            ffmpegWorker.terminate();
	            ffmpegWorker = getFFMPEGWorker();
	        }

	        ffmpegRunning = true;
	        var fileNameExt = fileName.substr(fileName.lastIndexOf('.') + 1);
	        var outFileName = fileName.substr(0, fileName.lastIndexOf('.')) + "." + "mp3";
	        var arguments = [];
	        arguments.push("-i");
	        arguments.push(fileName);
	        arguments.push("-b:a");
	        arguments.push('128k');
	        arguments.push("-acodec");
	        arguments.push("libmp3lame");
	        arguments.push("out.mp3");

	        ffmpegWorker.postMessage({
	            type: "command",
	            arguments: arguments,
	            files: [{
	                    "name": fileName,
	                    "buffer": fileBuffer
	            }]
	        });
	    }

	    function getFFMPEGWorker() {
	        var ffmpegWorker = new Worker('/scripts/ffmpegWorker.js');
	        ffmpegWorker.addEventListener('message', function(event) {
	            var message = event.data;

	            if (message.type === "ready" && window.File && window.FileList && window.FileReader){
	            } else if (message.type == "stdout") {
	                // console.log(message.data);
	            } else if (message.type == "stderr") {

	            } else if (message.type == "done") {
	                var code = message.data.code;
	                var outFileNames = Object.keys(message.data.outputFiles);

	                if (code == 0 && outFileNames.length) {

	                    var outFileName = outFileNames[0];
	                    var outFileBuffer = message.data.outputFiles[outFileName];
	                    mp3Blob = new Blob([outFileBuffer]);
	                    // var src = window.URL.createObjectURL(mp3Blob);
	                    readData(mp3Blob);
	                } else {
	                    console.log('hubo un error');
	                }
	            }
	        }, false);
	        return ffmpegWorker;
	    }

	    function readData(mp3Blob) { // read mp3 audio
	        FileAPI.readAsDataURL(mp3Blob, function (evt){
	            if( evt.type == 'load' ){
	                disabledAudioButton(false);
	                //var dataURL = evt.result;
	                var _src = evt.result;
	                var _dataSplit = _src.split(',');
	                var _data = _dataSplit[1];
	                audioCaptured.src = 'data:audio/mpeg;base64,'+_data;
	                audioCaptured.monkeyFileType = 1;
	                audioCaptured.oldId = audioMessageOldId;
	                $(chatUI).trigger('audioMessage', audioCaptured);
	            } else if( evt.type =='progress' ){
	                var pr = evt.loaded/evt.total * 100;
	            } else {/*Error*/}
	        }) 
	    }

	    /***********************************************/
	    /********************* UTIL ********************/
	    /***********************************************/

	    function checkExtention (files) {
	        var ft=0;  //fileType by extention

	        var doc=["doc","docx"]; //1
	        var pdf=["pdf"]; //2
	        var xls=["xls", "xlsx"]; //3
	        var ppt=["ppt","pptx"]; //4
	        var img=["jpe","jpeg","jpg","png","gif"]; //6

	        var extension = getExtention(files);

	        if((doc.indexOf(extension)>-1)){
	            ft=1;
	        }
	        if(xls.indexOf(extension)>-1){
	            ft=3;
	        }
	        if(pdf.indexOf(extension)>-1){
	            ft=2;
	        }
	        if(ppt.indexOf(extension)>-1){
	            ft=4;
	        }
	        if(img.indexOf(extension)>-1){
	            ft=6;
	        }

	        return ft;
	    }

	    function getExtention (files){
	        var arr = files.name.split('.');
	        var extension= arr[arr.length-1];

	        return extension;
	    }

	    function findLinks (message) { // check text to find urls and make them links 
	        if (message == undefined) {
	            return '';
	        }
	        var _exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
	        message = message.replace(_exp,"<a href='$1' target='_blank'>$1</a>");
	        replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	        message = message.replace(replacePattern2, '$1<a href="http://$2" target="_blank" >$2</a>');
	        replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
	        message = message.replace(replacePattern3, '<a href="mailto:$1" target="_blank">$1</a>');

	        return message;
	    }
	}

	// ChatUI.protocolType.defineDiv = function(wrapperOut, wrapperIn, contentConversationList, contentConversationWindow){
	//     this.wrapperOut = wrapperOut;
	//     this.wrapperIn = wrapperIn;
	//     this.contentConversationList = contentConversationList;
	//     this.contentConversationWindow = contentConversationWindow;
	// }

	/**
	   * A representation of a user.
	   *
	   * @class User
	   * @constructor
	   * @param {int}       id To identify the user.
	   * @param {String}    monkeyId To identify the user on monkey
	   * @param {String}    name A name to be displayed as the author of the message.
	   */
	  
	function User(id, monkeyId, name, privacy, urlAvatar, isFriend){

	    if(id != undefined){
	        this.id = id;
	    }
	    
	    this.monkeyId = monkeyId;
	    this.name = name;
	    this.privacy = privacy;
	    this.urlAvatar = urlAvatar;
	    this.isFriend = isFriend;
	}

	/**
	   * A representation of a conversation.
	   *
	   * @class Conversation
	   * @constructor
	   * @param {int}       id To identify the conversation.
	   * @param {Object}    info A data about group conversation
	   */

	function Conversation(id, name, urlAvatar, members){
	    this.id = id;
	    this.lastMessage = null;
	    this.unreadMessageCount = 0;
	    this.name = name;
	    this.urlAvatar = urlAvatar;
	    this.members = members;

	    this.setLastOpenMe = function(lastOpenMe){
	        this.lastOpenMe = lastOpenMe;
	    }
	}

	/**
	   * A representation of a message.
	   *
	   * @class Message
	   * @constructor
	   * @param {MOKMessage} mokMessage recevived by Monkey.
	   */
	  
	function Message(mokMessage) {

	    this.id = mokMessage.id;
	    this.protocolType = mokMessage.protocolType;
	    this.senderId = mokMessage.senderId;
	    this.timestamp = mokMessage.datetimeCreation;
	    //this.encryptedText = mokMessage.encryptedText;
	    this.text = mokMessage.text;
	    this.recipientId = mokMessage.recipientId;

	    if(mokMessage.params){ 
	        this.length = mokMessage.params.length;
	    }else{
	        this.length = 15;
	    }
	    
	    this.typeFile = mokMessage.props.file_type;
	    this.encr = mokMessage.props.encr;
	    this.cmpr = mokMessage.props.cmpr;
	    this.ext = mokMessage.props.ext;
	    this.eph = mokMessage.params.eph == undefined ? 0 : mokMessage.params.eph;

	    this.senderName = undefined;
	    this.senderColor = undefined;

	    this.setDataSource = function(dataSource){
	        this.dataSource = dataSource;
	    }

	    this.isEncrypted = function(){
	        return this.encr == 1 ? true : false;
	    }

	    this.isCompressed = function(){
	        return this.cmpr != undefined ? true : false;
	    }

	    this.compressionMethod = function(){
	        return this.cmpr;
	    }
	}

	Message.prototype.setSenderName = function(senderName){
	     this.senderName = senderName;
	}

	Message.prototype.setSenderColor = function(senderColor){
	     this.senderColor = senderColor;
	}










	function drawAttachMessageBubble(file_,fileName_,encryption_,compression_,ephimero_,isOutgoing,conversationId,messageId_,datetime_) {
	    var _bubble='';

	    if (isOutgoing == 0) { // incoming
	        if(fileName_ == 'undefined')
	            fileName_ = '';
	        if (ephimero_ == 0) {
	            _bubble = '<div id="'+messageId_+'" class="message-line">'+
	                '<div class="message-detail">'+
	                    '<span class="message-hour">'+defineTime(datetime_*1000)+'</span>'+
	                '</div>'+
	                '<div class="bubble-attach-in">'+
	                    '<div class="textMessage textMessageClient textMessageClientFile" id="bubble'+messageId_+'" >'+
	                        '<div id="attachBubble'+messageId_+'" class="link-content">'+
	                        '</div>'+
	                    '</div>'+
	                '</div>'+
	            '</div>';
	            $('#chat-timeline-conversation-'+conversationId).append(_bubble);
	            updateNotification('File Message',conversationId);
	            //drawFileTypeIntoBubble(6,file_, messageId_,fileName_);
	        }else{
	        }
	        
	    } else if (isOutgoing == 1){ // outgoing
	        $('#chat-timeline-conversation-'+conversationId).append('<div class="message-line">'+
	                '<div class="message-detail">'+
	                    '<span class="message-hour">'+defineTime(datetime_)+'</span>'+
	                '</div>'+
	                '<div id="'+messageId_+'" class="bubble-attach-out bubble-out">'+
	                    '<div class="textMessage textMessageClient textMessageClientFile" id="bubble'+messageId_+'" >'+
	                        '<div id="attachBubble'+messageId_+'" class="link-content" ">'+
	                            '<div id="jqmeter-container'+messageId_+'"> '+file_.name+'</div>'+
	                        '</div>'+
	                    '</div>'+
	                    '<div class="message-status status-load">'+
	                        '<div class="message-time" style="display: none;">'+datetime_+'</div>'+
	                    '</div>'+
	                '</div>'+
	            '</div>');
	        drawFileTypeIntoBubble(6,file_,messageId_,fileName_);
	    }

	    scrollToDown();
	}

	function drawFileTypeIntoBubble(fileType_,file, messageId_, fileName) {
	    // if (fileName=='undefined')
	    //     fileName=files.name;

	    $('#attachBubble'+messageId_).remove();

	    if (fileType_ == 6) {
	        $('#bubble'+messageId_).addClass('icon-image');

	        // var html = '<img class="image_upload_preview" src="./images/img-icon.png" alt="your image" />';
	        // $('#bubble'+messageId_).last().append(html);
	    }else{
	        var html='<div class="link-content"> <table><tr>';

	        switch(fileType_){
	            case 1:
	                html=html+'<td><img class="image_upload_preview" src="./images/word-icon.png" alt="your image" /></td> ';
	                break;
	            case 2:
	                html=html+'<td><img class="image_upload_preview" src="./images/pdf-icon.png" alt="your image" /></td> ';
	                break;
	            case 3:
	                html=html+'<td><img class="image_upload_preview" src="./images/xls-icon.png" alt="your image" /> </td>';
	                break;
	            case 4:
	                html=html+'<td><img class="image_upload_preview" src="./images/ppt-icon.png" alt="your image" /></td> ';
	                break;
	            case 6:
	                html=html+'<td><img class="image_upload_preview" src="./images/img-icon.png" alt="your image" /> </td>';
	                break;
	        }

	        html=html +'<td> <div class="attach-info">'+
	                        'Secure Attachment <br><span>' + fileName + '</span>'+
	                    '</div></td>'+
	                    '<td><a href="'+file+'" download="'+fileName+'" >'+
	                        '<img class="download_icon" src="./images/attach.png" alt="your image" /></a>'+
	                    '</td>'+
	                '</tr></table></div>';

	        $('#bubble'+messageId_).last().append(html);
	    }
	}

	function defineTimer(duration){
	    var _minutes;
	    var _seconds;
	    var _result;

	    _minutes = Math.floor(duration / 60);
	    _seconds = duration - _minutes * 60;
	    _result = _minutes+':'+_seconds;
	    
	    return _result;
	}

	function defineTime(time){
	    var _d = new Date(+time);
	    var nhour = _d.getHours(), nmin = _d.getMinutes(),ap;
	         if(nhour==0){ap=" AM";nhour=12;}
	    else if(nhour<12){ap=" AM";}
	    else if(nhour==12){ap=" PM";}
	    else if(nhour>12){ap=" PM";nhour-=12;}
	    
	    return ("0" + nhour).slice(-2)+":"+("0" + nmin).slice(-2)+ap+"";
	}



	function getConversationIdHandling(conversationId){
	    var result;
	    if (conversationId.indexOf("G:") >= 0) { // group message
	        result = conversationId.slice(0, 1) + "\\" + conversationId.slice(1);
	    }else{
	        result = conversationId;
	    }
	    return result;
	}

	module.exports = getConversationIdHandling;
	module.exports = defineTime;
	module.exports = defineTimer;
	module.exports = drawFileTypeIntoBubble;
	module.exports = drawAttachMessageBubble;
	module.exports = Message;
	module.exports = Conversation;
	module.exports = User;
	module.exports = ChatUI;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(2);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(10)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../../node_modules/css-loader/index.js?sourceMap!./font-awesome.min.css", function() {
				var newContent = require("!!./../../../node_modules/css-loader/index.js?sourceMap!./font-awesome.min.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports


	// module
	exports.push([module.id, "/*!\n *  Font Awesome 4.5.0 by @davegandy - http://fontawesome.io - @fontawesome\n *  License - http://fontawesome.io/license (Font: SIL OFL 1.1, CSS: MIT License)\n */@font-face{font-family:'FontAwesome';src:url(" + __webpack_require__(4) + ");src:url(" + __webpack_require__(5) + "?#iefix&v=4.5.0) format('embedded-opentype'),url(" + __webpack_require__(6) + ") format('woff2'),url(" + __webpack_require__(7) + ") format('woff'),url(" + __webpack_require__(8) + ") format('truetype'),url(" + __webpack_require__(9) + "#fontawesomeregular) format('svg');font-weight:normal;font-style:normal}.fa{display:inline-block;font:normal normal normal 14px/1 FontAwesome;font-size:inherit;text-rendering:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.fa-lg{font-size:1.33333333em;line-height:.75em;vertical-align:-15%}.fa-2x{font-size:2em}.fa-3x{font-size:3em}.fa-4x{font-size:4em}.fa-5x{font-size:5em}.fa-fw{width:1.28571429em;text-align:center}.fa-ul{padding-left:0;margin-left:2.14285714em;list-style-type:none}.fa-ul>li{position:relative}.fa-li{position:absolute;left:-2.14285714em;width:2.14285714em;top:.14285714em;text-align:center}.fa-li.fa-lg{left:-1.85714286em}.fa-border{padding:.2em .25em .15em;border:solid .08em #eee;border-radius:.1em}.fa-pull-left{float:left}.fa-pull-right{float:right}.fa.fa-pull-left{margin-right:.3em}.fa.fa-pull-right{margin-left:.3em}.pull-right{float:right}.pull-left{float:left}.fa.pull-left{margin-right:.3em}.fa.pull-right{margin-left:.3em}.fa-spin{-webkit-animation:fa-spin 2s infinite linear;animation:fa-spin 2s infinite linear}.fa-pulse{-webkit-animation:fa-spin 1s infinite steps(8);animation:fa-spin 1s infinite steps(8)}@-webkit-keyframes fa-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}100%{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}@keyframes fa-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}100%{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}.fa-rotate-90{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=1);-webkit-transform:rotate(90deg);-ms-transform:rotate(90deg);transform:rotate(90deg)}.fa-rotate-180{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=2);-webkit-transform:rotate(180deg);-ms-transform:rotate(180deg);transform:rotate(180deg)}.fa-rotate-270{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=3);-webkit-transform:rotate(270deg);-ms-transform:rotate(270deg);transform:rotate(270deg)}.fa-flip-horizontal{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=0, mirror=1);-webkit-transform:scale(-1, 1);-ms-transform:scale(-1, 1);transform:scale(-1, 1)}.fa-flip-vertical{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1);-webkit-transform:scale(1, -1);-ms-transform:scale(1, -1);transform:scale(1, -1)}:root .fa-rotate-90,:root .fa-rotate-180,:root .fa-rotate-270,:root .fa-flip-horizontal,:root .fa-flip-vertical{filter:none}.fa-stack{position:relative;display:inline-block;width:2em;height:2em;line-height:2em;vertical-align:middle}.fa-stack-1x,.fa-stack-2x{position:absolute;left:0;width:100%;text-align:center}.fa-stack-1x{line-height:inherit}.fa-stack-2x{font-size:2em}.fa-inverse{color:#fff}.fa-glass:before{content:\"\\F000\"}.fa-music:before{content:\"\\F001\"}.fa-search:before{content:\"\\F002\"}.fa-envelope-o:before{content:\"\\F003\"}.fa-heart:before{content:\"\\F004\"}.fa-star:before{content:\"\\F005\"}.fa-star-o:before{content:\"\\F006\"}.fa-user:before{content:\"\\F007\"}.fa-film:before{content:\"\\F008\"}.fa-th-large:before{content:\"\\F009\"}.fa-th:before{content:\"\\F00A\"}.fa-th-list:before{content:\"\\F00B\"}.fa-check:before{content:\"\\F00C\"}.fa-remove:before,.fa-close:before,.fa-times:before{content:\"\\F00D\"}.fa-search-plus:before{content:\"\\F00E\"}.fa-search-minus:before{content:\"\\F010\"}.fa-power-off:before{content:\"\\F011\"}.fa-signal:before{content:\"\\F012\"}.fa-gear:before,.fa-cog:before{content:\"\\F013\"}.fa-trash-o:before{content:\"\\F014\"}.fa-home:before{content:\"\\F015\"}.fa-file-o:before{content:\"\\F016\"}.fa-clock-o:before{content:\"\\F017\"}.fa-road:before{content:\"\\F018\"}.fa-download:before{content:\"\\F019\"}.fa-arrow-circle-o-down:before{content:\"\\F01A\"}.fa-arrow-circle-o-up:before{content:\"\\F01B\"}.fa-inbox:before{content:\"\\F01C\"}.fa-play-circle-o:before{content:\"\\F01D\"}.fa-rotate-right:before,.fa-repeat:before{content:\"\\F01E\"}.fa-refresh:before{content:\"\\F021\"}.fa-list-alt:before{content:\"\\F022\"}.fa-lock:before{content:\"\\F023\"}.fa-flag:before{content:\"\\F024\"}.fa-headphones:before{content:\"\\F025\"}.fa-volume-off:before{content:\"\\F026\"}.fa-volume-down:before{content:\"\\F027\"}.fa-volume-up:before{content:\"\\F028\"}.fa-qrcode:before{content:\"\\F029\"}.fa-barcode:before{content:\"\\F02A\"}.fa-tag:before{content:\"\\F02B\"}.fa-tags:before{content:\"\\F02C\"}.fa-book:before{content:\"\\F02D\"}.fa-bookmark:before{content:\"\\F02E\"}.fa-print:before{content:\"\\F02F\"}.fa-camera:before{content:\"\\F030\"}.fa-font:before{content:\"\\F031\"}.fa-bold:before{content:\"\\F032\"}.fa-italic:before{content:\"\\F033\"}.fa-text-height:before{content:\"\\F034\"}.fa-text-width:before{content:\"\\F035\"}.fa-align-left:before{content:\"\\F036\"}.fa-align-center:before{content:\"\\F037\"}.fa-align-right:before{content:\"\\F038\"}.fa-align-justify:before{content:\"\\F039\"}.fa-list:before{content:\"\\F03A\"}.fa-dedent:before,.fa-outdent:before{content:\"\\F03B\"}.fa-indent:before{content:\"\\F03C\"}.fa-video-camera:before{content:\"\\F03D\"}.fa-photo:before,.fa-image:before,.fa-picture-o:before{content:\"\\F03E\"}.fa-pencil:before{content:\"\\F040\"}.fa-map-marker:before{content:\"\\F041\"}.fa-adjust:before{content:\"\\F042\"}.fa-tint:before{content:\"\\F043\"}.fa-edit:before,.fa-pencil-square-o:before{content:\"\\F044\"}.fa-share-square-o:before{content:\"\\F045\"}.fa-check-square-o:before{content:\"\\F046\"}.fa-arrows:before{content:\"\\F047\"}.fa-step-backward:before{content:\"\\F048\"}.fa-fast-backward:before{content:\"\\F049\"}.fa-backward:before{content:\"\\F04A\"}.fa-play:before{content:\"\\F04B\"}.fa-pause:before{content:\"\\F04C\"}.fa-stop:before{content:\"\\F04D\"}.fa-forward:before{content:\"\\F04E\"}.fa-fast-forward:before{content:\"\\F050\"}.fa-step-forward:before{content:\"\\F051\"}.fa-eject:before{content:\"\\F052\"}.fa-chevron-left:before{content:\"\\F053\"}.fa-chevron-right:before{content:\"\\F054\"}.fa-plus-circle:before{content:\"\\F055\"}.fa-minus-circle:before{content:\"\\F056\"}.fa-times-circle:before{content:\"\\F057\"}.fa-check-circle:before{content:\"\\F058\"}.fa-question-circle:before{content:\"\\F059\"}.fa-info-circle:before{content:\"\\F05A\"}.fa-crosshairs:before{content:\"\\F05B\"}.fa-times-circle-o:before{content:\"\\F05C\"}.fa-check-circle-o:before{content:\"\\F05D\"}.fa-ban:before{content:\"\\F05E\"}.fa-arrow-left:before{content:\"\\F060\"}.fa-arrow-right:before{content:\"\\F061\"}.fa-arrow-up:before{content:\"\\F062\"}.fa-arrow-down:before{content:\"\\F063\"}.fa-mail-forward:before,.fa-share:before{content:\"\\F064\"}.fa-expand:before{content:\"\\F065\"}.fa-compress:before{content:\"\\F066\"}.fa-plus:before{content:\"\\F067\"}.fa-minus:before{content:\"\\F068\"}.fa-asterisk:before{content:\"\\F069\"}.fa-exclamation-circle:before{content:\"\\F06A\"}.fa-gift:before{content:\"\\F06B\"}.fa-leaf:before{content:\"\\F06C\"}.fa-fire:before{content:\"\\F06D\"}.fa-eye:before{content:\"\\F06E\"}.fa-eye-slash:before{content:\"\\F070\"}.fa-warning:before,.fa-exclamation-triangle:before{content:\"\\F071\"}.fa-plane:before{content:\"\\F072\"}.fa-calendar:before{content:\"\\F073\"}.fa-random:before{content:\"\\F074\"}.fa-comment:before{content:\"\\F075\"}.fa-magnet:before{content:\"\\F076\"}.fa-chevron-up:before{content:\"\\F077\"}.fa-chevron-down:before{content:\"\\F078\"}.fa-retweet:before{content:\"\\F079\"}.fa-shopping-cart:before{content:\"\\F07A\"}.fa-folder:before{content:\"\\F07B\"}.fa-folder-open:before{content:\"\\F07C\"}.fa-arrows-v:before{content:\"\\F07D\"}.fa-arrows-h:before{content:\"\\F07E\"}.fa-bar-chart-o:before,.fa-bar-chart:before{content:\"\\F080\"}.fa-twitter-square:before{content:\"\\F081\"}.fa-facebook-square:before{content:\"\\F082\"}.fa-camera-retro:before{content:\"\\F083\"}.fa-key:before{content:\"\\F084\"}.fa-gears:before,.fa-cogs:before{content:\"\\F085\"}.fa-comments:before{content:\"\\F086\"}.fa-thumbs-o-up:before{content:\"\\F087\"}.fa-thumbs-o-down:before{content:\"\\F088\"}.fa-star-half:before{content:\"\\F089\"}.fa-heart-o:before{content:\"\\F08A\"}.fa-sign-out:before{content:\"\\F08B\"}.fa-linkedin-square:before{content:\"\\F08C\"}.fa-thumb-tack:before{content:\"\\F08D\"}.fa-external-link:before{content:\"\\F08E\"}.fa-sign-in:before{content:\"\\F090\"}.fa-trophy:before{content:\"\\F091\"}.fa-github-square:before{content:\"\\F092\"}.fa-upload:before{content:\"\\F093\"}.fa-lemon-o:before{content:\"\\F094\"}.fa-phone:before{content:\"\\F095\"}.fa-square-o:before{content:\"\\F096\"}.fa-bookmark-o:before{content:\"\\F097\"}.fa-phone-square:before{content:\"\\F098\"}.fa-twitter:before{content:\"\\F099\"}.fa-facebook-f:before,.fa-facebook:before{content:\"\\F09A\"}.fa-github:before{content:\"\\F09B\"}.fa-unlock:before{content:\"\\F09C\"}.fa-credit-card:before{content:\"\\F09D\"}.fa-feed:before,.fa-rss:before{content:\"\\F09E\"}.fa-hdd-o:before{content:\"\\F0A0\"}.fa-bullhorn:before{content:\"\\F0A1\"}.fa-bell:before{content:\"\\F0F3\"}.fa-certificate:before{content:\"\\F0A3\"}.fa-hand-o-right:before{content:\"\\F0A4\"}.fa-hand-o-left:before{content:\"\\F0A5\"}.fa-hand-o-up:before{content:\"\\F0A6\"}.fa-hand-o-down:before{content:\"\\F0A7\"}.fa-arrow-circle-left:before{content:\"\\F0A8\"}.fa-arrow-circle-right:before{content:\"\\F0A9\"}.fa-arrow-circle-up:before{content:\"\\F0AA\"}.fa-arrow-circle-down:before{content:\"\\F0AB\"}.fa-globe:before{content:\"\\F0AC\"}.fa-wrench:before{content:\"\\F0AD\"}.fa-tasks:before{content:\"\\F0AE\"}.fa-filter:before{content:\"\\F0B0\"}.fa-briefcase:before{content:\"\\F0B1\"}.fa-arrows-alt:before{content:\"\\F0B2\"}.fa-group:before,.fa-users:before{content:\"\\F0C0\"}.fa-chain:before,.fa-link:before{content:\"\\F0C1\"}.fa-cloud:before{content:\"\\F0C2\"}.fa-flask:before{content:\"\\F0C3\"}.fa-cut:before,.fa-scissors:before{content:\"\\F0C4\"}.fa-copy:before,.fa-files-o:before{content:\"\\F0C5\"}.fa-paperclip:before{content:\"\\F0C6\"}.fa-save:before,.fa-floppy-o:before{content:\"\\F0C7\"}.fa-square:before{content:\"\\F0C8\"}.fa-navicon:before,.fa-reorder:before,.fa-bars:before{content:\"\\F0C9\"}.fa-list-ul:before{content:\"\\F0CA\"}.fa-list-ol:before{content:\"\\F0CB\"}.fa-strikethrough:before{content:\"\\F0CC\"}.fa-underline:before{content:\"\\F0CD\"}.fa-table:before{content:\"\\F0CE\"}.fa-magic:before{content:\"\\F0D0\"}.fa-truck:before{content:\"\\F0D1\"}.fa-pinterest:before{content:\"\\F0D2\"}.fa-pinterest-square:before{content:\"\\F0D3\"}.fa-google-plus-square:before{content:\"\\F0D4\"}.fa-google-plus:before{content:\"\\F0D5\"}.fa-money:before{content:\"\\F0D6\"}.fa-caret-down:before{content:\"\\F0D7\"}.fa-caret-up:before{content:\"\\F0D8\"}.fa-caret-left:before{content:\"\\F0D9\"}.fa-caret-right:before{content:\"\\F0DA\"}.fa-columns:before{content:\"\\F0DB\"}.fa-unsorted:before,.fa-sort:before{content:\"\\F0DC\"}.fa-sort-down:before,.fa-sort-desc:before{content:\"\\F0DD\"}.fa-sort-up:before,.fa-sort-asc:before{content:\"\\F0DE\"}.fa-envelope:before{content:\"\\F0E0\"}.fa-linkedin:before{content:\"\\F0E1\"}.fa-rotate-left:before,.fa-undo:before{content:\"\\F0E2\"}.fa-legal:before,.fa-gavel:before{content:\"\\F0E3\"}.fa-dashboard:before,.fa-tachometer:before{content:\"\\F0E4\"}.fa-comment-o:before{content:\"\\F0E5\"}.fa-comments-o:before{content:\"\\F0E6\"}.fa-flash:before,.fa-bolt:before{content:\"\\F0E7\"}.fa-sitemap:before{content:\"\\F0E8\"}.fa-umbrella:before{content:\"\\F0E9\"}.fa-paste:before,.fa-clipboard:before{content:\"\\F0EA\"}.fa-lightbulb-o:before{content:\"\\F0EB\"}.fa-exchange:before{content:\"\\F0EC\"}.fa-cloud-download:before{content:\"\\F0ED\"}.fa-cloud-upload:before{content:\"\\F0EE\"}.fa-user-md:before{content:\"\\F0F0\"}.fa-stethoscope:before{content:\"\\F0F1\"}.fa-suitcase:before{content:\"\\F0F2\"}.fa-bell-o:before{content:\"\\F0A2\"}.fa-coffee:before{content:\"\\F0F4\"}.fa-cutlery:before{content:\"\\F0F5\"}.fa-file-text-o:before{content:\"\\F0F6\"}.fa-building-o:before{content:\"\\F0F7\"}.fa-hospital-o:before{content:\"\\F0F8\"}.fa-ambulance:before{content:\"\\F0F9\"}.fa-medkit:before{content:\"\\F0FA\"}.fa-fighter-jet:before{content:\"\\F0FB\"}.fa-beer:before{content:\"\\F0FC\"}.fa-h-square:before{content:\"\\F0FD\"}.fa-plus-square:before{content:\"\\F0FE\"}.fa-angle-double-left:before{content:\"\\F100\"}.fa-angle-double-right:before{content:\"\\F101\"}.fa-angle-double-up:before{content:\"\\F102\"}.fa-angle-double-down:before{content:\"\\F103\"}.fa-angle-left:before{content:\"\\F104\"}.fa-angle-right:before{content:\"\\F105\"}.fa-angle-up:before{content:\"\\F106\"}.fa-angle-down:before{content:\"\\F107\"}.fa-desktop:before{content:\"\\F108\"}.fa-laptop:before{content:\"\\F109\"}.fa-tablet:before{content:\"\\F10A\"}.fa-mobile-phone:before,.fa-mobile:before{content:\"\\F10B\"}.fa-circle-o:before{content:\"\\F10C\"}.fa-quote-left:before{content:\"\\F10D\"}.fa-quote-right:before{content:\"\\F10E\"}.fa-spinner:before{content:\"\\F110\"}.fa-circle:before{content:\"\\F111\"}.fa-mail-reply:before,.fa-reply:before{content:\"\\F112\"}.fa-github-alt:before{content:\"\\F113\"}.fa-folder-o:before{content:\"\\F114\"}.fa-folder-open-o:before{content:\"\\F115\"}.fa-smile-o:before{content:\"\\F118\"}.fa-frown-o:before{content:\"\\F119\"}.fa-meh-o:before{content:\"\\F11A\"}.fa-gamepad:before{content:\"\\F11B\"}.fa-keyboard-o:before{content:\"\\F11C\"}.fa-flag-o:before{content:\"\\F11D\"}.fa-flag-checkered:before{content:\"\\F11E\"}.fa-terminal:before{content:\"\\F120\"}.fa-code:before{content:\"\\F121\"}.fa-mail-reply-all:before,.fa-reply-all:before{content:\"\\F122\"}.fa-star-half-empty:before,.fa-star-half-full:before,.fa-star-half-o:before{content:\"\\F123\"}.fa-location-arrow:before{content:\"\\F124\"}.fa-crop:before{content:\"\\F125\"}.fa-code-fork:before{content:\"\\F126\"}.fa-unlink:before,.fa-chain-broken:before{content:\"\\F127\"}.fa-question:before{content:\"\\F128\"}.fa-info:before{content:\"\\F129\"}.fa-exclamation:before{content:\"\\F12A\"}.fa-superscript:before{content:\"\\F12B\"}.fa-subscript:before{content:\"\\F12C\"}.fa-eraser:before{content:\"\\F12D\"}.fa-puzzle-piece:before{content:\"\\F12E\"}.fa-microphone:before{content:\"\\F130\"}.fa-microphone-slash:before{content:\"\\F131\"}.fa-shield:before{content:\"\\F132\"}.fa-calendar-o:before{content:\"\\F133\"}.fa-fire-extinguisher:before{content:\"\\F134\"}.fa-rocket:before{content:\"\\F135\"}.fa-maxcdn:before{content:\"\\F136\"}.fa-chevron-circle-left:before{content:\"\\F137\"}.fa-chevron-circle-right:before{content:\"\\F138\"}.fa-chevron-circle-up:before{content:\"\\F139\"}.fa-chevron-circle-down:before{content:\"\\F13A\"}.fa-html5:before{content:\"\\F13B\"}.fa-css3:before{content:\"\\F13C\"}.fa-anchor:before{content:\"\\F13D\"}.fa-unlock-alt:before{content:\"\\F13E\"}.fa-bullseye:before{content:\"\\F140\"}.fa-ellipsis-h:before{content:\"\\F141\"}.fa-ellipsis-v:before{content:\"\\F142\"}.fa-rss-square:before{content:\"\\F143\"}.fa-play-circle:before{content:\"\\F144\"}.fa-ticket:before{content:\"\\F145\"}.fa-minus-square:before{content:\"\\F146\"}.fa-minus-square-o:before{content:\"\\F147\"}.fa-level-up:before{content:\"\\F148\"}.fa-level-down:before{content:\"\\F149\"}.fa-check-square:before{content:\"\\F14A\"}.fa-pencil-square:before{content:\"\\F14B\"}.fa-external-link-square:before{content:\"\\F14C\"}.fa-share-square:before{content:\"\\F14D\"}.fa-compass:before{content:\"\\F14E\"}.fa-toggle-down:before,.fa-caret-square-o-down:before{content:\"\\F150\"}.fa-toggle-up:before,.fa-caret-square-o-up:before{content:\"\\F151\"}.fa-toggle-right:before,.fa-caret-square-o-right:before{content:\"\\F152\"}.fa-euro:before,.fa-eur:before{content:\"\\F153\"}.fa-gbp:before{content:\"\\F154\"}.fa-dollar:before,.fa-usd:before{content:\"\\F155\"}.fa-rupee:before,.fa-inr:before{content:\"\\F156\"}.fa-cny:before,.fa-rmb:before,.fa-yen:before,.fa-jpy:before{content:\"\\F157\"}.fa-ruble:before,.fa-rouble:before,.fa-rub:before{content:\"\\F158\"}.fa-won:before,.fa-krw:before{content:\"\\F159\"}.fa-bitcoin:before,.fa-btc:before{content:\"\\F15A\"}.fa-file:before{content:\"\\F15B\"}.fa-file-text:before{content:\"\\F15C\"}.fa-sort-alpha-asc:before{content:\"\\F15D\"}.fa-sort-alpha-desc:before{content:\"\\F15E\"}.fa-sort-amount-asc:before{content:\"\\F160\"}.fa-sort-amount-desc:before{content:\"\\F161\"}.fa-sort-numeric-asc:before{content:\"\\F162\"}.fa-sort-numeric-desc:before{content:\"\\F163\"}.fa-thumbs-up:before{content:\"\\F164\"}.fa-thumbs-down:before{content:\"\\F165\"}.fa-youtube-square:before{content:\"\\F166\"}.fa-youtube:before{content:\"\\F167\"}.fa-xing:before{content:\"\\F168\"}.fa-xing-square:before{content:\"\\F169\"}.fa-youtube-play:before{content:\"\\F16A\"}.fa-dropbox:before{content:\"\\F16B\"}.fa-stack-overflow:before{content:\"\\F16C\"}.fa-instagram:before{content:\"\\F16D\"}.fa-flickr:before{content:\"\\F16E\"}.fa-adn:before{content:\"\\F170\"}.fa-bitbucket:before{content:\"\\F171\"}.fa-bitbucket-square:before{content:\"\\F172\"}.fa-tumblr:before{content:\"\\F173\"}.fa-tumblr-square:before{content:\"\\F174\"}.fa-long-arrow-down:before{content:\"\\F175\"}.fa-long-arrow-up:before{content:\"\\F176\"}.fa-long-arrow-left:before{content:\"\\F177\"}.fa-long-arrow-right:before{content:\"\\F178\"}.fa-apple:before{content:\"\\F179\"}.fa-windows:before{content:\"\\F17A\"}.fa-android:before{content:\"\\F17B\"}.fa-linux:before{content:\"\\F17C\"}.fa-dribbble:before{content:\"\\F17D\"}.fa-skype:before{content:\"\\F17E\"}.fa-foursquare:before{content:\"\\F180\"}.fa-trello:before{content:\"\\F181\"}.fa-female:before{content:\"\\F182\"}.fa-male:before{content:\"\\F183\"}.fa-gittip:before,.fa-gratipay:before{content:\"\\F184\"}.fa-sun-o:before{content:\"\\F185\"}.fa-moon-o:before{content:\"\\F186\"}.fa-archive:before{content:\"\\F187\"}.fa-bug:before{content:\"\\F188\"}.fa-vk:before{content:\"\\F189\"}.fa-weibo:before{content:\"\\F18A\"}.fa-renren:before{content:\"\\F18B\"}.fa-pagelines:before{content:\"\\F18C\"}.fa-stack-exchange:before{content:\"\\F18D\"}.fa-arrow-circle-o-right:before{content:\"\\F18E\"}.fa-arrow-circle-o-left:before{content:\"\\F190\"}.fa-toggle-left:before,.fa-caret-square-o-left:before{content:\"\\F191\"}.fa-dot-circle-o:before{content:\"\\F192\"}.fa-wheelchair:before{content:\"\\F193\"}.fa-vimeo-square:before{content:\"\\F194\"}.fa-turkish-lira:before,.fa-try:before{content:\"\\F195\"}.fa-plus-square-o:before{content:\"\\F196\"}.fa-space-shuttle:before{content:\"\\F197\"}.fa-slack:before{content:\"\\F198\"}.fa-envelope-square:before{content:\"\\F199\"}.fa-wordpress:before{content:\"\\F19A\"}.fa-openid:before{content:\"\\F19B\"}.fa-institution:before,.fa-bank:before,.fa-university:before{content:\"\\F19C\"}.fa-mortar-board:before,.fa-graduation-cap:before{content:\"\\F19D\"}.fa-yahoo:before{content:\"\\F19E\"}.fa-google:before{content:\"\\F1A0\"}.fa-reddit:before{content:\"\\F1A1\"}.fa-reddit-square:before{content:\"\\F1A2\"}.fa-stumbleupon-circle:before{content:\"\\F1A3\"}.fa-stumbleupon:before{content:\"\\F1A4\"}.fa-delicious:before{content:\"\\F1A5\"}.fa-digg:before{content:\"\\F1A6\"}.fa-pied-piper:before{content:\"\\F1A7\"}.fa-pied-piper-alt:before{content:\"\\F1A8\"}.fa-drupal:before{content:\"\\F1A9\"}.fa-joomla:before{content:\"\\F1AA\"}.fa-language:before{content:\"\\F1AB\"}.fa-fax:before{content:\"\\F1AC\"}.fa-building:before{content:\"\\F1AD\"}.fa-child:before{content:\"\\F1AE\"}.fa-paw:before{content:\"\\F1B0\"}.fa-spoon:before{content:\"\\F1B1\"}.fa-cube:before{content:\"\\F1B2\"}.fa-cubes:before{content:\"\\F1B3\"}.fa-behance:before{content:\"\\F1B4\"}.fa-behance-square:before{content:\"\\F1B5\"}.fa-steam:before{content:\"\\F1B6\"}.fa-steam-square:before{content:\"\\F1B7\"}.fa-recycle:before{content:\"\\F1B8\"}.fa-automobile:before,.fa-car:before{content:\"\\F1B9\"}.fa-cab:before,.fa-taxi:before{content:\"\\F1BA\"}.fa-tree:before{content:\"\\F1BB\"}.fa-spotify:before{content:\"\\F1BC\"}.fa-deviantart:before{content:\"\\F1BD\"}.fa-soundcloud:before{content:\"\\F1BE\"}.fa-database:before{content:\"\\F1C0\"}.fa-file-pdf-o:before{content:\"\\F1C1\"}.fa-file-word-o:before{content:\"\\F1C2\"}.fa-file-excel-o:before{content:\"\\F1C3\"}.fa-file-powerpoint-o:before{content:\"\\F1C4\"}.fa-file-photo-o:before,.fa-file-picture-o:before,.fa-file-image-o:before{content:\"\\F1C5\"}.fa-file-zip-o:before,.fa-file-archive-o:before{content:\"\\F1C6\"}.fa-file-sound-o:before,.fa-file-audio-o:before{content:\"\\F1C7\"}.fa-file-movie-o:before,.fa-file-video-o:before{content:\"\\F1C8\"}.fa-file-code-o:before{content:\"\\F1C9\"}.fa-vine:before{content:\"\\F1CA\"}.fa-codepen:before{content:\"\\F1CB\"}.fa-jsfiddle:before{content:\"\\F1CC\"}.fa-life-bouy:before,.fa-life-buoy:before,.fa-life-saver:before,.fa-support:before,.fa-life-ring:before{content:\"\\F1CD\"}.fa-circle-o-notch:before{content:\"\\F1CE\"}.fa-ra:before,.fa-rebel:before{content:\"\\F1D0\"}.fa-ge:before,.fa-empire:before{content:\"\\F1D1\"}.fa-git-square:before{content:\"\\F1D2\"}.fa-git:before{content:\"\\F1D3\"}.fa-y-combinator-square:before,.fa-yc-square:before,.fa-hacker-news:before{content:\"\\F1D4\"}.fa-tencent-weibo:before{content:\"\\F1D5\"}.fa-qq:before{content:\"\\F1D6\"}.fa-wechat:before,.fa-weixin:before{content:\"\\F1D7\"}.fa-send:before,.fa-paper-plane:before{content:\"\\F1D8\"}.fa-send-o:before,.fa-paper-plane-o:before{content:\"\\F1D9\"}.fa-history:before{content:\"\\F1DA\"}.fa-circle-thin:before{content:\"\\F1DB\"}.fa-header:before{content:\"\\F1DC\"}.fa-paragraph:before{content:\"\\F1DD\"}.fa-sliders:before{content:\"\\F1DE\"}.fa-share-alt:before{content:\"\\F1E0\"}.fa-share-alt-square:before{content:\"\\F1E1\"}.fa-bomb:before{content:\"\\F1E2\"}.fa-soccer-ball-o:before,.fa-futbol-o:before{content:\"\\F1E3\"}.fa-tty:before{content:\"\\F1E4\"}.fa-binoculars:before{content:\"\\F1E5\"}.fa-plug:before{content:\"\\F1E6\"}.fa-slideshare:before{content:\"\\F1E7\"}.fa-twitch:before{content:\"\\F1E8\"}.fa-yelp:before{content:\"\\F1E9\"}.fa-newspaper-o:before{content:\"\\F1EA\"}.fa-wifi:before{content:\"\\F1EB\"}.fa-calculator:before{content:\"\\F1EC\"}.fa-paypal:before{content:\"\\F1ED\"}.fa-google-wallet:before{content:\"\\F1EE\"}.fa-cc-visa:before{content:\"\\F1F0\"}.fa-cc-mastercard:before{content:\"\\F1F1\"}.fa-cc-discover:before{content:\"\\F1F2\"}.fa-cc-amex:before{content:\"\\F1F3\"}.fa-cc-paypal:before{content:\"\\F1F4\"}.fa-cc-stripe:before{content:\"\\F1F5\"}.fa-bell-slash:before{content:\"\\F1F6\"}.fa-bell-slash-o:before{content:\"\\F1F7\"}.fa-trash:before{content:\"\\F1F8\"}.fa-copyright:before{content:\"\\F1F9\"}.fa-at:before{content:\"\\F1FA\"}.fa-eyedropper:before{content:\"\\F1FB\"}.fa-paint-brush:before{content:\"\\F1FC\"}.fa-birthday-cake:before{content:\"\\F1FD\"}.fa-area-chart:before{content:\"\\F1FE\"}.fa-pie-chart:before{content:\"\\F200\"}.fa-line-chart:before{content:\"\\F201\"}.fa-lastfm:before{content:\"\\F202\"}.fa-lastfm-square:before{content:\"\\F203\"}.fa-toggle-off:before{content:\"\\F204\"}.fa-toggle-on:before{content:\"\\F205\"}.fa-bicycle:before{content:\"\\F206\"}.fa-bus:before{content:\"\\F207\"}.fa-ioxhost:before{content:\"\\F208\"}.fa-angellist:before{content:\"\\F209\"}.fa-cc:before{content:\"\\F20A\"}.fa-shekel:before,.fa-sheqel:before,.fa-ils:before{content:\"\\F20B\"}.fa-meanpath:before{content:\"\\F20C\"}.fa-buysellads:before{content:\"\\F20D\"}.fa-connectdevelop:before{content:\"\\F20E\"}.fa-dashcube:before{content:\"\\F210\"}.fa-forumbee:before{content:\"\\F211\"}.fa-leanpub:before{content:\"\\F212\"}.fa-sellsy:before{content:\"\\F213\"}.fa-shirtsinbulk:before{content:\"\\F214\"}.fa-simplybuilt:before{content:\"\\F215\"}.fa-skyatlas:before{content:\"\\F216\"}.fa-cart-plus:before{content:\"\\F217\"}.fa-cart-arrow-down:before{content:\"\\F218\"}.fa-diamond:before{content:\"\\F219\"}.fa-ship:before{content:\"\\F21A\"}.fa-user-secret:before{content:\"\\F21B\"}.fa-motorcycle:before{content:\"\\F21C\"}.fa-street-view:before{content:\"\\F21D\"}.fa-heartbeat:before{content:\"\\F21E\"}.fa-venus:before{content:\"\\F221\"}.fa-mars:before{content:\"\\F222\"}.fa-mercury:before{content:\"\\F223\"}.fa-intersex:before,.fa-transgender:before{content:\"\\F224\"}.fa-transgender-alt:before{content:\"\\F225\"}.fa-venus-double:before{content:\"\\F226\"}.fa-mars-double:before{content:\"\\F227\"}.fa-venus-mars:before{content:\"\\F228\"}.fa-mars-stroke:before{content:\"\\F229\"}.fa-mars-stroke-v:before{content:\"\\F22A\"}.fa-mars-stroke-h:before{content:\"\\F22B\"}.fa-neuter:before{content:\"\\F22C\"}.fa-genderless:before{content:\"\\F22D\"}.fa-facebook-official:before{content:\"\\F230\"}.fa-pinterest-p:before{content:\"\\F231\"}.fa-whatsapp:before{content:\"\\F232\"}.fa-server:before{content:\"\\F233\"}.fa-user-plus:before{content:\"\\F234\"}.fa-user-times:before{content:\"\\F235\"}.fa-hotel:before,.fa-bed:before{content:\"\\F236\"}.fa-viacoin:before{content:\"\\F237\"}.fa-train:before{content:\"\\F238\"}.fa-subway:before{content:\"\\F239\"}.fa-medium:before{content:\"\\F23A\"}.fa-yc:before,.fa-y-combinator:before{content:\"\\F23B\"}.fa-optin-monster:before{content:\"\\F23C\"}.fa-opencart:before{content:\"\\F23D\"}.fa-expeditedssl:before{content:\"\\F23E\"}.fa-battery-4:before,.fa-battery-full:before{content:\"\\F240\"}.fa-battery-3:before,.fa-battery-three-quarters:before{content:\"\\F241\"}.fa-battery-2:before,.fa-battery-half:before{content:\"\\F242\"}.fa-battery-1:before,.fa-battery-quarter:before{content:\"\\F243\"}.fa-battery-0:before,.fa-battery-empty:before{content:\"\\F244\"}.fa-mouse-pointer:before{content:\"\\F245\"}.fa-i-cursor:before{content:\"\\F246\"}.fa-object-group:before{content:\"\\F247\"}.fa-object-ungroup:before{content:\"\\F248\"}.fa-sticky-note:before{content:\"\\F249\"}.fa-sticky-note-o:before{content:\"\\F24A\"}.fa-cc-jcb:before{content:\"\\F24B\"}.fa-cc-diners-club:before{content:\"\\F24C\"}.fa-clone:before{content:\"\\F24D\"}.fa-balance-scale:before{content:\"\\F24E\"}.fa-hourglass-o:before{content:\"\\F250\"}.fa-hourglass-1:before,.fa-hourglass-start:before{content:\"\\F251\"}.fa-hourglass-2:before,.fa-hourglass-half:before{content:\"\\F252\"}.fa-hourglass-3:before,.fa-hourglass-end:before{content:\"\\F253\"}.fa-hourglass:before{content:\"\\F254\"}.fa-hand-grab-o:before,.fa-hand-rock-o:before{content:\"\\F255\"}.fa-hand-stop-o:before,.fa-hand-paper-o:before{content:\"\\F256\"}.fa-hand-scissors-o:before{content:\"\\F257\"}.fa-hand-lizard-o:before{content:\"\\F258\"}.fa-hand-spock-o:before{content:\"\\F259\"}.fa-hand-pointer-o:before{content:\"\\F25A\"}.fa-hand-peace-o:before{content:\"\\F25B\"}.fa-trademark:before{content:\"\\F25C\"}.fa-registered:before{content:\"\\F25D\"}.fa-creative-commons:before{content:\"\\F25E\"}.fa-gg:before{content:\"\\F260\"}.fa-gg-circle:before{content:\"\\F261\"}.fa-tripadvisor:before{content:\"\\F262\"}.fa-odnoklassniki:before{content:\"\\F263\"}.fa-odnoklassniki-square:before{content:\"\\F264\"}.fa-get-pocket:before{content:\"\\F265\"}.fa-wikipedia-w:before{content:\"\\F266\"}.fa-safari:before{content:\"\\F267\"}.fa-chrome:before{content:\"\\F268\"}.fa-firefox:before{content:\"\\F269\"}.fa-opera:before{content:\"\\F26A\"}.fa-internet-explorer:before{content:\"\\F26B\"}.fa-tv:before,.fa-television:before{content:\"\\F26C\"}.fa-contao:before{content:\"\\F26D\"}.fa-500px:before{content:\"\\F26E\"}.fa-amazon:before{content:\"\\F270\"}.fa-calendar-plus-o:before{content:\"\\F271\"}.fa-calendar-minus-o:before{content:\"\\F272\"}.fa-calendar-times-o:before{content:\"\\F273\"}.fa-calendar-check-o:before{content:\"\\F274\"}.fa-industry:before{content:\"\\F275\"}.fa-map-pin:before{content:\"\\F276\"}.fa-map-signs:before{content:\"\\F277\"}.fa-map-o:before{content:\"\\F278\"}.fa-map:before{content:\"\\F279\"}.fa-commenting:before{content:\"\\F27A\"}.fa-commenting-o:before{content:\"\\F27B\"}.fa-houzz:before{content:\"\\F27C\"}.fa-vimeo:before{content:\"\\F27D\"}.fa-black-tie:before{content:\"\\F27E\"}.fa-fonticons:before{content:\"\\F280\"}.fa-reddit-alien:before{content:\"\\F281\"}.fa-edge:before{content:\"\\F282\"}.fa-credit-card-alt:before{content:\"\\F283\"}.fa-codiepie:before{content:\"\\F284\"}.fa-modx:before{content:\"\\F285\"}.fa-fort-awesome:before{content:\"\\F286\"}.fa-usb:before{content:\"\\F287\"}.fa-product-hunt:before{content:\"\\F288\"}.fa-mixcloud:before{content:\"\\F289\"}.fa-scribd:before{content:\"\\F28A\"}.fa-pause-circle:before{content:\"\\F28B\"}.fa-pause-circle-o:before{content:\"\\F28C\"}.fa-stop-circle:before{content:\"\\F28D\"}.fa-stop-circle-o:before{content:\"\\F28E\"}.fa-shopping-bag:before{content:\"\\F290\"}.fa-shopping-basket:before{content:\"\\F291\"}.fa-hashtag:before{content:\"\\F292\"}.fa-bluetooth:before{content:\"\\F293\"}.fa-bluetooth-b:before{content:\"\\F294\"}.fa-percent:before{content:\"\\F295\"}\n", "", {"version":3,"sources":["/./bower_components/font-awesome/css/font-awesome.min.css"],"names":[],"mappings":"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","file":"font-awesome.min.css","sourcesContent":["/*!\n *  Font Awesome 4.5.0 by @davegandy - http://fontawesome.io - @fontawesome\n *  License - http://fontawesome.io/license (Font: SIL OFL 1.1, CSS: MIT License)\n */@font-face{font-family:'FontAwesome';src:url('../fonts/fontawesome-webfont.eot?v=4.5.0');src:url('../fonts/fontawesome-webfont.eot?#iefix&v=4.5.0') format('embedded-opentype'),url('../fonts/fontawesome-webfont.woff2?v=4.5.0') format('woff2'),url('../fonts/fontawesome-webfont.woff?v=4.5.0') format('woff'),url('../fonts/fontawesome-webfont.ttf?v=4.5.0') format('truetype'),url('../fonts/fontawesome-webfont.svg?v=4.5.0#fontawesomeregular') format('svg');font-weight:normal;font-style:normal}.fa{display:inline-block;font:normal normal normal 14px/1 FontAwesome;font-size:inherit;text-rendering:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.fa-lg{font-size:1.33333333em;line-height:.75em;vertical-align:-15%}.fa-2x{font-size:2em}.fa-3x{font-size:3em}.fa-4x{font-size:4em}.fa-5x{font-size:5em}.fa-fw{width:1.28571429em;text-align:center}.fa-ul{padding-left:0;margin-left:2.14285714em;list-style-type:none}.fa-ul>li{position:relative}.fa-li{position:absolute;left:-2.14285714em;width:2.14285714em;top:.14285714em;text-align:center}.fa-li.fa-lg{left:-1.85714286em}.fa-border{padding:.2em .25em .15em;border:solid .08em #eee;border-radius:.1em}.fa-pull-left{float:left}.fa-pull-right{float:right}.fa.fa-pull-left{margin-right:.3em}.fa.fa-pull-right{margin-left:.3em}.pull-right{float:right}.pull-left{float:left}.fa.pull-left{margin-right:.3em}.fa.pull-right{margin-left:.3em}.fa-spin{-webkit-animation:fa-spin 2s infinite linear;animation:fa-spin 2s infinite linear}.fa-pulse{-webkit-animation:fa-spin 1s infinite steps(8);animation:fa-spin 1s infinite steps(8)}@-webkit-keyframes fa-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}100%{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}@keyframes fa-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}100%{-webkit-transform:rotate(359deg);transform:rotate(359deg)}}.fa-rotate-90{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=1);-webkit-transform:rotate(90deg);-ms-transform:rotate(90deg);transform:rotate(90deg)}.fa-rotate-180{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=2);-webkit-transform:rotate(180deg);-ms-transform:rotate(180deg);transform:rotate(180deg)}.fa-rotate-270{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=3);-webkit-transform:rotate(270deg);-ms-transform:rotate(270deg);transform:rotate(270deg)}.fa-flip-horizontal{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=0, mirror=1);-webkit-transform:scale(-1, 1);-ms-transform:scale(-1, 1);transform:scale(-1, 1)}.fa-flip-vertical{filter:progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1);-webkit-transform:scale(1, -1);-ms-transform:scale(1, -1);transform:scale(1, -1)}:root .fa-rotate-90,:root .fa-rotate-180,:root .fa-rotate-270,:root .fa-flip-horizontal,:root .fa-flip-vertical{filter:none}.fa-stack{position:relative;display:inline-block;width:2em;height:2em;line-height:2em;vertical-align:middle}.fa-stack-1x,.fa-stack-2x{position:absolute;left:0;width:100%;text-align:center}.fa-stack-1x{line-height:inherit}.fa-stack-2x{font-size:2em}.fa-inverse{color:#fff}.fa-glass:before{content:\"\\f000\"}.fa-music:before{content:\"\\f001\"}.fa-search:before{content:\"\\f002\"}.fa-envelope-o:before{content:\"\\f003\"}.fa-heart:before{content:\"\\f004\"}.fa-star:before{content:\"\\f005\"}.fa-star-o:before{content:\"\\f006\"}.fa-user:before{content:\"\\f007\"}.fa-film:before{content:\"\\f008\"}.fa-th-large:before{content:\"\\f009\"}.fa-th:before{content:\"\\f00a\"}.fa-th-list:before{content:\"\\f00b\"}.fa-check:before{content:\"\\f00c\"}.fa-remove:before,.fa-close:before,.fa-times:before{content:\"\\f00d\"}.fa-search-plus:before{content:\"\\f00e\"}.fa-search-minus:before{content:\"\\f010\"}.fa-power-off:before{content:\"\\f011\"}.fa-signal:before{content:\"\\f012\"}.fa-gear:before,.fa-cog:before{content:\"\\f013\"}.fa-trash-o:before{content:\"\\f014\"}.fa-home:before{content:\"\\f015\"}.fa-file-o:before{content:\"\\f016\"}.fa-clock-o:before{content:\"\\f017\"}.fa-road:before{content:\"\\f018\"}.fa-download:before{content:\"\\f019\"}.fa-arrow-circle-o-down:before{content:\"\\f01a\"}.fa-arrow-circle-o-up:before{content:\"\\f01b\"}.fa-inbox:before{content:\"\\f01c\"}.fa-play-circle-o:before{content:\"\\f01d\"}.fa-rotate-right:before,.fa-repeat:before{content:\"\\f01e\"}.fa-refresh:before{content:\"\\f021\"}.fa-list-alt:before{content:\"\\f022\"}.fa-lock:before{content:\"\\f023\"}.fa-flag:before{content:\"\\f024\"}.fa-headphones:before{content:\"\\f025\"}.fa-volume-off:before{content:\"\\f026\"}.fa-volume-down:before{content:\"\\f027\"}.fa-volume-up:before{content:\"\\f028\"}.fa-qrcode:before{content:\"\\f029\"}.fa-barcode:before{content:\"\\f02a\"}.fa-tag:before{content:\"\\f02b\"}.fa-tags:before{content:\"\\f02c\"}.fa-book:before{content:\"\\f02d\"}.fa-bookmark:before{content:\"\\f02e\"}.fa-print:before{content:\"\\f02f\"}.fa-camera:before{content:\"\\f030\"}.fa-font:before{content:\"\\f031\"}.fa-bold:before{content:\"\\f032\"}.fa-italic:before{content:\"\\f033\"}.fa-text-height:before{content:\"\\f034\"}.fa-text-width:before{content:\"\\f035\"}.fa-align-left:before{content:\"\\f036\"}.fa-align-center:before{content:\"\\f037\"}.fa-align-right:before{content:\"\\f038\"}.fa-align-justify:before{content:\"\\f039\"}.fa-list:before{content:\"\\f03a\"}.fa-dedent:before,.fa-outdent:before{content:\"\\f03b\"}.fa-indent:before{content:\"\\f03c\"}.fa-video-camera:before{content:\"\\f03d\"}.fa-photo:before,.fa-image:before,.fa-picture-o:before{content:\"\\f03e\"}.fa-pencil:before{content:\"\\f040\"}.fa-map-marker:before{content:\"\\f041\"}.fa-adjust:before{content:\"\\f042\"}.fa-tint:before{content:\"\\f043\"}.fa-edit:before,.fa-pencil-square-o:before{content:\"\\f044\"}.fa-share-square-o:before{content:\"\\f045\"}.fa-check-square-o:before{content:\"\\f046\"}.fa-arrows:before{content:\"\\f047\"}.fa-step-backward:before{content:\"\\f048\"}.fa-fast-backward:before{content:\"\\f049\"}.fa-backward:before{content:\"\\f04a\"}.fa-play:before{content:\"\\f04b\"}.fa-pause:before{content:\"\\f04c\"}.fa-stop:before{content:\"\\f04d\"}.fa-forward:before{content:\"\\f04e\"}.fa-fast-forward:before{content:\"\\f050\"}.fa-step-forward:before{content:\"\\f051\"}.fa-eject:before{content:\"\\f052\"}.fa-chevron-left:before{content:\"\\f053\"}.fa-chevron-right:before{content:\"\\f054\"}.fa-plus-circle:before{content:\"\\f055\"}.fa-minus-circle:before{content:\"\\f056\"}.fa-times-circle:before{content:\"\\f057\"}.fa-check-circle:before{content:\"\\f058\"}.fa-question-circle:before{content:\"\\f059\"}.fa-info-circle:before{content:\"\\f05a\"}.fa-crosshairs:before{content:\"\\f05b\"}.fa-times-circle-o:before{content:\"\\f05c\"}.fa-check-circle-o:before{content:\"\\f05d\"}.fa-ban:before{content:\"\\f05e\"}.fa-arrow-left:before{content:\"\\f060\"}.fa-arrow-right:before{content:\"\\f061\"}.fa-arrow-up:before{content:\"\\f062\"}.fa-arrow-down:before{content:\"\\f063\"}.fa-mail-forward:before,.fa-share:before{content:\"\\f064\"}.fa-expand:before{content:\"\\f065\"}.fa-compress:before{content:\"\\f066\"}.fa-plus:before{content:\"\\f067\"}.fa-minus:before{content:\"\\f068\"}.fa-asterisk:before{content:\"\\f069\"}.fa-exclamation-circle:before{content:\"\\f06a\"}.fa-gift:before{content:\"\\f06b\"}.fa-leaf:before{content:\"\\f06c\"}.fa-fire:before{content:\"\\f06d\"}.fa-eye:before{content:\"\\f06e\"}.fa-eye-slash:before{content:\"\\f070\"}.fa-warning:before,.fa-exclamation-triangle:before{content:\"\\f071\"}.fa-plane:before{content:\"\\f072\"}.fa-calendar:before{content:\"\\f073\"}.fa-random:before{content:\"\\f074\"}.fa-comment:before{content:\"\\f075\"}.fa-magnet:before{content:\"\\f076\"}.fa-chevron-up:before{content:\"\\f077\"}.fa-chevron-down:before{content:\"\\f078\"}.fa-retweet:before{content:\"\\f079\"}.fa-shopping-cart:before{content:\"\\f07a\"}.fa-folder:before{content:\"\\f07b\"}.fa-folder-open:before{content:\"\\f07c\"}.fa-arrows-v:before{content:\"\\f07d\"}.fa-arrows-h:before{content:\"\\f07e\"}.fa-bar-chart-o:before,.fa-bar-chart:before{content:\"\\f080\"}.fa-twitter-square:before{content:\"\\f081\"}.fa-facebook-square:before{content:\"\\f082\"}.fa-camera-retro:before{content:\"\\f083\"}.fa-key:before{content:\"\\f084\"}.fa-gears:before,.fa-cogs:before{content:\"\\f085\"}.fa-comments:before{content:\"\\f086\"}.fa-thumbs-o-up:before{content:\"\\f087\"}.fa-thumbs-o-down:before{content:\"\\f088\"}.fa-star-half:before{content:\"\\f089\"}.fa-heart-o:before{content:\"\\f08a\"}.fa-sign-out:before{content:\"\\f08b\"}.fa-linkedin-square:before{content:\"\\f08c\"}.fa-thumb-tack:before{content:\"\\f08d\"}.fa-external-link:before{content:\"\\f08e\"}.fa-sign-in:before{content:\"\\f090\"}.fa-trophy:before{content:\"\\f091\"}.fa-github-square:before{content:\"\\f092\"}.fa-upload:before{content:\"\\f093\"}.fa-lemon-o:before{content:\"\\f094\"}.fa-phone:before{content:\"\\f095\"}.fa-square-o:before{content:\"\\f096\"}.fa-bookmark-o:before{content:\"\\f097\"}.fa-phone-square:before{content:\"\\f098\"}.fa-twitter:before{content:\"\\f099\"}.fa-facebook-f:before,.fa-facebook:before{content:\"\\f09a\"}.fa-github:before{content:\"\\f09b\"}.fa-unlock:before{content:\"\\f09c\"}.fa-credit-card:before{content:\"\\f09d\"}.fa-feed:before,.fa-rss:before{content:\"\\f09e\"}.fa-hdd-o:before{content:\"\\f0a0\"}.fa-bullhorn:before{content:\"\\f0a1\"}.fa-bell:before{content:\"\\f0f3\"}.fa-certificate:before{content:\"\\f0a3\"}.fa-hand-o-right:before{content:\"\\f0a4\"}.fa-hand-o-left:before{content:\"\\f0a5\"}.fa-hand-o-up:before{content:\"\\f0a6\"}.fa-hand-o-down:before{content:\"\\f0a7\"}.fa-arrow-circle-left:before{content:\"\\f0a8\"}.fa-arrow-circle-right:before{content:\"\\f0a9\"}.fa-arrow-circle-up:before{content:\"\\f0aa\"}.fa-arrow-circle-down:before{content:\"\\f0ab\"}.fa-globe:before{content:\"\\f0ac\"}.fa-wrench:before{content:\"\\f0ad\"}.fa-tasks:before{content:\"\\f0ae\"}.fa-filter:before{content:\"\\f0b0\"}.fa-briefcase:before{content:\"\\f0b1\"}.fa-arrows-alt:before{content:\"\\f0b2\"}.fa-group:before,.fa-users:before{content:\"\\f0c0\"}.fa-chain:before,.fa-link:before{content:\"\\f0c1\"}.fa-cloud:before{content:\"\\f0c2\"}.fa-flask:before{content:\"\\f0c3\"}.fa-cut:before,.fa-scissors:before{content:\"\\f0c4\"}.fa-copy:before,.fa-files-o:before{content:\"\\f0c5\"}.fa-paperclip:before{content:\"\\f0c6\"}.fa-save:before,.fa-floppy-o:before{content:\"\\f0c7\"}.fa-square:before{content:\"\\f0c8\"}.fa-navicon:before,.fa-reorder:before,.fa-bars:before{content:\"\\f0c9\"}.fa-list-ul:before{content:\"\\f0ca\"}.fa-list-ol:before{content:\"\\f0cb\"}.fa-strikethrough:before{content:\"\\f0cc\"}.fa-underline:before{content:\"\\f0cd\"}.fa-table:before{content:\"\\f0ce\"}.fa-magic:before{content:\"\\f0d0\"}.fa-truck:before{content:\"\\f0d1\"}.fa-pinterest:before{content:\"\\f0d2\"}.fa-pinterest-square:before{content:\"\\f0d3\"}.fa-google-plus-square:before{content:\"\\f0d4\"}.fa-google-plus:before{content:\"\\f0d5\"}.fa-money:before{content:\"\\f0d6\"}.fa-caret-down:before{content:\"\\f0d7\"}.fa-caret-up:before{content:\"\\f0d8\"}.fa-caret-left:before{content:\"\\f0d9\"}.fa-caret-right:before{content:\"\\f0da\"}.fa-columns:before{content:\"\\f0db\"}.fa-unsorted:before,.fa-sort:before{content:\"\\f0dc\"}.fa-sort-down:before,.fa-sort-desc:before{content:\"\\f0dd\"}.fa-sort-up:before,.fa-sort-asc:before{content:\"\\f0de\"}.fa-envelope:before{content:\"\\f0e0\"}.fa-linkedin:before{content:\"\\f0e1\"}.fa-rotate-left:before,.fa-undo:before{content:\"\\f0e2\"}.fa-legal:before,.fa-gavel:before{content:\"\\f0e3\"}.fa-dashboard:before,.fa-tachometer:before{content:\"\\f0e4\"}.fa-comment-o:before{content:\"\\f0e5\"}.fa-comments-o:before{content:\"\\f0e6\"}.fa-flash:before,.fa-bolt:before{content:\"\\f0e7\"}.fa-sitemap:before{content:\"\\f0e8\"}.fa-umbrella:before{content:\"\\f0e9\"}.fa-paste:before,.fa-clipboard:before{content:\"\\f0ea\"}.fa-lightbulb-o:before{content:\"\\f0eb\"}.fa-exchange:before{content:\"\\f0ec\"}.fa-cloud-download:before{content:\"\\f0ed\"}.fa-cloud-upload:before{content:\"\\f0ee\"}.fa-user-md:before{content:\"\\f0f0\"}.fa-stethoscope:before{content:\"\\f0f1\"}.fa-suitcase:before{content:\"\\f0f2\"}.fa-bell-o:before{content:\"\\f0a2\"}.fa-coffee:before{content:\"\\f0f4\"}.fa-cutlery:before{content:\"\\f0f5\"}.fa-file-text-o:before{content:\"\\f0f6\"}.fa-building-o:before{content:\"\\f0f7\"}.fa-hospital-o:before{content:\"\\f0f8\"}.fa-ambulance:before{content:\"\\f0f9\"}.fa-medkit:before{content:\"\\f0fa\"}.fa-fighter-jet:before{content:\"\\f0fb\"}.fa-beer:before{content:\"\\f0fc\"}.fa-h-square:before{content:\"\\f0fd\"}.fa-plus-square:before{content:\"\\f0fe\"}.fa-angle-double-left:before{content:\"\\f100\"}.fa-angle-double-right:before{content:\"\\f101\"}.fa-angle-double-up:before{content:\"\\f102\"}.fa-angle-double-down:before{content:\"\\f103\"}.fa-angle-left:before{content:\"\\f104\"}.fa-angle-right:before{content:\"\\f105\"}.fa-angle-up:before{content:\"\\f106\"}.fa-angle-down:before{content:\"\\f107\"}.fa-desktop:before{content:\"\\f108\"}.fa-laptop:before{content:\"\\f109\"}.fa-tablet:before{content:\"\\f10a\"}.fa-mobile-phone:before,.fa-mobile:before{content:\"\\f10b\"}.fa-circle-o:before{content:\"\\f10c\"}.fa-quote-left:before{content:\"\\f10d\"}.fa-quote-right:before{content:\"\\f10e\"}.fa-spinner:before{content:\"\\f110\"}.fa-circle:before{content:\"\\f111\"}.fa-mail-reply:before,.fa-reply:before{content:\"\\f112\"}.fa-github-alt:before{content:\"\\f113\"}.fa-folder-o:before{content:\"\\f114\"}.fa-folder-open-o:before{content:\"\\f115\"}.fa-smile-o:before{content:\"\\f118\"}.fa-frown-o:before{content:\"\\f119\"}.fa-meh-o:before{content:\"\\f11a\"}.fa-gamepad:before{content:\"\\f11b\"}.fa-keyboard-o:before{content:\"\\f11c\"}.fa-flag-o:before{content:\"\\f11d\"}.fa-flag-checkered:before{content:\"\\f11e\"}.fa-terminal:before{content:\"\\f120\"}.fa-code:before{content:\"\\f121\"}.fa-mail-reply-all:before,.fa-reply-all:before{content:\"\\f122\"}.fa-star-half-empty:before,.fa-star-half-full:before,.fa-star-half-o:before{content:\"\\f123\"}.fa-location-arrow:before{content:\"\\f124\"}.fa-crop:before{content:\"\\f125\"}.fa-code-fork:before{content:\"\\f126\"}.fa-unlink:before,.fa-chain-broken:before{content:\"\\f127\"}.fa-question:before{content:\"\\f128\"}.fa-info:before{content:\"\\f129\"}.fa-exclamation:before{content:\"\\f12a\"}.fa-superscript:before{content:\"\\f12b\"}.fa-subscript:before{content:\"\\f12c\"}.fa-eraser:before{content:\"\\f12d\"}.fa-puzzle-piece:before{content:\"\\f12e\"}.fa-microphone:before{content:\"\\f130\"}.fa-microphone-slash:before{content:\"\\f131\"}.fa-shield:before{content:\"\\f132\"}.fa-calendar-o:before{content:\"\\f133\"}.fa-fire-extinguisher:before{content:\"\\f134\"}.fa-rocket:before{content:\"\\f135\"}.fa-maxcdn:before{content:\"\\f136\"}.fa-chevron-circle-left:before{content:\"\\f137\"}.fa-chevron-circle-right:before{content:\"\\f138\"}.fa-chevron-circle-up:before{content:\"\\f139\"}.fa-chevron-circle-down:before{content:\"\\f13a\"}.fa-html5:before{content:\"\\f13b\"}.fa-css3:before{content:\"\\f13c\"}.fa-anchor:before{content:\"\\f13d\"}.fa-unlock-alt:before{content:\"\\f13e\"}.fa-bullseye:before{content:\"\\f140\"}.fa-ellipsis-h:before{content:\"\\f141\"}.fa-ellipsis-v:before{content:\"\\f142\"}.fa-rss-square:before{content:\"\\f143\"}.fa-play-circle:before{content:\"\\f144\"}.fa-ticket:before{content:\"\\f145\"}.fa-minus-square:before{content:\"\\f146\"}.fa-minus-square-o:before{content:\"\\f147\"}.fa-level-up:before{content:\"\\f148\"}.fa-level-down:before{content:\"\\f149\"}.fa-check-square:before{content:\"\\f14a\"}.fa-pencil-square:before{content:\"\\f14b\"}.fa-external-link-square:before{content:\"\\f14c\"}.fa-share-square:before{content:\"\\f14d\"}.fa-compass:before{content:\"\\f14e\"}.fa-toggle-down:before,.fa-caret-square-o-down:before{content:\"\\f150\"}.fa-toggle-up:before,.fa-caret-square-o-up:before{content:\"\\f151\"}.fa-toggle-right:before,.fa-caret-square-o-right:before{content:\"\\f152\"}.fa-euro:before,.fa-eur:before{content:\"\\f153\"}.fa-gbp:before{content:\"\\f154\"}.fa-dollar:before,.fa-usd:before{content:\"\\f155\"}.fa-rupee:before,.fa-inr:before{content:\"\\f156\"}.fa-cny:before,.fa-rmb:before,.fa-yen:before,.fa-jpy:before{content:\"\\f157\"}.fa-ruble:before,.fa-rouble:before,.fa-rub:before{content:\"\\f158\"}.fa-won:before,.fa-krw:before{content:\"\\f159\"}.fa-bitcoin:before,.fa-btc:before{content:\"\\f15a\"}.fa-file:before{content:\"\\f15b\"}.fa-file-text:before{content:\"\\f15c\"}.fa-sort-alpha-asc:before{content:\"\\f15d\"}.fa-sort-alpha-desc:before{content:\"\\f15e\"}.fa-sort-amount-asc:before{content:\"\\f160\"}.fa-sort-amount-desc:before{content:\"\\f161\"}.fa-sort-numeric-asc:before{content:\"\\f162\"}.fa-sort-numeric-desc:before{content:\"\\f163\"}.fa-thumbs-up:before{content:\"\\f164\"}.fa-thumbs-down:before{content:\"\\f165\"}.fa-youtube-square:before{content:\"\\f166\"}.fa-youtube:before{content:\"\\f167\"}.fa-xing:before{content:\"\\f168\"}.fa-xing-square:before{content:\"\\f169\"}.fa-youtube-play:before{content:\"\\f16a\"}.fa-dropbox:before{content:\"\\f16b\"}.fa-stack-overflow:before{content:\"\\f16c\"}.fa-instagram:before{content:\"\\f16d\"}.fa-flickr:before{content:\"\\f16e\"}.fa-adn:before{content:\"\\f170\"}.fa-bitbucket:before{content:\"\\f171\"}.fa-bitbucket-square:before{content:\"\\f172\"}.fa-tumblr:before{content:\"\\f173\"}.fa-tumblr-square:before{content:\"\\f174\"}.fa-long-arrow-down:before{content:\"\\f175\"}.fa-long-arrow-up:before{content:\"\\f176\"}.fa-long-arrow-left:before{content:\"\\f177\"}.fa-long-arrow-right:before{content:\"\\f178\"}.fa-apple:before{content:\"\\f179\"}.fa-windows:before{content:\"\\f17a\"}.fa-android:before{content:\"\\f17b\"}.fa-linux:before{content:\"\\f17c\"}.fa-dribbble:before{content:\"\\f17d\"}.fa-skype:before{content:\"\\f17e\"}.fa-foursquare:before{content:\"\\f180\"}.fa-trello:before{content:\"\\f181\"}.fa-female:before{content:\"\\f182\"}.fa-male:before{content:\"\\f183\"}.fa-gittip:before,.fa-gratipay:before{content:\"\\f184\"}.fa-sun-o:before{content:\"\\f185\"}.fa-moon-o:before{content:\"\\f186\"}.fa-archive:before{content:\"\\f187\"}.fa-bug:before{content:\"\\f188\"}.fa-vk:before{content:\"\\f189\"}.fa-weibo:before{content:\"\\f18a\"}.fa-renren:before{content:\"\\f18b\"}.fa-pagelines:before{content:\"\\f18c\"}.fa-stack-exchange:before{content:\"\\f18d\"}.fa-arrow-circle-o-right:before{content:\"\\f18e\"}.fa-arrow-circle-o-left:before{content:\"\\f190\"}.fa-toggle-left:before,.fa-caret-square-o-left:before{content:\"\\f191\"}.fa-dot-circle-o:before{content:\"\\f192\"}.fa-wheelchair:before{content:\"\\f193\"}.fa-vimeo-square:before{content:\"\\f194\"}.fa-turkish-lira:before,.fa-try:before{content:\"\\f195\"}.fa-plus-square-o:before{content:\"\\f196\"}.fa-space-shuttle:before{content:\"\\f197\"}.fa-slack:before{content:\"\\f198\"}.fa-envelope-square:before{content:\"\\f199\"}.fa-wordpress:before{content:\"\\f19a\"}.fa-openid:before{content:\"\\f19b\"}.fa-institution:before,.fa-bank:before,.fa-university:before{content:\"\\f19c\"}.fa-mortar-board:before,.fa-graduation-cap:before{content:\"\\f19d\"}.fa-yahoo:before{content:\"\\f19e\"}.fa-google:before{content:\"\\f1a0\"}.fa-reddit:before{content:\"\\f1a1\"}.fa-reddit-square:before{content:\"\\f1a2\"}.fa-stumbleupon-circle:before{content:\"\\f1a3\"}.fa-stumbleupon:before{content:\"\\f1a4\"}.fa-delicious:before{content:\"\\f1a5\"}.fa-digg:before{content:\"\\f1a6\"}.fa-pied-piper:before{content:\"\\f1a7\"}.fa-pied-piper-alt:before{content:\"\\f1a8\"}.fa-drupal:before{content:\"\\f1a9\"}.fa-joomla:before{content:\"\\f1aa\"}.fa-language:before{content:\"\\f1ab\"}.fa-fax:before{content:\"\\f1ac\"}.fa-building:before{content:\"\\f1ad\"}.fa-child:before{content:\"\\f1ae\"}.fa-paw:before{content:\"\\f1b0\"}.fa-spoon:before{content:\"\\f1b1\"}.fa-cube:before{content:\"\\f1b2\"}.fa-cubes:before{content:\"\\f1b3\"}.fa-behance:before{content:\"\\f1b4\"}.fa-behance-square:before{content:\"\\f1b5\"}.fa-steam:before{content:\"\\f1b6\"}.fa-steam-square:before{content:\"\\f1b7\"}.fa-recycle:before{content:\"\\f1b8\"}.fa-automobile:before,.fa-car:before{content:\"\\f1b9\"}.fa-cab:before,.fa-taxi:before{content:\"\\f1ba\"}.fa-tree:before{content:\"\\f1bb\"}.fa-spotify:before{content:\"\\f1bc\"}.fa-deviantart:before{content:\"\\f1bd\"}.fa-soundcloud:before{content:\"\\f1be\"}.fa-database:before{content:\"\\f1c0\"}.fa-file-pdf-o:before{content:\"\\f1c1\"}.fa-file-word-o:before{content:\"\\f1c2\"}.fa-file-excel-o:before{content:\"\\f1c3\"}.fa-file-powerpoint-o:before{content:\"\\f1c4\"}.fa-file-photo-o:before,.fa-file-picture-o:before,.fa-file-image-o:before{content:\"\\f1c5\"}.fa-file-zip-o:before,.fa-file-archive-o:before{content:\"\\f1c6\"}.fa-file-sound-o:before,.fa-file-audio-o:before{content:\"\\f1c7\"}.fa-file-movie-o:before,.fa-file-video-o:before{content:\"\\f1c8\"}.fa-file-code-o:before{content:\"\\f1c9\"}.fa-vine:before{content:\"\\f1ca\"}.fa-codepen:before{content:\"\\f1cb\"}.fa-jsfiddle:before{content:\"\\f1cc\"}.fa-life-bouy:before,.fa-life-buoy:before,.fa-life-saver:before,.fa-support:before,.fa-life-ring:before{content:\"\\f1cd\"}.fa-circle-o-notch:before{content:\"\\f1ce\"}.fa-ra:before,.fa-rebel:before{content:\"\\f1d0\"}.fa-ge:before,.fa-empire:before{content:\"\\f1d1\"}.fa-git-square:before{content:\"\\f1d2\"}.fa-git:before{content:\"\\f1d3\"}.fa-y-combinator-square:before,.fa-yc-square:before,.fa-hacker-news:before{content:\"\\f1d4\"}.fa-tencent-weibo:before{content:\"\\f1d5\"}.fa-qq:before{content:\"\\f1d6\"}.fa-wechat:before,.fa-weixin:before{content:\"\\f1d7\"}.fa-send:before,.fa-paper-plane:before{content:\"\\f1d8\"}.fa-send-o:before,.fa-paper-plane-o:before{content:\"\\f1d9\"}.fa-history:before{content:\"\\f1da\"}.fa-circle-thin:before{content:\"\\f1db\"}.fa-header:before{content:\"\\f1dc\"}.fa-paragraph:before{content:\"\\f1dd\"}.fa-sliders:before{content:\"\\f1de\"}.fa-share-alt:before{content:\"\\f1e0\"}.fa-share-alt-square:before{content:\"\\f1e1\"}.fa-bomb:before{content:\"\\f1e2\"}.fa-soccer-ball-o:before,.fa-futbol-o:before{content:\"\\f1e3\"}.fa-tty:before{content:\"\\f1e4\"}.fa-binoculars:before{content:\"\\f1e5\"}.fa-plug:before{content:\"\\f1e6\"}.fa-slideshare:before{content:\"\\f1e7\"}.fa-twitch:before{content:\"\\f1e8\"}.fa-yelp:before{content:\"\\f1e9\"}.fa-newspaper-o:before{content:\"\\f1ea\"}.fa-wifi:before{content:\"\\f1eb\"}.fa-calculator:before{content:\"\\f1ec\"}.fa-paypal:before{content:\"\\f1ed\"}.fa-google-wallet:before{content:\"\\f1ee\"}.fa-cc-visa:before{content:\"\\f1f0\"}.fa-cc-mastercard:before{content:\"\\f1f1\"}.fa-cc-discover:before{content:\"\\f1f2\"}.fa-cc-amex:before{content:\"\\f1f3\"}.fa-cc-paypal:before{content:\"\\f1f4\"}.fa-cc-stripe:before{content:\"\\f1f5\"}.fa-bell-slash:before{content:\"\\f1f6\"}.fa-bell-slash-o:before{content:\"\\f1f7\"}.fa-trash:before{content:\"\\f1f8\"}.fa-copyright:before{content:\"\\f1f9\"}.fa-at:before{content:\"\\f1fa\"}.fa-eyedropper:before{content:\"\\f1fb\"}.fa-paint-brush:before{content:\"\\f1fc\"}.fa-birthday-cake:before{content:\"\\f1fd\"}.fa-area-chart:before{content:\"\\f1fe\"}.fa-pie-chart:before{content:\"\\f200\"}.fa-line-chart:before{content:\"\\f201\"}.fa-lastfm:before{content:\"\\f202\"}.fa-lastfm-square:before{content:\"\\f203\"}.fa-toggle-off:before{content:\"\\f204\"}.fa-toggle-on:before{content:\"\\f205\"}.fa-bicycle:before{content:\"\\f206\"}.fa-bus:before{content:\"\\f207\"}.fa-ioxhost:before{content:\"\\f208\"}.fa-angellist:before{content:\"\\f209\"}.fa-cc:before{content:\"\\f20a\"}.fa-shekel:before,.fa-sheqel:before,.fa-ils:before{content:\"\\f20b\"}.fa-meanpath:before{content:\"\\f20c\"}.fa-buysellads:before{content:\"\\f20d\"}.fa-connectdevelop:before{content:\"\\f20e\"}.fa-dashcube:before{content:\"\\f210\"}.fa-forumbee:before{content:\"\\f211\"}.fa-leanpub:before{content:\"\\f212\"}.fa-sellsy:before{content:\"\\f213\"}.fa-shirtsinbulk:before{content:\"\\f214\"}.fa-simplybuilt:before{content:\"\\f215\"}.fa-skyatlas:before{content:\"\\f216\"}.fa-cart-plus:before{content:\"\\f217\"}.fa-cart-arrow-down:before{content:\"\\f218\"}.fa-diamond:before{content:\"\\f219\"}.fa-ship:before{content:\"\\f21a\"}.fa-user-secret:before{content:\"\\f21b\"}.fa-motorcycle:before{content:\"\\f21c\"}.fa-street-view:before{content:\"\\f21d\"}.fa-heartbeat:before{content:\"\\f21e\"}.fa-venus:before{content:\"\\f221\"}.fa-mars:before{content:\"\\f222\"}.fa-mercury:before{content:\"\\f223\"}.fa-intersex:before,.fa-transgender:before{content:\"\\f224\"}.fa-transgender-alt:before{content:\"\\f225\"}.fa-venus-double:before{content:\"\\f226\"}.fa-mars-double:before{content:\"\\f227\"}.fa-venus-mars:before{content:\"\\f228\"}.fa-mars-stroke:before{content:\"\\f229\"}.fa-mars-stroke-v:before{content:\"\\f22a\"}.fa-mars-stroke-h:before{content:\"\\f22b\"}.fa-neuter:before{content:\"\\f22c\"}.fa-genderless:before{content:\"\\f22d\"}.fa-facebook-official:before{content:\"\\f230\"}.fa-pinterest-p:before{content:\"\\f231\"}.fa-whatsapp:before{content:\"\\f232\"}.fa-server:before{content:\"\\f233\"}.fa-user-plus:before{content:\"\\f234\"}.fa-user-times:before{content:\"\\f235\"}.fa-hotel:before,.fa-bed:before{content:\"\\f236\"}.fa-viacoin:before{content:\"\\f237\"}.fa-train:before{content:\"\\f238\"}.fa-subway:before{content:\"\\f239\"}.fa-medium:before{content:\"\\f23a\"}.fa-yc:before,.fa-y-combinator:before{content:\"\\f23b\"}.fa-optin-monster:before{content:\"\\f23c\"}.fa-opencart:before{content:\"\\f23d\"}.fa-expeditedssl:before{content:\"\\f23e\"}.fa-battery-4:before,.fa-battery-full:before{content:\"\\f240\"}.fa-battery-3:before,.fa-battery-three-quarters:before{content:\"\\f241\"}.fa-battery-2:before,.fa-battery-half:before{content:\"\\f242\"}.fa-battery-1:before,.fa-battery-quarter:before{content:\"\\f243\"}.fa-battery-0:before,.fa-battery-empty:before{content:\"\\f244\"}.fa-mouse-pointer:before{content:\"\\f245\"}.fa-i-cursor:before{content:\"\\f246\"}.fa-object-group:before{content:\"\\f247\"}.fa-object-ungroup:before{content:\"\\f248\"}.fa-sticky-note:before{content:\"\\f249\"}.fa-sticky-note-o:before{content:\"\\f24a\"}.fa-cc-jcb:before{content:\"\\f24b\"}.fa-cc-diners-club:before{content:\"\\f24c\"}.fa-clone:before{content:\"\\f24d\"}.fa-balance-scale:before{content:\"\\f24e\"}.fa-hourglass-o:before{content:\"\\f250\"}.fa-hourglass-1:before,.fa-hourglass-start:before{content:\"\\f251\"}.fa-hourglass-2:before,.fa-hourglass-half:before{content:\"\\f252\"}.fa-hourglass-3:before,.fa-hourglass-end:before{content:\"\\f253\"}.fa-hourglass:before{content:\"\\f254\"}.fa-hand-grab-o:before,.fa-hand-rock-o:before{content:\"\\f255\"}.fa-hand-stop-o:before,.fa-hand-paper-o:before{content:\"\\f256\"}.fa-hand-scissors-o:before{content:\"\\f257\"}.fa-hand-lizard-o:before{content:\"\\f258\"}.fa-hand-spock-o:before{content:\"\\f259\"}.fa-hand-pointer-o:before{content:\"\\f25a\"}.fa-hand-peace-o:before{content:\"\\f25b\"}.fa-trademark:before{content:\"\\f25c\"}.fa-registered:before{content:\"\\f25d\"}.fa-creative-commons:before{content:\"\\f25e\"}.fa-gg:before{content:\"\\f260\"}.fa-gg-circle:before{content:\"\\f261\"}.fa-tripadvisor:before{content:\"\\f262\"}.fa-odnoklassniki:before{content:\"\\f263\"}.fa-odnoklassniki-square:before{content:\"\\f264\"}.fa-get-pocket:before{content:\"\\f265\"}.fa-wikipedia-w:before{content:\"\\f266\"}.fa-safari:before{content:\"\\f267\"}.fa-chrome:before{content:\"\\f268\"}.fa-firefox:before{content:\"\\f269\"}.fa-opera:before{content:\"\\f26a\"}.fa-internet-explorer:before{content:\"\\f26b\"}.fa-tv:before,.fa-television:before{content:\"\\f26c\"}.fa-contao:before{content:\"\\f26d\"}.fa-500px:before{content:\"\\f26e\"}.fa-amazon:before{content:\"\\f270\"}.fa-calendar-plus-o:before{content:\"\\f271\"}.fa-calendar-minus-o:before{content:\"\\f272\"}.fa-calendar-times-o:before{content:\"\\f273\"}.fa-calendar-check-o:before{content:\"\\f274\"}.fa-industry:before{content:\"\\f275\"}.fa-map-pin:before{content:\"\\f276\"}.fa-map-signs:before{content:\"\\f277\"}.fa-map-o:before{content:\"\\f278\"}.fa-map:before{content:\"\\f279\"}.fa-commenting:before{content:\"\\f27a\"}.fa-commenting-o:before{content:\"\\f27b\"}.fa-houzz:before{content:\"\\f27c\"}.fa-vimeo:before{content:\"\\f27d\"}.fa-black-tie:before{content:\"\\f27e\"}.fa-fonticons:before{content:\"\\f280\"}.fa-reddit-alien:before{content:\"\\f281\"}.fa-edge:before{content:\"\\f282\"}.fa-credit-card-alt:before{content:\"\\f283\"}.fa-codiepie:before{content:\"\\f284\"}.fa-modx:before{content:\"\\f285\"}.fa-fort-awesome:before{content:\"\\f286\"}.fa-usb:before{content:\"\\f287\"}.fa-product-hunt:before{content:\"\\f288\"}.fa-mixcloud:before{content:\"\\f289\"}.fa-scribd:before{content:\"\\f28a\"}.fa-pause-circle:before{content:\"\\f28b\"}.fa-pause-circle-o:before{content:\"\\f28c\"}.fa-stop-circle:before{content:\"\\f28d\"}.fa-stop-circle-o:before{content:\"\\f28e\"}.fa-shopping-bag:before{content:\"\\f290\"}.fa-shopping-basket:before{content:\"\\f291\"}.fa-hashtag:before{content:\"\\f292\"}.fa-bluetooth:before{content:\"\\f293\"}.fa-bluetooth-b:before{content:\"\\f294\"}.fa-percent:before{content:\"\\f295\"}\n"],"sourceRoot":"webpack://"}]);

	// exports


/***/ },
/* 3 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "fontawesome-webfont.eot";

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "fontawesome-webfont.eot";

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "fontawesome-webfont.woff2";

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "fontawesome-webfont.woff";

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "fontawesome-webfont.ttf";

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "fontawesome-webfont.svg";

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}

	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}

	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}

	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*! FileAPI 2.0.19 - BSD | git://github.com/mailru/FileAPI.git */
	!function(a){"use strict";var b=a.HTMLCanvasElement&&a.HTMLCanvasElement.prototype,c=a.Blob&&function(){try{return Boolean(new Blob)}catch(a){return!1}}(),d=c&&a.Uint8Array&&function(){try{return 100===new Blob([new Uint8Array(100)]).size}catch(a){return!1}}(),e=a.BlobBuilder||a.WebKitBlobBuilder||a.MozBlobBuilder||a.MSBlobBuilder,f=(c||e)&&a.atob&&a.ArrayBuffer&&a.Uint8Array&&function(a){var b,f,g,h,i,j;for(b=a.split(",")[0].indexOf("base64")>=0?atob(a.split(",")[1]):decodeURIComponent(a.split(",")[1]),f=new ArrayBuffer(b.length),g=new Uint8Array(f),h=0;h<b.length;h+=1)g[h]=b.charCodeAt(h);return i=a.split(",")[0].split(":")[1].split(";")[0],c?new Blob([d?g:f],{type:i}):(j=new e,j.append(f),j.getBlob(i))};a.HTMLCanvasElement&&!b.toBlob&&(b.mozGetAsFile?b.toBlob=function(a,c,d){a(d&&b.toDataURL&&f?f(this.toDataURL(c,d)):this.mozGetAsFile("blob",c))}:b.toDataURL&&f&&(b.toBlob=function(a,b,c){a(f(this.toDataURL(b,c)))})),a.dataURLtoBlob=f}(window),function(a,b){"use strict";function c(a,b,c,d,e){var f={type:c.type||c,target:a,result:d};Y(f,e),b(f)}function d(a){return z&&!!z.prototype["readAs"+a]}function e(a,e,f,g){if(ca.isBlob(a)&&d(f)){var h=new z;Z(h,S,function j(b){var d=b.type;"progress"==d?c(a,e,b,b.target.result,{loaded:b.loaded,total:b.total}):"loadend"==d?($(h,S,j),h=null):c(a,e,b,b.target.result)});try{g?h["readAs"+f](a,g):h["readAs"+f](a)}catch(i){c(a,e,"error",b,{error:i.toString()})}}else c(a,e,"error",b,{error:"filreader_not_support_"+f})}function f(a,b){if(!a.type&&(u||a.size%4096===0&&a.size<=102400))if(z)try{var c=new z;_(c,S,function(a){var d="error"!=a.type;d?((null==c.readyState||c.readyState===c.LOADING)&&c.abort(),b(d)):b(!1,c.error)}),c.readAsDataURL(a)}catch(d){b(!1,d)}else b(null,new Error("FileReader is not supported"));else b(!0)}function g(a){return a&&(a.isFile||a.isDirectory)}function h(a){var b;return a.getAsEntry?b=a.getAsEntry():a.webkitGetAsEntry&&(b=a.webkitGetAsEntry()),b}function i(a,b){if(a)if(a.isFile)a.file(function(c){c.fullPath=a.fullPath,b(!1,[c],[c])},function(c){a.error=c,b("FileError.code: "+c.code,[],[a])});else if(a.isDirectory){var c=a.createReader(),d=!0,e=[],f=[a],g=function(c){a.error=c,b("DirectoryError.code: "+c.code,e,f)},j=function l(h){d&&(d=!1,h.length||(a.error=new Error("directory is empty"))),h.length?ca.afor(h,function(a,b){i(b,function(b,d,h){b||(e=e.concat(d)),f=f.concat(h),a?a():c.readEntries(l,g)})}):b(!1,e,f)};c.readEntries(j,g)}else i(h(a),b);else{var k=new Error("invalid entry");a=new Object(a),a.error=k,b(k.message,[],[a])}}function j(a){var b={};return X(a,function(a,c){a&&"object"==typeof a&&void 0===a.nodeType&&(a=Y({},a)),b[c]=a}),b}function k(a){return L.test(a&&a.tagName)}function l(a){return(a.originalEvent||a||"").dataTransfer||{}}function m(a){var b;for(b in a)if(a.hasOwnProperty(b)&&!(a[b]instanceof Object||"overlay"===b||"filter"===b))return!0;return!1}var n,o,p=1,q=function(){},r=a.document,s=r.doctype||{},t=a.navigator.userAgent,u=/safari\//i.test(t)&&!/chrome\//i.test(t),v=/iemobile\//i.test(t),w=a.createObjectURL&&a||a.URL&&URL.revokeObjectURL&&URL||a.webkitURL&&webkitURL,x=a.Blob,y=a.File,z=a.FileReader,A=a.FormData,B=a.XMLHttpRequest,C=a.jQuery,D=!(!(y&&z&&(a.Uint8Array||A||B.prototype.sendAsBinary))||u&&/windows/i.test(t)&&!v),E=D&&"withCredentials"in new B,F=D&&!!x&&!!(x.prototype.webkitSlice||x.prototype.mozSlice||x.prototype.slice),G=(""+"".normalize).indexOf("[native code]")>0,H=a.dataURLtoBlob,I=/img/i,J=/canvas/i,K=/img|canvas/i,L=/input/i,M=/^data:[^,]+,/,N={}.toString,O=a.Math,P=function(b){return b=new a.Number(O.pow(1024,b)),b.from=function(a){return O.round(a*this)},b},Q={},R=[],S="abort progress error load loadend",T="status statusText readyState response responseXML responseText responseBody".split(" "),U="currentTarget",V="preventDefault",W=function(a){return a&&"length"in a},X=function(a,b,c){if(a)if(W(a))for(var d=0,e=a.length;e>d;d++)d in a&&b.call(c,a[d],d,a);else for(var f in a)a.hasOwnProperty(f)&&b.call(c,a[f],f,a)},Y=function(a){for(var b=arguments,c=1,d=function(b,c){a[c]=b};c<b.length;c++)X(b[c],d);return a},Z=function(a,b,c){if(a){var d=ca.uid(a);Q[d]||(Q[d]={});var e=z&&a&&a instanceof z;X(b.split(/\s+/),function(b){C&&!e?C.event.add(a,b,c):(Q[d][b]||(Q[d][b]=[]),Q[d][b].push(c),a.addEventListener?a.addEventListener(b,c,!1):a.attachEvent?a.attachEvent("on"+b,c):a["on"+b]=c)})}},$=function(a,b,c){if(a){var d=ca.uid(a),e=Q[d]||{},f=z&&a&&a instanceof z;X(b.split(/\s+/),function(b){if(C&&!f)C.event.remove(a,b,c);else{for(var d=e[b]||[],g=d.length;g--;)if(d[g]===c){d.splice(g,1);break}a.addEventListener?a.removeEventListener(b,c,!1):a.detachEvent?a.detachEvent("on"+b,c):a["on"+b]=null}})}},_=function(a,b,c){Z(a,b,function d(e){$(a,b,d),c(e)})},aa=function(b){return b.target||(b.target=a.event&&a.event.srcElement||r),3===b.target.nodeType&&(b.target=b.target.parentNode),b},ba=function(a){var b=r.createElement("input");return b.setAttribute("type","file"),a in b},ca={version:"2.0.19",cors:!1,html5:!0,media:!1,formData:!0,multiPassResize:!0,debug:!1,pingUrl:!1,multiFlash:!1,flashAbortTimeout:0,withCredentials:!0,staticPath:"./dist/",flashUrl:0,flashImageUrl:0,postNameConcat:function(a,b){return a+(null!=b?"["+b+"]":"")},ext2mime:{jpg:"image/jpeg",tif:"image/tiff",txt:"text/plain"},accept:{"image/*":"art bm bmp dwg dxf cbr cbz fif fpx gif ico iefs jfif jpe jpeg jpg jps jut mcf nap nif pbm pcx pgm pict pm png pnm qif qtif ras rast rf rp svf tga tif tiff xbm xbm xpm xwd","audio/*":"m4a flac aac rm mpa wav wma ogg mp3 mp2 m3u mod amf dmf dsm far gdm imf it m15 med okt s3m stm sfx ult uni xm sid ac3 dts cue aif aiff wpl ape mac mpc mpp shn wv nsf spc gym adplug adx dsp adp ymf ast afc hps xs","video/*":"m4v 3gp nsv ts ty strm rm rmvb m3u ifo mov qt divx xvid bivx vob nrg img iso pva wmv asf asx ogm m2v avi bin dat dvr-ms mpg mpeg mp4 mkv avc vp3 svq3 nuv viv dv fli flv wpl"},uploadRetry:0,networkDownRetryTimeout:5e3,chunkSize:0,chunkUploadRetry:0,chunkNetworkDownRetryTimeout:2e3,KB:P(1),MB:P(2),GB:P(3),TB:P(4),EMPTY_PNG:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2NkAAIAAAoAAggA9GkAAAAASUVORK5CYII=",expando:"fileapi"+(new Date).getTime(),uid:function(a){return a?a[ca.expando]=a[ca.expando]||ca.uid():(++p,ca.expando+p)},log:function(){ca.debug&&n&&(o?console.log.apply(console,arguments):console.log([].join.call(arguments," ")))},newImage:function(a,b){var c=r.createElement("img");return b&&ca.event.one(c,"error load",function(a){b("error"==a.type,c),c=null}),c.src=a,c},getXHR:function(){var b;if(B)b=new B;else if(a.ActiveXObject)try{b=new ActiveXObject("MSXML2.XMLHttp.3.0")}catch(c){b=new ActiveXObject("Microsoft.XMLHTTP")}return b},isArray:W,support:{dnd:E&&"ondrop"in r.createElement("div"),cors:E,html5:D,chunked:F,dataURI:!0,accept:ba("accept"),multiple:ba("multiple")},event:{on:Z,off:$,one:_,fix:aa},throttle:function(b,c){var d,e;return function(){e=arguments,d||(b.apply(a,e),d=setTimeout(function(){d=0,b.apply(a,e)},c))}},F:function(){},parseJSON:function(b){var c;return c=a.JSON&&JSON.parse?JSON.parse(b):new Function("return ("+b.replace(/([\r\n])/g,"\\$1")+");")()},trim:function(a){return a=String(a),a.trim?a.trim():a.replace(/^\s+|\s+$/g,"")},defer:function(){var a,c,d=[],e={resolve:function(b,f){for(e.resolve=q,c=b||!1,a=f;f=d.shift();)f(c,a)},then:function(e){c!==b?e(c,a):d.push(e)}};return e},queue:function(a){var b=0,c=0,d=!1,e=!1,f={inc:function(){c++},next:function(){b++,setTimeout(f.check,0)},check:function(){b>=c&&!d&&f.end()},isFail:function(){return d},fail:function(){!d&&a(d=!0)},end:function(){e||(e=!0,a())}};return f},each:X,afor:function(a,b){var c=0,d=a.length;W(a)&&d--?!function e(){b(d!=c&&e,a[c],c++)}():b(!1)},extend:Y,isFile:function(a){return"[object File]"===N.call(a)},isBlob:function(a){return this.isFile(a)||"[object Blob]"===N.call(a)},isCanvas:function(a){return a&&J.test(a.nodeName)},getFilesFilter:function(a){return a="string"==typeof a?a:a.getAttribute&&a.getAttribute("accept")||"",a?new RegExp("("+a.replace(/\./g,"\\.").replace(/,/g,"|")+")$","i"):/./},readAsDataURL:function(a,b){ca.isCanvas(a)?c(a,b,"load",ca.toDataURL(a)):e(a,b,"DataURL")},readAsBinaryString:function(a,b){d("BinaryString")?e(a,b,"BinaryString"):e(a,function(a){if("load"==a.type)try{a.result=ca.toBinaryString(a.result)}catch(c){a.type="error",a.message=c.toString()}b(a)},"DataURL")},readAsArrayBuffer:function(a,b){e(a,b,"ArrayBuffer")},readAsText:function(a,b,c){c||(c=b,b="utf-8"),e(a,c,"Text",b)},toDataURL:function(a,b){return"string"==typeof a?a:a.toDataURL?a.toDataURL(b||"image/png"):void 0},toBinaryString:function(b){return a.atob(ca.toDataURL(b).replace(M,""))},readAsImage:function(a,d,e){if(ca.isBlob(a))if(w){var f=w.createObjectURL(a);f===b?c(a,d,"error"):ca.readAsImage(f,d,e)}else ca.readAsDataURL(a,function(b){"load"==b.type?ca.readAsImage(b.result,d,e):(e||"error"==b.type)&&c(a,d,b,null,{loaded:b.loaded,total:b.total})});else if(ca.isCanvas(a))c(a,d,"load",a);else if(I.test(a.nodeName))if(a.complete)c(a,d,"load",a);else{var g="error abort load";_(a,g,function i(b){"load"==b.type&&w&&w.revokeObjectURL(a.src),$(a,g,i),c(a,d,b,a)})}else if(a.iframe)c(a,d,{type:"error"});else{var h=ca.newImage(a.dataURL||a);ca.readAsImage(h,d,e)}},checkFileObj:function(a){var b={},c=ca.accept;return"object"==typeof a?b=a:b.name=(a+"").split(/\\|\//g).pop(),null==b.type&&(b.type=b.name.split(".").pop()),X(c,function(a,c){a=new RegExp(a.replace(/\s/g,"|"),"i"),(a.test(b.type)||ca.ext2mime[b.type])&&(b.type=ca.ext2mime[b.type]||c.split("/")[0]+"/"+b.type)}),b},getDropFiles:function(a,b){var c,d=[],e=[],j=l(a),k=j.files,m=j.items,n=W(m)&&m[0]&&h(m[0]),o=ca.queue(function(){b(d,e)});if(n)if(G&&k){var p,q,r=k.length;for(c=new Array(r);r--;){p=k[r];try{q=h(m[r])}catch(s){ca.log("[err] getDropFiles: ",s),q=null}g(q)&&(q.isDirectory||q.isFile&&p.name==p.name.normalize("NFC"))?c[r]=q:c[r]=p}}else c=m;else c=k;X(c||[],function(a){o.inc();try{n&&g(a)?i(a,function(a,b,c){a?ca.log("[err] getDropFiles:",a):d.push.apply(d,b),e.push.apply(e,c),o.next()}):f(a,function(b,c){b?d.push(a):a.error=c,e.push(a),o.next()})}catch(b){o.next(),ca.log("[err] getDropFiles: ",b)}}),o.check()},getFiles:function(a,b,c){var d=[];return c?(ca.filterFiles(ca.getFiles(a),b,c),null):(a.jquery&&(a.each(function(){d=d.concat(ca.getFiles(this))}),a=d,d=[]),"string"==typeof b&&(b=ca.getFilesFilter(b)),a.originalEvent?a=aa(a.originalEvent):a.srcElement&&(a=aa(a)),a.dataTransfer?a=a.dataTransfer:a.target&&(a=a.target),a.files?(d=a.files,D||(d[0].blob=a,d[0].iframe=!0)):!D&&k(a)?ca.trim(a.value)&&(d=[ca.checkFileObj(a.value)],d[0].blob=a,d[0].iframe=!0):W(a)&&(d=a),ca.filter(d,function(a){return!b||b.test(a.name)}))},getTotalSize:function(a){for(var b=0,c=a&&a.length;c--;)b+=a[c].size;return b},getInfo:function(a,b){var c={},d=R.concat();ca.isBlob(a)?!function e(){var f=d.shift();f?f.test(a.type)?f(a,function(a,d){a?b(a):(Y(c,d),e())}):e():b(!1,c)}():b("not_support_info",c)},addInfoReader:function(a,b){b.test=function(b){return a.test(b)},R.push(b)},filter:function(a,b){for(var c,d=[],e=0,f=a.length;f>e;e++)e in a&&(c=a[e],b.call(c,c,e,a)&&d.push(c));return d},filterFiles:function(a,b,c){if(a.length){var d,e=a.concat(),f=[],g=[];!function h(){e.length?(d=e.shift(),ca.getInfo(d,function(a,c){(b(d,a?!1:c)?f:g).push(d),h()})):c(f,g)}()}else c([],a)},upload:function(a){a=Y({jsonp:"callback",prepare:ca.F,beforeupload:ca.F,upload:ca.F,fileupload:ca.F,fileprogress:ca.F,filecomplete:ca.F,progress:ca.F,complete:ca.F,pause:ca.F,imageOriginal:!0,chunkSize:ca.chunkSize,chunkUploadRetry:ca.chunkUploadRetry,uploadRetry:ca.uploadRetry},a),a.imageAutoOrientation&&!a.imageTransform&&(a.imageTransform={rotate:"auto"});var b,c=new ca.XHR(a),d=this._getFilesDataArray(a.files),e=this,f=0,g=0,h=!1;return X(d,function(a){f+=a.size}),c.files=[],X(d,function(a){c.files.push(a.file)}),c.total=f,c.loaded=0,c.filesLeft=d.length,a.beforeupload(c,a),b=function(){var i=d.shift(),k=i&&i.file,l=!1,m=j(a);if(c.filesLeft=d.length,k&&k.name===ca.expando&&(k=null,ca.log("[warn] FileAPI.upload() — called without files")),("abort"!=c.statusText||c.current)&&i){if(h=!1,c.currentFile=k,k&&a.prepare(k,m)===!1)return void b.call(e);m.file=k,e._getFormData(m,i,function(h){g||a.upload(c,a);var j=new ca.XHR(Y({},m,{upload:k?function(){a.fileupload(k,j,m)}:q,progress:k?function(b){l||(l=b.loaded===b.total,a.fileprogress({type:"progress",total:i.total=b.total,loaded:i.loaded=b.loaded},k,j,m),a.progress({type:"progress",total:f,loaded:c.loaded=g+i.size*(b.loaded/b.total)||0},k,j,m))}:q,complete:function(d){X(T,function(a){c[a]=j[a]}),k&&(i.total=i.total||i.size,i.loaded=i.total,d||(this.progress(i),l=!0,g+=i.size,c.loaded=g),a.filecomplete(d,j,k,m)),setTimeout(function(){b.call(e)},0)}}));c.abort=function(a){a||(d.length=0),this.current=a,j.abort()},j.send(h)})}else{var n=200==c.status||201==c.status||204==c.status;a.complete(n?!1:c.statusText||"error",c,a),h=!0}},setTimeout(b,0),c.append=function(a,g){a=ca._getFilesDataArray([].concat(a)),X(a,function(a){f+=a.size,c.files.push(a.file),g?d.unshift(a):d.push(a)}),c.statusText="",h&&b.call(e)},c.remove=function(a){for(var b,c=d.length;c--;)d[c].file==a&&(b=d.splice(c,1),f-=b.size);return b},c},_getFilesDataArray:function(a){var b=[],c={};if(k(a)){var d=ca.getFiles(a);c[a.name||"file"]=null!==a.getAttribute("multiple")?d:d[0]}else W(a)&&k(a[0])?X(a,function(a){c[a.name||"file"]=ca.getFiles(a)}):c=a;return X(c,function e(a,c){W(a)?X(a,function(a){e(a,c)}):a&&(a.name||a.image)&&b.push({name:c,file:a,size:a.size,total:a.size,loaded:0})}),b.length||b.push({file:{name:ca.expando}}),b},_getFormData:function(a,b,c){var d=b.file,e=b.name,f=d.name,g=d.type,h=ca.support.transform&&a.imageTransform,i=new ca.Form,j=ca.queue(function(){c(i)}),k=h&&m(h),l=ca.postNameConcat;X(a.data,function n(a,b){"object"==typeof a?X(a,function(a,c){n(a,l(b,c))}):i.append(b,a)}),function o(b){b.image?(j.inc(),b.toData(function(a,c){b.file&&(c.type=b.file.type,c.quality=b.matrix.quality,f=b.file&&b.file.name),f=f||(new Date).getTime()+".png",o(c),j.next()})):ca.Image&&h&&(/^image/.test(b.type)||K.test(b.nodeName))?(j.inc(),k&&(h=[h]),ca.Image.transform(b,h,a.imageAutoOrientation,function(c,d){if(k&&!c)H||ca.flashEngine||(i.multipart=!0),i.append(e,d[0],f,h[0].type||g);else{var m=0;c||X(d,function(a,b){H||ca.flashEngine||(i.multipart=!0),h[b].postName||(m=1),i.append(h[b].postName||l(e,b),a,f,h[b].type||g)}),(c||a.imageOriginal)&&i.append(l(e,m?"original":null),b,f,g)}j.next()})):f!==ca.expando&&i.append(e,b,f)}(d),j.check()},reset:function(a,b){var c,d;return C?(d=C(a).clone(!0).insertBefore(a).val("")[0],b||C(a).remove()):(c=a.parentNode,d=c.insertBefore(a.cloneNode(!0),a),d.value="",b||c.removeChild(a),X(Q[ca.uid(a)],function(b,c){X(b,function(b){$(a,c,b),Z(d,c,b)})})),d},load:function(a,b){var c=ca.getXHR();return c?(c.open("GET",a,!0),c.overrideMimeType&&c.overrideMimeType("text/plain; charset=x-user-defined"),Z(c,"progress",function(a){a.lengthComputable&&b({type:a.type,loaded:a.loaded,total:a.total},c)}),c.onreadystatechange=function(){if(4==c.readyState)if(c.onreadystatechange=null,200==c.status){a=a.split("/");var d={name:a[a.length-1],size:c.getResponseHeader("Content-Length"),type:c.getResponseHeader("Content-Type")};d.dataURL="data:"+d.type+";base64,"+ca.encode64(c.responseBody||c.responseText),b({type:"load",result:d},c)}else b({type:"error"},c)},c.send(null)):b({type:"error"}),c},encode64:function(a){var b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",c="",d=0;for("string"!=typeof a&&(a=String(a));d<a.length;){var e,f,g=255&a.charCodeAt(d++),h=255&a.charCodeAt(d++),i=255&a.charCodeAt(d++),j=g>>2,k=(3&g)<<4|h>>4;isNaN(h)?e=f=64:(e=(15&h)<<2|i>>6,f=isNaN(i)?64:63&i),c+=b.charAt(j)+b.charAt(k)+b.charAt(e)+b.charAt(f)}return c}};ca.addInfoReader(/^image/,function(a,b){if(!a.__dimensions){var c=a.__dimensions=ca.defer();ca.readAsImage(a,function(a){var b=a.target;c.resolve("load"==a.type?!1:"error",{width:b.width,height:b.height}),b.src=ca.EMPTY_PNG,b=null})}a.__dimensions.then(b)}),ca.event.dnd=function(a,b,c){var d,e;c||(c=b,b=ca.F),z?(Z(a,"dragenter dragleave dragover",b.ff=b.ff||function(a){for(var c=l(a).types,f=c&&c.length,g=!1;f--;)if(~c[f].indexOf("File")){a[V](),e!==a.type&&(e=a.type,"dragleave"!=e&&b.call(a[U],!0,a),g=!0);break}g&&(clearTimeout(d),d=setTimeout(function(){b.call(a[U],"dragleave"!=e,a)},50))}),Z(a,"drop",c.ff=c.ff||function(a){a[V](),e=0,b.call(a[U],!1,a),ca.getDropFiles(a,function(b,d){c.call(a[U],b,d,a)})})):ca.log("Drag'n'Drop -- not supported")},ca.event.dnd.off=function(a,b,c){$(a,"dragenter dragleave dragover",b.ff),$(a,"drop",c.ff)},C&&!C.fn.dnd&&(C.fn.dnd=function(a,b){return this.each(function(){ca.event.dnd(this,a,b)})},C.fn.offdnd=function(a,b){return this.each(function(){ca.event.dnd.off(this,a,b)})}),a.FileAPI=Y(ca,a.FileAPI),ca.log("FileAPI: "+ca.version),ca.log("protocol: "+a.location.protocol),ca.log("doctype: ["+s.name+"] "+s.publicId+" "+s.systemId),X(r.getElementsByTagName("meta"),function(a){/x-ua-compatible/i.test(a.getAttribute("http-equiv"))&&ca.log("meta.http-equiv: "+a.getAttribute("content"))});try{n=!!console.log,o=!!console.log.apply}catch(da){}ca.flashUrl||(ca.flashUrl=ca.staticPath+"FileAPI.flash.swf"),ca.flashImageUrl||(ca.flashImageUrl=ca.staticPath+"FileAPI.flash.image.swf"),ca.flashWebcamUrl||(ca.flashWebcamUrl=ca.staticPath+"FileAPI.flash.camera.swf")}(window,void 0),function(a,b,c){"use strict";function d(b){if(b instanceof d){var c=new d(b.file);return a.extend(c.matrix,b.matrix),c}return this instanceof d?(this.file=b,this.size=b.size||100,void(this.matrix={sx:0,sy:0,sw:0,sh:0,dx:0,dy:0,dw:0,dh:0,resize:0,deg:0,quality:1,filter:0})):new d(b)}var e=Math.min,f=Math.round,g=function(){return b.createElement("canvas")},h=!1,i={8:270,3:180,6:90,7:270,4:180,5:90};try{h=g().toDataURL("image/png").indexOf("data:image/png")>-1}catch(j){}d.prototype={image:!0,constructor:d,set:function(b){return a.extend(this.matrix,b),this},crop:function(a,b,d,e){return d===c&&(d=a,e=b,a=b=0),this.set({sx:a,sy:b,sw:d,sh:e||d})},resize:function(a,b,c){return/min|max|height|width/.test(b)&&(c=b,b=a),this.set({dw:a,dh:b||a,resize:c})},preview:function(a,b){return this.resize(a,b||a,"preview")},rotate:function(a){return this.set({deg:a})},filter:function(a){return this.set({filter:a})},overlay:function(a){return this.set({overlay:a})},clone:function(){return new d(this)},_load:function(b,c){var d=this;/img|video/i.test(b.nodeName)?c.call(d,null,b):a.readAsImage(b,function(a){c.call(d,"load"!=a.type,a.result)})},_apply:function(b,c){var f,h=g(),i=this.getMatrix(b),j=h.getContext("2d"),k=b.videoWidth||b.width,l=b.videoHeight||b.height,m=i.deg,n=i.dw,o=i.dh,p=k,q=l,r=i.filter,s=b,t=i.overlay,u=a.queue(function(){b.src=a.EMPTY_PNG,c(!1,h)}),v=a.renderImageToCanvas;for(m-=360*Math.floor(m/360),b._type=this.file.type;i.multipass&&e(p/n,q/o)>2;)p=p/2+.5|0,q=q/2+.5|0,f=g(),f.width=p,f.height=q,s!==b?(v(f,s,0,0,s.width,s.height,0,0,p,q),s=f):(s=f,v(s,b,i.sx,i.sy,i.sw,i.sh,0,0,p,q),i.sx=i.sy=i.sw=i.sh=0);h.width=m%180?o:n,h.height=m%180?n:o,h.type=i.type,h.quality=i.quality,j.rotate(m*Math.PI/180),v(j.canvas,s,i.sx,i.sy,i.sw||s.width,i.sh||s.height,180==m||270==m?-n:0,90==m||180==m?-o:0,n,o),n=h.width,o=h.height,t&&a.each([].concat(t),function(b){u.inc();var c=new window.Image,d=function(){var e=0|b.x,f=0|b.y,g=b.w||c.width,h=b.h||c.height,i=b.rel;e=1==i||4==i||7==i?(n-g+e)/2:2==i||5==i||8==i?n-(g+e):e,f=3==i||4==i||5==i?(o-h+f)/2:i>=6?o-(h+f):f,a.event.off(c,"error load abort",d);try{j.globalAlpha=b.opacity||1,j.drawImage(c,e,f,g,h)}catch(k){}u.next()};a.event.on(c,"error load abort",d),c.src=b.src,c.complete&&d()}),r&&(u.inc(),d.applyFilter(h,r,u.next)),u.check()},getMatrix:function(b){var c=a.extend({},this.matrix),d=c.sw=c.sw||b.videoWidth||b.naturalWidth||b.width,g=c.sh=c.sh||b.videoHeight||b.naturalHeight||b.height,h=c.dw=c.dw||d,i=c.dh=c.dh||g,j=d/g,k=h/i,l=c.resize;if("preview"==l){if(h!=d||i!=g){var m,n;k>=j?(m=d,n=m/k):(n=g,m=n*k),(m!=d||n!=g)&&(c.sx=~~((d-m)/2),c.sy=~~((g-n)/2),d=m,g=n)}}else"height"==l?h=i*j:"width"==l?i=h/j:l&&(d>h||g>i?"min"==l?(h=f(k>j?e(d,h):i*j),i=f(k>j?h/j:e(g,i))):(h=f(j>=k?e(d,h):i*j),i=f(j>=k?h/j:e(g,i))):(h=d,i=g));return c.sw=d,c.sh=g,c.dw=h,c.dh=i,c.multipass=a.multiPassResize,c},_trans:function(b){this._load(this.file,function(c,d){if(c)b(c);else try{this._apply(d,b)}catch(c){a.log("[err] FileAPI.Image.fn._apply:",c),b(c)}})},get:function(b){if(a.support.transform){var c=this,d=c.matrix;"auto"==d.deg?a.getInfo(c.file,function(a,e){d.deg=i[e&&e.exif&&e.exif.Orientation]||0,c._trans(b)}):c._trans(b)}else b("not_support_transform");return this},toData:function(a){return this.get(a)}},d.exifOrientation=i,d.transform=function(b,e,f,g){function h(h,i){var j={},k=a.queue(function(a){g(a,j)});h?k.fail():a.each(e,function(a,e){if(!k.isFail()){var g=new d(i.nodeType?i:b),h="function"==typeof a;if(h?a(i,g):a.width?g[a.preview?"preview":"resize"](a.width,a.height,a.strategy):a.maxWidth&&(i.width>a.maxWidth||i.height>a.maxHeight)&&g.resize(a.maxWidth,a.maxHeight,"max"),a.crop){var l=a.crop;g.crop(0|l.x,0|l.y,l.w||l.width,l.h||l.height)}a.rotate===c&&f&&(a.rotate="auto"),g.set({type:g.matrix.type||a.type||b.type||"image/png"}),h||g.set({deg:a.rotate,overlay:a.overlay,filter:a.filter,quality:a.quality||1}),k.inc(),g.toData(function(a,b){a?k.fail():(j[e]=b,k.next())})}})}b.width?h(!1,b):a.getInfo(b,h)},a.each(["TOP","CENTER","BOTTOM"],function(b,c){a.each(["LEFT","CENTER","RIGHT"],function(a,e){d[b+"_"+a]=3*c+e,d[a+"_"+b]=3*c+e})}),d.toCanvas=function(a){var c=b.createElement("canvas");return c.width=a.videoWidth||a.width,c.height=a.videoHeight||a.height,c.getContext("2d").drawImage(a,0,0),c},d.fromDataURL=function(b,c,d){var e=a.newImage(b);a.extend(e,c),d(e)},d.applyFilter=function(b,c,e){"function"==typeof c?c(b,e):window.Caman&&window.Caman("IMG"==b.tagName?d.toCanvas(b):b,function(){"string"==typeof c?this[c]():a.each(c,function(a,b){this[b](a)},this),this.render(e)})},a.renderImageToCanvas=function(b,c,d,e,f,g,h,i,j,k){try{return b.getContext("2d").drawImage(c,d,e,f,g,h,i,j,k)}catch(l){throw a.log("renderImageToCanvas failed"),l}},a.support.canvas=a.support.transform=h,a.Image=d}(FileAPI,document),function(a){"use strict";a(FileAPI)}(function(a){"use strict";if(window.navigator&&window.navigator.platform&&/iP(hone|od|ad)/.test(window.navigator.platform)){var b=a.renderImageToCanvas;a.detectSubsampling=function(a){var b,c;return a.width*a.height>1048576?(b=document.createElement("canvas"),b.width=b.height=1,c=b.getContext("2d"),c.drawImage(a,-a.width+1,0),0===c.getImageData(0,0,1,1).data[3]):!1},a.detectVerticalSquash=function(a,b){var c,d,e,f,g,h=a.naturalHeight||a.height,i=document.createElement("canvas"),j=i.getContext("2d");for(b&&(h/=2),i.width=1,i.height=h,j.drawImage(a,0,0),c=j.getImageData(0,0,1,h).data,d=0,e=h,f=h;f>d;)g=c[4*(f-1)+3],0===g?e=f:d=f,f=e+d>>1;return f/h||1},a.renderImageToCanvas=function(c,d,e,f,g,h,i,j,k,l){if("image/jpeg"===d._type){var m,n,o,p,q=c.getContext("2d"),r=document.createElement("canvas"),s=1024,t=r.getContext("2d");if(r.width=s,r.height=s,q.save(),m=a.detectSubsampling(d),m&&(e/=2,f/=2,g/=2,h/=2),n=a.detectVerticalSquash(d,m),m||1!==n){for(f*=n,k=Math.ceil(s*k/g),l=Math.ceil(s*l/h/n),j=0,p=0;h>p;){for(i=0,o=0;g>o;)t.clearRect(0,0,s,s),t.drawImage(d,e,f,g,h,-o,-p,g,h),q.drawImage(r,0,0,s,s,i,j,k,l),o+=s,i+=k;p+=s,j+=l}return q.restore(),c}}return b(c,d,e,f,g,h,i,j,k,l)}}}),function(a,b){"use strict";function c(b,c,d){var e=b.blob,f=b.file;if(f){if(!e.toDataURL)return void a.readAsBinaryString(e,function(a){"load"==a.type&&c(b,a.result)});var g={"image/jpeg":".jpe?g","image/png":".png"},h=g[b.type]?b.type:"image/png",i=g[h]||".png",j=e.quality||1;f.match(new RegExp(i+"$","i"))||(f+=i.replace("?","")),b.file=f,b.type=h,!d&&e.toBlob?e.toBlob(function(a){c(b,a)},h,j):c(b,a.toBinaryString(e.toDataURL(h,j)))}else c(b,e)}var d=b.document,e=b.FormData,f=function(){this.items=[]},g=b.encodeURIComponent;f.prototype={append:function(a,b,c,d){this.items.push({name:a,blob:b&&b.blob||(void 0==b?"":b),file:b&&(c||b.name),type:b&&(d||b.type)})},each:function(a){for(var b=0,c=this.items.length;c>b;b++)a.call(this,this.items[b])},toData:function(b,c){c._chunked=a.support.chunked&&c.chunkSize>0&&1==a.filter(this.items,function(a){return a.file}).length,a.support.html5?a.formData&&!this.multipart&&e?c._chunked?(a.log("FileAPI.Form.toPlainData"),this.toPlainData(b)):(a.log("FileAPI.Form.toFormData"),this.toFormData(b)):(a.log("FileAPI.Form.toMultipartData"),this.toMultipartData(b)):(a.log("FileAPI.Form.toHtmlData"),this.toHtmlData(b))},_to:function(b,c,d,e){var f=a.queue(function(){c(b)});this.each(function(g){try{d(g,b,f,e)}catch(h){a.log("FileAPI.Form._to: "+h.message),c(h)}}),f.check()},toHtmlData:function(b){this._to(d.createDocumentFragment(),b,function(b,c){var e,f=b.blob;b.file?(a.reset(f,!0),f.name=b.name,f.disabled=!1,c.appendChild(f)):(e=d.createElement("input"),e.name=b.name,e.type="hidden",e.value=f,c.appendChild(e))})},toPlainData:function(a){this._to({},a,function(a,b,d){a.file&&(b.type=a.file),a.blob.toBlob?(d.inc(),c(a,function(a,c){b.name=a.name,b.file=c,b.size=c.length,b.type=a.type,d.next()})):a.file?(b.name=a.blob.name,b.file=a.blob,b.size=a.blob.size,b.type=a.type):(b.params||(b.params=[]),b.params.push(g(a.name)+"="+g(a.blob))),b.start=-1,b.end=b.file&&b.file.FileAPIReadPosition||-1,b.retry=0})},toFormData:function(a){this._to(new e,a,function(a,b,d){a.blob&&a.blob.toBlob?(d.inc(),c(a,function(a,c){b.append(a.name,c,a.file),d.next()})):a.file?b.append(a.name,a.blob,a.file):b.append(a.name,a.blob),a.file&&b.append("_"+a.name,a.file)})},toMultipartData:function(b){this._to([],b,function(a,b,d,e){d.inc(),c(a,function(a,c){b.push("--_"+e+('\r\nContent-Disposition: form-data; name="'+a.name+'"'+(a.file?'; filename="'+g(a.file)+'"':"")+(a.file?"\r\nContent-Type: "+(a.type||"application/octet-stream"):"")+"\r\n\r\n"+(a.file?c:g(c))+"\r\n")),d.next()},!0)},a.expando)}},a.Form=f}(FileAPI,window),function(a,b){"use strict";var c=function(){},d=a.document,e=function(a){this.uid=b.uid(),this.xhr={abort:c,getResponseHeader:c,getAllResponseHeaders:c},this.options=a},f={"":1,XML:1,Text:1,Body:1};e.prototype={status:0,statusText:"",constructor:e,getResponseHeader:function(a){return this.xhr.getResponseHeader(a)},getAllResponseHeaders:function(){return this.xhr.getAllResponseHeaders()||{}},end:function(d,e){var f=this,g=f.options;f.end=f.abort=c,f.status=d,e&&(f.statusText=e),b.log("xhr.end:",d,e),g.complete(200==d||201==d?!1:f.statusText||"unknown",f),f.xhr&&f.xhr.node&&setTimeout(function(){var b=f.xhr.node;try{b.parentNode.removeChild(b)}catch(c){}try{delete a[f.uid]}catch(c){}a[f.uid]=f.xhr.node=null},9)},abort:function(){this.end(0,"abort"),this.xhr&&(this.xhr.aborted=!0,this.xhr.abort())},send:function(a){var b=this,c=this.options;a.toData(function(a){a instanceof Error?b.end(0,a.message):(c.upload(c,b),b._send.call(b,c,a))},c)},_send:function(c,e){var g,h=this,i=h.uid,j=h.uid+"Load",k=c.url;if(b.log("XHR._send:",e),c.cache||(k+=(~k.indexOf("?")?"&":"?")+b.uid()),e.nodeName){var l=c.jsonp;k=k.replace(/([a-z]+)=(\?)/i,"$1="+i),c.upload(c,h);var m=function(a){if(~k.indexOf(a.origin))try{var c=b.parseJSON(a.data);c.id==i&&n(c.status,c.statusText,c.response)}catch(d){n(0,d.message)}},n=a[i]=function(c,d,e){h.readyState=4,h.responseText=e,h.end(c,d),b.event.off(a,"message",m),a[i]=g=p=a[j]=null};h.xhr.abort=function(){try{p.stop?p.stop():p.contentWindow.stop?p.contentWindow.stop():p.contentWindow.document.execCommand("Stop")}catch(a){}n(0,"abort")},b.event.on(a,"message",m),a[j]=function(){try{var a=p.contentWindow,c=a.document,d=a.result||b.parseJSON(c.body.innerHTML);n(d.status,d.statusText,d.response)}catch(e){b.log("[transport.onload]",e)}},g=d.createElement("div"),g.innerHTML='<form target="'+i+'" action="'+k+'" method="POST" enctype="multipart/form-data" style="position: absolute; top: -1000px; overflow: hidden; width: 1px; height: 1px;"><iframe name="'+i+'" src="javascript:false;" onload="window.'+j+" && "+j+'();"></iframe>'+(l&&c.url.indexOf("=?")<0?'<input value="'+i+'" name="'+l+'" type="hidden"/>':"")+"</form>";var o=g.getElementsByTagName("form")[0],p=g.getElementsByTagName("iframe")[0];o.appendChild(e),b.log(o.parentNode.innerHTML),d.body.appendChild(g),h.xhr.node=g,h.readyState=2;try{o.submit()}catch(q){b.log("iframe.error: "+q)}o=null}else{if(k=k.replace(/([a-z]+)=(\?)&?/i,""),this.xhr&&this.xhr.aborted)return void b.log("Error: already aborted");if(g=h.xhr=b.getXHR(),e.params&&(k+=(k.indexOf("?")<0?"?":"&")+e.params.join("&")),g.open("POST",k,!0),b.withCredentials&&(g.withCredentials="true"),c.headers&&c.headers["X-Requested-With"]||g.setRequestHeader("X-Requested-With","XMLHttpRequest"),b.each(c.headers,function(a,b){g.setRequestHeader(b,a)}),c._chunked){g.upload&&g.upload.addEventListener("progress",b.throttle(function(a){e.retry||c.progress({type:a.type,total:e.size,loaded:e.start+a.loaded,totalSize:e.size},h,c)},100),!1),g.onreadystatechange=function(){var a=parseInt(g.getResponseHeader("X-Last-Known-Byte"),10);if(h.status=g.status,h.statusText=g.statusText,h.readyState=g.readyState,4==g.readyState){for(var d in f)h["response"+d]=g["response"+d];if(g.onreadystatechange=null,!g.status||g.status-201>0)if(b.log("Error: "+g.status),(!g.status&&!g.aborted||500==g.status||416==g.status)&&++e.retry<=c.chunkUploadRetry){var i=g.status?0:b.chunkNetworkDownRetryTimeout;c.pause(e.file,c),b.log("X-Last-Known-Byte: "+a),a?e.end=a:(e.end=e.start-1,416==g.status&&(e.end=e.end-c.chunkSize)),setTimeout(function(){h._send(c,e)},i)}else h.end(g.status);else e.retry=0,e.end==e.size-1?h.end(g.status):(b.log("X-Last-Known-Byte: "+a),a&&(e.end=a),e.file.FileAPIReadPosition=e.end,setTimeout(function(){h._send(c,e)},0));g=null}},e.start=e.end+1,e.end=Math.max(Math.min(e.start+c.chunkSize,e.size)-1,e.start);var r=e.file,s=(r.slice||r.mozSlice||r.webkitSlice).call(r,e.start,e.end+1);e.size&&!s.size?setTimeout(function(){h.end(-1)}):(g.setRequestHeader("Content-Range","bytes "+e.start+"-"+e.end+"/"+e.size),g.setRequestHeader("Content-Disposition","attachment; filename="+encodeURIComponent(e.name)),g.setRequestHeader("Content-Type",e.type||"application/octet-stream"),g.send(s)),r=s=null}else if(g.upload&&g.upload.addEventListener("progress",b.throttle(function(a){c.progress(a,h,c)},100),!1),g.onreadystatechange=function(){if(h.status=g.status,h.statusText=g.statusText,h.readyState=g.readyState,4==g.readyState){for(var a in f)h["response"+a]=g["response"+a];if(g.onreadystatechange=null,!g.status||g.status>201)if(b.log("Error: "+g.status),(!g.status&&!g.aborted||500==g.status)&&(c.retry||0)<c.uploadRetry){c.retry=(c.retry||0)+1;var d=b.networkDownRetryTimeout;c.pause(c.file,c),setTimeout(function(){h._send(c,e)},d)}else h.end(g.status);else h.end(g.status);g=null}},b.isArray(e)){g.setRequestHeader("Content-Type","multipart/form-data; boundary=_"+b.expando);var t=e.join("")+"--_"+b.expando+"--";if(g.sendAsBinary)g.sendAsBinary(t);else{var u=Array.prototype.map.call(t,function(a){return 255&a.charCodeAt(0)});g.send(new Uint8Array(u).buffer)}}else g.send(e)}}},b.XHR=e}(window,FileAPI),function(a,b){"use strict";function c(a){return a>=0?a+"px":a}function d(a){var c,d=f.createElement("canvas"),e=!1;try{c=d.getContext("2d"),c.drawImage(a,0,0,1,1),e=255!=c.getImageData(0,0,1,1).data[4]}catch(g){b.log("[FileAPI.Camera] detectVideoSignal:",g)}return e}var e=a.URL||a.webkitURL,f=a.document,g=a.navigator,h=g.getUserMedia||g.webkitGetUserMedia||g.mozGetUserMedia||g.msGetUserMedia,i=!!h;b.support.media=i;var j=function(a){this.video=a};j.prototype={isActive:function(){return!!this._active},start:function(a){var b,c,f=this,i=f.video,j=function(d){f._active=!d,clearTimeout(c),clearTimeout(b),a&&a(d,f)};h.call(g,{video:!0},function(a){f.stream=a,i.src=e.createObjectURL(a),b=setInterval(function(){d(i)&&j(null)},1e3),c=setTimeout(function(){j("timeout");
	},5e3),i.play()},j)},stop:function(){try{this._active=!1,this.video.pause();try{this.stream.stop()}catch(a){b.each(this.stream.getTracks(),function(a){a.stop()})}this.stream=null}catch(a){b.log("[FileAPI.Camera] stop:",a)}},shot:function(){return new k(this.video)}},j.get=function(a){return new j(a.firstChild)},j.publish=function(d,e,g){"function"==typeof e&&(g=e,e={}),e=b.extend({},{width:"100%",height:"100%",start:!0},e),d.jquery&&(d=d[0]);var h=function(a){if(a)g(a);else{var b=j.get(d);e.start?b.start(g):g(null,b)}};if(d.style.width=c(e.width),d.style.height=c(e.height),b.html5&&i){var k=f.createElement("video");k.style.width=c(e.width),k.style.height=c(e.height),a.jQuery?jQuery(d).empty():d.innerHTML="",d.appendChild(k),h()}else j.fallback(d,e,h)},j.fallback=function(a,b,c){c("not_support_camera")};var k=function(a){var c=a.nodeName?b.Image.toCanvas(a):a,d=b.Image(c);return d.type="image/png",d.width=c.width,d.height=c.height,d.size=c.width*c.height*4,d};j.Shot=k,b.Camera=j}(window,FileAPI),function(a,b,c){"use strict";var d=a.document,e=a.location,f=a.navigator,g=c.each;c.support.flash=function(){var b=f.mimeTypes,d=!1;if(f.plugins&&"object"==typeof f.plugins["Shockwave Flash"])d=f.plugins["Shockwave Flash"].description&&!(b&&b["application/x-shockwave-flash"]&&!b["application/x-shockwave-flash"].enabledPlugin);else try{d=!(!a.ActiveXObject||!new ActiveXObject("ShockwaveFlash.ShockwaveFlash"))}catch(g){c.log("Flash -- does not supported.")}return d&&/^file:/i.test(e)&&c.log("[warn] Flash does not work on `file:` protocol."),d}(),c.support.flash&&(!c.html5||!c.support.html5||c.cors&&!c.support.cors||c.media&&!c.support.media)&&function(){function h(a){return('<object id="#id#" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+(a.width||"100%")+'" height="'+(a.height||"100%")+'"><param name="movie" value="#src#" /><param name="flashvars" value="#flashvars#" /><param name="swliveconnect" value="true" /><param name="allowscriptaccess" value="always" /><param name="allownetworking" value="all" /><param name="menu" value="false" /><param name="wmode" value="#wmode#" /><embed flashvars="#flashvars#" swliveconnect="true" allownetworking="all" allowscriptaccess="always" name="#id#" src="#src#" width="'+(a.width||"100%")+'" height="'+(a.height||"100%")+'" menu="false" wmode="transparent" type="application/x-shockwave-flash"></embed></object>').replace(/#(\w+)#/gi,function(b,c){return a[c]})}function i(a,b){if(a&&a.style){var c,d;for(c in b){d=b[c],"number"==typeof d&&(d+="px");try{a.style[c]=d}catch(e){}}}}function j(a,b){g(b,function(b,c){var d=a[c];a[c]=function(){return this.parent=d,b.apply(this,arguments)}})}function k(a){return a&&!a.flashId}function l(a){var b=a.wid=c.uid();return v._fn[b]=a,"FileAPI.Flash._fn."+b}function m(a){try{v._fn[a.wid]=null,delete v._fn[a.wid]}catch(b){}}function n(a,b){if(!u.test(a)){if(/^\.\//.test(a)||"/"!=a.charAt(0)){var c=e.pathname;c=c.substr(0,c.lastIndexOf("/")),a=(c+"/"+a).replace("/./","/")}"//"!=a.substr(0,2)&&(a="//"+e.host+a),u.test(a)||(a=e.protocol+a)}return b&&(a+=(/\?/.test(a)?"&":"?")+b),a}function o(a,b,e){function f(){try{var a=v.get(j);a.setImage(b)}catch(d){c.log('[err] FlashAPI.Preview.setImage -- can not set "base64":',d)}}var g,j=c.uid(),k=d.createElement("div"),o=10;for(g in a)k.setAttribute(g,a[g]),k[g]=a[g];i(k,a),a.width="100%",a.height="100%",k.innerHTML=h(c.extend({id:j,src:n(c.flashImageUrl,"r="+c.uid()),wmode:"opaque",flashvars:"scale="+a.scale+"&callback="+l(function p(){return m(p),--o>0&&f(),!0})},a)),e(!1,k),k=null}function p(a){return{id:a.id,name:a.name,matrix:a.matrix,flashId:a.flashId}}function q(b){var c=b.getBoundingClientRect(),e=d.body,f=(b&&b.ownerDocument).documentElement;return{top:c.top+(a.pageYOffset||f.scrollTop)-(f.clientTop||e.clientTop||0),left:c.left+(a.pageXOffset||f.scrollLeft)-(f.clientLeft||e.clientLeft||0),width:c.right-c.left,height:c.bottom-c.top}}var r=c.uid(),s=0,t={},u=/^https?:/i,v={_fn:{},init:function(){var a=d.body&&d.body.firstChild;if(a)do if(1==a.nodeType){c.log("FlashAPI.state: awaiting");var b=d.createElement("div");return b.id="_"+r,i(b,{top:1,right:1,width:5,height:5,position:"absolute",zIndex:"2147483647"}),a.parentNode.insertBefore(b,a),void v.publish(b,r)}while(a=a.nextSibling);10>s&&setTimeout(v.init,50*++s)},publish:function(a,b,d){d=d||{},a.innerHTML=h({id:b,src:n(c.flashUrl,"r="+c.version),wmode:d.camera?"":"transparent",flashvars:"callback="+(d.onEvent||"FileAPI.Flash.onEvent")+"&flashId="+b+"&storeKey="+f.userAgent.match(/\d/gi).join("")+"_"+c.version+(v.isReady||(c.pingUrl?"&ping="+c.pingUrl:""))+"&timeout="+c.flashAbortTimeout+(d.camera?"&useCamera="+n(c.flashWebcamUrl):"")+"&debug="+(c.debug?"1":"")},d)},ready:function(){c.log("FlashAPI.state: ready"),v.ready=c.F,v.isReady=!0,v.patch(),v.patchCamera&&v.patchCamera(),c.event.on(d,"mouseover",v.mouseover),c.event.on(d,"click",function(a){v.mouseover(a)&&(a.preventDefault?a.preventDefault():a.returnValue=!0)})},getEl:function(){return d.getElementById("_"+r)},getWrapper:function(a){do if(/js-fileapi-wrapper/.test(a.className))return a;while((a=a.parentNode)&&a!==d.body)},mouseover:function(a){var b=c.event.fix(a).target;if(/input/i.test(b.nodeName)&&"file"==b.type&&!b.disabled){var e=b.getAttribute(r),f=v.getWrapper(b);if(c.multiFlash){if("i"==e||"r"==e)return!1;if("p"!=e){b.setAttribute(r,"i");var g=d.createElement("div");if(!f)return void c.log("[err] FlashAPI.mouseover: js-fileapi-wrapper not found");i(g,{top:0,left:0,width:b.offsetWidth,height:b.offsetHeight,zIndex:"2147483647",position:"absolute"}),f.appendChild(g),v.publish(g,c.uid()),b.setAttribute(r,"p")}return!0}if(f){var h=q(f);i(v.getEl(),h),v.curInp=b}}else/object|embed/i.test(b.nodeName)||i(v.getEl(),{top:1,left:1,width:5,height:5})},onEvent:function(a){var b=a.type;if("ready"==b){try{v.getInput(a.flashId).setAttribute(r,"r")}catch(d){}return v.ready(),setTimeout(function(){v.mouseenter(a)},50),!0}"ping"===b?c.log("(flash -> js).ping:",[a.status,a.savedStatus],a.error):"log"===b?c.log("(flash -> js).log:",a.target):b in v&&setTimeout(function(){c.log("FlashAPI.event."+a.type+":",a),v[b](a)},1)},mouseenter:function(a){var b=v.getInput(a.flashId);if(b){v.cmd(a,"multiple",null!=b.getAttribute("multiple"));var d=[],e={};g((b.getAttribute("accept")||"").split(/,\s*/),function(a){c.accept[a]&&g(c.accept[a].split(" "),function(a){e[a]=1})}),g(e,function(a,b){d.push(b)}),v.cmd(a,"accept",d.length?d.join(",")+","+d.join(",").toUpperCase():"*")}},get:function(b){return d[b]||a[b]||d.embeds[b]},getInput:function(a){if(!c.multiFlash)return v.curInp;try{var b=v.getWrapper(v.get(a));if(b)return b.getElementsByTagName("input")[0]}catch(d){c.log('[err] Can not find "input" by flashId:',a,d)}},select:function(a){var e,f=v.getInput(a.flashId),h=c.uid(f),i=a.target.files;g(i,function(a){c.checkFileObj(a)}),t[h]=i,d.createEvent?(e=d.createEvent("Event"),e.files=i,e.initEvent("change",!0,!0),f.dispatchEvent(e)):b?b(f).trigger({type:"change",files:i}):(e=d.createEventObject(),e.files=i,f.fireEvent("onchange",e))},cmd:function(a,b,d,e){try{return c.log("(js -> flash)."+b+":",d),v.get(a.flashId||a).cmd(b,d)}catch(f){c.log("(js -> flash).onError:",f.toString()),e||setTimeout(function(){v.cmd(a,b,d,!0)},50)}},patch:function(){c.flashEngine=!0,j(c,{getFiles:function(a,b,d){if(d)return c.filterFiles(c.getFiles(a),b,d),null;var e=c.isArray(a)?a:t[c.uid(a.target||a.srcElement||a)];return e?(b&&(b=c.getFilesFilter(b),e=c.filter(e,function(a){return b.test(a.name)})),e):this.parent.apply(this,arguments)},getInfo:function(a,b){if(k(a))this.parent.apply(this,arguments);else if(a.isShot)b(null,a.info={width:a.width,height:a.height});else{if(!a.__info){var d=a.__info=c.defer();v.cmd(a,"getFileInfo",{id:a.id,callback:l(function e(b,c){m(e),d.resolve(b,a.info=c)})})}a.__info.then(b)}}}),c.support.transform=!0,c.Image&&j(c.Image.prototype,{get:function(a,b){return this.set({scaleMode:b||"noScale"}),this.parent(a)},_load:function(a,b){if(c.log("FlashAPI.Image._load:",a),k(a))this.parent.apply(this,arguments);else{var d=this;c.getInfo(a,function(c){b.call(d,c,a)})}},_apply:function(a,b){if(c.log("FlashAPI.Image._apply:",a),k(a))this.parent.apply(this,arguments);else{var d=this.getMatrix(a.info),e=b;v.cmd(a,"imageTransform",{id:a.id,matrix:d,callback:l(function f(g,h){c.log("FlashAPI.Image._apply.callback:",g),m(f),g?e(g):c.support.html5||c.support.dataURI&&!(h.length>3e4)?(d.filter&&(e=function(a,e){a?b(a):c.Image.applyFilter(e,d.filter,function(){b(a,this.canvas)})}),c.newImage("data:"+a.type+";base64,"+h,e)):o({width:d.deg%180?d.dh:d.dw,height:d.deg%180?d.dw:d.dh,scale:d.scaleMode},h,e)})})}},toData:function(a){var b=this.file,d=b.info,e=this.getMatrix(d);c.log("FlashAPI.Image.toData"),k(b)?this.parent.apply(this,arguments):("auto"==e.deg&&(e.deg=c.Image.exifOrientation[d&&d.exif&&d.exif.Orientation]||0),a.call(this,!b.info,{id:b.id,flashId:b.flashId,name:b.name,type:b.type,matrix:e}))}}),c.Image&&j(c.Image,{fromDataURL:function(a,b,d){!c.support.dataURI||a.length>3e4?o(c.extend({scale:"exactFit"},b),a.replace(/^data:[^,]+,/,""),function(a,b){d(b)}):this.parent(a,b,d)}}),j(c.Form.prototype,{toData:function(a){for(var b=this.items,d=b.length;d--;)if(b[d].file&&k(b[d].blob))return this.parent.apply(this,arguments);c.log("FlashAPI.Form.toData"),a(b)}}),j(c.XHR.prototype,{_send:function(a,b){if(b.nodeName||b.append&&c.support.html5||c.isArray(b)&&"string"==typeof b[0])return this.parent.apply(this,arguments);var d,e,f={},h={},i=this;if(g(b,function(a){a.file?(h[a.name]=a=p(a.blob),e=a.id,d=a.flashId):f[a.name]=a.blob}),e||(d=r),!d)return c.log("[err] FlashAPI._send: flashId -- undefined"),this.parent.apply(this,arguments);c.log("FlashAPI.XHR._send: "+d+" -> "+e),i.xhr={headers:{},abort:function(){v.cmd(d,"abort",{id:e})},getResponseHeader:function(a){return this.headers[a]},getAllResponseHeaders:function(){return this.headers}};var j=c.queue(function(){v.cmd(d,"upload",{url:n(a.url.replace(/([a-z]+)=(\?)&?/i,"")),data:f,files:e?h:null,headers:a.headers||{},callback:l(function b(d){var e=d.type,f=d.result;c.log("FlashAPI.upload."+e),"progress"==e?(d.loaded=Math.min(d.loaded,d.total),d.lengthComputable=!0,a.progress(d)):"complete"==e?(m(b),"string"==typeof f&&(i.responseText=f.replace(/%22/g,'"').replace(/%5c/g,"\\").replace(/%26/g,"&").replace(/%25/g,"%")),i.end(d.status||200)):("abort"==e||"error"==e)&&(i.end(d.status||0,d.message),m(b))})})});g(h,function(a){j.inc(),c.getInfo(a,j.next)}),j.check()}})}};c.Flash=v,c.newImage("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",function(a,b){c.support.dataURI=!(1!=b.width||1!=b.height),v.init()})}()}(window,window.jQuery,FileAPI),function(a,b,c){"use strict";var d=c.each,e=[];!c.support.flash||!c.media||c.support.media&&c.html5||!function(){function a(a){var b=a.wid=c.uid();return c.Flash._fn[b]=a,"FileAPI.Flash._fn."+b}function b(a){try{c.Flash._fn[a.wid]=null,delete c.Flash._fn[a.wid]}catch(b){}}var f=c.Flash;c.extend(c.Flash,{patchCamera:function(){c.Camera.fallback=function(d,e,g){var h=c.uid();c.log("FlashAPI.Camera.publish: "+h),f.publish(d,h,c.extend(e,{camera:!0,onEvent:a(function i(a){"camera"===a.type&&(b(i),a.error?(c.log("FlashAPI.Camera.publish.error: "+a.error),g(a.error)):(c.log("FlashAPI.Camera.publish.success: "+h),g(null)))})}))},d(e,function(a){c.Camera.fallback.apply(c.Camera,a)}),e=[],c.extend(c.Camera.prototype,{_id:function(){return this.video.id},start:function(d){var e=this;f.cmd(this._id(),"camera.on",{callback:a(function g(a){b(g),a.error?(c.log("FlashAPI.camera.on.error: "+a.error),d(a.error,e)):(c.log("FlashAPI.camera.on.success: "+e._id()),e._active=!0,d(null,e))})})},stop:function(){this._active=!1,f.cmd(this._id(),"camera.off")},shot:function(){c.log("FlashAPI.Camera.shot:",this._id());var a=c.Flash.cmd(this._id(),"shot",{});return a.type="image/png",a.flashId=this._id(),a.isShot=!0,new c.Camera.Shot(a)}})}}),c.Camera.fallback=function(){e.push(arguments)}}()}(window,window.jQuery,FileAPI),"function"=="function"&&__webpack_require__(12)&&!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function(){return FileAPI}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 12 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ }
/******/ ]);