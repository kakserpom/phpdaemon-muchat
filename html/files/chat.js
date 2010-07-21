$.chat =
{
 "serverUrl": {
                ws: 'ws://'+document.domain+'/Chat',
                comet  : 'http://'+document.domain+'/WebSocketOverCOMET/?_route=Chat',
                polling : 'http://'+document.domain+'/WebSocketOverCOMET/?_route=Chat'
              },
 "status": null,
 "ws": null,
 "onStatusReady": null,
 "cmdHistory": [],
 "cmdHistoryPointer": null,
 "tags": [],
 "userlist": {},
 "tagsDefault": ["phpdaemon"],
 "username": null,
 "lastRecipients": null,
 "userlistUpdateTimeout": null,
 "sentBytes": 0,
 "recvBytes": 0,
 "sendPacket": function(packet)
 {
  var s = $.toJSON(packet);
  $.chat.sentBytes += s.length;
  try {$.chat.ws.send(s);}
  catch (err) {}
 },
 "setForms": function()
 {
  if ($.chat.username != null)
  {
   $('.yourusername').text($.chat.username);
   $('#inputForm').show();
   $('#loginForm').hide();
  }
  else
  {
   $('#inputForm').hide();
   $('#loginForm').show();
  }
  $('.yourtags').text($.chat.tags.toString());
 },
 "setRecipient": function(username)
 {
  $.chat.lastRecipients = '@'+username;
  var e = $('#inputMessage').val().split(': ',2);
  $('#inputMessage').val($.chat.lastRecipients+': '+(e[1] != null?e[1]:''));
  $('#inputMessage').focus();
 },
 "updatedUserlist": function()
 {
  $('#userlist').html('');
  var found = false;
  for (var k in $.chat.userlist)
  {
   var u = $.chat.userlist[k];
   var title = htmlspecialchars(k);
   var statuses = '';
   for (var j in u)
   {
    if (u[j].statusmsg != null) {statuses += htmlspecialchars(u[j].statusmsg)+' ... ';}
   }
   if (statuses != '') {title += ' - '+statuses;}
   title += ' - Tags: '+u[j].tags;
   $('#userlist').append('<p><a href="#" title="'+title+'" onclick="$.chat.setRecipient('+htmlspecialchars($.toJSON(k))+'); return false">'+htmlspecialchars(k)+'</a></p>');
   found = true;
  }
  if (!found)
  {
   if ($.chat.tags.toString() != '') {$('#userlist').html("<i>No users tagged '"+htmlspecialchars($.chat.tags.toString())+"'.</i>");}
   else {$('#userlist').html("<i>You\'re not listed on any tags.</i>");}
  }
  else
  {
   $('#userlist a').tooltip({ 
     track: true, 
     delay: 0, 
     showURL: false, 
     showBody: " - ", 
     fade: 250 
   });
  }
 },
 "setTags": function(tags)
 {
  $.chat.tags = tags;
  $.chat.sendPacket({
   "cmd": "setTags",
   "tags": tags
  });
 },
 "keepalive": function()
 {
  $.chat.sendPacket({
   "cmd": "keepalive"
  });
 },
 "lastTS": 0,
 "initConnect": function()
 {
  $.chat.connect();
  setInterval(function()
  {
   $.chat.connect();
   $('.sentDataCounter').html(fsize($.chat.sentBytes));
   $('.recvDataCounter').html(fsize($.chat.recvBytes));
  },1000);
 },
 "initInputForm": function()
 {
  $('#inputMessage')
  .keyboard('esc',function (event) {$('#inputMessage').val('');})
  .keyboard('aup, tab',{"preventDefault": true},function (event)
  {
   if ($.chat.cmdHistoryPointer <= 0)
   {
    if ($.chat.cmdHistoryPointer < 0) {$.chat.cmdHistoryPointer = 0;}
    return;
   }
   --$.chat.cmdHistoryPointer;
   $('#inputMessage').val($.chat.cmdHistory[$.chat.cmdHistoryPointer]);
  })
  .keyboard('adown',function (event)
  {
   if ($.chat.cmdHistory.length < $.chat.cmdHistoryPointer) {}
   else if ($.chat.cmdHistory.length == $.chat.cmdHistoryPointer+1)
   {
    $('#inputMessage').val('');
    ++$.chat.cmdHistoryPointer;
    return;
   }
   else
   {
    ++$.chat.cmdHistoryPointer;
    $('#inputMessage').val($.chat.cmdHistory[$.chat.cmdHistoryPointer]);
   }
  });
  $('#inputForm').submit(function()
  {
   setTimeout(function()
   {
    if ($('#inputMessage').val() == '') {return;}
    if ($('#inputMessage').val() == '/')
    {
     if ($.chat.cmdHistory.length > 0) {$('#inputMessage').val($.chat.cmdHistory[$.chat.cmdHistory.length-1]);}
     return;
    }
    var packet = {};
    var o = $('#inputForm').formToArray(true);
    for (var k in o) {packet[o[k].name] = o[k].value;}
    packet.tags = $.chat.tags;
    if (($.chat.cmdHistory.length == 0) || ($.chat.cmdHistory[$.chat.cmdHistory.length-1] != $('#inputMessage').val()))
    {
     $.chat.cmdHistory[$.chat.cmdHistory.length] = $('#inputMessage').val();
    }
    $.chat.cmdHistoryPointer = $.chat.cmdHistory.length;
    $.chat.sendMessage(packet);
    var s = '';
    if ($.chat.lastRecipients != null)
    {
     var e = $('#inputMessage').val().split(': ',2);
     if ((e[0] != null) && (e[0] == $.chat.lastRecipients)) {s = e[0]+': ';}
    }
    $('#inputMessage').val(s);
    $('#inputMessage').focus();
   },5);
   return false;
  });
 },
 "initLoginForm": function()
 {
  $('#inputUsername').keyboard('esc',function (event) {$('#inputUsername').val('');})
  $('#loginForm').submit(function()
  { 
   setTimeout(function()
   {
    $.chat.setUsername($('#inputUsername').val());
   },5);
   return false;
  });
 },
 "addMsg": function(o)
 {
  if (o.color == null) {o.color = 'black';}
  var dateStr = (o.ts != null)?('['+(new Date(o.ts*1000).toTimeString().substring(0,8))+'] '):'';
  if (o.mtype == 'status')
  {
   if (($.chat.userlist[o.from] != null) && ($.chat.userlist[o.from][o.sid] != null))
   {
    $.chat.userlist[o.from][o.sid].statusmsg = o.text;
    $.chat.updatedUserlist();
   }
   var s = '<p style="color: '+htmlspecialchars(o.color)+'">'+dateStr+'* <a href="#" style="color: '+htmlspecialchars(o.color)+'" onclick="$.chat.setRecipient('+htmlspecialchars($.toJSON(o.from))+'); return false">'+htmlspecialchars(o.from)+'</a> '+htmlspecialchars(o.text)+'</p>';
  }
  else if (o.mtype == 'astatus')
  {
   var s = '<p style="color: '+htmlspecialchars(o.color)+'">'+dateStr+'* <a href="#" style="color: '+htmlspecialchars(o.color)+'" onclick="$.chat.setRecipient('+htmlspecialchars($.toJSON(o.from))+'); return false">'+htmlspecialchars(o.from)+'</a> '+htmlspecialchars(o.text)+'</p>';
  }
  else if (o.mtype == 'system')
  {
   var s = '<p style="color: '+htmlspecialchars(o.color)+'">'+dateStr+' '+htmlspecialchars(o.text)+'</p>';
  }
  else
  {
   var style = 'color: '+htmlspecialchars(o.color)+';';
   if ((o.to != null) && (o.to.indexOf($.chat.username) != -1)) {style += ' font-weight: bold;';}
   var s = '<p style="'+style+'">'+dateStr+'<a href="#" style="color: '+htmlspecialchars(o.color)+'" onclick="$.chat.setRecipient('+htmlspecialchars($.toJSON(o.from))+'); return false">&lt;'+htmlspecialchars(o.from)+'&gt;</a>: '+htmlspecialchars(o.text)+'</p>';
  }
  $('#messages').append(s);
  $('#messages').scrollTo('100%',{"axis": "y"});
 },
 "sendMessage": function(o)
 {
  o.cmd = "sendMessage";
  $.chat.sendPacket(o);
 },
 "getHistory": function()
 {
  $.chat.sendPacket({
   "cmd": "getHistory",
   "tags": $.chat.tags,
   "lastTS": $.chat.lastTS
  });
 },
 "getUserlist": function()
 {
  if ($.chat.userlistUpdateTimeout != null)
  {
   clearTimeout($.chat.userlistUpdateTimeout);
  }
  $.chat.sendPacket({
   "cmd": "getUserlist",
   "tags": $.chat.tags
  });
  $.chat.userlistUpdateTimeout = setTimeout($.chat.getUserlist,25000);
 },
 "setUsername": function(username)
 {
  $.chat.sendPacket({
   "cmd": "setUsername",
   "username": username
  });
 },
 "connect": function()
 {
  if ($.chat.ws != null)
  {
   if ($.chat.ws.readyState != 2) {return;}
   else
   {
    $.chat.addMsg({"text": "* Trying to reconnect...", "color": "gray", "mtype": "system"});
   }
  }
  $.chat.addMsg({"text": "* Connecting...", "color": "gray", "mtype": "system"});
  //$.chat.ws = new WebSocket($.chat.serverUrl.ws);
  $.chat.ws = new WebSocketConnection({url: $.chat.serverUrl,root:'files/'});
  $.chat.ws.onopen = function()
  {
   $.chat.addMsg({"text": "* Connected.", "color": "gray", "mtype": "system"});
   if ($.chat.username != null) {$.chat.setUsername($.chat.username);}
   $.chat.setTags($.chat.tagsDefault);
   $.chat.getHistory();
   $.chat.getUserlist();
   setInterval(function()
   {
    $.chat.keepalive();
   },20000);
  };
  $.chat.ws.onmessage = function(e)
  {
   if (e.data == null) {return;}
   $.chat.recvBytes += e.data.length;
   var o = $.parseJSON($.urldecode(e.data));
   if (o.type == 'msg')
   {
    if (o.ts) {$.chat.lastTS = o.ts;}
    $.chat.addMsg(o);
   }
   else if (o.type == 'tags')
   {
    $.chat.tags = o.tags;
    $('.yourtags').text($.chat.tags.toString());
    $.chat.getUserlist();
   }
   else if (o.type == 'userlist')
   {
    var newlist = {};
    for (var k in o.userlist)
    {
     var u = o.userlist[k].username;
     if (newlist[u] == null) {newlist[u] = {};}
     newlist[u][o.userlist[k].id] = o.userlist[k];
    };
    $.chat.userlist = newlist;
    $.chat.updatedUserlist();
   }
   else if (o.type == 'cstatus')
   {
    $.chat.username = o.username;
    $.chat.setForms();
   }
   else if (o.type == 'joinsUser')
   {
    if (o.history == true) {return;}
    if ($.chat.userlist[o.username] == null) {$.chat.userlist[o.username] = {};}
    $.chat.userlist[o.username][o.sid] = {"username": o.username, "sid": o.sid, "tags": o.tags, "statusmsg": o.statusmsg};
    $.chat.updatedUserlist();
   }
   else if (o.type == 'partsUser')
   {
    if (o.history == true) {return;}
    if ($.chat.userlist[o.username] == null) {return;}
    if ($.chat.userlist[o.username][o.sid] == null) {return;}
    delete $.chat.userlist[o.username][o.sid];
    var found = false;
    for (var k in $.chat.userlist[o.username])
    {
     found = true;
     break;
    }
    if (!found) {delete $.chat.userlist[o.username];}
    $.chat.updatedUserlist();
   }
   else if (o.type == 'changedUsername')
   {
    if (o.history == true) {return;}
    if ($.chat.userlist[o.old] == null) {return;}
    if ($.chat.userlist[o.old][o.sid] == null) {return;}
    var n = o['new'];
    if ($.chat.userlist[n] == null) {$.chat.userlist[n] = {};}
    $.chat.userlist[n][o.sid] = $.chat.userlist[o.old][o.sid];
    $.chat.userlist[n][o.sid].username = n;
    delete $.chat.userlist[o.old][o.sid];
    var found = false;
    for (var k in $.chat.userlist[o.old])
    {
     found = true;
     break;
    }
    if (!found) {delete $.chat.userlist[o.old];}
    $.chat.updatedUserlist();
   }
  };
  $.chat.ws.onclose = function()
  {
   $.chat.addMsg({"text": "* Oops! Disconnected from server.", "color": "gray", "mtype": "system"});
  };
 }
};
$.urlencode = function(s)
{
 if (typeof encodeURIComponent != 'undefined') {return encodeURIComponent(s).replace(new RegExp('\\+','g'), '%20');}
 return escape(s).replace(new RegExp('\\+','g'), '%20');
};
$.urldecode = function(s)
{
 return unescape(s).replace(new RegExp('\\+','g'),' ');
};
if (typeof WebSocket != 'undefined') {WebSocket.__swfLocation = "/files/websocket/WebSocketMain.swf";}
$(document).ready(function()
{
 var tabs,
 tabsSelector = '#nav ul:first li:all a:all',
 defaultClass = 'ui-state-default',
 activeClass = 'ui-state-active';
 $.address.init(function(event) {
                // Init flicker fix
                $(tabsSelector).removeClass(activeClass)
                   .addClass(defaultClass);
                   var c = $('a[rel=address:' + $.address.path + ']');
                if (typeof (c[0]) != 'undefined') {
                 $(c[0]).removeClass(defaultClass).addClass(activeClass);
                }
               
            }).change(function(event) {
                var selection = $('a[rel=address:' + event.path + ']');
                $(tabsSelector).removeClass(activeClass).addClass(defaultClass);
                selection.removeClass(defaultClass).addClass(activeClass);
                $.address.title($.address.title().split(' | ')[0] + ' | ' + selection.text());
                if (event.path === '/') {event.path = '/index';}
                $('#content').load('pages'+event.path+'.html',null,function (responseText, textStatus, XMLHttpRequest)
                {
                 if (textStatus == 'error')
                 {
                  $('#content').html('Oops! Error occured. Check your connection.');
                 }
                });
            });
});
function htmlspecialchars(s)
{
 if (s == null) {return 'null';}
 var r = s;
 r = r.replace(new RegExp('&','g'),'&amp;');
 r = r.replace(new RegExp('"','g'),'&quot;');
 r = r.replace(new RegExp('\'','g'),'&#039;');
 r = r.replace(new RegExp('<','g'),'&lt;');
 r = r.replace(new RegExp('>','g'),'&gt;');
 return r;
}
function oldhtmlspecialchars(string)
{
 if (string == null) {return "";}
 return $('<span>').text(string).html();
}
function fsize(x)
{
 if (x >= 1024*1024*1024) {return (Math.floor(x/1024/1024/1024*100)/100)+' Gb';}
 if (x >= 1024*1024) {return (Math.floor(x/1024/1024*100)/100)+' Mb';}
 if (x >= 1024) {return (Math.floor(x/1024*100)/100)+' Kb';}
 return (x)+' B';
}
function Dump(d, l, t) {
 if (typeof(t) == "undefined") t = "\n";
 var space = (t == "\n")?' ':'&nbsp;';

    if (l == null) l = 1;
    var s = '';

    if (typeof(d) == "object") {
        s += typeof(d) + space+"{"+t;
        for (var k in d) {
            if (typeof(d[k]) != "function"){
             for (var i=0; i<l; i++) s += space+space;
             s += k+":"+space + Dump(d[k],l+1, t);
            }
        }
        for (var i=0; i<l-1; i++) s += space+space;
        s += "}"+t;
    } else if (typeof(d) != "function"){
        s += "" + d + t;
    }
    return s;
}
