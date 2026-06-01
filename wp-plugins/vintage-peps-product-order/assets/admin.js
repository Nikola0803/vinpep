jQuery(function ($) {
  var $sortable = $('#vpo-sortable');
  var $save     = $('#vpo-save');
  var $status   = $('#vpo-status');
  var $notice   = $('#vpo-notice');
  var changed   = false;

  // Initialise jQuery UI Sortable — exclude pinned rows
  $sortable.sortable({
    items:       '.vpo-row:not(.vpo-pinned)',
    handle:      'td:first-child',
    placeholder: 'vpo-placeholder',
    axis:        'y',
    tolerance:   'pointer',
    cursor:      'grabbing',

    // Keep pinned rows at the bottom visually during drag
    sort: function () {
      var $pinned = $sortable.find('.vpo-pinned');
      if ($pinned.length) $sortable.append($pinned);
    },

    update: function () {
      changed = true;
      $status.text('Unsaved changes…').css('color', '#b45309');
      refreshPositions();
    },
  });

  $sortable.disableSelection();

  // Refresh the position numbers shown in column 4
  function refreshPositions () {
    var pos = 1;
    $sortable.find('.vpo-row').each(function () {
      var $td = $(this).find('.vpo-pos');
      if ($(this).hasClass('vpo-pinned')) {
        $td.text('—');
      } else {
        $td.text(pos++);
      }
    });
  }

  // Save button
  $save.on('click', function () {
    if (!changed) {
      showNotice('info', 'No changes to save.');
      return;
    }

    var ids = [];
    $sortable.find('.vpo-row').each(function () {
      ids.push($(this).data('id'));
    });

    $save.prop('disabled', true).text('Saving…');
    $status.text('').css('color', '#888');

    $.post(VPP.ajax_url, {
      action: 'vpp_save_order',
      nonce:  VPP.nonce,
      ids:    ids,
    }, function (res) {
      $save.prop('disabled', false).text('💾 Save Order');
      if (res.success) {
        changed = false;
        $status.text('Saved ✔').css('color', '#16a34a');
        showNotice('success', '✅ ' + res.data.message);
        setTimeout(function () { $status.text(''); }, 4000);
      } else {
        showNotice('error', '❌ Error: ' + (res.data || 'Unknown error'));
        $status.text('Save failed').css('color', '#dc2626');
      }
    }).fail(function () {
      $save.prop('disabled', false).text('💾 Save Order');
      showNotice('error', '❌ AJAX request failed. Please try again.');
      $status.text('Save failed').css('color', '#dc2626');
    });
  });

  // Warn before navigating away with unsaved changes
  window.addEventListener('beforeunload', function (e) {
    if (changed) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  function showNotice (type, msg) {
    var bg    = type === 'success' ? '#f0fdf4' : type === 'error' ? '#fef2f2' : '#eff6ff';
    var border= type === 'success' ? '#bbf7d0' : type === 'error' ? '#fecaca' : '#bfdbfe';
    var color = type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : '#1e40af';
    $notice
      .html(msg)
      .css({ background: bg, border: '1px solid ' + border, color: color,
             padding: '10px 16px', borderRadius: '4px', fontSize: '13px', display: 'block' });
    setTimeout(function () { $notice.fadeOut(400); }, 5000);
  }
});
