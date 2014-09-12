document.addEventListener('DOMContentLoaded', function() {
    var settings = new Store('settings', {
      'show_mark_as_read': true,
      'block_chat_seen': true,
      'block_typing_indicator': false
      // TODO
      // 'block_group_seen': false
    })
    if (settings.get('block_chat_seen')) {
      chrome.browserAction.setIcon({path: 'icon48.disabled.png'})
      settings.set('block_chat_seen', false)
      var text = document.createTextNode('Facebook unseen disabled. All your friends will now see if you read their messages.')
    } else {
      chrome.browserAction.setIcon({path: 'icon48.png'})
      settings.set('block_chat_seen', true)
      var text = document.createTextNode('Facebook enabled. Your friends will not be notified when you read their messages.')
    }
    $('#message').html(text);
})
