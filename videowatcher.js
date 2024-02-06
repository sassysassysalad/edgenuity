// ==UserScript==
// @name         Edgenuity Video Watcher
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Automates watching videos
// @author       Subatomicmc
// @match        *://*.core.learn.edgenuity.com/*
// @match        https://*.core.learn.edgenuity.com/Player/
// @grant        none
// ==/UserScript==

(function() {
    var playInterval;
    function playVideo(){
        var playButton = window.frames[0].document.getElementById("uid1_play");
        if(playButton != undefined){
             setTimeout(function(){if(playButton.className == "play"){playButton.children[0].click();}},1000);
        }
    }
    'use strict';
    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }
    var realm = JSON.parse(readCookie("TokenData")).Realm.toString();
    var loc = document.location.href;
    var temp = loc.indexOf("enrollment") + 11;
    var enrollment = loc.substr(temp,36);
    var url = '//r' + (realm.length == 1?"0":"") + realm + ".core.learn.edgenuity.com/lmsapi/sle/api/enrollments/"+ enrollment +"/activity/";
    var elements = [];
    var acceptedNames = ["Instruction","Warm-Up","Summary","Direct Instruction"];
    //var acceptedNames = ["Assignment"];
    var timeline;
    var currentAssignment = 0;
    var openedWindow;
    var minYpos = 0;
    var scrolled = true;
    var theInterval;
    var allUndoneVideos = [];
    var windowInterval;
    function waitForWindowClose(){
        if(openedWindow.closed){
            theInterval = setInterval(nextAssignment,10);
            clearInterval(windowInterval);
        }
    }
    function nextAssignment(){
        console.log("called");
        if(scrolled){
            elements = timeline.getElementsByClassName("ActivityTile");
            console.log("getting new list", minYpos);
            scrolled = false;
        }
        if(elements.length == 0 || currentAssignment+1 > elements.length){
            elements = [];
            currentAssignment = 0;
            scrolled = true;
            elements = timeline.getElementsByClassName("ActivityTile");
            minYpos = elements[elements.length-1].parentElement.offsetTop;
            timeline.scroll(0,minYpos);
            clearInterval(theInterval);
            theInterval = setInterval(nextAssignment,200);
            return;
        }
        else{
            clearInterval(theInterval);
            theInterval = setInterval(nextAssignment,10);
        }
        //quick fix idk whats really wrong
        if(elements[currentAssignment].parentElement == null){
            currentAssignment = 0;
            elements = [];
            scrolled = true;
        }
        if(elements[currentAssignment].parentElement.offsetTop > minYpos && !(elements[currentAssignment].classList.contains("ActivityTile-status-completed")) && acceptedNames.includes(elements[currentAssignment].getElementsByTagName("SPAN")[0].innerText)){
            console.log(elements[currentAssignment]);
            clearInterval(theInterval);
            allUndoneVideos.push(elements[currentAssignment]);
            console.log("NEW COUNT:",allUndoneVideos.length);
            openedWindow = window.open(url + elements[currentAssignment].id, '_blank');
            windowInterval = setInterval(waitForWindowClose,200);
        }
        currentAssignment++;
    }
    function waitForTimeline(){
        if(document.getElementsByClassName("course-timeline").length == 0){
            setTimeout(waitForTimeline,100);
            console.log("cant find timeline. waiting");
            return;
        }
        timeline = document.getElementsByClassName("course-timeline")[0].children[0];
        timeline.scroll(0,0)
        theInterval = setInterval(nextAssignment,500);
    }
    var regex = new RegExp("https://student.edgenuity.com/.*");
    if(regex.test(document.location.href)){
        waitForTimeline();
    }
    else{
        document.getElementsByClassName("goRight")[0].remove();
        var button = document.createElement("button");
        button.classList.add("goRight");
        button.classList.add("footnav");
        button.setAttribute("onclick","if(!document.getElementById('stageFrame').contentWindow.API.FrameChain.framesStatus.includes('incomplete')){window.close()}");
        document.body.appendChild(button);
        console.log("starting interval");
        setInterval(playVideo,1000);
    }
})();
