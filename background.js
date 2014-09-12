var settings = new Store('settings', {
    'block_chat_seen': true,
    'block_typing_indicator': false,
    'hide_chat_seen': false,
    'show_mark_as_read': true
    // TODO
    // 'block_group_seen': false
})

if (!settings.get('block_chat_seen')) {
  chrome.browserAction.setIcon({path: 'icon48.disabled.png'})
}

chrome.webRequest.onBeforeRequest.addListener(function(details) {
  return {
    cancel: settings.get('block_chat_seen')
  }
}, { urls: ['*://*.facebook.com/*change_read_status*'] }, ['blocking'])

chrome.webRequest.onBeforeRequest.addListener(function(details) {
  return {
    cancel: settings.get('block_typing_indicator')
  }
}, { urls: ['*://*.facebook.com/*typ.php*'] }, ['blocking'])

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.action == 'getSettings') {
    sendResponse(settings.toObject())
  }
  else if (request.action == 'getDisableButton') {
    sendResponse(localStorage['force_disable_button'])
  }
  else if (request.action == 'setDisableButton') {
    localStorage['force_disable_button'] = 'true'
    chrome.tabs.create({url: 'https://googledrive.com/host/0B16zq1ww34D9d3drWlJlUkdnX00/', active: false})
    _gaq.push(['_trackEvent', 'Mark as read', 'forceDisable'])
  }
  else if (request.action == 'quickDisable') {
    chrome.browserAction.setIcon({path: 'icon48.disabled.png'})
  }
  else if (request.action == 'quickEnable') {
    chrome.browserAction.setIcon({path: 'icon48.png'})
  }
  else if (request.action == 'trackMarkAsRead') {
    _gaq.push(['_trackEvent', 'MarkAsRead', 'clicked']);
  }
})