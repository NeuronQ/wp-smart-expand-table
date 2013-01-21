(function ($) {

	$.fn.smartExpandTable = function(options) {

		this.addClass('smartx-table');

		// TODO: replace this ugly module pattern way of doing things

		var smart_table = (function () {

			var more_separator = '<span class="smartx-table-more"> ... </span>';
			var toggle_btn_html = '<a class="btn smartx-table-toggle-btn">' +
				'<i class="icon-resize-full smartx-table-expand-btn"></i>' +
				'<i class="icon-resize-small smartx-table-collapse-btn"></i></a>';

			var first_init = true;

			var self = {
				/*
				 * Call this to either init "smart" tables or to enable the smart features for newly created table rows if you
				 * loaded new data via AJAX (the function is smart enough to only "smartify" newly loaded rows)
				 */
				init: function (options) {

					// TODO: figure out why options.only_expand_expandable doesn't work

//					console.log('initing');

					$('table.smartx-table').each(function (index) {
						smartify_table($(this));
					});

					first_init = false;

					function smartify_table($table) {

						var id = $table.attr('id');

						// self.columns[id] is used to store table specific data, but remember that all tables must have
						// *unique ids*, otherwise things will break

						if (!self.columns[id]) {

							var columns = {
								names: {},
								hidden: {},
								maxlen: {},
								keep: {},
								count: 0,
								visible_count: 0,
								row_toolbar_html: ''
							};

							// for each smartx-table table column process special column options
							$table.find('> thead > tr:last-child > th').each(function (index) {
								var $this = $(this);
								columns.count++;
								columns.names[index] = $this.text().trim();
								if ($this.attr('data-smartx-table-keep-when-active')) {
									columns.keep[index] = true;
								}
								if ($this.attr('data-smartx-table-hidden')) {
									$this.addClass('smartx-table-column-hidden');
									columns.hidden[index] = true;
								} else {
									columns.visible_count++;
									var maxlen = $this.attr('data-smartx-table-maxlen');
									if (maxlen) columns.maxlen[index] = maxlen;
								}
							});

							var row_toolbar_html = null;
							var $row_toolbar = $('.smartx-table-row-toolbar[data-smartx-table-id="' + id + '"]')
								.detach();
							row_toolbar_html = get_html($row_toolbar);
							columns.row_toolbar_html = row_toolbar_html;

							self.columns[id] = columns;
						} else {
							var columns = self.columns[id];
							var row_toolbar_html = columns.row_toolbar_html;
						}

						// attach "expand all" and "collapse all" actions to appropriate links
						if (first_init) {
							var trs_to_expand_selector = '#' + id + ' > tbody > tr.smartx-table-tr-initialized';
							if (options && options.only_expand_expandable)
								trs_to_expand_selector += '.smartx-table-tr-expandable';
							$('a[data-expand-smartx-table-id="' + id + '"]').each(function (index) {
								$(this).on('click.smart_table', function (event) {
									$(trs_to_expand_selector).each(function (index) {
										if (!$(this).hasClass('smartx-table-tr-active')) activate($(this));
									});
									return false;
								});
							});

							$('a[data-collapse-smartx-table-id="' + id + '"]').each(function (index) {
								$(this).on('click.smart_table', function (event) {
									$('#' + id + ' > tbody > tr.smartx-table-tr-active').each(function (index) {
										if (!$(this).hasClass('smartx-table-tr-active-hidden')) deactivate($(this));
									});
									return false;
								});
							});
						}

						// go through each table row and "smartify" the ones that are not yet smartified
						$table.find('> tbody > tr').each(function (index) {

							var $this = $(this);

							if ($this.hasClass('smartx-table-tr-initialized')) return;
							$this.addClass('smartx-table-tr-initialized');

							if ($this.next().hasClass('smartx-table-tr-active')) {
								var class_val = $this.next().attr('class');
								$this.next().remove();
								$this.after(make_active_tr($this));
								$this.after().attr('class', class_val);
							}

							var expandable = false;
							var expand = !$this.hasClass('smartx-table-tr-not-expandable');
							var row_toolbar_url = $this.attr('data-row-toolbar-url');

							if (row_toolbar_url) row_toolbar_url = row_toolbar_url.split('...');
							else row_toolbar_url = ['', ''];

							var this_row_toolbar_html = row_toolbar_html.replace(/href=["'](.*)["']/g, function (match, url) {
								url = url.replace(/{(\d+)}/g, function(match, number) {
									return (typeof row_toolbar_url[number] != 'undefined') ? row_toolbar_url[number] : match;
								});
								return 'href="' + url + '"';
							});

							var $last_visible_td_inner;

							$this.children('td').each(function (index) {
								var $this = $(this);
								var wrapper = $this.children('.smartx-table-td-inner-wrapper');
								if (wrapper.length) $this = wrapper;
								else wrapper = false;

								if (columns.hidden[index]) {
									$this.addClass('smartx-table-column-hidden');
									expandable = true;
								} else {
									var maxlen = columns.maxlen[index];
									if (maxlen) {
										// if there is a row toolbar, remove it but keep its html
										// to reattach it in the right place later on
										var $toolbar = $this.children('.smartx-table-row-toolbar');
										var toolbar_html = get_html($toolbar);
										$toolbar.remove();

										var text = $this.text().trim();
										var this_html = $this.html();
										if (text.length > maxlen) {
											this_html = '<span class="smartx-table-teaser">' + text.slice(0, maxlen) +'</span>' +
												more_separator + '<span class="smartx-table-rest">' + text.slice(maxlen) +
												'</span>';
											expandable = true;
										}

										// put back row toolbar if any
										if (toolbar_html) this_html += toolbar_html;

										$this.html(this_html);
									}
								}
								// attach the corresponding row toolbars (if any)
								if (index == columns.visible_count - 1) {
									if (!wrapper) {
										$this.html('<div class="smartx-table-td-inner-wrapper">' + $this.html() + '</div>');
										$last_visible_td_inner = $this.children();
										if (row_toolbar_html) $this.children().append(this_row_toolbar_html);
									} else {
										$last_visible_td_inner = $this;
									}
								}
								// attach an expand/collapse button
								if ((index == columns.count - 1 || $this.is(':last-child')) && expandable && expand) {
									if (!$last_visible_td_inner) debugger; // DEBUG
									$last_visible_td_inner.append(toggle_btn_html);
									$last_visible_td_inner.children(':last-child').on('click.smart_table', on_toggle_row_click);
								}
							});

							if (expandable && expand) {
								$this
									.addClass('smartx-table-tr-expandable')
									.on('click.smart_table', on_row_click);
							}
						});

						function on_row_click(event) {
							if (event.target.tagName == 'A') return;
							toggle_row($(this));
						}

						function on_toggle_row_click(event) {
							toggle_row($(this).parent().parent().parent());
							event.stopPropagation();
						}

						function toggle_row($row) {
							if ($row.hasClass('smartx-table-tr-active')) {
								deactivate($row);
							} else {
								activate($row);
								if (options && options.only_one_active_row) {
									$row.siblings('.smartx-table-tr-active').each(function (index) {
										if (!$(this).hasClass('smartx-table-tr-active-hidden'))
											deactivate($(this));
									});
								}
							}
						}

						function activate($tr) {

							var $prev = $tr.prev();
							var $next = $tr.next();

							if (!$next.hasClass('smartx-table-tr-active')) {
								$tr.after(make_active_tr($tr));
								$tr.next()
									.on('click.smart_table', on_row_click)
									.find('.smartx-table-toggle-btn')
										.on('click.smart_table', on_toggle_row_click);
							} else {
								$next.removeClass('smartx-table-tr-active-hidden');
								$next = $next.next();
							}

							$tr.addClass('smartx-table-tr-hidden');

							// provide an easy way to style the rows surrounding the active one and add spacer TRs
							if (!$prev.hasClass('smartx-table-tr-spacer')) {
								if (!$prev.hasClass('smartx-table-tr-active'))
									$prev.addClass('smartx-table-tr-before-active');
								else
									$prev.prev().addClass('smartx-table-tr-before-active');
								$tr.before('<tr class="smartx-table-tr-spacer smartx-table-tr-spacer-before">' +
		                                    '<td colspan="' + columns.visible_count + '">');
							}
							if (!$next.hasClass('smartx-table-tr-spacer')) {
								$next.addClass('smartx-table-tr-after-active');
								$next.before('<tr class="smartx-table-tr-spacer smartx-table-tr-spacer-after">' +
		                                        '<td colspan="' + columns.visible_count + '">');
							}
						} /// activate($tr)

						function deactivate($tr) {

							var $prev = $tr.prev();
							var $next = $tr.next();

							$tr.addClass('smartx-table-tr-active-hidden');
							$prev.removeClass('smartx-table-tr-hidden');

							var $pprev = $prev.prev();
							var $ppprev = $pprev.prev();

							// remove spacer TRs
							// (remove the ifs for only one active row mode)
							if (!$ppprev.hasClass('smartx-table-tr-active') ||
								$ppprev.hasClass('smartx-table-tr-active-hidden')) {

								$pprev.remove();
							}
							if (!$next.next().hasClass('smartx-table-tr-hidden')) {
								$next.remove();
							}

							// provide an easy way to style the rows surrounding the active one
							$prev.removeClass('smartx-table-tr-before-active smartx-table-tr-after-active');
							$ppprev.removeClass('smartx-table-tr-before-active');
							$ppprev.prev().removeClass('smartx-table-tr-before-active');
							$tr.next().removeClass('smartx-table-tr-after-active');
						} /// deactivate($tr)

						function make_active_tr($tr) {

							var $tds = $tr.children('td');
							var active_tr = '';
							var active_fields = '';
							var left_cols_count = columns.visible_count;
							var expandable = false;
							var class_attr = $tr.attr('class');
							var this_row_toolbar_html = row_toolbar_html;

							$tds.each(function (index) {

								// TODO: take into account cell with inner wrapper and row toolbar
								if (columns.hidden[index] ||
									(columns.maxlen[index] && this.innerHTML.trim().length > columns.maxlen[index])) {

									expandable = true;
								}

								if (columns.keep[index]) {
									active_tr += '<td>' + this.innerHTML + '</td>';
									left_cols_count--;
								}
								else {
									var $this_clone = $(this).clone();
									var $toolbar = $this_clone.find('.smartx-table-row-toolbar');
									if ($toolbar.length) this_row_toolbar_html = get_html($toolbar);
									$toolbar.remove();
									$this_clone.find('.smartx-table-toggle-btn').remove();
									active_fields += '<tr><th>' + columns.names[index] + '</th>' +
														'<td>' + $this_clone.html() + '</td></tr>';
								}
							});

							return '<tr class="smartx-table-tr-active ' + class_attr + '">' + active_tr +
									'<td colspan="' + left_cols_count + '">' +
									'<div class="smartx-table-td-inner-wrapper">' +
									'<table class="smartx-table-fields">' + active_fields + '</table>' +
									this_row_toolbar_html + (expandable ? toggle_btn_html : '') + '</div></td></tr>';
						} /// make_active($tr)

					} /// smartify_table($table)

				}, /// self.init(options)
				columns: {}
			}; /// self

			function get_html($jqel) {
				if (!$jqel.length) return '';

				var wrap = document.createElement('div');
				wrap.appendChild($jqel[0].cloneNode(true));

				return wrap.innerHTML;
			}

			return self;

		})();

		smart_table.init(options);

		return this;
	}

})(jQuery);
