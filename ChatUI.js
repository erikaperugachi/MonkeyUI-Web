require('./bower_components/font-awesome/css/font-awesome.min.css');
require('./bower_components/fileapi//dist/FileAPI.min.js');


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